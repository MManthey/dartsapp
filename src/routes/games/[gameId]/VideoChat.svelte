<script lang="ts">
	import { userID } from '$lib/stores';
	import VideoPlayer from './VideoPlayer.svelte';

	export let players: Map<string, Player>;
</script>

<div class="grid grid-cols-2 gap-4">
	{#each [...players] as [id, player]}
		<VideoPlayer label={player.data.name} stream={player.stream} muted={id === $userID} />
	{/each}
</div>
