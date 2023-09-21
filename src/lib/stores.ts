// import { goto } from '$app/navigation';
import { localStorageStore } from '@skeletonlabs/skeleton';
import type { Writable } from 'svelte/store';

export const userID = localStorageStore('userID', '');
export const userName = localStorageStore('userName', '');
export const gameID = localStorageStore('gameID', '');
export const game: Writable<Game | null> = localStorageStore('game', null);
export const players: Writable<Player[]> = localStorageStore('players', []);

// gameID.subscribe((gameID) => {
// 	if (browser) {
// 		// goto(gameID ? `/games/${gameID}` : '/');
// 	}
// });
