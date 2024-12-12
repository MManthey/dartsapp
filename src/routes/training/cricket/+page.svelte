<script lang="ts">
	import { goto } from '$app/navigation';
	import { InfoIcon } from 'svelte-feather-icons';

	import { LogOutIcon } from 'svelte-feather-icons';
	
	let showOverlay = false;
	let overlayContent = '';
	let overlayPosition = { top: '0px', left: '50%' }; // Standardwerte für left bleiben erhalten

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

	function handleCheckoutBtn() {
		goto('/training/checkout/settings');
	}

	function showInfo(event: MouseEvent, content: string) {
		event.stopPropagation(); // Verhindert das Weiterleiten des Klicks

		// Berechne nur den `top`-Wert relativ zur geklickten Icon-Position
		const target = event.currentTarget as HTMLElement;
		const rect = target.getBoundingClientRect();
		overlayPosition = {
			...overlayPosition, // Behalte `left` und andere Eigenschaften bei
			top: `${rect.bottom + 10}px`, // Setze neuen `top`-Wert
		};

		overlayContent = content;
		showOverlay = true;
	}

	function closeOverlay() {
		showOverlay = false;
	}
</script>

<div class="max-w-xs mx-auto flex flex-col gap-7">
	<div class="text-3xl text-center my-6">Training Modi</div>

	<div class="max-w-xs trainingDivs clickable flex items-center justify-between" on:click={handleCricketBtn}>
		<img class="imgIcon" src="/cricket-192x192.png" alt="cricket_icon" />
		<p class="text-2xl text-center flex-1 mx-4">Cricket Mode</p>
		<div on:click={(e) => showInfo(e, 'In the Cricket Training Mode you have to hit every number, including 25, 3 times. Double/ triple also counts for two or three hits.')}>
			<InfoIcon class="infoIcon" />
		</div>
	</div>

	<div class="max-w-xs trainingDivs clickable flex items-center justify-between" on:click={handlePrecisionBtn}>
		<img class="imgIcon" src="/aim-192x192.png" alt="aim_icon" />
		<p class="text-2xl text-center flex-1 mx-4">Precision Training</p>
		<div on:click={(e) => showInfo(e, 'Precision training thrives to teach you to slowly get better at accurately hitting the board.')}>
			<InfoIcon class="infoIcon" />
		</div>
	</div>

	<div class="max-w-xs trainingDivs clickable flex items-center justify-between" on:click={handleTripleBtn}>
		<img class="imgIcon" src="/x2x3-192x192.png" alt="x2_icon" />
		<p class="text-2xl text-center flex-1 mx-4">Triple Threat</p>
		<div on:click={(e) => showInfo(e, 'The goal of triple threat is to accurately hit random doubles/ triples.')}>
			<InfoIcon class="infoIcon" />
		</div>
	</div>

	<div class="max-w-xs trainingDivs clickable flex items-center justify-between" on:click={handleCheckoutBtn}>
		<img class="imgIcon" src="/checkout-v4-192x192.png" alt="checkout_icon" />
		<p class="text-2xl text-center flex-1 mx-4">Checkout Blitz</p>
		<div on:click={(e) => showInfo(e, 'You get a random number of points and a set number of darts you can throw to finish the game.')}>
			<InfoIcon class="infoIcon" />
		</div>
	</div>

	<div class="sticky bottom-5 flex flex-row justify-center gap-5 mt-5">
		<button class="btn-icon btn-icon-xl variant-filled-error" type="button" on:click={() => goto('/')}>
			<LogOutIcon />
		</button>
	</div>

	{#if showOverlay}
		<div class="overlay" on:click={closeOverlay}>
			<div class="overlay-content" style="top: {overlayPosition.top}; left: {overlayPosition.left};" on:click|stopPropagation>
				<p>{overlayContent}</p>
				<button class="close-button btn variant-filled-primary w-full py-2 px-4" on:click={closeOverlay}>Schließen</button>
			</div>
		</div>
	{/if}
</div>
