<script lang="ts">
	import { modalStore } from '@skeletonlabs/skeleton';
	import { tweened } from 'svelte/motion';
	import { Confetti } from "svelte-confetti"

	export let background: string;

	let original = 5;
	let timer = tweened(original, {
		duration: 1000
	});

	setInterval(() => {
		if ($timer > 0) $timer--;
	}, 1000);

	$: if ($timer < 0) {
		closeModal();
	}

	function closeModal() {
		modalStore.clear();
	}
</script>

<div
	class={background + ' w-screen h-screen flex flex-col justify-center'}
	on:click={closeModal}
	on:keypress={closeModal}
>
	<progress class="bg-white rounded-none h-3 fixed top-0 left-0 w-full z-10" value={$timer / original} />
	<div class="flex flex-col justify-center items-center gap-10 max-w-sm mx-auto m">
		<div class="text-5xl text-white rubberBand">WOHOOOO!!</div>
		<img src="/trophy.svg" alt="Trophy" />
		<div class="text-3xl text-center"><slot /></div>
	</div>
</div>

<div class="fixed top-[-50px] left-0 h-screen w-screen flex justify-center overflow-hidden pointer-events-none">
	<Confetti size={30} x={[-5, 5]} y={[0, 0.1]} delay={[500, 2000]} infinite duration={5000} amount={200} fallDistance="100vh" />
</div>
