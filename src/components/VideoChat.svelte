<script lang="ts">
	import { userID } from '$lib/stores';
	import VideoPlayer from './VideoPlayer.svelte';
	import { ProgressRadial } from '@skeletonlabs/skeleton';

	export let players: Player[];
	export let size: number | undefined;

	let missing: number[] = [];

	$: if (size) {
		missing = Array(size - players.length);
	}
</script>

<div class="grid grid-cols-2 gap-4">
	{#each [...players] as {id, name, stream}}
	<VideoPlayer {name} {stream} muted={id === $userID} />
	{/each}
	{#each missing as miss}
		<div class="flex items-center justify-center"><ProgressRadial /></div>
	{/each}
</div>
