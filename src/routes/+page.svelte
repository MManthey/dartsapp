<script>
	import { goto } from '$app/navigation';
	import { player } from '$lib/stores.js';
	import { createPlayer } from '$lib/firebase.js';

	let code = '';
	let name = '';

	async function joinGame() {
		try {
			const playerRef = await createPlayer(code, name);
			player.set({ id: playerRef.id, name });
			goto(`/games/${code}`);
		} catch (error) {
			// TODO: Display the error to the suer
			console.error(error);
		}
	}

	function createGame() {
		player.set({ name });
		goto('/createGame');
	}
</script>

<div id="logo">
	<img src="/darts.png" alt="dartsapp logo" />
	<h1>dartsapp</h1>
</div>
<input type="text" placeholder="Enter a Nickname" bind:value={name} />
<input type="text" placeholder="Enter a Gamecode" bind:value={code} />
<button type="button" disabled={!name || !code} on:click={joinGame}>Join Game</button>
<button type="button" disabled={!name} on:click={createGame}>Create Game</button>

<style>
	#logo {
		display: flex;
		flex-direction: row;
		align-items: center;
	}
	img {
		width: 30px;
	}
	button,
	input {
		margin: 10px 0px;
		width: 100%;
	}
</style>
