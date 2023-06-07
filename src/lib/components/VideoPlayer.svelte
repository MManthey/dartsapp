<script>
	import { player } from '$lib/stores.js';
	import { onMount } from 'svelte';

	export let p;

	let videoElement;

	$: {
		if (videoElement && p.peer.stream) {
			videoElement.srcObject = p.peer.stream;
		}
	}
</script>

<div class="video-container">
	<video autoplay playsinline bind:this={videoElement} muted={p.id === $player.id} />
	<div class="label">{p.name}</div>
</div>

<style>
	.video-container {
		position: relative;
		width: 300px;
		height: 300px;
		background-color: #555;
	}
	.label {
		position: absolute;
		bottom: 0;
		right: 0;
		padding: 5px;
		background-color: rgba(0, 0, 0, 0.5);
		color: white;
	}
	video {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
</style>
