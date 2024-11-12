<script lang="ts">
	import { goto } from '$app/navigation';
	import { RadioGroup, RadioItem, SlideToggle, RangeSlider } from '@skeletonlabs/skeleton';
	import { errorToast, successToast } from '$lib/toast';
	import { UserIcon } from 'svelte-feather-icons';
	import { LogOutIcon } from 'svelte-feather-icons';
	import { InfoIcon } from 'svelte-feather-icons';

    import Button from '$lib/components/Button.svelte';
	import Checkbox from '$lib/components/Checkbox.svelte';
	import { training } from '$lib/stores';

	let trainingForm = { max: 170, throws: 3, out: "single"} as Checkout;

	/**
	 * Handles the Letsdothis Button
	 */
	function handleLetsDoThisBtn() {
		training.set(trainingForm);
		goto('/training/checkout/checkoutGame');
    }
    
    let preMax = 6;

	$: trainingForm.max = preMax * 30 - 10;

	let showOverlay = false;
	let overlayMode = '';
	let overlayContent = '';
	let overlayPosition = { top: '0', left: '0' };
	const overlayWidth = 200; // Beispielbreite des Overlays
	const overlayHeight = 100; // Beispielhöhe des Overlays

	function showInfo(event: MouseEvent, mode: string, content: string) {
		event.stopPropagation(); // Verhindert das Weiterleiten des Klicks

		overlayMode = mode;

		overlayContent = content;

		showOverlay = true;
	}

	function closeOverlay() {
		showOverlay = false;
	}
</script>

<div class="max-w-xs mx-auto flex flex-col gap-6">
	<div class="text-3xl text-center my-6">Settings</div>
    <div>
		<RangeSlider
			name="range-slider"
			min={1}
			max={6}
			bind:value={preMax}
			ticked
			accent="accent-primary-500 dark:accent-primary-500"
		>
			<div class="flex">
				<div class="font-bold text-md">
					Max Points
				</div>
				<div on:click={(e) => showInfo(e, 'overlayMaxPoints', 'The maximum number of points from which you have to play down. Minimum equals your set Maximum - 20.')}>
					<InfoIcon class="w-4 h-4 clickable ml-1"/>
				</div>
			</div>
		</RangeSlider>
        <div class="flex justify-between">
            <div class="text-left">20</div>
            <div class="text-center ml-2">50</div>
            <div class="text-right ml-2">80</div>
            <div class="text-center ml-1">110</div>
            <div class="text-right">140</div>
            <div class="text-center">170</div>
        </div>
	</div>
    <div>
		<RangeSlider
			name="range-slider"
			min={3}
			max={6}
			bind:value={trainingForm.throws}
			ticked
			accent="accent-primary-500 dark:accent-primary-500"
		>
			<div class="font-bold text-md">
				Throws
			</div>
			<!-- TODO: Info Icon, um zu erklären, was mit Trys gemeint ist? -->
		</RangeSlider>
        <div class="flex justify-between">
            <div class="text-left settingsSliderDiv3">3</div>
            <div class="text-center">4</div>
            <div class="text-right ">5</div>
            <div class="text-center mr-1">6</div>
        </div>
	</div>
    <div>
		<div class="font-bold text-md">Out Mode</div>
		<RadioGroup class="grid grid-cols-2 mt-2" active="variant-filled-primary">
			<RadioItem bind:group={trainingForm.out} name="single" value="single">Single</RadioItem>
			<RadioItem bind:group={trainingForm.out} name="double" value="double">Double</RadioItem>
		</RadioGroup>
	</div>
	<div class="mt-4 pl-10 pr-10">
		<Button text="Let's do this!" onClick={handleLetsDoThisBtn}/>
	</div>

	<div class="sticky bottom-5 flex flex-row justify-center gap-5 mt-5">
		<button class="btn-icon btn-icon-xl variant-filled-error" type="button" on:click={() => { goto('/'); $training = null;}}>
			<LogOutIcon/>
		</button>
	</div>

	{#if showOverlay}
		<div class="max-w-xs mx-auto flex flex-col gap-7 overlay {overlayMode}" on:click={closeOverlay}>
			<div class="overlay-content" style="top: {overlayPosition.top}; left: {overlayPosition.left};" on:click|stopPropagation>
				<p>{@html overlayContent}</p>
				<button class="close-button btn variant-filled-primary w-full py-2 px-4" on:click={closeOverlay}>Schließen</button>
			</div>
		</div>
	{/if}
</div>
