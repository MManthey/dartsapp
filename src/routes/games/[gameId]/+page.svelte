<script lang="ts">
	import Scoreboard from '$lib/components/Scoreboard.svelte';
	import ScoreInput from '$lib/components/ScoreInput.svelte';
	import VideoChat from '$lib/components/VideoChat.svelte';

	import { goto } from '$app/navigation';
	import { onMount, onDestroy } from 'svelte';
	import { userID, gameID, game, players } from '$lib/stores';
	import {
		sendCandidate,
		sendMessage,
		deleteMessage,
		updateGame,
		updatePlayer,
		onPlayerState,
		onGameState,
		onPlayersChange,
		onNewCandidate,
		onNewMessage,
		signOut,
		deletePlayer,
		deleteGame
	} from '$lib/firebase';
	import {
		CameraIcon,
		CameraOffIcon,
		MicIcon,
		MicOffIcon,
		LogOutIcon,
		CopyIcon
	} from 'svelte-feather-icons';
	import { Modal, modalStore } from '@skeletonlabs/skeleton';
	import type { ModalSettings } from '@skeletonlabs/skeleton';
	import { errorToast, successToast } from '$lib/toast';

	const servers = {
		iceServers: [
			{
				urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302']
				// turn server ??? -> https://www.metered.ca/tools/openrelay/
			}
		],
		iceCandidatePoolSize: 10
	};
	const subscriptions: (() => void)[] = [];

	let index: number;
	let camOn = false;
	let micOn = false;
	let peers: Map<string, Peer> = new Map();
	let localStream: MediaStream;

	/**
	 * Toggle the state of the camera.
	 * If the camera is off, it will be turned on, and vice versa.
	 */
	async function toggleCam() {
		try {
			if (!camOn) {
				const camStream = await navigator.mediaDevices.getUserMedia({ video: true });
				camStream.getVideoTracks().forEach((track) => {
					localStream.addTrack(track);
					for (let { pc } of peers.values()) {
						pc.addTrack(track);
					}
				});
			} else {
				localStream.getVideoTracks().forEach((track) => {
					track.stop();
					localStream.removeTrack(track);
					for (let { pc } of peers.values()) {
						let sender = pc.getSenders().find((s) => s.track === track);
						sender && pc.removeTrack(sender);
					}
				});
			}
			camOn = !camOn;
			$players[index].stream = localStream; // rerender
		} catch (err) {
			console.error(err);
			errorToast('Could not access the camera.');
		}
	}

	/**
	 * Toggle the state of the microphone.
	 * If the microphone is off, it will be turned on, and vice versa.
	 */
	async function toggleMic() {
		try {
			if (!micOn) {
				const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
				micStream.getAudioTracks().forEach((track) => {
					localStream.addTrack(track);
					for (let { pc } of peers.values()) {
						pc.addTrack(track);
					}
				});
			} else {
				localStream.getAudioTracks().forEach((track) => {
					track.stop();
					localStream.removeTrack(track);
					for (let { pc } of peers.values()) {
						let sender = pc.getSenders().find((s) => s.track === track);
						sender && pc.removeTrack(sender);
					}
				});
			}
			micOn = !micOn;
		} catch (err) {
			console.error(err);
			errorToast('Could not access the microphone.');
		}
	}

	/**
	 *
	 */
	async function leaveGame() {
		// $game must be set
		if (!$game) return;

		await cleanup();

		switch ($game.state) {
			case 'open':
				if ($players.length === 1) {
					await deleteGame();
				}
				await deletePlayer();
				break;
			case 'closed':
				const newSize = $game.size - 1;
				const turn = $game.turn === index && index === $game.size - 1 ? 0 : index;
				await deletePlayer();
				if (newSize > 0) {
					const size = newSize as 1 | 2 | 3 | 4;
					await updateGame({ ...$game, size, turn });
				} else {
					await deleteGame();
				}
				for (let i = index + 1; i < $players.length; i++) {
					await updatePlayer({ ...$players[i], idx: i - 1 });
				}
				break;
			case 'over':
				break;
		}

		goto('/');

		$gameID = '';
		$game = null;
		$players = [];
	}

	/**
	 * Set up a WebRTC connection with a given player.
	 * @param {string} playerID - The ID of the player to connect to.
	 * @param {number} idx - The index of the player in the players array.
	 */
	async function setupConnection(playerID: string, idx: number) {
		const remoteStream = new MediaStream();
		const pc = new RTCPeerConnection(servers);
		const subs: (() => void)[] = [];

		// add any initial tracks to the pc
		localStream.getTracks().forEach((track) => {
			pc.addTrack(track);
		});

		// listen to new local candidates -> upload them to the server
		pc.onicecandidate = async ({ candidate }) => {
			candidate && (await sendCandidate(playerID, candidate));
		};

		// initiate new negotiation if needed
		pc.onnegotiationneeded = async () => {
			// create offer description and set local description
			const offerDescription = await pc.createOffer();
			await pc.setLocalDescription(offerDescription);

			// create offer object and upload to server
			const offer = {
				sdp: offerDescription.sdp,
				type: offerDescription.type
			};
			await sendMessage(playerID, { offer });
		};

		// listen for remote tracks being added
		pc.ontrack = ({ track }) => {
			track.onmute = () => {
				remoteStream.removeTrack(track);
				$players[idx].stream = remoteStream; // rerender
			};
			remoteStream.addTrack(track);
			$players[idx].stream = remoteStream;
		};

		// listen for new remote candidates being added
		subs.push(
			onNewCandidate(playerID, async (candidate) => {
				pc.remoteDescription && (await pc.addIceCandidate(new RTCIceCandidate(candidate)));
			}),
			onNewMessage(playerID, async (message) => {
				if ('offer' in message) {
					// set remote description with incoming offer
					await pc.setRemoteDescription(new RTCSessionDescription(message.offer));

					// create answer from offer and set local description
					const answerDescription = await pc.createAnswer();
					await pc.setLocalDescription(answerDescription);

					// create answer and push it to the signaling server
					const answer = {
						type: answerDescription.type,
						sdp: answerDescription.sdp
					};
					await sendMessage(playerID, { answer });
				} else if ('answer' in message) {
					pc.setRemoteDescription(new RTCSessionDescription(message.answer));
					await sendMessage(playerID, { resetMe: true });
					await deleteMessage(playerID);
				} else if ('resetMe' in message) {
					await deleteMessage(playerID);
				}
			})
		);

		return { pc, subs };
	}

	/**
	 * Handle the end of a player's turn.
	 * Update the player's state and the game's state based on the darts thrown.
	 * @param {CustomEvent<Dart[]>} event - Event containing the darts thrown by the player.
	 */
	async function endTurn(event: CustomEvent<Dart[]>) {
		// $game must be set
		if (!$game) return;

		const darts = event.detail;
		let { remaining, throws, avg, legs, sets } = $players[index];

		let points = darts.reduce((total, dart) => {
			return total + (dart.s || 0) * dart.x;
		}, 0);

		const doubles = darts.filter((darts) => darts.s !== 0 && darts.x === 2);
		const bust = points > remaining;
		const pointsFit = points === remaining;
		const brokeDoubles = pointsFit && $game.outMode === 'double' && !doubles.pop();

		points = bust || brokeDoubles ? 0 : points;

		remaining = remaining - points;
		throws = throws ? [...throws, points] : [points];
		avg = throws.reduce((a, b) => a + b, 0) / throws.length;

		// was leg won? -> increment player legs, reset points
		const legWon = remaining === 0;
		if (legWon) {
			legs += 1;
			// was set won? -> increment player sets, reset legs and points
			const setWon = legs === $game.legs;
			if (setWon) {
				sets += 1;
				await updatePlayer({ ...$players[index], sets });
				for (let i = 0; i < $game.size; i++) {
					await updatePlayer(
						{
							...$players[i],
							legs: 0,
							remaining: Number($game.gameMode),
							throws: [],
							avg: 0
						},
						$players[i].id
					);
				}
			} else {
				await updatePlayer({ ...$players[index], legs });
				for (let i = 0; i < $game.size; i++) {
					await updatePlayer(
						{
							...$players[i],
							remaining: Number($game.gameMode),
							throws: [],
							avg: 0
						},
						$players[i].id
					);
				}
			}
		} else {
			await updatePlayer({ ...$players[index], remaining, throws, avg });
		}

		// was game won? -> end the game
		const gameWon = sets === $game.sets;

		const turn = legWon || $game.size === 1 ? 0 : gameWon ? $game.turn : (index + 1) % $game.size;
		const state = gameWon ? 'over' : $game.state;

		await updateGame({ ...$game, state, turn });
	}

	/**
	 * Copies the shortId of the game to the clipboard.
	 */
	async function copyShortId() {
		// $game must be set
		if (!$game) return;

		try {
			if (!$game.shortId) return;
			await navigator.clipboard.writeText($game.shortId);
			successToast(`${$game.shortId} copied to clipboard.`);
		} catch (err) {
			console.error(err);
			errorToast('Could not copy to clipboard.');
		}
	}

	/**
	 *
	 */
	async function cleanup() {
		subscriptions.forEach((unsubscribe) => unsubscribe());
		for (let { pc, subs } of peers.values()) {
			subs.forEach((unsubscribe) => unsubscribe());
			localStream.getTracks().forEach((track) => {
				let sender = pc.getSenders().find((s) => s.track === track);
				sender && pc.removeTrack(sender);
			});
			pc.close();
		}

		for (let { stream } of $players) {
			stream?.getTracks().forEach((track) => {
				track.stop();
				stream?.removeTrack(track);
			});
		}
		// await signOut();
	}

	/**
	 * Set up initial event listeners and state when the component is mounted.
	 */
	onMount(async () => {
		localStream = new MediaStream();
		subscriptions.push(
			onGameState((newGame) => {
				$game = newGame;
				if ($game?.state === 'over') {
					const modal: ModalSettings = {
						type: 'alert',
						title: 'We have a winner!',
						body: `Congratulations to ${$players[$game.turn].name}!`
					};
					modalStore.trigger(modal);
				}
			}),
			onPlayersChange((id, type, data) => {
				const idx = data.idx;
				const isUser = id === $userID;
				if (type === 'added') {
					let stream = new MediaStream();
					if (!isUser) {
						subscriptions.push(
							onPlayerState(id, async (state) => {
								if (state === 'online') {
									const { pc, subs } = await setupConnection(id, idx);
									peers.set(id, { pc, subs });
								} else {
									let peer = peers.get(id);
									let remoteStream = $players[idx].stream;

									peer?.subs.forEach((unsubscribe) => unsubscribe());
									peer?.pc.close();

									// needs video rerendering
									remoteStream?.getTracks().forEach((track) => {
										track.stop();
										remoteStream?.removeTrack(track);
									});

									peers.delete(id);
								}
							})
						);
					} else {
						index = idx;
						stream = localStream;
					}
					$players[idx] = { id, ...data, stream } as Player;
				} else if (type === 'modified') {
					$players[idx] = { ...$players[idx], ...data };
				} else if (type === 'removed') {
					let peer = peers.get(id);
					let remoteStream = $players[idx].stream;

					peer?.subs.forEach((unsubscribe) => unsubscribe());
					peer?.pc.close();

					// needs video rerendering
					remoteStream?.getTracks().forEach((track) => {
						track.stop();
						remoteStream?.removeTrack(track);
					});

					peers.delete(id);
					$players = $players.filter((player) => player.idx !== idx);
				}
			})
		);
	});

	/**
	 * Clean up event listeners and state when the component is destroyed.
	 */
	onDestroy(async () => {
		await cleanup();
	});
</script>

<div class="flex flex-col gap-12 items-center">
	{#if $game?.state === 'open'}
		<button class="btn btn-xl variant-ghost rounded-lg" on:click={copyShortId}>
			#{$game.shortId}
			<CopyIcon class="ml-5" />
		</button>
	{/if}
	<VideoChat players={$players} />
	{#if $game?.state === 'closed' && $game.turn === index}
		<ScoreInput
			on:scoreInput={endTurn}
			outMode={$game.outMode}
			remaining={$players[index].remaining || Number($game.gameMode)}
		/>
	{/if}
	<Scoreboard game={$game} players={$players} />
	<div class="sticky bottom-5 flex flex-row justify-center gap-5 mt-5">
		<button
			class="btn-icon btn-icon-xl {!camOn ? 'variant-filled-error' : 'variant-filled-secondary'}"
			type="button"
			on:click={toggleCam}
		>
			{#if !camOn}<CameraOffIcon /> {:else} <CameraIcon />{/if}
		</button>
		<button
			class="btn-icon btn-icon-xl {!micOn ? 'variant-filled-error' : 'variant-filled-secondary'}"
			type="button"
			on:click={toggleMic}
		>
			{#if !micOn}<MicOffIcon /> {:else} <MicIcon />{/if}
		</button>
		<button class="btn-icon btn-icon-xl variant-filled-error" type="button" on:click={leaveGame}>
			<LogOutIcon />
		</button>
	</div>
</div>
<Modal />
