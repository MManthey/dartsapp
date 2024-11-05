<script lang="ts">
	import { CheckIcon, ChevronLeftIcon, ChevronRightIcon } from 'svelte-feather-icons';
	import { ProgressRadial } from '@skeletonlabs/skeleton';

	// Importiere `trainingForm` aus dem Kontext
	let preMax = 6;
	let trainingForm = { max: preMax * 30 };

	const dartCount = 3; // Anzahl der Darts
	const possibleScores = [...Array(21).keys()].concat([25]); // Mögliche Punktzahlen für die Darts
	let remaining = trainingForm.max; // Startwert für die verbleibenden Punkte
	let dartInput = Array(dartCount).fill({ s: null, x: 1 });
	let i = 0;
	let isLoading = false;

	// Aktualisiert die verbleibenden Punkte basierend auf den aktuellen Eingaben
	$: remaining = trainingForm.max - dartInput.reduce((sum, dart) => sum + (dart.s || 0) * dart.x, 0);

	async function endTurn() {
		isLoading = true;
		try {
			// Hier wird der Endpunktestand berechnet und das Ende des Zugs simuliert
			console.log("Turn ended with score:", remaining);
			dartInput = Array(dartCount).fill({ s: null, x: 1 });
			i = 0;
		} catch (err) {
			console.error("Error:", err);
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="w-full card p-7 bg-primary-500 text-white">
	<div class="grid grid-cols-3 gap-4">
		{#each dartInput as dart, idx}
			<div
				class="rounded-lg h-9 flex justify-center items-center py-1 {idx === i
					? 'bg-white border-primary-800 border-2 text-primary-800'
					: 'bg-primary-800 border-primary-800 border-2 text-white'}"
			>
				{#if dart.s !== null}
					<span>{dart.s} x {dart.x}</span>
				{:else}
					<ChevronRightIcon />
				{/if}
			</div>
		{/each}
	</div>
	<div class="flex flex-row justify-around mt-6">
		<div class="flex flex-col gap-2">
			<h3 class="h3">Player Name</h3>
		</div>
		<div class="flex flex-col justify-center">
			<div class="text-primary-800">Single Out</div>
			<div class="h1 text-center text-6xl">
				{remaining}
			</div>
		</div>
	</div>
</div>

<div class="w-full grid grid-cols-3 gap-2">
	<button
		class="btn btn-lg rounded-lg {dartInput[i].x === 1 ? 'variant-ghost-primary' : 'variant-ghost border-token border-surface-400-500-token'}"
		on:click={() => { dartInput[i].x = 1; }}
	>
		Single
	</button>
	<button
		class="btn btn-lg rounded-lg {dartInput[i].x === 2 ? 'variant-ghost-primary' : 'variant-ghost border-token border-surface-400-500-token'}"
		on:click={() => { dartInput[i].x = dartInput[i].x === 2 ? 1 : 2; }}
	>
		Double
	</button>
	<button
		class="btn btn-lg rounded-lg {dartInput[i].x === 3 ? 'variant-ghost-primary' : 'variant-ghost border-token border-surface-400-500-token'}"
		on:click={() => { dartInput[i].x = dartInput[i].x === 3 ? 1 : 3; }}
	>
		Triple
	</button>
</div>

<div class="w-full grid grid-cols-6 gap-2">
	{#each possibleScores as score}
		<button
			class="btn btn-lg rounded-lg p-0 aspect-square
				{dartInput[i].s === score ? 'variant-ghost-primary' : 'variant-ghost border-token border-surface-400-500-token'}"
			on:click={() => { dartInput[i].s = dartInput[i].s === score ? null : score; }}
		>
			{score}
		</button>
	{/each}
	<button
		class="btn btn-lg rounded-lg variant-filled-primary p-0 aspect-square"
		disabled={i === 0}
		on:click={() => {
			dartInput[i] = { s: null, x: 1 };
			i--;
		}}
	>
		<ChevronLeftIcon />
	</button>
	<button
		class="btn btn-lg rounded-lg variant-filled-primary p-0 aspect-square"
		disabled={dartInput[i].s === null}
		on:click={() => {
			if (i === dartCount - 1) {
				endTurn();
			} else {
				i++;
			}
		}}
	>
		{#if isLoading}
			<ProgressRadial stroke={120} width="w-6" />
		{:else}
			<ChevronRightIcon />
		{/if}
	</button>
</div>
