import { get } from 'svelte/store';
import { getApps, initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import {
	CollectionReference,
	getFirestore,
	doc,
	addDoc,
	setDoc,
	getDocs,
	deleteDoc,
	collection,
	getCountFromServer,
	query,
	where
} from 'firebase/firestore';
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

let app;
if (!getApps().length) {
	app = initializeApp(firebaseConfig);
} else {
	app = getApps()[0]; // get the already initialized app
}
const auth = getAuth();

const db = getFirestore(app);

export function getGameDocRef() {
	const gameDocRef = doc(db, 'games', get(gameID));
	return gameDocRef;
}

export function getPlayersCollRef() {
	const playersCollRef = collection(getGameDocRef(), 'players');
	return playersCollRef;
}

function getPlayerDocRef(playerID = get(userID)) {
	const playerDocRef = doc(getPlayersCollRef(), playerID);
	return playerDocRef;
}

export function getCallDocRef(callID: string) {
	const callDocRef = doc(getGameDocRef(), 'calls', callID);
	return callDocRef;
}

async function deleteCollection(collectionRef: CollectionReference) {
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

	if (auth.currentUser) {
		console.log('userID: ' + auth.currentUser.uid);
		userID.set(auth.currentUser.uid);
	}
}

export async function createGame(game: Game) {
	console.log('creating game...');
	try {
		const gamesCollRef = collection(db, 'games');
		const gameRef = await addDoc(gamesCollRef, game);
		gameID.set(gameRef.id);
	} catch (error) {
		console.error(error);
		throw new Error('could not create game...');
	}
}

export async function joinGame(shortId: string) {
	console.log('joining game...');

	const q = query(
		collection(db, 'games'),
		where('shortId', '==', shortId)
	)

	const querySnapshot = await getDocs(q);

	if (querySnapshot.empty) {
		throw new Error('Game does not exist!');
	} else if (querySnapshot.size > 1) {
		throw new Error('Collision!');
	}
	const gameSnap = querySnapshot.docs[0];
	gameID.set(gameSnap.id)
	const game = gameSnap.data() as Game;

	const playersCollRef = getPlayersCollRef();
	const playersCollSnap = await getDocs(playersCollRef);
	const playerCount = playersCollSnap.size;

	if (game.state !== 'waiting' || playerCount >= game.size) {
		throw new Error('Game is already in session!');
	}

	const remaining = game.gameMode;

	await setDoc(getPlayerDocRef(), { name: get(userName), remaining, avg: 0 });
	console.log('gameID: ' + get(gameID));
}

export async function hangUp(playerAID: string, playerBID: string, callID: string) {
	console.log(`deleting call ${callID}...`);

	const callDocRef = getCallDocRef(callID);
	const candidatesACollRef = collection(callDocRef, playerAID);
	const candidatesBCollRef = collection(callDocRef, playerBID);

	await deleteCollection(candidatesACollRef);
	await deleteCollection(candidatesBCollRef);
	await deleteDoc(callDocRef);
}

export async function leaveGame(gameID: string, playerID: string) {
	console.log('leaving game...');

	const playerRef = getPlayerDocRef();

	// hang up on everyone
	const callColl = collection(playerRef, 'calls');
	const querySnapshot = await getDocs(callColl);
	for (const docSnapshot of querySnapshot.docs) {
		hangUp(gameID, playerID, docSnapshot.id);
	}

	// delete player doc from game
	await deleteDoc(playerRef);

	// delete game doc if game is empty
	const snapshot = await getCountFromServer(getPlayersCollRef());
	const playerCount = snapshot.data().count;
	if (playerCount === 0) {
		await deleteDoc(getGameDocRef());
	}
}

export async function addCandidate(callID: string, candidate: RTCIceCandidate) {
	await addDoc(collection(getCallDocRef(callID), get(userID)), candidate.toJSON());
}

export async function updateGame(game: Game) {
	await setDoc(getGameDocRef(), game);
}

export async function updatePlayerData(playerData: PlayerData) {
	await setDoc(getPlayerDocRef(), playerData);
}

export async function updateCall(callID: string, call: Call) {
	await setDoc(getCallDocRef(callID), call);
}
