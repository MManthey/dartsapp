declare interface Peer {
	pc: RTCPeerConnection;
	subs: (() => void)[];
}

declare interface Player {
	id: string;
	idx: number;
	name: string;
	remaining: number;
	throws: number[];
	avg: number;
	stream: MediaStream;
}

declare interface Game {
	shortId: string;
	gameMode: '301' | '501';
	outMode: 'single' | 'double';
	size: 1 | 2 | 3 | 4;
	isOnline: boolean;
	turn: number;
	state: 'open' | 'closed' | 'over';
}

interface SessionDescription {
	type: RTCSdpType;
	sdp: string | undefined;
}

declare type RTCPing =
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
