<script>
	export let label;
	export let stream;
	export let muted;

	let videoElement;

	$: {
		if (videoElement) {
			videoElement.srcObject = stream?.getVideoTracks().length ? stream : null;
		}
	}
</script>

<div class="video-container">
	<video autoplay playsinline bind:this={videoElement} {muted} />
	<div class="label">{label}</div>
</div>

<style>
	.video-container {
		position: relative;
		width: 280px;
		height: 280px;
		background-color: violet;
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
