<script lang="ts">

	export let game: Game | null;
	export let players: Player[];

	let missing: number[] = [];

	$: if (game) missing = Array(game.size - players.length);
</script>

{#if game}
	{#each [...players] as { name, remaining, avg, sets, legs }}
		<h3 class="h3 font-bold text-center mb-4 text-primary-700">{name.slice(0, 8)}</h3>
		<div class="table-container mb-4">
			<table class="table table-hover">
				<tbody>
					<tr>
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
