<script>
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import {
		doc,
		addDoc,
		setDoc,
		getDoc,
		updateDoc,
		deleteDoc,
		collection,
		getCountFromServer,
		onSnapshot
	} from 'firebase/firestore';
	import { player } from '$lib/stores.js';
	import { db } from '$lib/firebase.js';
	import VideoPlayer from '$lib/components/VideoPlayer.svelte';

	export let data;

	const servers = {
		iceServers: [
			{
				urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302']
			}
		],
		iceCandidatePoolSize: 10
	};
	const gameDoc = doc(db, 'games', data.id);
	const playersColl = collection(gameDoc, 'players');
	const playerDoc = doc(playersColl, $player.id);

	let localStream;
	let unsubscribe;
	let videoEnabled = true;
	let audioEnabled = true;
	let players = {};

	/**
	 * Enables/Disables the camera.
	 */
	function toggleVideo() {
		videoEnabled = !videoEnabled;
		if (localStream) {
			localStream.getVideoTracks().forEach((track) => {
				track.enabled = videoEnabled;
			});
		}
	}

	/**
	 * Enables/Disabled the microphone.
	 */
	function toggleAudio() {
		audioEnabled = !audioEnabled;
		if (localStream) {
			localStream.getAudioTracks().forEach((track) => {
				track.enabled = audioEnabled;
			});
		}
	}

	/**
	 * Redirects to the homescreen.
	 */
	async function leaveGame() {
		goto('/');
	}

	/**
	 *
	 * @param calleeId
	 */
	async function call(calleeId) {
		console.log(`Calling ${calleeId}...`);
		const callDoc = doc(playerDoc, 'calls', calleeId);
		const offerCandidates = collection(callDoc, 'offerCandidates');
		const answerCandidates = collection(callDoc, 'answerCandidates');

		const peer = {
			stream: new MediaStream(),
			connection: new RTCPeerConnection(servers),
			subscriptions: []
		};

		localStream.getTracks().forEach((track) => {
			peer.connection.addTrack(track, localStream);
		});

		peer.connection.ontrack = (event) => {
			event.streams[0].getTracks().forEach((track) => {
				peer.stream.addTrack(track);
			});
		};

		peer.connection.onicecandidate = (event) => {
			event.candidate && addDoc(offerCandidates, event.candidate.toJSON());
		};

		const offerDescription = await peer.connection.createOffer();
		await peer.connection.setLocalDescription(offerDescription);
		const offer = {
			sdp: offerDescription.sdp,
			type: offerDescription.type
		};
		await setDoc(callDoc, { offer });

		peer.subscriptions.push(
			onSnapshot(callDoc, (snapshot) => {
				const data = snapshot.data();
				if (!peer.connection.currentRemoteDescription && data?.answer) {
					const answerDescription = new RTCSessionDescription(data.answer);
					peer.connection.setRemoteDescription(answerDescription);
				}
			})
		);

		peer.subscriptions.push(
			onSnapshot(answerCandidates, (snapshot) => {
				snapshot.docChanges().forEach((change) => {
					if (change.type === 'added') {
						const candidate = new RTCIceCandidate(change.doc.data());
						peer.connection.addIceCandidate(candidate);
					}
				});
			})
		);

		return peer;
	}

	/**
	 *
	 * @param callerId
	 */
	async function answer(callerId) {
		console.log(`Answeing ${callerId}...`);
		const callDoc = doc(playersColl, callerId, 'calls', $player.id);
		const offerCandidates = collection(callDoc, 'offerCandidates');
		const answerCandidates = collection(callDoc, 'answerCandidates');

		const peer = {
			stream: new MediaStream(),
			connection: new RTCPeerConnection(servers),
			subscriptions: []
		};

		localStream.getTracks().forEach((track) => {
			peer.connection.addTrack(track, localStream);
		});

		peer.connection.ontrack = (event) => {
			event.streams[0].getTracks().forEach((track) => {
				peer.stream.addTrack(track);
			});
		};

		peer.connection.onicecandidate = (event) => {
			event.candidate && addDoc(answerCandidates, event.candidate.toJSON());
		};

		const callData = (await getDoc(callDoc)).data();

		const offerDescription = callData.offer;
		await peer.connection.setRemoteDescription(new RTCSessionDescription(offerDescription));

		const answerDescription = await peer.connection.createAnswer();
		await peer.connection.setLocalDescription(answerDescription);

		const answer = {
			type: answerDescription.type,
			sdp: answerDescription.sdp
		};

		await updateDoc(callDoc, { answer });

		// Listen to offer candidates
		peer.subscriptions.push(
			onSnapshot(offerCandidates, (snapshot) => {
				snapshot.docChanges().forEach((change) => {
					//console.log(change);
					if (change.type === 'added') {
						let data = change.doc.data();
						peer.connection.addIceCandidate(new RTCIceCandidate(data));
					}
				});
			})
		);

		return peer;
	}

	onMount(async () => {
		let initialized = false;
		localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

		unsubscribe = onSnapshot(playersColl, (snapshot) => {
			snapshot.docChanges().forEach(async (change) => {
				const id = change.doc.id;
				if (change.type === 'added') {
					players[id] = {
						...change.doc.data(),
						peer:
							id === $player.id
								? { stream: localStream, connection: null, subscriptions: [] }
								: await (initialized ? call(id) : answer(id))
					};
				} else if (change.type === 'removed') {
					console.log(`Disconnecting from ${id}`);
					const peer = players[id].peer;
					peer.stream.getTracks().forEach((track) => track.stop());
					peer.stream = null;
					peer.connection?.close();
					peer.connection = null;
					peer.subscriptions?.forEach((unsubscribe) => unsubscribe());
					delete players[id];
					players = {...players};

					const callDoc = doc(playerDoc, 'calls', id);
					const offerCandidatesColl = collection(callDoc, 'offerCandidates');
					const answerCandidatesColl = collection(callDoc, 'answerCandidates');
					await deleteDoc(callDoc);
				}
			});
			initialized = true;
			console.log(players);
		});
	});

	onDestroy(async () => {
		console.log('Destroying game page component...');

		unsubscribe();

		Object.values(players).forEach((player) => {
			const peer = player.peer;
			peer.stream.getTracks().forEach((track) => track.stop());
			peer.stream = null;
			peer.connection?.close();
			peer.connection = null;
			peer.subscriptions?.forEach((unsubscribe) => unsubscribe());
		});

		// delete player doc from game
		await deleteDoc(playerDoc);

		// delete game doc if game is empty
		const snapshot = await getCountFromServer(playersColl);
		const playerCount = snapshot.data().count;
		if (playerCount === 0) {
			await deleteDoc(gameDoc);
		}
	});
</script>

<h1>Game</h1>
<div id="videoContainer">
	{#each Object.values(players) as player}
		<VideoPlayer p={player} />
	{/each}
</div>
<div id="buttons">
	<button on:click={toggleVideo}>Toggle Video</button>
	<button on:click={toggleAudio}>Toggle Audio</button>
	<button on:click={leaveGame}>Leave Game</button>
</div>

<style>
	#videoContainer {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		grid-template-rows: repeat(2, 1fr);
		gap: 10px; /* adjust this to add space between videos */
	}
	#buttons {
		margin-top: 20px;
	}
</style>
