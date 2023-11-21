<script lang="ts">
	export let game: Game | null;
	export let players: Player[];

	let missing: number[] = [];

	$: if (game) missing = Array(game.size - players.length);
</script>

{#if game}
	{#each [...players] as { name, remaining, avg, sets, legs }}
		<div class="table-container border-token border-surface-400-500-token">
			<h3 class="h3 text-center py-4 bg-primary-500 dark:bg-primary-800">{name}</h3>
			<table class="table table-hover rounded-t-none">
				<tbody>
					<tr class="border-t-[1px] border-surface-400">
						<td class="text-center w-1/2">Sets</td>
						<td class="text-center w-1/2">{sets}/{game.sets}</td>
					</tr>
					<tr>
						<td class="text-center w-1/2">Legs</td>
						<td class="text-center w-1/2">{legs}/{game.legs}</td>
					</tr>
					<tr>
						<td class="text-center w-1/2">Points</td>
						<td class="text-center w-1/2">{remaining}</td>
					</tr>
					<tr>
						<td class="text-center w-1/2">Avg.</td>
						<td class="text-center w-1/2">{Math.round(avg)}</td>
					</tr>
				</tbody>
			</table>
		</div>
	{/each}
{/if}
