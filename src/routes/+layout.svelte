<script lang="ts">
	import { LightSwitch } from '@skeletonlabs/skeleton';

	// The ordering of these imports is critical to your app working properly
	import '@skeletonlabs/skeleton/themes/theme-skeleton.css';
	// If you have source.organizeImports set to true in VSCode, then it will auto change this ordering
	import '@skeletonlabs/skeleton/styles/skeleton.css';
	// Most of your app wide CSS should be put in this file
	import '../app.postcss';
</script>

<div class="flex justify-between items-center px-10 py-6">
	<h2 class="h2 font-bold flex items-center">
		Dartsapp
		<span class="ml-2 badge variant-filled-warning"> Beta </span>
	</h2>
	<LightSwitch />
</div>
<main class="min-h-screen">
	<div class="container max-w-lg mx-auto px-10 my-6">
		<slot />
	</div>
</main>
