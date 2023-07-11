<script lang="ts">
	import { goto } from '$app/navigation';
	import { userName, gameID } from '$lib/stores';
	import { signIn, joinGame } from '$lib/firebase';
	import { Toast, toastStore } from '@skeletonlabs/skeleton';
	import type { ToastSettings } from '@skeletonlabs/skeleton';

	let shortId: string;

	$: shortId = shortId?.toUpperCase();

	async function handleJoinBtn() {
		try {
			await signIn();
			await joinGame(shortId);
			goto('/games/' + $gameID);
		} catch (error: any) {
			const t: ToastSettings = {
				message: error.message,
				// Provide any utility or variant background style:
				background: 'variant-filled-error'
			};
			toastStore.trigger(t);
		}
	}

	function handleCreateBtn() {
		goto('/createGame');
	}
</script>

<div class="max-w-xs mx-auto">
	<h3 class="h3 font-bold mb-12">Create or Join a Game</h3>
	<input
		class="input w-full p-2 rounded-lg mb-6"
		type="text"
		name="username"
		autocomplete="on"
		placeholder="Username"
		bind:value={$userName}
	/>
	<input
		class="input w-full p-2 rounded-lg mb-12"
		type="text"
		name="game-id"
		placeholder="Game ID"
		bind:value={shortId}
	/>
	<div class="flex space-x-4">
		<button
			class="btn variant-filled w-full py-2 px-4 rounded-lg"
			type="button"
			disabled={!$userName}
			on:click={handleCreateBtn}
		>
			Create
		</button>
		<button
			class="btn variant-filled w-full py-2 px-4 rounded-lg"
			type="button"
			disabled={!$userName || !shortId}
			on:click={handleJoinBtn}
		>
			Join
		</button>
	</div>
</div>
<Toast />
