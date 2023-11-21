import type { LayoutLoad } from './$types';
import { gameId } from '$lib/stores';
import { redirect } from '@sveltejs/kit';
import { get } from 'svelte/store';

export const load = (async ({ params }) => {
	const id = get(gameId);

	if (id && id !== params.gameId) {
		throw redirect(307, `/games/${id}`);
	}
	return {};
}) satisfies LayoutLoad;
