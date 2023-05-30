<script>
	import { onMount, onDestroy } from 'svelte';
	import { collection, onSnapshot } from 'firebase/firestore';
	import { Peer } from 'peerjs';
	import { players, nickName } from '$lib/store.js';
	import { db } from '$lib/firebase.js';

	export let data;
	let settings = data.settings;
	let id = data.id;
	let unsubscribe;
	let playersRef = collection(db, 'games', id, 'players');

	let peer = new Peer(undefined, {
		secure: true,
		config: {
			iceServers: [
				{ url: 'stun:stun1.l.google.com:19302' },
				{ url: 'turn:numb.viagenie.ca', credential: 'muazkh', username: 'webrtc@live.com' }
			]
		}
	});

	let remoteVideos;

	onMount(() => {
		peer.on('open', (id) => {
			// code to handle when the connection is open
		});

		peer.on('call', (call) => {
			// code to handle when a call is received
		});

		unsubscribe = onSnapshot(playersRef, (snapshot) => {
			players.set(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
		});
	});

	onDestroy(() => {
		if (unsubscribe) {
			unsubscribe();
		}
	});

	let myVideoStream;
	navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
		myVideoStream = stream;
		const myVideo = document.getElementById('my-video');
		addVideoStream(myVideo, stream);

		peer.on('call', (call) => {
			call.answer(stream);
			const video = document.createElement('video');
			call.on('stream', (userVideoStream) => {
				addVideoStream(video, userVideoStream);
			});
		});

		// code to call peers goes here
	});

	function addVideoStream(video, stream) {
		video.srcObject = stream;
		video.addEventListener('loadedmetadata', () => {
			video.play();
		});
		remoteVideos.append(video);
	}

	console.log(settings, nickName);
</script>

<h1>Game</h1>
<div id="video-container">
	{#each $players as player (player.id)}
		<div>{player.nickName}</div>
	{/each}
</div>
<video id="my-video" playsinline autoplay />
<div id="remote-videos" bind:this={remoteVideos} />

<style>
	video {
		width: 300px;
		height: 300px;
		object-fit: cover;
	}
	#video-container {
		width: 300px;
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		grid-template-rows: repeat(2, 1fr);
		gap: 10px;
	}
</style>