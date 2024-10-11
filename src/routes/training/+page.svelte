<script lang="ts">
	import { goto } from '$app/navigation';
	import { training} from '$lib/stores';
	import { errorToast } from '$lib/toast';
    import { InfoIcon } from 'svelte-feather-icons';

	function handleBackBtn() {
		goto('../');
    }

	let trainingForm: Training;

	//TODO: prolly reicht eine Funktion
	function handleCricketBtn() {
		trainingForm = {
			nums: new Array(20).fill(0), // Array von 20 Nullen
			throws: 0
		} as Cricket;
		redirectTraining();
	}

    function redirectTraining() {
		//Setup Training
		try {
			training.set(trainingForm);
			goto('/training/cricket');
		} catch (err: unknown) {
			const msg =
				err instanceof Error ? err.message : 'Unknown error while creating/joinging game.';
			console.error(msg);
			errorToast(msg);
		}
    }

</script>

<div class="max-w-xs mx-auto flex flex-col gap-7">
	<div class="text-3xl text-center my-6">Training Modi</div>
    <div class="max-w-xs trainingDivs clickable" on:click={handleCricketBtn}><img class="imgIcon" src="/cricket-192x192.png" alt="cricket_icon"/> <p class="text-2xl">Cricket Modus</p><InfoIcon class="infoIcon"/></div>
    <div class="max-w-xs trainingDivs clickable"><img class="imgIcon" src="/x2-192x192.png" alt="x2_icon"/> <p class="text-2xl">Double Training</p><InfoIcon class="infoIcon"/></div>
    <div class="max-w-xs trainingDivs clickable"><img class="imgIcon" src="/aim-192x192.png" alt="aim_icon"/> <p class="text-2xl">Zielübung</p><InfoIcon class="infoIcon"/></div>
</div>