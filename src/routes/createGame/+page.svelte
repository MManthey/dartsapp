<script lang="ts">
	import { goto } from '$app/navigation';
	import { gameID } from '$lib/stores';
	import { signIn, createGame, joinGame } from '$lib/firebase';
	import { RadioGroup, RadioItem, SlideToggle } from '@skeletonlabs/skeleton';

	let game: Game = {
		shortId: generateShortId(6),
		gameMode: '301',
		outMode: 'single',
		size: 1,
		isOnline: false,
		turn: '',
		state: 'waiting'
	};

	function generateShortId(length: number) {
		const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
		let result = '';
		for (let i = 0; i < length; i++) {
			result += chars[Math.floor(Math.random() * chars.length)];
		}
		return result;
	}

	async function handleJoinBtn() {
		try {
			await signIn();
			await createGame(game);
			await joinGame(game.shortId);
			goto('/games/' + $gameID);
		} catch (error) {
			console.error(error);
			alert(error);
		}
	}
</script>

<div class="max-w-xs mx-auto">
	<h3 class="h3 font-bold mb-12">Settings</h3>
	<div class="mb-6">
		<label class="block font-bold">
			<div>Game Mode</div>
			<select class="select w-full mt-2 rounded-lg" bind:value={game.gameMode}>
				<option value="301">301</option>
				<option value="501">501</option>
			</select>
		</label>
	</div>
	<div class="mb-6">
		<div class="font-bold text-md">Out Mode</div>
		<RadioGroup class="grid grid-cols-2 mt-2" rounded="rounded-lg">
			<RadioItem bind:group={game.outMode} name="justify" value="single">Single</RadioItem>
			<RadioItem bind:group={game.outMode} name="justify" value="double">Double</RadioItem>
		</RadioGroup>
	</div>
	<div class="mb-6">
		<div class="font-bold text-md">Players</div>
		<RadioGroup class="grid grid-cols-4 mt-2" rounded="rounded-lg">
			<RadioItem bind:group={game.size} name="one" value={1}>1</RadioItem>
			<RadioItem bind:group={game.size} name="two" value={2}>2</RadioItem>
			<RadioItem bind:group={game.size} name="three" value={3}>3</RadioItem>
			<RadioItem bind:group={game.size} name="four" value={4}>4</RadioItem>
		</RadioGroup>
	</div>
	<!-- {#if game.size > 1}
		<div class="mb-8">
			<SlideToggle name="slide" bind:checked={game.isOnline} size="sm">
				<span class="text-md font-bold">Online Game</span></SlideToggle
			>
		</div>
	{/if} -->
	<div>
		<button
			class="btn variant-filled w-full py-2 px-4 mt-6 rounded-lg"
			type="button"
			on:click={handleJoinBtn}>Create and Join</button
		>
	</div>
</div>
