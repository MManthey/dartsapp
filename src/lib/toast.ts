import { toastStore } from '@skeletonlabs/skeleton';
import type { ToastSettings } from '@skeletonlabs/skeleton';

export function warnToast(message: string) {
	const t: ToastSettings = {
		message: message,
		background: 'variant-filled-warning'
	};
	toastStore.trigger(t);
}

export function errorToast(message: string) {
	const t: ToastSettings = {
		message: message,
		autohide: false,
		background: 'variant-filled-error'
	};
	toastStore.trigger(t);
}

export function successToast(message: string) {
	const t: ToastSettings = {
		message: message,
		background: 'variant-filled-success'
	};
	toastStore.trigger(t);
}
