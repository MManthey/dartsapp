<script>
	import { onMount, onDestroy } from 'svelte';
	import { collection, onSnapshot } from 'firebase/firestore';
	import { players, nickName } from '$lib/stores.js';
	import { db } from '$lib/firebase.js';

	export let data;

	let playersRef = collection(db, 'games', data.id, 'players');
	let unsubscribe;
	let remoteStream = new MediaStream();
	let localVideoElement;
	let remoteVideoElement;

	const servers = {
		iceServers: [
			{
				urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302']
			}
		],
		iceCandidatePoolSize: 10
	};
	const pc = new RTCPeerConnection(servers);

	navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((localStream) => {
		localStream.getTracks().forEach((track) => {
			pc.addTrack(track, localStream);
		});
		localVideoElement.srcObject = localStream;
	});

	pc.ontrack = (event) => {
		event.streams[0].getTracks().forEach((track) => {
			remoteStream.addTrack(track);
		});
	};

	remoteVideoElement.srcObject = remoteStream;

	onMount(() => {
		unsubscribe = onSnapshot(playersRef, (snapshot) => {
			players.set(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
			console.dir(JSON.stringify($players));
		});
	});

	onDestroy(() => {
		if (unsubscribe) {
			unsubscribe();
		}
	});
</script>

<h1>Game</h1>
<div>
	<p>{$nickName}</p>
	<video bind:this={localVideoElement} autoplay playsinline />
</div>
<div>
	<p>Remote Video</p>
	<video bind:this={remoteVideoElement} autoplay playsinline />
</div>

<style>
	video {
		width: 300px;
		height: 300px;
		object-fit: cover;
	}
</style>
