<script>
	import { onMount, onDestroy } from 'svelte';
	import { addDoc, setDoc, getDoc, updateDoc, collection, onSnapshot, doc } from 'firebase/firestore';
	import { players, player } from '$lib/stores.js';
	import { db } from '$lib/firebase.js';
	import VideoPlayer from '$lib/components/VideoPlayer.svelte';

	export let data;
	let pcs = {};

	let playersRef = collection(db, 'games', data.id, 'players');

	let unsubscribe;

	const SERVERS = {
		iceServers: [
			{
				urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302']
			}
		],
		iceCandidatePoolSize: 10
	};

	async function call(localStream, calleeId) {
		console.log('calling...');
		// add call to collection calls in caller document
		const callDoc = doc(playersRef, $player.id, 'calls', calleeId);
		const offerCandidates = collection(callDoc, 'offerCandidates');
		const answerCandidates = collection(callDoc, 'answerCandidates');

		const pc = new RTCPeerConnection(SERVERS);
		localStream.getTracks().forEach((track) => {
			pc.addTrack(track, localStream);
		});

		let remoteStream = new MediaStream();
		pc.ontrack = (event) => {
			event.streams[0].getTracks().forEach((track) => {
				remoteStream.addTrack(track);
			});
		};

		// Get candidates for caller, save to db
		pc.onicecandidate = (event) => {
			event.candidate && addDoc(offerCandidates, event.candidate.toJSON());
		};

		// Create offer
		const offerDescription = await pc.createOffer();
		await pc.setLocalDescription(offerDescription);

		const offer = {
			sdp: offerDescription.sdp,
			type: offerDescription.type
		};

		await setDoc(callDoc, { offer });

		// Listen for remote answer
		onSnapshot(callDoc, (snapshot) => {
			const data = snapshot.data();
			if (!pc.currentRemoteDescription && data?.answer) {
				const answerDescription = new RTCSessionDescription(data.answer);
				pc.setRemoteDescription(answerDescription);
			}
		});

		// Listen for remote ICE candidates
		onSnapshot(answerCandidates, (snapshot) => {
			snapshot.docChanges().forEach((change) => {
				if (change.type === 'added') {
					const candidate = new RTCIceCandidate(change.doc.data());
					pc.addIceCandidate(candidate);
				}
			});
		});

		return remoteStream;
	}

	async function answer(localStream, callerId) {
		console.log('answering...');
		// get call doc and answer/offer collections with callerId
		const callDoc = doc(playersRef, callerId, 'calls', $player.id);
		const offerCandidates = collection(callDoc, 'offerCandidates');
		const answerCandidates = collection(callDoc, 'answerCandidates');

		const pc = new RTCPeerConnection(SERVERS);
		localStream.getTracks().forEach((track) => {
			pc.addTrack(track, localStream);
		});

		let remoteStream = new MediaStream();
		pc.ontrack = (event) => {
			event.streams[0].getTracks().forEach((track) => {
				remoteStream.addTrack(track);
			});
		};

		pc.onicecandidate = (event) => {
			event.candidate && addDoc(answerCandidates, event.candidate.toJSON());
		};

		// Fetch data, then set the offer & answer
		const callData = (await getDoc(callDoc)).data();

		const offerDescription = callData.offer;
		await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

		const answerDescription = await pc.createAnswer();
		await pc.setLocalDescription(answerDescription);

		const answer = {
			type: answerDescription.type,
			sdp: answerDescription.sdp
		};

		await updateDoc(callDoc, { answer });

		// Listen to offer candidates
		onSnapshot(offerCandidates, (snapshot) => {
			snapshot.docChanges().forEach((change) => {
				console.log(change);
				if (change.type === 'added') {
					let data = change.doc.data();
					pc.addIceCandidate(new RTCIceCandidate(data));
				}
			});
		});

		return remoteStream;
	}

	onMount(async () => {
		let initialized = false;
		const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

		unsubscribe = onSnapshot(playersRef, (snapshot) => {
			snapshot.docChanges().forEach(async (change) => {
				if (change.type === 'added') {
					if (!initialized) {
						let stream =
							change.doc.id === $player.id ? localStream : await answer(localStream, change.doc.id);
						players.update((currentPlayers) => {
							return { ...currentPlayers, [change.doc.id]: { ...change.doc.data(), stream } };
						});
					} else {
						let stream = await call(localStream, change.doc.id);
						players.update((currentPlayers) => {
							return { ...currentPlayers, [change.doc.id]: { ...change.doc.data(), stream } };
						});
					}
				}
			});
			initialized = true;
			console.log($players);
		});
	});

	onDestroy(() => {
		if (unsubscribe) {
			unsubscribe();
		}
	});
</script>

<h1>Game</h1>
<div id="videoContainer">
	{#each Object.entries($players) as [id, player]}
		<VideoPlayer name={player.name} stream={player.stream} />
	{/each}
</div>

<style>
	#videoContainer {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		grid-template-rows: repeat(2, 1fr);
		gap: 10px; /* adjust this to add space between videos */
	}
</style>
