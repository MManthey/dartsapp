<script lang="ts">
	import { goto } from '$app/navigation';
	import { RadioGroup, RadioItem, SlideToggle, RangeSlider } from '@skeletonlabs/skeleton';
	import { errorToast, successToast } from '$lib/toast';
	import { UserIcon } from 'svelte-feather-icons';
	import { LogOutIcon } from 'svelte-feather-icons';

    import Button from '$lib/components/Button.svelte';
    import Checkbox from '$lib/components/Checkbox.svelte';

    import { training } from '$lib/stores';

    let trainingForm = { difficulty: 'beginner', hitsNeeded: 1} as Precision;

	/**
	 * Handles the Letsdothis Button
	 */
	function handleGoBtn() {
        training.set(trainingForm);
		goto('/training/precision/precisionGame');
	}
</script>

<div class="max-w-xs mx-auto flex flex-col gap-6">
	<div class="text-3xl text-center my-6">Settings</div>
	<div>
		<div class="font-bold text-md">Difficulty</div>
		<!-- Bind selectedMode to the RadioGroup -->
		<RadioGroup class="grid grid-cols-3 mt-2" active="variant-filled-primary">
			<RadioItem bind:group={trainingForm.difficulty} name="beginner" value="beginner">Beginner</RadioItem>
            <RadioItem bind:group={trainingForm.difficulty} name="advanced" value="advanced">Advanced</RadioItem>
            <RadioItem bind:group={trainingForm.difficulty} name="expert" value="expert">Expert</RadioItem>
		</RadioGroup>
	</div>
    <div>
		<RangeSlider
			name="range-slider"
			min={1}
			max={3}
            bind:value={trainingForm.hitsNeeded} 
			ticked
			accent="accent-primary-500 dark:accent-primary-500"
		>
			<div class="font-bold text-md">
				Hits needed
			</div>
			<!-- TODO: Info Icon, um zu erklären, was mit Trys gemeint ist -->
		</RangeSlider>
        <div class="flex justify-between">
            <div class="text-left settingsSliderDiv3">1</div>
            <div class="text-center">2</div>
            <div class="text-right settingsSliderDiv1">3</div>
        </div>
	</div>
	<div class="mt-4">
		<Button text="Let's do this!" onClick={handleGoBtn}/>
	</div>

	<div class="sticky bottom-5 flex flex-row justify-center gap-5 mt-5">
		<button class="btn-icon btn-icon-xl variant-filled-error" type="button" on:click={() => { goto('/');  $training = null;}}>
			<LogOutIcon/>
		</button>
	</div>
</div>
