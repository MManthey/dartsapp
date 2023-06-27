<script>
	import { goto } from '$app/navigation';
	import { gameID } from '$lib/stores.js';
	import { signIn, createGame, joinGame } from '$lib/firebase.js';

	let playerCap = 1;
	let isOnline = false;
	let gameMode = '501';
	let outMode = 'double';

	async function handleJoinBtn() {
		try {
			const settings = { playerCap, isOnline, gameMode, outMode};
			await signIn();
			await createGame(settings);
			await joinGame();
			goto('/games/' + $gameID);
		} catch (error) {
			console.error(error);
			alert(error.message);
		}
	}
</script>

<h1>Create Game</h1>
<div id="player-range">
	<label for="playerCap">Players: {playerCap}</label>
	<input type="range" id="playerCap" min="1" max="4" bind:value={playerCap} />
</div>
{#if playerCap > 1}
	<div id="online-checkbox">
		<input type="checkbox" id="online" name="online" bind:checked={isOnline} />
		<label for="online">Online Game</label>
	</div>
{/if}
<select name="game-mode" bind:value={gameMode}>
	<option value="501">501</option>
	<option value="301">301</option>
</select>
{#if gameMode === '501' || gameMode === '301'}
	<select name="out-mode" bind:value={outMode}>
		<option value="double">Double Out</option>
		<option value="single">Single Out</option>
	</select>
{/if}
<button type="button" on:click={handleJoinBtn}>Join Game</button>

<style>
	#player-range {
		display: flex;
		flex-direction: column;
		align-items: start;
	}
	input:not([type="checkbox"]),
	#online-checkbox,
	select,
	button {
		min-width: 160px;
	}
</style>
