<script lang="ts">
	import { Toast, Modal, LightSwitch } from '@skeletonlabs/skeleton';

	import Wordmark from '$lib/components/Wordmark.svelte';
	import Logo from '$lib/components/Logo.svelte';

	// Theme CSS
	import '../theme.postcss';
	// Bulk of Skeletons required styles
	import '@skeletonlabs/skeleton/styles/skeleton.css';
	// Global Stylesheet
	import '../app.postcss';
</script>

<div class="bg-primary-500 flex justify-end items-center px-6 py-3 relative">
	<div class="flex-1 flex justify-start">
		<Wordmark />
	</div>
	<div
		class="w-24 h-24 bg-primary-500 rounded-full absolute bottom-2 left-1/2 transform -translate-x-1/2 translate-y-1/2 flex items-center justify-center"
	>
		<Logo />
	</div>
	<div class="flex-1 flex justify-end">
		<LightSwitch />
	</div>
</div>

<main>
	<div class="container max-w-lg mx-auto px-10 py-16">
		<slot />
		<Toast max={1} />
		<Modal padding="p-0" />
	</div>
</main>
