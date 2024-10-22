<script lang="ts">
	import { goto } from '$app/navigation';
	import { InfoIcon } from 'svelte-feather-icons';

	import { LogOutIcon } from 'svelte-feather-icons';
	
	let showOverlay = false;
	let overlayMode = '';
	let overlayContent = '';
	let overlayPosition = { top: '0', left: '0' };
	const overlayWidth = 200; // Beispielbreite des Overlays
	const overlayHeight = 100; // Beispielhöhe des Overlays

	function handleBackBtn() {
		goto('../');
	}

	function handleCricketBtn() {
		goto('/training/cricket');
	}

	function handleTripleBtn() {
		goto('/training/triple/settings');
	}

	function handlePrecisionBtn() {
		goto('/training/precision/settings');
	}

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

<div class="max-w-xs mx-auto flex flex-col gap-7">
	<div class="text-3xl text-center my-6">Training Modi</div>

	<div class="max-w-xs trainingDivs clickable" on:click={handleCricketBtn}>
		<img class="imgIcon" src="/cricket-192x192.png" alt="cricket_icon"/>
		<p class="text-2xl">Cricket Mode</p>
		<div on:click={(e) => showInfo(e, 'overlayCricket', 'In the Cricket Training Mode you have to hit every number, including 25, 3 times. Double/ triple also counts for two or three hits.')}>
			<InfoIcon class="infoIcon"/>
		</div>
	</div>
	<div class="max-w-xs trainingDivs clickable" on:click={handlePrecisionBtn}>
		<img class="imgIcon" src="/aim-192x192.png" alt="aim_icon"/>
		<p class="text-2xl">Precision Training</p>
		<div on:click={(e) => showInfo(e, 'overlayZiel', 'Precision training thrives to teach you to slowly get better at accurately hitting the board. It might start off easy but one mistake and you might have to start all over again!')}>
			<InfoIcon class="infoIcon"/>
		</div>
	</div>
	<div class="max-w-xs trainingDivs clickable" on:click={handleTripleBtn}>
		<img class="imgIcon" src="/x2x3-192x192.png" alt="x2_icon"/>
		<p class="text-2xl">Triple Threat</p>
		<div on:click={(e) => showInfo(e, 'overlayDouble', 'The goal of triple threat is to accurately hit random doubles/ triples. You can specify how many attempts you want to give to yourself.')}>
			<InfoIcon class="infoIcon"/>
		</div>
	</div>

	<div class="sticky bottom-5 flex flex-row justify-center gap-5 mt-5">
		<button class="btn-icon btn-icon-xl variant-filled-error" type="button" on:click={() => { goto('/');}}>
			<LogOutIcon/>
		</button>
	</div>
	{#if showOverlay}
		<div class="max-w-xs mx-auto flex flex-col gap-7 overlay {overlayMode}" on:click={closeOverlay}>
			<div class="overlay-content" style="top: {overlayPosition.top}; left: {overlayPosition.left};" on:click|stopPropagation>
				<p>{overlayContent}</p>
				<button class="close-button btn variant-filled-primary w-full py-2 px-4" on:click={closeOverlay}>Schließen</button>
			</div>
		</div>
	{/if}
</div>