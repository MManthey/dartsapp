<script lang="ts">
	import { goto } from '$app/navigation';
	import { RadioGroup, RadioItem, SlideToggle, RangeSlider } from '@skeletonlabs/skeleton';
	import { errorToast, successToast } from '$lib/toast';
	import { UserIcon } from 'svelte-feather-icons';

    import Button from '$lib/components/Button.svelte';
    import Checkbox from '$lib/components/Checkbox.svelte';

	let selectedMode = 'double';

	/**
	 * Handles the Letsdothis Button
	 */
	function handleGoBtn() {
		goto('/training/triple/tripleGame');
	}
</script>

<div class="max-w-xs mx-auto flex flex-col gap-6">
	<div class="text-3xl text-center my-6">Settings</div>
	<div>
		<div class="font-bold text-md">Mode</div>
		<!-- Bind selectedMode to the RadioGroup -->
		<RadioGroup class="grid grid-cols-3 mt-2" active="variant-filled-primary">
			<RadioItem bind:group={selectedMode} name="double" value="double">Double</RadioItem>
            <RadioItem bind:group={selectedMode} name="triple" value="triple">Triple</RadioItem>
            <RadioItem bind:group={selectedMode} name="mixed" value="mixed">Mixed</RadioItem>
		</RadioGroup>
	</div>
    <div>
		<RangeSlider
			name="range-slider"
			min={1}
			max={3}
			ticked
			accent="accent-primary-500 dark:accent-primary-500"
		>
			<div class="font-bold text-md">
				Trys
			</div>
		</RangeSlider>
        <div class="flex justify-between">
            <div class="text-left settingsSliderDiv3">1</div>
            <div class="text-center">2</div>
            <div class="text-right settingsSliderDiv1">3</div>
        </div>
	</div>
    <div class="flex">
        <div class="font-bold text-md mt-1 mr-2">
            Include Bullseye:
        </div>
        <div>
            <Checkbox></Checkbox>
        </div>
    </div>
	<div class="mt-4">
		<Button text="Let's do this!" onClick={handleGoBtn}/>
	</div>
</div>
