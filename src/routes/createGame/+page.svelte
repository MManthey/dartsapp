<script lang="ts">
	import { goto } from '$app/navigation';
	import { signIn, createGame, joinGame, generateShortId } from '$lib/firebase';
	import { userName, gameID, game, players } from '$lib/stores';
	import {
		RadioGroup,
		RadioItem,
		SlideToggle,
		RangeSlider,
		ProgressRadial
	} from '@skeletonlabs/skeleton';
	import { errorToast, successToast } from '$lib/toast';

	let gameForm: Game = {
		gameMode: '301',
		outMode: 'single',
		legs: 1,
		sets: 1,
		size: 1,
		turn: 0,
		state: 'open'
	};
	let onlineGame = true;
	let playerNames: string[] = [];
	let isLoading = false;

	$: if (!onlineGame) playerNames.length = gameForm.size - 1;

	/**
	 * Handles the Create and Join button click.
	 * Creates the game and then joins the player to it.
	 */
	async function handleJoinBtn() {
		isLoading = true;
		try {
			if (!onlineGame || gameForm.size === 1) {
				gameForm.state = 'closed';
				$players = [];
				for (let idx = 0; idx < gameForm.size; idx++) {
					$players = [
						...$players,
						{
							idx,
							name: idx === 0 ? $userName : playerNames[idx - 1],
							remaining: Number(gameForm.gameMode),
							throws: [],
							avg: 0,
							sets: 0,
							legs: 0
						}
					];
				}
				$game = gameForm;
				goto(`/games/offline`);
			} else {
				$game = gameForm;
				await signIn();
				$game.shortId = await generateShortId();
				await createGame($game);
				await joinGame($game.shortId);
				goto(`/games/${$gameID}`);
				successToast('Game joined.');
			}
		} catch (err: any) {
			errorToast(err.message);
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="max-w-xs mx-auto">
	<h3 class="h3 font-bold mb-12">Settings</h3>
	<div class="mb-6">
		<label class="block font-bold">
			<div>Game Mode</div>
			<select class="select w-full mt-2 rounded-lg" bind:value={gameForm.gameMode}>
				<option value="301">301</option>
				<option value="501">501</option>
			</select>
		</label>
	</div>
	<div class="mb-6">
		<div class="font-bold text-md">Out Mode</div>
		<RadioGroup class="grid grid-cols-2 mt-2" rounded="rounded-lg">
			<RadioItem bind:group={gameForm.outMode} name="single" value="single">Single</RadioItem>
			<RadioItem bind:group={gameForm.outMode} name="double" value="double">Double</RadioItem>
		</RadioGroup>
	</div>
	<div class="mb-6">
		<RangeSlider name="range-slider" bind:value={gameForm.legs} min={1} max={5} ticked>
			<div class="font-bold text-md">
				First to {gameForm.legs}
				{gameForm.legs > 1 ? 'Legs' : 'Leg'}
			</div>
		</RangeSlider>
	</div>
	<div class="mb-6">
		<RangeSlider name="range-slider" bind:value={gameForm.sets} min={1} max={5} ticked>
			<div class="font-bold text-md">
				First to {gameForm.sets}
				{gameForm.sets > 1 ? 'Sets' : 'Set'}
			</div>
		</RangeSlider>
	</div>
	<div class="mb-6">
		<div class="font-bold text-md">Players</div>
		<RadioGroup class="grid grid-cols-4 mt-2" rounded="rounded-lg">
			<RadioItem bind:group={gameForm.size} name="one" value={1}>1</RadioItem>
			<RadioItem bind:group={gameForm.size} name="two" value={2}>2</RadioItem>
			<RadioItem bind:group={gameForm.size} name="three" value={3}>3</RadioItem>
			<RadioItem bind:group={gameForm.size} name="four" value={4}>4</RadioItem>
		</RadioGroup>
	</div>
	{#if gameForm.size > 1}
		<div class="mb-6">
			<SlideToggle name="slide" bind:checked={onlineGame} size="sm">
				<span class="text-md font-bold">{onlineGame ? 'Online' : 'Offline'} Game</span>
			</SlideToggle>
		</div>
		{#if !onlineGame}
			<div class="mb-6">
				<div class="font-bold text-md">Names</div>
				{#each { length: gameForm.size - 1 } as _, i}
					<input
						class="input w-full p-2 rounded-lg mt-2"
						type="text"
						name="player-{i + 2}-name"
						autocomplete="on"
						placeholder="Player {i + 2}"
						bind:value={playerNames[i]}
					/>
				{/each}
			</div>
		{/if}
	{/if}

	<div>
		<button
			class="btn variant-filled w-full py-2 px-4 mt-6 rounded-lg"
			type="button"
			disabled={isLoading}
			on:click={handleJoinBtn}
		>
			{#if isLoading}
				<ProgressRadial stroke={120} width="w-6" />
			{:else}
				Create and Join
			{/if}
		</button>
	</div>
</div>
