<script lang="ts">
	import Scoreboard from '$lib/components/Scoreboard.svelte';
	import ScoreInput from '$lib/components/ScoreInput.svelte';

	import { goto } from '$app/navigation';
	import { game, players } from '$lib/stores';
	import { LogOutIcon } from 'svelte-feather-icons';
	import { Modal, modalStore } from '@skeletonlabs/skeleton';
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
		const index = $game.turn;
		let { remaining, throws, avg, legs, sets } = $players[index];

		let points = darts.reduce((total, dart) => {
			return total + (dart.s || 0) * dart.x;
		}, 0);

		const doubles = darts.filter((darts) => darts.s !== 0 && darts.x === 2);
		const bust = points > remaining;
		const pointsFit = points === remaining;
		const brokeDoubles = pointsFit && $game?.outMode === 'double' && !doubles.pop();

		points = bust || brokeDoubles ? 0 : points;

		remaining = remaining - points;
		throws = throws ? [...throws, points] : [points];
		avg = throws.reduce((a, b) => a + b, 0) / throws.length;

		// was leg won? -> increment player legs, reset points
		const legWon = remaining === 0;
		if (legWon) {
			legs += 1;
			// was set won? -> increment player sets, reset legs and points
			const setWon = legs === $game.legs;
			if (setWon) {
				sets += 1;
				$players[index] = { ...$players[index], sets };
				for (let i = 0; i < $game.size; i++) {
					$players[i] = {
						...$players[i],
						legs: 0,
						remaining: Number($game.gameMode),
						throws: [],
						avg: 0
					};
				}
			} else {
				$players[index] = { ...$players[index], legs };
				for (let i = 0; i < $game.size; i++) {
					$players[i] = { ...$players[i], remaining: Number($game.gameMode), throws: [], avg: 0 };
				}
			}
		} else {
			$players[index] = { ...$players[index], remaining, throws, avg };
		}

		// was game won? -> end the game
		const gameWon = sets === $game.sets;

		const turn = legWon || $game.size === 1 ? 0 : gameWon ? $game.turn : (index + 1) % $game.size;
		const state = gameWon ? 'over' : $game.state;

		$game = { ...$game, state, turn };

		if (gameWon) {
			const modal: ModalSettings = {
				type: 'alert',
				title: 'We have a winner!',
				body: `Congratulations to ${$players[$game.turn].name}!`
			};
			modalStore.trigger(modal);
		}
	}
</script>

<div class="flex flex-col gap-12 items-center">
	{#if $game?.state === 'closed'}
		<ScoreInput
			on:scoreInput={endTurn}
			outMode={$game.outMode}
			remaining={$players[$game.turn].remaining || Number($game.gameMode)}
		/>
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
<Modal />
