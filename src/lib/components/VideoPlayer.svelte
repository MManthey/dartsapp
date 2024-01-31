<script lang="ts">
	import { userId } from '$lib/stores';

	export let stream: MediaStream | undefined;
	export let id: string;

	let videoElement: HTMLVideoElement;

	$: {
		if (videoElement) {
			if (stream instanceof MediaStream) {
				videoElement.srcObject = stream;
			} else {
				videoElement.srcObject = null;
			}
		}
	}
</script>

<div class="w-full h-full bg-[url('/dummy.png')] bg-cover">
	<!-- svelte-ignore a11y-media-has-caption -->
	{#if stream}
		<video
			class="h-full w-full object-cover"
			autoplay
			playsinline
			bind:this={videoElement}
			muted={$userId === id}
		/>
	{/if}
</div>
