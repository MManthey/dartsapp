<script lang="ts">
	import { MicOffIcon } from 'svelte-feather-icons';

	export let label: string;
	export let stream: MediaStream;
	export let muted: boolean;

	let videoElement: any;
	let hasAudio = false;

	$: {
		if (videoElement) {
			videoElement.srcObject = stream;
			hasAudio = stream?.getAudioTracks().length === 0;
		}
	}
</script>

<div class="relative aspect-square rounded-lg overflow-hidden bg-[url('/dummy.png')] bg-cover">
	<video class="h-full w-full object-cover" autoplay playsinline bind:this={videoElement} {muted} />
	<span class="chip variant-filled absolute bottom-3 right-3">
		{label}{#if hasAudio && !muted}<MicOffIcon class="ml-1" size="12" />{/if}
	</span>
</div>
