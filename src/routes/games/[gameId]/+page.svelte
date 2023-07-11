<script lang="ts">
	import ScoreInput from './ScoreInput.svelte';
	import Scoreboard from './Scoreboard.svelte';
	import VideoChat from './VideoChat.svelte';


	import { onMount, onDestroy } from 'svelte';
	import { userID, gameID } from '$lib/stores';
	import { onSnapshot, collection } from 'firebase/firestore';
	import {
		getGameDocRef,
		getPlayersCollRef,
		getCallDocRef,
		addCandidate,
		updateCall,
		leaveGame,
		updateGame,
		updatePlayerData
	} from '$lib/firebase';
	import { CameraIcon, CameraOffIcon, MicIcon, MicOffIcon, LogOutIcon } from 'svelte-feather-icons';
	import { Modal, modalStore } from '@skeletonlabs/skeleton';
	import type { ModalSettings } from '@skeletonlabs/skeleton';

	const servers = {
		iceServers: [
			{
				urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302']
				// turn server ??? -> https://www.metered.ca/tools/openrelay/
			}
		],
		iceCandidatePoolSize: 10
	};
	const subscriptions: (() => void)[] = [];

	let camOn = false;
	let micOn = false;
	let localStream = new MediaStream();

	let players: Map<string, Player> = new Map();
	let peers: Map<string, Peer> = new Map();
	let game: Game;

	async function toggleCam() {
		camOn = !camOn;

		if (camOn) {
			const camStream = await navigator.mediaDevices.getUserMedia({ video: true });
			camStream.getVideoTracks().forEach((track) => {
				localStream.addTrack(track);
				for (let { pc } of peers.values()) {
					pc.addTrack(track);
				}
			});
		} else {
			localStream.getVideoTracks().forEach((track) => {
				track.stop();
				localStream.removeTrack(track);
				for (let { pc } of peers.values()) {
					let sender = pc.getSenders().find((s) => s.track === track);
					sender && pc.removeTrack(sender);
				}
			});
		}
		players = players; // rerender
	}

	async function toggleMic() {
		micOn = !micOn;

		if (micOn) {
			const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
			micStream.getAudioTracks().forEach((track) => {
				localStream.addTrack(track);
				for (let { pc } of peers.values()) {
					pc.addTrack(track);
				}
			});
		} else {
			localStream.getAudioTracks().forEach((track) => {
				track.stop();
				localStream.removeTrack(track);
				for (let { pc } of peers.values()) {
					let sender = pc.getSenders().find((s) => s.track === track);
					sender && pc.removeTrack(sender);
				}
			});
		}
	}

	async function setupConnection(playerID: string, callID: string) {
		const pc: RTCPeerConnection = new RTCPeerConnection(servers);
		const subs: (() => void)[] = [];
		const callDocRef = getCallDocRef(callID);

		// add any initial tracks to the pc
		localStream.getTracks().forEach((track) => {
			pc.addTrack(track);
		});

		// listen to new local candidates -> upload them to the server
		pc.onicecandidate = async ({ candidate }) => {
			candidate && (await addCandidate(callID, candidate));
		};

		// initiate new negotiation if needed
		pc.onnegotiationneeded = async () => {
			// create offer description and set local description
			const offerDescription = await pc.createOffer();
			await pc.setLocalDescription(offerDescription);

			// create offer object and upload to server
			const offer = {
				sdp: offerDescription.sdp,
				type: offerDescription.type
			};
			await updateCall(callID, { offer, sender: $userID, state: 'offered' });
		};

		// listen for remote tracks being added
		pc.ontrack = ({ track }) => {
			const stream = players.get(playerID)?.stream;
			if (stream) {
				track.onmute = () => {
					stream.removeTrack(track);
					players = players; // rerender
				};
				stream.addTrack(track);
				players = players; // rerender
			}
		};

		// listen for new remote candidates being added
		subs.push(
			onSnapshot(collection(callDocRef, playerID), (snapshot) => {
				snapshot.docChanges().forEach((change) => {
					if (change.type === 'added') {
						const candidate = new RTCIceCandidate(change.doc.data());
						pc.remoteDescription && pc.addIceCandidate(candidate);
					}
				});
			})
		);

		// listen for changes to the call document
		subs.push(
			onSnapshot(callDocRef, async (snapshot) => {
				const data = snapshot.data();

				if (!data || data.sender === $userID) return;

				if (data.state === 'offered') {
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
					await updateCall(callID, { answer, sender: $userID, state: 'answered' });
				} else if (data.state === 'answered') {
					pc.setRemoteDescription(new RTCSessionDescription(data.answer));
					await updateCall(callID, { sender: $userID, state: 'exchanged' });
				}
			})
		);

		return { pc, subs };
	}

	function getNextPlayerID() {
		if (game.size < 2) {
			throw new Error('getNextPlayerID: game.size < 2');
		}
		const playerIDs = Array.from(players.keys());
		const userIdx = playerIDs.indexOf($userID);

		if (userIdx === -1) {
			throw new Error('getNextPlayerID: userIdx === -1');
		}

		const idx = userIdx === playerIDs.length - 1 ? 0 : userIdx + 1;
		return playerIDs[idx];
	}

	function endTurn(event: CustomEvent<Dart[]>) {
		const darts = event.detail;
		const playerData = players.get($userID)?.data;

		if (!playerData) return;

		let points = darts.reduce((total, dart) => {
			return total + (dart.s || 0) * dart.x;
		}, 0);

		const doubles = darts.filter((darts) => darts.s !== 0 && darts.x === 2);

		const overShot = points > playerData.remaining;
		const pointsFit = points === playerData.remaining;
		const brokeDoubles = pointsFit && game.outMode === 'double' && !doubles.pop();

		points = overShot || brokeDoubles ? 0 : points;

		const remaining = playerData.remaining - points;
		const scores = playerData.scores ? [...playerData.scores, points] : [points];
		const avg = scores.reduce((a, b) => a + b, 0) / scores.length;

		updatePlayerData({ ...playerData, remaining, scores, avg });

		const gameOver = remaining === 0;

		const turn = gameOver || game.size === 1 ? $userID : getNextPlayerID();
		const state = gameOver ? 'over' : game.state;

		updateGame({ ...game, turn, state });
	}

	onMount(async () => {
		let initialized = false;

		subscriptions.push(
			onSnapshot(getGameDocRef(), (snapshot) => {
				game = snapshot.data() as Game;

				if (game?.state === 'over') {
					const modal: ModalSettings = {
						type: 'alert',
						// Data
						title: 'We have a winner!',
						body: `Congratulations to ${players.get(game.turn)?.data.name}!`
						// image: 'https://i.imgur.com/WOgTG96.gif'
					};
					modalStore.trigger(modal);
				}
			})
		);

		subscriptions.push(
			onSnapshot(getPlayersCollRef(), (snapshot) => {
				snapshot.docChanges().forEach(async (change) => {
					const playerID = change.doc.id;
					const data = change.doc.data() as PlayerData;
					const isUser = playerID === $userID;
					if (change.type === 'added') {
						players = players.set(playerID, {
							data,
							stream: isUser ? localStream : new MediaStream()
						}); // rerender

						if (!isUser) {
							const callID = initialized ? playerID + $userID : $userID + playerID;
							peers.set(playerID, await setupConnection(playerID, callID));
						}

						if (players.size === game.size) {
							updateGame({ ...game, state: 'playing', turn: Array.from(players.keys())[0] });
						}
					} else if (change.type === 'modified') {
						const stream = players.get(playerID)?.stream;
						if (stream) {
							players = players.set(playerID, { data, stream }); // rerender
						}
					} else if (!isUser && change.type === 'removed') {
						const peer = peers.get(playerID);
						const player = players.get(playerID);
						if (peer && player) {
							let { pc, subs } = peer;
							let { stream } = player;

							pc.close();
							subs.forEach((unsubscribe) => unsubscribe());

							stream.getTracks().forEach((track: MediaStreamTrack) => {
								track.stop();
								stream.removeTrack(track);
							});

							peers.delete(playerID);
							players.delete(playerID);
							players = players; // rerender
						}
					}
				});
				initialized = true;
			})
		);
	});

	onDestroy(async () => {
		if (game?.state === 'playing' && game.turn === $userID && game.size > 1) {
			const turn = getNextPlayerID();
			updateGame({ ...game, turn });
		}

		for (let { stream } of players.values()) {
			stream.getTracks().forEach((track) => {
				track.stop();
				stream.removeTrack(track);
			});
		}

		subscriptions.forEach((unsubscribe) => unsubscribe());

		for (let { pc, subs } of peers.values()) {
			pc.close();
			subs.forEach((unsubscribe) => unsubscribe());
		}

		leaveGame($gameID, $userID);
	});
</script>

<div class="flex flex-col gap-12 items-center">
	{#if game?.state === 'waiting'}
		<h3 class="h3 font-bold mb-12">#{game.shortId}</h3>
	{/if}
	<VideoChat {players} />
	<Scoreboard {game} {players} />
	{#if game?.state === 'playing' && game.turn === $userID}
		<ScoreInput
			on:scoreInput={endTurn}
			outMode={game.outMode}
			remaining={players.get($userID)?.data.remaining || Number(game.outMode)}
		/>
	{/if}
	<div class="flex flex-row justify-center gap-5">
		<button
			class="btn-icon btn-icon-xl {camOn ? 'variant-filled-error' : 'variant-filled'}"
			type="button"
			on:click={toggleCam}
		>
			{#if camOn}<CameraOffIcon /> {:else} <CameraIcon />{/if}
		</button>
		<button
			class="btn-icon btn-icon-xl {micOn ? 'variant-filled-error' : 'variant-filled'}"
			type="button"
			on:click={toggleMic}
		>
			{#if micOn}<MicOffIcon /> {:else} <MicIcon />{/if}
		</button>
		<a class="btn-icon btn-icon-xl variant-filled-error" href="/"><button><LogOutIcon /></button></a
		>
	</div>
</div>
<Modal />
