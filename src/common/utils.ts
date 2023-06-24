/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Gitpod. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export function arrayEquals<T>(one: ReadonlyArray<T> | undefined, other: ReadonlyArray<T> | undefined, itemEquals: (a: T, b: T) => boolean = (a, b) => a === b): boolean {
	if (one === other) {
		return true;
	}

	if (!one || !other) {
		return false;
	}

	if (one.length !== other.length) {
		return false;
	}

	for (let i = 0, len = one.length; i < len; i++) {
		if (!itemEquals(one[i], other[i])) {
			return false;
		}
	}

	return true;
}

/**
 * Escapes regular expression characters in a given string
 */
export function escapeRegExpCharacters(value: string): string {
	return value.replace(/[\\\{\}\*\+\?\|\^\$\.\[\]\(\)]/g, '\\$&');
}

export function cloneAndChange(obj: any, changer: (orig: any) => any): any {
	return _cloneAndChange(obj, changer, new Set());
}

function _isObject(obj: unknown): obj is Object {
	// The method can't do a type cast since there are type (like strings) which
	// are subclasses of any put not positvely matched by the function. Hence type
	// narrowing results in wrong results.
	return typeof obj === 'object'
		&& obj !== null
		&& !Array.isArray(obj)
		&& !(obj instanceof RegExp)
		&& !(obj instanceof Date);
}

function _cloneAndChange(obj: any, changer: (orig: any) => any, seen: Set<any>): any {
	if (obj === undefined || obj === null) {
		return obj;
	}

	const changed = changer(obj);
	if (typeof changed !== 'undefined') {
		return changed;
	}

	if (Array.isArray(obj)) {
		const r1: any[] = [];
		for (const e of obj) {
			r1.push(_cloneAndChange(e, changer, seen));
		}
		return r1;
	}

	if (_isObject(obj)) {
		if (seen.has(obj)) {
			throw new Error('Cannot clone recursive data-structure');
		}
		seen.add(obj);
		const r2 = {};
		for (const i2 in obj) {
			if (Object.hasOwnProperty.call(obj, i2)) {
				(r2 as any)[i2] = _cloneAndChange(obj[i2], changer, seen);
			}
		}
		seen.delete(obj);
		return r2;
	}

	return obj;
}

/**
 * Copies all properties of source into destination. The optional parameter "overwrite" allows to control
 * if existing properties on the destination should be overwritten or not. Defaults to true (overwrite).
 */
export function mixin(destination: any, source: any, overwrite: boolean = true): any {
	if (!_isObject(destination)) {
		return source;
	}

	if (_isObject(source)) {
		Object.keys(source).forEach(key => {
			if (key in destination) {
				if (overwrite) {
					if (_isObject(destination[key]) && _isObject(source[key])) {
						mixin(destination[key], source[key], overwrite);
					} else {
						destination[key] = source[key];
					}
				}
			} else {
				destination[key] = source[key];
			}
		});
	}
	return destination;
}

export function getServiceURL(gitpodHost: string): string {
	return new URL(gitpodHost).toString().replace(/\/$/, '');
}

export class WrapError extends Error {
	constructor(
		msg: string,
		readonly cause: any,
		readonly code?: string
	) {
		const isErr = cause instanceof Error;
		super(isErr ? `${msg}: ${cause.message}` : msg);
		if (isErr) {
			this.name = cause.name;
			this.stack = this.stack + '\n\n' + cause.stack;
		}
		this.code ??= cause.code;
	}
}

const ProductionUntrustedSegmentKey = 'untrusted-dummy-key';
export const isBuiltFromGHA = process.env.SEGMENT_KEY === ProductionUntrustedSegmentKey;
