<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import {
		modalStore,
		ProgressRadial,
		RadioGroup,
		RadioItem,
		Ratings
	} from '@skeletonlabs/skeleton';
	import type { ModalSettings, ModalComponent } from '@skeletonlabs/skeleton';
	import type { DocumentData } from 'firebase/firestore';
	import {
		CameraIcon,
		CameraOffIcon,
		MicIcon,
		MicOffIcon,
		LogOutIcon,
		CopyIcon
	} from 'svelte-feather-icons';

	import { errorToast, successToast } from '$lib/toast';
	import { userId, gameId, game, players } from '$lib/stores';
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
		deletePlayer,
		deleteGame
	} from '$lib/firebase';
	import { dartStr } from '$lib/util';

	import Scoreboard from '$lib/components/Scoreboard.svelte';
	import ScoreInput from '$lib/components/ScoreInput.svelte';
	import VideoPlayer from '$lib/components/VideoPlayer.svelte';
	import DartSVG from '$lib/components/DartSVG.svelte';
	import WinnerModal from '$lib/components/WinnerModal.svelte';

	import { gameData } from '../../../store/localStore';

	const subscriptions: (() => void)[] = [];
	const playerStateSubs: Map<string, () => void> = new Map();

	let index: number;
	let camOn = false;
	let camLoading = false;
	let micOn = false;
	let micLoading = false;
	let leaveLoading = false;
	let peers: Map<string, Peer> = new Map();
	let streams: Map<string, MediaStream> = new Map();
	let onTurnPlayerId: string;
	let offTurnPlayers: Player[];
	let mode = 'chat';

	$: if ($game && $players[$game.turnIdx] && $players[$game.turnIdx].id !== onTurnPlayerId) {
		onTurnPlayerId = $players[$game.turnIdx].id || '';
	}

	// $: console.log('index:', index);
	// $: console.log('camOn:', camOn);
	// $: console.log('micOn:', micOn);
	// $: console.log('peers:', peers);
	$: streams.forEach((stream, id) =>
		console.log(
			`${id}:`,
			stream
				.getTracks()
				.map((track) => `${track.kind}`)
				.join(', ')
		)
	);
	// $: console.log('onTurnPlayerId:', onTurnPlayerId);
	// $: console.log('offTurnPlayers:', offTurnPlayers);
	// $: console.log('mode:', mode);

	//special Day calc for data storage
	const currentDate = new Date();
	let currentDay = Math.floor(
            (Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()) -
                Date.UTC(currentDate.getFullYear(), 0, 1)) /
                (24 * 60 * 60 * 1000)
        );

	async function handleCamBtn(): Promise<void> {
		try {
			const localStream = streams.get($userId);
			if (!localStream) return;

			camLoading = true;
			if (!camOn) {
				const camStream = await navigator.mediaDevices.getUserMedia({ video: true });
				camStream.getVideoTracks().forEach((track) => {
					localStream.addTrack(track);
					peers.forEach(({ pc }) => pc.addTrack(track));
				});
			} else {
				localStream.getVideoTracks().forEach((track) => {
					track.stop();
					localStream.removeTrack(track);
					peers.forEach(({ pc }) => {
						let sender = pc.getSenders().find((s) => s.track === track);
						sender && pc.removeTrack(sender);
					});
				});
			}
			camOn = !camOn;
			streams = streams.set($userId, localStream);
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : 'Unknown error while toggling the camera.';
			console.error(msg);
			errorToast(msg);
		} finally {
			camLoading = false;
		}
	}

	async function handleMicBtn(): Promise<void> {
		micLoading = true;
		try {
			const localStream = streams.get($userId);
			if (!localStream) return;

			micLoading = true;
			if (!micOn) {
				const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
				micStream.getAudioTracks().forEach((track) => {
					localStream.addTrack(track);
					peers.forEach(({ pc }) => pc.addTrack(track));
				});
			} else {
				localStream.getAudioTracks().forEach((track) => {
					track.stop();
					localStream.removeTrack(track);
					peers.forEach(({ pc }) => {
						let sender = pc.getSenders().find((s) => s.track === track);
						sender && pc.removeTrack(sender);
					});
				});
			}
			micOn = !micOn;
			streams = streams.set($userId, localStream);
		} catch (err: unknown) {
			const msg =
				err instanceof Error ? err.message : 'Unknown error while toggling the microphone.';
			console.error(msg);
			errorToast(msg);
		} finally {
			micLoading = false;
		}
	}

	async function handleLeaveBtn(): Promise<void> {
		leaveLoading = true;
		try {
			if (!$game) {
				throw new Error('Game was undefined before leaving game.');
			}

			cleanup();

			if ($game.state !== 'over') {
				if ($players.length === 1) {
					await deleteGame();
				} else {
					const turnIdx =
						$game.turnIdx === $game.size - 1 || $game.state === 'open' ? 0 : $game.turnIdx;
					await deletePlayer();
					const size = ($players.length - 1) as GameSize;
					await updateGame({ ...$game, size, turnIdx });
					for (let i = index + 1; i < $players.length; i++) {
						await updatePlayer({ ...$players[i], idx: i - 1 }, $players[i].id);
					}
				}
			}
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : 'Unknown error while leaving game.';
			console.error(msg);
			errorToast(msg);
		} finally {
			$game = null;
			$gameId = '';
			$players = [];
			leaveLoading = false;
			goto('/');
		}
	}

	function connect(id: string): void {
		console.log('connect');
		const localStream = streams.get($userId);
		if (!localStream) return;

		// https://dashboard.metered.ca
		const servers = {
			iceServers: [
				{
					urls: 'stun:stun.relay.metered.ca:80'
				},
				{
					urls: 'turn:a.relay.metered.ca:80',
					username: '116b3e20b7ed5dbd0f2d0052',
					credential: 'iHfS6C8BFvPXBRgx'
				},
				{
					urls: 'turn:a.relay.metered.ca:80?transport=tcp',
					username: '116b3e20b7ed5dbd0f2d0052',
					credential: 'iHfS6C8BFvPXBRgx'
				},
				{
					urls: 'turn:a.relay.metered.ca:443',
					username: '116b3e20b7ed5dbd0f2d0052',
					credential: 'iHfS6C8BFvPXBRgx'
				},
				{
					urls: 'turn:a.relay.metered.ca:443?transport=tcp',
					username: '116b3e20b7ed5dbd0f2d0052',
					credential: 'iHfS6C8BFvPXBRgx'
				}
			]
		};

		const pc = new RTCPeerConnection(servers);
		const remoteStream = new MediaStream();
		const subs: (() => void)[] = [];

		// pc.oniceconnectionstatechange = () => {
		// 	console.log(`ICE Connection State: ${pc.iceConnectionState}`);
		// };
		pc.onsignalingstatechange = () => {
			console.log(`Signaling State: ${pc.signalingState}`);
		};
		// pc.onicegatheringstatechange = () => {
		// 	console.log(`ICE Gathering State: ${pc.iceGatheringState}`);
		// };
		pc.onconnectionstatechange = () => {
			console.log(`Connection State: ${pc.connectionState}`);
		};

		// add any initial tracks to the pc
		localStream.getTracks().forEach((track) => {
			console.log(`sending ${track.kind} to`);
			pc.addTrack(track);
		});

		// listen to new local candidates -> upload them to the server
		pc.onicecandidate = async ({ candidate }) => {
			candidate && (await sendCandidate(id, candidate));
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
			await sendMessage(id, { offer });
		};

		// listen for remote tracks being added
		pc.ontrack = ({ track }) => {
			const peer = peers.get(id);
			if (!peer) return;
			track.onmute = () => {
				console.log(`${id} removed ${track.kind}`);
				remoteStream.removeTrack(track);
				streams = streams.set(id, remoteStream);
			};
			console.log(`receiving ${track.kind} from ${id}`);
			remoteStream.addTrack(track);
			streams = streams.set(id, remoteStream);
		};

		// listen for new remote candidates being added
		subs.push(
			onNewCandidate(id, async (candidate) => {
				pc.remoteDescription && (await pc.addIceCandidate(new RTCIceCandidate(candidate)));
			}),
			onNewMessage(id, async (message) => {
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
					await sendMessage(id, { answer });
				} else if ('answer' in message) {
					pc.setRemoteDescription(new RTCSessionDescription(message.answer));
					await sendMessage(id, { resetMe: true });
					await deleteMessage(id);
				} else if ('resetMe' in message) {
					await deleteMessage(id);
				}
			})
		);

		streams = streams.set(id, remoteStream);
		peers = peers.set(id, { pc, subs });
	}

	function disconnect(id: string): void {
		console.log('disconnect');
		const peer = peers.get(id);
		peer?.pc.close();
		peer?.subs.forEach((unsubscribe) => unsubscribe());
		peers.delete(id);

		const stream = streams.get(id);
		stream?.getTracks().forEach((track) => {
			track.stop();
			stream.removeTrack(track);
		});
		streams.delete(id);
	}

	async function copyShortId(): Promise<void> {
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

	function cleanup(): void {
		subscriptions.forEach((unsubscribe) => unsubscribe());

		streams.forEach((stream) => {
			stream.getTracks().forEach((track) => {
				track.stop();
				stream.removeTrack(track);
			});
		});

		peers.forEach(({ pc, subs }) => {
			pc.close();
			subs.forEach((unsubscribe) => unsubscribe());
		});

		playerStateSubs.forEach((playerStateSub) => playerStateSub());
	}

	function onNewGameSize(newSize: GameSize): void {
		if (!$game) return;
		$game.size = newSize;
		offTurnPlayers = $players.filter((p) => p.idx !== $game?.turnIdx);
	}

	function onNewTurn(newTurnIdx: number): void {
		console.log('onNewTurn');
		if (!$game) return;
		const oldPlayer = $players[$game.turnIdx];
		if (oldPlayer) successToast(`${oldPlayer.name} scored ${oldPlayer.scores.slice(-1)}.`);
		$game.turnIdx = newTurnIdx;
		mode = newTurnIdx === index ? 'score' : 'chat';
		onTurnPlayerId = $players[newTurnIdx].id || '';
		offTurnPlayers = $players.filter((p) => p.idx !== newTurnIdx);
	}

	function onNewGameState(newState: GameState): void {
		console.log('onNewGameState');
		if (!$game) return;
		if (newState === 'closed' && $game?.turnIdx === index) {
			mode = 'score';
		} else if (newState === 'over') {
			// Überprüfen, ob der aktuelle Spieler gewonnen hat
			const winningPlayerId = $players[$game.turnIdx]?.id; // Spieler, der gewonnen hat
			const isCurrentPlayerWinner = winningPlayerId === $userId; // Ist es der ausführende Spieler?

			// Gewinne/Verluste für Statistiken bestimmen
			let winStat = isCurrentPlayerWinner ? true : false; // true = gewonnen, false = verloren
			gameData.addWinOrLoss(currentDay, winStat);

			const modalComponent: ModalComponent = {
				// Pass a reference to your custom component
				ref: WinnerModal,
				// Add the component properties as key/value pairs
				props: { background: 'bg-primary-500' },
				// Provide a template literal for the default component slot
				slot: `<p><span class="text-primary-900 text-white text-5xl">${
					$players[$game?.turnIdx || 0]?.name
				}</span></br> has won the match!</p>`
			};
			const modal: ModalSettings = {
				type: 'component',
				// Pass the component directly:
				component: modalComponent
			};
			modalStore.trigger(modal);
		}
		$game.state = newState;
	}

	function onPlayerJoin(id: string, idx: number, data: DocumentData, initialLoad: boolean): void {
		console.log('onPlayerJoin');
		const isUser = id === $userId;
		const player = { id, ...data } as Player;

		if (!isUser) {
			playerStateSubs.set(
				id,
				onPlayerState(id, (state) => {
					if (state === 'online' && peers.get(id) === undefined) {
						connect(id);
					} else if (state === 'offline' && peers.get(id) !== undefined) {
						disconnect(id);
					}
				})
			);
		} else {
			index = idx;
		}

		$players[idx] = player as Player;
		offTurnPlayers = $players.filter((p) => p.idx !== $game?.turnIdx);

		if (initialLoad && !isUser) {
			successToast(`${player.name} joined the game.`);
		}
	}

	function onPlayerChange(idx: number, data: DocumentData) {
		console.log('onPlayerChange');
		const oldPlayer = $players[idx];
		const newPlayer = { ...oldPlayer, ...data };
		$players[idx] = newPlayer;
		offTurnPlayers = $players.filter((p) => p.idx !== $game?.turnIdx);
	}

	function onPlayerLeave(id: string, idx: number): void {
		console.log('onPlayerLeave');
		const player = $players[idx];
		const peer = peers.get(id);

		if (!player || !peer) return;

		if (index > idx) index--;

		const { pc, subs } = peer;
		pc.close();
		subs.forEach((unsubscribe) => unsubscribe());
		peers.delete(id);

		const remoteStream = streams.get(id);
		remoteStream?.getTracks().forEach((track) => {
			track.stop();
			remoteStream.removeTrack(track);
		});

		const playerStateSub = playerStateSubs.get(id);
		playerStateSub && playerStateSub();
		playerStateSubs.delete(id);

		$players = $players.filter((p) => p.idx !== idx);
		offTurnPlayers = $players.filter((p) => p.idx !== $game?.turnIdx);
		errorToast(`${player.name} left the game.`);
	}

	onMount(() => {
		streams = streams.set($userId, new MediaStream());
		let initialLoad = false;
		subscriptions.push(
			onGameState((newGame) => {
				if (newGame) {
					if (!$game) {
						$game = { ...newGame };
					} else {
						if (newGame.size !== $game.size) {
							onNewGameSize(newGame.size);
						}
						if (newGame.turnIdx !== $game.turnIdx) {
							onNewTurn(newGame.turnIdx);
						}
						if (newGame.state !== $game.state) {
							onNewGameState(newGame.state);
						}
					}
				}
			}),
			onPlayersChange((id, type, data) => {
				const idx = data.idx;
				if (type === 'added') {
					onPlayerJoin(id, idx, data, initialLoad);
				} else if (type === 'modified') {
					onPlayerChange(idx, data);
				} else if (type === 'removed') {
					onPlayerLeave(id, idx);
				}
				initialLoad = true;
			})
		);
	});

	onDestroy(() => {
		cleanup();
	});
</script>

{#if $game && $players.length}
	<div class="flex flex-col gap-8 items-center">
		{#if $game.state === 'open'}
			<button class="btn btn-xl variant-ghost-primary" on:click={copyShortId}>
				#{$game.shortId}
				<CopyIcon class="ml-5" />
			</button>
		{/if}
		<RadioGroup class="grid grid-cols-3 w-full" active="variant-filled-primary">
			<RadioItem bind:group={mode} name="chat" value="chat">Chat</RadioItem>
			<RadioItem bind:group={mode} name="score" value="score">Score</RadioItem>
			<RadioItem bind:group={mode} name="table" value="table">Table</RadioItem>
		</RadioGroup>
		{#if mode === 'chat'}
			{#if $players[$game.turnIdx]}
				<div class="w-full rounded-lg overflow-hidden">
					<div class="aspect-[4/3] overflow-hidden">
						<VideoPlayer stream={streams.get(onTurnPlayerId)} id={onTurnPlayerId} />
					</div>
					<div class="bg-primary-500 p-7 text-white">
						<div class="grid grid-cols-3 gap-4">
							{#each $players[$game.turnIdx].darts as dart, idx}
								<div
									class="rounded-lg h-9 flex justify-center items-center py-1 {idx ===
									$players[$game.turnIdx].dartIdx
										? 'bg-white border-primary-800 border-2 text-primary-800'
										: 'bg-primary-800 border-primary-800 border-2 text-white'}"
								>
									{#if dart.s === null}
										<DartSVG fill={idx === $players[$game.turnIdx].dartIdx ? '#16805c' : 'white'} />
									{:else}
										<span>{dartStr($players[$game.turnIdx].darts[idx])}</span>
									{/if}
								</div>
							{/each}
						</div>
						<div class="flex flex-row justify-around mt-6">
							<div class="flex flex-col gap-2">
								<h3 class="h3">{$players[$game.turnIdx].name}</h3>
								<div class="flex flex-row gap-2 justify-start items-center">
									<div class="w-10 text-primary-800">Legs</div>
									<Ratings
										bind:value={$players[$game.turnIdx].legs}
										max={$game?.legs}
										fill="fill-white"
									>
										<svelte:fragment slot="full">
											<svg
												class="w-5 md:w-5 lg:w-5 aspect-square"
												xmlns="http://www.w3.org/2000/svg"
												viewBox="0 0 512 512"
												><path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512z" />
											</svg>
										</svelte:fragment>
										<svelte:fragment slot="half">
											<svg
												class="w-5 md:w-5 lg:w-5 aspect-square"
												xmlns="http://www.w3.org/2000/svg"
												viewBox="0 0 512 512"
												><path
													d="M448 256c0-106-86-192-192-192V448c106 0 192-86 192-192zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256z"
												/>
											</svg>
										</svelte:fragment>
										<svelte:fragment slot="empty">
											<svg
												class="w-5 md:w-5 lg:w-5 aspect-square"
												xmlns="http://www.w3.org/2000/svg"
												viewBox="0 0 512 512"
											>
												<path
													d="M464 256A208 208 0 1 0 48 256a208 208 0 1 0 416 0zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256z"
												/>
											</svg>
										</svelte:fragment>
									</Ratings>
								</div>
								<div class="flex flex-row gap-2 justify-start items-center">
									<div class="w-10 text-primary-800">Sets</div>
									<Ratings
										bind:value={$players[$game.turnIdx].sets}
										max={$game?.sets}
										fill="fill-white"
									>
										<svelte:fragment slot="full">
											<svg
												class="w-5 md:w-5 lg:w-5 aspect-square"
												xmlns="http://www.w3.org/2000/svg"
												viewBox="0 0 512 512"
												><path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512z" />
											</svg>
										</svelte:fragment>
										<svelte:fragment slot="half">
											<svg
												class="w-5 md:w-5 lg:w-5 aspect-square"
												xmlns="http://www.w3.org/2000/svg"
												viewBox="0 0 512 512"
												><path
													d="M448 256c0-106-86-192-192-192V448c106 0 192-86 192-192zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256z"
												/>
											</svg>
										</svelte:fragment>
										<svelte:fragment slot="empty">
											<svg
												class="w-5 md:w-5 lg:w-5 aspect-square"
												xmlns="http://www.w3.org/2000/svg"
												viewBox="0 0 512 512"
											>
												<path
													d="M464 256A208 208 0 1 0 48 256a208 208 0 1 0 416 0zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256z"
												/>
											</svg>
										</svelte:fragment>
									</Ratings>
								</div>
							</div>
							<div class="flex flex-col justify-center">
								<div class="text-primary-800">{$game?.outMode} out</div>
								<div class="text-6xl">{$players[$game.turnIdx].remaining}</div>
							</div>
						</div>
					</div>
				</div>
			{/if}
			{#if offTurnPlayers}
				<div class="grid grid-cols-3 gap-4">
					{#each [...offTurnPlayers] as { name, remaining, id }}
						<div
							class="relative aspect-square rounded-lg overflow-hidden bg-[url('/dummy.png')] bg-cover"
						>
							<VideoPlayer stream={streams.get(id || '')} id={id || ''} />
							<div
								class="bg-surface-100 dark:bg-surface-800 w-full absolute bottom-0 flex flex-row justify-between items-center py-1 px-2"
							>
								<div>{name}</div>
								<div>{remaining}</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		{:else if mode === 'score'}
			<ScoreInput {index} />
		{:else}
			<Scoreboard game={$game} players={$players} />
		{/if}
	</div>
	<div
		class="fixed bottom-5 left-1/2 transform -translate-x-1/2 flex flex-row justify-center gap-5"
	>
		<button
			class="btn-icon btn-icon-xl {!camOn ? 'variant-filled-error' : 'variant-filled-primary'}"
			type="button"
			disabled={camLoading}
			on:click={handleCamBtn}
		>
			{#if camLoading}
				<ProgressRadial />
			{:else if !camOn}
				<CameraOffIcon />
			{:else}
				<CameraIcon />
			{/if}
		</button>
		<button
			class="btn-icon btn-icon-xl {!micOn ? 'variant-filled-error' : 'variant-filled-primary'}"
			type="button"
			disabled={micLoading}
			on:click={handleMicBtn}
		>
			{#if micLoading}
				<ProgressRadial />
			{:else if !micOn}
				<MicOffIcon />
			{:else}
				<MicIcon />
			{/if}
		</button>
		<button
			class="btn-icon btn-icon-xl variant-filled-error"
			type="button"
			disabled={leaveLoading}
			on:click={handleLeaveBtn}
		>
			{#if leaveLoading}
				<ProgressRadial />
			{:else}
				<LogOutIcon />
			{/if}
		</button>
	</div>
{/if}
