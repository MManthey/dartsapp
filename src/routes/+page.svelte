<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { nickName } from '$lib/stores.js';
	import { createPlayer } from '$lib/firebase.js';

	let code = '';

	onMount(async () => {
		try {
			await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
		} catch (error) {
			// TODO: Communicate to user that videochat wont work within games
			console.error('Permissions not granted', error);
		}
	});

	async function joinGame() {
		try {
			await createPlayer(code, $nickName);
			goto(`/games/${code}`);
		} catch (error) {
			// TODO: Display the error to the suer
			console.error(error);
		}
	}

	function createGame() {
		goto('/createGame');
	}
</script>

<div id="logo">
	<img src="/darts.png" alt="dartsapp logo" />
	<h1>dartsapp</h1>
</div>
<input type="text" placeholder="Enter a Nickname" bind:value={$nickName} />
<input type="text" placeholder="Enter a Gamecode" bind:value={code} />
<button type="button" disabled={!$nickName || !code} on:click={joinGame}>Join Game</button>
<button type="button" disabled={!$nickName} on:click={createGame}>Create Game</button>

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
