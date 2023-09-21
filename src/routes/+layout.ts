import type { LayoutLoad } from './$types';
import { gameID } from '$lib/stores';
import { redirect } from '@sveltejs/kit';
import { get } from 'svelte/store';

export const load = (async ({ params }) => {
	const id = get(gameID);

	if (id && id !== params.gameID) {
		throw redirect(307, `/games/${id}`);
	}
	return {};
}) satisfies LayoutLoad;
