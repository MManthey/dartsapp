<script lang="ts">
	import { goto } from '$app/navigation';
	import { RadioGroup, RadioItem, SlideToggle, RangeSlider } from '@skeletonlabs/skeleton';
	import { errorToast, successToast } from '$lib/toast';

    import { LogOutIcon } from 'svelte-feather-icons';
    import { game, training } from '$lib/stores';

	import DartSVG from '$lib/components/DartSVG.svelte';
	import Button from '$lib/components/Button.svelte';

	// Reactive assignment to automatically subscribe to the store
	let trainingData = $training;

	let mode = trainingData.mode;
	let trys = trainingData.trys;
	let includeBull = trainingData.includeBull;

	let possNums = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].concat(includeBull ? 25 : []);

	function getRandomNumSet(arr: number[], count: number): number[] {
		// Array kopieren, um das Original nicht zu verändern
		let shuffled = [...arr];

		// Mischen des Arrays
		shuffled.sort(() => Math.random() - 0.5);

		// Slice die ersten `count` Elemente als `randomValues`
		const selectedValues = shuffled.slice(0, count);

		return selectedValues;
	}

	function getRandomStringSet(arr: number[], count: number): string[] {
		// `multiplicator` befüllen und sicherstellen, dass `25` auf "double" gesetzt wird
		let selectedValues = arr.map(value => {
			return value === 25 ? 'double' : Math.random() > 0.5 ? 'double' : 'triple';
		});

		return selectedValues;
	}

	// Verwende die Funktion und speichere das Ergebnis in einer neuen Variablen
	let randomValues = getRandomNumSet(possNums, 8);

	let multiplicator = mode !== 'mixed' ? null : getRandomStringSet(randomValues, 8);
	// anhaengen, 
	let extendedValues = randomValues.concat([randomValues[7]]);

	let extendedMult = mode !== 'mixed' ? null : multiplicator.concat(multiplicator[7]);

	//zaehler fuer dart imgs
	let idx = 0;
	//bei welchem Wurf sind wir
	let throwNr = 0;
	//wie viele Treffer
	let hits = 0;
	//0 = offen, 1 = verfehlt, 2 = getroffen
	let darts = [...Array(8).fill(0)];

	let gameOver = false;

	function hit() {
		hits++;
		darts[throwNr] = 2;
		throwNr++;
		checkDone();
	}

	function miss() {
		darts[throwNr] = 1;
		throwNr++;
		checkDone();
	}

	function checkDone() {
		if (throwNr >= 8) {
			gameOver = true;
		}
	}

	// Reset-Funktion, um das Spiel zurückzusetzen
	function resetGame() {
		hits = 0;
		throwNr = 0;
		darts = [...Array(8).fill(0)];
		randomValues = getRandomNumSet(possNums, 8);
		multiplicator = mode !== 'mixed' ? null : getRandomStringSet(randomValues, 8);
		extendedValues = randomValues.concat([randomValues[7]]);
		extendedMult = mode !== 'mixed' ? null : multiplicator.concat(multiplicator[7]);
		gameOver = false;
	}
</script>

<div class="max-w-xs mx-auto flex flex-col gap-6">
	<div class="text-3xl text-center my-6">Triple Threat</div>

	<div class="w-full card p-4 bg-primary-500 text-white">
		<div class="grid grid-cols-[62%_38%] gap-2">
			<div class="grid grid-cols-2 gap-x-2 gap-y-6 mr-1">
				{#each darts as dart, idx}
					<div
						class="rounded-lg h-7 flex justify-center items-center py-1 {idx === throwNr
							? 'bg-white border-primary-800 border-2 text-primary-800'
							: dart === 0 ? 'bg-customDarkGray' 
							: dart === 2 ? 'bg-primary-800 border-primary-800 border-2 text-white' 
							: 'bg-customStrongRed'}">
						<DartSVG fill={idx === throwNr ? '#16805c' : dart === 0 ? '#a2a2a2' : dart === 2 ? 'white' : '#ca7e7c'} />
					</div>
				{/each}
			</div>

			<div class="grid grid-rows-[62%_38%] flex justify-center">
				<div class="w-[6.8em] h-[6.8em] bg-customDarkGray text-white border-2 border-neutral-500 rounded-full flex justify-center items-center relative">
					<!-- Inner circle with border -->
					<div class="w-[5.9em] h-[5.9em] bg-customDarkGray rounded-full border-2 border-neutral-500 flex flex-col justify-center items-center relative">
						<!-- lines behind the text -->
						<div class="absolute inset-0 flex justify-center items-center z-0">
							<div class="w-full h-[2px] bg-neutral-500"></div> <!-- Horizontal line -->
							<div class="h-full w-[2px] bg-neutral-500 absolute"></div> <!-- Vertical line -->
						</div>
						<!-- Text with correct z-index to ensure "double" is over "10" -->
						<p class="text-base bg-customDarkGray rounded-full font-light mb-[-0.29em] relative z-20">{mode !== 'mixed' ? mode : extendedMult[throwNr]}</p>
						<p class="text-6xl bg-customDarkGray rounded-full pl-2 pr-2 font-bold mt-[-0.1em] relative z-10">{extendedValues[throwNr]}</p>
					</div>
				</div>

				<div class="text-5xl card bg-customDarkGray text-white flex justify-center items-center border-2 border-neutral-500 mt-2 ml-1 mr-1">
					<p class="mb-1"> {hits}/{throwNr}</p>
				</div>
			</div>
		</div>
	</div>

	<div class="textDiv w-full card p-2 text-white text-xl">
		{#if gameOver}
			Game Over, 
			{#if hits === throwNr}
				Good Job!
				{#if trys !== 1}
					Now you could try upping the difficulty by allowing yourself less trys?
					<div class="m-4 mr-8 ml-8 pt-2">
						<Button text="Settings" onClick={() => { goto('/training/triple/settings'); $training = null;}}/>
					</div>
				{:else}
					Want to go again?
					<div class="m-4 mr-8 ml-8 pt-2">
						<Button text="Again!" onClick={resetGame}/>
					</div>
				{/if}
			{:else}
				want to try again to see if you can hit all?
				<div class="m-4 mr-6 ml-6 pt-2">
					<Button text="Try again!" onClick={resetGame}/>
				</div>
			{/if}
		{:else}
			Hit whatever is shown! You have {trys} trys per number.
		{/if}
	</div>

	<div class="flex justify-center items-center mt-4">
		<div class="w-10/12 flex space-x-3 mt-1 twoBtnDiv">
			<Button text="Hit it!" onClick={hit} disabled={gameOver}/>
			<button class="btn w-full redBtn py-2 px-4" on:click={miss} disabled={gameOver}>Missed...</button>
		</div>
	</div>

	<div class="sticky bottom-5 flex flex-row justify-center gap-5 mt-5">
		<button class="btn-icon btn-icon-xl variant-filled-error" type="button" on:click={() => { goto('/'); $training = null;}}>
			<LogOutIcon/>
		</button>
	</div>

	<div class="flex flex-col gap-8 items-center"></div>
</div>

