<script lang="ts">
	import { goto } from '$app/navigation';
	import { CheckIcon, ChevronLeftIcon, ChevronRightIcon, LogOutIcon } from 'svelte-feather-icons';
	import { ProgressRadial } from '@skeletonlabs/skeleton';

	import { training } from '$lib/stores';

	// Reactive assignment to automatically subscribe to the store
	let trainingData = $training;

	let max = trainingData.max;
	let throws = trainingData.throws;
	let outMode = trainingData.out;

	const dartCount = 3; // Anzahl der Darts
	const possibleScores = [...Array(21).keys()].concat([25]); // Mögliche Punktzahlen für die Darts
	let remaining = trainingData.max; // Startwert für die verbleibenden Punkte
	let currentThrowIndex = 0;
	let dartValues = Array(dartCount).fill(null); // Array für die Punkte jedes Wurfs
	let dartMultipliers = Array(dartCount).fill(1); // Array für die Multiplikatoren jedes Wurfs (Single, Double, Triple)
	let isLoading = false;

	async function endTurn() {
		isLoading = true;
		try {
			// Endet den Zug und setzt die Variablen zurück
			console.log("Turn ended with score:", remaining);
			remaining = max;
			dartValues.fill(null);
			dartMultipliers.fill(1);
			currentThrowIndex = 0;
		} catch (err) {
			console.error("Error:", err);
		} finally {
			isLoading = false;
		}
	}

	function getRandomScore(max: number): number {
		const min = Math.max(max - 20, 0); // Stellen Sie sicher, dass der Wert nicht unter 0 fällt
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	let targetScore;
	let outResults;

	// Funktion, die einen gültigen "Out"-Score generiert
	function generateValidTargetScore() {
		do {
			targetScore = getRandomScore(max);
			outResults = calculateFastestOut(targetScore, outMode);
		} while (outResults.includes("Kein Out möglich"));
	}

	generateValidTargetScore();

	/**
	 * Berechnet den schnellsten "Out"-Weg für eine gegebene Punktzahl im Darts.
	 * @param targetScore - Die Zielpunktzahl, die erreicht werden soll.
	 * @param outMode - Entweder 'single' oder 'double' out. Bei 'double' muss der letzte Wurf ein Double sein.
	 * @returns Ein Array mit den minimal benötigten Treffern, um die Punktzahl zu erreichen.
	 */
	function calculateFastestOut(targetScore: number, outMode: 'single' | 'double'): string[] {
		const possibleThrows = [
			{ label: "BULL", value: 50, multiplier: 1 },
			{ label: "25", value: 25, multiplier: 1 },
			...Array.from({ length: 20 }, (_, i) => ({ label: `${i + 1}`, value: i + 1, multiplier: 1 })),
			...Array.from({ length: 20 }, (_, i) => ({ label: `D${i + 1}`, value: (i + 1) * 2, multiplier: 2 })),
			...Array.from({ length: 20 }, (_, i) => ({ label: `T${i + 1}`, value: (i + 1) * 3, multiplier: 3 })),
		].sort((a, b) => b.value - a.value); // Sortiert nach Wert, um hohe Werte zuerst zu prüfen

		let bestResult: string[] | null = null;

		function findOut(remaining: number, throws: string[]): boolean {
			// Überprüfung, ob das Ziel erreicht wurde
			if (remaining === 0 && (outMode === 'single' || throws.length === 0 || throws[throws.length - 1].startsWith("D"))) {
				if (!bestResult || throws.length < bestResult.length) {
					bestResult = [...throws];
				}
				return true;
			}
			if (remaining <= 0 || throws.length >= 3) return false;

			for (let throwOption of possibleThrows) {
				const isLastThrow = throws.length === 2;
				// Beim letzten Wurf prüfen, ob es ein Double sein muss
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

	// Aktualisiert die verbleibenden Punkte basierend auf den aktuellen Wurfwerten und Multiplikatoren
	$: remaining = targetScore - dartValues.reduce((sum, dart, idx) => sum + (dart || 0) * dartMultipliers[idx], 0);
</script>

<div class="w-full card p-7 bg-primary-500 text-white mb-4">
	<div class="grid grid-cols-3 gap-4">
		{#each Array(dartCount) as _, idx}
			<div
				class="rounded-lg h-9 flex justify-center items-center py-1 {idx === currentThrowIndex
					? 'bg-white border-primary-800 border-2 text-primary-800'
					: 'bg-primary-800 border-primary-800 border-2 text-white'}"
			>
				{#if dartValues[idx] !== null}
					<span>{dartValues[idx]} x {dartMultipliers[idx]}</span>
				{:else}
					{outResults[idx]}
				{/if}
			</div>
		{/each}
	</div>
	<div class="flex flex-row justify-around mt-6">
		<div class="flex flex-col items-center">
			<h3 class="text-primary-800">Throws till finish:</h3>
			<h1 class="h1 text-6xl">{throws}</h1>
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
			on:click={() => { dartValues[currentThrowIndex] = dartValues[currentThrowIndex] === score ? null : score; }}
		>
			{score}
		</button>
	{/each}
	<button
		class="btn btn-lg rounded-lg variant-filled-primary p-0 aspect-square"
		disabled={currentThrowIndex === 0}
		on:click={() => {
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
		on:click={() => {
			if (currentThrowIndex === dartCount - 1) {
				endTurn();
			} else {
				currentThrowIndex++;
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

<div class="sticky bottom-5 flex flex-row justify-center gap-5 mt-5">
	<button class="btn-icon btn-icon-xl variant-filled-error" type="button" on:click={() => { goto('/'); $training = null;}}>
		<LogOutIcon/>
	</button>
</div>
