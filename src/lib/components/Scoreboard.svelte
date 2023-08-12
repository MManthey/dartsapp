<script lang="ts">
	import { ProgressRadial } from '@skeletonlabs/skeleton';

	export let game: Game;
	export let players: Player[];

	let missing: number[] = [];

	$: if (game) {
		missing = Array(game.size - players.length);
	}
</script>

<div class="table-container">
	<table class="table table-hover">
		<thead>
			<tr>
				<th>Player</th>
				<th class="table-cell-fit">Points</th>
				<th class="table-cell-fit">Avg.</th>
			</tr>
		</thead>
		<tbody>
			{#each [...players] as {idx, name, remaining, avg}}
				<tr>
					<td class="max-w-0 overflow-hidden text-ellipsis">
						{name.slice(0, 8)}
						{#if game?.state === 'closed' && game.turn === idx}
							<span class="ml-2 badge variant-filled-success">Turn</span>
						{/if}
					</td>
					<td class="table-cell-fit">{remaining}</td>
					<td class="table-cell-fit">{Math.round(avg)}</td>
				</tr>
			{/each}
			{#if game?.state === 'open'}
				{#each missing as miss}
					<tr>
						<td><ProgressRadial stroke={120} width="w-6" /></td>
						<td class="table-cell-fit">{game.gameMode}</td>
						<td class="table-cell-fit">{0}</td>
					</tr>
				{/each}
			{/if}
		</tbody>
	</table>
</div>
