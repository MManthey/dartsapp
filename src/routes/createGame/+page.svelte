<script lang="ts">
	import { goto } from '$app/navigation';
	import { signIn, createGame, joinGame, generateShortId } from '$lib/firebase';
	import { isOnline, userName, gameId, game, players } from '$lib/stores';
	import { RadioGroup, RadioItem, SlideToggle, RangeSlider } from '@skeletonlabs/skeleton';
	import { errorToast, successToast } from '$lib/toast';
	import { UserIcon } from 'svelte-feather-icons';

	import Button from '$lib/components/Button.svelte';
	import TextInput from '$lib/components/TextInput.svelte';

	let gameForm: Game = {
		gameMode: '301',
		outMode: 'single',
		legs: 1,
		sets: 1,
		size: 1,
		turnIdx: 0,
		state: 'open'
	};
	let gameMode = '301';
	let points = 301;
	$: switch (gameMode) {
		case '301':
			gameForm.gameMode = '301';
			break;
		case '501':
			gameForm.gameMode = '501';
			break;
		case 'Custom':
			gameForm.gameMode = `${points}`;
			break;
	}
	let onlineGame = true;
	let playerNames: string[] = [];

	$: if (!onlineGame) playerNames.length = gameForm.size - 1;

	/**
	 * Handles the Create and Join button click.
	 * Creates the game and then joins the player to it.
	 */
	async function handleJoinBtn() {
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
							darts: [
								{ s: null, x: 1 },
								{ s: null, x: 1 },
								{ s: null, x: 1 }
							],
							dartIdx: 0,
							scores: [],
							avg: 0,
							sets: 0,
							legs: 0
						}
					];
				}
				$game = gameForm;
				goto(`/games/offline`);
			} else {
				if (!$isOnline) {
					throw new Error('You are currently offline.');
				}
				await signIn();
				const shortId = await generateShortId();
				gameForm.shortId = shortId;
				$game = gameForm;
				await createGame($game);
				await joinGame(shortId);
				goto(`/games/${$gameId}`);
				successToast('Game joined.');
			}
		} catch (err: unknown) {
			const msg =
				err instanceof Error ? err.message : 'Unknown error while creating/joinging game.';
			console.error(msg);
			errorToast(msg);
		}
	}
</script>

<div class="max-w-xs mx-auto flex flex-col gap-7">
	<div class="text-3xl text-center my-6">Settings</div>
	<div>
		<label class="block font-bold">
			<div>Game Mode</div>
			<select class="select w-full mt-2 pl-5" bind:value={gameMode}>
				<option value="301">301</option>
				<option value="501">501</option>
				<option value="Custom">Custom</option>
			</select>
		</label>
	</div>
	{#if gameMode === 'Custom'}
		<div class="">
			<RangeSlider
				name="range-slider"
				bind:value={points}
				min={1}
				max={999}
				accent="accent-primary-500 dark:accent-primary-500"
			>
				<div class="font-bold text-md">
					Playing down from {points}
				</div>
			</RangeSlider>
		</div>
	{/if}
	<div>
		<div class="font-bold text-md">Out Mode</div>
		<RadioGroup class="grid grid-cols-2 mt-2" active="variant-filled-primary">
			<RadioItem bind:group={gameForm.outMode} name="single" value="single">Single</RadioItem>
			<RadioItem bind:group={gameForm.outMode} name="double" value="double">Double</RadioItem>
		</RadioGroup>
	</div>
	<div>
		<RangeSlider
			name="range-slider"
			bind:value={gameForm.legs}
			min={1}
			max={5}
			ticked
			accent="accent-primary-500 dark:accent-primary-500"
		>
			<div class="font-bold text-md">
				First to {gameForm.legs}
				{gameForm.legs > 1 ? 'Legs' : 'Leg'}
			</div>
		</RangeSlider>
	</div>
	<div>
		<RangeSlider
			name="range-slider"
			bind:value={gameForm.sets}
			min={1}
			max={5}
			ticked
			accent="accent-primary-500 dark:accent-primary-500"
		>
			<div class="font-bold text-md">
				First to {gameForm.sets}
				{gameForm.sets > 1 ? 'Sets' : 'Set'}
			</div>
		</RangeSlider>
	</div>
	<div>
		<div class="font-bold text-md">Players</div>
		<RadioGroup class="grid grid-cols-4 mt-2" active="variant-filled-primary">
			<RadioItem bind:group={gameForm.size} name="one" value={1}>1</RadioItem>
			<RadioItem bind:group={gameForm.size} name="two" value={2}>2</RadioItem>
			<RadioItem bind:group={gameForm.size} name="three" value={3}>3</RadioItem>
			<RadioItem bind:group={gameForm.size} name="four" value={4}>4</RadioItem>
		</RadioGroup>
	</div>
	{#if gameForm.size > 1}
		<div>
			<SlideToggle name="slide" bind:checked={onlineGame} size="sm" active="bg-primary-500">
				<span class="text-md font-bold">{onlineGame ? 'Online' : 'Offline'} Game</span>
			</SlideToggle>
		</div>
		{#if !onlineGame}
			<div>
				<div class="text-md mb-5">Names</div>
				{#each { length: gameForm.size - 1 } as _, i}
					<TextInput text={playerNames[i]} name="player-{i + 2}-name" placeholder="Player {i + 2}">
						<UserIcon />
					</TextInput>
				{/each}
			</div>
		{/if}
	{/if}
	<div class="mt-6">
		<Button text="Create and Join" onClick={handleJoinBtn} />
	</div>
</div>
