<script lang="ts">
	import { goto } from '$app/navigation';
	import { CheckIcon, ChevronLeftIcon, ChevronRightIcon, LogOutIcon } from 'svelte-feather-icons';
	import { ProgressRadial } from '@skeletonlabs/skeleton';

	import { training } from '$lib/stores';
	import DartSVG from '$lib/components/DartSVG.svelte';
	import Button from '$lib/components/Button.svelte';


	// Reactive assignment to automatically subscribe to the store
	let trainingData = $training;

	let max = trainingData.max;
	let throws = trainingData.throws;
	let outMode = trainingData.out;

	const possibleScores = [...Array(21).keys()].concat([25]);
	let remaining = trainingData.max;
	let currentThrowIndex = 0;
	let dartValues = Array(throws).fill(null);
	let dartMultipliers = Array(throws).fill(1);
	let possibleOutBools = Array(throws).fill(true);
	let isLoading = false;

	let targetScore;
	let outResults;
	let throwsTillFinish = throws;

	//True, wenn 0, aber nicht via double bei double out
	let notDoubleOut = false;

	let throwCount = 0;

	$: possibleOutClasses = possibleOutBools[currentThrowIndex] ? "" : currentThrowIndex >= throws ? "" : "line-through";
	let scoreInputClass = "";
	let endInfoClass = "hidden";
	let endInfoText = "";

	let endPlay = false;

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
		while (outResults.length < 3) {
			outResults.push("undefined");
		}
	}

	generateValidTargetScore();

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
	 * No parameters.
	 */
	function updateOutResults() {
		const newOutResults = calculateFastestOut(remaining, outMode);

		while (newOutResults.length < 3) {
			newOutResults.push("undefined");
		}

		outResults = newOutResults;
	}

	function calculateFastestOut(targetScore: number, outMode: 'single' | 'double'): string[] {
    const possibleThrows = [
        { label: "BULL", value: 50, multiplier: 1 },
        { label: "25", value: 25, multiplier: 1 },
        ...Array.from({ length: 20 }, (_, i) => ({ label: `${i + 1}`, value: i + 1, multiplier: 1 })),
        ...Array.from({ length: 20 }, (_, i) => ({ label: `D${i + 1}`, value: (i + 1) * 2, multiplier: 2 })),
        ...Array.from({ length: 20 }, (_, i) => ({ label: `T${i + 1}`, value: (i + 1) * 3, multiplier: 3 })),
    ];

    let bestResult: string[] | null = null;

    function findOut(remaining: number, throws: string[]): void {
        // Überprüfung, ob das Ziel erreicht wurde
        if (remaining === 0 && (outMode === 'single' || throws.length === 0 || throws[throws.length - 1].startsWith("D"))) {
            if (!bestResult || throws.length < bestResult.length) {
                bestResult = [...throws]; // Speichere das beste Ergebnis
            }
            return;
        }

        if (remaining <= 0 || throws.length >= 3) return;

        for (let throwOption of possibleThrows) {
            const isLastThrow = throws.length === 2;

            // Beim letzten Wurf prüfen, ob es ein Double sein muss
            if (isLastThrow && outMode === 'double' && throwOption.multiplier !== 2) continue;

            const newRemaining = remaining - throwOption.value;

            // Füge den aktuellen Wurf hinzu und fahre mit der Suche fort
            findOut(newRemaining, [...throws, throwOption.label]);
        }
    }

    // Starte die Suche
    findOut(targetScore, []);

    // Rückgabe des besten Ergebnisses oder "Kein Out möglich"
    if (bestResult && bestResult.length > 0) {
        while (bestResult.length < 3) {
            bestResult.push("undefined"); // Fülle mit "undefined", wenn weniger als 3 Würfe benötigt werden
        }
    }

	//pruefen ob 0
	if (targetScore === 0) {
		bestResult = undefined;
	}

    return bestResult || ["Kein Out möglich"];
}

	/**
	 * überprüft das mögliche Out auf machbarkeit anhand der übrigen Throws
	 */
	function checkOuts() {
		if (outResults[0] === "undefined" 
		|| (outResults[1] !== "undefined" && throwsTillFinish <= 1) 
		|| (outResults[2] !== "undefined" && throwsTillFinish <= 2)) {
			outResults = Array(3).fill("undefined");
			possibleOutBools[currentThrowIndex] = false;
		}
	}

	/**
	 * Confirms the input and changes overlay depending on the new scores/ throws
	 */
	function confirmThrow() {
		currentThrowIndex++;
		const hitScore = (dartValues[currentThrowIndex] || 0) * dartMultipliers[currentThrowIndex];
		let newRemaining = remaining < 0 ? remaining + (dartValues[currentThrowIndex - 1] * dartMultipliers[currentThrowIndex - 1]) : remaining;

		if (remaining === 0 && outMode === 'double' && dartMultipliers[currentThrowIndex - 1] < 2) {
			newRemaining = remaining + (dartValues[currentThrowIndex - 1] * dartMultipliers[currentThrowIndex - 1]);
			notDoubleOut = true;
		} else if (dartMultipliers[currentThrowIndex] >= 2) {
			notDoubleOut = false;
		}

		if (newRemaining !== remaining) {
			dartValues[currentThrowIndex - 1] = 0;
		}
		remaining = newRemaining;
		let newOutResults;

		if (throwsTillFinish !== 7) {
			throwsTillFinish--;
		}
		throwCount++;
		//TODO ist das if richtig?
		if (newRemaining === 0 || throwsTillFinish === 0) {
			endPlay = true;
		} else {
			updateOutResults();
			checkOuts();
		}
	}

	//Setzt Alle Werte zurück auf Anfang und beginnt das Spiel von neu, mit neuen random Werten
	function resetGame() {
		dartValues.fill(null); // Clear all dart values
		dartMultipliers.fill(1); // Reset all multipliers to 1
		possibleOutBools.fill(true); // Reset possible out tracking
		currentThrowIndex = 0; // Reset the current dart index
		throwsTillFinish = throws; // Reset the throws remaining
		endPlay = false; // Reset the end play flag
		isLoading = false; // Ensure loading is reset
		generateValidTargetScore(); // Generate new target score and out results
		remaining = targetScore;
		throwCount = 0;
		updateOutResults(); // Update out results based on the new target score
	}

	// Re-calculate remaining points based on dart values and multipliers.
	$: remaining = targetScore - dartValues.reduce((sum, dart, idx) => sum + (dart || 0) * dartMultipliers[idx], 0);
</script>

<div class="max-w-xs mx-auto flex flex-col gap-7">
	<div class="text-3xl text-center my-6">Checkout Blitz</div>
</div>

<div class="w-full card p-7 bg-primary-500 text-white mb-4">
	<h3 class="mb-2 text-primary-800 {possibleOutClasses}">Possible Out:</h3>
	<div class="grid grid-cols-3 gap-4">
		{#each outResults as result, idx}
			<div
				class="rounded-lg h-9 flex justify-center items-center py-1 {idx === ""
					? 'bg-white border-primary-800 border-2 text-primary-800'
					: 'bg-primary-800 border-primary-800 border-2 text-white'}"
			>
				{#if result === "undefined"}
					<DartSVG fill={idx === "" ? '#16805c' : 'white'} />
				{:else}
					{result}
				{/if}
			</div>
		{/each}
	</div>
	<div class="flex flex-row justify-around mt-6">
		<div class="flex flex-col items-center">
			<h3 class="text-primary-800">
				{#if throwsTillFinish === 7}
					Throws Count:
				{:else}
					Throws till finish:
				{/if}
			</h3>
			<h1 class="h1 text-6xl">
				{#if throwsTillFinish === 7}
					{throwCount}
				{:else}
					{throwsTillFinish}
				{/if}
			</h1>
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
<!-- Score Eingabe -->
{#if !endPlay}
	<div class="w-full grid grid-cols-3 gap-2 mb-4">
		<button
			class="btn btn-lg rounded-lg h-[66%] {dartMultipliers[currentThrowIndex] === 1 ? 'variant-ghost-primary' : 'variant-ghost border-token border-surface-400-500-token'}"
			on:click={() => { dartMultipliers[currentThrowIndex] = 1; }}
		>
			Single
		</button>
		<button
			class="btn btn-lg rounded-lg h-[66%] {dartMultipliers[currentThrowIndex] === 2 ? 'variant-ghost-primary' : 'variant-ghost border-token border-surface-400-500-token'}"
			on:click={() => { dartMultipliers[currentThrowIndex] = dartMultipliers[currentThrowIndex] === 2 ? 1 : 2; }}
		>
			Double
		</button>
		<button
			class="btn btn-lg rounded-lg h-[66%] {dartMultipliers[currentThrowIndex] === 3 ? 'variant-ghost-primary' : 'variant-ghost border-token border-surface-400-500-token'}"
			disabled={dartValues[currentThrowIndex] === 25}
			on:click={() => { dartMultipliers[currentThrowIndex] = dartMultipliers[currentThrowIndex] === 3 ? 1 : 3; }}
		>
			Triple
		</button>
	</div>

	<div class="w-full -mt-4">
		<div class="w-full grid grid-cols-5 gap-2">
			{#each possibleScores as score}
				{#if score <= 19} 
					<button
						class="btn btn-lg rounded-lg p-0 aspect-square
							{dartValues[currentThrowIndex] === score ? 'variant-ghost-primary' : 'variant-ghost border-token border-surface-400-500-token'}"
						on:click={() => { dartValues[currentThrowIndex] = dartValues[currentThrowIndex] === score ? null : score; }}
					>
						{score}
					</button>
				{/if}
			{/each}
		</div>
		<div class="w-full mt-2 grid grid grid-cols-10 gap-2">
			<button
				class="btn btn-lg rounded-lg p-0 aspect-square col-span-2
					{dartValues[currentThrowIndex] === 20 ? 'variant-ghost-primary' : 'variant-ghost border-token border-surface-400-500-token'}"
				on:click={() => { dartValues[currentThrowIndex] = dartValues[currentThrowIndex] === 20 ? null : 20; }}
			>
				20
			</button>
			<button
				class="btn btn-lg rounded-lg p-0 aspect-square col-span-2
					{dartValues[currentThrowIndex] === 25 ? 'variant-ghost-primary' : 'variant-ghost border-token border-surface-400-500-token'}"
				disabled={dartMultipliers[currentThrowIndex] === 3}
				on:click={() => { dartValues[currentThrowIndex] = dartValues[currentThrowIndex] === 25 ? null : 25; }}
			>
				25
			</button>
			<button
				class="btn btn-lg rounded-lg variant-filled-primary p-0 col-span-3"
				disabled={currentThrowIndex === 0}
				on:click={() => {
					remaining += dartValues[currentThrowIndex - 1] * dartMultipliers[currentThrowIndex - 1];
					dartValues[currentThrowIndex] = null;
					dartMultipliers[currentThrowIndex] = 1;
					possibleOutBools[currentThrowIndex] = true;
					currentThrowIndex--;
					throwsTillFinish++;
					throwCount--;
					updateOutResults();
					checkOuts();
				}}
			>
				<ChevronLeftIcon />
			</button>
			<button
				class="btn btn-lg rounded-lg variant-filled-primary p-0 col-span-3"
				disabled={dartValues[currentThrowIndex] === null}
				on:click={() => {
					confirmThrow();
					if (dartMultipliers[currentThrowIndex] !== 2 && dartMultipliers[currentThrowIndex] !== 3) {
						dartMultipliers[currentThrowIndex] = 1;
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
	</div>
{:else}
	<!-- wird angezeigt, wenn Spiel vorbei -->
	<div class="ml-10 mr-10 textDiv flex flex-col items-center card p-2 text-white text-xl">
		Game Over.
		{#if throwsTillFinish === 7}
			Nice!
			Want to go again?
			<div class="w-1/2 m-4 mr-8 ml-8 pt-2">
				<Button text="Again!" onClick={resetGame}/>
			</div>
		{:else}
			{#if throwsTillFinish > 0}
				Good job!
				<!-- geschafft mit weniger versuchen -->
				{#if throws > 3}
					<!-- mit mehr als 3 würfen -->
					Maybe try giving yourself less throws?
					<div class="w-1/2 m-4 mr-8 ml-8 pt-2">
						<Button text="Settings" onClick={() => { goto('/training/checkout/settings'); $training = null;}}/>
					</div>
				{:else}
					<!-- mit nur 3 würfen -->
					Want to go again?
					<div class="w-1/2 m-4 mr-8 ml-8 pt-2">
						<Button text="Again!" onClick={resetGame}/>
					</div>
				{/if}
			{:else}
				{#if remaining > 0 || remaining < 0 || (outMode === 'double' && notDoubleOut)}
					<!-- nicht geschafft-->
					Want to try again to see if you can do it?
					<div class="w-1/2 m-4 mr-6 ml-6 pt-2">
						<Button text="Try again!" onClick={resetGame}/>
					</div>
				{:else}
					Good job!
					<!-- geschafft, gerade so -->
					Want to go again?
					<div class="w-1/2 m-4 mr-8 ml-8 pt-2">
						<Button text="Again!" onClick={resetGame}/>
					</div>
				{/if}
			{/if}
		{/if}
	</div>
{/if}
<!--------------------------------------->

<div class="sticky bottom-5 flex flex-row justify-center gap-5 mt-5">
	<button class="btn-icon btn-icon-xl variant-filled-error" type="button" on:click={() => { goto('/'); $training = null;}}>
		<LogOutIcon/>
	</button>
</div>
