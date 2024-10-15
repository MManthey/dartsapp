<script lang="ts">
	import { goto } from '$app/navigation';
	import { LogOutIcon } from 'svelte-feather-icons';
	import { modalStore } from '@skeletonlabs/skeleton';

	import type { ModalSettings, ModalComponent } from '@skeletonlabs/skeleton';
	import { CheckIcon, ChevronLeftIcon, ChevronRightIcon } from 'svelte-feather-icons';
	import { ProgressRadial } from '@skeletonlabs/skeleton';

	import { training } from '$lib/stores';
	import WinnerModal from '$lib/components/WinnerModal.svelte'; // Importiere das Modal

	let isLoading = false;
	const possibleScores = [...Array(21).keys()].concat([25]);
	let trainingForm = { nums: new Array(22).fill(0), throws: 0 } as Cricket;

	let darts = { s: 0, x: 1 } as Dart;

	$: allSet = false;

	let gridColors = new Array(25).fill('cricketGridsColorNorm');

	//Funktion zum updaten der gespeicherten Anzahl an getroffenen Zahlen
	function updateNums(num: number, mult: number) {
		let colorNum = num;
		//25 ist an der Stelle 21 im Array!
		if (num === 25) {
			num -= 4;
		}
		if (num !== 0 && trainingForm.nums[num] < 3) {
			trainingForm.nums[num] += mult;
			if (trainingForm.nums[num] > 3) {
				trainingForm.nums[num] = 3;
			}
			if (trainingForm.nums[num] === 3) {
				gridColors[colorNum - 1] = 'cricketGridsColorDone';
			}
		}
		allSet = trainingForm.nums.slice(1).every(num => num === 3);
		trainingForm.throws++;
	}

	training.set(trainingForm);

	// Funktion zum Öffnen des Gewinner-Modals
	function openModal() {
		const modalComponent: ModalComponent = {
			ref: WinnerModal,
			props: { background: 'bg-primary-500' },
			slot: `<p class="text-white"> You have completed the training with ${trainingForm.throws} throws!</p>`
		};
		const modal: ModalSettings = {
			type: 'component',
			component: modalComponent
		};
		modalStore.trigger(modal);

		setTimeout(() => {
			goto('/');
		}, 1000);
	}
</script>

<div class="max-w-xs mx-auto flex flex-col gap-7">
	<div class="text-3xl text-center my-6">Cricket</div>
</div>

<div class="flex flex-col gap-8 items-center">
	<div class="w-full card p-7 bg-primary-500 text-white">
		<div class="grid grid-cols-3 gap-2">
			{#each possibleScores as score}
				{#if score !== 0}
					<div class="cricketGrids {gridColors[score - 1]} flex">
						<div class="cricketScore">
							{score}:
						</div>
						<div class="cricketScoreDiv">
							<!-- abfangen, dass man mit 25 nicht auf den arrayplatz von 25 zugreifen kann! (i=21) -->
							{#if score !== 25}
								{#each Array(trainingForm.nums[score]) as _, i}
									<svg class="w-3 md:w-3 lg:w-3 aspect-square" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
										<path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512z" />
									</svg>
								{/each}
								{#each Array(3 - trainingForm.nums[score]) as _, i}
									<svg class="w-3 md:w-3 lg:w-3 aspect-square" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
										<path d="M464 256A208 208 0 1 0 48 256a208 208 0 1 0 416 0zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256z" />
									</svg>
								{/each}
							{:else}
								{#each Array(trainingForm.nums[21]) as _, i}
									<svg class="w-3 md:w-3 lg:w-3 aspect-square" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
										<path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512z" />
									</svg>
								{/each}
								{#each Array(3 - trainingForm.nums[21]) as _, i}
									<svg class="w-3 md:w-3 lg:w-3 aspect-square" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
										<path d="M464 256A208 208 0 1 0 48 256a208 208 0 1 0 416 0zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256z" />
									</svg>
								{/each}
							{/if}
						</div>
					</div>
				{/if}
			{/each}
		</div>
	</div>

	<div class="w-full grid grid-cols-3 gap-2">
		<button class="btn btn-lg rounded-lg {darts.x === 1 ? 'variant-ghost-primary' : 'variant-ghost border-token border-surface-400-500-token'}" on:click={async () => { darts.x = 1; }}>
			Single
		</button>
		<button class="btn btn-lg rounded-lg {darts.x === 2 ? 'variant-ghost-primary' : 'variant-ghost border-token border-surface-400-500-token'}" on:click={async () => { darts.x = darts.x === 2 ? 1 : 2; }}>
			Double
		</button>
		<button class="btn btn-lg rounded-lg {darts.x === 3 ? 'variant-ghost-primary' : 'variant-ghost border-token border-surface-400-500-token'}" disabled={(darts.s || 0) > 20} on:click={async () => { darts.x = darts.x === 3 ? 1 : 3; }}>
			Triple
		</button>
	</div>

	<div class="w-full grid grid-cols-6 gap-2">
		{#each possibleScores as score}
			<button class="btn btn-lg rounded-lg p-0 aspect-square {darts.s === score ? 'variant-ghost-primary' : 'variant-ghost border-token border-surface-400-500-token'}" disabled={score === 25 && darts.x === 3} on:click={async () => { darts.s = darts.s === score ? null : score; }}>
				{score}
			</button>
		{/each}
		<button class="btn btn-lg rounded-lg variant-filled-primary p-0 aspect-square" on:click={async () => { darts = { s: null, x: 1 }; }}>
			<ChevronLeftIcon />
		</button>
		<button class="btn btn-lg rounded-lg variant-filled-primary p-0 aspect-square" disabled={darts.s === null} on:click={async () => {
			updateNums(darts.s, darts.x);
			if (allSet) {
				openModal(); // Winner Modal öffnen
			}
		}}>
			{#if isLoading}
				<ProgressRadial stroke={120} width="w-6" />
			{:else if allSet}
				<CheckIcon />
			{:else}
				<ChevronRightIcon />
			{/if}
		</button>
	</div>

	<div class="sticky bottom-5 flex flex-row justify-center gap-5 mt-5">
		<button class="btn-icon btn-icon-xl variant-filled-error" type="button" on:click={() => { goto('/'); $training = null; }}>
			<LogOutIcon/>
		</button>
	</div>
</div>
