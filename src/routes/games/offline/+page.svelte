<script lang="ts">
	import { goto } from '$app/navigation';
	import { LogOutIcon } from 'svelte-feather-icons';
	import { modalStore, RadioGroup, RadioItem } from '@skeletonlabs/skeleton';
	import type { ModalSettings, ModalComponent } from '@skeletonlabs/skeleton';

	import { game, players } from '$lib/stores';

	import Scoreboard from '$lib/components/Scoreboard.svelte';
	import OfflineScoreInput from '$lib/components/OfflineScoreInput.svelte';
	import WinnerModal from '$lib/components/WinnerModal.svelte';

	let mode = 'score';

	$: if ($game?.state === 'over') {
		const modalComponent: ModalComponent = {
			// Pass a reference to your custom component
			ref: WinnerModal,
			// Add the component properties as key/value pairs
			props: { background: 'bg-primary-500' },
			// Provide a template literal for the default component slot
			slot: `<p class="text-white"><span class="text-primary-900 text-5xl">${
				$players[$game?.turnIdx || 0]?.name
			}</span></br> has won the match!</p>`
		};
		const modal: ModalSettings = {
			type: 'component',
			// Pass the component directly:
			component: modalComponent
		};
		modalStore.trigger(modal);
	}
</script>

{#if $game && $players.length}
	<div class="flex flex-col gap-8 items-center">
		<RadioGroup class="grid grid-cols-2 w-full" active="variant-filled-primary">
			<RadioItem bind:group={mode} name="score" value="score">Score</RadioItem>
			<RadioItem bind:group={mode} name="table" value="table">Table</RadioItem>
		</RadioGroup>
		{#if mode === 'score'}
			<OfflineScoreInput index={$game.turnIdx} />
		{:else}
			<Scoreboard game={$game} players={$players} />
		{/if}
		<div class="sticky bottom-5 flex flex-row justify-center gap-5 mt-5">
			<button
				class="btn-icon btn-icon-xl variant-filled-error"
				type="button"
				on:click={() => {
					goto('/');
					$game = null;
					$players = [];
				}}
			>
				<LogOutIcon />
			</button>
		</div>
	</div>
{/if}
