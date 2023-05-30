import { error } from '@sveltejs/kit';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '$lib/firebase.js';

/** @type {import('./$types').PageLoad} */
export async function load({ params }) {
    const { gameId } = params;
    if (!gameId) {
        throw error(404, 'Game not found');
    }

    const gameRef = doc(db, "games", gameId);
    const gameSnap = await getDoc(gameRef);


    if (gameSnap.exists()) {
        return {
            settings: gameSnap.data(),
            id: gameId,
        };
    } else {
        // handle error when document does not exist
        console.log("No such document!");
    }
}
