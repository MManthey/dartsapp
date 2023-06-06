// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, addDoc, getDoc, getDocs, collection } from 'firebase/firestore';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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

/**
 * 
 */
const app = initializeApp(firebaseConfig);

/**
 * 
 */
const db = getFirestore(app);

/**
 * 
 * @param {*} settings 
 * @returns 
 */
export async function createGame(settings) {
	const gamesRef = collection(db, 'games');
	const gameRef = await addDoc(gamesRef, { ...settings });
	return gameRef;
}

/**
 * 
 * @param {*} code 
 * @param {*} name 
 * @returns 
 */
export async function createPlayer(code, name) {
	const gameRef = doc(db, 'games', code);
	const gameSnap = await getDoc(gameRef);

	if (!gameSnap.exists()) {
		throw new Error(`Game#${code} does not exist.`);
	}

	const gameData = gameSnap.data();
	const playerCap = gameData.playerCap;
	const playersRef = collection(gameRef, 'players');
	const playersSnap = await getDocs(playersRef);
	const playerCount = playersSnap.size;

	if (playerCount >= playerCap) {
		throw new Error(`Game#${code} is already full.`);
	} 

	const playerRef = await addDoc(playersRef, { name });
	return playerRef;
}

export { db };
