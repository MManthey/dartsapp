<script lang="ts">
	import { ArrowLeftIcon, ArrowRightIcon, CheckIcon } from 'svelte-feather-icons';
	import { createEventDispatcher } from 'svelte';

	export let outMode: string;
	export let remaining: number;

	const dispatch = createEventDispatcher();
	const dartCount = 3;
	const possibleScores = [...Array(21).keys()].concat([25, 50]);
	const optimalDarts: Dart[] = Array.from({ length: dartCount }, () => ({ s: 20, x: 3 }));

	let darts: Dart[] = Array.from({ length: dartCount }, () => ({ s: null, x: 1 }));
	let i = 0;

	/**
	 * Calculate the remaining score after all throws.
	 * @returns {number} Remaining score
	 */
	function calculateRemaining() {
		const totalThrown = darts.reduce((total, dart) => {
			return total + (dart.s || 0) * dart.x;
		}, 0);

		return remaining - totalThrown;
	}

	$: {
		let remainingPoints = calculateRemaining();

		for (let idx = 0; idx < dartCount; idx++) {
			if (darts[idx].s === null) {
				if (remainingPoints < 0) {
					optimalDarts[idx] = { s: null, x: 1 };
				} else if (remainingPoints <= 0) {
					optimalDarts[idx] = { s: 0, x: 1 };
				} else if (outMode === 'double') {
					if (remainingPoints <= 40 && remainingPoints % 2 === 0) {
						optimalDarts[idx] = { s: remainingPoints / 2, x: 2 };
					} else {
						let found = false;
						for (let j = 0; j < possibleScores.length && !found; j++) {
							const rem = remainingPoints - possibleScores[j];
							if (rem <= 40 && rem % 2 === 0) {
								optimalDarts[idx] = { s: possibleScores[j], x: 1 };
								found = true;
							}
						}
						for (let j = 1; j <= 20 && !found; j++) {
							const rem = remainingPoints - j * 2;
							if (rem <= 40 && rem % 2 === 0) {
								optimalDarts[idx] = { s: j, x: 2 };
								found = true;
							}
						}
						for (let j = 1; j <= 20 && !found; j++) {
							const rem = remainingPoints - j * 3;
							if (rem <= 40 && rem % 2 === 0) {
								optimalDarts[idx] = { s: j, x: 3 };
								found = true;
							}
						}
						if (!found) {
							optimalDarts[idx] = { s: 20, x: 3 };
						}
					}
				} else if (outMode === 'single') {
					if (possibleScores.includes(remainingPoints)) {
						optimalDarts[idx] = { s: remainingPoints, x: 1 };
					} else if (remainingPoints <= 40 && remainingPoints % 2 === 0) {
						optimalDarts[idx] = { s: remainingPoints / 2, x: 2 };
					} else if (remainingPoints <= 60 && remainingPoints % 3 === 0) {
						optimalDarts[idx] = { s: remainingPoints / 3, x: 3 };
					} else {
						let found = false;
						for (let j = 0; j < possibleScores.length && !found; j++) {
							const rem = remainingPoints - possibleScores[j];
							if (possibleScores.includes(rem)) {
								optimalDarts[idx] = { s: possibleScores[j], x: 1 };
								found = true;
							} else if (rem <= 40 && rem % 2 === 0) {
								optimalDarts[idx] = { s: rem / 2, x: 2 };
								found = true;
							} else if (rem <= 60 && rem % 3 === 0) {
								optimalDarts[idx] = { s: rem / 3, x: 3 };
								found = true;
							}
						}
						for (let j = 1; j <= 20 && !found; j++) {
							const rem = remainingPoints - j * 2;
							if (possibleScores.includes(rem)) {
								optimalDarts[idx] = { s: possibleScores[j], x: 1 };
								found = true;
							} else if (rem <= 40 && rem % 2 === 0) {
								optimalDarts[idx] = { s: rem / 2, x: 2 };
								found = true;
							} else if (rem <= 60 && rem % 3 === 0) {
								optimalDarts[idx] = { s: rem / 3, x: 3 };
								found = true;
							}
						}
						for (let j = 1; j <= 20 && !found; j++) {
							const rem = remainingPoints - j * 3;
							if (possibleScores.includes(rem)) {
								optimalDarts[idx] = { s: possibleScores[j], x: 1 };
								found = true;
							} else if (rem <= 40 && rem % 2 === 0) {
								optimalDarts[idx] = { s: rem / 2, x: 2 };
								found = true;
							} else if (rem <= 60 && rem % 3 === 0) {
								optimalDarts[idx] = { s: rem / 3, x: 3 };
								found = true;
							}
						}
						if (!found) {
							optimalDarts[idx] = { s: 20, x: 3 };
						}
					}
				}

				// Update remaining points for next dart
				remainingPoints -= optimalDarts[idx].x * optimalDarts[idx].s;
			}
		}
	}

	/**
	 * Convert dart to a string representation.
	 * @param {Dart} dart - The dart to represent.
	 * @returns {string} String representation of the dart.
	 */
	function dartStr(dart: Dart) {
		const score = dart.s !== null ? dart.s.toString() : 'Bust';
		const preFix = dart.x === 1 ? '' : dart.x === 2 ? 'D' : 'T';
		return preFix + score;
	}

	/** Reset darts to their initial state. */
	function resetDarts() {
		darts = Array.from({ length: dartCount }, () => ({ s: null, x: 1 }));
		i = 0;
	}

	/** Set darts and update the remaining score. */
	function setDarts() {
		dispatch('scoreInput', [...darts]);
		remaining = calculateRemaining();
		resetDarts();
	}
</script>

<div class="w-full">
	<div class="grid grid-cols-3 mb-5 gap-5">
		{#each darts as dart, idx}
			<button
				class="btn btn-lg rounded-lg {idx === i ? 'variant-ghost' : 'variant-filled'}"
				on:click={() => (i = idx)}
			>
				<span class={dart.s === null ? 'italic opacity-30' : ''}>
					{#if dart.s === null}
						<span class="italic opacity-30">{dartStr(optimalDarts[idx])}</span>
					{:else}
						<span>{dartStr(darts[idx])}</span>
					{/if}
				</span></button
			>
		{/each}
	</div>
	<div class="grid grid-cols-4 sm:grid-cols-5 gap-2">
		{#each possibleScores as score}
			<button
				class="btn btn-lg rounded-lg {darts[i].s === score ? 'variant-ghost' : 'variant-filled'}"
				disabled={score > 20 && darts[i].x !== 1}
				on:click={() => {
					if (darts[i].s === score) {
						darts[i].s = null;
					} else {
						darts[i].s = score;
						i < dartCount - 1 && i++;
					}
				}}
			>
				{score}
			</button>
		{/each}
		<button
			class="btn btn-lg rounded-lg {darts[i].x === 2 ? 'variant-ghost' : 'variant-filled'}"
			disabled={(darts[i].s || 0) > 20}
			on:click={() => (darts[i].x = darts[i].x === 2 ? 1 : 2)}
		>
			D
		</button>
		<button
			class="btn btn-lg rounded-lg {darts[i].x === 3 ? 'variant-ghost' : 'variant-filled'}"
			disabled={(darts[i].s || 0) > 20}
			on:click={() => (darts[i].x = darts[i].x === 3 ? 1 : 3)}
		>
			T
		</button>
		<button
			class="btn btn-lg rounded-lg variant-filled-secondary mt-3"
			disabled={i === 0}
			on:click={() => (darts[i--] = { s: null, x: 1 })}
		>
			<ArrowLeftIcon class="min-w-min" />
		</button>
		<button
			class="btn btn-lg rounded-lg variant-filled-secondary mt-3"
			disabled={i === dartCount - 1 || darts[i].s === null}
			on:click={() => i++}
		>
			<ArrowRightIcon class="min-w-min" />
		</button>
		<button
			class="btn btn-lg rounded-lg variant-filled-success sm:col-start-5 mt-3"
			disabled={darts.some((dart) => dart.s === null)}
			on:click={setDarts}
		>
			<CheckIcon class="min-w-min" />
		</button>
	</div>
</div>
