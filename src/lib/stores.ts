// import { browser } from '$app/environment';
// import { goto } from '$app/navigation';
import { localStorageStore } from '@skeletonlabs/skeleton';

export const userID = localStorageStore('userID', '');
export const userName = localStorageStore('userName', '');
export const gameID = localStorageStore('gameID', '');

// gameID.subscribe((gameID) => {
// 	if (browser) {
// 		// goto(gameID ? `/games/${gameID}` : '/');
// 	}
// });
