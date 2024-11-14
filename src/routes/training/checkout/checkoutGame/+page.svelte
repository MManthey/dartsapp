<script lang="ts">
	import { goto } from '$app/navigation';
	import { CheckIcon, ChevronLeftIcon, ChevronRightIcon, LogOutIcon } from 'svelte-feather-icons';
	import { ProgressRadial } from '@skeletonlabs/skeleton';

	import { training } from '$lib/stores';
	import DartSVG from '$lib/components/DartSVG.svelte';

	// Reactive assignment to automatically subscribe to the store
	let trainingData = $training;

	let max = trainingData.max;
	let throws = trainingData.throws;
	let outMode = trainingData.out;

	const dartCount = 3;
	const possibleScores = [...Array(21).keys()].concat([25]);
	let remaining = trainingData.max;
	let currentThrowIndex = 0;
	let dartValues = Array(dartCount).fill(null);
	let dartMultipliers = Array(dartCount).fill(1);
	let isLoading = false;

	let targetScore;
	let outResults;
	let throwsTillFinish = throws;

	/**
	 * Generates a random target score and calculates the fastest out combination.
	 * Ensures that `outResults` always has 3 elements by filling with "undefined" if needed.
	 * No parameters.
	 */
	function generateValidTargetScore() {
		do {
			targetScore = getRandomScore(max);
			outResults = calculateFastestOut(targetScore, outMode);
		} while (outResults.includes("Kein Out möglich"));

		// Ensure `outResults` always has 3 elements
		while (outResults.length < dartCount) {
			outResults.push("undefined");
		}
	}

	generateValidTargetScore();

	/**
	 * Ends the current turn by resetting values such as `remaining`, `dartValues`, `dartMultipliers`,
	 * `currentThrowIndex`, and `throwsTillFinish`. Also sets `isLoading` to true while resetting.
	 * No parameters.
	 */
	async function endTurn() {
		isLoading = true;
		try {
			console.log("Turn ended with score:", remaining);
			remaining = max;
			dartValues.fill(null);
			dartMultipliers.fill(1);
			currentThrowIndex = 0;
			throwsTillFinish = throws;
		} catch (err) {
			console.error("Error:", err);
		} finally {
			isLoading = false;
		}
	}

	/**
	 * Generates a random score between `max` and `max - 20`, ensuring that the value does not fall below 0.
	 * @param max - The upper bound for the random score generation.
	 * @returns A random integer score within the specified range.
	 */
	function getRandomScore(max: number): number {
		const min = Math.max(max - 20, 0);
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	/**
	 * Updates the optimal out results based on the remaining points calculated from `dartValues` and `dartMultipliers`.
	 * If `newOutResults` has less than `dartCount` elements, it fills the array with "undefined" to ensure consistent length.
	 * No parameters.
	 */
	function updateOutResults() {
		const newRemaining = targetScore - dartValues.reduce((sum, dart, idx) => sum + (dart || 0) * dartMultipliers[idx], 0);
		const newOutResults = calculateFastestOut(newRemaining, outMode);

		while (newOutResults.length < dartCount) {
			newOutResults.push("undefined");
		}

		outResults = newOutResults;
	}

	/**
	 * Calculates the fastest out combination for a given target score and out mode.
	 * @param targetScore - The score to be achieved.
	 * @param outMode - Specifies 'single' or 'double' out. For 'double' out, the last dart must be a double.
	 * @returns An array of strings representing the minimal throws required to reach the target score.
	 */
	function calculateFastestOut(targetScore: number, outMode: 'single' | 'double'): string[] {
		const possibleThrows = [
			{ label: "BULL", value: 50, multiplier: 1 },
			{ label: "25", value: 25, multiplier: 1 },
			...Array.from({ length: 20 }, (_, i) => ({ label: `${i + 1}`, value: i + 1, multiplier: 1 })),
			...Array.from({ length: 20 }, (_, i) => ({ label: `D${i + 1}`, value: (i + 1) * 2, multiplier: 2 })),
			...Array.from({ length: 20 }, (_, i) => ({ label: `T${i + 1}`, value: (i + 1) * 3, multiplier: 3 })),
		].sort((a, b) => b.value - a.value);

		let bestResult: string[] | null = null;

		function findOut(remaining: number, throws: string[]): boolean {
			if (remaining === 0 && (outMode === 'single' || throws.length === 0 || throws[throws.length - 1].startsWith("D"))) {
				if (!bestResult || throws.length < bestResult.length) {
					bestResult = [...throws];
				}
				return true;
			}
			if (remaining <= 0 || throws.length >= 3) return false;

			for (let throwOption of possibleThrows) {
				const isLastThrow = throws.length === 2;
				if (isLastThrow && outMode === 'double' && throwOption.multiplier !== 2) continue;

				const newRemaining = remaining - throwOption.value;
				const newThrows = [...throws, throwOption.label];

				if (findOut(newRemaining, newThrows)) return true;
			}
			return false;
		}

		findOut(targetScore, []);
		return bestResult ? bestResult : ["Kein Out möglich"];
	}


	function endPlay() {
		//TODO: gucken, ob geschafft oder nicht und vorschlagen, wie weiter vorgegangen werden soll
	}

	/**
	 * TODO Kommentieren maybe
	 */
	function confirmThrow() {
		const hitScore = (dartValues[currentThrowIndex] || 0) * dartMultipliers[currentThrowIndex];
		//TODO: checken, ob newRemaining negativ!
		const newRemaining = remaining - hitScore;
		let newOutResults;

		throwsTillFinish--;
		//TODO ist das if richtig?
		if (currentThrowIndex >= dartCount - 1 || newRemaining === 0 || throwsTillFinish === 0) {
			endPlay();
		} else {
			newOutResults = calculateFastestOut(newRemaining, outMode);
			if (throwsTillFinish < 3) {
				currentThrowIndex++;
			} else {
				outResults = newOutResults;
			}
			if (newOutResults[0] === undefined 
			|| (newOutResults[1] === undefined && newRemaining <= 0) 
			|| (newOutResults[2] === undefined && newRemaining <= 1) 
			|| (newOutResults[2] !== undefined && newRemaining <= 2)) {
				outResults = Array(3).fill(undefined);
			}
		}
	}

	// Re-calculate remaining points based on dart values and multipliers.
	$: remaining = targetScore - dartValues.reduce((sum, dart, idx) => sum + (dart || 0) * dartMultipliers[idx], 0);
</script>


<div class="w-full card p-7 bg-primary-500 text-white mb-4">
	<div class="grid grid-cols-3 gap-4">
		{#each outResults as result, idx}
			<div
				class="rounded-lg h-9 flex justify-center items-center py-1 {idx === currentThrowIndex
					? 'bg-white border-primary-800 border-2 text-primary-800'
					: 'bg-primary-800 border-primary-800 border-2 text-white'}"
			>
				{#if result === "undefined"}
					<DartSVG fill={idx === currentThrowIndex ? '#16805c' : 'white'} />
				{:else}
					{result}
				{/if}
			</div>
		{/each}
	</div>
	<div class="flex flex-row justify-around mt-6">
		<div class="flex flex-col items-center">
			<h3 class="text-primary-800">Throws till finish:</h3>
			<h1 class="h1 text-6xl">{throwsTillFinish}</h1>
		</div>
		<div class="flex flex-col justify-center">
			<div class="text-primary-800 text-center">
				{#if outMode === 'single'}
					Single Out
				{:else}
					Double Out
				{/if}
			</div>
			<div class="h1 text-center text-6xl">
				{remaining}
			</div>
		</div>
	</div>
</div>

<div class="w-full grid grid-cols-3 gap-2 mb-4">
	<button
		class="btn btn-lg rounded-lg {dartMultipliers[currentThrowIndex] === 1 ? 'variant-ghost-primary' : 'variant-ghost border-token border-surface-400-500-token'}"
		on:click={() => { dartMultipliers[currentThrowIndex] = 1; }}
	>
		Single
	</button>
	<button
		class="btn btn-lg rounded-lg {dartMultipliers[currentThrowIndex] === 2 ? 'variant-ghost-primary' : 'variant-ghost border-token border-surface-400-500-token'}"
		on:click={() => { dartMultipliers[currentThrowIndex] = dartMultipliers[currentThrowIndex] === 2 ? 1 : 2; }}
	>
		Double
	</button>
	<button
		class="btn btn-lg rounded-lg {dartMultipliers[currentThrowIndex] === 3 ? 'variant-ghost-primary' : 'variant-ghost border-token border-surface-400-500-token'}"
		disabled={dartValues[currentThrowIndex] === 25}
		on:click={() => { dartMultipliers[currentThrowIndex] = dartMultipliers[currentThrowIndex] === 3 ? 1 : 3; }}
	>
		Triple
	</button>
</div>

<div class="w-full grid grid-cols-6 gap-2">
	{#each possibleScores as score}
		<button
			class="btn btn-lg rounded-lg p-0 aspect-square
				{dartValues[currentThrowIndex] === score ? 'variant-ghost-primary' : 'variant-ghost border-token border-surface-400-500-token'}"
			disabled={score === 25 && dartMultipliers[currentThrowIndex] === 3}
			on:click={() => { dartValues[currentThrowIndex] = dartValues[currentThrowIndex] === score ? null : score; }}
		>
			{score}
			</button>
	{/each}
	<button
		class="btn btn-lg rounded-lg variant-filled-primary p-0 aspect-square"
		disabled={currentThrowIndex === 0}
		on:click={() => { //TODO: tatsächlich throw index 1 zurück!!!
			dartValues[currentThrowIndex] = null;
			dartMultipliers[currentThrowIndex] = 1;
			currentThrowIndex--;
		}}
	>
		<ChevronLeftIcon />
	</button>
	<button
		class="btn btn-lg rounded-lg variant-filled-primary p-0 aspect-square"
		disabled={dartValues[currentThrowIndex] === null}
		on:click={confirmThrow}
	>
		{#if isLoading}
			<ProgressRadial stroke={120} width="w-6" />
		{:else}
			<ChevronRightIcon />
		{/if}
	</button>
</div>

<div class="sticky bottom-5 flex flex-row justify-center gap-5 mt-5">
	<button class="btn-icon btn-icon-xl variant-filled-error" type="button" on:click={() => { goto('/'); $training = null;}}>
		<LogOutIcon/>
	</button>
</div>
