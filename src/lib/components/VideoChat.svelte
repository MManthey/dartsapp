<script lang="ts">
	import { userID } from '$lib/stores';
	import VideoPlayer from './VideoPlayer.svelte';

	export let players: Player[];

</script>

<div class="grid grid-cols-2 gap-4">
	{#each [...players] as { id, name, stream }}
		<VideoPlayer {name} {stream} muted={id === $userID} />
	{/each}
</div>
