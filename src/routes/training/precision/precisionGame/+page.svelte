<script lang="ts">
	import { goto } from '$app/navigation';
	import { modalStore } from '@skeletonlabs/skeleton'; // Import modal store
	import WinnerModal from '$lib/components/WinnerModal.svelte'; // Import Winner Modal

	import { InfoIcon } from 'svelte-feather-icons';
	import { LogOutIcon } from 'svelte-feather-icons';
	import Button from '$lib/components/Button.svelte';

	import { training } from '$lib/stores';

	// Reactive assignment to automatically subscribe to the store
	let trainingData = $training;

	// Now you can access `trainingData.difficulty` and `trainingData.hitsNeeded`
	let difficulty = trainingData.difficulty;
	let hitsNeeded = trainingData.hitsNeeded;

	let health = difficulty === 'beginner' ? 1 : 0;

	let possImgs1 = ['/scheibe-L-512x512.png', '/scheibe-R-512x512.png', '/scheibe-B-512x512.png', '/scheibe-T-512x512.png'];
	let possImgs2 = ['/scheibe-BL-512x512.png', '/scheibe-BR-512x512.png', '/scheibe-TL-512x512.png', '/scheibe-TR-512x512.png'];
	let possImgs3 = ['/scheibe-1-512x512.png', '/scheibe-2-512x512.png', '/scheibe-3-512x512.png', '/scheibe-4-512x512.png', '/scheibe-5-512x512.png', '/scheibe-6-512x512.png', '/scheibe-7-512x512.png', '/scheibe-8-512x512.png', '/scheibe-9-512x512.png', '/scheibe-10-512x512.png', '/scheibe-11-512x512.png', '/scheibe-12-512x512.png', '/scheibe-13-512x512.png', '/scheibe-14-512x512.png', '/scheibe-15-512x512.png', '/scheibe-16-512x512.png', '/scheibe-17-512x512.png', '/scheibe-18-512x512.png', '/scheibe-19-512x512.png', '/scheibe-20-512x512.png'];

	let possTexts1 = ['Try hitting the left half of the board!', 'Try hitting the right half of the board!', 'Try hitting the bottom half of the board!', 'Try hitting the top half of the board!'];
	let possTexts2 = ['Try hitting the bottom left quadrant of the board!', 'Try hitting the bottom right quadrant of the board!', 'Try hitting the top left quadrant of the board!', 'Try hitting the top right quadrant of the board!'];
	let possTexts3 = ['Try hitting only the 1!', 'Try hitting only the 2!', 'Try hitting only the 3!', 'Try hitting only the 4!', 'Try hitting only the 5!', 'Try hitting only the 6!', 'Try hitting only the 7!', 'Try hitting only the 8!', 'Try hitting only the 9!', 'Try hitting only the 10!', 'Try hitting only the 11!', 'Try hitting only the 12!', 'Try hitting only the 13!', 'Try hitting only the 14!', 'Try hitting only the 15!', 'Try hitting only the 16!', 'Try hitting only the 17!', 'Try hitting only the 18!', 'Try hitting only the 19!', 'Try hitting only the 20!'];

	function shufflePairs(imgs: string[], texts: string[]): [string[], string[]] {
		let pairedArray = imgs.map((img, index) => ({ img, text: texts[index] }));
		pairedArray.sort(() => Math.random() - 0.5);
		const shuffledImgs = pairedArray.map(pair => pair.img);
		const shuffledTexts = pairedArray.map(pair => pair.text);
		return [shuffledImgs, shuffledTexts];
	}

	let active = 0;
	let possTexts;
	let possImgs;

	function healthDown() {
		if (health > 0) {
			health--;

		} else {
			if (difficulty === 'beginner') {
				health++;
			}
			randomizeNew();
		}
	}

	function randomizeNew() {
		[possImgs1, possTexts1] = shufflePairs(possImgs1, possTexts1);
		[possImgs2, possTexts2] = shufflePairs(possImgs2, possTexts2);
		[possImgs3, possTexts3] = shufflePairs(possImgs3, possTexts3);
		possImgs = possImgs1.concat(possImgs2).concat(possImgs3).concat('/scheibe-bull-512x512.png');
		possTexts = possTexts1.concat(possTexts2).concat(possTexts3).concat('And now... try hitting only Bull!');
		active = 0;
	}

	randomizeNew();

	//TODO: hier überarbeiten mit den Schwierigkeiten.... glaube das ist super unnötig aufwändig gerade......
	function hitMark() {
		if ((difficulty !== expert && active < 17) || (difficulty === 'expert' && active < 27)) {
			active++;
		} else if (difficulty !== 'expert' && active < 18) {
			if (difficulty === 'beginner') {
				openModal();
			} else {
				active = possImgs.length - 1;
			}
		} else if (difficulty === expert) {
			//öhhh
		} else {
			// Open the winner modal here
			openModal();
		}
	}

	// Function to open the Winner Modal
	function openModal() {
		const modalComponent: ModalComponent = {
			ref: WinnerModal,
			props: { background: 'bg-primary-500' },
			slot: `<p class="text-white"> You actually did it, very nice!</p>`
		};
		const modal: ModalSettings = {
			type: 'component',
			component: modalComponent
		};
		modalStore.trigger(modal);

		setTimeout(() => {
			goto('/');
		}, 1000);
	}

	let active6 = ['/scheibe-R-512x512.png', '/scheibe-B-512x512.png', '/scheibe-T-512x512.png', '/scheibe-BR-512x512.png', '/scheibe-TR-512x512.png', 'scheibe-6-512x512.png'];

	// Reactive function to update overlay image
	$: overlayImage = active6.includes(possImgs[active]) ? '/6_green.png' : '/6.png';
	$: activeImage = possImgs[active];
	$: activeText = possTexts[active];
</script>

<div class="max-w-xs mx-auto flex flex-col gap-7">
	<div class="text-3xl text-center my-6">Zielübung</div>
</div>

<div class="max-w-xs mx-auto flex flex-col gap-7 relative-container">
	<div class="image-wrapper"> 
		<img class="base-image" src={activeImage} alt="darts_img"/>
		<img class="overlay-image" src={overlayImage} alt="darts_img"/>
	</div>

	<div class="textDiv w-full card p-2 text-white text-xl">
		{activeText}
	</div>

	<div class="flex space-x-3 mt-1 twoBtnDiv">
		<Button text="Hit it!" onClick={hitMark} />
		<button class="btn w-full redBtn py-2 px-4" on:click={healthDown}>Missed...</button>
	</div>

	<div class="sticky bottom-5 flex flex-row justify-center gap-5 mt-5">
		<button class="btn-icon btn-icon-xl variant-filled-error" type="button" on:click={() => { goto('/'); $training = null;}}>
			<LogOutIcon/>
		</button>
	</div>
</div>
