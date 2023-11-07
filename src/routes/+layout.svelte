<script lang="ts">
	import { Toast, Modal, LightSwitch } from '@skeletonlabs/skeleton';

	// The ordering of these imports is critical to your app working properly
	import '@skeletonlabs/skeleton/themes/theme-skeleton.css';
	// If you have source.organizeImports set to true in VSCode, then it will auto change this ordering
	import '@skeletonlabs/skeleton/styles/skeleton.css';
	// Most of your app wide CSS should be put in this file
	import '../app.postcss';
</script>

<div class="bg-primary-500 flex justify-end items-center px-6 py-3 relative">
	<div class="flex-1 flex justify-start">
		<img class="w-24" src="/dartsappHeader.svg" alt="Dartsapp Header" />
	</div>
	<div
		class="w-20 h-20 bg-primary-500 rounded-full absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 flex items-center justify-center"
	>
		<img class="w-16 h-16" src="/dartsappIcon.svg" alt="Dartsapp Icon" />
	</div>
	<div class="flex-1 flex justify-end">
		<LightSwitch />
	</div>
</div>

<main class="min-h-screen">
	<div class="container max-w-lg mx-auto px-10 my-20">
		<slot />
		<Toast max={1} />
		<Modal
			padding="p-0"
		/>
	</div>
</main>
