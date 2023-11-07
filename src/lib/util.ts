/**
 *
 * @param dart
 */
export function dartStr(dart: Dart) {
	let score = dart.s.toString();
	let preFix = ['', 'D', 'T'][dart.x - 1];
	if (dart.s === 25 && dart.x === 2) {
		score *= 2;
		preFix = '';
	}
	return preFix + score;
}

/**
 *
 * @param darts
 * @returns
 */
export function dartTotal(darts: Dart[]) {
	return darts.reduce((total, dart) => {
		return total + (dart.s || 0) * dart.x;
	}, 0);
}
