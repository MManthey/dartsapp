declare interface Peer {
	pc: RTCPeerConnection;
	subs: (() => void)[];
}

declare interface Player {
	id?: string;
	idx: number;
	name: string;
	remaining: number;
	darts: [Dart, Dart, Dart];
	dartIdx: number;
	scores: number[];
	avg: number;
	sets: number;
	legs: number;
}

type GameSize = 1 | 2 | 3 | 4;
type GameState = 'open' | 'closed' | 'over';

declare interface Game {
	shortId?: string;
	gameMode: string;
	outMode: 'single' | 'double';
	sets: number;
	legs: number;
	size: GameSize;
	turnIdx: number;
	state: GameState;
}

interface SessionDescription {
	type: RTCSdpType;
	sdp: string | undefined;
}

declare type RTCMessage =
	| { answer: SessionDescription }
	| { offer: SessionDescription }
	| { resetMe: boolean };

interface SimpleDart {
	s:
		| null // no input
		| 0 // miss
		| 1
		| 2
		| 3
		| 4
		| 5
		| 6
		| 7
		| 8
		| 9
		| 10
		| 11
		| 12
		| 13
		| 14
		| 15
		| 16
		| 17
		| 18
		| 19
		| 20;
	x: 1 | 2 | 3;
}

interface SpecialDart {
	s: 25 | 50;
	x: 1;
}

declare type Dart = SimpleThrow | SpecialThrow;
