<script lang="ts">
	import { CheckIcon } from 'svelte-feather-icons';
	export let clicked = false;

	$: extraClasses = clicked ? 'mt-2 text-xl' : 'mt-2 px-2 py-2';

	function handleClick() {
		clicked = !clicked;
	}
</script>

<button
	class="check {extraClasses} fixed-size"
	type="button"
	on:click={handleClick}
>
	{#if clicked}
		<p>x</p>
	{/if}
</button>
