<script>
	import { goto } from '$app/navigation';
	import { userName, gameID } from '$lib/stores.js';
	import { signIn, joinGame } from '$lib/firebase.js';

	async function handleJoinBtn() {
		try {
			await signIn();
			await joinGame();
			goto('/games/' + $gameID);
		} catch (error) {
			console.error(error);
			alert(error);
		}
	}

	function handleCreateBtn() {
		goto('/createGame');
	}
</script>

<div id="logo">
	<img src="/darts.png" alt="dartsapp logo" />
	<h1>dartsapp</h1>
</div>
<input type="text" placeholder="Username" bind:value={$userName} />
<input type="text" placeholder="Game ID" bind:value={$gameID} />
<button type="button" disabled={!$userName || !$gameID} on:click={handleJoinBtn}>Join Game</button>
<button type="button" disabled={!$userName} on:click={handleCreateBtn}>Create Game</button>

<style>
	#logo {
		display: flex;
		flex-direction: row;
		align-items: center;
	}
	img {
		width: 30px;
	}
	button, input {
		min-width: 160px;
	}
</style>
