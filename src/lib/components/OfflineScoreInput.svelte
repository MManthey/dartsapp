<script lang="ts">
	import { CheckIcon, ChevronLeftIcon, ChevronRightIcon } from 'svelte-feather-icons';
	import { ProgressRadial, Ratings } from '@skeletonlabs/skeleton';

	import { game, players } from '$lib/stores';
	import { dartStr, dartTotal } from '$lib/util';
	import { errorToast } from '$lib/toast';
	import { gameData } from '../../store/localStore';

	import DartSVG from './DartSVG.svelte';

	export let index: number;

	//special Day calc for data storage
	const currentDate = new Date();
	let currentDay = Math.floor(
            (Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()) -
                Date.UTC(currentDate.getFullYear(), 0, 1)) /
                (24 * 60 * 60 * 1000)
        );
	let addWins = 0;
	let addLoss = 0;
	let outs = 0;
	let nonOuts = 0;
	let allDarts: Dart[] = [];

	const dartCount = 3;
	const possibleScores = [...Array(21).keys()].concat([25]);
	const optimalDarts: [Dart, Dart, Dart] = [
		{ s: 20, x: 3 },
		{ s: 20, x: 3 },
		{ s: 20, x: 3 }
	];

	let isLoading = false;

	$: player = $players[index];
	$: darts = player.darts;
	$: i = player.dartIdx;
	$: score = dartTotal(darts);
	$: remaining = player.remaining - score;
	$: allSet = darts.every((dart) => dart.s !== null) || remaining <= 0;

	// Reactively calculate darts to reduce remaining to 0.
	$: {
		let remainingPoints = player.remaining;
		const allScores = [...possibleScores, 50];

		for (let idx = 0; idx < dartCount; idx++) {
			if (darts[idx].s === null) {
				if (remainingPoints <= 0 || ($game?.outMode === 'double' && remainingPoints === 1)) {
					optimalDarts[idx] = { s: null, x: 1 };
				} else if ($game?.outMode === 'double') {
					if ((remainingPoints <= 40 || remainingPoints === 50) && remainingPoints % 2 === 0) {
						optimalDarts[idx] =
							remainingPoints === 50
								? { s: remainingPoints, x: 1 }
								: { s: remainingPoints / 2, x: 2 };
					} else {
						let found = false;
						for (let j = 0; j < allScores.length && !found; j++) {
							const rem = remainingPoints - allScores[j];
							if ((rem <= 40 || rem === 50) && rem % 2 === 0) {
								optimalDarts[idx] = { s: allScores[j], x: 1 };
								found = true;
							}
						}
						for (let j = 1; j <= 20 && !found; j++) {
							const rem = remainingPoints - j * 2;
							if ((rem <= 40 || rem === 50) && rem % 2 === 0) {
								optimalDarts[idx] = { s: j, x: 2 };
								found = true;
							}
						}
						for (let j = 1; j <= 20 && !found; j++) {
							const rem = remainingPoints - j * 3;
							if ((rem <= 40 || rem === 50) && rem % 2 === 0) {
								optimalDarts[idx] = { s: j, x: 3 };
								found = true;
							}
						}
						if (!found) {
							optimalDarts[idx] = { s: 20, x: 3 };
						}
					}
				} else if ($game?.outMode === 'single') {
					if (allScores.includes(remainingPoints)) {
						optimalDarts[idx] = { s: remainingPoints, x: 1 };
					} else if (remainingPoints <= 40 && remainingPoints % 2 === 0) {
						optimalDarts[idx] = { s: remainingPoints / 2, x: 2 };
					} else if (remainingPoints <= 60 && remainingPoints % 3 === 0) {
						optimalDarts[idx] = { s: remainingPoints / 3, x: 3 };
					} else {
						let found = false;
						for (let j = 0; j < allScores.length && !found; j++) {
							const rem = remainingPoints - allScores[j];
							if (allScores.includes(rem)) {
								optimalDarts[idx] = { s: allScores[j], x: 1 };
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
							if (allScores.includes(rem)) {
								optimalDarts[idx] = { s: allScores[j], x: 1 };
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
							if (allScores.includes(rem)) {
								optimalDarts[idx] = { s: allScores[j], x: 1 };
								found = true;
							} else if (rem <= 40 && rem % 2 === 0) {
								optimalDarts[idx] = { s: rem / 2, x: 2 };
								found = true;
							} else if (rem <= 60 && rem % 3 === 0) {
								optimalDarts[idx] = { s: rem / 3, x: 3 };
								found = true;
							}
							if (!found) {
								optimalDarts[idx] = { s: 20, x: 3 };
							}
						}
					}
				}
			} else {
				optimalDarts[idx] = { ...darts[idx] };
			}
			// Update remaining points for next dart
			remainingPoints -= optimalDarts[idx].x * optimalDarts[idx].s;
		}
		console.table(optimalDarts);
	}

	/**
	 *
	 */
	async function endTurn() {
		isLoading = true;
		try {
			if (!$game) throw new Error('An unknown error occured.');

			let { remaining: oldRemaining, scores, avg, legs, sets } = player;

			const doubles = darts.filter((darts) => darts.s !== 0 && darts.x === 2);
			const difference = oldRemaining - score;
			const bust = difference < 0 || ($game.outMode === 'double' && difference === 1);
			const pointsFit = score === oldRemaining;
			const brokeDoubles = pointsFit && $game.outMode === 'double' && !doubles.pop();

			score = bust || brokeDoubles ? 0 : score;
			const newRemaining = oldRemaining - score;

			scores = scores ? [...scores, score] : [score];
			avg = scores.reduce((a, b) => a + b, 0) / scores.length;

			// was leg won? -> increment player legs, reset score
			const legWon = newRemaining === 0;

			let gameWon = false;

			//nur hinzufügen, wenn erster Spieler
			if (index === 0) {
				//add darts to stats
				allDarts.push({ ...darts[0] }, { ...darts[1] }, { ...darts[2] });
			}

			if (legWon) {
				if (index === 0) {
					outs++;
				}
				if (nonOuts > 0) {
					nonOuts--;
				}
				legs += 1;
				// was set won? -> increment player sets, reset legs and score
				const setWon = legs === $game.legs;
				if (setWon) {
					sets += 1;
					gameWon = sets === $game.sets;

					if (gameWon) {
						//win/lose + adding stats to store
						if (index === 0) {
							addWins += 1;
						} else {
							addLoss += 1;
						}
						gameData.addDataSet(currentDay, addWins > 0 ? true : addLoss > 0 ? false : null, outs, nonOuts, allDarts);

						$players[index] = {
							...player,
							remaining: newRemaining,
							scores,
							avg,
							sets
						};
					} else {
						for (let idx = 0; idx < $game.size; idx++) {
							if (i === idx) {
								$players[index] = {
									...player,
									darts: [
										{ s: null, x: 1 },
										{ s: null, x: 1 },
										{ s: null, x: 1 }
									],
									dartIdx: 0,
									sets
								};
							} else {
								$players[idx] = {
									...$players[idx],
									legs: 0,
									remaining: Number($game.gameMode),
									scores: [],
									avg: 0
								};
							}
						}
					}
				} else {
					$players[index] = {
						...player,
						darts: [
							{ s: null, x: 1 },
							{ s: null, x: 1 },
							{ s: null, x: 1 }
						],
						dartIdx: 0,
						legs
					};
					for (let idx = 0; idx < $game.size; idx++) {
						$players[idx] = {
							...$players[idx],
							remaining: Number($game.gameMode),
							scores: [],
							avg: 0
						};
					}
				}
			} else {
				$players[index] = {
					...player,
					remaining: newRemaining,
					darts: [
						{ s: null, x: 1 },
						{ s: null, x: 1 },
						{ s: null, x: 1 }
					],
					dartIdx: 0,
					scores,
					avg
				};
			}

			// was game won? -> end the game
			const turnIdx = gameWon
				? $game.turnIdx
				: legWon || $game.size === 1
				? 0
				: (index + 1) % $game.size;
			const state = gameWon ? 'over' : $game.state;

			$game = { ...$game, state, turnIdx };
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : 'Unknown error while setting score.';
			console.error(msg);
			errorToast(msg);
		} finally {
			isLoading = false;
		}
	}

	let checkThrowCount = 0;
	/**
	 * Checks if the player had a one throw out
	 */
	function checkOuts() {
		if (index === 0) {
			let rem = player.remaining;
			for (let i = 0; i < checkThrowCount + 1; i++) {
				rem -= darts[i].s * darts[i].x;
			}
			console.log("remain: " + rem);
			console.log("checkCount: " + checkThrowCount);
			if (index === 0 && rem <= 60 
				&& (($game?.outMode === 'double' && (rem <= 40 && rem % 2 === 0)) 
				|| ($game?.outMode === 'single' && (rem <= 20 || (rem <= 40 && rem % 2 === 0) || (rem % 3 === 0)))) ) {
				nonOuts++;
			}
			checkThrowCount = (checkThrowCount + 1) % 3;
		}
	}
</script>

<div class="w-full card p-7 bg-primary-500 text-white">
	<div class="grid grid-cols-3 gap-4">
		{#each darts as dart, idx}
			<div
				class="rounded-lg h-9 flex justify-center items-center py-1 {idx === i
					? 'bg-white border-primary-800 border-2 text-primary-800'
					: 'bg-primary-800 border-primary-800 border-2 text-white'}"
			>
				{#if dart.s !== null}
					<span>{dartStr(darts[idx])}</span>
				{:else if player.remaining - dartTotal(optimalDarts) === 0 && optimalDarts[idx].s}
					<span class="italic opacity-70">{dartStr(optimalDarts[idx])}</span>
				{:else}
					<DartSVG fill={idx === i ? '#16805c' : 'white'} />
				{/if}
			</div>
		{/each}
	</div>
	<div class="flex flex-row justify-around mt-6">
		<div class="flex flex-col gap-2">
			<h3 class="h3">{player.name}</h3>
			<div class="flex flex-row gap-2 justify-start items-center">
				<div class="w-10 text-primary-800">Legs</div>
				<Ratings bind:value={player.legs} max={$game?.legs} fill="fill-white">
					<svelte:fragment slot="full">
						<svg
							class="w-5 md:w-5 lg:w-5 aspect-square"
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 512 512"
							><path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512z" />
						</svg>
					</svelte:fragment>
					<svelte:fragment slot="half">
						<svg
							class="w-5 md:w-5 lg:w-5 aspect-square"
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 512 512"
							><path
								d="M448 256c0-106-86-192-192-192V448c106 0 192-86 192-192zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256z"
							/>
						</svg>
					</svelte:fragment>
					<svelte:fragment slot="empty">
						<svg
							class="w-5 md:w-5 lg:w-5 aspect-square"
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 512 512"
						>
							<path
								d="M464 256A208 208 0 1 0 48 256a208 208 0 1 0 416 0zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256z"
							/>
						</svg>
					</svelte:fragment>
				</Ratings>
			</div>
			<div class="flex flex-row gap-2 justify-start items-center">
				<div class="w-10 text-primary-800">Sets</div>
				<Ratings bind:value={player.sets} max={$game?.sets} fill="fill-white">
					<svelte:fragment slot="full">
						<svg
							class="w-5 md:w-5 lg:w-5 aspect-square"
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 512 512"
							><path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512z" />
						</svg>
					</svelte:fragment>
					<svelte:fragment slot="half">
						<svg
							class="w-5 md:w-5 lg:w-5 aspect-square"
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 512 512"
							><path
								d="M448 256c0-106-86-192-192-192V448c106 0 192-86 192-192zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256z"
							/>
						</svg>
					</svelte:fragment>
					<svelte:fragment slot="empty">
						<svg
							class="w-5 md:w-5 lg:w-5 aspect-square"
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 512 512"
						>
							<path
								d="M464 256A208 208 0 1 0 48 256a208 208 0 1 0 416 0zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256z"
							/>
						</svg>
					</svelte:fragment>
				</Ratings>
			</div>
		</div>
		<div class="flex flex-col justify-center">
			<div class="text-primary-800">{$game?.outMode} out</div>
			<div class="h1 text-center text-6xl">
				{$game?.state === 'over' && $game.turnIdx === index ? 0 : remaining}
			</div>
		</div>
	</div>
</div>
{#if $game?.state === 'closed' && $game.turnIdx === index}
	<div class="w-full grid grid-cols-3 gap-2">
		<button
			class="btn btn-lg rounded-lg {darts[i].x === 1
				? 'variant-ghost-primary'
				: 'variant-ghost border-token border-surface-400-500-token'}"
			on:click={async () => {
				darts[i].x = 1;
			}}
		>
			Single
		</button>
		<button
			class="btn btn-lg rounded-lg {darts[i].x === 2
				? 'variant-ghost-primary'
				: 'variant-ghost border-token border-surface-400-500-token'}"
			on:click={async () => {
				darts[i].x = darts[i].x === 2 ? 1 : 2;
			}}
		>
			Double
		</button>
		<button
			class="btn btn-lg rounded-lg {darts[i].x === 3
				? 'variant-ghost-primary'
				: 'variant-ghost border-token border-surface-400-500-token'}"
			disabled={(darts[i].s || 0) > 20}
			on:click={async () => {
				darts[i].x = darts[i].x === 3 ? 1 : 3;
			}}
		>
			Tripple
		</button>
	</div>
	<div class="w-full grid grid-cols-6 gap-2">
		{#each possibleScores as score}
			<button
				class="btn btn-lg rounded-lg p-0 aspect-square
					{darts[i].s === score
					? 'variant-ghost-primary'
					: 'variant-ghost border-token border-surface-400-500-token'}"
				disabled={score === 25 && darts[i].x === 3}
				on:click={async () => {
					darts[i].s = darts[i].s === score ? null : score;
				}}
			>
				{score}
			</button>
		{/each}
		<button
			class="btn btn-lg rounded-lg variant-filled-primary p-0 aspect-square"
			disabled={i === 0}
			on:click={async () => {
				darts[i] = { s: null, x: 1 };
				i--;
			}}
		>
			<ChevronLeftIcon />
		</button>
		<button
			class="btn btn-lg rounded-lg variant-filled-primary p-0 aspect-square"
			disabled={darts[i].s === null}
			on:click={async () => {
				checkOuts();
				if (allSet) {
					await endTurn();
				} else {
					i++;
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
{/if}
