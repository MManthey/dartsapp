<script>
	import { goto } from '$app/navigation';
	import { nickName } from '$lib/stores.js';
	import { createGame, createPlayer } from '$lib/firebase.js';

	let playerCap = 1;
	let isOnline = false;
	let gameMode = '501';
	let outMode = 'double';

	async function createAndJoinGame() {
		const gameRef = await createGame({playerCap, isOnline, gameMode, outMode});
		const code = gameRef.id;
		try {
			await createPlayer(code, $nickName);
			goto(`/games/${code}`);
		} catch (error) {
			console.error(error);
		}
	}
</script>

<h1>Create Game</h1>
<div class="input range">
	<label for="playerCap">Players: {playerCap}</label>
	<input type="range" id="playerCap" min="1" max="4" bind:value={playerCap} />
</div>
{#if playerCap > 1}
	<div class="input">
		<input type="checkbox" id="online" name="online" bind:checked={isOnline} />
		<label for="online">Online Game</label>
	</div>
{/if}
<select id="game-mode" name="game-mode" bind:value={gameMode}>
	<option value="501">501</option>
	<option value="301">301</option>
	<option value="Cricket">Cricket</option>
	<option value="Round the Clock">Round the Clock</option>
</select>
{#if gameMode === '501' || gameMode === '301'}
	<select id="out-mode" name="out-mode" bind:value={outMode}>
		<option value="double">Double Out</option>
		<option value="single">Single Out</option>
	</select>
{/if}
<button type="button" on:click={createAndJoinGame}>Join Game</button>

<style>
	.range {
		display: flex;
		flex-direction: column;
		align-items: start;
	}

	input[type='range'] {
		width: 100%;
	}

	.input, select, button {
		margin: 10px 0px;
		width: 100%;
	}
</style>
