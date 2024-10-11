<script lang="ts">
	import { goto } from '$app/navigation';
	import { isOnline, userName, gameId } from '$lib/stores';
	import { signIn, joinGame } from '$lib/firebase';
	import { errorToast } from '$lib/toast';
	import { UserIcon, HashIcon } from 'svelte-feather-icons';

	import TextInput from '$lib/components/TextInput.svelte';
	import Button from '$lib/components/Button.svelte';

	let shortId = '';
	$: shortId = shortId?.toUpperCase();

	async function handleJoinBtn() {
		try {
			if (!$isOnline) {
				throw new Error('You are currently offline.');
			}
			await signIn();
			await joinGame(shortId);
			goto(`/games/${$gameId}`);
		} catch (err: any) {
			errorToast(err.message);
		}
	}

	function handleCreateBtn() {
		goto('/createGame');
	}

	function handleTrainingBtn() {
		goto('/training');
	}
</script>

<div class="max-w-xs mx-auto flex flex-col gap-7">
	<div class="text-3xl text-center my-6">Create or Join a Game</div>
	<TextInput bind:text={$userName} name="username" placeholder="Username">
		<UserIcon slot="icon" />
	</TextInput>
	<TextInput bind:text={shortId} name="gameId" placeholder="Game ID">
		<HashIcon slot="icon" />
	</TextInput>
	<div class="flex space-x-4 mt-6">
		<Button text="Create" disabled={!$userName} onClick={handleCreateBtn} />
		<Button text="Join" disabled={!$userName || shortId.length !== 4} onClick={handleJoinBtn} />
	</div>
	<br>
	<div class="text-center">Want to train before playing?</div>
	<Button text="Training" onClick={handleTrainingBtn}/>
</div>
