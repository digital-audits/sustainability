const co2Reducer = function(object, iteratee, memo, initial) {
	const _keys = !isArrayLike(object) && keys(object);
	const length = (_keys || object).length;
	let index = dir > 0 ? 0 : length - 1;
	if (!initial) {
		memo = object[_keys ? _keys[index] : index];
		index += dir;
	}

	for (; index >= 0 && index < length; index += dir) {
		const currentKey = _keys ? _keys[index] : index;
		memo = iteratee(memo, object[currentKey], currentKey, object);
	}

	return memo;
};
