<script>
	import { goto } from '$app/navigation';
	import { doc, getDoc, collection, addDoc, getDocs } from 'firebase/firestore';
	import { nickName } from '$lib/store.js';
	import { db } from '$lib/firebase.js';

	let code = '';

	async function joinGame() {
		const gameRef = doc(db, 'games', code);
		const gameSnap = await getDoc(gameRef);

		if (!gameSnap.exists()) {
			alert('No game found with the given code.');
			return;
		}

		const gameData = gameSnap.data();
		const playerCap = gameData.playerCap;
		const playersRef = collection(gameRef, 'players');
		const playersSnap = await getDocs(playersRef);
		const playerCount = playersSnap.size;

		if (playerCount < playerCap) {
			await addDoc(playersRef, { nickName: $nickName });
			goto(`/${code}`);
		} else {
			alert('This game is already full.');
		}
	}

	// This function is called when the 'Create Game' button is clicked.
	function createGame() {
		goto('/createGame');
	}
</script>

<div class="logo">
	<img src="/darts.png" alt="dartsapp logo" />
	<h1>dartsapp</h1>
</div>
<input type="text" placeholder="Enter a Nickname" bind:value={$nickName} />
<input type="text" placeholder="Enter a Gamecode" bind:value={code} />
<button type="button" disabled={!$nickName || !code} on:click={joinGame}>Join Game</button>
<button type="button" disabled={!$nickName} on:click={createGame}>Create Game</button>

<style>
	.logo {
		display: flex;
		flex-direction: row;
		align-items: center;
	}
	img {
		width: 30px;
	}
	button,
	input {
		margin: 10px 0px;
		width: 100%;
	}
</style>
