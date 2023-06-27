<script>
	import { onMount, onDestroy } from 'svelte';
	import { userID, userName, gameID } from '$lib/stores.js';
	import { onSnapshot, collection } from 'firebase/firestore';
	import { playersCollRef, callDocRef, uploadCandidate, updateCallDoc, leaveGame } from '$lib/firebase.js';
	import VideoPlayer from '$lib/components/VideoPlayer.svelte';

	const servers = {
		iceServers: [
			{
				urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302']
				// turn server ???
			}
		],
		iceCandidatePoolSize: 10
	};

	let localStream = new MediaStream();
	let unsubscribe;
	let camOn = false;
	let micOn = false;
	let players = {};

	async function toggleCam() {
		camOn = !camOn;

		if (camOn) {
			console.log(`${$userName}: turning ON camera`);
			const camStream = await navigator.mediaDevices.getUserMedia({ video: true });
			camStream.getVideoTracks().forEach((track) => {
				localStream.addTrack(track);
				Object.values(players).forEach(({ name, pc }) => {
					console.log(`${$userName} -> ${name}: +${track.kind}`);
					pc.addTrack(track);
				});
			});
			localStream = localStream;
		} else {
			console.log(`${$userName}: turning OFF camera`);
			localStream.getVideoTracks().forEach((track) => {
				track.stop();
				localStream.removeTrack(track);
				Object.values(players).forEach(({ name, pc }) => {
					console.log(`${$userName} -> ${name}: -${track.kind}`);
					let sender = pc.getSenders().find((s) => s.track === track);
					sender && pc.removeTrack(sender);
				});
			});
			localStream = localStream;
		}
	}

	async function toggleMic() {
		micOn = !micOn;

		if (micOn) {
			console.log(`${$userName}: turning ON microphone`);
			const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
			micStream.getAudioTracks().forEach((track) => {
				localStream.addTrack(track);
				Object.values(players).forEach(({ name, pc }) => {
					console.log(`${$userName} -> ${name}: +${track.kind}`);
					pc.addTrack(track);
				});
			});
		} else {
			console.log(`${$userName}: turning OFF microphone`);
			localStream.getAudioTracks().forEach((track) => {
				track.stop();
				localStream.removeTrack(track);
				Object.values(players).forEach(({ name, pc }) => {
					console.log(`${$userName} -> ${name}: -${track.kind}`);
					let sender = pc.getSenders().find((s) => s.track === track);
					sender && pc.removeTrack(sender);
				});
			});
		}
	}

	function disconnect({ pc, stream, subs, name }) {
		console.log(`${$userName} - ${name}: closing connection`);
		pc?.close();
		pc = null;
		stream?.getTracks().forEach((track) => track.stop());
		stream = null;
		subs?.forEach((unsubscribe) => unsubscribe());
	}

	async function setupConnection(playerID, callID) {
		const con = `${$userName} - ${players[playerID].name}`;
		console.log(`${con}: setup `);

		const callRef = callDocRef(callID);

		const pc = new RTCPeerConnection(servers);
		const stream = new MediaStream();
		const subs = [];

		// add any initial tracks to the pc
		localStream.getTracks().forEach((track) => {
			pc.addTrack(track);
		});

		// pc.onsignalingstatechange = () => {
		// 	console.log(`${con}: signaling state is ${pc.signalingState}`);
		// };

		// pc.oniceconnectionstatechange = () => {
		// 	console.log(`${con}: ICE connection state is ${pc.iceConnectionState}`);
		// };

		// pc.onicegatheringstatechange = () => {
		// 	console.log(`${con}: ICE gathering state is ${pc.iceGatheringState}`);
		// };

		pc.onicecandidate = async ({ candidate }) => {
			console.log(`${$userName} -> Server: +candidate`);
			candidate && (await uploadCandidate(callID, candidate.toJSON()));
		};

		// pc.onconnectionstatechange = () => {
		// 	console.log(`${con}: connection state is ${pc.connectionState}`);
		// };

		pc.onnegotiationneeded = async () => {
			console.log(`${con}: negotiation needed`);

			// create offer description and set local description
			const offerDescription = await pc.createOffer();
			console.log(`${con}: setting local description`);
			await pc.setLocalDescription(offerDescription);

			// create offer object and upload to server
			const offer = {
				sdp: offerDescription.sdp,
				type: offerDescription.type
			};
			console.log(`${$userName} -> Server: +offer`);
			// await uploadOffer(callID, offer);
			await updateCallDoc(callID, { offer, sender: $userID, state: 'offered' });
		};

		pc.ontrack = ({ track }) => {
			console.log(`${$userName} <- ${players[playerID].name}: +${track.kind}`);
			track.onmute = () => {
				console.log(`${$userName} <- ${players[playerID].name}: -${track.kind}`);
				stream.removeTrack(track);
				players[playerID].stream = stream;
			};
			stream.addTrack(track);
			players[playerID].stream = stream;
		};

		subs.push(
			onSnapshot(collection(callRef, playerID), (snapshot) => {
				console.log('change to condidate collection');
				snapshot.docChanges().forEach((change) => {
					if (change.type === 'added') {
						console.log(`${$userName} <- Server: +candidate`);
						const candidate = new RTCIceCandidate(change.doc.data());
						pc.remoteDescription && pc.addIceCandidate(candidate);
					}
				});
			})
		);

		subs.push(
			onSnapshot(callRef, async (snapshot) => {
				console.log('change to call document');
				const data = snapshot.data();

				if (!data || data.sender === $userID) return;

				if (data.state === 'offered') {
					console.log(`${$userName} <- Server: +offer`);

					// set remote description with incoming offer
					await pc.setRemoteDescription(new RTCSessionDescription(data.offer));

					// create answer from offer and set local description
					const answerDescription = await pc.createAnswer();
					await pc.setLocalDescription(answerDescription);

					// create answer and push it to the signaling server
					const answer = {
						type: answerDescription.type,
						sdp: answerDescription.sdp
					};
					await updateCallDoc(callID, { answer, sender: $userID, state: 'answered' })
				} else if (data.state === 'answered') {
					console.log(`${$userName} <- Server: +answer`);
					pc.setRemoteDescription(new RTCSessionDescription(data.answer));
					await updateCallDoc(callID, { state: 'exchanged' })
				}
			})
		);

		players[playerID].pc = pc;
		players[playerID].stream = stream;
		players[playerID].subs = subs;
	}

	onMount(async () => {
		let joined = false;

		unsubscribe = onSnapshot(playersCollRef(), (snapshot) => {
			snapshot.docChanges().forEach(async (change) => {
				const playerID = change.doc.id;
				if (playerID !== $userID) {
					if (change.type === 'added') {
						players[playerID] = {
							...change.doc.data()
						};
						const callID = joined ? playerID + $userID : $userID + playerID;
						setupConnection(playerID, callID);
					} else if (change.type === 'removed') {
						disconnect(players[playerID]);
						delete players[playerID];
						players = { ...players };
						//hangUp($gameID, $userID, id);
					}
				}
			});
			joined = true;
		});

		console.log('Gamepage mounted...');
	});

	onDestroy(async () => {
		localStream?.getTracks().forEach((track) => track.stop());
		localStream = null;
		unsubscribe();
		Object.values(players).forEach((player) => {
			disconnect(player);
		});
		leaveGame($gameID, $userID);
		console.log('Gamepage destroyed...');
	});
</script>

<h1>Game</h1>
<div id="videoChat">
	{#each Object.values(players) as player}
		<VideoPlayer label={player.name} stream={player.stream} muted={false} />
	{/each}
	<VideoPlayer label={$userName} stream={localStream} muted={true} />
</div>
<div id="scoreboard">
	<table>
		<thead>
			<tr>
				<th>Player</th>
				<th>Remaining</th>
				<th>Average</th>
			</tr>
		</thead>
		<tbody>
			{#each Object.values(players) as player}
				<tr>
					<td>{player.name}</td>
					<td>{player.remaining || '501'}</td>
					<td>{player.avg || '0.00'}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
<div id="buttons">
	<button on:click={toggleCam}>Cam {camOn ? 'OFF' : 'ON'}</button>
	<button on:click={toggleMic}>Mic {micOn ? 'OFF' : 'ON'}</button>
	<a href="/"><button>Leave Game</button></a>
</div>

<style>
	#videoChat {
		display: flex;
		flex-wrap: wrap;
		gap: 20px;
	}
	#buttons {
		display: flex;
		flex-direction: column;
		gap: 20px;
		margin-top: 20px;
	}
	button {
		min-width: 160px;
	}
</style>
