import { localStorageStore } from '@skeletonlabs/skeleton';
import type { Writable } from 'svelte/store';

export const isOnline = localStorageStore('isOnline', true);
export const userId = localStorageStore('userId', '');
export const userName = localStorageStore('userName', '');
export const gameId = localStorageStore('gameId', '');
export const game: Writable<Game | null> = localStorageStore('game', null);
export const players: Writable<Player[]> = localStorageStore('players', []);

isOnline.subscribe((value) => console.log('isOnline:', value));
// userId.subscribe((value) => console.log('userId:', value));
// userName.subscribe((value) => console.log('userName:', value));
// gameId.subscribe((value) => console.log('gameId:', value));
// game.subscribe((value) => console.log('game:', value));
// players.subscribe((value) => console.log('players:', value));
