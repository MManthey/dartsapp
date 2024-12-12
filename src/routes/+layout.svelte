<script lang="ts">
	import { Toast, Modal, LightSwitch } from '@skeletonlabs/skeleton';

	import Wordmark from '$lib/components/Wordmark.svelte';
	import Logo from '$lib/components/Logo.svelte';
	import { UserIcon } from 'svelte-feather-icons';
	import { page } from '$app/stores';

	import { goto } from '$app/navigation';

	// Theme CSS
	import '../theme.postcss';
	// Bulk of Skeletons required styles
	import '@skeletonlabs/skeleton/styles/skeleton.css';
	// Global Stylesheet
	import '../app.postcss';

	$: onHome = $page.url.pathname === '/';

	function handleStatisticBtn() {
		goto('/testStatistics');
	}

	console.log("Layout script loaded");

	$: statsClasses = onHome ? "bg-surface-500 cursor-pointer" : "bg-surface-500";
	$: iconClasses = onHome ? "text-primary-500" : "text-neutral-600";
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
	<!-- <div class="flex-1 flex justify-end">
		<LightSwitch />
	</div> -->
	<div class="flex-1 flex justify-end">
		<div class="w-9 h-9 rounded-full flex items-center justify-center {statsClasses}"
			on:click={onHome && handleStatisticBtn}
		>
			<UserIcon class="w-6 h-6 {iconClasses}"/>
		</div>
	</div>
</div>

<main>
	<div class="container max-w-lg mx-auto px-10 py-16">
		<slot />
		<Toast max={1} />
		<Modal padding="p-0" />
	</div>
</main>
