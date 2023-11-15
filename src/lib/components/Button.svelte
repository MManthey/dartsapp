<script lang="ts">
	import { ProgressRadial } from '@skeletonlabs/skeleton';

	export let text: string;
	export let disabled: boolean = false;
	export let onClick: () => void | Promise<void>;

	let isLoading = false;

	async function handleClick() {
        isLoading = true;
        try {
			await onClick();
        } finally {
            isLoading = false;
        }
    }
</script>

<button
	class="btn variant-filled-primary w-full py-2 px-4"
	type="button"
	disabled={disabled || isLoading}
	on:click={handleClick}
>
	{#if isLoading}
		<ProgressRadial stroke={120} width="w-6" />
	{:else}
		{text}
	{/if}
</button>

