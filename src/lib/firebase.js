import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import {
	getFirestore,
	doc,
	addDoc,
	setDoc,
	getDoc,
	getDocs,
	deleteDoc,
	collection,
	getCountFromServer
} from 'firebase/firestore';
import { get } from 'svelte/store';
import { gameID, userID, userName } from '$lib/stores.js';

const firebaseConfig = {
	apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
	authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
	databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
	projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
	storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
	appId: import.meta.env.VITE_FIREBASE_APP_ID,
	measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);

const auth = getAuth();

const db = getFirestore(app);

function gameDocRef() {
	const ref = doc(db, 'games', get(gameID));
	return ref;
}

export function playersCollRef() {
	const ref = collection(gameDocRef(), 'players');
	return ref;
}

function playerDocRef(id = get(userID)) {
	const ref = doc(playersCollRef(), id);
	return ref;
}

export function callDocRef(callID) {
	const ref = doc(gameDocRef(), 'calls', callID);
	return ref;
}

async function deleteCollection(collectionRef) {
	const querySnapshot = await getDocs(collectionRef);

	for (const docSnapshot of querySnapshot.docs) {
		await deleteDoc(doc(collectionRef, docSnapshot.id));
	}
}

export async function signIn() {
	console.log('signing in...');
	if (!auth.currentUser) {
		try {
			await signInAnonymously(auth);
		} catch (error) {
			console.error(error);
			throw new Error('could not sign in...');
		}
	}
	console.log('userID: ' + auth.currentUser.uid);
	userID.set(auth.currentUser.uid)
}

export async function createGame(settings) {
	console.log('creating game...');
	try {
		const gamesCollRef = collection(db, 'games');
		const gameRef = await addDoc(gamesCollRef, { ...settings });
		gameID.set(gameRef.id);
	} catch (error) {
		console.error(error);
		throw new Error('could not create game...');
	}
}

export async function joinGame() {
	console.log('joining game...');
	const gameSnap = await getDoc(gameDocRef());

	if (!gameSnap.exists()) {
		throw new Error('game does not exist...');
	}

	const playerCap = gameSnap.data().playerCap;
	const ref = playersCollRef();
	const playerCount = (await getDocs(ref)).size;

	if (playerCount >= playerCap) {
		throw new Error('game is already full...');
	}

	await setDoc(doc(ref, get(userID)), { name: get(userName) });
	console.log('gameID: ' + get(gameID));
}

export async function hangUp(callerID, calleeID) {
	console.log(`hanging up on ${calleeID}...`);

	const callRef = callDocRef(callerID, calleeID);
	const offerCandidatesRef = collection(callRef, 'offerCandidates');
	const answerCandidatesRef = collection(callRef, 'answerCandidates');

	await deleteCollection(offerCandidatesRef);
	await deleteCollection(answerCandidatesRef);
	await deleteDoc(callRef);
}

export async function leaveGame(gameID, playerID) {
	console.log('leaving game...');

	const playerRef = playerDocRef();

	// hang up on everyone
	const callColl = collection(playerRef, 'calls');
	const querySnapshot = await getDocs(callColl);
	for (const docSnapshot of querySnapshot.docs) {
		hangUp(gameID, playerID, docSnapshot.id);
	}

	// delete player doc from game
	await deleteDoc(playerRef);

	// delete game doc if game is empty
	const snapshot = await getCountFromServer(playersCollRef());
	const playerCount = snapshot.data().count;
	if (playerCount === 0) {
		await deleteDoc(gameDocRef());
	}
}

export async function uploadCandidate(callID, candidate) {
	await addDoc(collection(callDocRef(callID), get(userID)), candidate);
}

// export async function uploadOffer(callID, offer) {
// 	await setDoc(callDocRef(callID), { offer, sender: get(userID), state: 'offered' });
// }

export async function updateCallDoc(callID, data) {
	await setDoc(callDocRef(callID), data);
}
