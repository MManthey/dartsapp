<script>
	import { onMount, onDestroy } from 'svelte';
	import { collection, onSnapshot } from 'firebase/firestore';
	import { players } from '$lib/store.js';
	import { db } from '$lib/firebase.js';

	export let data;

	let settings = data.settings;
	let id = data.id;
	let unsubscribe;

	let playersRef = collection(db, 'games', id, 'players');
	onMount(() => {
		unsubscribe = onSnapshot(playersRef, (snapshot) => {
			players.set(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
		});
	});

	onDestroy(() => {
		if (unsubscribe) {
			unsubscribe();
		}
	});
</script>

<h1>Game</h1>
<h2>Settings</h2>
<pre>{JSON.stringify(settings, null, 2)}</pre>

<h2>Players</h2>
<ul>
	{#each $players as player (player.id)}
		<li>{player.nickName}</li>
	{/each}
</ul>
