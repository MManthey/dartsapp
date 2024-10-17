<script lang="ts">
	import { goto } from '$app/navigation';
	import { RadioGroup, RadioItem, SlideToggle, RangeSlider } from '@skeletonlabs/skeleton';
	import { errorToast, successToast } from '$lib/toast';

    import { LogOutIcon } from 'svelte-feather-icons';
    import { training } from '$lib/stores';
</script>

<div class="max-w-xs mx-auto flex flex-col gap-6">
	<div class="text-3xl text-center my-6">Triple Threat</div>

    <div class="sticky bottom-5 flex flex-row justify-center gap-5 mt-5">
		<button class="btn-icon btn-icon-xl variant-filled-error" type="button" on:click={() => { goto('/'); $training = null;}}>
			<LogOutIcon/>
		</button>
	</div>
</div>
