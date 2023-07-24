import { get } from 'svelte/store';
import { getApps, initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import {
	getFirestore,
	doc,
	addDoc,
	setDoc,
	getDocs,
	collection,
	query,
	where,
	deleteDoc,
	updateDoc,
	onSnapshot,
	type DocumentData
} from 'firebase/firestore';
import { getDatabase, ref, set, onValue, onDisconnect } from 'firebase/database';

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

const firestore = getFirestore(app);

const database = getDatabase(app);

// auth

export async function signIn() {
	if (!auth.currentUser) {
		try {
			await signInAnonymously(auth);
		} catch (error) {
			console.error(error);
			throw new Error('there was an Error signing in...');
		}
	}

	if (auth.currentUser) {
		userID.set(auth.currentUser.uid);
	}
}

onAuthStateChanged(auth, (user) => {
	if (user) {
		// Fetch the current user's ID from Firebase Authentication.
		const uid = user.uid;

		// Create a reference to this user's specific status node.
		// This is where we will store data about being online/offline.
		const userStatusDatabaseRef = ref(database, uid);

		// Create a reference to the special '.info/connected' path in
		// Realtime Database. This path returns `true` when connected
		// and `false` when disconnected.
		const connectedRef = ref(database, '.info/connected');
		onValue(connectedRef, (snapshot) => {
			// If we're not currently connected, don't do anything.
			if (snapshot.val() == false) {
				return;
			}

			// If we are currently connected, then use the 'onDisconnect()'
			// method to add a set which will only trigger once this
			// client has disconnected by closing the app,
			// losing internet, or any other means.
			onDisconnect(userStatusDatabaseRef)
				.set('offline')
				.then(() => {
					// The promise returned from .onDisconnect().set() will
					// resolve as soon as the server acknowledges the onDisconnect()
					// request, NOT once we've actually disconnected:
					// https://firebase.google.com/docs/reference/js/firebase.database.OnDisconnect

					// We can now safely set ourselves as 'online' knowing that the
					// server will mark us as offline once we lose connection.
					set(userStatusDatabaseRef, 'online');
				});
		});
	}
});

export async function signOut() {
	if (auth.currentUser) {
		try {
			await auth.signOut();
		} catch (error) {
			throw new Error('there was an Error signing out...');
		}
	}
}

// firestore

function getGameDocRef() {
	const gameDocRef = doc(firestore, 'games', get(gameID));
	return gameDocRef;
}

function getPlayersCollRef() {
	const playersCollRef = collection(getGameDocRef(), 'players');
	return playersCollRef;
}

function getPlayerDocRef(playerID = get(userID)) {
	const playerDocRef = doc(getPlayersCollRef(), playerID);
	return playerDocRef;
}

function getMessageDocRef(callerID: string, calleeID: string) {
	const callDocRef = doc(getPlayerDocRef(callerID), 'calls', calleeID);
	return callDocRef;
}

export async function createGame(game: Game) {
	try {
		const gamesCollRef = collection(firestore, 'games');
		const gameRef = await addDoc(gamesCollRef, game);
		gameID.set(gameRef.id);
	} catch (error) {
		console.error(error);
		throw new Error('could not create game...');
	}
}

export async function joinGame(shortId: string) {
	const q = query(collection(firestore, 'games'), where('shortId', '==', shortId));

	const querySnapshot = await getDocs(q);

	if (querySnapshot.empty) {
		throw new Error('Game does not exist!');
	} else if (querySnapshot.size > 1) {
		throw new Error('Collision!');
	}
	const gameSnap = querySnapshot.docs[0];
	gameID.set(gameSnap.id);
	const game = gameSnap.data() as Game;

	const playersCollRef = getPlayersCollRef();
	const playersCollSnap = await getDocs(playersCollRef);
	const playerCount = playersCollSnap.size;

	if (game.state !== 'open' || playerCount >= game.size) {
		throw new Error('Game is already in session!');
	}

	if (playerCount === game.size - 1) {
		updateGame('closed');
	}

	const remaining = game.gameMode;

	await setDoc(getPlayerDocRef(), { name: get(userName), idx: playerCount, remaining, avg: 0 });
}

export async function updateGame(state: 'open' | 'closed' | 'over', turn?: number) {
	await updateDoc(getGameDocRef(), turn !== undefined ? { state, turn } : { state });
}

export async function updatePlayer(remaining: number, throws: number[], avg: number) {
	await updateDoc(getPlayerDocRef(), { remaining, throws, avg });
}

export async function sendCandidate(playerID: string, candidate: RTCIceCandidate) {
	await addDoc(collection(getMessageDocRef(get(userID), playerID), 'candidates'), candidate.toJSON());
}

export async function sendMessage(playerID: string, message: RTCMessage) {
	await setDoc(getMessageDocRef(get(userID), playerID), message);
}

export async function deleteMessage(playerID: string) {
	await deleteDoc(getMessageDocRef(get(userID), playerID));
}

export function onGameState(callback: (game: Game) => void) {
	const unsubscribe = onSnapshot(getGameDocRef(), (snapshot) => {
		const game = snapshot.data() as Game;
		callback(game);
	});

	return unsubscribe;
}

export function onPlayersChange(callback: (id: string, type: string, data: DocumentData) => void) {
	const unsubscribe = onSnapshot(getPlayersCollRef(), (snapshot) => {
		snapshot.docChanges().forEach((change) => {
			callback(change.doc.id, change.type, change.doc.data());
		});
	});

	return unsubscribe;
}

export function onNewCandidate(
	playerID: string,
	callback: (candidate: DocumentData) => Promise<void>
) {
	const unsubscribe = onSnapshot(
		collection(getMessageDocRef(playerID, get(userID)), 'candidates'),
		(snapshot) => {
			snapshot.docChanges().forEach(async (change) => {
				if (change.type === 'added') {
					callback(change.doc.data());
				}
			});
		}
	);

	return unsubscribe;
}

export function onNewMessage(playerID: string, callback: (message: DocumentData) => Promise<void>) {
	const unsubscribe = onSnapshot(getMessageDocRef(playerID, get(userID)), async (snapshot) => {
		const message = snapshot.data();

		if (!message) return;

		callback(message);
	});

	return unsubscribe;
}

export function onPlayerState(
	uid: string,
	callback: (state: 'offline' | 'online') => Promise<void>
) {
	const playerStatusRef = ref(database, uid);

	const unsubscribe = onValue(
		playerStatusRef,
		async (snapshot) => {
			const state = snapshot.val();
			if (state) {
				await callback(state);
			} else {
				console.log('No status available for player ' + uid);
			}
		},
		(errorObject) => {
			console.log('The read failed: ' + errorObject.name);
		}
	);
	return unsubscribe;
}
