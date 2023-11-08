import { get } from 'svelte/store';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
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
	type DocumentData,
	serverTimestamp as firestoreServerTimestamp
} from 'firebase/firestore';
import {
	getDatabase,
	ref,
	set,
	onValue,
	onDisconnect,
	serverTimestamp as databaseServerTimestamp
} from 'firebase/database';
import { isOnline, gameID, userID, userName } from '$lib/stores.js';

// Firebase Configuration is fetched from environment variables
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

// Initializing the Firebase application
const app = initializeApp(firebaseConfig);

// Creating references to Firebase services: Authentication, Firestore and Realtime Database
const auth = getAuth();
const firestore = getFirestore(app);
const database = getDatabase(app);

// Authentication methods

/**
 * Sign in the user anonymously if not already signed in.
 * Set the user's ID once signed in.
 */
export async function signIn() {
	if (!auth.currentUser) {
		await signInAnonymously(auth);
	}
}

/**
 * Listen to authentication state changes.
 * If a user logs in, manage their online/offline status in the realtime database.
 */
onAuthStateChanged(auth, (user) => {
	if (user) {
		const id = user.uid;
		userID.set(id);

		const userStatusDatabaseRef = ref(database, '/status/' + id);
		const userStatusFirestoreRef = doc(firestore, '/status/' + id);

		const isOfflineForDatabase = {
			state: 'offline',
			last_changed: databaseServerTimestamp()
		};

		const isOnlineForDatabase = {
			state: 'online',
			last_changed: databaseServerTimestamp()
		};

		const isOfflineForFirestore = {
			state: 'offline',
			last_changed: firestoreServerTimestamp()
		};

		const isOnlineForFirestore = {
			state: 'online',
			last_changed: firestoreServerTimestamp()
		};

		const connectedRef = ref(database, '.info/connected');

		onValue(connectedRef, (snapshot) => {
			if (snapshot.val() === false) {
				isOnline.set(false);
				setDoc(userStatusFirestoreRef, isOfflineForFirestore);
				return;
			}

			onDisconnect(userStatusDatabaseRef)
				.set(isOfflineForDatabase)
				.then(() => {
					isOnline.set(true);
					set(userStatusDatabaseRef, isOnlineForDatabase);
					setDoc(userStatusFirestoreRef, isOnlineForFirestore);
				});
		});
	}
});

/**
 * Sign out the user if currently signed in.
 */
export async function signOut() {
	if (auth.currentUser) {
		await auth.signOut();
	}
}

// Firestore utility methods

/**
 *
 * @returns
 */
function getGameDocRef() {
	return doc(firestore, 'games', get(gameID));
}

/**
 *
 * @returns
 */
function getPlayersCollRef() {
	return collection(getGameDocRef(), 'players');
}

/**
 *
 * @param playerID
 * @returns
 */
function getPlayerDocRef(playerID: string = get(userID)) {
	return doc(getPlayersCollRef(), playerID);
}

/**
 *
 * @param callerID
 * @param calleeID
 * @returns
 */
function getMessageDocRef(callerID: string, calleeID: string) {
	return doc(getPlayerDocRef(callerID), 'calls', calleeID);
}

/**
 *
 * @returns
 */
export async function generateShortId() {
	const length = 6;
	const maxRetries = 10;
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

	for (let retryCount = 0; retryCount < maxRetries; retryCount++) {
		let shortId = '';
		for (let i = 0; i < length; i++) {
			shortId += chars[Math.floor(Math.random() * chars.length)];
		}
		const q = query(collection(firestore, 'games'), where('shortId', '==', shortId));
		const querySnapshot = await getDocs(q);

		if (querySnapshot.empty) {
			return shortId;
		}
	}
	throw new Error(`Could not create shortId in ${maxRetries} tries.`);
}

/**
 *
 * @param game
 */
export async function createGame(game: Game) {
	const gamesCollRef = collection(firestore, 'games');
	const gameRef = await addDoc(gamesCollRef, game);
	gameID.set(gameRef.id);
}

/**
 *
 */
export async function deleteGame() {
	await deleteDoc(getGameDocRef());
}

/**
 * Join an existing game using its short ID.
 * @param {string} shortId - The short ID of the game.
 */
export async function joinGame(shortId: string) {
	const q = query(collection(firestore, 'games'), where('shortId', '==', shortId));
	const querySnapshot = await getDocs(q);

	if (querySnapshot.empty) {
		throw new Error('Game does not exist!');
	} else if (querySnapshot.size > 1) {
		throw new Error('There are multiple games with the same shortId!');
	}
	const gameSnap = querySnapshot.docs[0];
	gameID.set(gameSnap.id);
	const game = gameSnap.data() as Game;

	const playersCollRef = getPlayersCollRef();
	if (!playersCollRef) return;

	const playersCollSnap = await getDocs(playersCollRef);
	const playerCount = playersCollSnap.size;

	if (game.state !== 'open' || playerCount >= game.size) {
		throw new Error('Game is already in session!');
	}

	if (playerCount === game.size - 1) {
		await updateGame({ ...game, state: 'closed' });
	}

	const remaining = game.gameMode;

	const playerDocRef = getPlayerDocRef();
	if (!playerDocRef) return;

	await setDoc(playerDocRef, {
		name: get(userName),
		idx: playerCount,
		remaining,
		darts: [
			{ s: null, x: 1 },
			{ s: null, x: 1 },
			{ s: null, x: 1 }
		],
		dartIdx: 0,
		avg: 0,
		sets: 0,
		legs: 0
	});
}

/**
 *
 * @param game
 */
export async function updateGame(game: Game) {
	await updateDoc(getGameDocRef(), { ...game });
}

/**
 *
 * @param player
 * @param playerID
 */
export async function updatePlayer(player: Player, playerID: string = get(userID)) {
	console.log('Updating player.');
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { id, ...playerWithoutIdAndStream } = player;
	const playerDocRef = getPlayerDocRef(playerID);
	await updateDoc(playerDocRef, playerWithoutIdAndStream);
}

/**
 *
 */
export async function deletePlayer() {
	await deleteDoc(getPlayerDocRef());
}

/**
 *
 * @param playerID
 * @param candidate
 */
export async function sendCandidate(playerID: string, candidate: RTCIceCandidate) {
	const messageDocRef = getMessageDocRef(get(userID), playerID);
	await addDoc(collection(messageDocRef, 'candidates'), candidate.toJSON());
}

/**
 *
 * @param playerID
 * @param message
 */
export async function sendMessage(playerID: string, message: RTCMessage) {
	const messageDocRef = getMessageDocRef(get(userID), playerID);
	await setDoc(messageDocRef, message);
}

/**
 *
 * @param playerID
 */
export async function deleteMessage(playerID: string) {
	const messageDocRef = getMessageDocRef(get(userID), playerID);
	await deleteDoc(messageDocRef);
}

/**
 *
 * @param callback
 * @returns
 */
export function onGameState(callback: (game: Game) => void) {
	const unsubscribe = onSnapshot(getGameDocRef(), (snapshot) => {
		const game = snapshot.data() as Game;
		callback(game);
	});
	return unsubscribe;
}

/**
 *
 * @param callback
 * @returns
 */
export function onPlayersChange(callback: (id: string, type: string, data: DocumentData) => void) {
	const unsubscribe = onSnapshot(getPlayersCollRef(), (snapshot) => {
		snapshot.docChanges().forEach((change) => {
			callback(change.doc.id, change.type, change.doc.data());
		});
	});

	return unsubscribe;
}

/**
 *
 * @param playerID
 * @param callback
 * @returns
 */
export function onNewCandidate(
	playerID: string,
	callback: (candidate: DocumentData) => Promise<void>
) {
	const messageDocRef = getMessageDocRef(playerID, get(userID));
	const candidatesCollRef = collection(messageDocRef, 'candidates');
	const unsubscribe = onSnapshot(candidatesCollRef, (snapshot) => {
		snapshot.docChanges().forEach(async (change) => {
			if (change.type === 'added') {
				await callback(change.doc.data());
			}
		});
	});
	return unsubscribe;
}

/**
 *
 * @param playerID
 * @param callback
 * @returns
 */
export function onNewMessage(playerID: string, callback: (message: DocumentData) => Promise<void>) {
	const messageDocRef = getMessageDocRef(playerID, get(userID));
	const unsubscribe = onSnapshot(messageDocRef, async (snapshot) => {
		const message = snapshot.data();
		if (!message) return;
		await callback(message);
	});

	return unsubscribe;
}

/**
 *
 * @param uid
 * @param callback
 * @returns
 */
export function onPlayerState(
	uid: string,
	callback: (state: 'offline' | 'online') => Promise<void>
) {
	const userStatusFirestoreRef = doc(firestore, '/status/' + uid);
	const unsubscribe = onSnapshot(userStatusFirestoreRef, async (snapshot) => {
		if (snapshot.exists()) {
			const data = snapshot.data();
			const state = data?.state;
			if (state) {
				await callback(state);
			}
		}
	});
	return unsubscribe;
}
