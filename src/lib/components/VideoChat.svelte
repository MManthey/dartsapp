<script>
	import { onDestroy, onMount } from 'svelte/types/runtime/internal/lifecycle';

    let chatters = {};
    let localStream = null;
    let unsubscribe =  null;

	onMount(() => {
		console.log('VideoChat mounted.');
        
	});

	onDestroy(() => {
		console.log('VideoChat destroyed.');
	});
</script>

<div id="videoChat">
    {#each Object.values(chatters) as chatter}
		<VideoPlayer label={chatter.name} stream={chatter.peer.stream} muted={false} />
	{/each}
	<VideoPlayer label={$userName} stream={localStream} muted={true} />
</div>

<style>
	#videoChat {
	}
</style>
