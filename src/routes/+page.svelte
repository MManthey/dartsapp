<script lang="ts">
	import { goto } from '$app/navigation';
	import { isOnline, userName, gameID, game, players } from '$lib/stores';
	import { signIn, joinGame } from '$lib/firebase';
	import { ProgressRadial } from '@skeletonlabs/skeleton';
	import { errorToast } from '$lib/toast';
	import { UserIcon, HashIcon } from 'svelte-feather-icons';

	$gameID = '';
	$game = null;
	$players = [];

	/**
	 * Game short ID entered by the user.
	 */
	let shortId = '';

	let isLoading = false;

	/**
	 * Reactive statement to ensure shortId is in uppercase.
	 */
	$: shortId = shortId?.toUpperCase();

	/**
	 * Handle the Join button click event.
	 * Signs the user in, joins the game, and navigates to the game page.
	 * If there are errors, displays a toast with the error message.
	 */
	async function handleJoinBtn() {
		isLoading = true;
		try {
			if (!$isOnline) {
				throw new Error('You are currently offline.');
			}
			await signIn();
			await joinGame(shortId);
			goto(`/games/${$gameID}`);
		} catch (err: any) {
			errorToast(err.message);
		} finally {
			isLoading = false;
		}
	}

	/**
	 * Handle the Create button click event.
	 * Navigates the user to the game creation page.
	 */
	function handleCreateBtn() {
		goto('/createGame');
	}
</script>

<div class="max-w-xs mx-auto">
	<h3 class="h3 mb-12 text-center">Create or Join a Game</h3>
	<div class="mb-6 input-group input-group-divider grid-cols-[1fr_auto]">
		<input
			class="input pl-4 rounded-br-none rounded-tr-none"
			type="text"
			name="username"
			autocomplete="on"
			placeholder="Username"
			bind:value={$userName}
		/>
		<div class="input-group-shim"><UserIcon /></div>
	</div>
	<div class="mb-12 input-group input-group-divider grid-cols-[1fr_auto]">
		<input
			class="input pl-4 rounded-br-none rounded-tr-none"
			type="text"
			name="game-id"
			placeholder="Game ID"
			autocomplete="off"
			bind:value={shortId}
		/>
		<div class="input-group-shim"><HashIcon/></div>
	</div>
	<div class="flex space-x-4">
		<button
			class="btn variant-filled-primary w-full py-2 px-4"
			type="button"
			disabled={!$userName}
			on:click={handleCreateBtn}
		>
			Create
		</button>
		<button
			class="btn variant-filled-primary w-full py-2 px-4"
			type="button"
			disabled={!$userName || shortId.length !== 6 || isLoading}
			on:click={handleJoinBtn}
		>
			{#if isLoading}
				<ProgressRadial stroke={120} width="w-6" />
			{:else}
				Join
			{/if}
		</button>
	</div>
</div>
