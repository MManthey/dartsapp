declare interface Peer {
	pc: RTCPeerConnection;
	subs: (() => void)[];
}

declare interface PlayerData {
	name: string;
	remaining: number;
	scores: number[];
	avg: number;
}

declare interface Player {
	data: PlayerData;
	stream: MediaStream;
}

declare interface Game {
	shortId: string;
	gameMode: '301' | '501';
	outMode: 'single' | 'double';
	size: number;
	isOnline: boolean;
	turn: string;
	state: 'waiting' | 'playing' | 'over';
}

declare interface Call {
	sender: string;
	state: string;
	answer?: {
		type: RTCSdpType;
		sdp: string | undefined;
	};
	offer?: {
		type: RTCSdpType;
		sdp: string | undefined;
	};
}

interface SimpleDart {
	s:
		| null // not input
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
