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

// Initializing the Firebase application if not already initialized
let app;
if (!getApps().length) {
	app = initializeApp(firebaseConfig);
} else {
	app = getApps()[0]; // get the already initialized app
}

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

/**
 * Listen to authentication state changes.
 * If a user logs in, manage their online/offline status in the realtime database.
 */
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

/**
 * Sign out the user if currently signed in.
 */
export async function signOut() {
	if (auth.currentUser) {
		try {
			await auth.signOut();
		} catch (error) {
			throw new Error('there was an Error signing out...');
		}
	}
}

// Firestore utility methods

/**
 * @return Document reference to the game.
 */
function getGameDocRef() {
	const gameDocRef = doc(firestore, 'games', get(gameID));
	return gameDocRef;
}

/**
 * @return Collection reference to players under a game.
 */
function getPlayersCollRef() {
	const playersCollRef = collection(getGameDocRef(), 'players');
	return playersCollRef;
}

/**
 * @param {string} [playerID=get(userID)] - The ID of the player.
 * @return Document reference to a specific player. Defaults to current user if no ID provided.
 */
function getPlayerDocRef(playerID = get(userID)) {
	const playerDocRef = doc(getPlayersCollRef(), playerID);
	return playerDocRef;
}

/**
 * @param {string} callerID - ID of the caller.
 * @param {string} calleeID - ID of the callee.
 * @return Document reference for the message between caller and callee.
 */
function getMessageDocRef(callerID: string, calleeID: string) {
	const callDocRef = doc(getPlayerDocRef(callerID), 'calls', calleeID);
	return callDocRef;
}

/**
 * Create a new game in Firestore.
 * @param {Game} game - The game object to be created.
 */
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

/**
 * Update the state (and optionally the turn) of a game.
 * @param {'open' | 'closed' | 'over'} state - The new state of the game.
 * @param {number} [turn] - The turn number.
 */
export async function updateGame(state: 'open' | 'closed' | 'over', turn?: number) {
	await updateDoc(getGameDocRef(), turn !== undefined ? { state, turn } : { state });
}

/**
 * Update a player's information.
 * @param {number} remaining - The remaining attempts.
 * @param {number[]} throws - The throws array.
 * @param {number} avg - The average score.
 */
export async function updatePlayer(remaining: number, throws: number[], avg: number) {
	await updateDoc(getPlayerDocRef(), { remaining, throws, avg });
}

/**
 * Send an RTC candidate to another player.
 * @param {string} playerID - The ID of the other player.
 * @param {RTCIceCandidate} candidate - The RTC candidate to send.
 */
export async function sendCandidate(playerID: string, candidate: RTCIceCandidate) {
	await addDoc(collection(getMessageDocRef(get(userID), playerID), 'candidates'), candidate.toJSON());
}

/**
 * Send an RTC message to another player.
 * @param {string} playerID - The ID of the other player.
 * @param {RTCMessage} message - The RTC message to send.
 */
export async function sendMessage(playerID: string, message: RTCMessage) {
	await setDoc(getMessageDocRef(get(userID), playerID), message);
}

/**
 * Delete an RTC message.
 * @param {string} playerID - The ID of the other player.
 */
export async function deleteMessage(playerID: string) {
	await deleteDoc(getMessageDocRef(get(userID), playerID));
}

/**
 * Subscribe to game state changes.
 * @param {function(Game):void} callback - The callback to be invoked with the game data.
 * @return Function to unsubscribe from game state changes.
 */
export function onGameState(callback: (game: Game) => void) {
	const unsubscribe = onSnapshot(getGameDocRef(), (snapshot) => {
		const game = snapshot.data() as Game;
		callback(game);
	});

	return unsubscribe;
}

/**
 * Subscribe to changes in the players collection.
 * @param {function(string, string, DocumentData):void} callback - The callback to be invoked with the changes.
 * @return Function to unsubscribe from players collection changes.
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
 * Subscribe to new RTC candidates from a specific player.
 * @param {string} playerID - The ID of the other player.
 * @param {function(DocumentData):Promise<void>} callback - The callback to be invoked with the candidate.
 * @return Function to unsubscribe from new candidates.
 */
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

/**
 * Subscribe to new RTC messages from a specific player.
 * @param {string} playerID - The ID of the other player.
 * @param {function(DocumentData):Promise<void>} callback - The callback to be invoked with the message.
 * @return Function to unsubscribe from new messages.
 */
export function onNewMessage(playerID: string, callback: (message: DocumentData) => Promise<void>) {
	const unsubscribe = onSnapshot(getMessageDocRef(playerID, get(userID)), async (snapshot) => {
		const message = snapshot.data();

		if (!message) return;

		callback(message);
	});

	return unsubscribe;
}

/**
 * Monitor the online/offline status of a specific player in the realtime database.
 * @param {string} uid - The UID of the player.
 * @param {function('offline' | 'online'):Promise<void>} callback - The callback to be invoked with the player's state.
 * @return Function to unsubscribe from the player's state changes.
 */
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
