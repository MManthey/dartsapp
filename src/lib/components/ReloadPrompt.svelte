<script lang="ts">
	import { useRegisterSW } from 'virtual:pwa-register/svelte';
	import { toastStore, type ToastSettings } from '@skeletonlabs/skeleton';
	const { needRefresh, updateServiceWorker, offlineReady } = useRegisterSW({
		onRegistered(r: any) {
			// uncomment following code if you want check for updates
			// r && setInterval(() => {
			//    console.log('Checking for sw update')
			//    r.update()
			// }, 20000 /* 20s for testing purposes */)
			console.log(`SW Registered: ${r}`);
		},
		onRegisterError(error: any) {
			console.log('SW registration error', error);
		}
	});
	const close = () => {
		offlineReady.set(false);
		needRefresh.set(false);
	};
	$: if ($offlineReady || $needRefresh) {
		const t: ToastSettings = {
			message: $offlineReady
				? 'App ready to work offline'
				: 'New content available, click on reload button to update.',
			autohide: false,
			background: 'variant-filled-success',
			callback: (response) => {
				if (response.status === 'closed') {
					close();
				}
			}
		};
		if ($needRefresh) {
			t.action = {
				label: 'Reload',
				response: () => updateServiceWorker(true)
			};
		}
		toastStore.trigger(t);
	}
</script>
