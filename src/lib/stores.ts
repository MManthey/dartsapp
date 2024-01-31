import { localStorageStore } from '@skeletonlabs/skeleton';
import type { Writable } from 'svelte/store';
import { getModeUserPrefers } from '@skeletonlabs/skeleton';
import { setModeUserPrefers, setModeCurrent } from '@skeletonlabs/skeleton';
import { browser } from '$app/environment';

export const isOnline = localStorageStore('isOnline', true);
export const userId = localStorageStore('userId', '');
export const userName = localStorageStore('userName', '');
export const gameId = localStorageStore('gameId', '');
export const game: Writable<Game | null> = localStorageStore('game', null);
export const players: Writable<Player[]> = localStorageStore('players', []);

if (browser && getModeUserPrefers() === undefined) {
	setModeUserPrefers(false);
	setModeCurrent(false);
}
// userId.subscribe((value) => console.log('userId:', value));
// userName.subscribe((value) => console.log('userName:', value));
// gameId.subscribe((value) => console.log('gameId:', value));
// game.subscribe((value) => console.log('game:', value));
// players.subscribe((value) => console.log('players:', value));
