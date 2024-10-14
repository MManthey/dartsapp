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
		<p class="text-2xl">Cricket Modus</p>
		<div on:click={(e) => showInfo(e, 'overlayCricket', 'Bei Cricket muss jede Zahl, einschließlich der 25, mindestens 3 mal getroffen werden, um zu gewinnen. Double/ Triple zählen dabei dementsprechend doppelt und dreifach.')}>
			<InfoIcon class="infoIcon"/>
		</div>
	</div>

	<div class="sticky bottom-5 flex flex-row justify-center gap-5 mt-5">
		<button class="btn-icon btn-icon-xl variant-filled-error" type="button" on:click={() => { goto('/');}}>
			<LogOutIcon/>
		</button>
	</div>
</div>