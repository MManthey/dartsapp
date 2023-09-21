<script lang="ts">
	import { ProgressRadial } from '@skeletonlabs/skeleton';

	export let game: Game | null;
	export let players: Player[];

	let missing: number[] = [];

	$: if (game) missing = Array(game.size - players.length);
</script>

{#if game}
	<div class="table-container">
		<table class="table table-hover">
			<thead>
				<tr>
					<th class="px-3">Player</th>
					<th class="table-cell-fit">Sets</th>
					<th class="table-cell-fit">Legs</th>
					<th class="table-cell-fit">Points</th>
					<th class="table-cell-fit px-3">Avg.</th>
				</tr>
			</thead>
			<tbody>
				{#each [...players] as { idx, name, remaining, avg, sets, legs }}
					<tr>
						<td class="max-w-0 overflow-hidden text-ellipsis">
							{name.slice(0, 8)}
							{#if game.state === 'closed' && game.turn === idx}
								<span class="ml-2 badge variant-filled-success">Turn</span>
							{/if}
						</td>
						<td class="table-cell-fit">{sets}/{game.sets}</td>
						<td class="table-cell-fit">{legs}/{game.legs}</td>
						<td class="table-cell-fit">{remaining}</td>
						<td class="table-cell-fit">{Math.round(avg)}</td>
					</tr>
				{/each}
				{#if game.state === 'open'}
					{#each missing as _}
						<tr>
							<td><ProgressRadial stroke={120} width="w-6" /></td>
							<td class="table-cell-fit">0/{game.sets}</td>
							<td class="table-cell-fit">0/{game.legs}</td>
							<td class="table-cell-fit">{game.gameMode}</td>
							<td class="table-cell-fit">{0}</td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>
{/if}
