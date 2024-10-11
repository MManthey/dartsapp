<script lang="ts">
	import { goto } from '$app/navigation';
	import { LogOutIcon } from 'svelte-feather-icons';
	import Popup from '$lib/components/Popup.svelte';

	import { training } from '$lib/stores';

	import { CheckIcon, ChevronLeftIcon, ChevronRightIcon } from 'svelte-feather-icons';
	import { ProgressRadial } from '@skeletonlabs/skeleton';

	let isLoading = false;

	const possibleScores = [...Array(21).keys()].concat([25]);

	let trainingForm = {
		nums: new Array(22).fill(0), // Array von 22 Nullen (Part 0 technisch gesehen ueberflüssig)
		throws: 0
	} as Cricket;

	let darts = {
		s: 0,
		x: 1
	} as Dart;

	//Alle außer 0 muessen 3 sein
	$: allSet = trainingForm.nums.slice(1).every(num => num === 3);

	function updateNums(num: number, mult: number) {
		if (num === 25) {
			num -= 4;
		}
		if (num !== 0 && trainingForm.nums[num] < 3) {
			trainingForm.nums[num] += mult;
			if (trainingForm.nums[num] > 3) {
				trainingForm.nums[num] = 3;
			}
		}
		allSet = trainingForm.nums.slice(1).every(num => num === 3);
		trainingForm.throws++;
	}

	//TODO: Checken, ob hier updated wird oder nicht, bzw. ob das nötig ist mit training
	training.set(trainingForm);

	let isPopupOpen = false; // Zustand für das Modal

	// Funktion zum Öffnen des Modals
    function openPopup() {
        isPopupOpen = true;
    }

    // Funktion zum Schließen des Modals
    function closePopup() {
        goto('/');
		$training = null;
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
					<div class="cricketGrids flex">
						<div class="cricketScore">
							{score}:
						</div>
						<div>
							<!--- abfangen, dass Wert 25 ist und mit 21 lesend auf array zugegriffen wird -->
							{#if score !== 25}
								{#if trainingForm.nums[score] == 0}
									ooo
								{:else if trainingForm.nums[score] == 1}
									xoo
								{:else if trainingForm.nums[score] == 2}
									xxo
								{:else}
									xxx
								{/if}
							{:else}
								{#if trainingForm.nums[21] == 0}
									ooo
								{:else if trainingForm.nums[21] == 1}
									xoo
								{:else if trainingForm.nums[21] == 2}
									xxo
								{:else}
									xxx
								{/if}
							{/if}
						</div>
					</div>
				{/if}
			{/each}
		</div>
	</div>
	
	<div class="w-full grid grid-cols-3 gap-2">
		<button
			class="btn btn-lg rounded-lg {darts.x === 1
				? 'variant-ghost-primary'
				: 'variant-ghost border-token border-surface-400-500-token'}"
			on:click={async () => {
				darts.x = 1;
				//TODO: Update Interface?
			}}
		>
			Single
		</button>
		<button
			class="btn btn-lg rounded-lg {darts.x === 2
				? 'variant-ghost-primary'
				: 'variant-ghost border-token border-surface-400-500-token'}"
			on:click={async () => {
				darts.x = darts.x === 2 ? 1 : 2;
				//TODO: Update Interface?
			}}
		>
			Double
		</button>
		<button
			class="btn btn-lg rounded-lg {darts.x === 3
				? 'variant-ghost-primary'
				: 'variant-ghost border-token border-surface-400-500-token'}"
			disabled={(darts.s || 0) > 20}
			on:click={async () => {
				darts.x = darts.x === 3 ? 1 : 3;
				//TODO: Update Interface?
			}}
		>
			Tripple
		</button>
	</div>

	<div class="w-full grid grid-cols-6 gap-2">
		{#each possibleScores as score}
			<button
				class="btn btn-lg rounded-lg p-0 aspect-square
					{darts.s === score
					? 'variant-ghost-primary'
					: 'variant-ghost border-token border-surface-400-500-token'}"
				disabled={score === 25 && darts.x === 3}
				on:click={async () => {
					darts.s = darts.s === score ? null : score;
					//TODO: Update Interface?
				}}
			>
				{score}
			</button>
		{/each}
		<button
			class="btn btn-lg rounded-lg variant-filled-primary p-0 aspect-square"
			
			on:click={async () => {
				darts = { s: null, x: 1 };
				//TODO: Zurueckbutton implementieren
			}}
		>
			<ChevronLeftIcon />
		</button>
		<button
			class="btn btn-lg rounded-lg variant-filled-primary p-0 aspect-square"
			disabled={darts.s === null}
			on:click={async () => {
				updateNums(darts.s, darts.x);
				if (allSet) {
					openPopup();
				}
			}}
		>
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
		<button
			class="btn-icon btn-icon-xl variant-filled-error"
			type="button"
			on:click={() => {
				goto('/');
				$training = null;
			}}
		>
		<LogOutIcon/>
		</button>
	</div>
	<Popup isOpen={isPopupOpen} onClose={closePopup}/>
</div>
