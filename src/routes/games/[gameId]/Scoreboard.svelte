<script lang="ts">
	import { ProgressRadial } from '@skeletonlabs/skeleton';

	export let game: Game;
	export let players: Map<string, Player>;

	let missing: number[] = [];

	$: if (game) {
		missing = Array(game.size - players.size);
	}
</script>

<div class="table-container">
	<table class="table table-hover">
		<thead>
			<tr>
				<th>Player</th>
				<th class="table-cell-fit">Score</th>
				<th class="table-cell-fit">avg.</th>
			</tr>
		</thead>
		<tbody>
			{#each [...players] as [id, player]}
				<tr>
					<td class="max-w-0 overflow-hidden overflow- text-ellipsis">
						{player.data.name.slice(0, 8)}
						{#if game?.state === 'playing' && game.turn === id}
							<span class="ml-2 badge variant-filled-success">Turn</span>
						{/if}
					</td>
					<td class="table-cell-fit">{player.data.remaining}</td>
					<td class="table-cell-fit">{Math.round(player.data.avg)}</td>
				</tr>
			{/each}
			{#if game?.state === 'waiting'}
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
