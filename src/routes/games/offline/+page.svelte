<script lang="ts">
	import Scoreboard from '$lib/components/Scoreboard.svelte';
	import ScoreInput from '$lib/components/ScoreInput.svelte';

	import { goto } from '$app/navigation';
	import { game, players } from '$lib/stores';
	import { LogOutIcon } from 'svelte-feather-icons';
	import { modalStore } from '@skeletonlabs/skeleton';
	import type { ModalSettings } from '@skeletonlabs/skeleton';

	/**
	 * Handle the end of a player's turn.
	 * Update the player's state and the game's state based on the darts thrown.
	 * @param {CustomEvent<Dart[]>} event - Event containing the darts thrown by the player.
	 */
	async function endTurn(event: CustomEvent<Dart[]>) {
		// $game must be set
		if (!$game) return;

		const darts = event.detail;
		const index = $game.turnIdx;
		let { remaining, scores, avg, legs, sets } = $players[index];

		let score = darts.reduce((total, dart) => {
			return total + (dart.s || 0) * dart.x;
		}, 0);

		const doubles = darts.filter((darts) => darts.s !== 0 && darts.x === 2);
		const bust = score > remaining;
		const pointsFit = score === remaining;
		const brokeDoubles = pointsFit && $game?.outMode === 'double' && !doubles.pop();

		score = bust || brokeDoubles ? 0 : score;

		remaining = remaining - score;
		scores = scores ? [...scores, score] : [score];
		avg = scores.reduce((a, b) => a + b, 0) / scores.length;

		// was leg won? -> increment player legs, reset score
		const legWon = remaining === 0;
		if (legWon) {
			legs += 1;
			// was set won? -> increment player sets, reset legs and score
			const setWon = legs === $game.legs;
			if (setWon) {
				sets += 1;
				$players[index] = { ...$players[index], sets };
				for (let i = 0; i < $game.size; i++) {
					$players[i] = {
						...$players[i],
						legs: 0,
						remaining: Number($game.gameMode),
						scores: [],
						avg: 0
					};
				}
			} else {
				$players[index] = { ...$players[index], legs };
				for (let i = 0; i < $game.size; i++) {
					$players[i] = { ...$players[i], remaining: Number($game.gameMode), scores: [], avg: 0 };
				}
			}
		} else {
			$players[index] = { ...$players[index], remaining, scores, avg };
		}

		// was game won? -> end the game
		const gameWon = sets === $game.sets;

		const turnIdx =
			legWon || $game.size === 1 ? 0 : gameWon ? $game.turnIdx : (index + 1) % $game.size;
		const state = gameWon ? 'over' : $game.state;

		$game = { ...$game, state, turnIdx };

		if (gameWon) {
			const modal: ModalSettings = {
				type: 'alert',
				title: 'We have a winner!',
				body: `Congratulations to ${$players[$game.turnIdx].name}!`
			};
			modalStore.trigger(modal);
		}
	}
</script>

<div class="flex flex-col gap-12 items-center">
	{#if $game?.state === 'closed'}
		<ScoreInput index={$game.turnIdx} />
	{/if}
	<Scoreboard game={$game} players={$players} />
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
