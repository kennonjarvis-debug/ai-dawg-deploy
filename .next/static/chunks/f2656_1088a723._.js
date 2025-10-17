(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/dawg-ai/node_modules/@swc/helpers/esm/_define_property.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "_",
    ()=>_define_property
]);
function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else obj[key] = value;
    return obj;
}
;
}),
"[project]/dawg-ai/node_modules/base64-js/index.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

exports.byteLength = byteLength;
exports.toByteArray = toByteArray;
exports.fromByteArray = fromByteArray;
var lookup = [];
var revLookup = [];
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array;
var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
for(var i = 0, len = code.length; i < len; ++i){
    lookup[i] = code[i];
    revLookup[code.charCodeAt(i)] = i;
}
// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62;
revLookup['_'.charCodeAt(0)] = 63;
function getLens(b64) {
    var len = b64.length;
    if (len % 4 > 0) {
        throw new Error('Invalid string. Length must be a multiple of 4');
    }
    // Trim off extra bytes after placeholder bytes are found
    // See: https://github.com/beatgammit/base64-js/issues/42
    var validLen = b64.indexOf('=');
    if (validLen === -1) validLen = len;
    var placeHoldersLen = validLen === len ? 0 : 4 - validLen % 4;
    return [
        validLen,
        placeHoldersLen
    ];
}
// base64 is 4/3 + up to two characters of the original data
function byteLength(b64) {
    var lens = getLens(b64);
    var validLen = lens[0];
    var placeHoldersLen = lens[1];
    return (validLen + placeHoldersLen) * 3 / 4 - placeHoldersLen;
}
function _byteLength(b64, validLen, placeHoldersLen) {
    return (validLen + placeHoldersLen) * 3 / 4 - placeHoldersLen;
}
function toByteArray(b64) {
    var tmp;
    var lens = getLens(b64);
    var validLen = lens[0];
    var placeHoldersLen = lens[1];
    var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen));
    var curByte = 0;
    // if there are placeholders, only get up to the last complete 4 chars
    var len = placeHoldersLen > 0 ? validLen - 4 : validLen;
    var i;
    for(i = 0; i < len; i += 4){
        tmp = revLookup[b64.charCodeAt(i)] << 18 | revLookup[b64.charCodeAt(i + 1)] << 12 | revLookup[b64.charCodeAt(i + 2)] << 6 | revLookup[b64.charCodeAt(i + 3)];
        arr[curByte++] = tmp >> 16 & 0xFF;
        arr[curByte++] = tmp >> 8 & 0xFF;
        arr[curByte++] = tmp & 0xFF;
    }
    if (placeHoldersLen === 2) {
        tmp = revLookup[b64.charCodeAt(i)] << 2 | revLookup[b64.charCodeAt(i + 1)] >> 4;
        arr[curByte++] = tmp & 0xFF;
    }
    if (placeHoldersLen === 1) {
        tmp = revLookup[b64.charCodeAt(i)] << 10 | revLookup[b64.charCodeAt(i + 1)] << 4 | revLookup[b64.charCodeAt(i + 2)] >> 2;
        arr[curByte++] = tmp >> 8 & 0xFF;
        arr[curByte++] = tmp & 0xFF;
    }
    return arr;
}
function tripletToBase64(num) {
    return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F];
}
function encodeChunk(uint8, start, end) {
    var tmp;
    var output = [];
    for(var i = start; i < end; i += 3){
        tmp = (uint8[i] << 16 & 0xFF0000) + (uint8[i + 1] << 8 & 0xFF00) + (uint8[i + 2] & 0xFF);
        output.push(tripletToBase64(tmp));
    }
    return output.join('');
}
function fromByteArray(uint8) {
    var tmp;
    var len = uint8.length;
    var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
    ;
    var parts = [];
    var maxChunkLength = 16383 // must be multiple of 3
    ;
    // go through the array every three bytes, we'll deal with trailing stuff later
    for(var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength){
        parts.push(encodeChunk(uint8, i, i + maxChunkLength > len2 ? len2 : i + maxChunkLength));
    }
    // pad the end with zeros, but make sure to not forget the extra bytes
    if (extraBytes === 1) {
        tmp = uint8[len - 1];
        parts.push(lookup[tmp >> 2] + lookup[tmp << 4 & 0x3F] + '==');
    } else if (extraBytes === 2) {
        tmp = (uint8[len - 2] << 8) + uint8[len - 1];
        parts.push(lookup[tmp >> 10] + lookup[tmp >> 4 & 0x3F] + lookup[tmp << 2 & 0x3F] + '=');
    }
    return parts.join('');
}
}),
"[project]/dawg-ai/node_modules/ieee754/index.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {

/*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */ exports.read = function(buffer, offset, isLE, mLen, nBytes) {
    var e, m;
    var eLen = nBytes * 8 - mLen - 1;
    var eMax = (1 << eLen) - 1;
    var eBias = eMax >> 1;
    var nBits = -7;
    var i = isLE ? nBytes - 1 : 0;
    var d = isLE ? -1 : 1;
    var s = buffer[offset + i];
    i += d;
    e = s & (1 << -nBits) - 1;
    s >>= -nBits;
    nBits += eLen;
    for(; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8){}
    m = e & (1 << -nBits) - 1;
    e >>= -nBits;
    nBits += mLen;
    for(; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8){}
    if (e === 0) {
        e = 1 - eBias;
    } else if (e === eMax) {
        return m ? NaN : (s ? -1 : 1) * Infinity;
    } else {
        m = m + Math.pow(2, mLen);
        e = e - eBias;
    }
    return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
};
exports.write = function(buffer, value, offset, isLE, mLen, nBytes) {
    var e, m, c;
    var eLen = nBytes * 8 - mLen - 1;
    var eMax = (1 << eLen) - 1;
    var eBias = eMax >> 1;
    var rt = mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0;
    var i = isLE ? 0 : nBytes - 1;
    var d = isLE ? 1 : -1;
    var s = value < 0 || value === 0 && 1 / value < 0 ? 1 : 0;
    value = Math.abs(value);
    if (isNaN(value) || value === Infinity) {
        m = isNaN(value) ? 1 : 0;
        e = eMax;
    } else {
        e = Math.floor(Math.log(value) / Math.LN2);
        if (value * (c = Math.pow(2, -e)) < 1) {
            e--;
            c *= 2;
        }
        if (e + eBias >= 1) {
            value += rt / c;
        } else {
            value += rt * Math.pow(2, 1 - eBias);
        }
        if (value * c >= 2) {
            e++;
            c /= 2;
        }
        if (e + eBias >= eMax) {
            m = 0;
            e = eMax;
        } else if (e + eBias >= 1) {
            m = (value * c - 1) * Math.pow(2, mLen);
            e = e + eBias;
        } else {
            m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
            e = 0;
        }
    }
    for(; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8){}
    e = e << mLen | m;
    eLen += mLen;
    for(; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8){}
    buffer[offset + i - d] |= s * 128;
};
}),
"[project]/dawg-ai/node_modules/buffer/index.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */ /* eslint-disable no-proto */ const base64 = __turbopack_context__.r("[project]/dawg-ai/node_modules/base64-js/index.js [app-client] (ecmascript)");
const ieee754 = __turbopack_context__.r("[project]/dawg-ai/node_modules/ieee754/index.js [app-client] (ecmascript)");
const customInspectSymbol = typeof Symbol === 'function' && typeof Symbol['for'] === 'function' ? Symbol['for']('nodejs.util.inspect.custom') // eslint-disable-line dot-notation
 : null;
exports.Buffer = Buffer;
exports.SlowBuffer = SlowBuffer;
exports.INSPECT_MAX_BYTES = 50;
const K_MAX_LENGTH = 0x7fffffff;
exports.kMaxLength = K_MAX_LENGTH;
/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */ Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport();
if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' && typeof console.error === 'function') {
    console.error('This browser lacks typed array (Uint8Array) support which is required by ' + '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.');
}
function typedArraySupport() {
    // Can typed array instances can be augmented?
    try {
        const arr = new Uint8Array(1);
        const proto = {
            foo: function() {
                return 42;
            }
        };
        Object.setPrototypeOf(proto, Uint8Array.prototype);
        Object.setPrototypeOf(arr, proto);
        return arr.foo() === 42;
    } catch (e) {
        return false;
    }
}
Object.defineProperty(Buffer.prototype, 'parent', {
    enumerable: true,
    get: function() {
        if (!Buffer.isBuffer(this)) return undefined;
        return this.buffer;
    }
});
Object.defineProperty(Buffer.prototype, 'offset', {
    enumerable: true,
    get: function() {
        if (!Buffer.isBuffer(this)) return undefined;
        return this.byteOffset;
    }
});
function createBuffer(length) {
    if (length > K_MAX_LENGTH) {
        throw new RangeError('The value "' + length + '" is invalid for option "size"');
    }
    // Return an augmented `Uint8Array` instance
    const buf = new Uint8Array(length);
    Object.setPrototypeOf(buf, Buffer.prototype);
    return buf;
}
/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */ function Buffer(arg, encodingOrOffset, length) {
    // Common case.
    if (typeof arg === 'number') {
        if (typeof encodingOrOffset === 'string') {
            throw new TypeError('The "string" argument must be of type string. Received type number');
        }
        return allocUnsafe(arg);
    }
    return from(arg, encodingOrOffset, length);
}
Buffer.poolSize = 8192; // not used by this implementation
function from(value, encodingOrOffset, length) {
    if (typeof value === 'string') {
        return fromString(value, encodingOrOffset);
    }
    if (ArrayBuffer.isView(value)) {
        return fromArrayView(value);
    }
    if (value == null) {
        throw new TypeError('The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' + 'or Array-like Object. Received type ' + typeof value);
    }
    if (isInstance(value, ArrayBuffer) || value && isInstance(value.buffer, ArrayBuffer)) {
        return fromArrayBuffer(value, encodingOrOffset, length);
    }
    if (typeof SharedArrayBuffer !== 'undefined' && (isInstance(value, SharedArrayBuffer) || value && isInstance(value.buffer, SharedArrayBuffer))) {
        return fromArrayBuffer(value, encodingOrOffset, length);
    }
    if (typeof value === 'number') {
        throw new TypeError('The "value" argument must not be of type number. Received type number');
    }
    const valueOf = value.valueOf && value.valueOf();
    if (valueOf != null && valueOf !== value) {
        return Buffer.from(valueOf, encodingOrOffset, length);
    }
    const b = fromObject(value);
    if (b) return b;
    if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null && typeof value[Symbol.toPrimitive] === 'function') {
        return Buffer.from(value[Symbol.toPrimitive]('string'), encodingOrOffset, length);
    }
    throw new TypeError('The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' + 'or Array-like Object. Received type ' + typeof value);
}
/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/ Buffer.from = function(value, encodingOrOffset, length) {
    return from(value, encodingOrOffset, length);
};
// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Object.setPrototypeOf(Buffer.prototype, Uint8Array.prototype);
Object.setPrototypeOf(Buffer, Uint8Array);
function assertSize(size) {
    if (typeof size !== 'number') {
        throw new TypeError('"size" argument must be of type number');
    } else if (size < 0) {
        throw new RangeError('The value "' + size + '" is invalid for option "size"');
    }
}
function alloc(size, fill, encoding) {
    assertSize(size);
    if (size <= 0) {
        return createBuffer(size);
    }
    if (fill !== undefined) {
        // Only pay attention to encoding if it's a string. This
        // prevents accidentally sending in a number that would
        // be interpreted as a start offset.
        return typeof encoding === 'string' ? createBuffer(size).fill(fill, encoding) : createBuffer(size).fill(fill);
    }
    return createBuffer(size);
}
/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/ Buffer.alloc = function(size, fill, encoding) {
    return alloc(size, fill, encoding);
};
function allocUnsafe(size) {
    assertSize(size);
    return createBuffer(size < 0 ? 0 : checked(size) | 0);
}
/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */ Buffer.allocUnsafe = function(size) {
    return allocUnsafe(size);
};
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */ Buffer.allocUnsafeSlow = function(size) {
    return allocUnsafe(size);
};
function fromString(string, encoding) {
    if (typeof encoding !== 'string' || encoding === '') {
        encoding = 'utf8';
    }
    if (!Buffer.isEncoding(encoding)) {
        throw new TypeError('Unknown encoding: ' + encoding);
    }
    const length = byteLength(string, encoding) | 0;
    let buf = createBuffer(length);
    const actual = buf.write(string, encoding);
    if (actual !== length) {
        // Writing a hex string, for example, that contains invalid characters will
        // cause everything after the first invalid character to be ignored. (e.g.
        // 'abxxcd' will be treated as 'ab')
        buf = buf.slice(0, actual);
    }
    return buf;
}
function fromArrayLike(array) {
    const length = array.length < 0 ? 0 : checked(array.length) | 0;
    const buf = createBuffer(length);
    for(let i = 0; i < length; i += 1){
        buf[i] = array[i] & 255;
    }
    return buf;
}
function fromArrayView(arrayView) {
    if (isInstance(arrayView, Uint8Array)) {
        const copy = new Uint8Array(arrayView);
        return fromArrayBuffer(copy.buffer, copy.byteOffset, copy.byteLength);
    }
    return fromArrayLike(arrayView);
}
function fromArrayBuffer(array, byteOffset, length) {
    if (byteOffset < 0 || array.byteLength < byteOffset) {
        throw new RangeError('"offset" is outside of buffer bounds');
    }
    if (array.byteLength < byteOffset + (length || 0)) {
        throw new RangeError('"length" is outside of buffer bounds');
    }
    let buf;
    if (byteOffset === undefined && length === undefined) {
        buf = new Uint8Array(array);
    } else if (length === undefined) {
        buf = new Uint8Array(array, byteOffset);
    } else {
        buf = new Uint8Array(array, byteOffset, length);
    }
    // Return an augmented `Uint8Array` instance
    Object.setPrototypeOf(buf, Buffer.prototype);
    return buf;
}
function fromObject(obj) {
    if (Buffer.isBuffer(obj)) {
        const len = checked(obj.length) | 0;
        const buf = createBuffer(len);
        if (buf.length === 0) {
            return buf;
        }
        obj.copy(buf, 0, 0, len);
        return buf;
    }
    if (obj.length !== undefined) {
        if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
            return createBuffer(0);
        }
        return fromArrayLike(obj);
    }
    if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
        return fromArrayLike(obj.data);
    }
}
function checked(length) {
    // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
    // length is NaN (which is otherwise coerced to zero.)
    if (length >= K_MAX_LENGTH) {
        throw new RangeError('Attempt to allocate Buffer larger than maximum ' + 'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes');
    }
    return length | 0;
}
function SlowBuffer(length) {
    if (+length != length) {
        length = 0;
    }
    return Buffer.alloc(+length);
}
Buffer.isBuffer = function isBuffer(b) {
    return b != null && b._isBuffer === true && b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
    ;
};
Buffer.compare = function compare(a, b) {
    if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength);
    if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength);
    if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
        throw new TypeError('The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array');
    }
    if (a === b) return 0;
    let x = a.length;
    let y = b.length;
    for(let i = 0, len = Math.min(x, y); i < len; ++i){
        if (a[i] !== b[i]) {
            x = a[i];
            y = b[i];
            break;
        }
    }
    if (x < y) return -1;
    if (y < x) return 1;
    return 0;
};
Buffer.isEncoding = function isEncoding(encoding) {
    switch(String(encoding).toLowerCase()){
        case 'hex':
        case 'utf8':
        case 'utf-8':
        case 'ascii':
        case 'latin1':
        case 'binary':
        case 'base64':
        case 'ucs2':
        case 'ucs-2':
        case 'utf16le':
        case 'utf-16le':
            return true;
        default:
            return false;
    }
};
Buffer.concat = function concat(list, length) {
    if (!Array.isArray(list)) {
        throw new TypeError('"list" argument must be an Array of Buffers');
    }
    if (list.length === 0) {
        return Buffer.alloc(0);
    }
    let i;
    if (length === undefined) {
        length = 0;
        for(i = 0; i < list.length; ++i){
            length += list[i].length;
        }
    }
    const buffer = Buffer.allocUnsafe(length);
    let pos = 0;
    for(i = 0; i < list.length; ++i){
        let buf = list[i];
        if (isInstance(buf, Uint8Array)) {
            if (pos + buf.length > buffer.length) {
                if (!Buffer.isBuffer(buf)) buf = Buffer.from(buf);
                buf.copy(buffer, pos);
            } else {
                Uint8Array.prototype.set.call(buffer, buf, pos);
            }
        } else if (!Buffer.isBuffer(buf)) {
            throw new TypeError('"list" argument must be an Array of Buffers');
        } else {
            buf.copy(buffer, pos);
        }
        pos += buf.length;
    }
    return buffer;
};
function byteLength(string, encoding) {
    if (Buffer.isBuffer(string)) {
        return string.length;
    }
    if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
        return string.byteLength;
    }
    if (typeof string !== 'string') {
        throw new TypeError('The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' + 'Received type ' + typeof string);
    }
    const len = string.length;
    const mustMatch = arguments.length > 2 && arguments[2] === true;
    if (!mustMatch && len === 0) return 0;
    // Use a for loop to avoid recursion
    let loweredCase = false;
    for(;;){
        switch(encoding){
            case 'ascii':
            case 'latin1':
            case 'binary':
                return len;
            case 'utf8':
            case 'utf-8':
                return utf8ToBytes(string).length;
            case 'ucs2':
            case 'ucs-2':
            case 'utf16le':
            case 'utf-16le':
                return len * 2;
            case 'hex':
                return len >>> 1;
            case 'base64':
                return base64ToBytes(string).length;
            default:
                if (loweredCase) {
                    return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
                    ;
                }
                encoding = ('' + encoding).toLowerCase();
                loweredCase = true;
        }
    }
}
Buffer.byteLength = byteLength;
function slowToString(encoding, start, end) {
    let loweredCase = false;
    // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
    // property of a typed array.
    // This behaves neither like String nor Uint8Array in that we set start/end
    // to their upper/lower bounds if the value passed is out of range.
    // undefined is handled specially as per ECMA-262 6th Edition,
    // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
    if (start === undefined || start < 0) {
        start = 0;
    }
    // Return early if start > this.length. Done here to prevent potential uint32
    // coercion fail below.
    if (start > this.length) {
        return '';
    }
    if (end === undefined || end > this.length) {
        end = this.length;
    }
    if (end <= 0) {
        return '';
    }
    // Force coercion to uint32. This will also coerce falsey/NaN values to 0.
    end >>>= 0;
    start >>>= 0;
    if (end <= start) {
        return '';
    }
    if (!encoding) encoding = 'utf8';
    while(true){
        switch(encoding){
            case 'hex':
                return hexSlice(this, start, end);
            case 'utf8':
            case 'utf-8':
                return utf8Slice(this, start, end);
            case 'ascii':
                return asciiSlice(this, start, end);
            case 'latin1':
            case 'binary':
                return latin1Slice(this, start, end);
            case 'base64':
                return base64Slice(this, start, end);
            case 'ucs2':
            case 'ucs-2':
            case 'utf16le':
            case 'utf-16le':
                return utf16leSlice(this, start, end);
            default:
                if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding);
                encoding = (encoding + '').toLowerCase();
                loweredCase = true;
        }
    }
}
// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true;
function swap(b, n, m) {
    const i = b[n];
    b[n] = b[m];
    b[m] = i;
}
Buffer.prototype.swap16 = function swap16() {
    const len = this.length;
    if (len % 2 !== 0) {
        throw new RangeError('Buffer size must be a multiple of 16-bits');
    }
    for(let i = 0; i < len; i += 2){
        swap(this, i, i + 1);
    }
    return this;
};
Buffer.prototype.swap32 = function swap32() {
    const len = this.length;
    if (len % 4 !== 0) {
        throw new RangeError('Buffer size must be a multiple of 32-bits');
    }
    for(let i = 0; i < len; i += 4){
        swap(this, i, i + 3);
        swap(this, i + 1, i + 2);
    }
    return this;
};
Buffer.prototype.swap64 = function swap64() {
    const len = this.length;
    if (len % 8 !== 0) {
        throw new RangeError('Buffer size must be a multiple of 64-bits');
    }
    for(let i = 0; i < len; i += 8){
        swap(this, i, i + 7);
        swap(this, i + 1, i + 6);
        swap(this, i + 2, i + 5);
        swap(this, i + 3, i + 4);
    }
    return this;
};
Buffer.prototype.toString = function toString() {
    const length = this.length;
    if (length === 0) return '';
    if (arguments.length === 0) return utf8Slice(this, 0, length);
    return slowToString.apply(this, arguments);
};
Buffer.prototype.toLocaleString = Buffer.prototype.toString;
Buffer.prototype.equals = function equals(b) {
    if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer');
    if (this === b) return true;
    return Buffer.compare(this, b) === 0;
};
Buffer.prototype.inspect = function inspect() {
    let str = '';
    const max = exports.INSPECT_MAX_BYTES;
    str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim();
    if (this.length > max) str += ' ... ';
    return '<Buffer ' + str + '>';
};
if (customInspectSymbol) {
    Buffer.prototype[customInspectSymbol] = Buffer.prototype.inspect;
}
Buffer.prototype.compare = function compare(target, start, end, thisStart, thisEnd) {
    if (isInstance(target, Uint8Array)) {
        target = Buffer.from(target, target.offset, target.byteLength);
    }
    if (!Buffer.isBuffer(target)) {
        throw new TypeError('The "target" argument must be one of type Buffer or Uint8Array. ' + 'Received type ' + typeof target);
    }
    if (start === undefined) {
        start = 0;
    }
    if (end === undefined) {
        end = target ? target.length : 0;
    }
    if (thisStart === undefined) {
        thisStart = 0;
    }
    if (thisEnd === undefined) {
        thisEnd = this.length;
    }
    if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
        throw new RangeError('out of range index');
    }
    if (thisStart >= thisEnd && start >= end) {
        return 0;
    }
    if (thisStart >= thisEnd) {
        return -1;
    }
    if (start >= end) {
        return 1;
    }
    start >>>= 0;
    end >>>= 0;
    thisStart >>>= 0;
    thisEnd >>>= 0;
    if (this === target) return 0;
    let x = thisEnd - thisStart;
    let y = end - start;
    const len = Math.min(x, y);
    const thisCopy = this.slice(thisStart, thisEnd);
    const targetCopy = target.slice(start, end);
    for(let i = 0; i < len; ++i){
        if (thisCopy[i] !== targetCopy[i]) {
            x = thisCopy[i];
            y = targetCopy[i];
            break;
        }
    }
    if (x < y) return -1;
    if (y < x) return 1;
    return 0;
};
// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf(buffer, val, byteOffset, encoding, dir) {
    // Empty buffer means no match
    if (buffer.length === 0) return -1;
    // Normalize byteOffset
    if (typeof byteOffset === 'string') {
        encoding = byteOffset;
        byteOffset = 0;
    } else if (byteOffset > 0x7fffffff) {
        byteOffset = 0x7fffffff;
    } else if (byteOffset < -0x80000000) {
        byteOffset = -0x80000000;
    }
    byteOffset = +byteOffset; // Coerce to Number.
    if (numberIsNaN(byteOffset)) {
        // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
        byteOffset = dir ? 0 : buffer.length - 1;
    }
    // Normalize byteOffset: negative offsets start from the end of the buffer
    if (byteOffset < 0) byteOffset = buffer.length + byteOffset;
    if (byteOffset >= buffer.length) {
        if (dir) return -1;
        else byteOffset = buffer.length - 1;
    } else if (byteOffset < 0) {
        if (dir) byteOffset = 0;
        else return -1;
    }
    // Normalize val
    if (typeof val === 'string') {
        val = Buffer.from(val, encoding);
    }
    // Finally, search either indexOf (if dir is true) or lastIndexOf
    if (Buffer.isBuffer(val)) {
        // Special case: looking for empty string/buffer always fails
        if (val.length === 0) {
            return -1;
        }
        return arrayIndexOf(buffer, val, byteOffset, encoding, dir);
    } else if (typeof val === 'number') {
        val = val & 0xFF; // Search for a byte value [0-255]
        if (typeof Uint8Array.prototype.indexOf === 'function') {
            if (dir) {
                return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset);
            } else {
                return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset);
            }
        }
        return arrayIndexOf(buffer, [
            val
        ], byteOffset, encoding, dir);
    }
    throw new TypeError('val must be string, number or Buffer');
}
function arrayIndexOf(arr, val, byteOffset, encoding, dir) {
    let indexSize = 1;
    let arrLength = arr.length;
    let valLength = val.length;
    if (encoding !== undefined) {
        encoding = String(encoding).toLowerCase();
        if (encoding === 'ucs2' || encoding === 'ucs-2' || encoding === 'utf16le' || encoding === 'utf-16le') {
            if (arr.length < 2 || val.length < 2) {
                return -1;
            }
            indexSize = 2;
            arrLength /= 2;
            valLength /= 2;
            byteOffset /= 2;
        }
    }
    function read(buf, i) {
        if (indexSize === 1) {
            return buf[i];
        } else {
            return buf.readUInt16BE(i * indexSize);
        }
    }
    let i;
    if (dir) {
        let foundIndex = -1;
        for(i = byteOffset; i < arrLength; i++){
            if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
                if (foundIndex === -1) foundIndex = i;
                if (i - foundIndex + 1 === valLength) return foundIndex * indexSize;
            } else {
                if (foundIndex !== -1) i -= i - foundIndex;
                foundIndex = -1;
            }
        }
    } else {
        if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength;
        for(i = byteOffset; i >= 0; i--){
            let found = true;
            for(let j = 0; j < valLength; j++){
                if (read(arr, i + j) !== read(val, j)) {
                    found = false;
                    break;
                }
            }
            if (found) return i;
        }
    }
    return -1;
}
Buffer.prototype.includes = function includes(val, byteOffset, encoding) {
    return this.indexOf(val, byteOffset, encoding) !== -1;
};
Buffer.prototype.indexOf = function indexOf(val, byteOffset, encoding) {
    return bidirectionalIndexOf(this, val, byteOffset, encoding, true);
};
Buffer.prototype.lastIndexOf = function lastIndexOf(val, byteOffset, encoding) {
    return bidirectionalIndexOf(this, val, byteOffset, encoding, false);
};
function hexWrite(buf, string, offset, length) {
    offset = Number(offset) || 0;
    const remaining = buf.length - offset;
    if (!length) {
        length = remaining;
    } else {
        length = Number(length);
        if (length > remaining) {
            length = remaining;
        }
    }
    const strLen = string.length;
    if (length > strLen / 2) {
        length = strLen / 2;
    }
    let i;
    for(i = 0; i < length; ++i){
        const parsed = parseInt(string.substr(i * 2, 2), 16);
        if (numberIsNaN(parsed)) return i;
        buf[offset + i] = parsed;
    }
    return i;
}
function utf8Write(buf, string, offset, length) {
    return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length);
}
function asciiWrite(buf, string, offset, length) {
    return blitBuffer(asciiToBytes(string), buf, offset, length);
}
function base64Write(buf, string, offset, length) {
    return blitBuffer(base64ToBytes(string), buf, offset, length);
}
function ucs2Write(buf, string, offset, length) {
    return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length);
}
Buffer.prototype.write = function write(string, offset, length, encoding) {
    // Buffer#write(string)
    if (offset === undefined) {
        encoding = 'utf8';
        length = this.length;
        offset = 0;
    // Buffer#write(string, encoding)
    } else if (length === undefined && typeof offset === 'string') {
        encoding = offset;
        length = this.length;
        offset = 0;
    // Buffer#write(string, offset[, length][, encoding])
    } else if (isFinite(offset)) {
        offset = offset >>> 0;
        if (isFinite(length)) {
            length = length >>> 0;
            if (encoding === undefined) encoding = 'utf8';
        } else {
            encoding = length;
            length = undefined;
        }
    } else {
        throw new Error('Buffer.write(string, encoding, offset[, length]) is no longer supported');
    }
    const remaining = this.length - offset;
    if (length === undefined || length > remaining) length = remaining;
    if (string.length > 0 && (length < 0 || offset < 0) || offset > this.length) {
        throw new RangeError('Attempt to write outside buffer bounds');
    }
    if (!encoding) encoding = 'utf8';
    let loweredCase = false;
    for(;;){
        switch(encoding){
            case 'hex':
                return hexWrite(this, string, offset, length);
            case 'utf8':
            case 'utf-8':
                return utf8Write(this, string, offset, length);
            case 'ascii':
            case 'latin1':
            case 'binary':
                return asciiWrite(this, string, offset, length);
            case 'base64':
                // Warning: maxLength not taken into account in base64Write
                return base64Write(this, string, offset, length);
            case 'ucs2':
            case 'ucs-2':
            case 'utf16le':
            case 'utf-16le':
                return ucs2Write(this, string, offset, length);
            default:
                if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding);
                encoding = ('' + encoding).toLowerCase();
                loweredCase = true;
        }
    }
};
Buffer.prototype.toJSON = function toJSON() {
    return {
        type: 'Buffer',
        data: Array.prototype.slice.call(this._arr || this, 0)
    };
};
function base64Slice(buf, start, end) {
    if (start === 0 && end === buf.length) {
        return base64.fromByteArray(buf);
    } else {
        return base64.fromByteArray(buf.slice(start, end));
    }
}
function utf8Slice(buf, start, end) {
    end = Math.min(buf.length, end);
    const res = [];
    let i = start;
    while(i < end){
        const firstByte = buf[i];
        let codePoint = null;
        let bytesPerSequence = firstByte > 0xEF ? 4 : firstByte > 0xDF ? 3 : firstByte > 0xBF ? 2 : 1;
        if (i + bytesPerSequence <= end) {
            let secondByte, thirdByte, fourthByte, tempCodePoint;
            switch(bytesPerSequence){
                case 1:
                    if (firstByte < 0x80) {
                        codePoint = firstByte;
                    }
                    break;
                case 2:
                    secondByte = buf[i + 1];
                    if ((secondByte & 0xC0) === 0x80) {
                        tempCodePoint = (firstByte & 0x1F) << 0x6 | secondByte & 0x3F;
                        if (tempCodePoint > 0x7F) {
                            codePoint = tempCodePoint;
                        }
                    }
                    break;
                case 3:
                    secondByte = buf[i + 1];
                    thirdByte = buf[i + 2];
                    if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
                        tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | thirdByte & 0x3F;
                        if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
                            codePoint = tempCodePoint;
                        }
                    }
                    break;
                case 4:
                    secondByte = buf[i + 1];
                    thirdByte = buf[i + 2];
                    fourthByte = buf[i + 3];
                    if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
                        tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | fourthByte & 0x3F;
                        if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
                            codePoint = tempCodePoint;
                        }
                    }
            }
        }
        if (codePoint === null) {
            // we did not generate a valid codePoint so insert a
            // replacement char (U+FFFD) and advance only 1 byte
            codePoint = 0xFFFD;
            bytesPerSequence = 1;
        } else if (codePoint > 0xFFFF) {
            // encode to utf16 (surrogate pair dance)
            codePoint -= 0x10000;
            res.push(codePoint >>> 10 & 0x3FF | 0xD800);
            codePoint = 0xDC00 | codePoint & 0x3FF;
        }
        res.push(codePoint);
        i += bytesPerSequence;
    }
    return decodeCodePointsArray(res);
}
// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
const MAX_ARGUMENTS_LENGTH = 0x1000;
function decodeCodePointsArray(codePoints) {
    const len = codePoints.length;
    if (len <= MAX_ARGUMENTS_LENGTH) {
        return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
        ;
    }
    // Decode in chunks to avoid "call stack size exceeded".
    let res = '';
    let i = 0;
    while(i < len){
        res += String.fromCharCode.apply(String, codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH));
    }
    return res;
}
function asciiSlice(buf, start, end) {
    let ret = '';
    end = Math.min(buf.length, end);
    for(let i = start; i < end; ++i){
        ret += String.fromCharCode(buf[i] & 0x7F);
    }
    return ret;
}
function latin1Slice(buf, start, end) {
    let ret = '';
    end = Math.min(buf.length, end);
    for(let i = start; i < end; ++i){
        ret += String.fromCharCode(buf[i]);
    }
    return ret;
}
function hexSlice(buf, start, end) {
    const len = buf.length;
    if (!start || start < 0) start = 0;
    if (!end || end < 0 || end > len) end = len;
    let out = '';
    for(let i = start; i < end; ++i){
        out += hexSliceLookupTable[buf[i]];
    }
    return out;
}
function utf16leSlice(buf, start, end) {
    const bytes = buf.slice(start, end);
    let res = '';
    // If bytes.length is odd, the last 8 bits must be ignored (same as node.js)
    for(let i = 0; i < bytes.length - 1; i += 2){
        res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256);
    }
    return res;
}
Buffer.prototype.slice = function slice(start, end) {
    const len = this.length;
    start = ~~start;
    end = end === undefined ? len : ~~end;
    if (start < 0) {
        start += len;
        if (start < 0) start = 0;
    } else if (start > len) {
        start = len;
    }
    if (end < 0) {
        end += len;
        if (end < 0) end = 0;
    } else if (end > len) {
        end = len;
    }
    if (end < start) end = start;
    const newBuf = this.subarray(start, end);
    // Return an augmented `Uint8Array` instance
    Object.setPrototypeOf(newBuf, Buffer.prototype);
    return newBuf;
};
/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */ function checkOffset(offset, ext, length) {
    if (offset % 1 !== 0 || offset < 0) throw new RangeError('offset is not uint');
    if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length');
}
Buffer.prototype.readUintLE = Buffer.prototype.readUIntLE = function readUIntLE(offset, byteLength, noAssert) {
    offset = offset >>> 0;
    byteLength = byteLength >>> 0;
    if (!noAssert) checkOffset(offset, byteLength, this.length);
    let val = this[offset];
    let mul = 1;
    let i = 0;
    while(++i < byteLength && (mul *= 0x100)){
        val += this[offset + i] * mul;
    }
    return val;
};
Buffer.prototype.readUintBE = Buffer.prototype.readUIntBE = function readUIntBE(offset, byteLength, noAssert) {
    offset = offset >>> 0;
    byteLength = byteLength >>> 0;
    if (!noAssert) {
        checkOffset(offset, byteLength, this.length);
    }
    let val = this[offset + --byteLength];
    let mul = 1;
    while(byteLength > 0 && (mul *= 0x100)){
        val += this[offset + --byteLength] * mul;
    }
    return val;
};
Buffer.prototype.readUint8 = Buffer.prototype.readUInt8 = function readUInt8(offset, noAssert) {
    offset = offset >>> 0;
    if (!noAssert) checkOffset(offset, 1, this.length);
    return this[offset];
};
Buffer.prototype.readUint16LE = Buffer.prototype.readUInt16LE = function readUInt16LE(offset, noAssert) {
    offset = offset >>> 0;
    if (!noAssert) checkOffset(offset, 2, this.length);
    return this[offset] | this[offset + 1] << 8;
};
Buffer.prototype.readUint16BE = Buffer.prototype.readUInt16BE = function readUInt16BE(offset, noAssert) {
    offset = offset >>> 0;
    if (!noAssert) checkOffset(offset, 2, this.length);
    return this[offset] << 8 | this[offset + 1];
};
Buffer.prototype.readUint32LE = Buffer.prototype.readUInt32LE = function readUInt32LE(offset, noAssert) {
    offset = offset >>> 0;
    if (!noAssert) checkOffset(offset, 4, this.length);
    return (this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16) + this[offset + 3] * 0x1000000;
};
Buffer.prototype.readUint32BE = Buffer.prototype.readUInt32BE = function readUInt32BE(offset, noAssert) {
    offset = offset >>> 0;
    if (!noAssert) checkOffset(offset, 4, this.length);
    return this[offset] * 0x1000000 + (this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3]);
};
Buffer.prototype.readBigUInt64LE = defineBigIntMethod(function readBigUInt64LE(offset) {
    offset = offset >>> 0;
    validateNumber(offset, 'offset');
    const first = this[offset];
    const last = this[offset + 7];
    if (first === undefined || last === undefined) {
        boundsError(offset, this.length - 8);
    }
    const lo = first + this[++offset] * 2 ** 8 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 24;
    const hi = this[++offset] + this[++offset] * 2 ** 8 + this[++offset] * 2 ** 16 + last * 2 ** 24;
    return BigInt(lo) + (BigInt(hi) << BigInt(32));
});
Buffer.prototype.readBigUInt64BE = defineBigIntMethod(function readBigUInt64BE(offset) {
    offset = offset >>> 0;
    validateNumber(offset, 'offset');
    const first = this[offset];
    const last = this[offset + 7];
    if (first === undefined || last === undefined) {
        boundsError(offset, this.length - 8);
    }
    const hi = first * 2 ** 24 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 8 + this[++offset];
    const lo = this[++offset] * 2 ** 24 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 8 + last;
    return (BigInt(hi) << BigInt(32)) + BigInt(lo);
});
Buffer.prototype.readIntLE = function readIntLE(offset, byteLength, noAssert) {
    offset = offset >>> 0;
    byteLength = byteLength >>> 0;
    if (!noAssert) checkOffset(offset, byteLength, this.length);
    let val = this[offset];
    let mul = 1;
    let i = 0;
    while(++i < byteLength && (mul *= 0x100)){
        val += this[offset + i] * mul;
    }
    mul *= 0x80;
    if (val >= mul) val -= Math.pow(2, 8 * byteLength);
    return val;
};
Buffer.prototype.readIntBE = function readIntBE(offset, byteLength, noAssert) {
    offset = offset >>> 0;
    byteLength = byteLength >>> 0;
    if (!noAssert) checkOffset(offset, byteLength, this.length);
    let i = byteLength;
    let mul = 1;
    let val = this[offset + --i];
    while(i > 0 && (mul *= 0x100)){
        val += this[offset + --i] * mul;
    }
    mul *= 0x80;
    if (val >= mul) val -= Math.pow(2, 8 * byteLength);
    return val;
};
Buffer.prototype.readInt8 = function readInt8(offset, noAssert) {
    offset = offset >>> 0;
    if (!noAssert) checkOffset(offset, 1, this.length);
    if (!(this[offset] & 0x80)) return this[offset];
    return (0xff - this[offset] + 1) * -1;
};
Buffer.prototype.readInt16LE = function readInt16LE(offset, noAssert) {
    offset = offset >>> 0;
    if (!noAssert) checkOffset(offset, 2, this.length);
    const val = this[offset] | this[offset + 1] << 8;
    return val & 0x8000 ? val | 0xFFFF0000 : val;
};
Buffer.prototype.readInt16BE = function readInt16BE(offset, noAssert) {
    offset = offset >>> 0;
    if (!noAssert) checkOffset(offset, 2, this.length);
    const val = this[offset + 1] | this[offset] << 8;
    return val & 0x8000 ? val | 0xFFFF0000 : val;
};
Buffer.prototype.readInt32LE = function readInt32LE(offset, noAssert) {
    offset = offset >>> 0;
    if (!noAssert) checkOffset(offset, 4, this.length);
    return this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16 | this[offset + 3] << 24;
};
Buffer.prototype.readInt32BE = function readInt32BE(offset, noAssert) {
    offset = offset >>> 0;
    if (!noAssert) checkOffset(offset, 4, this.length);
    return this[offset] << 24 | this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3];
};
Buffer.prototype.readBigInt64LE = defineBigIntMethod(function readBigInt64LE(offset) {
    offset = offset >>> 0;
    validateNumber(offset, 'offset');
    const first = this[offset];
    const last = this[offset + 7];
    if (first === undefined || last === undefined) {
        boundsError(offset, this.length - 8);
    }
    const val = this[offset + 4] + this[offset + 5] * 2 ** 8 + this[offset + 6] * 2 ** 16 + (last << 24) // Overflow
    ;
    return (BigInt(val) << BigInt(32)) + BigInt(first + this[++offset] * 2 ** 8 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 24);
});
Buffer.prototype.readBigInt64BE = defineBigIntMethod(function readBigInt64BE(offset) {
    offset = offset >>> 0;
    validateNumber(offset, 'offset');
    const first = this[offset];
    const last = this[offset + 7];
    if (first === undefined || last === undefined) {
        boundsError(offset, this.length - 8);
    }
    const val = (first << 24) + // Overflow
    this[++offset] * 2 ** 16 + this[++offset] * 2 ** 8 + this[++offset];
    return (BigInt(val) << BigInt(32)) + BigInt(this[++offset] * 2 ** 24 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 8 + last);
});
Buffer.prototype.readFloatLE = function readFloatLE(offset, noAssert) {
    offset = offset >>> 0;
    if (!noAssert) checkOffset(offset, 4, this.length);
    return ieee754.read(this, offset, true, 23, 4);
};
Buffer.prototype.readFloatBE = function readFloatBE(offset, noAssert) {
    offset = offset >>> 0;
    if (!noAssert) checkOffset(offset, 4, this.length);
    return ieee754.read(this, offset, false, 23, 4);
};
Buffer.prototype.readDoubleLE = function readDoubleLE(offset, noAssert) {
    offset = offset >>> 0;
    if (!noAssert) checkOffset(offset, 8, this.length);
    return ieee754.read(this, offset, true, 52, 8);
};
Buffer.prototype.readDoubleBE = function readDoubleBE(offset, noAssert) {
    offset = offset >>> 0;
    if (!noAssert) checkOffset(offset, 8, this.length);
    return ieee754.read(this, offset, false, 52, 8);
};
function checkInt(buf, value, offset, ext, max, min) {
    if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance');
    if (value > max || value < min) throw new RangeError('"value" argument is out of bounds');
    if (offset + ext > buf.length) throw new RangeError('Index out of range');
}
Buffer.prototype.writeUintLE = Buffer.prototype.writeUIntLE = function writeUIntLE(value, offset, byteLength, noAssert) {
    value = +value;
    offset = offset >>> 0;
    byteLength = byteLength >>> 0;
    if (!noAssert) {
        const maxBytes = Math.pow(2, 8 * byteLength) - 1;
        checkInt(this, value, offset, byteLength, maxBytes, 0);
    }
    let mul = 1;
    let i = 0;
    this[offset] = value & 0xFF;
    while(++i < byteLength && (mul *= 0x100)){
        this[offset + i] = value / mul & 0xFF;
    }
    return offset + byteLength;
};
Buffer.prototype.writeUintBE = Buffer.prototype.writeUIntBE = function writeUIntBE(value, offset, byteLength, noAssert) {
    value = +value;
    offset = offset >>> 0;
    byteLength = byteLength >>> 0;
    if (!noAssert) {
        const maxBytes = Math.pow(2, 8 * byteLength) - 1;
        checkInt(this, value, offset, byteLength, maxBytes, 0);
    }
    let i = byteLength - 1;
    let mul = 1;
    this[offset + i] = value & 0xFF;
    while(--i >= 0 && (mul *= 0x100)){
        this[offset + i] = value / mul & 0xFF;
    }
    return offset + byteLength;
};
Buffer.prototype.writeUint8 = Buffer.prototype.writeUInt8 = function writeUInt8(value, offset, noAssert) {
    value = +value;
    offset = offset >>> 0;
    if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0);
    this[offset] = value & 0xff;
    return offset + 1;
};
Buffer.prototype.writeUint16LE = Buffer.prototype.writeUInt16LE = function writeUInt16LE(value, offset, noAssert) {
    value = +value;
    offset = offset >>> 0;
    if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
    this[offset] = value & 0xff;
    this[offset + 1] = value >>> 8;
    return offset + 2;
};
Buffer.prototype.writeUint16BE = Buffer.prototype.writeUInt16BE = function writeUInt16BE(value, offset, noAssert) {
    value = +value;
    offset = offset >>> 0;
    if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
    this[offset] = value >>> 8;
    this[offset + 1] = value & 0xff;
    return offset + 2;
};
Buffer.prototype.writeUint32LE = Buffer.prototype.writeUInt32LE = function writeUInt32LE(value, offset, noAssert) {
    value = +value;
    offset = offset >>> 0;
    if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
    this[offset + 3] = value >>> 24;
    this[offset + 2] = value >>> 16;
    this[offset + 1] = value >>> 8;
    this[offset] = value & 0xff;
    return offset + 4;
};
Buffer.prototype.writeUint32BE = Buffer.prototype.writeUInt32BE = function writeUInt32BE(value, offset, noAssert) {
    value = +value;
    offset = offset >>> 0;
    if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
    this[offset] = value >>> 24;
    this[offset + 1] = value >>> 16;
    this[offset + 2] = value >>> 8;
    this[offset + 3] = value & 0xff;
    return offset + 4;
};
function wrtBigUInt64LE(buf, value, offset, min, max) {
    checkIntBI(value, min, max, buf, offset, 7);
    let lo = Number(value & BigInt(0xffffffff));
    buf[offset++] = lo;
    lo = lo >> 8;
    buf[offset++] = lo;
    lo = lo >> 8;
    buf[offset++] = lo;
    lo = lo >> 8;
    buf[offset++] = lo;
    let hi = Number(value >> BigInt(32) & BigInt(0xffffffff));
    buf[offset++] = hi;
    hi = hi >> 8;
    buf[offset++] = hi;
    hi = hi >> 8;
    buf[offset++] = hi;
    hi = hi >> 8;
    buf[offset++] = hi;
    return offset;
}
function wrtBigUInt64BE(buf, value, offset, min, max) {
    checkIntBI(value, min, max, buf, offset, 7);
    let lo = Number(value & BigInt(0xffffffff));
    buf[offset + 7] = lo;
    lo = lo >> 8;
    buf[offset + 6] = lo;
    lo = lo >> 8;
    buf[offset + 5] = lo;
    lo = lo >> 8;
    buf[offset + 4] = lo;
    let hi = Number(value >> BigInt(32) & BigInt(0xffffffff));
    buf[offset + 3] = hi;
    hi = hi >> 8;
    buf[offset + 2] = hi;
    hi = hi >> 8;
    buf[offset + 1] = hi;
    hi = hi >> 8;
    buf[offset] = hi;
    return offset + 8;
}
Buffer.prototype.writeBigUInt64LE = defineBigIntMethod(function writeBigUInt64LE(value) {
    let offset = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 0;
    return wrtBigUInt64LE(this, value, offset, BigInt(0), BigInt('0xffffffffffffffff'));
});
Buffer.prototype.writeBigUInt64BE = defineBigIntMethod(function writeBigUInt64BE(value) {
    let offset = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 0;
    return wrtBigUInt64BE(this, value, offset, BigInt(0), BigInt('0xffffffffffffffff'));
});
Buffer.prototype.writeIntLE = function writeIntLE(value, offset, byteLength, noAssert) {
    value = +value;
    offset = offset >>> 0;
    if (!noAssert) {
        const limit = Math.pow(2, 8 * byteLength - 1);
        checkInt(this, value, offset, byteLength, limit - 1, -limit);
    }
    let i = 0;
    let mul = 1;
    let sub = 0;
    this[offset] = value & 0xFF;
    while(++i < byteLength && (mul *= 0x100)){
        if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
            sub = 1;
        }
        this[offset + i] = (value / mul >> 0) - sub & 0xFF;
    }
    return offset + byteLength;
};
Buffer.prototype.writeIntBE = function writeIntBE(value, offset, byteLength, noAssert) {
    value = +value;
    offset = offset >>> 0;
    if (!noAssert) {
        const limit = Math.pow(2, 8 * byteLength - 1);
        checkInt(this, value, offset, byteLength, limit - 1, -limit);
    }
    let i = byteLength - 1;
    let mul = 1;
    let sub = 0;
    this[offset + i] = value & 0xFF;
    while(--i >= 0 && (mul *= 0x100)){
        if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
            sub = 1;
        }
        this[offset + i] = (value / mul >> 0) - sub & 0xFF;
    }
    return offset + byteLength;
};
Buffer.prototype.writeInt8 = function writeInt8(value, offset, noAssert) {
    value = +value;
    offset = offset >>> 0;
    if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80);
    if (value < 0) value = 0xff + value + 1;
    this[offset] = value & 0xff;
    return offset + 1;
};
Buffer.prototype.writeInt16LE = function writeInt16LE(value, offset, noAssert) {
    value = +value;
    offset = offset >>> 0;
    if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
    this[offset] = value & 0xff;
    this[offset + 1] = value >>> 8;
    return offset + 2;
};
Buffer.prototype.writeInt16BE = function writeInt16BE(value, offset, noAssert) {
    value = +value;
    offset = offset >>> 0;
    if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
    this[offset] = value >>> 8;
    this[offset + 1] = value & 0xff;
    return offset + 2;
};
Buffer.prototype.writeInt32LE = function writeInt32LE(value, offset, noAssert) {
    value = +value;
    offset = offset >>> 0;
    if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
    this[offset] = value & 0xff;
    this[offset + 1] = value >>> 8;
    this[offset + 2] = value >>> 16;
    this[offset + 3] = value >>> 24;
    return offset + 4;
};
Buffer.prototype.writeInt32BE = function writeInt32BE(value, offset, noAssert) {
    value = +value;
    offset = offset >>> 0;
    if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
    if (value < 0) value = 0xffffffff + value + 1;
    this[offset] = value >>> 24;
    this[offset + 1] = value >>> 16;
    this[offset + 2] = value >>> 8;
    this[offset + 3] = value & 0xff;
    return offset + 4;
};
Buffer.prototype.writeBigInt64LE = defineBigIntMethod(function writeBigInt64LE(value) {
    let offset = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 0;
    return wrtBigUInt64LE(this, value, offset, -BigInt('0x8000000000000000'), BigInt('0x7fffffffffffffff'));
});
Buffer.prototype.writeBigInt64BE = defineBigIntMethod(function writeBigInt64BE(value) {
    let offset = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 0;
    return wrtBigUInt64BE(this, value, offset, -BigInt('0x8000000000000000'), BigInt('0x7fffffffffffffff'));
});
function checkIEEE754(buf, value, offset, ext, max, min) {
    if (offset + ext > buf.length) throw new RangeError('Index out of range');
    if (offset < 0) throw new RangeError('Index out of range');
}
function writeFloat(buf, value, offset, littleEndian, noAssert) {
    value = +value;
    offset = offset >>> 0;
    if (!noAssert) {
        checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38);
    }
    ieee754.write(buf, value, offset, littleEndian, 23, 4);
    return offset + 4;
}
Buffer.prototype.writeFloatLE = function writeFloatLE(value, offset, noAssert) {
    return writeFloat(this, value, offset, true, noAssert);
};
Buffer.prototype.writeFloatBE = function writeFloatBE(value, offset, noAssert) {
    return writeFloat(this, value, offset, false, noAssert);
};
function writeDouble(buf, value, offset, littleEndian, noAssert) {
    value = +value;
    offset = offset >>> 0;
    if (!noAssert) {
        checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308);
    }
    ieee754.write(buf, value, offset, littleEndian, 52, 8);
    return offset + 8;
}
Buffer.prototype.writeDoubleLE = function writeDoubleLE(value, offset, noAssert) {
    return writeDouble(this, value, offset, true, noAssert);
};
Buffer.prototype.writeDoubleBE = function writeDoubleBE(value, offset, noAssert) {
    return writeDouble(this, value, offset, false, noAssert);
};
// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy(target, targetStart, start, end) {
    if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer');
    if (!start) start = 0;
    if (!end && end !== 0) end = this.length;
    if (targetStart >= target.length) targetStart = target.length;
    if (!targetStart) targetStart = 0;
    if (end > 0 && end < start) end = start;
    // Copy 0 bytes; we're done
    if (end === start) return 0;
    if (target.length === 0 || this.length === 0) return 0;
    // Fatal error conditions
    if (targetStart < 0) {
        throw new RangeError('targetStart out of bounds');
    }
    if (start < 0 || start >= this.length) throw new RangeError('Index out of range');
    if (end < 0) throw new RangeError('sourceEnd out of bounds');
    // Are we oob?
    if (end > this.length) end = this.length;
    if (target.length - targetStart < end - start) {
        end = target.length - targetStart + start;
    }
    const len = end - start;
    if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
        // Use built-in when available, missing from IE11
        this.copyWithin(targetStart, start, end);
    } else {
        Uint8Array.prototype.set.call(target, this.subarray(start, end), targetStart);
    }
    return len;
};
// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill(val, start, end, encoding) {
    // Handle string cases:
    if (typeof val === 'string') {
        if (typeof start === 'string') {
            encoding = start;
            start = 0;
            end = this.length;
        } else if (typeof end === 'string') {
            encoding = end;
            end = this.length;
        }
        if (encoding !== undefined && typeof encoding !== 'string') {
            throw new TypeError('encoding must be a string');
        }
        if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
            throw new TypeError('Unknown encoding: ' + encoding);
        }
        if (val.length === 1) {
            const code = val.charCodeAt(0);
            if (encoding === 'utf8' && code < 128 || encoding === 'latin1') {
                // Fast path: If `val` fits into a single byte, use that numeric value.
                val = code;
            }
        }
    } else if (typeof val === 'number') {
        val = val & 255;
    } else if (typeof val === 'boolean') {
        val = Number(val);
    }
    // Invalid ranges are not set to a default, so can range check early.
    if (start < 0 || this.length < start || this.length < end) {
        throw new RangeError('Out of range index');
    }
    if (end <= start) {
        return this;
    }
    start = start >>> 0;
    end = end === undefined ? this.length : end >>> 0;
    if (!val) val = 0;
    let i;
    if (typeof val === 'number') {
        for(i = start; i < end; ++i){
            this[i] = val;
        }
    } else {
        const bytes = Buffer.isBuffer(val) ? val : Buffer.from(val, encoding);
        const len = bytes.length;
        if (len === 0) {
            throw new TypeError('The value "' + val + '" is invalid for argument "value"');
        }
        for(i = 0; i < end - start; ++i){
            this[i + start] = bytes[i % len];
        }
    }
    return this;
};
// CUSTOM ERRORS
// =============
// Simplified versions from Node, changed for Buffer-only usage
const errors = {};
function E(sym, getMessage, Base) {
    errors[sym] = class NodeError extends Base {
        get code() {
            return sym;
        }
        set code(value) {
            Object.defineProperty(this, 'code', {
                configurable: true,
                enumerable: true,
                value,
                writable: true
            });
        }
        toString() {
            return "".concat(this.name, " [").concat(sym, "]: ").concat(this.message);
        }
        constructor(){
            super();
            Object.defineProperty(this, 'message', {
                value: getMessage.apply(this, arguments),
                writable: true,
                configurable: true
            });
            // Add the error code to the name to include it in the stack trace.
            this.name = "".concat(this.name, " [").concat(sym, "]");
            // Access the stack to generate the error message including the error code
            // from the name.
            this.stack; // eslint-disable-line no-unused-expressions
            // Reset the name to the actual name.
            delete this.name;
        }
    };
}
E('ERR_BUFFER_OUT_OF_BOUNDS', function(name) {
    if (name) {
        return "".concat(name, " is outside of buffer bounds");
    }
    return 'Attempt to access memory outside buffer bounds';
}, RangeError);
E('ERR_INVALID_ARG_TYPE', function(name, actual) {
    return 'The "'.concat(name, '" argument must be of type number. Received type ').concat(typeof actual);
}, TypeError);
E('ERR_OUT_OF_RANGE', function(str, range, input) {
    let msg = 'The value of "'.concat(str, '" is out of range.');
    let received = input;
    if (Number.isInteger(input) && Math.abs(input) > 2 ** 32) {
        received = addNumericalSeparator(String(input));
    } else if (typeof input === 'bigint') {
        received = String(input);
        if (input > BigInt(2) ** BigInt(32) || input < -(BigInt(2) ** BigInt(32))) {
            received = addNumericalSeparator(received);
        }
        received += 'n';
    }
    msg += " It must be ".concat(range, ". Received ").concat(received);
    return msg;
}, RangeError);
function addNumericalSeparator(val) {
    let res = '';
    let i = val.length;
    const start = val[0] === '-' ? 1 : 0;
    for(; i >= start + 4; i -= 3){
        res = "_".concat(val.slice(i - 3, i)).concat(res);
    }
    return "".concat(val.slice(0, i)).concat(res);
}
// CHECK FUNCTIONS
// ===============
function checkBounds(buf, offset, byteLength) {
    validateNumber(offset, 'offset');
    if (buf[offset] === undefined || buf[offset + byteLength] === undefined) {
        boundsError(offset, buf.length - (byteLength + 1));
    }
}
function checkIntBI(value, min, max, buf, offset, byteLength) {
    if (value > max || value < min) {
        const n = typeof min === 'bigint' ? 'n' : '';
        let range;
        if (byteLength > 3) {
            if (min === 0 || min === BigInt(0)) {
                range = ">= 0".concat(n, " and < 2").concat(n, " ** ").concat((byteLength + 1) * 8).concat(n);
            } else {
                range = ">= -(2".concat(n, " ** ").concat((byteLength + 1) * 8 - 1).concat(n, ") and < 2 ** ") + "".concat((byteLength + 1) * 8 - 1).concat(n);
            }
        } else {
            range = ">= ".concat(min).concat(n, " and <= ").concat(max).concat(n);
        }
        throw new errors.ERR_OUT_OF_RANGE('value', range, value);
    }
    checkBounds(buf, offset, byteLength);
}
function validateNumber(value, name) {
    if (typeof value !== 'number') {
        throw new errors.ERR_INVALID_ARG_TYPE(name, 'number', value);
    }
}
function boundsError(value, length, type) {
    if (Math.floor(value) !== value) {
        validateNumber(value, type);
        throw new errors.ERR_OUT_OF_RANGE(type || 'offset', 'an integer', value);
    }
    if (length < 0) {
        throw new errors.ERR_BUFFER_OUT_OF_BOUNDS();
    }
    throw new errors.ERR_OUT_OF_RANGE(type || 'offset', ">= ".concat(type ? 1 : 0, " and <= ").concat(length), value);
}
// HELPER FUNCTIONS
// ================
const INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g;
function base64clean(str) {
    // Node takes equal signs as end of the Base64 encoding
    str = str.split('=')[0];
    // Node strips out invalid characters like \n and \t from the string, base64-js does not
    str = str.trim().replace(INVALID_BASE64_RE, '');
    // Node converts strings with length < 2 to ''
    if (str.length < 2) return '';
    // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
    while(str.length % 4 !== 0){
        str = str + '=';
    }
    return str;
}
function utf8ToBytes(string, units) {
    units = units || Infinity;
    let codePoint;
    const length = string.length;
    let leadSurrogate = null;
    const bytes = [];
    for(let i = 0; i < length; ++i){
        codePoint = string.charCodeAt(i);
        // is surrogate component
        if (codePoint > 0xD7FF && codePoint < 0xE000) {
            // last char was a lead
            if (!leadSurrogate) {
                // no lead yet
                if (codePoint > 0xDBFF) {
                    // unexpected trail
                    if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
                    continue;
                } else if (i + 1 === length) {
                    // unpaired lead
                    if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
                    continue;
                }
                // valid lead
                leadSurrogate = codePoint;
                continue;
            }
            // 2 leads in a row
            if (codePoint < 0xDC00) {
                if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
                leadSurrogate = codePoint;
                continue;
            }
            // valid surrogate pair
            codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000;
        } else if (leadSurrogate) {
            // valid bmp char, but last char was a lead
            if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
        }
        leadSurrogate = null;
        // encode utf8
        if (codePoint < 0x80) {
            if ((units -= 1) < 0) break;
            bytes.push(codePoint);
        } else if (codePoint < 0x800) {
            if ((units -= 2) < 0) break;
            bytes.push(codePoint >> 0x6 | 0xC0, codePoint & 0x3F | 0x80);
        } else if (codePoint < 0x10000) {
            if ((units -= 3) < 0) break;
            bytes.push(codePoint >> 0xC | 0xE0, codePoint >> 0x6 & 0x3F | 0x80, codePoint & 0x3F | 0x80);
        } else if (codePoint < 0x110000) {
            if ((units -= 4) < 0) break;
            bytes.push(codePoint >> 0x12 | 0xF0, codePoint >> 0xC & 0x3F | 0x80, codePoint >> 0x6 & 0x3F | 0x80, codePoint & 0x3F | 0x80);
        } else {
            throw new Error('Invalid code point');
        }
    }
    return bytes;
}
function asciiToBytes(str) {
    const byteArray = [];
    for(let i = 0; i < str.length; ++i){
        // Node's code seems to be doing this and not & 0x7F..
        byteArray.push(str.charCodeAt(i) & 0xFF);
    }
    return byteArray;
}
function utf16leToBytes(str, units) {
    let c, hi, lo;
    const byteArray = [];
    for(let i = 0; i < str.length; ++i){
        if ((units -= 2) < 0) break;
        c = str.charCodeAt(i);
        hi = c >> 8;
        lo = c % 256;
        byteArray.push(lo);
        byteArray.push(hi);
    }
    return byteArray;
}
function base64ToBytes(str) {
    return base64.toByteArray(base64clean(str));
}
function blitBuffer(src, dst, offset, length) {
    let i;
    for(i = 0; i < length; ++i){
        if (i + offset >= dst.length || i >= src.length) break;
        dst[i + offset] = src[i];
    }
    return i;
}
// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance(obj, type) {
    return obj instanceof type || obj != null && obj.constructor != null && obj.constructor.name != null && obj.constructor.name === type.name;
}
function numberIsNaN(obj) {
    // For IE11 support
    return obj !== obj // eslint-disable-line no-self-compare
    ;
}
// Create lookup table for `toString('hex')`
// See: https://github.com/feross/buffer/issues/219
const hexSliceLookupTable = function() {
    const alphabet = '0123456789abcdef';
    const table = new Array(256);
    for(let i = 0; i < 16; ++i){
        const i16 = i * 16;
        for(let j = 0; j < 16; ++j){
            table[i16 + j] = alphabet[i] + alphabet[j];
        }
    }
    return table;
}();
// Return not function with Error if BigInt not supported
function defineBigIntMethod(fn) {
    return typeof BigInt === 'undefined' ? BufferBigIntNotDefined : fn;
}
function BufferBigIntNotDefined() {
    throw new Error('BigInt not supported');
}
}),
"[project]/dawg-ai/node_modules/events/events.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.
var R = typeof Reflect === 'object' ? Reflect : null;
var ReflectApply = R && typeof R.apply === 'function' ? R.apply : function ReflectApply(target, receiver, args) {
    return Function.prototype.apply.call(target, receiver, args);
};
var ReflectOwnKeys;
if (R && typeof R.ownKeys === 'function') {
    ReflectOwnKeys = R.ownKeys;
} else if (Object.getOwnPropertySymbols) {
    ReflectOwnKeys = function ReflectOwnKeys(target) {
        return Object.getOwnPropertyNames(target).concat(Object.getOwnPropertySymbols(target));
    };
} else {
    ReflectOwnKeys = function ReflectOwnKeys(target) {
        return Object.getOwnPropertyNames(target);
    };
}
function ProcessEmitWarning(warning) {
    if (console && console.warn) console.warn(warning);
}
var NumberIsNaN = Number.isNaN || function NumberIsNaN(value) {
    return value !== value;
};
function EventEmitter() {
    EventEmitter.init.call(this);
}
module.exports = EventEmitter;
module.exports.once = once;
// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;
EventEmitter.prototype._events = undefined;
EventEmitter.prototype._eventsCount = 0;
EventEmitter.prototype._maxListeners = undefined;
// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
var defaultMaxListeners = 10;
function checkListener(listener) {
    if (typeof listener !== 'function') {
        throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof listener);
    }
}
Object.defineProperty(EventEmitter, 'defaultMaxListeners', {
    enumerable: true,
    get: function() {
        return defaultMaxListeners;
    },
    set: function(arg) {
        if (typeof arg !== 'number' || arg < 0 || NumberIsNaN(arg)) {
            throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + arg + '.');
        }
        defaultMaxListeners = arg;
    }
});
EventEmitter.init = function() {
    if (this._events === undefined || this._events === Object.getPrototypeOf(this)._events) {
        this._events = Object.create(null);
        this._eventsCount = 0;
    }
    this._maxListeners = this._maxListeners || undefined;
};
// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
    if (typeof n !== 'number' || n < 0 || NumberIsNaN(n)) {
        throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + n + '.');
    }
    this._maxListeners = n;
    return this;
};
function _getMaxListeners(that) {
    if (that._maxListeners === undefined) return EventEmitter.defaultMaxListeners;
    return that._maxListeners;
}
EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
    return _getMaxListeners(this);
};
EventEmitter.prototype.emit = function emit(type) {
    var args = [];
    for(var i = 1; i < arguments.length; i++)args.push(arguments[i]);
    var doError = type === 'error';
    var events = this._events;
    if (events !== undefined) doError = doError && events.error === undefined;
    else if (!doError) return false;
    // If there is no 'error' event listener then throw.
    if (doError) {
        var er;
        if (args.length > 0) er = args[0];
        if (er instanceof Error) {
            // Note: The comments on the `throw` lines are intentional, they show
            // up in Node's output if this results in an unhandled exception.
            throw er; // Unhandled 'error' event
        }
        // At least give some kind of context to the user
        var err = new Error('Unhandled error.' + (er ? ' (' + er.message + ')' : ''));
        err.context = er;
        throw err; // Unhandled 'error' event
    }
    var handler = events[type];
    if (handler === undefined) return false;
    if (typeof handler === 'function') {
        ReflectApply(handler, this, args);
    } else {
        var len = handler.length;
        var listeners = arrayClone(handler, len);
        for(var i = 0; i < len; ++i)ReflectApply(listeners[i], this, args);
    }
    return true;
};
function _addListener(target, type, listener, prepend) {
    var m;
    var events;
    var existing;
    checkListener(listener);
    events = target._events;
    if (events === undefined) {
        events = target._events = Object.create(null);
        target._eventsCount = 0;
    } else {
        // To avoid recursion in the case that type === "newListener"! Before
        // adding it to the listeners, first emit "newListener".
        if (events.newListener !== undefined) {
            target.emit('newListener', type, listener.listener ? listener.listener : listener);
            // Re-assign `events` because a newListener handler could have caused the
            // this._events to be assigned to a new object
            events = target._events;
        }
        existing = events[type];
    }
    if (existing === undefined) {
        // Optimize the case of one listener. Don't need the extra array object.
        existing = events[type] = listener;
        ++target._eventsCount;
    } else {
        if (typeof existing === 'function') {
            // Adding the second element, need to change to array.
            existing = events[type] = prepend ? [
                listener,
                existing
            ] : [
                existing,
                listener
            ];
        // If we've already got an array, just append.
        } else if (prepend) {
            existing.unshift(listener);
        } else {
            existing.push(listener);
        }
        // Check for listener leak
        m = _getMaxListeners(target);
        if (m > 0 && existing.length > m && !existing.warned) {
            existing.warned = true;
            // No error code for this since it is a Warning
            // eslint-disable-next-line no-restricted-syntax
            var w = new Error('Possible EventEmitter memory leak detected. ' + existing.length + ' ' + String(type) + ' listeners ' + 'added. Use emitter.setMaxListeners() to ' + 'increase limit');
            w.name = 'MaxListenersExceededWarning';
            w.emitter = target;
            w.type = type;
            w.count = existing.length;
            ProcessEmitWarning(w);
        }
    }
    return target;
}
EventEmitter.prototype.addListener = function addListener(type, listener) {
    return _addListener(this, type, listener, false);
};
EventEmitter.prototype.on = EventEmitter.prototype.addListener;
EventEmitter.prototype.prependListener = function prependListener(type, listener) {
    return _addListener(this, type, listener, true);
};
function onceWrapper() {
    if (!this.fired) {
        this.target.removeListener(this.type, this.wrapFn);
        this.fired = true;
        if (arguments.length === 0) return this.listener.call(this.target);
        return this.listener.apply(this.target, arguments);
    }
}
function _onceWrap(target, type, listener) {
    var state = {
        fired: false,
        wrapFn: undefined,
        target: target,
        type: type,
        listener: listener
    };
    var wrapped = onceWrapper.bind(state);
    wrapped.listener = listener;
    state.wrapFn = wrapped;
    return wrapped;
}
EventEmitter.prototype.once = function once(type, listener) {
    checkListener(listener);
    this.on(type, _onceWrap(this, type, listener));
    return this;
};
EventEmitter.prototype.prependOnceListener = function prependOnceListener(type, listener) {
    checkListener(listener);
    this.prependListener(type, _onceWrap(this, type, listener));
    return this;
};
// Emits a 'removeListener' event if and only if the listener was removed.
EventEmitter.prototype.removeListener = function removeListener(type, listener) {
    var list, events, position, i, originalListener;
    checkListener(listener);
    events = this._events;
    if (events === undefined) return this;
    list = events[type];
    if (list === undefined) return this;
    if (list === listener || list.listener === listener) {
        if (--this._eventsCount === 0) this._events = Object.create(null);
        else {
            delete events[type];
            if (events.removeListener) this.emit('removeListener', type, list.listener || listener);
        }
    } else if (typeof list !== 'function') {
        position = -1;
        for(i = list.length - 1; i >= 0; i--){
            if (list[i] === listener || list[i].listener === listener) {
                originalListener = list[i].listener;
                position = i;
                break;
            }
        }
        if (position < 0) return this;
        if (position === 0) list.shift();
        else {
            spliceOne(list, position);
        }
        if (list.length === 1) events[type] = list[0];
        if (events.removeListener !== undefined) this.emit('removeListener', type, originalListener || listener);
    }
    return this;
};
EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
EventEmitter.prototype.removeAllListeners = function removeAllListeners(type) {
    var listeners, events, i;
    events = this._events;
    if (events === undefined) return this;
    // not listening for removeListener, no need to emit
    if (events.removeListener === undefined) {
        if (arguments.length === 0) {
            this._events = Object.create(null);
            this._eventsCount = 0;
        } else if (events[type] !== undefined) {
            if (--this._eventsCount === 0) this._events = Object.create(null);
            else delete events[type];
        }
        return this;
    }
    // emit removeListener for all listeners on all events
    if (arguments.length === 0) {
        var keys = Object.keys(events);
        var key;
        for(i = 0; i < keys.length; ++i){
            key = keys[i];
            if (key === 'removeListener') continue;
            this.removeAllListeners(key);
        }
        this.removeAllListeners('removeListener');
        this._events = Object.create(null);
        this._eventsCount = 0;
        return this;
    }
    listeners = events[type];
    if (typeof listeners === 'function') {
        this.removeListener(type, listeners);
    } else if (listeners !== undefined) {
        // LIFO order
        for(i = listeners.length - 1; i >= 0; i--){
            this.removeListener(type, listeners[i]);
        }
    }
    return this;
};
function _listeners(target, type, unwrap) {
    var events = target._events;
    if (events === undefined) return [];
    var evlistener = events[type];
    if (evlistener === undefined) return [];
    if (typeof evlistener === 'function') return unwrap ? [
        evlistener.listener || evlistener
    ] : [
        evlistener
    ];
    return unwrap ? unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
}
EventEmitter.prototype.listeners = function listeners(type) {
    return _listeners(this, type, true);
};
EventEmitter.prototype.rawListeners = function rawListeners(type) {
    return _listeners(this, type, false);
};
EventEmitter.listenerCount = function(emitter, type) {
    if (typeof emitter.listenerCount === 'function') {
        return emitter.listenerCount(type);
    } else {
        return listenerCount.call(emitter, type);
    }
};
EventEmitter.prototype.listenerCount = listenerCount;
function listenerCount(type) {
    var events = this._events;
    if (events !== undefined) {
        var evlistener = events[type];
        if (typeof evlistener === 'function') {
            return 1;
        } else if (evlistener !== undefined) {
            return evlistener.length;
        }
    }
    return 0;
}
EventEmitter.prototype.eventNames = function eventNames() {
    return this._eventsCount > 0 ? ReflectOwnKeys(this._events) : [];
};
function arrayClone(arr, n) {
    var copy = new Array(n);
    for(var i = 0; i < n; ++i)copy[i] = arr[i];
    return copy;
}
function spliceOne(list, index) {
    for(; index + 1 < list.length; index++)list[index] = list[index + 1];
    list.pop();
}
function unwrapListeners(arr) {
    var ret = new Array(arr.length);
    for(var i = 0; i < ret.length; ++i){
        ret[i] = arr[i].listener || arr[i];
    }
    return ret;
}
function once(emitter, name) {
    return new Promise(function(resolve, reject) {
        function errorListener(err) {
            emitter.removeListener(name, resolver);
            reject(err);
        }
        function resolver() {
            if (typeof emitter.removeListener === 'function') {
                emitter.removeListener('error', errorListener);
            }
            resolve([].slice.call(arguments));
        }
        ;
        eventTargetAgnosticAddListener(emitter, name, resolver, {
            once: true
        });
        if (name !== 'error') {
            addErrorHandlerIfEventEmitter(emitter, errorListener, {
                once: true
            });
        }
    });
}
function addErrorHandlerIfEventEmitter(emitter, handler, flags) {
    if (typeof emitter.on === 'function') {
        eventTargetAgnosticAddListener(emitter, 'error', handler, flags);
    }
}
function eventTargetAgnosticAddListener(emitter, name, listener, flags) {
    if (typeof emitter.on === 'function') {
        if (flags.once) {
            emitter.once(name, listener);
        } else {
            emitter.on(name, listener);
        }
    } else if (typeof emitter.addEventListener === 'function') {
        // EventTarget does not have `error` event semantics like Node
        // EventEmitters, we do not listen for `error` events here.
        emitter.addEventListener(name, function wrapListener(arg) {
            // IE does not have builtin `{ once: true }` support so we
            // have to do it manually.
            if (flags.once) {
                emitter.removeEventListener(name, wrapListener);
            }
            listener(arg);
        });
    } else {
        throw new TypeError('The "emitter" argument must be of type EventEmitter. Received type ' + typeof emitter);
    }
}
}),
"[project]/dawg-ai/node_modules/safe-buffer/index.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {

/*! safe-buffer. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> */ /* eslint-disable node/no-deprecated-api */ var buffer = __turbopack_context__.r("[project]/dawg-ai/node_modules/buffer/index.js [app-client] (ecmascript)");
var Buffer = buffer.Buffer;
// alternative to using Object.keys for old browsers
function copyProps(src, dst) {
    for(var key in src){
        dst[key] = src[key];
    }
}
if (Buffer.from && Buffer.alloc && Buffer.allocUnsafe && Buffer.allocUnsafeSlow) {
    module.exports = buffer;
} else {
    // Copy properties from require('buffer')
    copyProps(buffer, exports);
    exports.Buffer = SafeBuffer;
}
function SafeBuffer(arg, encodingOrOffset, length) {
    return Buffer(arg, encodingOrOffset, length);
}
SafeBuffer.prototype = Object.create(Buffer.prototype);
// Copy static methods from Buffer
copyProps(Buffer, SafeBuffer);
SafeBuffer.from = function(arg, encodingOrOffset, length) {
    if (typeof arg === 'number') {
        throw new TypeError('Argument must not be a number');
    }
    return Buffer(arg, encodingOrOffset, length);
};
SafeBuffer.alloc = function(size, fill, encoding) {
    if (typeof size !== 'number') {
        throw new TypeError('Argument must be a number');
    }
    var buf = Buffer(size);
    if (fill !== undefined) {
        if (typeof encoding === 'string') {
            buf.fill(fill, encoding);
        } else {
            buf.fill(fill);
        }
    } else {
        buf.fill(0);
    }
    return buf;
};
SafeBuffer.allocUnsafe = function(size) {
    if (typeof size !== 'number') {
        throw new TypeError('Argument must be a number');
    }
    return Buffer(size);
};
SafeBuffer.allocUnsafeSlow = function(size) {
    if (typeof size !== 'number') {
        throw new TypeError('Argument must be a number');
    }
    return buffer.SlowBuffer(size);
};
}),
"[project]/dawg-ai/node_modules/string_decoder/lib/string_decoder.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.
/*<replacement>*/ var Buffer = __turbopack_context__.r("[project]/dawg-ai/node_modules/safe-buffer/index.js [app-client] (ecmascript)").Buffer;
/*</replacement>*/ var isEncoding = Buffer.isEncoding || function(encoding) {
    encoding = '' + encoding;
    switch(encoding && encoding.toLowerCase()){
        case 'hex':
        case 'utf8':
        case 'utf-8':
        case 'ascii':
        case 'binary':
        case 'base64':
        case 'ucs2':
        case 'ucs-2':
        case 'utf16le':
        case 'utf-16le':
        case 'raw':
            return true;
        default:
            return false;
    }
};
function _normalizeEncoding(enc) {
    if (!enc) return 'utf8';
    var retried;
    while(true){
        switch(enc){
            case 'utf8':
            case 'utf-8':
                return 'utf8';
            case 'ucs2':
            case 'ucs-2':
            case 'utf16le':
            case 'utf-16le':
                return 'utf16le';
            case 'latin1':
            case 'binary':
                return 'latin1';
            case 'base64':
            case 'ascii':
            case 'hex':
                return enc;
            default:
                if (retried) return; // undefined
                enc = ('' + enc).toLowerCase();
                retried = true;
        }
    }
}
;
// Do not cache `Buffer.isEncoding` when checking encoding names as some
// modules monkey-patch it to support additional encodings
function normalizeEncoding(enc) {
    var nenc = _normalizeEncoding(enc);
    if (typeof nenc !== 'string' && (Buffer.isEncoding === isEncoding || !isEncoding(enc))) throw new Error('Unknown encoding: ' + enc);
    return nenc || enc;
}
// StringDecoder provides an interface for efficiently splitting a series of
// buffers into a series of JS strings without breaking apart multi-byte
// characters.
exports.StringDecoder = StringDecoder;
function StringDecoder(encoding) {
    this.encoding = normalizeEncoding(encoding);
    var nb;
    switch(this.encoding){
        case 'utf16le':
            this.text = utf16Text;
            this.end = utf16End;
            nb = 4;
            break;
        case 'utf8':
            this.fillLast = utf8FillLast;
            nb = 4;
            break;
        case 'base64':
            this.text = base64Text;
            this.end = base64End;
            nb = 3;
            break;
        default:
            this.write = simpleWrite;
            this.end = simpleEnd;
            return;
    }
    this.lastNeed = 0;
    this.lastTotal = 0;
    this.lastChar = Buffer.allocUnsafe(nb);
}
StringDecoder.prototype.write = function(buf) {
    if (buf.length === 0) return '';
    var r;
    var i;
    if (this.lastNeed) {
        r = this.fillLast(buf);
        if (r === undefined) return '';
        i = this.lastNeed;
        this.lastNeed = 0;
    } else {
        i = 0;
    }
    if (i < buf.length) return r ? r + this.text(buf, i) : this.text(buf, i);
    return r || '';
};
StringDecoder.prototype.end = utf8End;
// Returns only complete characters in a Buffer
StringDecoder.prototype.text = utf8Text;
// Attempts to complete a partial non-UTF-8 character using bytes from a Buffer
StringDecoder.prototype.fillLast = function(buf) {
    if (this.lastNeed <= buf.length) {
        buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, this.lastNeed);
        return this.lastChar.toString(this.encoding, 0, this.lastTotal);
    }
    buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, buf.length);
    this.lastNeed -= buf.length;
};
// Checks the type of a UTF-8 byte, whether it's ASCII, a leading byte, or a
// continuation byte. If an invalid byte is detected, -2 is returned.
function utf8CheckByte(byte) {
    if (byte <= 0x7F) return 0;
    else if (byte >> 5 === 0x06) return 2;
    else if (byte >> 4 === 0x0E) return 3;
    else if (byte >> 3 === 0x1E) return 4;
    return byte >> 6 === 0x02 ? -1 : -2;
}
// Checks at most 3 bytes at the end of a Buffer in order to detect an
// incomplete multi-byte UTF-8 character. The total number of bytes (2, 3, or 4)
// needed to complete the UTF-8 character (if applicable) are returned.
function utf8CheckIncomplete(self, buf, i) {
    var j = buf.length - 1;
    if (j < i) return 0;
    var nb = utf8CheckByte(buf[j]);
    if (nb >= 0) {
        if (nb > 0) self.lastNeed = nb - 1;
        return nb;
    }
    if (--j < i || nb === -2) return 0;
    nb = utf8CheckByte(buf[j]);
    if (nb >= 0) {
        if (nb > 0) self.lastNeed = nb - 2;
        return nb;
    }
    if (--j < i || nb === -2) return 0;
    nb = utf8CheckByte(buf[j]);
    if (nb >= 0) {
        if (nb > 0) {
            if (nb === 2) nb = 0;
            else self.lastNeed = nb - 3;
        }
        return nb;
    }
    return 0;
}
// Validates as many continuation bytes for a multi-byte UTF-8 character as
// needed or are available. If we see a non-continuation byte where we expect
// one, we "replace" the validated continuation bytes we've seen so far with
// a single UTF-8 replacement character ('\ufffd'), to match v8's UTF-8 decoding
// behavior. The continuation byte check is included three times in the case
// where all of the continuation bytes for a character exist in the same buffer.
// It is also done this way as a slight performance increase instead of using a
// loop.
function utf8CheckExtraBytes(self, buf, p) {
    if ((buf[0] & 0xC0) !== 0x80) {
        self.lastNeed = 0;
        return '\ufffd';
    }
    if (self.lastNeed > 1 && buf.length > 1) {
        if ((buf[1] & 0xC0) !== 0x80) {
            self.lastNeed = 1;
            return '\ufffd';
        }
        if (self.lastNeed > 2 && buf.length > 2) {
            if ((buf[2] & 0xC0) !== 0x80) {
                self.lastNeed = 2;
                return '\ufffd';
            }
        }
    }
}
// Attempts to complete a multi-byte UTF-8 character using bytes from a Buffer.
function utf8FillLast(buf) {
    var p = this.lastTotal - this.lastNeed;
    var r = utf8CheckExtraBytes(this, buf, p);
    if (r !== undefined) return r;
    if (this.lastNeed <= buf.length) {
        buf.copy(this.lastChar, p, 0, this.lastNeed);
        return this.lastChar.toString(this.encoding, 0, this.lastTotal);
    }
    buf.copy(this.lastChar, p, 0, buf.length);
    this.lastNeed -= buf.length;
}
// Returns all complete UTF-8 characters in a Buffer. If the Buffer ended on a
// partial character, the character's bytes are buffered until the required
// number of bytes are available.
function utf8Text(buf, i) {
    var total = utf8CheckIncomplete(this, buf, i);
    if (!this.lastNeed) return buf.toString('utf8', i);
    this.lastTotal = total;
    var end = buf.length - (total - this.lastNeed);
    buf.copy(this.lastChar, 0, end);
    return buf.toString('utf8', i, end);
}
// For UTF-8, a replacement character is added when ending on a partial
// character.
function utf8End(buf) {
    var r = buf && buf.length ? this.write(buf) : '';
    if (this.lastNeed) return r + '\ufffd';
    return r;
}
// UTF-16LE typically needs two bytes per character, but even if we have an even
// number of bytes available, we need to check if we end on a leading/high
// surrogate. In that case, we need to wait for the next two bytes in order to
// decode the last character properly.
function utf16Text(buf, i) {
    if ((buf.length - i) % 2 === 0) {
        var r = buf.toString('utf16le', i);
        if (r) {
            var c = r.charCodeAt(r.length - 1);
            if (c >= 0xD800 && c <= 0xDBFF) {
                this.lastNeed = 2;
                this.lastTotal = 4;
                this.lastChar[0] = buf[buf.length - 2];
                this.lastChar[1] = buf[buf.length - 1];
                return r.slice(0, -1);
            }
        }
        return r;
    }
    this.lastNeed = 1;
    this.lastTotal = 2;
    this.lastChar[0] = buf[buf.length - 1];
    return buf.toString('utf16le', i, buf.length - 1);
}
// For UTF-16LE we do not explicitly append special replacement characters if we
// end on a partial character, we simply let v8 handle that.
function utf16End(buf) {
    var r = buf && buf.length ? this.write(buf) : '';
    if (this.lastNeed) {
        var end = this.lastTotal - this.lastNeed;
        return r + this.lastChar.toString('utf16le', 0, end);
    }
    return r;
}
function base64Text(buf, i) {
    var n = (buf.length - i) % 3;
    if (n === 0) return buf.toString('base64', i);
    this.lastNeed = 3 - n;
    this.lastTotal = 3;
    if (n === 1) {
        this.lastChar[0] = buf[buf.length - 1];
    } else {
        this.lastChar[0] = buf[buf.length - 2];
        this.lastChar[1] = buf[buf.length - 1];
    }
    return buf.toString('base64', i, buf.length - n);
}
function base64End(buf) {
    var r = buf && buf.length ? this.write(buf) : '';
    if (this.lastNeed) return r + this.lastChar.toString('base64', 0, 3 - this.lastNeed);
    return r;
}
// Pass bytes on through for single-byte encodings (e.g. ascii, latin1, hex)
function simpleWrite(buf) {
    return buf.toString(this.encoding);
}
function simpleEnd(buf) {
    return buf && buf.length ? this.write(buf) : '';
}
}),
"[project]/dawg-ai/node_modules/tweetnacl/nacl-fast.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {

(function(nacl) {
    'use strict';
    // Ported in 2014 by Dmitry Chestnykh and Devi Mandiri.
    // Public domain.
    //
    // Implementation derived from TweetNaCl version 20140427.
    // See for details: http://tweetnacl.cr.yp.to/
    var gf = function(init) {
        var i, r = new Float64Array(16);
        if (init) for(i = 0; i < init.length; i++)r[i] = init[i];
        return r;
    };
    //  Pluggable, initialized in high-level API below.
    var randombytes = function() {
        throw new Error('no PRNG');
    };
    var _0 = new Uint8Array(16);
    var _9 = new Uint8Array(32);
    _9[0] = 9;
    var gf0 = gf(), gf1 = gf([
        1
    ]), _121665 = gf([
        0xdb41,
        1
    ]), D = gf([
        0x78a3,
        0x1359,
        0x4dca,
        0x75eb,
        0xd8ab,
        0x4141,
        0x0a4d,
        0x0070,
        0xe898,
        0x7779,
        0x4079,
        0x8cc7,
        0xfe73,
        0x2b6f,
        0x6cee,
        0x5203
    ]), D2 = gf([
        0xf159,
        0x26b2,
        0x9b94,
        0xebd6,
        0xb156,
        0x8283,
        0x149a,
        0x00e0,
        0xd130,
        0xeef3,
        0x80f2,
        0x198e,
        0xfce7,
        0x56df,
        0xd9dc,
        0x2406
    ]), X = gf([
        0xd51a,
        0x8f25,
        0x2d60,
        0xc956,
        0xa7b2,
        0x9525,
        0xc760,
        0x692c,
        0xdc5c,
        0xfdd6,
        0xe231,
        0xc0a4,
        0x53fe,
        0xcd6e,
        0x36d3,
        0x2169
    ]), Y = gf([
        0x6658,
        0x6666,
        0x6666,
        0x6666,
        0x6666,
        0x6666,
        0x6666,
        0x6666,
        0x6666,
        0x6666,
        0x6666,
        0x6666,
        0x6666,
        0x6666,
        0x6666,
        0x6666
    ]), I = gf([
        0xa0b0,
        0x4a0e,
        0x1b27,
        0xc4ee,
        0xe478,
        0xad2f,
        0x1806,
        0x2f43,
        0xd7a7,
        0x3dfb,
        0x0099,
        0x2b4d,
        0xdf0b,
        0x4fc1,
        0x2480,
        0x2b83
    ]);
    function ts64(x, i, h, l) {
        x[i] = h >> 24 & 0xff;
        x[i + 1] = h >> 16 & 0xff;
        x[i + 2] = h >> 8 & 0xff;
        x[i + 3] = h & 0xff;
        x[i + 4] = l >> 24 & 0xff;
        x[i + 5] = l >> 16 & 0xff;
        x[i + 6] = l >> 8 & 0xff;
        x[i + 7] = l & 0xff;
    }
    function vn(x, xi, y, yi, n) {
        var i, d = 0;
        for(i = 0; i < n; i++)d |= x[xi + i] ^ y[yi + i];
        return (1 & d - 1 >>> 8) - 1;
    }
    function crypto_verify_16(x, xi, y, yi) {
        return vn(x, xi, y, yi, 16);
    }
    function crypto_verify_32(x, xi, y, yi) {
        return vn(x, xi, y, yi, 32);
    }
    function core_salsa20(o, p, k, c) {
        var j0 = c[0] & 0xff | (c[1] & 0xff) << 8 | (c[2] & 0xff) << 16 | (c[3] & 0xff) << 24, j1 = k[0] & 0xff | (k[1] & 0xff) << 8 | (k[2] & 0xff) << 16 | (k[3] & 0xff) << 24, j2 = k[4] & 0xff | (k[5] & 0xff) << 8 | (k[6] & 0xff) << 16 | (k[7] & 0xff) << 24, j3 = k[8] & 0xff | (k[9] & 0xff) << 8 | (k[10] & 0xff) << 16 | (k[11] & 0xff) << 24, j4 = k[12] & 0xff | (k[13] & 0xff) << 8 | (k[14] & 0xff) << 16 | (k[15] & 0xff) << 24, j5 = c[4] & 0xff | (c[5] & 0xff) << 8 | (c[6] & 0xff) << 16 | (c[7] & 0xff) << 24, j6 = p[0] & 0xff | (p[1] & 0xff) << 8 | (p[2] & 0xff) << 16 | (p[3] & 0xff) << 24, j7 = p[4] & 0xff | (p[5] & 0xff) << 8 | (p[6] & 0xff) << 16 | (p[7] & 0xff) << 24, j8 = p[8] & 0xff | (p[9] & 0xff) << 8 | (p[10] & 0xff) << 16 | (p[11] & 0xff) << 24, j9 = p[12] & 0xff | (p[13] & 0xff) << 8 | (p[14] & 0xff) << 16 | (p[15] & 0xff) << 24, j10 = c[8] & 0xff | (c[9] & 0xff) << 8 | (c[10] & 0xff) << 16 | (c[11] & 0xff) << 24, j11 = k[16] & 0xff | (k[17] & 0xff) << 8 | (k[18] & 0xff) << 16 | (k[19] & 0xff) << 24, j12 = k[20] & 0xff | (k[21] & 0xff) << 8 | (k[22] & 0xff) << 16 | (k[23] & 0xff) << 24, j13 = k[24] & 0xff | (k[25] & 0xff) << 8 | (k[26] & 0xff) << 16 | (k[27] & 0xff) << 24, j14 = k[28] & 0xff | (k[29] & 0xff) << 8 | (k[30] & 0xff) << 16 | (k[31] & 0xff) << 24, j15 = c[12] & 0xff | (c[13] & 0xff) << 8 | (c[14] & 0xff) << 16 | (c[15] & 0xff) << 24;
        var x0 = j0, x1 = j1, x2 = j2, x3 = j3, x4 = j4, x5 = j5, x6 = j6, x7 = j7, x8 = j8, x9 = j9, x10 = j10, x11 = j11, x12 = j12, x13 = j13, x14 = j14, x15 = j15, u;
        for(var i = 0; i < 20; i += 2){
            u = x0 + x12 | 0;
            x4 ^= u << 7 | u >>> 32 - 7;
            u = x4 + x0 | 0;
            x8 ^= u << 9 | u >>> 32 - 9;
            u = x8 + x4 | 0;
            x12 ^= u << 13 | u >>> 32 - 13;
            u = x12 + x8 | 0;
            x0 ^= u << 18 | u >>> 32 - 18;
            u = x5 + x1 | 0;
            x9 ^= u << 7 | u >>> 32 - 7;
            u = x9 + x5 | 0;
            x13 ^= u << 9 | u >>> 32 - 9;
            u = x13 + x9 | 0;
            x1 ^= u << 13 | u >>> 32 - 13;
            u = x1 + x13 | 0;
            x5 ^= u << 18 | u >>> 32 - 18;
            u = x10 + x6 | 0;
            x14 ^= u << 7 | u >>> 32 - 7;
            u = x14 + x10 | 0;
            x2 ^= u << 9 | u >>> 32 - 9;
            u = x2 + x14 | 0;
            x6 ^= u << 13 | u >>> 32 - 13;
            u = x6 + x2 | 0;
            x10 ^= u << 18 | u >>> 32 - 18;
            u = x15 + x11 | 0;
            x3 ^= u << 7 | u >>> 32 - 7;
            u = x3 + x15 | 0;
            x7 ^= u << 9 | u >>> 32 - 9;
            u = x7 + x3 | 0;
            x11 ^= u << 13 | u >>> 32 - 13;
            u = x11 + x7 | 0;
            x15 ^= u << 18 | u >>> 32 - 18;
            u = x0 + x3 | 0;
            x1 ^= u << 7 | u >>> 32 - 7;
            u = x1 + x0 | 0;
            x2 ^= u << 9 | u >>> 32 - 9;
            u = x2 + x1 | 0;
            x3 ^= u << 13 | u >>> 32 - 13;
            u = x3 + x2 | 0;
            x0 ^= u << 18 | u >>> 32 - 18;
            u = x5 + x4 | 0;
            x6 ^= u << 7 | u >>> 32 - 7;
            u = x6 + x5 | 0;
            x7 ^= u << 9 | u >>> 32 - 9;
            u = x7 + x6 | 0;
            x4 ^= u << 13 | u >>> 32 - 13;
            u = x4 + x7 | 0;
            x5 ^= u << 18 | u >>> 32 - 18;
            u = x10 + x9 | 0;
            x11 ^= u << 7 | u >>> 32 - 7;
            u = x11 + x10 | 0;
            x8 ^= u << 9 | u >>> 32 - 9;
            u = x8 + x11 | 0;
            x9 ^= u << 13 | u >>> 32 - 13;
            u = x9 + x8 | 0;
            x10 ^= u << 18 | u >>> 32 - 18;
            u = x15 + x14 | 0;
            x12 ^= u << 7 | u >>> 32 - 7;
            u = x12 + x15 | 0;
            x13 ^= u << 9 | u >>> 32 - 9;
            u = x13 + x12 | 0;
            x14 ^= u << 13 | u >>> 32 - 13;
            u = x14 + x13 | 0;
            x15 ^= u << 18 | u >>> 32 - 18;
        }
        x0 = x0 + j0 | 0;
        x1 = x1 + j1 | 0;
        x2 = x2 + j2 | 0;
        x3 = x3 + j3 | 0;
        x4 = x4 + j4 | 0;
        x5 = x5 + j5 | 0;
        x6 = x6 + j6 | 0;
        x7 = x7 + j7 | 0;
        x8 = x8 + j8 | 0;
        x9 = x9 + j9 | 0;
        x10 = x10 + j10 | 0;
        x11 = x11 + j11 | 0;
        x12 = x12 + j12 | 0;
        x13 = x13 + j13 | 0;
        x14 = x14 + j14 | 0;
        x15 = x15 + j15 | 0;
        o[0] = x0 >>> 0 & 0xff;
        o[1] = x0 >>> 8 & 0xff;
        o[2] = x0 >>> 16 & 0xff;
        o[3] = x0 >>> 24 & 0xff;
        o[4] = x1 >>> 0 & 0xff;
        o[5] = x1 >>> 8 & 0xff;
        o[6] = x1 >>> 16 & 0xff;
        o[7] = x1 >>> 24 & 0xff;
        o[8] = x2 >>> 0 & 0xff;
        o[9] = x2 >>> 8 & 0xff;
        o[10] = x2 >>> 16 & 0xff;
        o[11] = x2 >>> 24 & 0xff;
        o[12] = x3 >>> 0 & 0xff;
        o[13] = x3 >>> 8 & 0xff;
        o[14] = x3 >>> 16 & 0xff;
        o[15] = x3 >>> 24 & 0xff;
        o[16] = x4 >>> 0 & 0xff;
        o[17] = x4 >>> 8 & 0xff;
        o[18] = x4 >>> 16 & 0xff;
        o[19] = x4 >>> 24 & 0xff;
        o[20] = x5 >>> 0 & 0xff;
        o[21] = x5 >>> 8 & 0xff;
        o[22] = x5 >>> 16 & 0xff;
        o[23] = x5 >>> 24 & 0xff;
        o[24] = x6 >>> 0 & 0xff;
        o[25] = x6 >>> 8 & 0xff;
        o[26] = x6 >>> 16 & 0xff;
        o[27] = x6 >>> 24 & 0xff;
        o[28] = x7 >>> 0 & 0xff;
        o[29] = x7 >>> 8 & 0xff;
        o[30] = x7 >>> 16 & 0xff;
        o[31] = x7 >>> 24 & 0xff;
        o[32] = x8 >>> 0 & 0xff;
        o[33] = x8 >>> 8 & 0xff;
        o[34] = x8 >>> 16 & 0xff;
        o[35] = x8 >>> 24 & 0xff;
        o[36] = x9 >>> 0 & 0xff;
        o[37] = x9 >>> 8 & 0xff;
        o[38] = x9 >>> 16 & 0xff;
        o[39] = x9 >>> 24 & 0xff;
        o[40] = x10 >>> 0 & 0xff;
        o[41] = x10 >>> 8 & 0xff;
        o[42] = x10 >>> 16 & 0xff;
        o[43] = x10 >>> 24 & 0xff;
        o[44] = x11 >>> 0 & 0xff;
        o[45] = x11 >>> 8 & 0xff;
        o[46] = x11 >>> 16 & 0xff;
        o[47] = x11 >>> 24 & 0xff;
        o[48] = x12 >>> 0 & 0xff;
        o[49] = x12 >>> 8 & 0xff;
        o[50] = x12 >>> 16 & 0xff;
        o[51] = x12 >>> 24 & 0xff;
        o[52] = x13 >>> 0 & 0xff;
        o[53] = x13 >>> 8 & 0xff;
        o[54] = x13 >>> 16 & 0xff;
        o[55] = x13 >>> 24 & 0xff;
        o[56] = x14 >>> 0 & 0xff;
        o[57] = x14 >>> 8 & 0xff;
        o[58] = x14 >>> 16 & 0xff;
        o[59] = x14 >>> 24 & 0xff;
        o[60] = x15 >>> 0 & 0xff;
        o[61] = x15 >>> 8 & 0xff;
        o[62] = x15 >>> 16 & 0xff;
        o[63] = x15 >>> 24 & 0xff;
    }
    function core_hsalsa20(o, p, k, c) {
        var j0 = c[0] & 0xff | (c[1] & 0xff) << 8 | (c[2] & 0xff) << 16 | (c[3] & 0xff) << 24, j1 = k[0] & 0xff | (k[1] & 0xff) << 8 | (k[2] & 0xff) << 16 | (k[3] & 0xff) << 24, j2 = k[4] & 0xff | (k[5] & 0xff) << 8 | (k[6] & 0xff) << 16 | (k[7] & 0xff) << 24, j3 = k[8] & 0xff | (k[9] & 0xff) << 8 | (k[10] & 0xff) << 16 | (k[11] & 0xff) << 24, j4 = k[12] & 0xff | (k[13] & 0xff) << 8 | (k[14] & 0xff) << 16 | (k[15] & 0xff) << 24, j5 = c[4] & 0xff | (c[5] & 0xff) << 8 | (c[6] & 0xff) << 16 | (c[7] & 0xff) << 24, j6 = p[0] & 0xff | (p[1] & 0xff) << 8 | (p[2] & 0xff) << 16 | (p[3] & 0xff) << 24, j7 = p[4] & 0xff | (p[5] & 0xff) << 8 | (p[6] & 0xff) << 16 | (p[7] & 0xff) << 24, j8 = p[8] & 0xff | (p[9] & 0xff) << 8 | (p[10] & 0xff) << 16 | (p[11] & 0xff) << 24, j9 = p[12] & 0xff | (p[13] & 0xff) << 8 | (p[14] & 0xff) << 16 | (p[15] & 0xff) << 24, j10 = c[8] & 0xff | (c[9] & 0xff) << 8 | (c[10] & 0xff) << 16 | (c[11] & 0xff) << 24, j11 = k[16] & 0xff | (k[17] & 0xff) << 8 | (k[18] & 0xff) << 16 | (k[19] & 0xff) << 24, j12 = k[20] & 0xff | (k[21] & 0xff) << 8 | (k[22] & 0xff) << 16 | (k[23] & 0xff) << 24, j13 = k[24] & 0xff | (k[25] & 0xff) << 8 | (k[26] & 0xff) << 16 | (k[27] & 0xff) << 24, j14 = k[28] & 0xff | (k[29] & 0xff) << 8 | (k[30] & 0xff) << 16 | (k[31] & 0xff) << 24, j15 = c[12] & 0xff | (c[13] & 0xff) << 8 | (c[14] & 0xff) << 16 | (c[15] & 0xff) << 24;
        var x0 = j0, x1 = j1, x2 = j2, x3 = j3, x4 = j4, x5 = j5, x6 = j6, x7 = j7, x8 = j8, x9 = j9, x10 = j10, x11 = j11, x12 = j12, x13 = j13, x14 = j14, x15 = j15, u;
        for(var i = 0; i < 20; i += 2){
            u = x0 + x12 | 0;
            x4 ^= u << 7 | u >>> 32 - 7;
            u = x4 + x0 | 0;
            x8 ^= u << 9 | u >>> 32 - 9;
            u = x8 + x4 | 0;
            x12 ^= u << 13 | u >>> 32 - 13;
            u = x12 + x8 | 0;
            x0 ^= u << 18 | u >>> 32 - 18;
            u = x5 + x1 | 0;
            x9 ^= u << 7 | u >>> 32 - 7;
            u = x9 + x5 | 0;
            x13 ^= u << 9 | u >>> 32 - 9;
            u = x13 + x9 | 0;
            x1 ^= u << 13 | u >>> 32 - 13;
            u = x1 + x13 | 0;
            x5 ^= u << 18 | u >>> 32 - 18;
            u = x10 + x6 | 0;
            x14 ^= u << 7 | u >>> 32 - 7;
            u = x14 + x10 | 0;
            x2 ^= u << 9 | u >>> 32 - 9;
            u = x2 + x14 | 0;
            x6 ^= u << 13 | u >>> 32 - 13;
            u = x6 + x2 | 0;
            x10 ^= u << 18 | u >>> 32 - 18;
            u = x15 + x11 | 0;
            x3 ^= u << 7 | u >>> 32 - 7;
            u = x3 + x15 | 0;
            x7 ^= u << 9 | u >>> 32 - 9;
            u = x7 + x3 | 0;
            x11 ^= u << 13 | u >>> 32 - 13;
            u = x11 + x7 | 0;
            x15 ^= u << 18 | u >>> 32 - 18;
            u = x0 + x3 | 0;
            x1 ^= u << 7 | u >>> 32 - 7;
            u = x1 + x0 | 0;
            x2 ^= u << 9 | u >>> 32 - 9;
            u = x2 + x1 | 0;
            x3 ^= u << 13 | u >>> 32 - 13;
            u = x3 + x2 | 0;
            x0 ^= u << 18 | u >>> 32 - 18;
            u = x5 + x4 | 0;
            x6 ^= u << 7 | u >>> 32 - 7;
            u = x6 + x5 | 0;
            x7 ^= u << 9 | u >>> 32 - 9;
            u = x7 + x6 | 0;
            x4 ^= u << 13 | u >>> 32 - 13;
            u = x4 + x7 | 0;
            x5 ^= u << 18 | u >>> 32 - 18;
            u = x10 + x9 | 0;
            x11 ^= u << 7 | u >>> 32 - 7;
            u = x11 + x10 | 0;
            x8 ^= u << 9 | u >>> 32 - 9;
            u = x8 + x11 | 0;
            x9 ^= u << 13 | u >>> 32 - 13;
            u = x9 + x8 | 0;
            x10 ^= u << 18 | u >>> 32 - 18;
            u = x15 + x14 | 0;
            x12 ^= u << 7 | u >>> 32 - 7;
            u = x12 + x15 | 0;
            x13 ^= u << 9 | u >>> 32 - 9;
            u = x13 + x12 | 0;
            x14 ^= u << 13 | u >>> 32 - 13;
            u = x14 + x13 | 0;
            x15 ^= u << 18 | u >>> 32 - 18;
        }
        o[0] = x0 >>> 0 & 0xff;
        o[1] = x0 >>> 8 & 0xff;
        o[2] = x0 >>> 16 & 0xff;
        o[3] = x0 >>> 24 & 0xff;
        o[4] = x5 >>> 0 & 0xff;
        o[5] = x5 >>> 8 & 0xff;
        o[6] = x5 >>> 16 & 0xff;
        o[7] = x5 >>> 24 & 0xff;
        o[8] = x10 >>> 0 & 0xff;
        o[9] = x10 >>> 8 & 0xff;
        o[10] = x10 >>> 16 & 0xff;
        o[11] = x10 >>> 24 & 0xff;
        o[12] = x15 >>> 0 & 0xff;
        o[13] = x15 >>> 8 & 0xff;
        o[14] = x15 >>> 16 & 0xff;
        o[15] = x15 >>> 24 & 0xff;
        o[16] = x6 >>> 0 & 0xff;
        o[17] = x6 >>> 8 & 0xff;
        o[18] = x6 >>> 16 & 0xff;
        o[19] = x6 >>> 24 & 0xff;
        o[20] = x7 >>> 0 & 0xff;
        o[21] = x7 >>> 8 & 0xff;
        o[22] = x7 >>> 16 & 0xff;
        o[23] = x7 >>> 24 & 0xff;
        o[24] = x8 >>> 0 & 0xff;
        o[25] = x8 >>> 8 & 0xff;
        o[26] = x8 >>> 16 & 0xff;
        o[27] = x8 >>> 24 & 0xff;
        o[28] = x9 >>> 0 & 0xff;
        o[29] = x9 >>> 8 & 0xff;
        o[30] = x9 >>> 16 & 0xff;
        o[31] = x9 >>> 24 & 0xff;
    }
    function crypto_core_salsa20(out, inp, k, c) {
        core_salsa20(out, inp, k, c);
    }
    function crypto_core_hsalsa20(out, inp, k, c) {
        core_hsalsa20(out, inp, k, c);
    }
    var sigma = new Uint8Array([
        101,
        120,
        112,
        97,
        110,
        100,
        32,
        51,
        50,
        45,
        98,
        121,
        116,
        101,
        32,
        107
    ]);
    // "expand 32-byte k"
    function crypto_stream_salsa20_xor(c, cpos, m, mpos, b, n, k) {
        var z = new Uint8Array(16), x = new Uint8Array(64);
        var u, i;
        for(i = 0; i < 16; i++)z[i] = 0;
        for(i = 0; i < 8; i++)z[i] = n[i];
        while(b >= 64){
            crypto_core_salsa20(x, z, k, sigma);
            for(i = 0; i < 64; i++)c[cpos + i] = m[mpos + i] ^ x[i];
            u = 1;
            for(i = 8; i < 16; i++){
                u = u + (z[i] & 0xff) | 0;
                z[i] = u & 0xff;
                u >>>= 8;
            }
            b -= 64;
            cpos += 64;
            mpos += 64;
        }
        if (b > 0) {
            crypto_core_salsa20(x, z, k, sigma);
            for(i = 0; i < b; i++)c[cpos + i] = m[mpos + i] ^ x[i];
        }
        return 0;
    }
    function crypto_stream_salsa20(c, cpos, b, n, k) {
        var z = new Uint8Array(16), x = new Uint8Array(64);
        var u, i;
        for(i = 0; i < 16; i++)z[i] = 0;
        for(i = 0; i < 8; i++)z[i] = n[i];
        while(b >= 64){
            crypto_core_salsa20(x, z, k, sigma);
            for(i = 0; i < 64; i++)c[cpos + i] = x[i];
            u = 1;
            for(i = 8; i < 16; i++){
                u = u + (z[i] & 0xff) | 0;
                z[i] = u & 0xff;
                u >>>= 8;
            }
            b -= 64;
            cpos += 64;
        }
        if (b > 0) {
            crypto_core_salsa20(x, z, k, sigma);
            for(i = 0; i < b; i++)c[cpos + i] = x[i];
        }
        return 0;
    }
    function crypto_stream(c, cpos, d, n, k) {
        var s = new Uint8Array(32);
        crypto_core_hsalsa20(s, n, k, sigma);
        var sn = new Uint8Array(8);
        for(var i = 0; i < 8; i++)sn[i] = n[i + 16];
        return crypto_stream_salsa20(c, cpos, d, sn, s);
    }
    function crypto_stream_xor(c, cpos, m, mpos, d, n, k) {
        var s = new Uint8Array(32);
        crypto_core_hsalsa20(s, n, k, sigma);
        var sn = new Uint8Array(8);
        for(var i = 0; i < 8; i++)sn[i] = n[i + 16];
        return crypto_stream_salsa20_xor(c, cpos, m, mpos, d, sn, s);
    }
    /*
* Port of Andrew Moon's Poly1305-donna-16. Public domain.
* https://github.com/floodyberry/poly1305-donna
*/ var poly1305 = function(key) {
        this.buffer = new Uint8Array(16);
        this.r = new Uint16Array(10);
        this.h = new Uint16Array(10);
        this.pad = new Uint16Array(8);
        this.leftover = 0;
        this.fin = 0;
        var t0, t1, t2, t3, t4, t5, t6, t7;
        t0 = key[0] & 0xff | (key[1] & 0xff) << 8;
        this.r[0] = t0 & 0x1fff;
        t1 = key[2] & 0xff | (key[3] & 0xff) << 8;
        this.r[1] = (t0 >>> 13 | t1 << 3) & 0x1fff;
        t2 = key[4] & 0xff | (key[5] & 0xff) << 8;
        this.r[2] = (t1 >>> 10 | t2 << 6) & 0x1f03;
        t3 = key[6] & 0xff | (key[7] & 0xff) << 8;
        this.r[3] = (t2 >>> 7 | t3 << 9) & 0x1fff;
        t4 = key[8] & 0xff | (key[9] & 0xff) << 8;
        this.r[4] = (t3 >>> 4 | t4 << 12) & 0x00ff;
        this.r[5] = t4 >>> 1 & 0x1ffe;
        t5 = key[10] & 0xff | (key[11] & 0xff) << 8;
        this.r[6] = (t4 >>> 14 | t5 << 2) & 0x1fff;
        t6 = key[12] & 0xff | (key[13] & 0xff) << 8;
        this.r[7] = (t5 >>> 11 | t6 << 5) & 0x1f81;
        t7 = key[14] & 0xff | (key[15] & 0xff) << 8;
        this.r[8] = (t6 >>> 8 | t7 << 8) & 0x1fff;
        this.r[9] = t7 >>> 5 & 0x007f;
        this.pad[0] = key[16] & 0xff | (key[17] & 0xff) << 8;
        this.pad[1] = key[18] & 0xff | (key[19] & 0xff) << 8;
        this.pad[2] = key[20] & 0xff | (key[21] & 0xff) << 8;
        this.pad[3] = key[22] & 0xff | (key[23] & 0xff) << 8;
        this.pad[4] = key[24] & 0xff | (key[25] & 0xff) << 8;
        this.pad[5] = key[26] & 0xff | (key[27] & 0xff) << 8;
        this.pad[6] = key[28] & 0xff | (key[29] & 0xff) << 8;
        this.pad[7] = key[30] & 0xff | (key[31] & 0xff) << 8;
    };
    poly1305.prototype.blocks = function(m, mpos, bytes) {
        var hibit = this.fin ? 0 : 1 << 11;
        var t0, t1, t2, t3, t4, t5, t6, t7, c;
        var d0, d1, d2, d3, d4, d5, d6, d7, d8, d9;
        var h0 = this.h[0], h1 = this.h[1], h2 = this.h[2], h3 = this.h[3], h4 = this.h[4], h5 = this.h[5], h6 = this.h[6], h7 = this.h[7], h8 = this.h[8], h9 = this.h[9];
        var r0 = this.r[0], r1 = this.r[1], r2 = this.r[2], r3 = this.r[3], r4 = this.r[4], r5 = this.r[5], r6 = this.r[6], r7 = this.r[7], r8 = this.r[8], r9 = this.r[9];
        while(bytes >= 16){
            t0 = m[mpos + 0] & 0xff | (m[mpos + 1] & 0xff) << 8;
            h0 += t0 & 0x1fff;
            t1 = m[mpos + 2] & 0xff | (m[mpos + 3] & 0xff) << 8;
            h1 += (t0 >>> 13 | t1 << 3) & 0x1fff;
            t2 = m[mpos + 4] & 0xff | (m[mpos + 5] & 0xff) << 8;
            h2 += (t1 >>> 10 | t2 << 6) & 0x1fff;
            t3 = m[mpos + 6] & 0xff | (m[mpos + 7] & 0xff) << 8;
            h3 += (t2 >>> 7 | t3 << 9) & 0x1fff;
            t4 = m[mpos + 8] & 0xff | (m[mpos + 9] & 0xff) << 8;
            h4 += (t3 >>> 4 | t4 << 12) & 0x1fff;
            h5 += t4 >>> 1 & 0x1fff;
            t5 = m[mpos + 10] & 0xff | (m[mpos + 11] & 0xff) << 8;
            h6 += (t4 >>> 14 | t5 << 2) & 0x1fff;
            t6 = m[mpos + 12] & 0xff | (m[mpos + 13] & 0xff) << 8;
            h7 += (t5 >>> 11 | t6 << 5) & 0x1fff;
            t7 = m[mpos + 14] & 0xff | (m[mpos + 15] & 0xff) << 8;
            h8 += (t6 >>> 8 | t7 << 8) & 0x1fff;
            h9 += t7 >>> 5 | hibit;
            c = 0;
            d0 = c;
            d0 += h0 * r0;
            d0 += h1 * (5 * r9);
            d0 += h2 * (5 * r8);
            d0 += h3 * (5 * r7);
            d0 += h4 * (5 * r6);
            c = d0 >>> 13;
            d0 &= 0x1fff;
            d0 += h5 * (5 * r5);
            d0 += h6 * (5 * r4);
            d0 += h7 * (5 * r3);
            d0 += h8 * (5 * r2);
            d0 += h9 * (5 * r1);
            c += d0 >>> 13;
            d0 &= 0x1fff;
            d1 = c;
            d1 += h0 * r1;
            d1 += h1 * r0;
            d1 += h2 * (5 * r9);
            d1 += h3 * (5 * r8);
            d1 += h4 * (5 * r7);
            c = d1 >>> 13;
            d1 &= 0x1fff;
            d1 += h5 * (5 * r6);
            d1 += h6 * (5 * r5);
            d1 += h7 * (5 * r4);
            d1 += h8 * (5 * r3);
            d1 += h9 * (5 * r2);
            c += d1 >>> 13;
            d1 &= 0x1fff;
            d2 = c;
            d2 += h0 * r2;
            d2 += h1 * r1;
            d2 += h2 * r0;
            d2 += h3 * (5 * r9);
            d2 += h4 * (5 * r8);
            c = d2 >>> 13;
            d2 &= 0x1fff;
            d2 += h5 * (5 * r7);
            d2 += h6 * (5 * r6);
            d2 += h7 * (5 * r5);
            d2 += h8 * (5 * r4);
            d2 += h9 * (5 * r3);
            c += d2 >>> 13;
            d2 &= 0x1fff;
            d3 = c;
            d3 += h0 * r3;
            d3 += h1 * r2;
            d3 += h2 * r1;
            d3 += h3 * r0;
            d3 += h4 * (5 * r9);
            c = d3 >>> 13;
            d3 &= 0x1fff;
            d3 += h5 * (5 * r8);
            d3 += h6 * (5 * r7);
            d3 += h7 * (5 * r6);
            d3 += h8 * (5 * r5);
            d3 += h9 * (5 * r4);
            c += d3 >>> 13;
            d3 &= 0x1fff;
            d4 = c;
            d4 += h0 * r4;
            d4 += h1 * r3;
            d4 += h2 * r2;
            d4 += h3 * r1;
            d4 += h4 * r0;
            c = d4 >>> 13;
            d4 &= 0x1fff;
            d4 += h5 * (5 * r9);
            d4 += h6 * (5 * r8);
            d4 += h7 * (5 * r7);
            d4 += h8 * (5 * r6);
            d4 += h9 * (5 * r5);
            c += d4 >>> 13;
            d4 &= 0x1fff;
            d5 = c;
            d5 += h0 * r5;
            d5 += h1 * r4;
            d5 += h2 * r3;
            d5 += h3 * r2;
            d5 += h4 * r1;
            c = d5 >>> 13;
            d5 &= 0x1fff;
            d5 += h5 * r0;
            d5 += h6 * (5 * r9);
            d5 += h7 * (5 * r8);
            d5 += h8 * (5 * r7);
            d5 += h9 * (5 * r6);
            c += d5 >>> 13;
            d5 &= 0x1fff;
            d6 = c;
            d6 += h0 * r6;
            d6 += h1 * r5;
            d6 += h2 * r4;
            d6 += h3 * r3;
            d6 += h4 * r2;
            c = d6 >>> 13;
            d6 &= 0x1fff;
            d6 += h5 * r1;
            d6 += h6 * r0;
            d6 += h7 * (5 * r9);
            d6 += h8 * (5 * r8);
            d6 += h9 * (5 * r7);
            c += d6 >>> 13;
            d6 &= 0x1fff;
            d7 = c;
            d7 += h0 * r7;
            d7 += h1 * r6;
            d7 += h2 * r5;
            d7 += h3 * r4;
            d7 += h4 * r3;
            c = d7 >>> 13;
            d7 &= 0x1fff;
            d7 += h5 * r2;
            d7 += h6 * r1;
            d7 += h7 * r0;
            d7 += h8 * (5 * r9);
            d7 += h9 * (5 * r8);
            c += d7 >>> 13;
            d7 &= 0x1fff;
            d8 = c;
            d8 += h0 * r8;
            d8 += h1 * r7;
            d8 += h2 * r6;
            d8 += h3 * r5;
            d8 += h4 * r4;
            c = d8 >>> 13;
            d8 &= 0x1fff;
            d8 += h5 * r3;
            d8 += h6 * r2;
            d8 += h7 * r1;
            d8 += h8 * r0;
            d8 += h9 * (5 * r9);
            c += d8 >>> 13;
            d8 &= 0x1fff;
            d9 = c;
            d9 += h0 * r9;
            d9 += h1 * r8;
            d9 += h2 * r7;
            d9 += h3 * r6;
            d9 += h4 * r5;
            c = d9 >>> 13;
            d9 &= 0x1fff;
            d9 += h5 * r4;
            d9 += h6 * r3;
            d9 += h7 * r2;
            d9 += h8 * r1;
            d9 += h9 * r0;
            c += d9 >>> 13;
            d9 &= 0x1fff;
            c = (c << 2) + c | 0;
            c = c + d0 | 0;
            d0 = c & 0x1fff;
            c = c >>> 13;
            d1 += c;
            h0 = d0;
            h1 = d1;
            h2 = d2;
            h3 = d3;
            h4 = d4;
            h5 = d5;
            h6 = d6;
            h7 = d7;
            h8 = d8;
            h9 = d9;
            mpos += 16;
            bytes -= 16;
        }
        this.h[0] = h0;
        this.h[1] = h1;
        this.h[2] = h2;
        this.h[3] = h3;
        this.h[4] = h4;
        this.h[5] = h5;
        this.h[6] = h6;
        this.h[7] = h7;
        this.h[8] = h8;
        this.h[9] = h9;
    };
    poly1305.prototype.finish = function(mac, macpos) {
        var g = new Uint16Array(10);
        var c, mask, f, i;
        if (this.leftover) {
            i = this.leftover;
            this.buffer[i++] = 1;
            for(; i < 16; i++)this.buffer[i] = 0;
            this.fin = 1;
            this.blocks(this.buffer, 0, 16);
        }
        c = this.h[1] >>> 13;
        this.h[1] &= 0x1fff;
        for(i = 2; i < 10; i++){
            this.h[i] += c;
            c = this.h[i] >>> 13;
            this.h[i] &= 0x1fff;
        }
        this.h[0] += c * 5;
        c = this.h[0] >>> 13;
        this.h[0] &= 0x1fff;
        this.h[1] += c;
        c = this.h[1] >>> 13;
        this.h[1] &= 0x1fff;
        this.h[2] += c;
        g[0] = this.h[0] + 5;
        c = g[0] >>> 13;
        g[0] &= 0x1fff;
        for(i = 1; i < 10; i++){
            g[i] = this.h[i] + c;
            c = g[i] >>> 13;
            g[i] &= 0x1fff;
        }
        g[9] -= 1 << 13;
        mask = (c ^ 1) - 1;
        for(i = 0; i < 10; i++)g[i] &= mask;
        mask = ~mask;
        for(i = 0; i < 10; i++)this.h[i] = this.h[i] & mask | g[i];
        this.h[0] = (this.h[0] | this.h[1] << 13) & 0xffff;
        this.h[1] = (this.h[1] >>> 3 | this.h[2] << 10) & 0xffff;
        this.h[2] = (this.h[2] >>> 6 | this.h[3] << 7) & 0xffff;
        this.h[3] = (this.h[3] >>> 9 | this.h[4] << 4) & 0xffff;
        this.h[4] = (this.h[4] >>> 12 | this.h[5] << 1 | this.h[6] << 14) & 0xffff;
        this.h[5] = (this.h[6] >>> 2 | this.h[7] << 11) & 0xffff;
        this.h[6] = (this.h[7] >>> 5 | this.h[8] << 8) & 0xffff;
        this.h[7] = (this.h[8] >>> 8 | this.h[9] << 5) & 0xffff;
        f = this.h[0] + this.pad[0];
        this.h[0] = f & 0xffff;
        for(i = 1; i < 8; i++){
            f = (this.h[i] + this.pad[i] | 0) + (f >>> 16) | 0;
            this.h[i] = f & 0xffff;
        }
        mac[macpos + 0] = this.h[0] >>> 0 & 0xff;
        mac[macpos + 1] = this.h[0] >>> 8 & 0xff;
        mac[macpos + 2] = this.h[1] >>> 0 & 0xff;
        mac[macpos + 3] = this.h[1] >>> 8 & 0xff;
        mac[macpos + 4] = this.h[2] >>> 0 & 0xff;
        mac[macpos + 5] = this.h[2] >>> 8 & 0xff;
        mac[macpos + 6] = this.h[3] >>> 0 & 0xff;
        mac[macpos + 7] = this.h[3] >>> 8 & 0xff;
        mac[macpos + 8] = this.h[4] >>> 0 & 0xff;
        mac[macpos + 9] = this.h[4] >>> 8 & 0xff;
        mac[macpos + 10] = this.h[5] >>> 0 & 0xff;
        mac[macpos + 11] = this.h[5] >>> 8 & 0xff;
        mac[macpos + 12] = this.h[6] >>> 0 & 0xff;
        mac[macpos + 13] = this.h[6] >>> 8 & 0xff;
        mac[macpos + 14] = this.h[7] >>> 0 & 0xff;
        mac[macpos + 15] = this.h[7] >>> 8 & 0xff;
    };
    poly1305.prototype.update = function(m, mpos, bytes) {
        var i, want;
        if (this.leftover) {
            want = 16 - this.leftover;
            if (want > bytes) want = bytes;
            for(i = 0; i < want; i++)this.buffer[this.leftover + i] = m[mpos + i];
            bytes -= want;
            mpos += want;
            this.leftover += want;
            if (this.leftover < 16) return;
            this.blocks(this.buffer, 0, 16);
            this.leftover = 0;
        }
        if (bytes >= 16) {
            want = bytes - bytes % 16;
            this.blocks(m, mpos, want);
            mpos += want;
            bytes -= want;
        }
        if (bytes) {
            for(i = 0; i < bytes; i++)this.buffer[this.leftover + i] = m[mpos + i];
            this.leftover += bytes;
        }
    };
    function crypto_onetimeauth(out, outpos, m, mpos, n, k) {
        var s = new poly1305(k);
        s.update(m, mpos, n);
        s.finish(out, outpos);
        return 0;
    }
    function crypto_onetimeauth_verify(h, hpos, m, mpos, n, k) {
        var x = new Uint8Array(16);
        crypto_onetimeauth(x, 0, m, mpos, n, k);
        return crypto_verify_16(h, hpos, x, 0);
    }
    function crypto_secretbox(c, m, d, n, k) {
        var i;
        if (d < 32) return -1;
        crypto_stream_xor(c, 0, m, 0, d, n, k);
        crypto_onetimeauth(c, 16, c, 32, d - 32, c);
        for(i = 0; i < 16; i++)c[i] = 0;
        return 0;
    }
    function crypto_secretbox_open(m, c, d, n, k) {
        var i;
        var x = new Uint8Array(32);
        if (d < 32) return -1;
        crypto_stream(x, 0, 32, n, k);
        if (crypto_onetimeauth_verify(c, 16, c, 32, d - 32, x) !== 0) return -1;
        crypto_stream_xor(m, 0, c, 0, d, n, k);
        for(i = 0; i < 32; i++)m[i] = 0;
        return 0;
    }
    function set25519(r, a) {
        var i;
        for(i = 0; i < 16; i++)r[i] = a[i] | 0;
    }
    function car25519(o) {
        var i, v, c = 1;
        for(i = 0; i < 16; i++){
            v = o[i] + c + 65535;
            c = Math.floor(v / 65536);
            o[i] = v - c * 65536;
        }
        o[0] += c - 1 + 37 * (c - 1);
    }
    function sel25519(p, q, b) {
        var t, c = ~(b - 1);
        for(var i = 0; i < 16; i++){
            t = c & (p[i] ^ q[i]);
            p[i] ^= t;
            q[i] ^= t;
        }
    }
    function pack25519(o, n) {
        var i, j, b;
        var m = gf(), t = gf();
        for(i = 0; i < 16; i++)t[i] = n[i];
        car25519(t);
        car25519(t);
        car25519(t);
        for(j = 0; j < 2; j++){
            m[0] = t[0] - 0xffed;
            for(i = 1; i < 15; i++){
                m[i] = t[i] - 0xffff - (m[i - 1] >> 16 & 1);
                m[i - 1] &= 0xffff;
            }
            m[15] = t[15] - 0x7fff - (m[14] >> 16 & 1);
            b = m[15] >> 16 & 1;
            m[14] &= 0xffff;
            sel25519(t, m, 1 - b);
        }
        for(i = 0; i < 16; i++){
            o[2 * i] = t[i] & 0xff;
            o[2 * i + 1] = t[i] >> 8;
        }
    }
    function neq25519(a, b) {
        var c = new Uint8Array(32), d = new Uint8Array(32);
        pack25519(c, a);
        pack25519(d, b);
        return crypto_verify_32(c, 0, d, 0);
    }
    function par25519(a) {
        var d = new Uint8Array(32);
        pack25519(d, a);
        return d[0] & 1;
    }
    function unpack25519(o, n) {
        var i;
        for(i = 0; i < 16; i++)o[i] = n[2 * i] + (n[2 * i + 1] << 8);
        o[15] &= 0x7fff;
    }
    function A(o, a, b) {
        for(var i = 0; i < 16; i++)o[i] = a[i] + b[i];
    }
    function Z(o, a, b) {
        for(var i = 0; i < 16; i++)o[i] = a[i] - b[i];
    }
    function M(o, a, b) {
        var v, c, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0, t10 = 0, t11 = 0, t12 = 0, t13 = 0, t14 = 0, t15 = 0, t16 = 0, t17 = 0, t18 = 0, t19 = 0, t20 = 0, t21 = 0, t22 = 0, t23 = 0, t24 = 0, t25 = 0, t26 = 0, t27 = 0, t28 = 0, t29 = 0, t30 = 0, b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3], b4 = b[4], b5 = b[5], b6 = b[6], b7 = b[7], b8 = b[8], b9 = b[9], b10 = b[10], b11 = b[11], b12 = b[12], b13 = b[13], b14 = b[14], b15 = b[15];
        v = a[0];
        t0 += v * b0;
        t1 += v * b1;
        t2 += v * b2;
        t3 += v * b3;
        t4 += v * b4;
        t5 += v * b5;
        t6 += v * b6;
        t7 += v * b7;
        t8 += v * b8;
        t9 += v * b9;
        t10 += v * b10;
        t11 += v * b11;
        t12 += v * b12;
        t13 += v * b13;
        t14 += v * b14;
        t15 += v * b15;
        v = a[1];
        t1 += v * b0;
        t2 += v * b1;
        t3 += v * b2;
        t4 += v * b3;
        t5 += v * b4;
        t6 += v * b5;
        t7 += v * b6;
        t8 += v * b7;
        t9 += v * b8;
        t10 += v * b9;
        t11 += v * b10;
        t12 += v * b11;
        t13 += v * b12;
        t14 += v * b13;
        t15 += v * b14;
        t16 += v * b15;
        v = a[2];
        t2 += v * b0;
        t3 += v * b1;
        t4 += v * b2;
        t5 += v * b3;
        t6 += v * b4;
        t7 += v * b5;
        t8 += v * b6;
        t9 += v * b7;
        t10 += v * b8;
        t11 += v * b9;
        t12 += v * b10;
        t13 += v * b11;
        t14 += v * b12;
        t15 += v * b13;
        t16 += v * b14;
        t17 += v * b15;
        v = a[3];
        t3 += v * b0;
        t4 += v * b1;
        t5 += v * b2;
        t6 += v * b3;
        t7 += v * b4;
        t8 += v * b5;
        t9 += v * b6;
        t10 += v * b7;
        t11 += v * b8;
        t12 += v * b9;
        t13 += v * b10;
        t14 += v * b11;
        t15 += v * b12;
        t16 += v * b13;
        t17 += v * b14;
        t18 += v * b15;
        v = a[4];
        t4 += v * b0;
        t5 += v * b1;
        t6 += v * b2;
        t7 += v * b3;
        t8 += v * b4;
        t9 += v * b5;
        t10 += v * b6;
        t11 += v * b7;
        t12 += v * b8;
        t13 += v * b9;
        t14 += v * b10;
        t15 += v * b11;
        t16 += v * b12;
        t17 += v * b13;
        t18 += v * b14;
        t19 += v * b15;
        v = a[5];
        t5 += v * b0;
        t6 += v * b1;
        t7 += v * b2;
        t8 += v * b3;
        t9 += v * b4;
        t10 += v * b5;
        t11 += v * b6;
        t12 += v * b7;
        t13 += v * b8;
        t14 += v * b9;
        t15 += v * b10;
        t16 += v * b11;
        t17 += v * b12;
        t18 += v * b13;
        t19 += v * b14;
        t20 += v * b15;
        v = a[6];
        t6 += v * b0;
        t7 += v * b1;
        t8 += v * b2;
        t9 += v * b3;
        t10 += v * b4;
        t11 += v * b5;
        t12 += v * b6;
        t13 += v * b7;
        t14 += v * b8;
        t15 += v * b9;
        t16 += v * b10;
        t17 += v * b11;
        t18 += v * b12;
        t19 += v * b13;
        t20 += v * b14;
        t21 += v * b15;
        v = a[7];
        t7 += v * b0;
        t8 += v * b1;
        t9 += v * b2;
        t10 += v * b3;
        t11 += v * b4;
        t12 += v * b5;
        t13 += v * b6;
        t14 += v * b7;
        t15 += v * b8;
        t16 += v * b9;
        t17 += v * b10;
        t18 += v * b11;
        t19 += v * b12;
        t20 += v * b13;
        t21 += v * b14;
        t22 += v * b15;
        v = a[8];
        t8 += v * b0;
        t9 += v * b1;
        t10 += v * b2;
        t11 += v * b3;
        t12 += v * b4;
        t13 += v * b5;
        t14 += v * b6;
        t15 += v * b7;
        t16 += v * b8;
        t17 += v * b9;
        t18 += v * b10;
        t19 += v * b11;
        t20 += v * b12;
        t21 += v * b13;
        t22 += v * b14;
        t23 += v * b15;
        v = a[9];
        t9 += v * b0;
        t10 += v * b1;
        t11 += v * b2;
        t12 += v * b3;
        t13 += v * b4;
        t14 += v * b5;
        t15 += v * b6;
        t16 += v * b7;
        t17 += v * b8;
        t18 += v * b9;
        t19 += v * b10;
        t20 += v * b11;
        t21 += v * b12;
        t22 += v * b13;
        t23 += v * b14;
        t24 += v * b15;
        v = a[10];
        t10 += v * b0;
        t11 += v * b1;
        t12 += v * b2;
        t13 += v * b3;
        t14 += v * b4;
        t15 += v * b5;
        t16 += v * b6;
        t17 += v * b7;
        t18 += v * b8;
        t19 += v * b9;
        t20 += v * b10;
        t21 += v * b11;
        t22 += v * b12;
        t23 += v * b13;
        t24 += v * b14;
        t25 += v * b15;
        v = a[11];
        t11 += v * b0;
        t12 += v * b1;
        t13 += v * b2;
        t14 += v * b3;
        t15 += v * b4;
        t16 += v * b5;
        t17 += v * b6;
        t18 += v * b7;
        t19 += v * b8;
        t20 += v * b9;
        t21 += v * b10;
        t22 += v * b11;
        t23 += v * b12;
        t24 += v * b13;
        t25 += v * b14;
        t26 += v * b15;
        v = a[12];
        t12 += v * b0;
        t13 += v * b1;
        t14 += v * b2;
        t15 += v * b3;
        t16 += v * b4;
        t17 += v * b5;
        t18 += v * b6;
        t19 += v * b7;
        t20 += v * b8;
        t21 += v * b9;
        t22 += v * b10;
        t23 += v * b11;
        t24 += v * b12;
        t25 += v * b13;
        t26 += v * b14;
        t27 += v * b15;
        v = a[13];
        t13 += v * b0;
        t14 += v * b1;
        t15 += v * b2;
        t16 += v * b3;
        t17 += v * b4;
        t18 += v * b5;
        t19 += v * b6;
        t20 += v * b7;
        t21 += v * b8;
        t22 += v * b9;
        t23 += v * b10;
        t24 += v * b11;
        t25 += v * b12;
        t26 += v * b13;
        t27 += v * b14;
        t28 += v * b15;
        v = a[14];
        t14 += v * b0;
        t15 += v * b1;
        t16 += v * b2;
        t17 += v * b3;
        t18 += v * b4;
        t19 += v * b5;
        t20 += v * b6;
        t21 += v * b7;
        t22 += v * b8;
        t23 += v * b9;
        t24 += v * b10;
        t25 += v * b11;
        t26 += v * b12;
        t27 += v * b13;
        t28 += v * b14;
        t29 += v * b15;
        v = a[15];
        t15 += v * b0;
        t16 += v * b1;
        t17 += v * b2;
        t18 += v * b3;
        t19 += v * b4;
        t20 += v * b5;
        t21 += v * b6;
        t22 += v * b7;
        t23 += v * b8;
        t24 += v * b9;
        t25 += v * b10;
        t26 += v * b11;
        t27 += v * b12;
        t28 += v * b13;
        t29 += v * b14;
        t30 += v * b15;
        t0 += 38 * t16;
        t1 += 38 * t17;
        t2 += 38 * t18;
        t3 += 38 * t19;
        t4 += 38 * t20;
        t5 += 38 * t21;
        t6 += 38 * t22;
        t7 += 38 * t23;
        t8 += 38 * t24;
        t9 += 38 * t25;
        t10 += 38 * t26;
        t11 += 38 * t27;
        t12 += 38 * t28;
        t13 += 38 * t29;
        t14 += 38 * t30;
        // t15 left as is
        // first car
        c = 1;
        v = t0 + c + 65535;
        c = Math.floor(v / 65536);
        t0 = v - c * 65536;
        v = t1 + c + 65535;
        c = Math.floor(v / 65536);
        t1 = v - c * 65536;
        v = t2 + c + 65535;
        c = Math.floor(v / 65536);
        t2 = v - c * 65536;
        v = t3 + c + 65535;
        c = Math.floor(v / 65536);
        t3 = v - c * 65536;
        v = t4 + c + 65535;
        c = Math.floor(v / 65536);
        t4 = v - c * 65536;
        v = t5 + c + 65535;
        c = Math.floor(v / 65536);
        t5 = v - c * 65536;
        v = t6 + c + 65535;
        c = Math.floor(v / 65536);
        t6 = v - c * 65536;
        v = t7 + c + 65535;
        c = Math.floor(v / 65536);
        t7 = v - c * 65536;
        v = t8 + c + 65535;
        c = Math.floor(v / 65536);
        t8 = v - c * 65536;
        v = t9 + c + 65535;
        c = Math.floor(v / 65536);
        t9 = v - c * 65536;
        v = t10 + c + 65535;
        c = Math.floor(v / 65536);
        t10 = v - c * 65536;
        v = t11 + c + 65535;
        c = Math.floor(v / 65536);
        t11 = v - c * 65536;
        v = t12 + c + 65535;
        c = Math.floor(v / 65536);
        t12 = v - c * 65536;
        v = t13 + c + 65535;
        c = Math.floor(v / 65536);
        t13 = v - c * 65536;
        v = t14 + c + 65535;
        c = Math.floor(v / 65536);
        t14 = v - c * 65536;
        v = t15 + c + 65535;
        c = Math.floor(v / 65536);
        t15 = v - c * 65536;
        t0 += c - 1 + 37 * (c - 1);
        // second car
        c = 1;
        v = t0 + c + 65535;
        c = Math.floor(v / 65536);
        t0 = v - c * 65536;
        v = t1 + c + 65535;
        c = Math.floor(v / 65536);
        t1 = v - c * 65536;
        v = t2 + c + 65535;
        c = Math.floor(v / 65536);
        t2 = v - c * 65536;
        v = t3 + c + 65535;
        c = Math.floor(v / 65536);
        t3 = v - c * 65536;
        v = t4 + c + 65535;
        c = Math.floor(v / 65536);
        t4 = v - c * 65536;
        v = t5 + c + 65535;
        c = Math.floor(v / 65536);
        t5 = v - c * 65536;
        v = t6 + c + 65535;
        c = Math.floor(v / 65536);
        t6 = v - c * 65536;
        v = t7 + c + 65535;
        c = Math.floor(v / 65536);
        t7 = v - c * 65536;
        v = t8 + c + 65535;
        c = Math.floor(v / 65536);
        t8 = v - c * 65536;
        v = t9 + c + 65535;
        c = Math.floor(v / 65536);
        t9 = v - c * 65536;
        v = t10 + c + 65535;
        c = Math.floor(v / 65536);
        t10 = v - c * 65536;
        v = t11 + c + 65535;
        c = Math.floor(v / 65536);
        t11 = v - c * 65536;
        v = t12 + c + 65535;
        c = Math.floor(v / 65536);
        t12 = v - c * 65536;
        v = t13 + c + 65535;
        c = Math.floor(v / 65536);
        t13 = v - c * 65536;
        v = t14 + c + 65535;
        c = Math.floor(v / 65536);
        t14 = v - c * 65536;
        v = t15 + c + 65535;
        c = Math.floor(v / 65536);
        t15 = v - c * 65536;
        t0 += c - 1 + 37 * (c - 1);
        o[0] = t0;
        o[1] = t1;
        o[2] = t2;
        o[3] = t3;
        o[4] = t4;
        o[5] = t5;
        o[6] = t6;
        o[7] = t7;
        o[8] = t8;
        o[9] = t9;
        o[10] = t10;
        o[11] = t11;
        o[12] = t12;
        o[13] = t13;
        o[14] = t14;
        o[15] = t15;
    }
    function S(o, a) {
        M(o, a, a);
    }
    function inv25519(o, i) {
        var c = gf();
        var a;
        for(a = 0; a < 16; a++)c[a] = i[a];
        for(a = 253; a >= 0; a--){
            S(c, c);
            if (a !== 2 && a !== 4) M(c, c, i);
        }
        for(a = 0; a < 16; a++)o[a] = c[a];
    }
    function pow2523(o, i) {
        var c = gf();
        var a;
        for(a = 0; a < 16; a++)c[a] = i[a];
        for(a = 250; a >= 0; a--){
            S(c, c);
            if (a !== 1) M(c, c, i);
        }
        for(a = 0; a < 16; a++)o[a] = c[a];
    }
    function crypto_scalarmult(q, n, p) {
        var z = new Uint8Array(32);
        var x = new Float64Array(80), r, i;
        var a = gf(), b = gf(), c = gf(), d = gf(), e = gf(), f = gf();
        for(i = 0; i < 31; i++)z[i] = n[i];
        z[31] = n[31] & 127 | 64;
        z[0] &= 248;
        unpack25519(x, p);
        for(i = 0; i < 16; i++){
            b[i] = x[i];
            d[i] = a[i] = c[i] = 0;
        }
        a[0] = d[0] = 1;
        for(i = 254; i >= 0; --i){
            r = z[i >>> 3] >>> (i & 7) & 1;
            sel25519(a, b, r);
            sel25519(c, d, r);
            A(e, a, c);
            Z(a, a, c);
            A(c, b, d);
            Z(b, b, d);
            S(d, e);
            S(f, a);
            M(a, c, a);
            M(c, b, e);
            A(e, a, c);
            Z(a, a, c);
            S(b, a);
            Z(c, d, f);
            M(a, c, _121665);
            A(a, a, d);
            M(c, c, a);
            M(a, d, f);
            M(d, b, x);
            S(b, e);
            sel25519(a, b, r);
            sel25519(c, d, r);
        }
        for(i = 0; i < 16; i++){
            x[i + 16] = a[i];
            x[i + 32] = c[i];
            x[i + 48] = b[i];
            x[i + 64] = d[i];
        }
        var x32 = x.subarray(32);
        var x16 = x.subarray(16);
        inv25519(x32, x32);
        M(x16, x16, x32);
        pack25519(q, x16);
        return 0;
    }
    function crypto_scalarmult_base(q, n) {
        return crypto_scalarmult(q, n, _9);
    }
    function crypto_box_keypair(y, x) {
        randombytes(x, 32);
        return crypto_scalarmult_base(y, x);
    }
    function crypto_box_beforenm(k, y, x) {
        var s = new Uint8Array(32);
        crypto_scalarmult(s, x, y);
        return crypto_core_hsalsa20(k, _0, s, sigma);
    }
    var crypto_box_afternm = crypto_secretbox;
    var crypto_box_open_afternm = crypto_secretbox_open;
    function crypto_box(c, m, d, n, y, x) {
        var k = new Uint8Array(32);
        crypto_box_beforenm(k, y, x);
        return crypto_box_afternm(c, m, d, n, k);
    }
    function crypto_box_open(m, c, d, n, y, x) {
        var k = new Uint8Array(32);
        crypto_box_beforenm(k, y, x);
        return crypto_box_open_afternm(m, c, d, n, k);
    }
    var K = [
        0x428a2f98,
        0xd728ae22,
        0x71374491,
        0x23ef65cd,
        0xb5c0fbcf,
        0xec4d3b2f,
        0xe9b5dba5,
        0x8189dbbc,
        0x3956c25b,
        0xf348b538,
        0x59f111f1,
        0xb605d019,
        0x923f82a4,
        0xaf194f9b,
        0xab1c5ed5,
        0xda6d8118,
        0xd807aa98,
        0xa3030242,
        0x12835b01,
        0x45706fbe,
        0x243185be,
        0x4ee4b28c,
        0x550c7dc3,
        0xd5ffb4e2,
        0x72be5d74,
        0xf27b896f,
        0x80deb1fe,
        0x3b1696b1,
        0x9bdc06a7,
        0x25c71235,
        0xc19bf174,
        0xcf692694,
        0xe49b69c1,
        0x9ef14ad2,
        0xefbe4786,
        0x384f25e3,
        0x0fc19dc6,
        0x8b8cd5b5,
        0x240ca1cc,
        0x77ac9c65,
        0x2de92c6f,
        0x592b0275,
        0x4a7484aa,
        0x6ea6e483,
        0x5cb0a9dc,
        0xbd41fbd4,
        0x76f988da,
        0x831153b5,
        0x983e5152,
        0xee66dfab,
        0xa831c66d,
        0x2db43210,
        0xb00327c8,
        0x98fb213f,
        0xbf597fc7,
        0xbeef0ee4,
        0xc6e00bf3,
        0x3da88fc2,
        0xd5a79147,
        0x930aa725,
        0x06ca6351,
        0xe003826f,
        0x14292967,
        0x0a0e6e70,
        0x27b70a85,
        0x46d22ffc,
        0x2e1b2138,
        0x5c26c926,
        0x4d2c6dfc,
        0x5ac42aed,
        0x53380d13,
        0x9d95b3df,
        0x650a7354,
        0x8baf63de,
        0x766a0abb,
        0x3c77b2a8,
        0x81c2c92e,
        0x47edaee6,
        0x92722c85,
        0x1482353b,
        0xa2bfe8a1,
        0x4cf10364,
        0xa81a664b,
        0xbc423001,
        0xc24b8b70,
        0xd0f89791,
        0xc76c51a3,
        0x0654be30,
        0xd192e819,
        0xd6ef5218,
        0xd6990624,
        0x5565a910,
        0xf40e3585,
        0x5771202a,
        0x106aa070,
        0x32bbd1b8,
        0x19a4c116,
        0xb8d2d0c8,
        0x1e376c08,
        0x5141ab53,
        0x2748774c,
        0xdf8eeb99,
        0x34b0bcb5,
        0xe19b48a8,
        0x391c0cb3,
        0xc5c95a63,
        0x4ed8aa4a,
        0xe3418acb,
        0x5b9cca4f,
        0x7763e373,
        0x682e6ff3,
        0xd6b2b8a3,
        0x748f82ee,
        0x5defb2fc,
        0x78a5636f,
        0x43172f60,
        0x84c87814,
        0xa1f0ab72,
        0x8cc70208,
        0x1a6439ec,
        0x90befffa,
        0x23631e28,
        0xa4506ceb,
        0xde82bde9,
        0xbef9a3f7,
        0xb2c67915,
        0xc67178f2,
        0xe372532b,
        0xca273ece,
        0xea26619c,
        0xd186b8c7,
        0x21c0c207,
        0xeada7dd6,
        0xcde0eb1e,
        0xf57d4f7f,
        0xee6ed178,
        0x06f067aa,
        0x72176fba,
        0x0a637dc5,
        0xa2c898a6,
        0x113f9804,
        0xbef90dae,
        0x1b710b35,
        0x131c471b,
        0x28db77f5,
        0x23047d84,
        0x32caab7b,
        0x40c72493,
        0x3c9ebe0a,
        0x15c9bebc,
        0x431d67c4,
        0x9c100d4c,
        0x4cc5d4be,
        0xcb3e42b6,
        0x597f299c,
        0xfc657e2a,
        0x5fcb6fab,
        0x3ad6faec,
        0x6c44198c,
        0x4a475817
    ];
    function crypto_hashblocks_hl(hh, hl, m, n) {
        var wh = new Int32Array(16), wl = new Int32Array(16), bh0, bh1, bh2, bh3, bh4, bh5, bh6, bh7, bl0, bl1, bl2, bl3, bl4, bl5, bl6, bl7, th, tl, i, j, h, l, a, b, c, d;
        var ah0 = hh[0], ah1 = hh[1], ah2 = hh[2], ah3 = hh[3], ah4 = hh[4], ah5 = hh[5], ah6 = hh[6], ah7 = hh[7], al0 = hl[0], al1 = hl[1], al2 = hl[2], al3 = hl[3], al4 = hl[4], al5 = hl[5], al6 = hl[6], al7 = hl[7];
        var pos = 0;
        while(n >= 128){
            for(i = 0; i < 16; i++){
                j = 8 * i + pos;
                wh[i] = m[j + 0] << 24 | m[j + 1] << 16 | m[j + 2] << 8 | m[j + 3];
                wl[i] = m[j + 4] << 24 | m[j + 5] << 16 | m[j + 6] << 8 | m[j + 7];
            }
            for(i = 0; i < 80; i++){
                bh0 = ah0;
                bh1 = ah1;
                bh2 = ah2;
                bh3 = ah3;
                bh4 = ah4;
                bh5 = ah5;
                bh6 = ah6;
                bh7 = ah7;
                bl0 = al0;
                bl1 = al1;
                bl2 = al2;
                bl3 = al3;
                bl4 = al4;
                bl5 = al5;
                bl6 = al6;
                bl7 = al7;
                // add
                h = ah7;
                l = al7;
                a = l & 0xffff;
                b = l >>> 16;
                c = h & 0xffff;
                d = h >>> 16;
                // Sigma1
                h = (ah4 >>> 14 | al4 << 32 - 14) ^ (ah4 >>> 18 | al4 << 32 - 18) ^ (al4 >>> 41 - 32 | ah4 << 32 - (41 - 32));
                l = (al4 >>> 14 | ah4 << 32 - 14) ^ (al4 >>> 18 | ah4 << 32 - 18) ^ (ah4 >>> 41 - 32 | al4 << 32 - (41 - 32));
                a += l & 0xffff;
                b += l >>> 16;
                c += h & 0xffff;
                d += h >>> 16;
                // Ch
                h = ah4 & ah5 ^ ~ah4 & ah6;
                l = al4 & al5 ^ ~al4 & al6;
                a += l & 0xffff;
                b += l >>> 16;
                c += h & 0xffff;
                d += h >>> 16;
                // K
                h = K[i * 2];
                l = K[i * 2 + 1];
                a += l & 0xffff;
                b += l >>> 16;
                c += h & 0xffff;
                d += h >>> 16;
                // w
                h = wh[i % 16];
                l = wl[i % 16];
                a += l & 0xffff;
                b += l >>> 16;
                c += h & 0xffff;
                d += h >>> 16;
                b += a >>> 16;
                c += b >>> 16;
                d += c >>> 16;
                th = c & 0xffff | d << 16;
                tl = a & 0xffff | b << 16;
                // add
                h = th;
                l = tl;
                a = l & 0xffff;
                b = l >>> 16;
                c = h & 0xffff;
                d = h >>> 16;
                // Sigma0
                h = (ah0 >>> 28 | al0 << 32 - 28) ^ (al0 >>> 34 - 32 | ah0 << 32 - (34 - 32)) ^ (al0 >>> 39 - 32 | ah0 << 32 - (39 - 32));
                l = (al0 >>> 28 | ah0 << 32 - 28) ^ (ah0 >>> 34 - 32 | al0 << 32 - (34 - 32)) ^ (ah0 >>> 39 - 32 | al0 << 32 - (39 - 32));
                a += l & 0xffff;
                b += l >>> 16;
                c += h & 0xffff;
                d += h >>> 16;
                // Maj
                h = ah0 & ah1 ^ ah0 & ah2 ^ ah1 & ah2;
                l = al0 & al1 ^ al0 & al2 ^ al1 & al2;
                a += l & 0xffff;
                b += l >>> 16;
                c += h & 0xffff;
                d += h >>> 16;
                b += a >>> 16;
                c += b >>> 16;
                d += c >>> 16;
                bh7 = c & 0xffff | d << 16;
                bl7 = a & 0xffff | b << 16;
                // add
                h = bh3;
                l = bl3;
                a = l & 0xffff;
                b = l >>> 16;
                c = h & 0xffff;
                d = h >>> 16;
                h = th;
                l = tl;
                a += l & 0xffff;
                b += l >>> 16;
                c += h & 0xffff;
                d += h >>> 16;
                b += a >>> 16;
                c += b >>> 16;
                d += c >>> 16;
                bh3 = c & 0xffff | d << 16;
                bl3 = a & 0xffff | b << 16;
                ah1 = bh0;
                ah2 = bh1;
                ah3 = bh2;
                ah4 = bh3;
                ah5 = bh4;
                ah6 = bh5;
                ah7 = bh6;
                ah0 = bh7;
                al1 = bl0;
                al2 = bl1;
                al3 = bl2;
                al4 = bl3;
                al5 = bl4;
                al6 = bl5;
                al7 = bl6;
                al0 = bl7;
                if (i % 16 === 15) {
                    for(j = 0; j < 16; j++){
                        // add
                        h = wh[j];
                        l = wl[j];
                        a = l & 0xffff;
                        b = l >>> 16;
                        c = h & 0xffff;
                        d = h >>> 16;
                        h = wh[(j + 9) % 16];
                        l = wl[(j + 9) % 16];
                        a += l & 0xffff;
                        b += l >>> 16;
                        c += h & 0xffff;
                        d += h >>> 16;
                        // sigma0
                        th = wh[(j + 1) % 16];
                        tl = wl[(j + 1) % 16];
                        h = (th >>> 1 | tl << 32 - 1) ^ (th >>> 8 | tl << 32 - 8) ^ th >>> 7;
                        l = (tl >>> 1 | th << 32 - 1) ^ (tl >>> 8 | th << 32 - 8) ^ (tl >>> 7 | th << 32 - 7);
                        a += l & 0xffff;
                        b += l >>> 16;
                        c += h & 0xffff;
                        d += h >>> 16;
                        // sigma1
                        th = wh[(j + 14) % 16];
                        tl = wl[(j + 14) % 16];
                        h = (th >>> 19 | tl << 32 - 19) ^ (tl >>> 61 - 32 | th << 32 - (61 - 32)) ^ th >>> 6;
                        l = (tl >>> 19 | th << 32 - 19) ^ (th >>> 61 - 32 | tl << 32 - (61 - 32)) ^ (tl >>> 6 | th << 32 - 6);
                        a += l & 0xffff;
                        b += l >>> 16;
                        c += h & 0xffff;
                        d += h >>> 16;
                        b += a >>> 16;
                        c += b >>> 16;
                        d += c >>> 16;
                        wh[j] = c & 0xffff | d << 16;
                        wl[j] = a & 0xffff | b << 16;
                    }
                }
            }
            // add
            h = ah0;
            l = al0;
            a = l & 0xffff;
            b = l >>> 16;
            c = h & 0xffff;
            d = h >>> 16;
            h = hh[0];
            l = hl[0];
            a += l & 0xffff;
            b += l >>> 16;
            c += h & 0xffff;
            d += h >>> 16;
            b += a >>> 16;
            c += b >>> 16;
            d += c >>> 16;
            hh[0] = ah0 = c & 0xffff | d << 16;
            hl[0] = al0 = a & 0xffff | b << 16;
            h = ah1;
            l = al1;
            a = l & 0xffff;
            b = l >>> 16;
            c = h & 0xffff;
            d = h >>> 16;
            h = hh[1];
            l = hl[1];
            a += l & 0xffff;
            b += l >>> 16;
            c += h & 0xffff;
            d += h >>> 16;
            b += a >>> 16;
            c += b >>> 16;
            d += c >>> 16;
            hh[1] = ah1 = c & 0xffff | d << 16;
            hl[1] = al1 = a & 0xffff | b << 16;
            h = ah2;
            l = al2;
            a = l & 0xffff;
            b = l >>> 16;
            c = h & 0xffff;
            d = h >>> 16;
            h = hh[2];
            l = hl[2];
            a += l & 0xffff;
            b += l >>> 16;
            c += h & 0xffff;
            d += h >>> 16;
            b += a >>> 16;
            c += b >>> 16;
            d += c >>> 16;
            hh[2] = ah2 = c & 0xffff | d << 16;
            hl[2] = al2 = a & 0xffff | b << 16;
            h = ah3;
            l = al3;
            a = l & 0xffff;
            b = l >>> 16;
            c = h & 0xffff;
            d = h >>> 16;
            h = hh[3];
            l = hl[3];
            a += l & 0xffff;
            b += l >>> 16;
            c += h & 0xffff;
            d += h >>> 16;
            b += a >>> 16;
            c += b >>> 16;
            d += c >>> 16;
            hh[3] = ah3 = c & 0xffff | d << 16;
            hl[3] = al3 = a & 0xffff | b << 16;
            h = ah4;
            l = al4;
            a = l & 0xffff;
            b = l >>> 16;
            c = h & 0xffff;
            d = h >>> 16;
            h = hh[4];
            l = hl[4];
            a += l & 0xffff;
            b += l >>> 16;
            c += h & 0xffff;
            d += h >>> 16;
            b += a >>> 16;
            c += b >>> 16;
            d += c >>> 16;
            hh[4] = ah4 = c & 0xffff | d << 16;
            hl[4] = al4 = a & 0xffff | b << 16;
            h = ah5;
            l = al5;
            a = l & 0xffff;
            b = l >>> 16;
            c = h & 0xffff;
            d = h >>> 16;
            h = hh[5];
            l = hl[5];
            a += l & 0xffff;
            b += l >>> 16;
            c += h & 0xffff;
            d += h >>> 16;
            b += a >>> 16;
            c += b >>> 16;
            d += c >>> 16;
            hh[5] = ah5 = c & 0xffff | d << 16;
            hl[5] = al5 = a & 0xffff | b << 16;
            h = ah6;
            l = al6;
            a = l & 0xffff;
            b = l >>> 16;
            c = h & 0xffff;
            d = h >>> 16;
            h = hh[6];
            l = hl[6];
            a += l & 0xffff;
            b += l >>> 16;
            c += h & 0xffff;
            d += h >>> 16;
            b += a >>> 16;
            c += b >>> 16;
            d += c >>> 16;
            hh[6] = ah6 = c & 0xffff | d << 16;
            hl[6] = al6 = a & 0xffff | b << 16;
            h = ah7;
            l = al7;
            a = l & 0xffff;
            b = l >>> 16;
            c = h & 0xffff;
            d = h >>> 16;
            h = hh[7];
            l = hl[7];
            a += l & 0xffff;
            b += l >>> 16;
            c += h & 0xffff;
            d += h >>> 16;
            b += a >>> 16;
            c += b >>> 16;
            d += c >>> 16;
            hh[7] = ah7 = c & 0xffff | d << 16;
            hl[7] = al7 = a & 0xffff | b << 16;
            pos += 128;
            n -= 128;
        }
        return n;
    }
    function crypto_hash(out, m, n) {
        var hh = new Int32Array(8), hl = new Int32Array(8), x = new Uint8Array(256), i, b = n;
        hh[0] = 0x6a09e667;
        hh[1] = 0xbb67ae85;
        hh[2] = 0x3c6ef372;
        hh[3] = 0xa54ff53a;
        hh[4] = 0x510e527f;
        hh[5] = 0x9b05688c;
        hh[6] = 0x1f83d9ab;
        hh[7] = 0x5be0cd19;
        hl[0] = 0xf3bcc908;
        hl[1] = 0x84caa73b;
        hl[2] = 0xfe94f82b;
        hl[3] = 0x5f1d36f1;
        hl[4] = 0xade682d1;
        hl[5] = 0x2b3e6c1f;
        hl[6] = 0xfb41bd6b;
        hl[7] = 0x137e2179;
        crypto_hashblocks_hl(hh, hl, m, n);
        n %= 128;
        for(i = 0; i < n; i++)x[i] = m[b - n + i];
        x[n] = 128;
        n = 256 - 128 * (n < 112 ? 1 : 0);
        x[n - 9] = 0;
        ts64(x, n - 8, b / 0x20000000 | 0, b << 3);
        crypto_hashblocks_hl(hh, hl, x, n);
        for(i = 0; i < 8; i++)ts64(out, 8 * i, hh[i], hl[i]);
        return 0;
    }
    function add(p, q) {
        var a = gf(), b = gf(), c = gf(), d = gf(), e = gf(), f = gf(), g = gf(), h = gf(), t = gf();
        Z(a, p[1], p[0]);
        Z(t, q[1], q[0]);
        M(a, a, t);
        A(b, p[0], p[1]);
        A(t, q[0], q[1]);
        M(b, b, t);
        M(c, p[3], q[3]);
        M(c, c, D2);
        M(d, p[2], q[2]);
        A(d, d, d);
        Z(e, b, a);
        Z(f, d, c);
        A(g, d, c);
        A(h, b, a);
        M(p[0], e, f);
        M(p[1], h, g);
        M(p[2], g, f);
        M(p[3], e, h);
    }
    function cswap(p, q, b) {
        var i;
        for(i = 0; i < 4; i++){
            sel25519(p[i], q[i], b);
        }
    }
    function pack(r, p) {
        var tx = gf(), ty = gf(), zi = gf();
        inv25519(zi, p[2]);
        M(tx, p[0], zi);
        M(ty, p[1], zi);
        pack25519(r, ty);
        r[31] ^= par25519(tx) << 7;
    }
    function scalarmult(p, q, s) {
        var b, i;
        set25519(p[0], gf0);
        set25519(p[1], gf1);
        set25519(p[2], gf1);
        set25519(p[3], gf0);
        for(i = 255; i >= 0; --i){
            b = s[i / 8 | 0] >> (i & 7) & 1;
            cswap(p, q, b);
            add(q, p);
            add(p, p);
            cswap(p, q, b);
        }
    }
    function scalarbase(p, s) {
        var q = [
            gf(),
            gf(),
            gf(),
            gf()
        ];
        set25519(q[0], X);
        set25519(q[1], Y);
        set25519(q[2], gf1);
        M(q[3], X, Y);
        scalarmult(p, q, s);
    }
    function crypto_sign_keypair(pk, sk, seeded) {
        var d = new Uint8Array(64);
        var p = [
            gf(),
            gf(),
            gf(),
            gf()
        ];
        var i;
        if (!seeded) randombytes(sk, 32);
        crypto_hash(d, sk, 32);
        d[0] &= 248;
        d[31] &= 127;
        d[31] |= 64;
        scalarbase(p, d);
        pack(pk, p);
        for(i = 0; i < 32; i++)sk[i + 32] = pk[i];
        return 0;
    }
    var L = new Float64Array([
        0xed,
        0xd3,
        0xf5,
        0x5c,
        0x1a,
        0x63,
        0x12,
        0x58,
        0xd6,
        0x9c,
        0xf7,
        0xa2,
        0xde,
        0xf9,
        0xde,
        0x14,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0x10
    ]);
    function modL(r, x) {
        var carry, i, j, k;
        for(i = 63; i >= 32; --i){
            carry = 0;
            for(j = i - 32, k = i - 12; j < k; ++j){
                x[j] += carry - 16 * x[i] * L[j - (i - 32)];
                carry = Math.floor((x[j] + 128) / 256);
                x[j] -= carry * 256;
            }
            x[j] += carry;
            x[i] = 0;
        }
        carry = 0;
        for(j = 0; j < 32; j++){
            x[j] += carry - (x[31] >> 4) * L[j];
            carry = x[j] >> 8;
            x[j] &= 255;
        }
        for(j = 0; j < 32; j++)x[j] -= carry * L[j];
        for(i = 0; i < 32; i++){
            x[i + 1] += x[i] >> 8;
            r[i] = x[i] & 255;
        }
    }
    function reduce(r) {
        var x = new Float64Array(64), i;
        for(i = 0; i < 64; i++)x[i] = r[i];
        for(i = 0; i < 64; i++)r[i] = 0;
        modL(r, x);
    }
    // Note: difference from C - smlen returned, not passed as argument.
    function crypto_sign(sm, m, n, sk) {
        var d = new Uint8Array(64), h = new Uint8Array(64), r = new Uint8Array(64);
        var i, j, x = new Float64Array(64);
        var p = [
            gf(),
            gf(),
            gf(),
            gf()
        ];
        crypto_hash(d, sk, 32);
        d[0] &= 248;
        d[31] &= 127;
        d[31] |= 64;
        var smlen = n + 64;
        for(i = 0; i < n; i++)sm[64 + i] = m[i];
        for(i = 0; i < 32; i++)sm[32 + i] = d[32 + i];
        crypto_hash(r, sm.subarray(32), n + 32);
        reduce(r);
        scalarbase(p, r);
        pack(sm, p);
        for(i = 32; i < 64; i++)sm[i] = sk[i];
        crypto_hash(h, sm, n + 64);
        reduce(h);
        for(i = 0; i < 64; i++)x[i] = 0;
        for(i = 0; i < 32; i++)x[i] = r[i];
        for(i = 0; i < 32; i++){
            for(j = 0; j < 32; j++){
                x[i + j] += h[i] * d[j];
            }
        }
        modL(sm.subarray(32), x);
        return smlen;
    }
    function unpackneg(r, p) {
        var t = gf(), chk = gf(), num = gf(), den = gf(), den2 = gf(), den4 = gf(), den6 = gf();
        set25519(r[2], gf1);
        unpack25519(r[1], p);
        S(num, r[1]);
        M(den, num, D);
        Z(num, num, r[2]);
        A(den, r[2], den);
        S(den2, den);
        S(den4, den2);
        M(den6, den4, den2);
        M(t, den6, num);
        M(t, t, den);
        pow2523(t, t);
        M(t, t, num);
        M(t, t, den);
        M(t, t, den);
        M(r[0], t, den);
        S(chk, r[0]);
        M(chk, chk, den);
        if (neq25519(chk, num)) M(r[0], r[0], I);
        S(chk, r[0]);
        M(chk, chk, den);
        if (neq25519(chk, num)) return -1;
        if (par25519(r[0]) === p[31] >> 7) Z(r[0], gf0, r[0]);
        M(r[3], r[0], r[1]);
        return 0;
    }
    function crypto_sign_open(m, sm, n, pk) {
        var i;
        var t = new Uint8Array(32), h = new Uint8Array(64);
        var p = [
            gf(),
            gf(),
            gf(),
            gf()
        ], q = [
            gf(),
            gf(),
            gf(),
            gf()
        ];
        if (n < 64) return -1;
        if (unpackneg(q, pk)) return -1;
        for(i = 0; i < n; i++)m[i] = sm[i];
        for(i = 0; i < 32; i++)m[i + 32] = pk[i];
        crypto_hash(h, m, n);
        reduce(h);
        scalarmult(p, q, h);
        scalarbase(q, sm.subarray(32));
        add(p, q);
        pack(t, p);
        n -= 64;
        if (crypto_verify_32(sm, 0, t, 0)) {
            for(i = 0; i < n; i++)m[i] = 0;
            return -1;
        }
        for(i = 0; i < n; i++)m[i] = sm[i + 64];
        return n;
    }
    var crypto_secretbox_KEYBYTES = 32, crypto_secretbox_NONCEBYTES = 24, crypto_secretbox_ZEROBYTES = 32, crypto_secretbox_BOXZEROBYTES = 16, crypto_scalarmult_BYTES = 32, crypto_scalarmult_SCALARBYTES = 32, crypto_box_PUBLICKEYBYTES = 32, crypto_box_SECRETKEYBYTES = 32, crypto_box_BEFORENMBYTES = 32, crypto_box_NONCEBYTES = crypto_secretbox_NONCEBYTES, crypto_box_ZEROBYTES = crypto_secretbox_ZEROBYTES, crypto_box_BOXZEROBYTES = crypto_secretbox_BOXZEROBYTES, crypto_sign_BYTES = 64, crypto_sign_PUBLICKEYBYTES = 32, crypto_sign_SECRETKEYBYTES = 64, crypto_sign_SEEDBYTES = 32, crypto_hash_BYTES = 64;
    nacl.lowlevel = {
        crypto_core_hsalsa20: crypto_core_hsalsa20,
        crypto_stream_xor: crypto_stream_xor,
        crypto_stream: crypto_stream,
        crypto_stream_salsa20_xor: crypto_stream_salsa20_xor,
        crypto_stream_salsa20: crypto_stream_salsa20,
        crypto_onetimeauth: crypto_onetimeauth,
        crypto_onetimeauth_verify: crypto_onetimeauth_verify,
        crypto_verify_16: crypto_verify_16,
        crypto_verify_32: crypto_verify_32,
        crypto_secretbox: crypto_secretbox,
        crypto_secretbox_open: crypto_secretbox_open,
        crypto_scalarmult: crypto_scalarmult,
        crypto_scalarmult_base: crypto_scalarmult_base,
        crypto_box_beforenm: crypto_box_beforenm,
        crypto_box_afternm: crypto_box_afternm,
        crypto_box: crypto_box,
        crypto_box_open: crypto_box_open,
        crypto_box_keypair: crypto_box_keypair,
        crypto_hash: crypto_hash,
        crypto_sign: crypto_sign,
        crypto_sign_keypair: crypto_sign_keypair,
        crypto_sign_open: crypto_sign_open,
        crypto_secretbox_KEYBYTES: crypto_secretbox_KEYBYTES,
        crypto_secretbox_NONCEBYTES: crypto_secretbox_NONCEBYTES,
        crypto_secretbox_ZEROBYTES: crypto_secretbox_ZEROBYTES,
        crypto_secretbox_BOXZEROBYTES: crypto_secretbox_BOXZEROBYTES,
        crypto_scalarmult_BYTES: crypto_scalarmult_BYTES,
        crypto_scalarmult_SCALARBYTES: crypto_scalarmult_SCALARBYTES,
        crypto_box_PUBLICKEYBYTES: crypto_box_PUBLICKEYBYTES,
        crypto_box_SECRETKEYBYTES: crypto_box_SECRETKEYBYTES,
        crypto_box_BEFORENMBYTES: crypto_box_BEFORENMBYTES,
        crypto_box_NONCEBYTES: crypto_box_NONCEBYTES,
        crypto_box_ZEROBYTES: crypto_box_ZEROBYTES,
        crypto_box_BOXZEROBYTES: crypto_box_BOXZEROBYTES,
        crypto_sign_BYTES: crypto_sign_BYTES,
        crypto_sign_PUBLICKEYBYTES: crypto_sign_PUBLICKEYBYTES,
        crypto_sign_SECRETKEYBYTES: crypto_sign_SECRETKEYBYTES,
        crypto_sign_SEEDBYTES: crypto_sign_SEEDBYTES,
        crypto_hash_BYTES: crypto_hash_BYTES,
        gf: gf,
        D: D,
        L: L,
        pack25519: pack25519,
        unpack25519: unpack25519,
        M: M,
        A: A,
        S: S,
        Z: Z,
        pow2523: pow2523,
        add: add,
        set25519: set25519,
        modL: modL,
        scalarmult: scalarmult,
        scalarbase: scalarbase
    };
    /* High-level API */ function checkLengths(k, n) {
        if (k.length !== crypto_secretbox_KEYBYTES) throw new Error('bad key size');
        if (n.length !== crypto_secretbox_NONCEBYTES) throw new Error('bad nonce size');
    }
    function checkBoxLengths(pk, sk) {
        if (pk.length !== crypto_box_PUBLICKEYBYTES) throw new Error('bad public key size');
        if (sk.length !== crypto_box_SECRETKEYBYTES) throw new Error('bad secret key size');
    }
    function checkArrayTypes() {
        for(var i = 0; i < arguments.length; i++){
            if (!(arguments[i] instanceof Uint8Array)) throw new TypeError('unexpected type, use Uint8Array');
        }
    }
    function cleanup(arr) {
        for(var i = 0; i < arr.length; i++)arr[i] = 0;
    }
    nacl.randomBytes = function(n) {
        var b = new Uint8Array(n);
        randombytes(b, n);
        return b;
    };
    nacl.secretbox = function(msg, nonce, key) {
        checkArrayTypes(msg, nonce, key);
        checkLengths(key, nonce);
        var m = new Uint8Array(crypto_secretbox_ZEROBYTES + msg.length);
        var c = new Uint8Array(m.length);
        for(var i = 0; i < msg.length; i++)m[i + crypto_secretbox_ZEROBYTES] = msg[i];
        crypto_secretbox(c, m, m.length, nonce, key);
        return c.subarray(crypto_secretbox_BOXZEROBYTES);
    };
    nacl.secretbox.open = function(box, nonce, key) {
        checkArrayTypes(box, nonce, key);
        checkLengths(key, nonce);
        var c = new Uint8Array(crypto_secretbox_BOXZEROBYTES + box.length);
        var m = new Uint8Array(c.length);
        for(var i = 0; i < box.length; i++)c[i + crypto_secretbox_BOXZEROBYTES] = box[i];
        if (c.length < 32) return null;
        if (crypto_secretbox_open(m, c, c.length, nonce, key) !== 0) return null;
        return m.subarray(crypto_secretbox_ZEROBYTES);
    };
    nacl.secretbox.keyLength = crypto_secretbox_KEYBYTES;
    nacl.secretbox.nonceLength = crypto_secretbox_NONCEBYTES;
    nacl.secretbox.overheadLength = crypto_secretbox_BOXZEROBYTES;
    nacl.scalarMult = function(n, p) {
        checkArrayTypes(n, p);
        if (n.length !== crypto_scalarmult_SCALARBYTES) throw new Error('bad n size');
        if (p.length !== crypto_scalarmult_BYTES) throw new Error('bad p size');
        var q = new Uint8Array(crypto_scalarmult_BYTES);
        crypto_scalarmult(q, n, p);
        return q;
    };
    nacl.scalarMult.base = function(n) {
        checkArrayTypes(n);
        if (n.length !== crypto_scalarmult_SCALARBYTES) throw new Error('bad n size');
        var q = new Uint8Array(crypto_scalarmult_BYTES);
        crypto_scalarmult_base(q, n);
        return q;
    };
    nacl.scalarMult.scalarLength = crypto_scalarmult_SCALARBYTES;
    nacl.scalarMult.groupElementLength = crypto_scalarmult_BYTES;
    nacl.box = function(msg, nonce, publicKey, secretKey) {
        var k = nacl.box.before(publicKey, secretKey);
        return nacl.secretbox(msg, nonce, k);
    };
    nacl.box.before = function(publicKey, secretKey) {
        checkArrayTypes(publicKey, secretKey);
        checkBoxLengths(publicKey, secretKey);
        var k = new Uint8Array(crypto_box_BEFORENMBYTES);
        crypto_box_beforenm(k, publicKey, secretKey);
        return k;
    };
    nacl.box.after = nacl.secretbox;
    nacl.box.open = function(msg, nonce, publicKey, secretKey) {
        var k = nacl.box.before(publicKey, secretKey);
        return nacl.secretbox.open(msg, nonce, k);
    };
    nacl.box.open.after = nacl.secretbox.open;
    nacl.box.keyPair = function() {
        var pk = new Uint8Array(crypto_box_PUBLICKEYBYTES);
        var sk = new Uint8Array(crypto_box_SECRETKEYBYTES);
        crypto_box_keypair(pk, sk);
        return {
            publicKey: pk,
            secretKey: sk
        };
    };
    nacl.box.keyPair.fromSecretKey = function(secretKey) {
        checkArrayTypes(secretKey);
        if (secretKey.length !== crypto_box_SECRETKEYBYTES) throw new Error('bad secret key size');
        var pk = new Uint8Array(crypto_box_PUBLICKEYBYTES);
        crypto_scalarmult_base(pk, secretKey);
        return {
            publicKey: pk,
            secretKey: new Uint8Array(secretKey)
        };
    };
    nacl.box.publicKeyLength = crypto_box_PUBLICKEYBYTES;
    nacl.box.secretKeyLength = crypto_box_SECRETKEYBYTES;
    nacl.box.sharedKeyLength = crypto_box_BEFORENMBYTES;
    nacl.box.nonceLength = crypto_box_NONCEBYTES;
    nacl.box.overheadLength = nacl.secretbox.overheadLength;
    nacl.sign = function(msg, secretKey) {
        checkArrayTypes(msg, secretKey);
        if (secretKey.length !== crypto_sign_SECRETKEYBYTES) throw new Error('bad secret key size');
        var signedMsg = new Uint8Array(crypto_sign_BYTES + msg.length);
        crypto_sign(signedMsg, msg, msg.length, secretKey);
        return signedMsg;
    };
    nacl.sign.open = function(signedMsg, publicKey) {
        checkArrayTypes(signedMsg, publicKey);
        if (publicKey.length !== crypto_sign_PUBLICKEYBYTES) throw new Error('bad public key size');
        var tmp = new Uint8Array(signedMsg.length);
        var mlen = crypto_sign_open(tmp, signedMsg, signedMsg.length, publicKey);
        if (mlen < 0) return null;
        var m = new Uint8Array(mlen);
        for(var i = 0; i < m.length; i++)m[i] = tmp[i];
        return m;
    };
    nacl.sign.detached = function(msg, secretKey) {
        var signedMsg = nacl.sign(msg, secretKey);
        var sig = new Uint8Array(crypto_sign_BYTES);
        for(var i = 0; i < sig.length; i++)sig[i] = signedMsg[i];
        return sig;
    };
    nacl.sign.detached.verify = function(msg, sig, publicKey) {
        checkArrayTypes(msg, sig, publicKey);
        if (sig.length !== crypto_sign_BYTES) throw new Error('bad signature size');
        if (publicKey.length !== crypto_sign_PUBLICKEYBYTES) throw new Error('bad public key size');
        var sm = new Uint8Array(crypto_sign_BYTES + msg.length);
        var m = new Uint8Array(crypto_sign_BYTES + msg.length);
        var i;
        for(i = 0; i < crypto_sign_BYTES; i++)sm[i] = sig[i];
        for(i = 0; i < msg.length; i++)sm[i + crypto_sign_BYTES] = msg[i];
        return crypto_sign_open(m, sm, sm.length, publicKey) >= 0;
    };
    nacl.sign.keyPair = function() {
        var pk = new Uint8Array(crypto_sign_PUBLICKEYBYTES);
        var sk = new Uint8Array(crypto_sign_SECRETKEYBYTES);
        crypto_sign_keypair(pk, sk);
        return {
            publicKey: pk,
            secretKey: sk
        };
    };
    nacl.sign.keyPair.fromSecretKey = function(secretKey) {
        checkArrayTypes(secretKey);
        if (secretKey.length !== crypto_sign_SECRETKEYBYTES) throw new Error('bad secret key size');
        var pk = new Uint8Array(crypto_sign_PUBLICKEYBYTES);
        for(var i = 0; i < pk.length; i++)pk[i] = secretKey[32 + i];
        return {
            publicKey: pk,
            secretKey: new Uint8Array(secretKey)
        };
    };
    nacl.sign.keyPair.fromSeed = function(seed) {
        checkArrayTypes(seed);
        if (seed.length !== crypto_sign_SEEDBYTES) throw new Error('bad seed size');
        var pk = new Uint8Array(crypto_sign_PUBLICKEYBYTES);
        var sk = new Uint8Array(crypto_sign_SECRETKEYBYTES);
        for(var i = 0; i < 32; i++)sk[i] = seed[i];
        crypto_sign_keypair(pk, sk, true);
        return {
            publicKey: pk,
            secretKey: sk
        };
    };
    nacl.sign.publicKeyLength = crypto_sign_PUBLICKEYBYTES;
    nacl.sign.secretKeyLength = crypto_sign_SECRETKEYBYTES;
    nacl.sign.seedLength = crypto_sign_SEEDBYTES;
    nacl.sign.signatureLength = crypto_sign_BYTES;
    nacl.hash = function(msg) {
        checkArrayTypes(msg);
        var h = new Uint8Array(crypto_hash_BYTES);
        crypto_hash(h, msg, msg.length);
        return h;
    };
    nacl.hash.hashLength = crypto_hash_BYTES;
    nacl.verify = function(x, y) {
        checkArrayTypes(x, y);
        // Zero length arguments are considered not equal.
        if (x.length === 0 || y.length === 0) return false;
        if (x.length !== y.length) return false;
        return vn(x, 0, y, 0, x.length) === 0 ? true : false;
    };
    nacl.setPRNG = function(fn) {
        randombytes = fn;
    };
    (function() {
        // Initialize PRNG if environment provides CSPRNG.
        // If not, methods calling randombytes will throw.
        var crypto = typeof self !== 'undefined' ? self.crypto || self.msCrypto : null;
        if (crypto && crypto.getRandomValues) {
            // Browsers.
            var QUOTA = 65536;
            nacl.setPRNG(function(x, n) {
                var i, v = new Uint8Array(n);
                for(i = 0; i < n; i += QUOTA){
                    crypto.getRandomValues(v.subarray(i, i + Math.min(n - i, QUOTA)));
                }
                for(i = 0; i < n; i++)x[i] = v[i];
                cleanup(v);
            });
        } else if ("TURBOPACK compile-time truthy", 1) {
            // Node.js.
            crypto = {};
            if (crypto && crypto.randomBytes) {
                nacl.setPRNG(function(x, n) {
                    var i, v = crypto.randomBytes(n);
                    for(i = 0; i < n; i++)x[i] = v[i];
                    cleanup(v);
                });
            }
        }
    })();
})(("TURBOPACK compile-time value", "object") !== 'undefined' && module.exports ? module.exports : self.nacl = self.nacl || {});
}),
"[project]/dawg-ai/node_modules/nkeys.js/lib/helper.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.getEd25519Helper = exports.setEd25519Helper = void 0;
/**
 * @ignore
 */ let helper;
/**
 * @ignore
 */ function setEd25519Helper(lib) {
    helper = lib;
}
exports.setEd25519Helper = setEd25519Helper;
/**
 * @ignore
 */ function getEd25519Helper() {
    return helper;
}
exports.getEd25519Helper = getEd25519Helper;
}),
"[project]/dawg-ai/node_modules/nkeys.js/lib/crc16.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

/*
 * Copyright 2018-2020 The NATS Authors
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */ Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.crc16 = void 0;
// An implementation of crc16 according to CCITT standards for XMODEM.
/**
 * @ignore
 */ const crc16tab = new Uint16Array([
    0x0000,
    0x1021,
    0x2042,
    0x3063,
    0x4084,
    0x50a5,
    0x60c6,
    0x70e7,
    0x8108,
    0x9129,
    0xa14a,
    0xb16b,
    0xc18c,
    0xd1ad,
    0xe1ce,
    0xf1ef,
    0x1231,
    0x0210,
    0x3273,
    0x2252,
    0x52b5,
    0x4294,
    0x72f7,
    0x62d6,
    0x9339,
    0x8318,
    0xb37b,
    0xa35a,
    0xd3bd,
    0xc39c,
    0xf3ff,
    0xe3de,
    0x2462,
    0x3443,
    0x0420,
    0x1401,
    0x64e6,
    0x74c7,
    0x44a4,
    0x5485,
    0xa56a,
    0xb54b,
    0x8528,
    0x9509,
    0xe5ee,
    0xf5cf,
    0xc5ac,
    0xd58d,
    0x3653,
    0x2672,
    0x1611,
    0x0630,
    0x76d7,
    0x66f6,
    0x5695,
    0x46b4,
    0xb75b,
    0xa77a,
    0x9719,
    0x8738,
    0xf7df,
    0xe7fe,
    0xd79d,
    0xc7bc,
    0x48c4,
    0x58e5,
    0x6886,
    0x78a7,
    0x0840,
    0x1861,
    0x2802,
    0x3823,
    0xc9cc,
    0xd9ed,
    0xe98e,
    0xf9af,
    0x8948,
    0x9969,
    0xa90a,
    0xb92b,
    0x5af5,
    0x4ad4,
    0x7ab7,
    0x6a96,
    0x1a71,
    0x0a50,
    0x3a33,
    0x2a12,
    0xdbfd,
    0xcbdc,
    0xfbbf,
    0xeb9e,
    0x9b79,
    0x8b58,
    0xbb3b,
    0xab1a,
    0x6ca6,
    0x7c87,
    0x4ce4,
    0x5cc5,
    0x2c22,
    0x3c03,
    0x0c60,
    0x1c41,
    0xedae,
    0xfd8f,
    0xcdec,
    0xddcd,
    0xad2a,
    0xbd0b,
    0x8d68,
    0x9d49,
    0x7e97,
    0x6eb6,
    0x5ed5,
    0x4ef4,
    0x3e13,
    0x2e32,
    0x1e51,
    0x0e70,
    0xff9f,
    0xefbe,
    0xdfdd,
    0xcffc,
    0xbf1b,
    0xaf3a,
    0x9f59,
    0x8f78,
    0x9188,
    0x81a9,
    0xb1ca,
    0xa1eb,
    0xd10c,
    0xc12d,
    0xf14e,
    0xe16f,
    0x1080,
    0x00a1,
    0x30c2,
    0x20e3,
    0x5004,
    0x4025,
    0x7046,
    0x6067,
    0x83b9,
    0x9398,
    0xa3fb,
    0xb3da,
    0xc33d,
    0xd31c,
    0xe37f,
    0xf35e,
    0x02b1,
    0x1290,
    0x22f3,
    0x32d2,
    0x4235,
    0x5214,
    0x6277,
    0x7256,
    0xb5ea,
    0xa5cb,
    0x95a8,
    0x8589,
    0xf56e,
    0xe54f,
    0xd52c,
    0xc50d,
    0x34e2,
    0x24c3,
    0x14a0,
    0x0481,
    0x7466,
    0x6447,
    0x5424,
    0x4405,
    0xa7db,
    0xb7fa,
    0x8799,
    0x97b8,
    0xe75f,
    0xf77e,
    0xc71d,
    0xd73c,
    0x26d3,
    0x36f2,
    0x0691,
    0x16b0,
    0x6657,
    0x7676,
    0x4615,
    0x5634,
    0xd94c,
    0xc96d,
    0xf90e,
    0xe92f,
    0x99c8,
    0x89e9,
    0xb98a,
    0xa9ab,
    0x5844,
    0x4865,
    0x7806,
    0x6827,
    0x18c0,
    0x08e1,
    0x3882,
    0x28a3,
    0xcb7d,
    0xdb5c,
    0xeb3f,
    0xfb1e,
    0x8bf9,
    0x9bd8,
    0xabbb,
    0xbb9a,
    0x4a75,
    0x5a54,
    0x6a37,
    0x7a16,
    0x0af1,
    0x1ad0,
    0x2ab3,
    0x3a92,
    0xfd2e,
    0xed0f,
    0xdd6c,
    0xcd4d,
    0xbdaa,
    0xad8b,
    0x9de8,
    0x8dc9,
    0x7c26,
    0x6c07,
    0x5c64,
    0x4c45,
    0x3ca2,
    0x2c83,
    0x1ce0,
    0x0cc1,
    0xef1f,
    0xff3e,
    0xcf5d,
    0xdf7c,
    0xaf9b,
    0xbfba,
    0x8fd9,
    0x9ff8,
    0x6e17,
    0x7e36,
    0x4e55,
    0x5e74,
    0x2e93,
    0x3eb2,
    0x0ed1,
    0x1ef0
]);
/**
 * @ignore
 */ class crc16 {
    // crc16 returns the crc for the data provided.
    static checksum(data) {
        let crc = 0;
        for(let i = 0; i < data.byteLength; i++){
            let b = data[i];
            crc = crc << 8 & 0xffff ^ crc16tab[(crc >> 8 ^ b) & 0x00FF];
        }
        return crc;
    }
    // validate will check the calculated crc16 checksum for data against the expected.
    static validate(data, expected) {
        let ba = crc16.checksum(data);
        return ba == expected;
    }
}
exports.crc16 = crc16;
}),
"[project]/dawg-ai/node_modules/nkeys.js/lib/base32.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

/*
 * Copyright 2018-2021 The NATS Authors
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */ Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.base32 = void 0;
// Fork of https://github.com/LinusU/base32-encode
// and https://github.com/LinusU/base32-decode to support returning
// buffers without padding.
/**
 * @ignore
 */ const b32Alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
/**
 * @ignore
 */ class base32 {
    static encode(src) {
        let bits = 0;
        let value = 0;
        let a = new Uint8Array(src);
        let buf = new Uint8Array(src.byteLength * 2);
        let j = 0;
        for(let i = 0; i < a.byteLength; i++){
            value = value << 8 | a[i];
            bits += 8;
            while(bits >= 5){
                let index = value >>> bits - 5 & 31;
                buf[j++] = b32Alphabet.charAt(index).charCodeAt(0);
                bits -= 5;
            }
        }
        if (bits > 0) {
            let index = value << 5 - bits & 31;
            buf[j++] = b32Alphabet.charAt(index).charCodeAt(0);
        }
        return buf.slice(0, j);
    }
    static decode(src) {
        let bits = 0;
        let byte = 0;
        let j = 0;
        let a = new Uint8Array(src);
        let out = new Uint8Array(a.byteLength * 5 / 8 | 0);
        for(let i = 0; i < a.byteLength; i++){
            let v = String.fromCharCode(a[i]);
            let vv = b32Alphabet.indexOf(v);
            if (vv === -1) {
                throw new Error("Illegal Base32 character: " + a[i]);
            }
            byte = byte << 5 | vv;
            bits += 5;
            if (bits >= 8) {
                out[j++] = byte >>> bits - 8 & 255;
                bits -= 8;
            }
        }
        return out.slice(0, j);
    }
}
exports.base32 = base32;
}),
"[project]/dawg-ai/node_modules/nkeys.js/lib/codec.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

/*
 * Copyright 2018-2020 The NATS Authors
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */ Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Codec = void 0;
const crc16_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nkeys.js/lib/crc16.js [app-client] (ecmascript)");
const nkeys_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nkeys.js/lib/nkeys.js [app-client] (ecmascript)");
const base32_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nkeys.js/lib/base32.js [app-client] (ecmascript)");
/**
 * @ignore
 */ class Codec {
    static encode(prefix, src) {
        if (!src || !(src instanceof Uint8Array)) {
            throw new nkeys_1.NKeysError(nkeys_1.NKeysErrorCode.SerializationError);
        }
        if (!nkeys_1.Prefixes.isValidPrefix(prefix)) {
            throw new nkeys_1.NKeysError(nkeys_1.NKeysErrorCode.InvalidPrefixByte);
        }
        return Codec._encode(false, prefix, src);
    }
    static encodeSeed(role, src) {
        if (!src) {
            throw new nkeys_1.NKeysError(nkeys_1.NKeysErrorCode.ApiError);
        }
        if (!nkeys_1.Prefixes.isValidPublicPrefix(role)) {
            throw new nkeys_1.NKeysError(nkeys_1.NKeysErrorCode.InvalidPrefixByte);
        }
        if (src.byteLength !== 32) {
            throw new nkeys_1.NKeysError(nkeys_1.NKeysErrorCode.InvalidSeedLen);
        }
        return Codec._encode(true, role, src);
    }
    static decode(expected, src) {
        if (!nkeys_1.Prefixes.isValidPrefix(expected)) {
            throw new nkeys_1.NKeysError(nkeys_1.NKeysErrorCode.InvalidPrefixByte);
        }
        const raw = Codec._decode(src);
        if (raw[0] !== expected) {
            throw new nkeys_1.NKeysError(nkeys_1.NKeysErrorCode.InvalidPrefixByte);
        }
        return raw.slice(1);
    }
    static decodeSeed(src) {
        const raw = Codec._decode(src);
        const prefix = Codec._decodePrefix(raw);
        if (prefix[0] != nkeys_1.Prefix.Seed) {
            throw new nkeys_1.NKeysError(nkeys_1.NKeysErrorCode.InvalidSeed);
        }
        if (!nkeys_1.Prefixes.isValidPublicPrefix(prefix[1])) {
            throw new nkeys_1.NKeysError(nkeys_1.NKeysErrorCode.InvalidPrefixByte);
        }
        return {
            buf: raw.slice(2),
            prefix: prefix[1]
        };
    }
    // unsafe encode no prefix/role validation
    static _encode(seed, role, payload) {
        // offsets for this token
        const payloadOffset = seed ? 2 : 1;
        const payloadLen = payload.byteLength;
        const checkLen = 2;
        const cap = payloadOffset + payloadLen + checkLen;
        const checkOffset = payloadOffset + payloadLen;
        const raw = new Uint8Array(cap);
        // make the prefixes human readable when encoded
        if (seed) {
            const encodedPrefix = Codec._encodePrefix(nkeys_1.Prefix.Seed, role);
            raw.set(encodedPrefix);
        } else {
            raw[0] = role;
        }
        raw.set(payload, payloadOffset);
        //calculate the checksum write it LE
        const checksum = crc16_1.crc16.checksum(raw.slice(0, checkOffset));
        const dv = new DataView(raw.buffer);
        dv.setUint16(checkOffset, checksum, true);
        return base32_1.base32.encode(raw);
    }
    // unsafe decode - no prefix/role validation
    static _decode(src) {
        if (src.byteLength < 4) {
            throw new nkeys_1.NKeysError(nkeys_1.NKeysErrorCode.InvalidEncoding);
        }
        let raw;
        try {
            raw = base32_1.base32.decode(src);
        } catch (ex) {
            throw new nkeys_1.NKeysError(nkeys_1.NKeysErrorCode.InvalidEncoding, ex);
        }
        const checkOffset = raw.byteLength - 2;
        const dv = new DataView(raw.buffer);
        const checksum = dv.getUint16(checkOffset, true);
        const payload = raw.slice(0, checkOffset);
        if (!crc16_1.crc16.validate(payload, checksum)) {
            throw new nkeys_1.NKeysError(nkeys_1.NKeysErrorCode.InvalidChecksum);
        }
        return payload;
    }
    static _encodePrefix(kind, role) {
        // In order to make this human printable for both bytes, we need to do a little
        // bit manipulation to setup for base32 encoding which takes 5 bits at a time.
        const b1 = kind | role >> 5;
        const b2 = (role & 31) << 3; // 31 = 00011111
        return new Uint8Array([
            b1,
            b2
        ]);
    }
    static _decodePrefix(raw) {
        // Need to do the reverse from the printable representation to
        // get back to internal representation.
        const b1 = raw[0] & 248; // 248 = 11111000
        const b2 = (raw[0] & 7) << 5 | (raw[1] & 248) >> 3; // 7 = 00000111
        return new Uint8Array([
            b1,
            b2
        ]);
    }
}
exports.Codec = Codec;
}),
"[project]/dawg-ai/node_modules/nkeys.js/lib/kp.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

/*
 * Copyright 2018-2024 The NATS Authors
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */ Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.KP = void 0;
const codec_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nkeys.js/lib/codec.js [app-client] (ecmascript)");
const nkeys_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nkeys.js/lib/nkeys.js [app-client] (ecmascript)");
const helper_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nkeys.js/lib/helper.js [app-client] (ecmascript)");
/**
 * @ignore
 */ class KP {
    getRawSeed() {
        if (!this.seed) {
            throw new nkeys_1.NKeysError(nkeys_1.NKeysErrorCode.ClearedPair);
        }
        let sd = codec_1.Codec.decodeSeed(this.seed);
        return sd.buf;
    }
    getSeed() {
        if (!this.seed) {
            throw new nkeys_1.NKeysError(nkeys_1.NKeysErrorCode.ClearedPair);
        }
        return this.seed;
    }
    getPublicKey() {
        if (!this.seed) {
            throw new nkeys_1.NKeysError(nkeys_1.NKeysErrorCode.ClearedPair);
        }
        const sd = codec_1.Codec.decodeSeed(this.seed);
        const kp = (0, helper_1.getEd25519Helper)().fromSeed(this.getRawSeed());
        const buf = codec_1.Codec.encode(sd.prefix, kp.publicKey);
        return new TextDecoder().decode(buf);
    }
    getPrivateKey() {
        if (!this.seed) {
            throw new nkeys_1.NKeysError(nkeys_1.NKeysErrorCode.ClearedPair);
        }
        const kp = (0, helper_1.getEd25519Helper)().fromSeed(this.getRawSeed());
        return codec_1.Codec.encode(nkeys_1.Prefix.Private, kp.secretKey);
    }
    sign(input) {
        if (!this.seed) {
            throw new nkeys_1.NKeysError(nkeys_1.NKeysErrorCode.ClearedPair);
        }
        const kp = (0, helper_1.getEd25519Helper)().fromSeed(this.getRawSeed());
        return (0, helper_1.getEd25519Helper)().sign(input, kp.secretKey);
    }
    verify(input, sig) {
        if (!this.seed) {
            throw new nkeys_1.NKeysError(nkeys_1.NKeysErrorCode.ClearedPair);
        }
        const kp = (0, helper_1.getEd25519Helper)().fromSeed(this.getRawSeed());
        return (0, helper_1.getEd25519Helper)().verify(input, sig, kp.publicKey);
    }
    clear() {
        if (!this.seed) {
            return;
        }
        this.seed.fill(0);
        this.seed = undefined;
    }
    seal(input, recipient, nonce) {
        throw new nkeys_1.NKeysError(nkeys_1.NKeysErrorCode.InvalidNKeyOperation);
    }
    open(message, sender) {
        throw new nkeys_1.NKeysError(nkeys_1.NKeysErrorCode.InvalidNKeyOperation);
    }
    constructor(seed){
        this.seed = seed;
    }
}
exports.KP = KP;
}),
"[project]/dawg-ai/node_modules/nkeys.js/lib/public.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

/*
 * Copyright 2018-2024 The NATS Authors
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */ Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.PublicKey = void 0;
const codec_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nkeys.js/lib/codec.js [app-client] (ecmascript)");
const nkeys_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nkeys.js/lib/nkeys.js [app-client] (ecmascript)");
const helper_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nkeys.js/lib/helper.js [app-client] (ecmascript)");
/**
 * @ignore
 */ class PublicKey {
    getPublicKey() {
        if (!this.publicKey) {
            throw new nkeys_1.NKeysError(nkeys_1.NKeysErrorCode.ClearedPair);
        }
        return new TextDecoder().decode(this.publicKey);
    }
    getPrivateKey() {
        if (!this.publicKey) {
            throw new nkeys_1.NKeysError(nkeys_1.NKeysErrorCode.ClearedPair);
        }
        throw new nkeys_1.NKeysError(nkeys_1.NKeysErrorCode.PublicKeyOnly);
    }
    getSeed() {
        if (!this.publicKey) {
            throw new nkeys_1.NKeysError(nkeys_1.NKeysErrorCode.ClearedPair);
        }
        throw new nkeys_1.NKeysError(nkeys_1.NKeysErrorCode.PublicKeyOnly);
    }
    sign(_) {
        if (!this.publicKey) {
            throw new nkeys_1.NKeysError(nkeys_1.NKeysErrorCode.ClearedPair);
        }
        throw new nkeys_1.NKeysError(nkeys_1.NKeysErrorCode.CannotSign);
    }
    verify(input, sig) {
        if (!this.publicKey) {
            throw new nkeys_1.NKeysError(nkeys_1.NKeysErrorCode.ClearedPair);
        }
        let buf = codec_1.Codec._decode(this.publicKey);
        return (0, helper_1.getEd25519Helper)().verify(input, sig, buf.slice(1));
    }
    clear() {
        if (!this.publicKey) {
            return;
        }
        this.publicKey.fill(0);
        this.publicKey = undefined;
    }
    seal(input, recipient, nonce) {
        throw new nkeys_1.NKeysError(nkeys_1.NKeysErrorCode.InvalidNKeyOperation);
    }
    open(message, sender) {
        throw new nkeys_1.NKeysError(nkeys_1.NKeysErrorCode.InvalidNKeyOperation);
    }
    constructor(publicKey){
        this.publicKey = publicKey;
    }
}
exports.PublicKey = PublicKey;
}),
"[project]/dawg-ai/node_modules/nkeys.js/lib/curve.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

/*
 * Copyright 2024 The NATS Authors
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */ Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.CurveKP = exports.curveNonceLen = exports.curveKeyLen = void 0;
const nkeys_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nkeys.js/lib/nkeys.js [app-client] (ecmascript)");
const helper_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nkeys.js/lib/helper.js [app-client] (ecmascript)");
const codec_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nkeys.js/lib/codec.js [app-client] (ecmascript)");
const mod_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nkeys.js/lib/mod.js [app-client] (ecmascript)");
const base32_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nkeys.js/lib/base32.js [app-client] (ecmascript)");
const crc16_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nkeys.js/lib/crc16.js [app-client] (ecmascript)");
exports.curveKeyLen = 32;
const curveDecodeLen = 35;
exports.curveNonceLen = 24;
// "xkv1" in bytes
const XKeyVersionV1 = [
    120,
    107,
    118,
    49
];
class CurveKP {
    clear() {
        if (!this.seed) {
            return;
        }
        this.seed.fill(0);
        this.seed = undefined;
    }
    getPrivateKey() {
        if (!this.seed) {
            throw new nkeys_1.NKeysError(nkeys_1.NKeysErrorCode.ClearedPair);
        }
        return codec_1.Codec.encode(mod_1.Prefix.Private, this.seed);
    }
    getPublicKey() {
        if (!this.seed) {
            throw new nkeys_1.NKeysError(nkeys_1.NKeysErrorCode.ClearedPair);
        }
        const pub = (0, helper_1.getEd25519Helper)().scalarBaseMultiply(this.seed);
        const buf = codec_1.Codec.encode(mod_1.Prefix.Curve, pub);
        return new TextDecoder().decode(buf);
    }
    getSeed() {
        if (!this.seed) {
            throw new nkeys_1.NKeysError(nkeys_1.NKeysErrorCode.ClearedPair);
        }
        return codec_1.Codec.encodeSeed(mod_1.Prefix.Curve, this.seed);
    }
    sign() {
        throw new nkeys_1.NKeysError(nkeys_1.NKeysErrorCode.InvalidCurveOperation);
    }
    verify() {
        throw new nkeys_1.NKeysError(nkeys_1.NKeysErrorCode.InvalidCurveOperation);
    }
    decodePubCurveKey(src) {
        try {
            const raw = base32_1.base32.decode(new TextEncoder().encode(src));
            if (raw.byteLength !== curveDecodeLen) {
                throw new nkeys_1.NKeysError(nkeys_1.NKeysErrorCode.InvalidCurveKey);
            }
            if (raw[0] !== mod_1.Prefix.Curve) {
                throw new nkeys_1.NKeysError(nkeys_1.NKeysErrorCode.InvalidPublicKey);
            }
            const checkOffset = raw.byteLength - 2;
            const dv = new DataView(raw.buffer);
            const checksum = dv.getUint16(checkOffset, true);
            const payload = raw.slice(0, checkOffset);
            if (!crc16_1.crc16.validate(payload, checksum)) {
                throw new nkeys_1.NKeysError(nkeys_1.NKeysErrorCode.InvalidChecksum);
            }
            // remove the prefix byte
            return payload.slice(1);
        } catch (ex) {
            throw new nkeys_1.NKeysError(nkeys_1.NKeysErrorCode.InvalidRecipient, ex);
        }
    }
    seal(message, recipient, nonce) {
        if (!this.seed) {
            throw new nkeys_1.NKeysError(nkeys_1.NKeysErrorCode.ClearedPair);
        }
        if (!nonce) {
            nonce = (0, helper_1.getEd25519Helper)().randomBytes(exports.curveNonceLen);
        }
        let pub = this.decodePubCurveKey(recipient);
        // prefix a header to the nonce
        const out = new Uint8Array(XKeyVersionV1.length + exports.curveNonceLen);
        out.set(XKeyVersionV1, 0);
        out.set(nonce, XKeyVersionV1.length);
        // this is only the encoded payload
        const encrypted = (0, helper_1.getEd25519Helper)().seal(message, nonce, pub, this.seed);
        // the full message is the header+nonce+encrypted
        const fullMessage = new Uint8Array(out.length + encrypted.length);
        fullMessage.set(out);
        fullMessage.set(encrypted, out.length);
        return fullMessage;
    }
    open(message, sender) {
        if (!this.seed) {
            throw new nkeys_1.NKeysError(nkeys_1.NKeysErrorCode.ClearedPair);
        }
        if (message.length <= exports.curveNonceLen + XKeyVersionV1.length) {
            throw new nkeys_1.NKeysError(nkeys_1.NKeysErrorCode.InvalidEncrypted);
        }
        for(let i = 0; i < XKeyVersionV1.length; i++){
            if (message[i] !== XKeyVersionV1[i]) {
                throw new nkeys_1.NKeysError(nkeys_1.NKeysErrorCode.InvalidEncrypted);
            }
        }
        const pub = this.decodePubCurveKey(sender);
        // strip off the header
        message = message.slice(XKeyVersionV1.length);
        // extract the nonce
        const nonce = message.slice(0, exports.curveNonceLen);
        // stripe the nonce
        message = message.slice(exports.curveNonceLen);
        return (0, helper_1.getEd25519Helper)().open(message, nonce, pub, this.seed);
    }
    constructor(seed){
        this.seed = seed;
    }
}
exports.CurveKP = CurveKP;
}),
"[project]/dawg-ai/node_modules/nkeys.js/lib/nkeys.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.NKeysError = exports.NKeysErrorCode = exports.Prefixes = exports.Prefix = exports.fromSeed = exports.fromCurveSeed = exports.fromPublic = exports.createCurve = exports.createServer = exports.createCluster = exports.createUser = exports.createAccount = exports.createOperator = exports.createPair = void 0;
/*
 * Copyright 2018-2024 The NATS Authors
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */ const kp_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nkeys.js/lib/kp.js [app-client] (ecmascript)");
const public_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nkeys.js/lib/public.js [app-client] (ecmascript)");
const codec_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nkeys.js/lib/codec.js [app-client] (ecmascript)");
const helper_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nkeys.js/lib/helper.js [app-client] (ecmascript)");
const curve_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nkeys.js/lib/curve.js [app-client] (ecmascript)");
/**
 * @ignore
 */ function createPair(prefix) {
    const len = prefix === Prefix.Curve ? curve_1.curveKeyLen : 32;
    const rawSeed = (0, helper_1.getEd25519Helper)().randomBytes(len);
    let str = codec_1.Codec.encodeSeed(prefix, new Uint8Array(rawSeed));
    return prefix === Prefix.Curve ? new curve_1.CurveKP(new Uint8Array(rawSeed)) : new kp_1.KP(str);
}
exports.createPair = createPair;
/**
 * Creates a KeyPair with an operator prefix
 * @returns {KeyPair} Returns the created KeyPair.
 */ function createOperator() {
    return createPair(Prefix.Operator);
}
exports.createOperator = createOperator;
/**
 * Creates a KeyPair with an account prefix
 * @returns {KeyPair} Returns the created KeyPair.
 */ function createAccount() {
    return createPair(Prefix.Account);
}
exports.createAccount = createAccount;
/**
 * Creates a KeyPair with a user prefix
 * @returns {KeyPair} Returns the created KeyPair.
 */ function createUser() {
    return createPair(Prefix.User);
}
exports.createUser = createUser;
/**
 * @ignore
 */ function createCluster() {
    return createPair(Prefix.Cluster);
}
exports.createCluster = createCluster;
/**
 * @ignore
 */ function createServer() {
    return createPair(Prefix.Server);
}
exports.createServer = createServer;
/**
 * @ignore
 */ function createCurve() {
    return createPair(Prefix.Curve);
}
exports.createCurve = createCurve;
/**
 * Creates a KeyPair from a specified public key
 * @param {string} src of the public key in string format.
 * @returns {KeyPair} Returns the created KeyPair.
 * @see KeyPair#getPublicKey
 */ function fromPublic(src) {
    const ba = new TextEncoder().encode(src);
    const raw = codec_1.Codec._decode(ba);
    const prefix = Prefixes.parsePrefix(raw[0]);
    if (Prefixes.isValidPublicPrefix(prefix)) {
        return new public_1.PublicKey(ba);
    }
    throw new NKeysError(NKeysErrorCode.InvalidPublicKey);
}
exports.fromPublic = fromPublic;
function fromCurveSeed(src) {
    const sd = codec_1.Codec.decodeSeed(src);
    if (sd.prefix !== Prefix.Curve) {
        throw new NKeysError(NKeysErrorCode.InvalidCurveSeed);
    }
    if (sd.buf.byteLength !== curve_1.curveKeyLen) {
        throw new NKeysError(NKeysErrorCode.InvalidSeedLen);
    }
    return new curve_1.CurveKP(sd.buf);
}
exports.fromCurveSeed = fromCurveSeed;
/**
 * Creates a KeyPair from a specified seed.
 * @param {Uint8Array} src of the seed key as Uint8Array
 * @returns {KeyPair} Returns the created KeyPair.
 * @see KeyPair#getSeed
 */ function fromSeed(src) {
    const sd = codec_1.Codec.decodeSeed(src);
    // if we are here it decoded properly
    if (sd.prefix === Prefix.Curve) {
        return fromCurveSeed(src);
    }
    return new kp_1.KP(src);
}
exports.fromSeed = fromSeed;
/**
 * @ignore
 */ var Prefix;
(function(Prefix) {
    Prefix[Prefix["Unknown"] = -1] = "Unknown";
    //Seed is the version byte used for encoded NATS Seeds
    Prefix[Prefix["Seed"] = 144] = "Seed";
    //PrefixBytePrivate is the version byte used for encoded NATS Private keys
    Prefix[Prefix["Private"] = 120] = "Private";
    //PrefixByteOperator is the version byte used for encoded NATS Operators
    Prefix[Prefix["Operator"] = 112] = "Operator";
    //PrefixByteServer is the version byte used for encoded NATS Servers
    Prefix[Prefix["Server"] = 104] = "Server";
    //PrefixByteCluster is the version byte used for encoded NATS Clusters
    Prefix[Prefix["Cluster"] = 16] = "Cluster";
    //PrefixByteAccount is the version byte used for encoded NATS Accounts
    Prefix[Prefix["Account"] = 0] = "Account";
    //PrefixByteUser is the version byte used for encoded NATS Users
    Prefix[Prefix["User"] = 160] = "User";
    Prefix[Prefix["Curve"] = 184] = "Curve";
})(Prefix || (exports.Prefix = Prefix = {}));
/**
 * @private
 */ class Prefixes {
    static isValidPublicPrefix(prefix) {
        return prefix == Prefix.Server || prefix == Prefix.Operator || prefix == Prefix.Cluster || prefix == Prefix.Account || prefix == Prefix.User || prefix == Prefix.Curve;
    }
    static startsWithValidPrefix(s) {
        let c = s[0];
        return c == "S" || c == "P" || c == "O" || c == "N" || c == "C" || c == "A" || c == "U" || c == "X";
    }
    static isValidPrefix(prefix) {
        let v = this.parsePrefix(prefix);
        return v !== Prefix.Unknown;
    }
    static parsePrefix(v) {
        switch(v){
            case Prefix.Seed:
                return Prefix.Seed;
            case Prefix.Private:
                return Prefix.Private;
            case Prefix.Operator:
                return Prefix.Operator;
            case Prefix.Server:
                return Prefix.Server;
            case Prefix.Cluster:
                return Prefix.Cluster;
            case Prefix.Account:
                return Prefix.Account;
            case Prefix.User:
                return Prefix.User;
            case Prefix.Curve:
                return Prefix.Curve;
            default:
                return Prefix.Unknown;
        }
    }
}
exports.Prefixes = Prefixes;
/**
 * Possible error codes on exceptions thrown by the library.
 */ var NKeysErrorCode;
(function(NKeysErrorCode) {
    NKeysErrorCode["InvalidPrefixByte"] = "nkeys: invalid prefix byte";
    NKeysErrorCode["InvalidKey"] = "nkeys: invalid key";
    NKeysErrorCode["InvalidPublicKey"] = "nkeys: invalid public key";
    NKeysErrorCode["InvalidSeedLen"] = "nkeys: invalid seed length";
    NKeysErrorCode["InvalidSeed"] = "nkeys: invalid seed";
    NKeysErrorCode["InvalidCurveSeed"] = "nkeys: invalid curve seed";
    NKeysErrorCode["InvalidCurveKey"] = "nkeys: not a valid curve key";
    NKeysErrorCode["InvalidCurveOperation"] = "nkeys: curve key is not valid for sign/verify";
    NKeysErrorCode["InvalidNKeyOperation"] = "keys: only curve key can seal/open";
    NKeysErrorCode["InvalidEncoding"] = "nkeys: invalid encoded key";
    NKeysErrorCode["InvalidRecipient"] = "nkeys: not a valid recipient public curve key";
    NKeysErrorCode["InvalidEncrypted"] = "nkeys: encrypted input is not valid";
    NKeysErrorCode["CannotSign"] = "nkeys: cannot sign, no private key available";
    NKeysErrorCode["PublicKeyOnly"] = "nkeys: no seed or private key available";
    NKeysErrorCode["InvalidChecksum"] = "nkeys: invalid checksum";
    NKeysErrorCode["SerializationError"] = "nkeys: serialization error";
    NKeysErrorCode["ApiError"] = "nkeys: api error";
    NKeysErrorCode["ClearedPair"] = "nkeys: pair is cleared";
})(NKeysErrorCode || (exports.NKeysErrorCode = NKeysErrorCode = {}));
class NKeysError extends Error {
    /**
     * @param {NKeysErrorCode} code
     * @param {Error} [chainedError]
     * @constructor
     *
     * @api private
     */ constructor(code, chainedError){
        super(code);
        this.name = "NKeysError";
        this.code = code;
        this.chainedError = chainedError;
    }
}
exports.NKeysError = NKeysError;
}),
"[project]/dawg-ai/node_modules/nkeys.js/lib/util.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.dump = exports.decode = exports.encode = void 0;
/*
 * Copyright 2018-2020 The NATS Authors
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */ /**
 * Encode binary data to a base64 string
 * @param {Uint8Array} bytes to encode to base64
 */ function encode(bytes) {
    return btoa(String.fromCharCode(...bytes));
}
exports.encode = encode;
/**
 * Decode a base64 encoded string to a binary Uint8Array
 * @param {string} b64str encoded string
 */ function decode(b64str) {
    const bin = atob(b64str);
    const bytes = new Uint8Array(bin.length);
    for(let i = 0; i < bin.length; i++){
        bytes[i] = bin.charCodeAt(i);
    }
    return bytes;
}
exports.decode = decode;
/**
 * @ignore
 */ function dump(buf, msg) {
    if (msg) {
        console.log(msg);
    }
    let a = [];
    for(let i = 0; i < buf.byteLength; i++){
        if (i % 8 === 0) {
            a.push("\n");
        }
        let v = buf[i].toString(16);
        if (v.length === 1) {
            v = "0" + v;
        }
        a.push(v);
    }
    console.log(a.join("  "));
}
exports.dump = dump;
}),
"[project]/dawg-ai/node_modules/nkeys.js/lib/mod.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.encode = exports.decode = exports.Prefix = exports.NKeysErrorCode = exports.NKeysError = exports.fromSeed = exports.fromPublic = exports.fromCurveSeed = exports.createUser = exports.createServer = exports.createPair = exports.createOperator = exports.createCurve = exports.createCluster = exports.createAccount = void 0;
var nkeys_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nkeys.js/lib/nkeys.js [app-client] (ecmascript)");
Object.defineProperty(exports, "createAccount", {
    enumerable: true,
    get: function() {
        return nkeys_1.createAccount;
    }
});
Object.defineProperty(exports, "createCluster", {
    enumerable: true,
    get: function() {
        return nkeys_1.createCluster;
    }
});
Object.defineProperty(exports, "createCurve", {
    enumerable: true,
    get: function() {
        return nkeys_1.createCurve;
    }
});
Object.defineProperty(exports, "createOperator", {
    enumerable: true,
    get: function() {
        return nkeys_1.createOperator;
    }
});
Object.defineProperty(exports, "createPair", {
    enumerable: true,
    get: function() {
        return nkeys_1.createPair;
    }
});
Object.defineProperty(exports, "createServer", {
    enumerable: true,
    get: function() {
        return nkeys_1.createServer;
    }
});
Object.defineProperty(exports, "createUser", {
    enumerable: true,
    get: function() {
        return nkeys_1.createUser;
    }
});
Object.defineProperty(exports, "fromCurveSeed", {
    enumerable: true,
    get: function() {
        return nkeys_1.fromCurveSeed;
    }
});
Object.defineProperty(exports, "fromPublic", {
    enumerable: true,
    get: function() {
        return nkeys_1.fromPublic;
    }
});
Object.defineProperty(exports, "fromSeed", {
    enumerable: true,
    get: function() {
        return nkeys_1.fromSeed;
    }
});
Object.defineProperty(exports, "NKeysError", {
    enumerable: true,
    get: function() {
        return nkeys_1.NKeysError;
    }
});
Object.defineProperty(exports, "NKeysErrorCode", {
    enumerable: true,
    get: function() {
        return nkeys_1.NKeysErrorCode;
    }
});
Object.defineProperty(exports, "Prefix", {
    enumerable: true,
    get: function() {
        return nkeys_1.Prefix;
    }
});
var util_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nkeys.js/lib/util.js [app-client] (ecmascript)");
Object.defineProperty(exports, "decode", {
    enumerable: true,
    get: function() {
        return util_1.decode;
    }
});
Object.defineProperty(exports, "encode", {
    enumerable: true,
    get: function() {
        return util_1.encode;
    }
});
}),
"[project]/dawg-ai/node_modules/nkeys.js/lib/index.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$buffer$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/dawg-ai/node_modules/next/dist/compiled/buffer/index.js [app-client] (ecmascript)");
"use strict";
var __createBinding = /*TURBOPACK member replacement*/ __turbopack_context__.e && /*TURBOPACK member replacement*/ __turbopack_context__.e.__createBinding || (Object.create ? function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = {
            enumerable: true,
            get: function() {
                return m[k];
            }
        };
    }
    Object.defineProperty(o, k2, desc);
} : function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
});
var __exportStar = /*TURBOPACK member replacement*/ __turbopack_context__.e && /*TURBOPACK member replacement*/ __turbopack_context__.e.__exportStar || function(m, exports1) {
    for(var p in m)if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports1, p)) __createBinding(exports1, m, p);
};
Object.defineProperty(exports, "__esModule", {
    value: true
});
/**
 * @ignore
 */ //@ts-ignore
const nacl = __turbopack_context__.r("[project]/dawg-ai/node_modules/tweetnacl/nacl-fast.js [app-client] (ecmascript)");
/**
 * @ignore
 */ //@ts-ignore
const helper = {
    randomBytes: nacl.randomBytes,
    verify: nacl.sign.detached.verify,
    fromSeed: nacl.sign.keyPair.fromSeed,
    sign: nacl.sign.detached,
    scalarBaseMultiply: nacl.scalarMult.base,
    seal: nacl.box,
    open: nacl.box.open
};
// This here to support node 10.
if (typeof TextEncoder === "undefined") {
    //@ts-ignore
    const util = __turbopack_context__.r("[project]/dawg-ai/node_modules/next/dist/compiled/util/util.js [app-client] (ecmascript)");
    //@ts-ignore
    /*TURBOPACK member replacement*/ __turbopack_context__.g.TextEncoder = util.TextEncoder;
    //@ts-ignore
    /*TURBOPACK member replacement*/ __turbopack_context__.g.TextDecoder = util.TextDecoder;
}
if (typeof atob === "undefined") {
    /*TURBOPACK member replacement*/ __turbopack_context__.g.atob = (a)=>{
        return __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$buffer$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Buffer"].from(a, "base64").toString("binary");
    };
    /*TURBOPACK member replacement*/ __turbopack_context__.g.btoa = (b)=>{
        return __TURBOPACK__imported__module__$5b$project$5d2f$dawg$2d$ai$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$buffer$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Buffer"].from(b, "binary").toString("base64");
    };
}
/**
 * @ignore
 */ //@ts-ignore
const { setEd25519Helper } = __turbopack_context__.r("[project]/dawg-ai/node_modules/nkeys.js/lib/helper.js [app-client] (ecmascript)");
setEd25519Helper(helper);
/**
 * @ignore
 */ //@ts-ignore
__exportStar(__turbopack_context__.r("[project]/dawg-ai/node_modules/nkeys.js/lib/mod.js [app-client] (ecmascript)"), exports);
}),
"[project]/dawg-ai/node_modules/yallist/iterator.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

module.exports = function(Yallist) {
    Yallist.prototype[Symbol.iterator] = function*() {
        for(let walker = this.head; walker; walker = walker.next){
            yield walker.value;
        }
    };
};
}),
"[project]/dawg-ai/node_modules/yallist/yallist.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

module.exports = Yallist;
Yallist.Node = Node;
Yallist.create = Yallist;
function Yallist(list) {
    var self = this;
    if (!(self instanceof Yallist)) {
        self = new Yallist();
    }
    self.tail = null;
    self.head = null;
    self.length = 0;
    if (list && typeof list.forEach === 'function') {
        list.forEach(function(item) {
            self.push(item);
        });
    } else if (arguments.length > 0) {
        for(var i = 0, l = arguments.length; i < l; i++){
            self.push(arguments[i]);
        }
    }
    return self;
}
Yallist.prototype.removeNode = function(node) {
    if (node.list !== this) {
        throw new Error('removing node which does not belong to this list');
    }
    var next = node.next;
    var prev = node.prev;
    if (next) {
        next.prev = prev;
    }
    if (prev) {
        prev.next = next;
    }
    if (node === this.head) {
        this.head = next;
    }
    if (node === this.tail) {
        this.tail = prev;
    }
    node.list.length--;
    node.next = null;
    node.prev = null;
    node.list = null;
    return next;
};
Yallist.prototype.unshiftNode = function(node) {
    if (node === this.head) {
        return;
    }
    if (node.list) {
        node.list.removeNode(node);
    }
    var head = this.head;
    node.list = this;
    node.next = head;
    if (head) {
        head.prev = node;
    }
    this.head = node;
    if (!this.tail) {
        this.tail = node;
    }
    this.length++;
};
Yallist.prototype.pushNode = function(node) {
    if (node === this.tail) {
        return;
    }
    if (node.list) {
        node.list.removeNode(node);
    }
    var tail = this.tail;
    node.list = this;
    node.prev = tail;
    if (tail) {
        tail.next = node;
    }
    this.tail = node;
    if (!this.head) {
        this.head = node;
    }
    this.length++;
};
Yallist.prototype.push = function() {
    for(var i = 0, l = arguments.length; i < l; i++){
        push(this, arguments[i]);
    }
    return this.length;
};
Yallist.prototype.unshift = function() {
    for(var i = 0, l = arguments.length; i < l; i++){
        unshift(this, arguments[i]);
    }
    return this.length;
};
Yallist.prototype.pop = function() {
    if (!this.tail) {
        return undefined;
    }
    var res = this.tail.value;
    this.tail = this.tail.prev;
    if (this.tail) {
        this.tail.next = null;
    } else {
        this.head = null;
    }
    this.length--;
    return res;
};
Yallist.prototype.shift = function() {
    if (!this.head) {
        return undefined;
    }
    var res = this.head.value;
    this.head = this.head.next;
    if (this.head) {
        this.head.prev = null;
    } else {
        this.tail = null;
    }
    this.length--;
    return res;
};
Yallist.prototype.forEach = function(fn, thisp) {
    thisp = thisp || this;
    for(var walker = this.head, i = 0; walker !== null; i++){
        fn.call(thisp, walker.value, i, this);
        walker = walker.next;
    }
};
Yallist.prototype.forEachReverse = function(fn, thisp) {
    thisp = thisp || this;
    for(var walker = this.tail, i = this.length - 1; walker !== null; i--){
        fn.call(thisp, walker.value, i, this);
        walker = walker.prev;
    }
};
Yallist.prototype.get = function(n) {
    for(var i = 0, walker = this.head; walker !== null && i < n; i++){
        // abort out of the list early if we hit a cycle
        walker = walker.next;
    }
    if (i === n && walker !== null) {
        return walker.value;
    }
};
Yallist.prototype.getReverse = function(n) {
    for(var i = 0, walker = this.tail; walker !== null && i < n; i++){
        // abort out of the list early if we hit a cycle
        walker = walker.prev;
    }
    if (i === n && walker !== null) {
        return walker.value;
    }
};
Yallist.prototype.map = function(fn, thisp) {
    thisp = thisp || this;
    var res = new Yallist();
    for(var walker = this.head; walker !== null;){
        res.push(fn.call(thisp, walker.value, this));
        walker = walker.next;
    }
    return res;
};
Yallist.prototype.mapReverse = function(fn, thisp) {
    thisp = thisp || this;
    var res = new Yallist();
    for(var walker = this.tail; walker !== null;){
        res.push(fn.call(thisp, walker.value, this));
        walker = walker.prev;
    }
    return res;
};
Yallist.prototype.reduce = function(fn, initial) {
    var acc;
    var walker = this.head;
    if (arguments.length > 1) {
        acc = initial;
    } else if (this.head) {
        walker = this.head.next;
        acc = this.head.value;
    } else {
        throw new TypeError('Reduce of empty list with no initial value');
    }
    for(var i = 0; walker !== null; i++){
        acc = fn(acc, walker.value, i);
        walker = walker.next;
    }
    return acc;
};
Yallist.prototype.reduceReverse = function(fn, initial) {
    var acc;
    var walker = this.tail;
    if (arguments.length > 1) {
        acc = initial;
    } else if (this.tail) {
        walker = this.tail.prev;
        acc = this.tail.value;
    } else {
        throw new TypeError('Reduce of empty list with no initial value');
    }
    for(var i = this.length - 1; walker !== null; i--){
        acc = fn(acc, walker.value, i);
        walker = walker.prev;
    }
    return acc;
};
Yallist.prototype.toArray = function() {
    var arr = new Array(this.length);
    for(var i = 0, walker = this.head; walker !== null; i++){
        arr[i] = walker.value;
        walker = walker.next;
    }
    return arr;
};
Yallist.prototype.toArrayReverse = function() {
    var arr = new Array(this.length);
    for(var i = 0, walker = this.tail; walker !== null; i++){
        arr[i] = walker.value;
        walker = walker.prev;
    }
    return arr;
};
Yallist.prototype.slice = function(from, to) {
    to = to || this.length;
    if (to < 0) {
        to += this.length;
    }
    from = from || 0;
    if (from < 0) {
        from += this.length;
    }
    var ret = new Yallist();
    if (to < from || to < 0) {
        return ret;
    }
    if (from < 0) {
        from = 0;
    }
    if (to > this.length) {
        to = this.length;
    }
    for(var i = 0, walker = this.head; walker !== null && i < from; i++){
        walker = walker.next;
    }
    for(; walker !== null && i < to; i++, walker = walker.next){
        ret.push(walker.value);
    }
    return ret;
};
Yallist.prototype.sliceReverse = function(from, to) {
    to = to || this.length;
    if (to < 0) {
        to += this.length;
    }
    from = from || 0;
    if (from < 0) {
        from += this.length;
    }
    var ret = new Yallist();
    if (to < from || to < 0) {
        return ret;
    }
    if (from < 0) {
        from = 0;
    }
    if (to > this.length) {
        to = this.length;
    }
    for(var i = this.length, walker = this.tail; walker !== null && i > to; i--){
        walker = walker.prev;
    }
    for(; walker !== null && i > from; i--, walker = walker.prev){
        ret.push(walker.value);
    }
    return ret;
};
Yallist.prototype.splice = function(start, deleteCount) {
    for(var _len = arguments.length, nodes = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++){
        nodes[_key - 2] = arguments[_key];
    }
    if (start > this.length) {
        start = this.length - 1;
    }
    if (start < 0) {
        start = this.length + start;
    }
    for(var i = 0, walker = this.head; walker !== null && i < start; i++){
        walker = walker.next;
    }
    var ret = [];
    for(var i = 0; walker && i < deleteCount; i++){
        ret.push(walker.value);
        walker = this.removeNode(walker);
    }
    if (walker === null) {
        walker = this.tail;
    }
    if (walker !== this.head && walker !== this.tail) {
        walker = walker.prev;
    }
    for(var i = 0; i < nodes.length; i++){
        walker = insert(this, walker, nodes[i]);
    }
    return ret;
};
Yallist.prototype.reverse = function() {
    var head = this.head;
    var tail = this.tail;
    for(var walker = head; walker !== null; walker = walker.prev){
        var p = walker.prev;
        walker.prev = walker.next;
        walker.next = p;
    }
    this.head = tail;
    this.tail = head;
    return this;
};
function insert(self, node, value) {
    var inserted = node === self.head ? new Node(value, null, node, self) : new Node(value, node, node.next, self);
    if (inserted.next === null) {
        self.tail = inserted;
    }
    if (inserted.prev === null) {
        self.head = inserted;
    }
    self.length++;
    return inserted;
}
function push(self, item) {
    self.tail = new Node(item, self.tail, null, self);
    if (!self.head) {
        self.head = self.tail;
    }
    self.length++;
}
function unshift(self, item) {
    self.head = new Node(item, null, self.head, self);
    if (!self.tail) {
        self.tail = self.head;
    }
    self.length++;
}
function Node(value, prev, next, list) {
    if (!(this instanceof Node)) {
        return new Node(value, prev, next, list);
    }
    this.list = list;
    this.value = value;
    if (prev) {
        prev.next = this;
        this.prev = prev;
    } else {
        this.prev = null;
    }
    if (next) {
        next.prev = this;
        this.next = next;
    } else {
        this.next = null;
    }
}
try {
    // add if support for Symbol.iterator is present
    __turbopack_context__.r("[project]/dawg-ai/node_modules/yallist/iterator.js [app-client] (ecmascript)")(Yallist);
} catch (er) {}
}),
"[project]/dawg-ai/node_modules/generic-pool/lib/factoryValidator.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {

module.exports = function(factory) {
    if (typeof factory.create !== "function") {
        throw new TypeError("factory.create must be a function");
    }
    if (typeof factory.destroy !== "function") {
        throw new TypeError("factory.destroy must be a function");
    }
    if (typeof factory.validate !== "undefined" && typeof factory.validate !== "function") {
        throw new TypeError("factory.validate must be a function");
    }
};
}),
"[project]/dawg-ai/node_modules/generic-pool/lib/PoolDefaults.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

/**
 * Create the default settings used by the pool
 *
 * @class
 */ class PoolDefaults {
    constructor(){
        this.fifo = true;
        this.priorityRange = 1;
        this.testOnBorrow = false;
        this.testOnReturn = false;
        this.autostart = true;
        this.evictionRunIntervalMillis = 0;
        this.numTestsPerEvictionRun = 3;
        this.softIdleTimeoutMillis = -1;
        this.idleTimeoutMillis = 30000;
        // FIXME: no defaults!
        this.acquireTimeoutMillis = null;
        this.destroyTimeoutMillis = null;
        this.maxWaitingClients = null;
        this.min = null;
        this.max = null;
        // FIXME: this seems odd?
        this.Promise = Promise;
    }
}
module.exports = PoolDefaults;
}),
"[project]/dawg-ai/node_modules/generic-pool/lib/PoolOptions.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

const PoolDefaults = __turbopack_context__.r("[project]/dawg-ai/node_modules/generic-pool/lib/PoolDefaults.js [app-client] (ecmascript)");
class PoolOptions {
    /**
   * @param {Object} opts
   *   configuration for the pool
   * @param {Number} [opts.max=null]
   *   Maximum number of items that can exist at the same time.  Default: 1.
   *   Any further acquire requests will be pushed to the waiting list.
   * @param {Number} [opts.min=null]
   *   Minimum number of items in pool (including in-use). Default: 0.
   *   When the pool is created, or a resource destroyed, this minimum will
   *   be checked. If the pool resource count is below the minimum, a new
   *   resource will be created and added to the pool.
   * @param {Number} [opts.maxWaitingClients=null]
   *   maximum number of queued requests allowed after which acquire calls will be rejected
   * @param {Boolean} [opts.testOnBorrow=false]
   *   should the pool validate resources before giving them to clients. Requires that
   *   `factory.validate` is specified.
   * @param {Boolean} [opts.testOnReturn=false]
   *   should the pool validate resources before returning them to the pool.
   * @param {Number} [opts.acquireTimeoutMillis=null]
   *   Delay in milliseconds after which the an `acquire` call will fail. optional.
   *   Default: undefined. Should be positive and non-zero
   * @param {Number} [opts.destroyTimeoutMillis=null]
   *   Delay in milliseconds after which the an `destroy` call will fail, causing it to emit a factoryDestroyError event. optional.
   *   Default: undefined. Should be positive and non-zero
   * @param {Number} [opts.priorityRange=1]
   *   The range from 1 to be treated as a valid priority
   * @param {Boolean} [opts.fifo=true]
   *   Sets whether the pool has LIFO (last in, first out) behaviour with respect to idle objects.
   *   if false then pool has FIFO behaviour
   * @param {Boolean} [opts.autostart=true]
   *   Should the pool start creating resources etc once the constructor is called
   * @param {Number} [opts.evictionRunIntervalMillis=0]
   *   How often to run eviction checks.  Default: 0 (does not run).
   * @param {Number} [opts.numTestsPerEvictionRun=3]
   *   Number of resources to check each eviction run.  Default: 3.
   * @param {Number} [opts.softIdleTimeoutMillis=-1]
   *   amount of time an object may sit idle in the pool before it is eligible
   *   for eviction by the idle object evictor (if any), with the extra condition
   *   that at least "min idle" object instances remain in the pool. Default -1 (nothing can get evicted)
   * @param {Number} [opts.idleTimeoutMillis=30000]
   *   the minimum amount of time that an object may sit idle in the pool before it is eligible for eviction
   *   due to idle time. Supercedes "softIdleTimeoutMillis" Default: 30000
   * @param {typeof Promise} [opts.Promise=Promise]
   *   What promise implementation should the pool use, defaults to native promises.
   */ constructor(opts){
        const poolDefaults = new PoolDefaults();
        opts = opts || {};
        this.fifo = typeof opts.fifo === "boolean" ? opts.fifo : poolDefaults.fifo;
        this.priorityRange = opts.priorityRange || poolDefaults.priorityRange;
        this.testOnBorrow = typeof opts.testOnBorrow === "boolean" ? opts.testOnBorrow : poolDefaults.testOnBorrow;
        this.testOnReturn = typeof opts.testOnReturn === "boolean" ? opts.testOnReturn : poolDefaults.testOnReturn;
        this.autostart = typeof opts.autostart === "boolean" ? opts.autostart : poolDefaults.autostart;
        if (opts.acquireTimeoutMillis) {
            // @ts-ignore
            this.acquireTimeoutMillis = parseInt(opts.acquireTimeoutMillis, 10);
        }
        if (opts.destroyTimeoutMillis) {
            // @ts-ignore
            this.destroyTimeoutMillis = parseInt(opts.destroyTimeoutMillis, 10);
        }
        if (opts.maxWaitingClients !== undefined) {
            // @ts-ignore
            this.maxWaitingClients = parseInt(opts.maxWaitingClients, 10);
        }
        // @ts-ignore
        this.max = parseInt(opts.max, 10);
        // @ts-ignore
        this.min = parseInt(opts.min, 10);
        this.max = Math.max(isNaN(this.max) ? 1 : this.max, 1);
        this.min = Math.min(isNaN(this.min) ? 0 : this.min, this.max);
        this.evictionRunIntervalMillis = opts.evictionRunIntervalMillis || poolDefaults.evictionRunIntervalMillis;
        this.numTestsPerEvictionRun = opts.numTestsPerEvictionRun || poolDefaults.numTestsPerEvictionRun;
        this.softIdleTimeoutMillis = opts.softIdleTimeoutMillis || poolDefaults.softIdleTimeoutMillis;
        this.idleTimeoutMillis = opts.idleTimeoutMillis || poolDefaults.idleTimeoutMillis;
        this.Promise = opts.Promise != null ? opts.Promise : poolDefaults.Promise;
    }
}
module.exports = PoolOptions;
}),
"[project]/dawg-ai/node_modules/generic-pool/lib/Deferred.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

/**
 * This is apparently a bit like a Jquery deferred, hence the name
 */ class Deferred {
    get state() {
        return this._state;
    }
    get promise() {
        return this._promise;
    }
    reject(reason) {
        if (this._state !== Deferred.PENDING) {
            return;
        }
        this._state = Deferred.REJECTED;
        this._reject(reason);
    }
    resolve(value) {
        if (this._state !== Deferred.PENDING) {
            return;
        }
        this._state = Deferred.FULFILLED;
        this._resolve(value);
    }
    constructor(Promise){
        this._state = Deferred.PENDING;
        this._resolve = undefined;
        this._reject = undefined;
        this._promise = new Promise((resolve, reject)=>{
            this._resolve = resolve;
            this._reject = reject;
        });
    }
}
// TODO: should these really live here? or be a seperate 'state' enum
Deferred.PENDING = "PENDING";
Deferred.FULFILLED = "FULFILLED";
Deferred.REJECTED = "REJECTED";
module.exports = Deferred;
}),
"[project]/dawg-ai/node_modules/generic-pool/lib/errors.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

class ExtendableError extends Error {
    constructor(message){
        super(message);
        // @ts-ignore
        this.name = this.constructor.name;
        this.message = message;
        if (typeof Error.captureStackTrace === "function") {
            Error.captureStackTrace(this, this.constructor);
        } else {
            this.stack = new Error(message).stack;
        }
    }
}
/* eslint-disable no-useless-constructor */ class TimeoutError extends ExtendableError {
    constructor(m){
        super(m);
    }
}
/* eslint-enable no-useless-constructor */ module.exports = {
    TimeoutError: TimeoutError
};
}),
"[project]/dawg-ai/node_modules/generic-pool/lib/ResourceRequest.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

const Deferred = __turbopack_context__.r("[project]/dawg-ai/node_modules/generic-pool/lib/Deferred.js [app-client] (ecmascript)");
const errors = __turbopack_context__.r("[project]/dawg-ai/node_modules/generic-pool/lib/errors.js [app-client] (ecmascript)");
function fbind(fn, ctx) {
    return function bound() {
        return fn.apply(ctx, arguments);
    };
}
/**
 * Wraps a users request for a resource
 * Basically a promise mashed in with a timeout
 * @private
 */ class ResourceRequest extends Deferred {
    setTimeout(delay) {
        if (this._state !== ResourceRequest.PENDING) {
            return;
        }
        const ttl = parseInt(delay, 10);
        if (isNaN(ttl) || ttl <= 0) {
            throw new Error("delay must be a positive int");
        }
        const age = Date.now() - this._creationTimestamp;
        if (this._timeout) {
            this.removeTimeout();
        }
        this._timeout = setTimeout(fbind(this._fireTimeout, this), Math.max(ttl - age, 0));
    }
    removeTimeout() {
        if (this._timeout) {
            clearTimeout(this._timeout);
        }
        this._timeout = null;
    }
    _fireTimeout() {
        this.reject(new errors.TimeoutError("ResourceRequest timed out"));
    }
    reject(reason) {
        this.removeTimeout();
        super.reject(reason);
    }
    resolve(value) {
        this.removeTimeout();
        super.resolve(value);
    }
    /**
   * [constructor description]
   * @param  {Number} ttl     timeout
   */ constructor(ttl, Promise){
        super(Promise);
        this._creationTimestamp = Date.now();
        this._timeout = null;
        if (ttl !== undefined) {
            this.setTimeout(ttl);
        }
    }
}
module.exports = ResourceRequest;
}),
"[project]/dawg-ai/node_modules/generic-pool/lib/ResourceLoan.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

const Deferred = __turbopack_context__.r("[project]/dawg-ai/node_modules/generic-pool/lib/Deferred.js [app-client] (ecmascript)");
/**
 * Plan is to maybe add tracking via Error objects
 * and other fun stuff!
 */ class ResourceLoan extends Deferred {
    reject() {
    /**
     * Loans can only be resolved at the moment
     */ }
    /**
   *
   * @param  {any} pooledResource the PooledResource this loan belongs to
   * @return {any}                [description]
   */ constructor(pooledResource, Promise){
        super(Promise);
        this._creationTimestamp = Date.now();
        this.pooledResource = pooledResource;
    }
}
module.exports = ResourceLoan;
}),
"[project]/dawg-ai/node_modules/generic-pool/lib/PooledResourceStateEnum.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

const PooledResourceStateEnum = {
    ALLOCATED: "ALLOCATED",
    IDLE: "IDLE",
    INVALID: "INVALID",
    RETURNING: "RETURNING",
    VALIDATION: "VALIDATION" // Currently being tested
};
module.exports = PooledResourceStateEnum;
}),
"[project]/dawg-ai/node_modules/generic-pool/lib/PooledResource.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

const PooledResourceStateEnum = __turbopack_context__.r("[project]/dawg-ai/node_modules/generic-pool/lib/PooledResourceStateEnum.js [app-client] (ecmascript)");
/**
 * @class
 * @private
 */ class PooledResource {
    // mark the resource as "allocated"
    allocate() {
        this.lastBorrowTime = Date.now();
        this.state = PooledResourceStateEnum.ALLOCATED;
    }
    // mark the resource as "deallocated"
    deallocate() {
        this.lastReturnTime = Date.now();
        this.state = PooledResourceStateEnum.IDLE;
    }
    invalidate() {
        this.state = PooledResourceStateEnum.INVALID;
    }
    test() {
        this.state = PooledResourceStateEnum.VALIDATION;
    }
    idle() {
        this.lastIdleTime = Date.now();
        this.state = PooledResourceStateEnum.IDLE;
    }
    returning() {
        this.state = PooledResourceStateEnum.RETURNING;
    }
    constructor(resource){
        this.creationTime = Date.now();
        this.lastReturnTime = null;
        this.lastBorrowTime = null;
        this.lastIdleTime = null;
        this.obj = resource;
        this.state = PooledResourceStateEnum.IDLE;
    }
}
module.exports = PooledResource;
}),
"[project]/dawg-ai/node_modules/generic-pool/lib/DefaultEvictor.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

class DefaultEvictor {
    evict(config, pooledResource, availableObjectsCount) {
        const idleTime = Date.now() - pooledResource.lastIdleTime;
        if (config.softIdleTimeoutMillis > 0 && config.softIdleTimeoutMillis < idleTime && config.min < availableObjectsCount) {
            return true;
        }
        if (config.idleTimeoutMillis < idleTime) {
            return true;
        }
        return false;
    }
}
module.exports = DefaultEvictor;
}),
"[project]/dawg-ai/node_modules/generic-pool/lib/DoublyLinkedList.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

/**
 * A Doubly Linked List, because there aren't enough in the world...
 * this is pretty much a direct JS port of the one wikipedia
 * https://en.wikipedia.org/wiki/Doubly_linked_list
 *
 * For most usage 'insertBeginning' and 'insertEnd' should be enough
 *
 * nodes are expected to something like a POJSO like
 * {
 *   prev: null,
 *   next: null,
 *   something: 'whatever you like'
 * }
 */ class DoublyLinkedList {
    insertBeginning(node) {
        if (this.head === null) {
            this.head = node;
            this.tail = node;
            node.prev = null;
            node.next = null;
            this.length++;
        } else {
            this.insertBefore(this.head, node);
        }
    }
    insertEnd(node) {
        if (this.tail === null) {
            this.insertBeginning(node);
        } else {
            this.insertAfter(this.tail, node);
        }
    }
    insertAfter(node, newNode) {
        newNode.prev = node;
        newNode.next = node.next;
        if (node.next === null) {
            this.tail = newNode;
        } else {
            node.next.prev = newNode;
        }
        node.next = newNode;
        this.length++;
    }
    insertBefore(node, newNode) {
        newNode.prev = node.prev;
        newNode.next = node;
        if (node.prev === null) {
            this.head = newNode;
        } else {
            node.prev.next = newNode;
        }
        node.prev = newNode;
        this.length++;
    }
    remove(node) {
        if (node.prev === null) {
            this.head = node.next;
        } else {
            node.prev.next = node.next;
        }
        if (node.next === null) {
            this.tail = node.prev;
        } else {
            node.next.prev = node.prev;
        }
        node.prev = null;
        node.next = null;
        this.length--;
    }
    // FIXME: this should not live here and has become a dumping ground...
    static createNode(data) {
        return {
            prev: null,
            next: null,
            data: data
        };
    }
    constructor(){
        this.head = null;
        this.tail = null;
        this.length = 0;
    }
}
module.exports = DoublyLinkedList;
}),
"[project]/dawg-ai/node_modules/generic-pool/lib/DoublyLinkedListIterator.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

/**
 * Creates an interator for a DoublyLinkedList starting at the given node
 * It's internal cursor will remains relative to the last "iterated" node as that
 * node moves through the list until it either iterates to the end of the list,
 * or the the node it's tracking is removed from the list. Until the first 'next'
 * call it tracks the head/tail of the linked list. This means that one can create
 * an iterator on an empty list, then add nodes, and then the iterator will follow
 * those nodes. Because the DoublyLinkedList nodes don't track their owning "list" and
 * it's highly inefficient to walk the list for every iteration, the iterator won't know
 * if the node has been detached from one List and added to another list, or if the iterator
 *
 * The created object is an es6 compatible iterator
 */ class DoublyLinkedListIterator {
    _start() {
        this._cursor = this._list[this._startPosition];
        this._started = true;
    }
    _advanceCursor() {
        if (this._started === false) {
            this._started = true;
            this._cursor = this._list[this._startPosition];
            return;
        }
        this._cursor = this._cursor[this._direction];
    }
    reset() {
        this._done = false;
        this._started = false;
        this._cursor = null;
    }
    remove() {
        if (this._started === false || this._done === true || this._isCursorDetached()) {
            return false;
        }
        this._list.remove(this._cursor);
    }
    next() {
        if (this._done === true) {
            return {
                done: true
            };
        }
        this._advanceCursor();
        // if there is no node at the cursor or the node at the cursor is no longer part of
        // a doubly linked list then we are done/finished/kaput
        if (this._cursor === null || this._isCursorDetached()) {
            this._done = true;
            return {
                done: true
            };
        }
        return {
            value: this._cursor,
            done: false
        };
    }
    /**
   * Is the node detached from a list?
   * NOTE: you can trick/bypass/confuse this check by removing a node from one DoublyLinkedList
   * and adding it to another.
   * TODO: We can make this smarter by checking the direction of travel and only checking
   * the required next/prev/head/tail rather than all of them
   * @return {Boolean}      [description]
   */ _isCursorDetached() {
        return this._cursor.prev === null && this._cursor.next === null && this._list.tail !== this._cursor && this._list.head !== this._cursor;
    }
    /**
   * @param  {Object} doublyLinkedList     a node that is part of a doublyLinkedList
   * @param  {Boolean} [reverse=false]     is this a reverse iterator? default: false
   */ constructor(doublyLinkedList, reverse){
        this._list = doublyLinkedList;
        // NOTE: these key names are tied to the DoublyLinkedListIterator
        this._direction = reverse === true ? "prev" : "next";
        this._startPosition = reverse === true ? "tail" : "head";
        this._started = false;
        this._cursor = null;
        this._done = false;
    }
}
module.exports = DoublyLinkedListIterator;
}),
"[project]/dawg-ai/node_modules/generic-pool/lib/DequeIterator.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

const DoublyLinkedListIterator = __turbopack_context__.r("[project]/dawg-ai/node_modules/generic-pool/lib/DoublyLinkedListIterator.js [app-client] (ecmascript)");
/**
 * Thin wrapper around an underlying DDL iterator
 */ class DequeIterator extends DoublyLinkedListIterator {
    next() {
        const result = super.next();
        // unwrap the node...
        if (result.value) {
            result.value = result.value.data;
        }
        return result;
    }
}
module.exports = DequeIterator;
}),
"[project]/dawg-ai/node_modules/generic-pool/lib/Deque.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

const DoublyLinkedList = __turbopack_context__.r("[project]/dawg-ai/node_modules/generic-pool/lib/DoublyLinkedList.js [app-client] (ecmascript)");
const DequeIterator = __turbopack_context__.r("[project]/dawg-ai/node_modules/generic-pool/lib/DequeIterator.js [app-client] (ecmascript)");
/**
 * DoublyLinkedList backed double ended queue
 * implements just enough to keep the Pool
 */ class Deque {
    /**
   * removes and returns the first element from the queue
   * @return {any} [description]
   */ shift() {
        if (this.length === 0) {
            return undefined;
        }
        const node = this._list.head;
        this._list.remove(node);
        return node.data;
    }
    /**
   * adds one elemts to the beginning of the queue
   * @param  {any} element [description]
   * @return {any}         [description]
   */ unshift(element) {
        const node = DoublyLinkedList.createNode(element);
        this._list.insertBeginning(node);
    }
    /**
   * adds one to the end of the queue
   * @param  {any} element [description]
   * @return {any}         [description]
   */ push(element) {
        const node = DoublyLinkedList.createNode(element);
        this._list.insertEnd(node);
    }
    /**
   * removes and returns the last element from the queue
   */ pop() {
        if (this.length === 0) {
            return undefined;
        }
        const node = this._list.tail;
        this._list.remove(node);
        return node.data;
    }
    [Symbol.iterator]() {
        return new DequeIterator(this._list);
    }
    iterator() {
        return new DequeIterator(this._list);
    }
    reverseIterator() {
        return new DequeIterator(this._list, true);
    }
    /**
   * get a reference to the item at the head of the queue
   * @return {any} [description]
   */ get head() {
        if (this.length === 0) {
            return undefined;
        }
        const node = this._list.head;
        return node.data;
    }
    /**
   * get a reference to the item at the tail of the queue
   * @return {any} [description]
   */ get tail() {
        if (this.length === 0) {
            return undefined;
        }
        const node = this._list.tail;
        return node.data;
    }
    get length() {
        return this._list.length;
    }
    constructor(){
        this._list = new DoublyLinkedList();
    }
}
module.exports = Deque;
}),
"[project]/dawg-ai/node_modules/generic-pool/lib/Queue.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

const DoublyLinkedList = __turbopack_context__.r("[project]/dawg-ai/node_modules/generic-pool/lib/DoublyLinkedList.js [app-client] (ecmascript)");
const Deque = __turbopack_context__.r("[project]/dawg-ai/node_modules/generic-pool/lib/Deque.js [app-client] (ecmascript)");
/**
 * Sort of a internal queue for holding the waiting
 * resource requets for a given "priority".
 * Also handles managing timeouts rejections on items (is this the best place for this?)
 * This is the last point where we know which queue a resourceRequest is in
 *
 */ class Queue extends Deque {
    /**
   * Adds the obj to the end of the list for this slot
   * we completely override the parent method because we need access to the
   * node for our rejection handler
   * @param {any} resourceRequest [description]
   */ push(resourceRequest) {
        const node = DoublyLinkedList.createNode(resourceRequest);
        resourceRequest.promise.catch(this._createTimeoutRejectionHandler(node));
        this._list.insertEnd(node);
    }
    _createTimeoutRejectionHandler(node) {
        return (reason)=>{
            if (reason.name === "TimeoutError") {
                this._list.remove(node);
            }
        };
    }
}
module.exports = Queue;
}),
"[project]/dawg-ai/node_modules/generic-pool/lib/PriorityQueue.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

const Queue = __turbopack_context__.r("[project]/dawg-ai/node_modules/generic-pool/lib/Queue.js [app-client] (ecmascript)");
/**
 * @class
 * @private
 */ class PriorityQueue {
    get length() {
        let _length = 0;
        for(let i = 0, slots = this._slots.length; i < slots; i++){
            _length += this._slots[i].length;
        }
        return _length;
    }
    enqueue(obj, priority) {
        // Convert to integer with a default value of 0.
        priority = priority && +priority | 0 || 0;
        if (priority) {
            if (priority < 0 || priority >= this._size) {
                priority = this._size - 1;
            // put obj at the end of the line
            }
        }
        this._slots[priority].push(obj);
    }
    dequeue() {
        for(let i = 0, sl = this._slots.length; i < sl; i += 1){
            if (this._slots[i].length) {
                return this._slots[i].shift();
            }
        }
        return;
    }
    get head() {
        for(let i = 0, sl = this._slots.length; i < sl; i += 1){
            if (this._slots[i].length > 0) {
                return this._slots[i].head;
            }
        }
        return;
    }
    get tail() {
        for(let i = this._slots.length - 1; i >= 0; i--){
            if (this._slots[i].length > 0) {
                return this._slots[i].tail;
            }
        }
        return;
    }
    constructor(size){
        this._size = Math.max(+size | 0, 1);
        /** @type {Queue[]} */ this._slots = [];
        // initialize arrays to hold queue elements
        for(let i = 0; i < this._size; i++){
            this._slots.push(new Queue());
        }
    }
}
module.exports = PriorityQueue;
}),
"[project]/dawg-ai/node_modules/generic-pool/lib/utils.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

function noop() {}
/**
 * Reflects a promise but does not expose any
 * underlying value or rejection from that promise.
 * @param  {Promise} promise [description]
 * @return {Promise}         [description]
 */ exports.reflector = function(promise) {
    return promise.then(noop, noop);
};
}),
"[project]/dawg-ai/node_modules/generic-pool/lib/Pool.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

const EventEmitter = __turbopack_context__.r("[project]/dawg-ai/node_modules/events/events.js [app-client] (ecmascript)").EventEmitter;
const factoryValidator = __turbopack_context__.r("[project]/dawg-ai/node_modules/generic-pool/lib/factoryValidator.js [app-client] (ecmascript)");
const PoolOptions = __turbopack_context__.r("[project]/dawg-ai/node_modules/generic-pool/lib/PoolOptions.js [app-client] (ecmascript)");
const ResourceRequest = __turbopack_context__.r("[project]/dawg-ai/node_modules/generic-pool/lib/ResourceRequest.js [app-client] (ecmascript)");
const ResourceLoan = __turbopack_context__.r("[project]/dawg-ai/node_modules/generic-pool/lib/ResourceLoan.js [app-client] (ecmascript)");
const PooledResource = __turbopack_context__.r("[project]/dawg-ai/node_modules/generic-pool/lib/PooledResource.js [app-client] (ecmascript)");
const DefaultEvictor = __turbopack_context__.r("[project]/dawg-ai/node_modules/generic-pool/lib/DefaultEvictor.js [app-client] (ecmascript)");
const Deque = __turbopack_context__.r("[project]/dawg-ai/node_modules/generic-pool/lib/Deque.js [app-client] (ecmascript)");
const Deferred = __turbopack_context__.r("[project]/dawg-ai/node_modules/generic-pool/lib/Deferred.js [app-client] (ecmascript)");
const PriorityQueue = __turbopack_context__.r("[project]/dawg-ai/node_modules/generic-pool/lib/PriorityQueue.js [app-client] (ecmascript)");
const DequeIterator = __turbopack_context__.r("[project]/dawg-ai/node_modules/generic-pool/lib/DequeIterator.js [app-client] (ecmascript)");
const reflector = __turbopack_context__.r("[project]/dawg-ai/node_modules/generic-pool/lib/utils.js [app-client] (ecmascript)").reflector;
/**
 * TODO: move me
 */ const FACTORY_CREATE_ERROR = "factoryCreateError";
const FACTORY_DESTROY_ERROR = "factoryDestroyError";
class Pool extends EventEmitter {
    _destroy(pooledResource) {
        // FIXME: do we need another state for "in destruction"?
        pooledResource.invalidate();
        this._allObjects.delete(pooledResource);
        // NOTE: this maybe very bad promise usage?
        const destroyPromise = this._factory.destroy(pooledResource.obj);
        const wrappedDestroyPromise = this._config.destroyTimeoutMillis ? this._Promise.resolve(this._applyDestroyTimeout(destroyPromise)) : this._Promise.resolve(destroyPromise);
        this._trackOperation(wrappedDestroyPromise, this._factoryDestroyOperations).catch((reason)=>{
            this.emit(FACTORY_DESTROY_ERROR, reason);
        });
        // TODO: maybe ensuring minimum pool size should live outside here
        this._ensureMinimum();
    }
    _applyDestroyTimeout(promise) {
        const timeoutPromise = new this._Promise((resolve, reject)=>{
            setTimeout(()=>{
                reject(new Error("destroy timed out"));
            }, this._config.destroyTimeoutMillis).unref();
        });
        return this._Promise.race([
            timeoutPromise,
            promise
        ]);
    }
    /**
   * Attempt to move an available resource into test and then onto a waiting client
   * @return {Boolean} could we move an available resource into test
   */ _testOnBorrow() {
        if (this._availableObjects.length < 1) {
            return false;
        }
        const pooledResource = this._availableObjects.shift();
        // Mark the resource as in test
        pooledResource.test();
        this._testOnBorrowResources.add(pooledResource);
        const validationPromise = this._factory.validate(pooledResource.obj);
        const wrappedValidationPromise = this._Promise.resolve(validationPromise);
        this._trackOperation(wrappedValidationPromise, this._validationOperations).then((isValid)=>{
            this._testOnBorrowResources.delete(pooledResource);
            if (isValid === false) {
                pooledResource.invalidate();
                this._destroy(pooledResource);
                this._dispense();
                return;
            }
            this._dispatchPooledResourceToNextWaitingClient(pooledResource);
        });
        return true;
    }
    /**
   * Attempt to move an available resource to a waiting client
   * @return {Boolean} [description]
   */ _dispatchResource() {
        if (this._availableObjects.length < 1) {
            return false;
        }
        const pooledResource = this._availableObjects.shift();
        this._dispatchPooledResourceToNextWaitingClient(pooledResource);
        return false;
    }
    /**
   * Attempt to resolve an outstanding resource request using an available resource from
   * the pool, or creating new ones
   *
   * @private
   */ _dispense() {
        /**
     * Local variables for ease of reading/writing
     * these don't (shouldn't) change across the execution of this fn
     */ const numWaitingClients = this._waitingClientsQueue.length;
        // If there aren't any waiting requests then there is nothing to do
        // so lets short-circuit
        if (numWaitingClients < 1) {
            return;
        }
        const resourceShortfall = numWaitingClients - this._potentiallyAllocableResourceCount;
        const actualNumberOfResourcesToCreate = Math.min(this.spareResourceCapacity, resourceShortfall);
        for(let i = 0; actualNumberOfResourcesToCreate > i; i++){
            this._createResource();
        }
        // If we are doing test-on-borrow see how many more resources need to be moved into test
        // to help satisfy waitingClients
        if (this._config.testOnBorrow === true) {
            // how many available resources do we need to shift into test
            const desiredNumberOfResourcesToMoveIntoTest = numWaitingClients - this._testOnBorrowResources.size;
            const actualNumberOfResourcesToMoveIntoTest = Math.min(this._availableObjects.length, desiredNumberOfResourcesToMoveIntoTest);
            for(let i = 0; actualNumberOfResourcesToMoveIntoTest > i; i++){
                this._testOnBorrow();
            }
        }
        // if we aren't testing-on-borrow then lets try to allocate what we can
        if (this._config.testOnBorrow === false) {
            const actualNumberOfResourcesToDispatch = Math.min(this._availableObjects.length, numWaitingClients);
            for(let i = 0; actualNumberOfResourcesToDispatch > i; i++){
                this._dispatchResource();
            }
        }
    }
    /**
   * Dispatches a pooledResource to the next waiting client (if any) else
   * puts the PooledResource back on the available list
   * @param  {PooledResource} pooledResource [description]
   * @return {Boolean}                [description]
   */ _dispatchPooledResourceToNextWaitingClient(pooledResource) {
        const clientResourceRequest = this._waitingClientsQueue.dequeue();
        if (clientResourceRequest === undefined || clientResourceRequest.state !== Deferred.PENDING) {
            // While we were away either all the waiting clients timed out
            // or were somehow fulfilled. put our pooledResource back.
            this._addPooledResourceToAvailableObjects(pooledResource);
            // TODO: do need to trigger anything before we leave?
            return false;
        }
        const loan = new ResourceLoan(pooledResource, this._Promise);
        this._resourceLoans.set(pooledResource.obj, loan);
        pooledResource.allocate();
        clientResourceRequest.resolve(pooledResource.obj);
        return true;
    }
    /**
   * tracks on operation using given set
   * handles adding/removing from the set and resolve/rejects the value/reason
   * @param  {Promise} operation
   * @param  {Set} set       Set holding operations
   * @return {Promise}       Promise that resolves once operation has been removed from set
   */ _trackOperation(operation, set) {
        set.add(operation);
        return operation.then((v)=>{
            set.delete(operation);
            return this._Promise.resolve(v);
        }, (e)=>{
            set.delete(operation);
            return this._Promise.reject(e);
        });
    }
    /**
   * @private
   */ _createResource() {
        // An attempt to create a resource
        const factoryPromise = this._factory.create();
        const wrappedFactoryPromise = this._Promise.resolve(factoryPromise).then((resource)=>{
            const pooledResource = new PooledResource(resource);
            this._allObjects.add(pooledResource);
            this._addPooledResourceToAvailableObjects(pooledResource);
        });
        this._trackOperation(wrappedFactoryPromise, this._factoryCreateOperations).then(()=>{
            this._dispense();
            // Stop bluebird complaining about this side-effect only handler
            // - a promise was created in a handler but was not returned from it
            // https://goo.gl/rRqMUw
            return null;
        }).catch((reason)=>{
            this.emit(FACTORY_CREATE_ERROR, reason);
            this._dispense();
        });
    }
    /**
   * @private
   */ _ensureMinimum() {
        if (this._draining === true) {
            return;
        }
        const minShortfall = this._config.min - this._count;
        for(let i = 0; i < minShortfall; i++){
            this._createResource();
        }
    }
    _evict() {
        const testsToRun = Math.min(this._config.numTestsPerEvictionRun, this._availableObjects.length);
        const evictionConfig = {
            softIdleTimeoutMillis: this._config.softIdleTimeoutMillis,
            idleTimeoutMillis: this._config.idleTimeoutMillis,
            min: this._config.min
        };
        for(let testsHaveRun = 0; testsHaveRun < testsToRun;){
            const iterationResult = this._evictionIterator.next();
            // Safety check incase we could get stuck in infinite loop because we
            // somehow emptied the array after checking its length.
            if (iterationResult.done === true && this._availableObjects.length < 1) {
                this._evictionIterator.reset();
                return;
            }
            // If this happens it should just mean we reached the end of the
            // list and can reset the cursor.
            if (iterationResult.done === true && this._availableObjects.length > 0) {
                this._evictionIterator.reset();
                continue;
            }
            const resource = iterationResult.value;
            const shouldEvict = this._evictor.evict(evictionConfig, resource, this._availableObjects.length);
            testsHaveRun++;
            if (shouldEvict === true) {
                // take it out of the _availableObjects list
                this._evictionIterator.remove();
                this._destroy(resource);
            }
        }
    }
    _scheduleEvictorRun() {
        // Start eviction if set
        if (this._config.evictionRunIntervalMillis > 0) {
            // @ts-ignore
            this._scheduledEviction = setTimeout(()=>{
                this._evict();
                this._scheduleEvictorRun();
            }, this._config.evictionRunIntervalMillis).unref();
        }
    }
    _descheduleEvictorRun() {
        if (this._scheduledEviction) {
            clearTimeout(this._scheduledEviction);
        }
        this._scheduledEviction = null;
    }
    start() {
        if (this._draining === true) {
            return;
        }
        if (this._started === true) {
            return;
        }
        this._started = true;
        this._scheduleEvictorRun();
        this._ensureMinimum();
    }
    /**
   * Request a new resource. The callback will be called,
   * when a new resource is available, passing the resource to the callback.
   * TODO: should we add a seperate "acquireWithPriority" function
   *
   * @param {Number} [priority=0]
   *   Optional.  Integer between 0 and (priorityRange - 1).  Specifies the priority
   *   of the caller if there are no available resources.  Lower numbers mean higher
   *   priority.
   *
   * @returns {Promise}
   */ acquire(priority) {
        if (this._started === false && this._config.autostart === false) {
            this.start();
        }
        if (this._draining) {
            return this._Promise.reject(new Error("pool is draining and cannot accept work"));
        }
        // TODO: should we defer this check till after this event loop incase "the situation" changes in the meantime
        if (this.spareResourceCapacity < 1 && this._availableObjects.length < 1 && this._config.maxWaitingClients !== undefined && this._waitingClientsQueue.length >= this._config.maxWaitingClients) {
            return this._Promise.reject(new Error("max waitingClients count exceeded"));
        }
        const resourceRequest = new ResourceRequest(this._config.acquireTimeoutMillis, this._Promise);
        this._waitingClientsQueue.enqueue(resourceRequest, priority);
        this._dispense();
        return resourceRequest.promise;
    }
    /**
   * [use method, aquires a resource, passes the resource to a user supplied function and releases it]
   * @param  {Function} fn [a function that accepts a resource and returns a promise that resolves/rejects once it has finished using the resource]
   * @return {Promise}      [resolves once the resource is released to the pool]
   */ use(fn, priority) {
        return this.acquire(priority).then((resource)=>{
            return fn(resource).then((result)=>{
                this.release(resource);
                return result;
            }, (err)=>{
                this.destroy(resource);
                throw err;
            });
        });
    }
    /**
   * Check if resource is currently on loan from the pool
   *
   * @param {Function} resource
   *    Resource for checking.
   *
   * @returns {Boolean}
   *  True if resource belongs to this pool and false otherwise
   */ isBorrowedResource(resource) {
        return this._resourceLoans.has(resource);
    }
    /**
   * Return the resource to the pool when it is no longer required.
   *
   * @param {Object} resource
   *   The acquired object to be put back to the pool.
   */ release(resource) {
        // check for an outstanding loan
        const loan = this._resourceLoans.get(resource);
        if (loan === undefined) {
            return this._Promise.reject(new Error("Resource not currently part of this pool"));
        }
        this._resourceLoans.delete(resource);
        loan.resolve();
        const pooledResource = loan.pooledResource;
        pooledResource.deallocate();
        this._addPooledResourceToAvailableObjects(pooledResource);
        this._dispense();
        return this._Promise.resolve();
    }
    /**
   * Request the resource to be destroyed. The factory's destroy handler
   * will also be called.
   *
   * This should be called within an acquire() block as an alternative to release().
   *
   * @param {Object} resource
   *   The acquired resource to be destoyed.
   */ destroy(resource) {
        // check for an outstanding loan
        const loan = this._resourceLoans.get(resource);
        if (loan === undefined) {
            return this._Promise.reject(new Error("Resource not currently part of this pool"));
        }
        this._resourceLoans.delete(resource);
        loan.resolve();
        const pooledResource = loan.pooledResource;
        pooledResource.deallocate();
        this._destroy(pooledResource);
        this._dispense();
        return this._Promise.resolve();
    }
    _addPooledResourceToAvailableObjects(pooledResource) {
        pooledResource.idle();
        if (this._config.fifo === true) {
            this._availableObjects.push(pooledResource);
        } else {
            this._availableObjects.unshift(pooledResource);
        }
    }
    /**
   * Disallow any new acquire calls and let the request backlog dissapate.
   * The Pool will no longer attempt to maintain a "min" number of resources
   * and will only make new resources on demand.
   * Resolves once all resource requests are fulfilled and all resources are returned to pool and available...
   * Should probably be called "drain work"
   * @returns {Promise}
   */ drain() {
        this._draining = true;
        return this.__allResourceRequestsSettled().then(()=>{
            return this.__allResourcesReturned();
        }).then(()=>{
            this._descheduleEvictorRun();
        });
    }
    __allResourceRequestsSettled() {
        if (this._waitingClientsQueue.length > 0) {
            // wait for last waiting client to be settled
            // FIXME: what if they can "resolve" out of order....?
            return reflector(this._waitingClientsQueue.tail.promise);
        }
        return this._Promise.resolve();
    }
    // FIXME: this is a horrific mess
    __allResourcesReturned() {
        const ps = Array.from(this._resourceLoans.values()).map((loan)=>loan.promise).map(reflector);
        return this._Promise.all(ps);
    }
    /**
   * Forcibly destroys all available resources regardless of timeout.  Intended to be
   * invoked as part of a drain.  Does not prevent the creation of new
   * resources as a result of subsequent calls to acquire.
   *
   * Note that if factory.min > 0 and the pool isn't "draining", the pool will destroy all idle resources
   * in the pool, but replace them with newly created resources up to the
   * specified factory.min value.  If this is not desired, set factory.min
   * to zero before calling clear()
   *
   */ clear() {
        const reflectedCreatePromises = Array.from(this._factoryCreateOperations).map(reflector);
        // wait for outstanding factory.create to complete
        return this._Promise.all(reflectedCreatePromises).then(()=>{
            // Destroy existing resources
            // @ts-ignore
            for (const resource of this._availableObjects){
                this._destroy(resource);
            }
            const reflectedDestroyPromises = Array.from(this._factoryDestroyOperations).map(reflector);
            return reflector(this._Promise.all(reflectedDestroyPromises));
        });
    }
    /**
   * Waits until the pool is ready.
   * We define ready by checking if the current resource number is at least
   * the minimum number defined.
   * @returns {Promise} that resolves when the minimum number is ready.
   */ ready() {
        return new this._Promise((resolve)=>{
            const isReady = ()=>{
                if (this.available >= this.min) {
                    resolve();
                } else {
                    setTimeout(isReady, 100);
                }
            };
            isReady();
        });
    }
    /**
   * How many resources are available to allocated
   * (includes resources that have not been tested and may faul validation)
   * NOTE: internal for now as the name is awful and might not be useful to anyone
   * @return {Number} number of resources the pool has to allocate
   */ get _potentiallyAllocableResourceCount() {
        return this._availableObjects.length + this._testOnBorrowResources.size + this._testOnReturnResources.size + this._factoryCreateOperations.size;
    }
    /**
   * The combined count of the currently created objects and those in the
   * process of being created
   * Does NOT include resources in the process of being destroyed
   * sort of legacy...
   * @return {Number}
   */ get _count() {
        return this._allObjects.size + this._factoryCreateOperations.size;
    }
    /**
   * How many more resources does the pool have room for
   * @return {Number} number of resources the pool could create before hitting any limits
   */ get spareResourceCapacity() {
        return this._config.max - (this._allObjects.size + this._factoryCreateOperations.size);
    }
    /**
   * see _count above
   * @return {Number} [description]
   */ get size() {
        return this._count;
    }
    /**
   * number of available resources
   * @return {Number} [description]
   */ get available() {
        return this._availableObjects.length;
    }
    /**
   * number of resources that are currently acquired
   * @return {Number} [description]
   */ get borrowed() {
        return this._resourceLoans.size;
    }
    /**
   * number of waiting acquire calls
   * @return {Number} [description]
   */ get pending() {
        return this._waitingClientsQueue.length;
    }
    /**
   * maximum size of the pool
   * @return {Number} [description]
   */ get max() {
        return this._config.max;
    }
    /**
   * minimum size of the pool
   * @return {Number} [description]
   */ get min() {
        return this._config.min;
    }
    /**
   * Generate an Object pool with a specified `factory` and `config`.
   *
   * @param {typeof DefaultEvictor} Evictor
   * @param {typeof Deque} Deque
   * @param {typeof PriorityQueue} PriorityQueue
   * @param {Object} factory
   *   Factory to be used for generating and destroying the items.
   * @param {Function} factory.create
   *   Should create the item to be acquired,
   *   and call it's first callback argument with the generated item as it's argument.
   * @param {Function} factory.destroy
   *   Should gently close any resources that the item is using.
   *   Called before the items is destroyed.
   * @param {Function} factory.validate
   *   Test if a resource is still valid .Should return a promise that resolves to a boolean, true if resource is still valid and false
   *   If it should be removed from pool.
   * @param {Object} options
   */ constructor(Evictor, Deque, PriorityQueue, factory, options){
        super();
        factoryValidator(factory);
        this._config = new PoolOptions(options);
        // TODO: fix up this ugly glue-ing
        this._Promise = this._config.Promise;
        this._factory = factory;
        this._draining = false;
        this._started = false;
        /**
     * Holds waiting clients
     * @type {PriorityQueue}
     */ this._waitingClientsQueue = new PriorityQueue(this._config.priorityRange);
        /**
     * Collection of promises for resource creation calls made by the pool to factory.create
     * @type {Set}
     */ this._factoryCreateOperations = new Set();
        /**
     * Collection of promises for resource destruction calls made by the pool to factory.destroy
     * @type {Set}
     */ this._factoryDestroyOperations = new Set();
        /**
     * A queue/stack of pooledResources awaiting acquisition
     * TODO: replace with LinkedList backed array
     * @type {Deque}
     */ this._availableObjects = new Deque();
        /**
     * Collection of references for any resource that are undergoing validation before being acquired
     * @type {Set}
     */ this._testOnBorrowResources = new Set();
        /**
     * Collection of references for any resource that are undergoing validation before being returned
     * @type {Set}
     */ this._testOnReturnResources = new Set();
        /**
     * Collection of promises for any validations currently in process
     * @type {Set}
     */ this._validationOperations = new Set();
        /**
     * All objects associated with this pool in any state (except destroyed)
     * @type {Set}
     */ this._allObjects = new Set();
        /**
     * Loans keyed by the borrowed resource
     * @type {Map}
     */ this._resourceLoans = new Map();
        /**
     * Infinitely looping iterator over available object
     * @type {DequeIterator}
     */ this._evictionIterator = this._availableObjects.iterator();
        this._evictor = new Evictor();
        /**
     * handle for setTimeout for next eviction run
     * @type {(number|null)}
     */ this._scheduledEviction = null;
        // create initial resources (if factory.min > 0)
        if (this._config.autostart === true) {
            this.start();
        }
    }
}
module.exports = Pool;
}),
"[project]/dawg-ai/node_modules/generic-pool/index.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {

const Pool = __turbopack_context__.r("[project]/dawg-ai/node_modules/generic-pool/lib/Pool.js [app-client] (ecmascript)");
const Deque = __turbopack_context__.r("[project]/dawg-ai/node_modules/generic-pool/lib/Deque.js [app-client] (ecmascript)");
const PriorityQueue = __turbopack_context__.r("[project]/dawg-ai/node_modules/generic-pool/lib/PriorityQueue.js [app-client] (ecmascript)");
const DefaultEvictor = __turbopack_context__.r("[project]/dawg-ai/node_modules/generic-pool/lib/DefaultEvictor.js [app-client] (ecmascript)");
module.exports = {
    Pool: Pool,
    Deque: Deque,
    PriorityQueue: PriorityQueue,
    DefaultEvictor: DefaultEvictor,
    createPool: function(factory, config) {
        return new Pool(DefaultEvictor, Deque, PriorityQueue, factory, config);
    }
};
}),
"[project]/dawg-ai/node_modules/cluster-key-slot/lib/index.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {

/*
 * Copyright 2001-2010 Georges Menie (www.menie.org)
 * Copyright 2010 Salvatore Sanfilippo (adapted to Redis coding style)
 * Copyright 2015 Zihua Li (http://zihua.li) (ported to JavaScript)
 * Copyright 2016 Mike Diarmid (http://github.com/salakar) (re-write for performance, ~700% perf inc)
 * All rights reserved.
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of the University of California, Berkeley nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE REGENTS AND CONTRIBUTORS ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE REGENTS AND CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */ /* CRC16 implementation according to CCITT standards.
 *
 * Note by @antirez: this is actually the XMODEM CRC 16 algorithm, using the
 * following parameters:
 *
 * Name                       : "XMODEM", also known as "ZMODEM", "CRC-16/ACORN"
 * Width                      : 16 bit
 * Poly                       : 1021 (That is actually x^16 + x^12 + x^5 + 1)
 * Initialization             : 0000
 * Reflect Input byte         : False
 * Reflect Output CRC         : False
 * Xor constant to output CRC : 0000
 * Output for "123456789"     : 31C3
 */ var lookup = [
    0x0000,
    0x1021,
    0x2042,
    0x3063,
    0x4084,
    0x50a5,
    0x60c6,
    0x70e7,
    0x8108,
    0x9129,
    0xa14a,
    0xb16b,
    0xc18c,
    0xd1ad,
    0xe1ce,
    0xf1ef,
    0x1231,
    0x0210,
    0x3273,
    0x2252,
    0x52b5,
    0x4294,
    0x72f7,
    0x62d6,
    0x9339,
    0x8318,
    0xb37b,
    0xa35a,
    0xd3bd,
    0xc39c,
    0xf3ff,
    0xe3de,
    0x2462,
    0x3443,
    0x0420,
    0x1401,
    0x64e6,
    0x74c7,
    0x44a4,
    0x5485,
    0xa56a,
    0xb54b,
    0x8528,
    0x9509,
    0xe5ee,
    0xf5cf,
    0xc5ac,
    0xd58d,
    0x3653,
    0x2672,
    0x1611,
    0x0630,
    0x76d7,
    0x66f6,
    0x5695,
    0x46b4,
    0xb75b,
    0xa77a,
    0x9719,
    0x8738,
    0xf7df,
    0xe7fe,
    0xd79d,
    0xc7bc,
    0x48c4,
    0x58e5,
    0x6886,
    0x78a7,
    0x0840,
    0x1861,
    0x2802,
    0x3823,
    0xc9cc,
    0xd9ed,
    0xe98e,
    0xf9af,
    0x8948,
    0x9969,
    0xa90a,
    0xb92b,
    0x5af5,
    0x4ad4,
    0x7ab7,
    0x6a96,
    0x1a71,
    0x0a50,
    0x3a33,
    0x2a12,
    0xdbfd,
    0xcbdc,
    0xfbbf,
    0xeb9e,
    0x9b79,
    0x8b58,
    0xbb3b,
    0xab1a,
    0x6ca6,
    0x7c87,
    0x4ce4,
    0x5cc5,
    0x2c22,
    0x3c03,
    0x0c60,
    0x1c41,
    0xedae,
    0xfd8f,
    0xcdec,
    0xddcd,
    0xad2a,
    0xbd0b,
    0x8d68,
    0x9d49,
    0x7e97,
    0x6eb6,
    0x5ed5,
    0x4ef4,
    0x3e13,
    0x2e32,
    0x1e51,
    0x0e70,
    0xff9f,
    0xefbe,
    0xdfdd,
    0xcffc,
    0xbf1b,
    0xaf3a,
    0x9f59,
    0x8f78,
    0x9188,
    0x81a9,
    0xb1ca,
    0xa1eb,
    0xd10c,
    0xc12d,
    0xf14e,
    0xe16f,
    0x1080,
    0x00a1,
    0x30c2,
    0x20e3,
    0x5004,
    0x4025,
    0x7046,
    0x6067,
    0x83b9,
    0x9398,
    0xa3fb,
    0xb3da,
    0xc33d,
    0xd31c,
    0xe37f,
    0xf35e,
    0x02b1,
    0x1290,
    0x22f3,
    0x32d2,
    0x4235,
    0x5214,
    0x6277,
    0x7256,
    0xb5ea,
    0xa5cb,
    0x95a8,
    0x8589,
    0xf56e,
    0xe54f,
    0xd52c,
    0xc50d,
    0x34e2,
    0x24c3,
    0x14a0,
    0x0481,
    0x7466,
    0x6447,
    0x5424,
    0x4405,
    0xa7db,
    0xb7fa,
    0x8799,
    0x97b8,
    0xe75f,
    0xf77e,
    0xc71d,
    0xd73c,
    0x26d3,
    0x36f2,
    0x0691,
    0x16b0,
    0x6657,
    0x7676,
    0x4615,
    0x5634,
    0xd94c,
    0xc96d,
    0xf90e,
    0xe92f,
    0x99c8,
    0x89e9,
    0xb98a,
    0xa9ab,
    0x5844,
    0x4865,
    0x7806,
    0x6827,
    0x18c0,
    0x08e1,
    0x3882,
    0x28a3,
    0xcb7d,
    0xdb5c,
    0xeb3f,
    0xfb1e,
    0x8bf9,
    0x9bd8,
    0xabbb,
    0xbb9a,
    0x4a75,
    0x5a54,
    0x6a37,
    0x7a16,
    0x0af1,
    0x1ad0,
    0x2ab3,
    0x3a92,
    0xfd2e,
    0xed0f,
    0xdd6c,
    0xcd4d,
    0xbdaa,
    0xad8b,
    0x9de8,
    0x8dc9,
    0x7c26,
    0x6c07,
    0x5c64,
    0x4c45,
    0x3ca2,
    0x2c83,
    0x1ce0,
    0x0cc1,
    0xef1f,
    0xff3e,
    0xcf5d,
    0xdf7c,
    0xaf9b,
    0xbfba,
    0x8fd9,
    0x9ff8,
    0x6e17,
    0x7e36,
    0x4e55,
    0x5e74,
    0x2e93,
    0x3eb2,
    0x0ed1,
    0x1ef0
];
/**
 * Convert a string to a UTF8 array - faster than via buffer
 * @param str
 * @returns {Array}
 */ var toUTF8Array = function toUTF8Array(str) {
    var char;
    var i = 0;
    var p = 0;
    var utf8 = [];
    var len = str.length;
    for(; i < len; i++){
        char = str.charCodeAt(i);
        if (char < 128) {
            utf8[p++] = char;
        } else if (char < 2048) {
            utf8[p++] = char >> 6 | 192;
            utf8[p++] = char & 63 | 128;
        } else if ((char & 0xFC00) === 0xD800 && i + 1 < str.length && (str.charCodeAt(i + 1) & 0xFC00) === 0xDC00) {
            char = 0x10000 + ((char & 0x03FF) << 10) + (str.charCodeAt(++i) & 0x03FF);
            utf8[p++] = char >> 18 | 240;
            utf8[p++] = char >> 12 & 63 | 128;
            utf8[p++] = char >> 6 & 63 | 128;
            utf8[p++] = char & 63 | 128;
        } else {
            utf8[p++] = char >> 12 | 224;
            utf8[p++] = char >> 6 & 63 | 128;
            utf8[p++] = char & 63 | 128;
        }
    }
    return utf8;
};
/**
 * Convert a string into a redis slot hash.
 * @param str
 * @returns {number}
 */ var generate = module.exports = function generate(str) {
    var char;
    var i = 0;
    var start = -1;
    var result = 0;
    var resultHash = 0;
    var utf8 = typeof str === 'string' ? toUTF8Array(str) : str;
    var len = utf8.length;
    while(i < len){
        char = utf8[i++];
        if (start === -1) {
            if (char === 0x7B) {
                start = i;
            }
        } else if (char !== 0x7D) {
            resultHash = lookup[(char ^ resultHash >> 8) & 0xFF] ^ resultHash << 8;
        } else if (i - 1 !== start) {
            return resultHash & 0x3FFF;
        }
        result = lookup[(char ^ result >> 8) & 0xFF] ^ result << 8;
    }
    return result & 0x3FFF;
};
/**
 * Convert an array of multiple strings into a redis slot hash.
 * Returns -1 if one of the keys is not for the same slot as the others
 * @param keys
 * @returns {number}
 */ module.exports.generateMulti = function generateMulti(keys) {
    var i = 1;
    var len = keys.length;
    var base = generate(keys[0]);
    while(i < len){
        if (generate(keys[i++]) !== base) return -1;
    }
    return base;
};
}),
"[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/bloom/ADD.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformReply = exports.transformArguments = exports.FIRST_KEY_INDEX = void 0;
exports.FIRST_KEY_INDEX = 1;
function transformArguments(key, item) {
    return [
        'BF.ADD',
        key,
        item
    ];
}
exports.transformArguments = transformArguments;
var generic_transformers_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/client/dist/lib/commands/generic-transformers.js [app-client] (ecmascript)");
Object.defineProperty(exports, "transformReply", {
    enumerable: true,
    get: function() {
        return generic_transformers_1.transformBooleanReply;
    }
});
}),
"[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/bloom/CARD.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformArguments = exports.IS_READ_ONLY = exports.FIRST_KEY_INDEX = void 0;
exports.FIRST_KEY_INDEX = 1;
exports.IS_READ_ONLY = true;
function transformArguments(key) {
    return [
        'BF.CARD',
        key
    ];
}
exports.transformArguments = transformArguments;
}),
"[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/bloom/EXISTS.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformReply = exports.transformArguments = exports.IS_READ_ONLY = exports.FIRST_KEY_INDEX = void 0;
exports.FIRST_KEY_INDEX = 1;
exports.IS_READ_ONLY = true;
function transformArguments(key, item) {
    return [
        'BF.EXISTS',
        key,
        item
    ];
}
exports.transformArguments = transformArguments;
var generic_transformers_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/client/dist/lib/commands/generic-transformers.js [app-client] (ecmascript)");
Object.defineProperty(exports, "transformReply", {
    enumerable: true,
    get: function() {
        return generic_transformers_1.transformBooleanReply;
    }
});
}),
"[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/bloom/INFO.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformReply = exports.transformArguments = exports.IS_READ_ONLY = exports.FIRST_KEY_INDEX = void 0;
exports.FIRST_KEY_INDEX = 1;
exports.IS_READ_ONLY = true;
function transformArguments(key) {
    return [
        'BF.INFO',
        key
    ];
}
exports.transformArguments = transformArguments;
function transformReply(reply) {
    return {
        capacity: reply[1],
        size: reply[3],
        numberOfFilters: reply[5],
        numberOfInsertedItems: reply[7],
        expansionRate: reply[9]
    };
}
exports.transformReply = transformReply;
}),
"[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/bloom/INSERT.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformReply = exports.transformArguments = exports.FIRST_KEY_INDEX = void 0;
const generic_transformers_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/client/dist/lib/commands/generic-transformers.js [app-client] (ecmascript)");
exports.FIRST_KEY_INDEX = 1;
function transformArguments(key, items, options) {
    const args = [
        'BF.INSERT',
        key
    ];
    if (options === null || options === void 0 ? void 0 : options.CAPACITY) {
        args.push('CAPACITY', options.CAPACITY.toString());
    }
    if (options === null || options === void 0 ? void 0 : options.ERROR) {
        args.push('ERROR', options.ERROR.toString());
    }
    if (options === null || options === void 0 ? void 0 : options.EXPANSION) {
        args.push('EXPANSION', options.EXPANSION.toString());
    }
    if (options === null || options === void 0 ? void 0 : options.NOCREATE) {
        args.push('NOCREATE');
    }
    if (options === null || options === void 0 ? void 0 : options.NONSCALING) {
        args.push('NONSCALING');
    }
    args.push('ITEMS');
    return (0, generic_transformers_1.pushVerdictArguments)(args, items);
}
exports.transformArguments = transformArguments;
var generic_transformers_2 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/client/dist/lib/commands/generic-transformers.js [app-client] (ecmascript)");
Object.defineProperty(exports, "transformReply", {
    enumerable: true,
    get: function() {
        return generic_transformers_2.transformBooleanArrayReply;
    }
});
}),
"[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/bloom/LOADCHUNK.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformArguments = exports.FIRST_KEY_INDEX = void 0;
exports.FIRST_KEY_INDEX = 1;
function transformArguments(key, iteretor, chunk) {
    return [
        'BF.LOADCHUNK',
        key,
        iteretor.toString(),
        chunk
    ];
}
exports.transformArguments = transformArguments;
}),
"[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/bloom/MADD.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformReply = exports.transformArguments = exports.FIRST_KEY_INDEX = void 0;
exports.FIRST_KEY_INDEX = 1;
function transformArguments(key, items) {
    return [
        'BF.MADD',
        key,
        ...items
    ];
}
exports.transformArguments = transformArguments;
var generic_transformers_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/client/dist/lib/commands/generic-transformers.js [app-client] (ecmascript)");
Object.defineProperty(exports, "transformReply", {
    enumerable: true,
    get: function() {
        return generic_transformers_1.transformBooleanArrayReply;
    }
});
}),
"[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/bloom/MEXISTS.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformReply = exports.transformArguments = exports.IS_READ_ONLY = exports.FIRST_KEY_INDEX = void 0;
exports.FIRST_KEY_INDEX = 1;
exports.IS_READ_ONLY = true;
function transformArguments(key, items) {
    return [
        'BF.MEXISTS',
        key,
        ...items
    ];
}
exports.transformArguments = transformArguments;
var generic_transformers_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/client/dist/lib/commands/generic-transformers.js [app-client] (ecmascript)");
Object.defineProperty(exports, "transformReply", {
    enumerable: true,
    get: function() {
        return generic_transformers_1.transformBooleanArrayReply;
    }
});
}),
"[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/bloom/RESERVE.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformArguments = exports.FIRST_KEY_INDEX = void 0;
exports.FIRST_KEY_INDEX = 1;
function transformArguments(key, errorRate, capacity, options) {
    const args = [
        'BF.RESERVE',
        key,
        errorRate.toString(),
        capacity.toString()
    ];
    if (options === null || options === void 0 ? void 0 : options.EXPANSION) {
        args.push('EXPANSION', options.EXPANSION.toString());
    }
    if (options === null || options === void 0 ? void 0 : options.NONSCALING) {
        args.push('NONSCALING');
    }
    return args;
}
exports.transformArguments = transformArguments;
}),
"[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/bloom/SCANDUMP.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformReply = exports.transformArguments = exports.IS_READ_ONLY = exports.FIRST_KEY_INDEX = void 0;
exports.FIRST_KEY_INDEX = 1;
exports.IS_READ_ONLY = true;
function transformArguments(key, iterator) {
    return [
        'BF.SCANDUMP',
        key,
        iterator.toString()
    ];
}
exports.transformArguments = transformArguments;
function transformReply(param) {
    let [iterator, chunk] = param;
    return {
        iterator,
        chunk
    };
}
exports.transformReply = transformReply;
}),
"[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/bloom/index.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
const ADD = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/bloom/ADD.js [app-client] (ecmascript)");
const CARD = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/bloom/CARD.js [app-client] (ecmascript)");
const EXISTS = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/bloom/EXISTS.js [app-client] (ecmascript)");
const INFO = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/bloom/INFO.js [app-client] (ecmascript)");
const INSERT = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/bloom/INSERT.js [app-client] (ecmascript)");
const LOADCHUNK = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/bloom/LOADCHUNK.js [app-client] (ecmascript)");
const MADD = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/bloom/MADD.js [app-client] (ecmascript)");
const MEXISTS = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/bloom/MEXISTS.js [app-client] (ecmascript)");
const RESERVE = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/bloom/RESERVE.js [app-client] (ecmascript)");
const SCANDUMP = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/bloom/SCANDUMP.js [app-client] (ecmascript)");
exports.default = {
    ADD,
    add: ADD,
    CARD,
    card: CARD,
    EXISTS,
    exists: EXISTS,
    INFO,
    info: INFO,
    INSERT,
    insert: INSERT,
    LOADCHUNK,
    loadChunk: LOADCHUNK,
    MADD,
    mAdd: MADD,
    MEXISTS,
    mExists: MEXISTS,
    RESERVE,
    reserve: RESERVE,
    SCANDUMP,
    scanDump: SCANDUMP
};
}),
"[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/count-min-sketch/INCRBY.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformArguments = exports.FIRST_KEY_INDEX = void 0;
exports.FIRST_KEY_INDEX = 1;
function transformArguments(key, items) {
    const args = [
        'CMS.INCRBY',
        key
    ];
    if (Array.isArray(items)) {
        for (const item of items){
            pushIncrByItem(args, item);
        }
    } else {
        pushIncrByItem(args, items);
    }
    return args;
}
exports.transformArguments = transformArguments;
function pushIncrByItem(args, param) {
    let { item, incrementBy } = param;
    args.push(item, incrementBy.toString());
}
}),
"[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/count-min-sketch/INFO.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformReply = exports.transformArguments = exports.IS_READ_ONLY = exports.FIRST_KEY_INDEX = void 0;
exports.FIRST_KEY_INDEX = 1;
exports.IS_READ_ONLY = true;
function transformArguments(key) {
    return [
        'CMS.INFO',
        key
    ];
}
exports.transformArguments = transformArguments;
function transformReply(reply) {
    return {
        width: reply[1],
        depth: reply[3],
        count: reply[5]
    };
}
exports.transformReply = transformReply;
}),
"[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/count-min-sketch/INITBYDIM.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformArguments = exports.FIRST_KEY_INDEX = void 0;
exports.FIRST_KEY_INDEX = 1;
function transformArguments(key, width, depth) {
    return [
        'CMS.INITBYDIM',
        key,
        width.toString(),
        depth.toString()
    ];
}
exports.transformArguments = transformArguments;
}),
"[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/count-min-sketch/INITBYPROB.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformArguments = exports.FIRST_KEY_INDEX = void 0;
exports.FIRST_KEY_INDEX = 1;
function transformArguments(key, error, probability) {
    return [
        'CMS.INITBYPROB',
        key,
        error.toString(),
        probability.toString()
    ];
}
exports.transformArguments = transformArguments;
}),
"[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/count-min-sketch/MERGE.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformArguments = exports.FIRST_KEY_INDEX = void 0;
exports.FIRST_KEY_INDEX = 1;
function transformArguments(dest, src) {
    const args = [
        'CMS.MERGE',
        dest,
        src.length.toString()
    ];
    if (isStringSketches(src)) {
        args.push(...src);
    } else {
        for (const sketch of src){
            args.push(sketch.name);
        }
        args.push('WEIGHTS');
        for (const sketch of src){
            args.push(sketch.weight.toString());
        }
    }
    return args;
}
exports.transformArguments = transformArguments;
function isStringSketches(src) {
    return typeof src[0] === 'string';
}
}),
"[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/count-min-sketch/QUERY.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformArguments = exports.IS_READ_ONLY = exports.FIRST_KEY_INDEX = void 0;
const generic_transformers_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/client/dist/lib/commands/generic-transformers.js [app-client] (ecmascript)");
exports.FIRST_KEY_INDEX = 1;
exports.IS_READ_ONLY = true;
function transformArguments(key, items) {
    return (0, generic_transformers_1.pushVerdictArguments)([
        'CMS.QUERY',
        key
    ], items);
}
exports.transformArguments = transformArguments;
}),
"[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/count-min-sketch/index.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
const INCRBY = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/count-min-sketch/INCRBY.js [app-client] (ecmascript)");
const INFO = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/count-min-sketch/INFO.js [app-client] (ecmascript)");
const INITBYDIM = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/count-min-sketch/INITBYDIM.js [app-client] (ecmascript)");
const INITBYPROB = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/count-min-sketch/INITBYPROB.js [app-client] (ecmascript)");
const MERGE = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/count-min-sketch/MERGE.js [app-client] (ecmascript)");
const QUERY = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/count-min-sketch/QUERY.js [app-client] (ecmascript)");
exports.default = {
    INCRBY,
    incrBy: INCRBY,
    INFO,
    info: INFO,
    INITBYDIM,
    initByDim: INITBYDIM,
    INITBYPROB,
    initByProb: INITBYPROB,
    MERGE,
    merge: MERGE,
    QUERY,
    query: QUERY
};
}),
"[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/cuckoo/ADD.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformReply = exports.transformArguments = exports.FIRST_KEY_INDEX = void 0;
exports.FIRST_KEY_INDEX = 1;
function transformArguments(key, item) {
    return [
        'CF.ADD',
        key,
        item
    ];
}
exports.transformArguments = transformArguments;
var generic_transformers_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/client/dist/lib/commands/generic-transformers.js [app-client] (ecmascript)");
Object.defineProperty(exports, "transformReply", {
    enumerable: true,
    get: function() {
        return generic_transformers_1.transformBooleanReply;
    }
});
}),
"[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/cuckoo/ADDNX.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformReply = exports.transformArguments = exports.FIRST_KEY_INDEX = void 0;
exports.FIRST_KEY_INDEX = 1;
function transformArguments(key, item) {
    return [
        'CF.ADDNX',
        key,
        item
    ];
}
exports.transformArguments = transformArguments;
var generic_transformers_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/client/dist/lib/commands/generic-transformers.js [app-client] (ecmascript)");
Object.defineProperty(exports, "transformReply", {
    enumerable: true,
    get: function() {
        return generic_transformers_1.transformBooleanReply;
    }
});
}),
"[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/cuckoo/COUNT.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformArguments = exports.FIRST_KEY_INDEX = void 0;
exports.FIRST_KEY_INDEX = 1;
function transformArguments(key, item) {
    return [
        'CF.COUNT',
        key,
        item
    ];
}
exports.transformArguments = transformArguments;
}),
"[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/cuckoo/DEL.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformReply = exports.transformArguments = exports.FIRST_KEY_INDEX = void 0;
exports.FIRST_KEY_INDEX = 1;
function transformArguments(key, item) {
    return [
        'CF.DEL',
        key,
        item
    ];
}
exports.transformArguments = transformArguments;
var generic_transformers_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/client/dist/lib/commands/generic-transformers.js [app-client] (ecmascript)");
Object.defineProperty(exports, "transformReply", {
    enumerable: true,
    get: function() {
        return generic_transformers_1.transformBooleanReply;
    }
});
}),
"[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/cuckoo/EXISTS.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformReply = exports.transformArguments = exports.IS_READ_ONLY = exports.FIRST_KEY_INDEX = void 0;
exports.FIRST_KEY_INDEX = 1;
exports.IS_READ_ONLY = true;
function transformArguments(key, item) {
    return [
        'CF.EXISTS',
        key,
        item
    ];
}
exports.transformArguments = transformArguments;
var generic_transformers_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/client/dist/lib/commands/generic-transformers.js [app-client] (ecmascript)");
Object.defineProperty(exports, "transformReply", {
    enumerable: true,
    get: function() {
        return generic_transformers_1.transformBooleanReply;
    }
});
}),
"[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/cuckoo/INFO.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformReply = exports.transformArguments = exports.IS_READ_ONLY = exports.FIRST_KEY_INDEX = void 0;
exports.FIRST_KEY_INDEX = 1;
exports.IS_READ_ONLY = true;
function transformArguments(key) {
    return [
        'CF.INFO',
        key
    ];
}
exports.transformArguments = transformArguments;
function transformReply(reply) {
    return {
        size: reply[1],
        numberOfBuckets: reply[3],
        numberOfFilters: reply[5],
        numberOfInsertedItems: reply[7],
        numberOfDeletedItems: reply[9],
        bucketSize: reply[11],
        expansionRate: reply[13],
        maxIteration: reply[15]
    };
}
exports.transformReply = transformReply;
}),
"[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/cuckoo/INSERT.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformReply = exports.transformArguments = exports.FIRST_KEY_INDEX = void 0;
const _1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/cuckoo/index.js [app-client] (ecmascript)");
exports.FIRST_KEY_INDEX = 1;
function transformArguments(key, items, options) {
    return (0, _1.pushInsertOptions)([
        'CF.INSERT',
        key
    ], items, options);
}
exports.transformArguments = transformArguments;
var generic_transformers_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/client/dist/lib/commands/generic-transformers.js [app-client] (ecmascript)");
Object.defineProperty(exports, "transformReply", {
    enumerable: true,
    get: function() {
        return generic_transformers_1.transformBooleanArrayReply;
    }
});
}),
"[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/cuckoo/INSERTNX.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformReply = exports.transformArguments = exports.FIRST_KEY_INDEX = void 0;
const _1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/cuckoo/index.js [app-client] (ecmascript)");
exports.FIRST_KEY_INDEX = 1;
function transformArguments(key, items, options) {
    return (0, _1.pushInsertOptions)([
        'CF.INSERTNX',
        key
    ], items, options);
}
exports.transformArguments = transformArguments;
var generic_transformers_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/client/dist/lib/commands/generic-transformers.js [app-client] (ecmascript)");
Object.defineProperty(exports, "transformReply", {
    enumerable: true,
    get: function() {
        return generic_transformers_1.transformBooleanArrayReply;
    }
});
}),
"[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/cuckoo/LOADCHUNK.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformArguments = exports.FIRST_KEY_INDEX = void 0;
exports.FIRST_KEY_INDEX = 1;
function transformArguments(key, iterator, chunk) {
    return [
        'CF.LOADCHUNK',
        key,
        iterator.toString(),
        chunk
    ];
}
exports.transformArguments = transformArguments;
}),
"[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/cuckoo/RESERVE.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformArguments = exports.FIRST_KEY_INDEX = void 0;
exports.FIRST_KEY_INDEX = 1;
function transformArguments(key, capacity, options) {
    const args = [
        'CF.RESERVE',
        key,
        capacity.toString()
    ];
    if (options === null || options === void 0 ? void 0 : options.BUCKETSIZE) {
        args.push('BUCKETSIZE', options.BUCKETSIZE.toString());
    }
    if (options === null || options === void 0 ? void 0 : options.MAXITERATIONS) {
        args.push('MAXITERATIONS', options.MAXITERATIONS.toString());
    }
    if (options === null || options === void 0 ? void 0 : options.EXPANSION) {
        args.push('EXPANSION', options.EXPANSION.toString());
    }
    return args;
}
exports.transformArguments = transformArguments;
}),
"[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/cuckoo/SCANDUMP.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformReply = exports.transformArguments = exports.FIRST_KEY_INDEX = void 0;
exports.FIRST_KEY_INDEX = 1;
function transformArguments(key, iterator) {
    return [
        'CF.SCANDUMP',
        key,
        iterator.toString()
    ];
}
exports.transformArguments = transformArguments;
function transformReply(param) {
    let [iterator, chunk] = param;
    return {
        iterator,
        chunk
    };
}
exports.transformReply = transformReply;
}),
"[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/cuckoo/index.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.pushInsertOptions = void 0;
const ADD = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/cuckoo/ADD.js [app-client] (ecmascript)");
const ADDNX = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/cuckoo/ADDNX.js [app-client] (ecmascript)");
const COUNT = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/cuckoo/COUNT.js [app-client] (ecmascript)");
const DEL = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/cuckoo/DEL.js [app-client] (ecmascript)");
const EXISTS = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/cuckoo/EXISTS.js [app-client] (ecmascript)");
const INFO = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/cuckoo/INFO.js [app-client] (ecmascript)");
const INSERT = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/cuckoo/INSERT.js [app-client] (ecmascript)");
const INSERTNX = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/cuckoo/INSERTNX.js [app-client] (ecmascript)");
const LOADCHUNK = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/cuckoo/LOADCHUNK.js [app-client] (ecmascript)");
const RESERVE = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/cuckoo/RESERVE.js [app-client] (ecmascript)");
const SCANDUMP = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/cuckoo/SCANDUMP.js [app-client] (ecmascript)");
const generic_transformers_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/client/dist/lib/commands/generic-transformers.js [app-client] (ecmascript)");
exports.default = {
    ADD,
    add: ADD,
    ADDNX,
    addNX: ADDNX,
    COUNT,
    count: COUNT,
    DEL,
    del: DEL,
    EXISTS,
    exists: EXISTS,
    INFO,
    info: INFO,
    INSERT,
    insert: INSERT,
    INSERTNX,
    insertNX: INSERTNX,
    LOADCHUNK,
    loadChunk: LOADCHUNK,
    RESERVE,
    reserve: RESERVE,
    SCANDUMP,
    scanDump: SCANDUMP
};
function pushInsertOptions(args, items, options) {
    if (options === null || options === void 0 ? void 0 : options.CAPACITY) {
        args.push('CAPACITY');
        args.push(options.CAPACITY.toString());
    }
    if (options === null || options === void 0 ? void 0 : options.NOCREATE) {
        args.push('NOCREATE');
    }
    args.push('ITEMS');
    return (0, generic_transformers_1.pushVerdictArguments)(args, items);
}
exports.pushInsertOptions = pushInsertOptions;
}),
"[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/t-digest/ADD.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformArguments = exports.FIRST_KEY_INDEX = void 0;
exports.FIRST_KEY_INDEX = 1;
function transformArguments(key, values) {
    const args = [
        'TDIGEST.ADD',
        key
    ];
    for (const item of values){
        args.push(item.toString());
    }
    return args;
}
exports.transformArguments = transformArguments;
}),
"[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/t-digest/BYRANK.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformReply = exports.transformArguments = exports.IS_READ_ONLY = exports.FIRST_KEY_INDEX = void 0;
exports.FIRST_KEY_INDEX = 1;
exports.IS_READ_ONLY = true;
function transformArguments(key, ranks) {
    const args = [
        'TDIGEST.BYRANK',
        key
    ];
    for (const rank of ranks){
        args.push(rank.toString());
    }
    return args;
}
exports.transformArguments = transformArguments;
var _1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/t-digest/index.js [app-client] (ecmascript)");
Object.defineProperty(exports, "transformReply", {
    enumerable: true,
    get: function() {
        return _1.transformDoublesReply;
    }
});
}),
"[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/t-digest/BYREVRANK.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformReply = exports.transformArguments = exports.IS_READ_ONLY = exports.FIRST_KEY_INDEX = void 0;
exports.FIRST_KEY_INDEX = 1;
exports.IS_READ_ONLY = true;
function transformArguments(key, ranks) {
    const args = [
        'TDIGEST.BYREVRANK',
        key
    ];
    for (const rank of ranks){
        args.push(rank.toString());
    }
    return args;
}
exports.transformArguments = transformArguments;
var _1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/t-digest/index.js [app-client] (ecmascript)");
Object.defineProperty(exports, "transformReply", {
    enumerable: true,
    get: function() {
        return _1.transformDoublesReply;
    }
});
}),
"[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/t-digest/CDF.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformReply = exports.transformArguments = exports.IS_READ_ONLY = exports.FIRST_KEY_INDEX = void 0;
exports.FIRST_KEY_INDEX = 1;
exports.IS_READ_ONLY = true;
function transformArguments(key, values) {
    const args = [
        'TDIGEST.CDF',
        key
    ];
    for (const item of values){
        args.push(item.toString());
    }
    return args;
}
exports.transformArguments = transformArguments;
var _1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/t-digest/index.js [app-client] (ecmascript)");
Object.defineProperty(exports, "transformReply", {
    enumerable: true,
    get: function() {
        return _1.transformDoublesReply;
    }
});
}),
"[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/t-digest/CREATE.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformArguments = exports.FIRST_KEY_INDEX = void 0;
const _1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/t-digest/index.js [app-client] (ecmascript)");
exports.FIRST_KEY_INDEX = 1;
function transformArguments(key, options) {
    return (0, _1.pushCompressionArgument)([
        'TDIGEST.CREATE',
        key
    ], options);
}
exports.transformArguments = transformArguments;
}),
"[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/t-digest/INFO.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformReply = exports.transformArguments = exports.IS_READ_ONLY = exports.FIRST_KEY_INDEX = void 0;
exports.FIRST_KEY_INDEX = 1;
exports.IS_READ_ONLY = true;
function transformArguments(key) {
    return [
        'TDIGEST.INFO',
        key
    ];
}
exports.transformArguments = transformArguments;
function transformReply(reply) {
    return {
        comperssion: reply[1],
        capacity: reply[3],
        mergedNodes: reply[5],
        unmergedNodes: reply[7],
        mergedWeight: Number(reply[9]),
        unmergedWeight: Number(reply[11]),
        totalCompression: reply[13]
    };
}
exports.transformReply = transformReply;
}),
"[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/t-digest/MAX.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformReply = exports.transformArguments = exports.IS_READ_ONLY = exports.FIRST_KEY_INDEX = void 0;
exports.FIRST_KEY_INDEX = 1;
exports.IS_READ_ONLY = true;
function transformArguments(key) {
    return [
        'TDIGEST.MAX',
        key
    ];
}
exports.transformArguments = transformArguments;
var _1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/t-digest/index.js [app-client] (ecmascript)");
Object.defineProperty(exports, "transformReply", {
    enumerable: true,
    get: function() {
        return _1.transformDoubleReply;
    }
});
}),
"[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/t-digest/MERGE.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformArguments = exports.FIRST_KEY_INDEX = void 0;
const generic_transformers_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/client/dist/lib/commands/generic-transformers.js [app-client] (ecmascript)");
const _1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/t-digest/index.js [app-client] (ecmascript)");
exports.FIRST_KEY_INDEX = 1;
function transformArguments(destKey, srcKeys, options) {
    const args = (0, generic_transformers_1.pushVerdictArgument)([
        'TDIGEST.MERGE',
        destKey
    ], srcKeys);
    (0, _1.pushCompressionArgument)(args, options);
    if (options === null || options === void 0 ? void 0 : options.OVERRIDE) {
        args.push('OVERRIDE');
    }
    return args;
}
exports.transformArguments = transformArguments;
}),
"[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/t-digest/MIN.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformReply = exports.transformArguments = exports.IS_READ_ONLY = exports.FIRST_KEY_INDEX = void 0;
exports.FIRST_KEY_INDEX = 1;
exports.IS_READ_ONLY = true;
function transformArguments(key) {
    return [
        'TDIGEST.MIN',
        key
    ];
}
exports.transformArguments = transformArguments;
var _1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/t-digest/index.js [app-client] (ecmascript)");
Object.defineProperty(exports, "transformReply", {
    enumerable: true,
    get: function() {
        return _1.transformDoubleReply;
    }
});
}),
"[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/t-digest/QUANTILE.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformReply = exports.transformArguments = exports.IS_READ_ONLY = exports.FIRST_KEY_INDEX = void 0;
exports.FIRST_KEY_INDEX = 1;
exports.IS_READ_ONLY = true;
function transformArguments(key, quantiles) {
    const args = [
        'TDIGEST.QUANTILE',
        key
    ];
    for (const quantile of quantiles){
        args.push(quantile.toString());
    }
    return args;
}
exports.transformArguments = transformArguments;
var _1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/t-digest/index.js [app-client] (ecmascript)");
Object.defineProperty(exports, "transformReply", {
    enumerable: true,
    get: function() {
        return _1.transformDoublesReply;
    }
});
}),
"[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/t-digest/RANK.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformArguments = exports.IS_READ_ONLY = exports.FIRST_KEY_INDEX = void 0;
exports.FIRST_KEY_INDEX = 1;
exports.IS_READ_ONLY = true;
function transformArguments(key, values) {
    const args = [
        'TDIGEST.RANK',
        key
    ];
    for (const item of values){
        args.push(item.toString());
    }
    return args;
}
exports.transformArguments = transformArguments;
}),
"[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/t-digest/RESET.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformArguments = exports.FIRST_KEY_INDEX = void 0;
exports.FIRST_KEY_INDEX = 1;
function transformArguments(key) {
    return [
        'TDIGEST.RESET',
        key
    ];
}
exports.transformArguments = transformArguments;
}),
"[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/t-digest/REVRANK.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformArguments = exports.IS_READ_ONLY = exports.FIRST_KEY_INDEX = void 0;
exports.FIRST_KEY_INDEX = 1;
exports.IS_READ_ONLY = true;
function transformArguments(key, values) {
    const args = [
        'TDIGEST.REVRANK',
        key
    ];
    for (const item of values){
        args.push(item.toString());
    }
    return args;
}
exports.transformArguments = transformArguments;
}),
"[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/t-digest/TRIMMED_MEAN.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformReply = exports.transformArguments = exports.IS_READ_ONLY = exports.FIRST_KEY_INDEX = void 0;
exports.FIRST_KEY_INDEX = 1;
exports.IS_READ_ONLY = true;
function transformArguments(key, lowCutPercentile, highCutPercentile) {
    return [
        'TDIGEST.TRIMMED_MEAN',
        key,
        lowCutPercentile.toString(),
        highCutPercentile.toString()
    ];
}
exports.transformArguments = transformArguments;
var _1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/t-digest/index.js [app-client] (ecmascript)");
Object.defineProperty(exports, "transformReply", {
    enumerable: true,
    get: function() {
        return _1.transformDoubleReply;
    }
});
}),
"[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/t-digest/index.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformDoublesReply = exports.transformDoubleReply = exports.pushCompressionArgument = void 0;
const ADD = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/t-digest/ADD.js [app-client] (ecmascript)");
const BYRANK = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/t-digest/BYRANK.js [app-client] (ecmascript)");
const BYREVRANK = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/t-digest/BYREVRANK.js [app-client] (ecmascript)");
const CDF = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/t-digest/CDF.js [app-client] (ecmascript)");
const CREATE = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/t-digest/CREATE.js [app-client] (ecmascript)");
const INFO = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/t-digest/INFO.js [app-client] (ecmascript)");
const MAX = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/t-digest/MAX.js [app-client] (ecmascript)");
const MERGE = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/t-digest/MERGE.js [app-client] (ecmascript)");
const MIN = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/t-digest/MIN.js [app-client] (ecmascript)");
const QUANTILE = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/t-digest/QUANTILE.js [app-client] (ecmascript)");
const RANK = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/t-digest/RANK.js [app-client] (ecmascript)");
const RESET = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/t-digest/RESET.js [app-client] (ecmascript)");
const REVRANK = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/t-digest/REVRANK.js [app-client] (ecmascript)");
const TRIMMED_MEAN = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/t-digest/TRIMMED_MEAN.js [app-client] (ecmascript)");
exports.default = {
    ADD,
    add: ADD,
    BYRANK,
    byRank: BYRANK,
    BYREVRANK,
    byRevRank: BYREVRANK,
    CDF,
    cdf: CDF,
    CREATE,
    create: CREATE,
    INFO,
    info: INFO,
    MAX,
    max: MAX,
    MERGE,
    merge: MERGE,
    MIN,
    min: MIN,
    QUANTILE,
    quantile: QUANTILE,
    RANK,
    rank: RANK,
    RESET,
    reset: RESET,
    REVRANK,
    revRank: REVRANK,
    TRIMMED_MEAN,
    trimmedMean: TRIMMED_MEAN
};
function pushCompressionArgument(args, options) {
    if (options === null || options === void 0 ? void 0 : options.COMPRESSION) {
        args.push('COMPRESSION', options.COMPRESSION.toString());
    }
    return args;
}
exports.pushCompressionArgument = pushCompressionArgument;
function transformDoubleReply(reply) {
    switch(reply){
        case 'inf':
            return Infinity;
        case '-inf':
            return -Infinity;
        case 'nan':
            return NaN;
        default:
            return parseFloat(reply);
    }
}
exports.transformDoubleReply = transformDoubleReply;
function transformDoublesReply(reply) {
    return reply.map(transformDoubleReply);
}
exports.transformDoublesReply = transformDoublesReply;
}),
"[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/top-k/ADD.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformArguments = exports.FIRST_KEY_INDEX = void 0;
const generic_transformers_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/client/dist/lib/commands/generic-transformers.js [app-client] (ecmascript)");
exports.FIRST_KEY_INDEX = 1;
function transformArguments(key, items) {
    return (0, generic_transformers_1.pushVerdictArguments)([
        'TOPK.ADD',
        key
    ], items);
}
exports.transformArguments = transformArguments;
}),
"[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/top-k/COUNT.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformArguments = exports.IS_READ_ONLY = exports.FIRST_KEY_INDEX = void 0;
const generic_transformers_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/client/dist/lib/commands/generic-transformers.js [app-client] (ecmascript)");
exports.FIRST_KEY_INDEX = 1;
exports.IS_READ_ONLY = true;
function transformArguments(key, items) {
    return (0, generic_transformers_1.pushVerdictArguments)([
        'TOPK.COUNT',
        key
    ], items);
}
exports.transformArguments = transformArguments;
}),
"[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/top-k/INCRBY.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformArguments = exports.FIRST_KEY_INDEX = void 0;
exports.FIRST_KEY_INDEX = 1;
function transformArguments(key, items) {
    const args = [
        'TOPK.INCRBY',
        key
    ];
    if (Array.isArray(items)) {
        for (const item of items){
            pushIncrByItem(args, item);
        }
    } else {
        pushIncrByItem(args, items);
    }
    return args;
}
exports.transformArguments = transformArguments;
function pushIncrByItem(args, param) {
    let { item, incrementBy } = param;
    args.push(item, incrementBy.toString());
}
}),
"[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/top-k/INFO.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformReply = exports.transformArguments = exports.IS_READ_ONLY = exports.FIRST_KEY_INDEX = void 0;
exports.FIRST_KEY_INDEX = 1;
exports.IS_READ_ONLY = true;
function transformArguments(key) {
    return [
        'TOPK.INFO',
        key
    ];
}
exports.transformArguments = transformArguments;
function transformReply(reply) {
    return {
        k: reply[1],
        width: reply[3],
        depth: reply[5],
        decay: Number(reply[7])
    };
}
exports.transformReply = transformReply;
}),
"[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/top-k/LIST_WITHCOUNT.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformReply = exports.transformArguments = exports.IS_READ_ONLY = exports.FIRST_KEY_INDEX = void 0;
exports.FIRST_KEY_INDEX = 1;
exports.IS_READ_ONLY = true;
function transformArguments(key) {
    return [
        'TOPK.LIST',
        key,
        'WITHCOUNT'
    ];
}
exports.transformArguments = transformArguments;
function transformReply(rawReply) {
    const reply = [];
    for(let i = 0; i < rawReply.length; i++){
        reply.push({
            item: rawReply[i],
            count: rawReply[++i]
        });
    }
    return reply;
}
exports.transformReply = transformReply;
}),
"[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/top-k/LIST.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformArguments = exports.IS_READ_ONLY = exports.FIRST_KEY_INDEX = void 0;
exports.FIRST_KEY_INDEX = 1;
exports.IS_READ_ONLY = true;
function transformArguments(key) {
    return [
        'TOPK.LIST',
        key
    ];
}
exports.transformArguments = transformArguments;
}),
"[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/top-k/QUERY.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformArguments = exports.IS_READ_ONLY = exports.FIRST_KEY_INDEX = void 0;
const generic_transformers_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/client/dist/lib/commands/generic-transformers.js [app-client] (ecmascript)");
exports.FIRST_KEY_INDEX = 1;
exports.IS_READ_ONLY = true;
function transformArguments(key, items) {
    return (0, generic_transformers_1.pushVerdictArguments)([
        'TOPK.QUERY',
        key
    ], items);
}
exports.transformArguments = transformArguments;
}),
"[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/top-k/RESERVE.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformArguments = exports.IS_READ_ONLY = exports.FIRST_KEY_INDEX = void 0;
exports.FIRST_KEY_INDEX = 1;
exports.IS_READ_ONLY = true;
function transformArguments(key, topK, options) {
    const args = [
        'TOPK.RESERVE',
        key,
        topK.toString()
    ];
    if (options) {
        args.push(options.width.toString(), options.depth.toString(), options.decay.toString());
    }
    return args;
}
exports.transformArguments = transformArguments;
}),
"[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/top-k/index.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
const ADD = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/top-k/ADD.js [app-client] (ecmascript)");
const COUNT = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/top-k/COUNT.js [app-client] (ecmascript)");
const INCRBY = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/top-k/INCRBY.js [app-client] (ecmascript)");
const INFO = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/top-k/INFO.js [app-client] (ecmascript)");
const LIST_WITHCOUNT = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/top-k/LIST_WITHCOUNT.js [app-client] (ecmascript)");
const LIST = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/top-k/LIST.js [app-client] (ecmascript)");
const QUERY = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/top-k/QUERY.js [app-client] (ecmascript)");
const RESERVE = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/top-k/RESERVE.js [app-client] (ecmascript)");
exports.default = {
    ADD,
    add: ADD,
    COUNT,
    count: COUNT,
    INCRBY,
    incrBy: INCRBY,
    INFO,
    info: INFO,
    LIST_WITHCOUNT,
    listWithCount: LIST_WITHCOUNT,
    LIST,
    list: LIST,
    QUERY,
    query: QUERY,
    RESERVE,
    reserve: RESERVE
};
}),
"[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/index.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
const bloom_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/bloom/index.js [app-client] (ecmascript)");
const count_min_sketch_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/count-min-sketch/index.js [app-client] (ecmascript)");
const cuckoo_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/cuckoo/index.js [app-client] (ecmascript)");
const t_digest_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/t-digest/index.js [app-client] (ecmascript)");
const top_k_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/top-k/index.js [app-client] (ecmascript)");
exports.default = {
    bf: bloom_1.default,
    cms: count_min_sketch_1.default,
    cf: cuckoo_1.default,
    tDigest: t_digest_1.default,
    topK: top_k_1.default
};
}),
"[project]/dawg-ai/node_modules/@redis/bloom/dist/index.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = void 0;
var commands_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/bloom/dist/commands/index.js [app-client] (ecmascript)");
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return commands_1.default;
    }
});
}),
"[project]/dawg-ai/node_modules/@redis/graph/dist/commands/CONFIG_GET.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformArguments = exports.IS_READ_ONLY = void 0;
exports.IS_READ_ONLY = true;
function transformArguments(configKey) {
    return [
        'GRAPH.CONFIG',
        'GET',
        configKey
    ];
}
exports.transformArguments = transformArguments;
}),
"[project]/dawg-ai/node_modules/@redis/graph/dist/commands/CONFIG_SET.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformArguments = void 0;
function transformArguments(configKey, value) {
    return [
        'GRAPH.CONFIG',
        'SET',
        configKey,
        value.toString()
    ];
}
exports.transformArguments = transformArguments;
}),
"[project]/dawg-ai/node_modules/@redis/graph/dist/commands/DELETE.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformArguments = exports.FIRST_KEY_INDEX = void 0;
exports.FIRST_KEY_INDEX = 1;
function transformArguments(key) {
    return [
        'GRAPH.DELETE',
        key
    ];
}
exports.transformArguments = transformArguments;
}),
"[project]/dawg-ai/node_modules/@redis/graph/dist/commands/EXPLAIN.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformArguments = exports.IS_READ_ONLY = exports.FIRST_KEY_INDEX = void 0;
exports.FIRST_KEY_INDEX = 1;
exports.IS_READ_ONLY = true;
function transformArguments(key, query) {
    return [
        'GRAPH.EXPLAIN',
        key,
        query
    ];
}
exports.transformArguments = transformArguments;
}),
"[project]/dawg-ai/node_modules/@redis/graph/dist/commands/LIST.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformArguments = exports.IS_READ_ONLY = void 0;
exports.IS_READ_ONLY = true;
function transformArguments() {
    return [
        'GRAPH.LIST'
    ];
}
exports.transformArguments = transformArguments;
}),
"[project]/dawg-ai/node_modules/@redis/graph/dist/commands/PROFILE.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformArguments = exports.IS_READ_ONLY = exports.FIRST_KEY_INDEX = void 0;
exports.FIRST_KEY_INDEX = 1;
exports.IS_READ_ONLY = true;
function transformArguments(key, query) {
    return [
        'GRAPH.PROFILE',
        key,
        query
    ];
}
exports.transformArguments = transformArguments;
}),
"[project]/dawg-ai/node_modules/@redis/graph/dist/commands/QUERY.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformReply = exports.transformArguments = exports.FIRST_KEY_INDEX = void 0;
const _1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/graph/dist/commands/index.js [app-client] (ecmascript)");
exports.FIRST_KEY_INDEX = 1;
function transformArguments(graph, query, options, compact) {
    return (0, _1.pushQueryArguments)([
        'GRAPH.QUERY'
    ], graph, query, options, compact);
}
exports.transformArguments = transformArguments;
function transformReply(reply) {
    return reply.length === 1 ? {
        headers: undefined,
        data: undefined,
        metadata: reply[0]
    } : {
        headers: reply[0],
        data: reply[1],
        metadata: reply[2]
    };
}
exports.transformReply = transformReply;
}),
"[project]/dawg-ai/node_modules/@redis/graph/dist/commands/RO_QUERY.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformReply = exports.transformArguments = exports.IS_READ_ONLY = exports.FIRST_KEY_INDEX = void 0;
const _1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/graph/dist/commands/index.js [app-client] (ecmascript)");
var QUERY_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/graph/dist/commands/QUERY.js [app-client] (ecmascript)");
Object.defineProperty(exports, "FIRST_KEY_INDEX", {
    enumerable: true,
    get: function() {
        return QUERY_1.FIRST_KEY_INDEX;
    }
});
exports.IS_READ_ONLY = true;
function transformArguments(graph, query, options, compact) {
    return (0, _1.pushQueryArguments)([
        'GRAPH.RO_QUERY'
    ], graph, query, options, compact);
}
exports.transformArguments = transformArguments;
var QUERY_2 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/graph/dist/commands/QUERY.js [app-client] (ecmascript)");
Object.defineProperty(exports, "transformReply", {
    enumerable: true,
    get: function() {
        return QUERY_2.transformReply;
    }
});
}),
"[project]/dawg-ai/node_modules/@redis/graph/dist/commands/SLOWLOG.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformReply = exports.transformArguments = exports.FIRST_KEY_INDEX = exports.IS_READ_ONLY = void 0;
exports.IS_READ_ONLY = true;
exports.FIRST_KEY_INDEX = 1;
function transformArguments(key) {
    return [
        'GRAPH.SLOWLOG',
        key
    ];
}
exports.transformArguments = transformArguments;
function transformReply(logs) {
    return logs.map((param)=>{
        let [timestamp, command, query, took] = param;
        return {
            timestamp: new Date(Number(timestamp) * 1000),
            command,
            query,
            took: Number(took)
        };
    });
}
exports.transformReply = transformReply;
}),
"[project]/dawg-ai/node_modules/@redis/graph/dist/commands/index.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.pushQueryArguments = void 0;
const CONFIG_GET = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/graph/dist/commands/CONFIG_GET.js [app-client] (ecmascript)");
const CONFIG_SET = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/graph/dist/commands/CONFIG_SET.js [app-client] (ecmascript)");
;
const DELETE = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/graph/dist/commands/DELETE.js [app-client] (ecmascript)");
const EXPLAIN = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/graph/dist/commands/EXPLAIN.js [app-client] (ecmascript)");
const LIST = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/graph/dist/commands/LIST.js [app-client] (ecmascript)");
const PROFILE = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/graph/dist/commands/PROFILE.js [app-client] (ecmascript)");
const QUERY = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/graph/dist/commands/QUERY.js [app-client] (ecmascript)");
const RO_QUERY = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/graph/dist/commands/RO_QUERY.js [app-client] (ecmascript)");
const SLOWLOG = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/graph/dist/commands/SLOWLOG.js [app-client] (ecmascript)");
exports.default = {
    CONFIG_GET,
    configGet: CONFIG_GET,
    CONFIG_SET,
    configSet: CONFIG_SET,
    DELETE,
    delete: DELETE,
    EXPLAIN,
    explain: EXPLAIN,
    LIST,
    list: LIST,
    PROFILE,
    profile: PROFILE,
    QUERY,
    query: QUERY,
    RO_QUERY,
    roQuery: RO_QUERY,
    SLOWLOG,
    slowLog: SLOWLOG
};
function pushQueryArguments(args, graph, query, options, compact) {
    args.push(graph);
    if (typeof options === 'number') {
        args.push(query);
        pushTimeout(args, options);
    } else {
        args.push((options === null || options === void 0 ? void 0 : options.params) ? "CYPHER ".concat(queryParamsToString(options.params), " ").concat(query) : query);
        if ((options === null || options === void 0 ? void 0 : options.TIMEOUT) !== undefined) {
            pushTimeout(args, options.TIMEOUT);
        }
    }
    if (compact) {
        args.push('--compact');
    }
    return args;
}
exports.pushQueryArguments = pushQueryArguments;
function pushTimeout(args, timeout) {
    args.push('TIMEOUT', timeout.toString());
}
function queryParamsToString(params) {
    const parts = [];
    for (const [key, value] of Object.entries(params)){
        parts.push("".concat(key, "=").concat(queryParamToString(value)));
    }
    return parts.join(' ');
}
function queryParamToString(param) {
    if (param === null) {
        return 'null';
    }
    switch(typeof param){
        case 'string':
            return '"'.concat(param.replace(/["\\]/g, '\\$&'), '"');
        case 'number':
        case 'boolean':
            return param.toString();
    }
    if (Array.isArray(param)) {
        return "[".concat(param.map(queryParamToString).join(','), "]");
    } else if (typeof param === 'object') {
        const body = [];
        for (const [key, value] of Object.entries(param)){
            body.push("".concat(key, ":").concat(queryParamToString(value)));
        }
        return "{".concat(body.join(','), "}");
    } else {
        throw new TypeError("Unexpected param type ".concat(typeof param, " ").concat(param));
    }
}
}),
"[project]/dawg-ai/node_modules/@redis/graph/dist/graph.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __classPrivateFieldSet = /*TURBOPACK member replacement*/ __turbopack_context__.e && /*TURBOPACK member replacement*/ __turbopack_context__.e.__classPrivateFieldSet || function(receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), value;
};
var __classPrivateFieldGet = /*TURBOPACK member replacement*/ __turbopack_context__.e && /*TURBOPACK member replacement*/ __turbopack_context__.e.__classPrivateFieldGet || function(receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _Graph_instances, _Graph_client, _Graph_name, _Graph_metadata, _Graph_setMetadataPromise, _Graph_updateMetadata, _Graph_setMetadata, _Graph_cleanMetadataArray, _Graph_getMetadata, _Graph_getMetadataAsync, _Graph_parseReply, _Graph_parseValue, _Graph_parseEdge, _Graph_parseNode, _Graph_parseProperties;
Object.defineProperty(exports, "__esModule", {
    value: true
});
// https://github.com/RedisGraph/RedisGraph/blob/master/src/resultset/formatters/resultset_formatter.h#L20
var GraphValueTypes;
(function(GraphValueTypes) {
    GraphValueTypes[GraphValueTypes["UNKNOWN"] = 0] = "UNKNOWN";
    GraphValueTypes[GraphValueTypes["NULL"] = 1] = "NULL";
    GraphValueTypes[GraphValueTypes["STRING"] = 2] = "STRING";
    GraphValueTypes[GraphValueTypes["INTEGER"] = 3] = "INTEGER";
    GraphValueTypes[GraphValueTypes["BOOLEAN"] = 4] = "BOOLEAN";
    GraphValueTypes[GraphValueTypes["DOUBLE"] = 5] = "DOUBLE";
    GraphValueTypes[GraphValueTypes["ARRAY"] = 6] = "ARRAY";
    GraphValueTypes[GraphValueTypes["EDGE"] = 7] = "EDGE";
    GraphValueTypes[GraphValueTypes["NODE"] = 8] = "NODE";
    GraphValueTypes[GraphValueTypes["PATH"] = 9] = "PATH";
    GraphValueTypes[GraphValueTypes["MAP"] = 10] = "MAP";
    GraphValueTypes[GraphValueTypes["POINT"] = 11] = "POINT";
})(GraphValueTypes || (GraphValueTypes = {}));
class Graph {
    async query(query, options) {
        return __classPrivateFieldGet(this, _Graph_instances, "m", _Graph_parseReply).call(this, await __classPrivateFieldGet(this, _Graph_client, "f").graph.query(__classPrivateFieldGet(this, _Graph_name, "f"), query, options, true));
    }
    async roQuery(query, options) {
        return __classPrivateFieldGet(this, _Graph_instances, "m", _Graph_parseReply).call(this, await __classPrivateFieldGet(this, _Graph_client, "f").graph.roQuery(__classPrivateFieldGet(this, _Graph_name, "f"), query, options, true));
    }
    constructor(client, name){
        _Graph_instances.add(this);
        _Graph_client.set(this, void 0);
        _Graph_name.set(this, void 0);
        _Graph_metadata.set(this, void 0);
        _Graph_setMetadataPromise.set(this, void 0);
        __classPrivateFieldSet(this, _Graph_client, client, "f");
        __classPrivateFieldSet(this, _Graph_name, name, "f");
    }
}
_Graph_client = new WeakMap(), _Graph_name = new WeakMap(), _Graph_metadata = new WeakMap(), _Graph_setMetadataPromise = new WeakMap(), _Graph_instances = new WeakSet(), _Graph_updateMetadata = function _Graph_updateMetadata() {
    var __classPrivateFieldGet1;
    __classPrivateFieldSet(this, _Graph_setMetadataPromise, (__classPrivateFieldGet1 = __classPrivateFieldGet(this, _Graph_setMetadataPromise, "f")) !== null && __classPrivateFieldGet1 !== void 0 ? __classPrivateFieldGet1 : __classPrivateFieldGet(this, _Graph_instances, "m", _Graph_setMetadata).call(this).finally(()=>__classPrivateFieldSet(this, _Graph_setMetadataPromise, undefined, "f")), "f");
    return __classPrivateFieldGet(this, _Graph_setMetadataPromise, "f");
}, _Graph_setMetadata = // DO NOT use directly, use #updateMetadata instead
async function _Graph_setMetadata() {
    const [labels, relationshipTypes, propertyKeys] = await Promise.all([
        __classPrivateFieldGet(this, _Graph_client, "f").graph.roQuery(__classPrivateFieldGet(this, _Graph_name, "f"), 'CALL db.labels()'),
        __classPrivateFieldGet(this, _Graph_client, "f").graph.roQuery(__classPrivateFieldGet(this, _Graph_name, "f"), 'CALL db.relationshipTypes()'),
        __classPrivateFieldGet(this, _Graph_client, "f").graph.roQuery(__classPrivateFieldGet(this, _Graph_name, "f"), 'CALL db.propertyKeys()')
    ]);
    __classPrivateFieldSet(this, _Graph_metadata, {
        labels: __classPrivateFieldGet(this, _Graph_instances, "m", _Graph_cleanMetadataArray).call(this, labels.data),
        relationshipTypes: __classPrivateFieldGet(this, _Graph_instances, "m", _Graph_cleanMetadataArray).call(this, relationshipTypes.data),
        propertyKeys: __classPrivateFieldGet(this, _Graph_instances, "m", _Graph_cleanMetadataArray).call(this, propertyKeys.data)
    }, "f");
    return __classPrivateFieldGet(this, _Graph_metadata, "f");
}, _Graph_cleanMetadataArray = function _Graph_cleanMetadataArray(arr) {
    return arr.map((param)=>{
        let [value] = param;
        return value;
    });
}, _Graph_getMetadata = function _Graph_getMetadata(key, id) {
    var __classPrivateFieldGet1;
    var __classPrivateFieldGet_key_id;
    return (__classPrivateFieldGet_key_id = (__classPrivateFieldGet1 = __classPrivateFieldGet(this, _Graph_metadata, "f")) === null || __classPrivateFieldGet1 === void 0 ? void 0 : __classPrivateFieldGet1[key][id]) !== null && __classPrivateFieldGet_key_id !== void 0 ? __classPrivateFieldGet_key_id : __classPrivateFieldGet(this, _Graph_instances, "m", _Graph_getMetadataAsync).call(this, key, id);
}, _Graph_getMetadataAsync = // DO NOT use directly, use #getMetadata instead
async function _Graph_getMetadataAsync(key, id) {
    const value = (await __classPrivateFieldGet(this, _Graph_instances, "m", _Graph_updateMetadata).call(this))[key][id];
    if (value === undefined) throw new Error("Cannot find value from ".concat(key, "[").concat(id, "]"));
    return value;
}, _Graph_parseReply = async function _Graph_parseReply(reply) {
    if (!reply.data) return reply;
    const promises = [], parsed = {
        metadata: reply.metadata,
        data: reply.data.map((row)=>{
            const data = {};
            for(let i = 0; i < row.length; i++){
                data[reply.headers[i][1]] = __classPrivateFieldGet(this, _Graph_instances, "m", _Graph_parseValue).call(this, row[i], promises);
            }
            return data;
        })
    };
    if (promises.length) await Promise.all(promises);
    return parsed;
}, _Graph_parseValue = function _Graph_parseValue(param, promises) {
    let [valueType, value] = param;
    switch(valueType){
        case GraphValueTypes.NULL:
            return null;
        case GraphValueTypes.STRING:
        case GraphValueTypes.INTEGER:
            return value;
        case GraphValueTypes.BOOLEAN:
            return value === 'true';
        case GraphValueTypes.DOUBLE:
            return parseFloat(value);
        case GraphValueTypes.ARRAY:
            return value.map((x)=>__classPrivateFieldGet(this, _Graph_instances, "m", _Graph_parseValue).call(this, x, promises));
        case GraphValueTypes.EDGE:
            return __classPrivateFieldGet(this, _Graph_instances, "m", _Graph_parseEdge).call(this, value, promises);
        case GraphValueTypes.NODE:
            return __classPrivateFieldGet(this, _Graph_instances, "m", _Graph_parseNode).call(this, value, promises);
        case GraphValueTypes.PATH:
            return {
                nodes: value[0][1].map((param)=>{
                    let [, node] = param;
                    return __classPrivateFieldGet(this, _Graph_instances, "m", _Graph_parseNode).call(this, node, promises);
                }),
                edges: value[1][1].map((param)=>{
                    let [, edge] = param;
                    return __classPrivateFieldGet(this, _Graph_instances, "m", _Graph_parseEdge).call(this, edge, promises);
                })
            };
        case GraphValueTypes.MAP:
            const map = {};
            for(let i = 0; i < value.length; i++){
                map[value[i++]] = __classPrivateFieldGet(this, _Graph_instances, "m", _Graph_parseValue).call(this, value[i], promises);
            }
            return map;
        case GraphValueTypes.POINT:
            return {
                latitude: parseFloat(value[0]),
                longitude: parseFloat(value[1])
            };
        default:
            throw new Error("unknown scalar type: ".concat(valueType));
    }
}, _Graph_parseEdge = function _Graph_parseEdge(param, promises) {
    let [id, relationshipTypeId, sourceId, destinationId, properties] = param;
    const edge = {
        id,
        sourceId,
        destinationId,
        properties: __classPrivateFieldGet(this, _Graph_instances, "m", _Graph_parseProperties).call(this, properties, promises)
    };
    const relationshipType = __classPrivateFieldGet(this, _Graph_instances, "m", _Graph_getMetadata).call(this, 'relationshipTypes', relationshipTypeId);
    if (relationshipType instanceof Promise) {
        promises.push(relationshipType.then((value)=>edge.relationshipType = value));
    } else {
        edge.relationshipType = relationshipType;
    }
    return edge;
}, _Graph_parseNode = function _Graph_parseNode(param, promises) {
    let [id, labelIds, properties] = param;
    const labels = new Array(labelIds.length);
    for(let i = 0; i < labelIds.length; i++){
        const value = __classPrivateFieldGet(this, _Graph_instances, "m", _Graph_getMetadata).call(this, 'labels', labelIds[i]);
        if (value instanceof Promise) {
            promises.push(value.then((value)=>labels[i] = value));
        } else {
            labels[i] = value;
        }
    }
    return {
        id,
        labels,
        properties: __classPrivateFieldGet(this, _Graph_instances, "m", _Graph_parseProperties).call(this, properties, promises)
    };
}, _Graph_parseProperties = function _Graph_parseProperties(raw, promises) {
    const parsed = {};
    for (const [id, type, value] of raw){
        const parsedValue = __classPrivateFieldGet(this, _Graph_instances, "m", _Graph_parseValue).call(this, [
            type,
            value
        ], promises), key = __classPrivateFieldGet(this, _Graph_instances, "m", _Graph_getMetadata).call(this, 'propertyKeys', id);
        if (key instanceof Promise) {
            promises.push(key.then((key)=>parsed[key] = parsedValue));
        } else {
            parsed[key] = parsedValue;
        }
    }
    return parsed;
};
exports.default = Graph;
}),
"[project]/dawg-ai/node_modules/@redis/graph/dist/index.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Graph = exports.default = void 0;
var commands_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/graph/dist/commands/index.js [app-client] (ecmascript)");
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return commands_1.default;
    }
});
var graph_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/graph/dist/graph.js [app-client] (ecmascript)");
Object.defineProperty(exports, "Graph", {
    enumerable: true,
    get: function() {
        return graph_1.default;
    }
});
}),
"[project]/dawg-ai/node_modules/@redis/json/dist/commands/ARRAPPEND.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformArguments = exports.FIRST_KEY_INDEX = void 0;
const _1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/json/dist/commands/index.js [app-client] (ecmascript)");
exports.FIRST_KEY_INDEX = 1;
function transformArguments(key, path) {
    for(var _len = arguments.length, jsons = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++){
        jsons[_key - 2] = arguments[_key];
    }
    const args = [
        'JSON.ARRAPPEND',
        key,
        path
    ];
    for (const json of jsons){
        args.push((0, _1.transformRedisJsonArgument)(json));
    }
    return args;
}
exports.transformArguments = transformArguments;
}),
"[project]/dawg-ai/node_modules/@redis/json/dist/commands/ARRINDEX.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformArguments = exports.IS_READ_ONLY = exports.FIRST_KEY_INDEX = void 0;
const _1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/json/dist/commands/index.js [app-client] (ecmascript)");
exports.FIRST_KEY_INDEX = 1;
exports.IS_READ_ONLY = true;
function transformArguments(key, path, json, start, stop) {
    const args = [
        'JSON.ARRINDEX',
        key,
        path,
        (0, _1.transformRedisJsonArgument)(json)
    ];
    if (start !== undefined && start !== null) {
        args.push(start.toString());
        if (stop !== undefined && stop !== null) {
            args.push(stop.toString());
        }
    }
    return args;
}
exports.transformArguments = transformArguments;
}),
"[project]/dawg-ai/node_modules/@redis/json/dist/commands/ARRINSERT.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformArguments = exports.FIRST_KEY_INDEX = void 0;
const _1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/json/dist/commands/index.js [app-client] (ecmascript)");
exports.FIRST_KEY_INDEX = 1;
function transformArguments(key, path, index) {
    for(var _len = arguments.length, jsons = new Array(_len > 3 ? _len - 3 : 0), _key = 3; _key < _len; _key++){
        jsons[_key - 3] = arguments[_key];
    }
    const args = [
        'JSON.ARRINSERT',
        key,
        path,
        index.toString()
    ];
    for (const json of jsons){
        args.push((0, _1.transformRedisJsonArgument)(json));
    }
    return args;
}
exports.transformArguments = transformArguments;
}),
"[project]/dawg-ai/node_modules/@redis/json/dist/commands/ARRLEN.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformArguments = exports.IS_READ_ONLY = exports.FIRST_KEY_INDEX = void 0;
exports.FIRST_KEY_INDEX = 1;
exports.IS_READ_ONLY = true;
function transformArguments(key, path) {
    const args = [
        'JSON.ARRLEN',
        key
    ];
    if (path) {
        args.push(path);
    }
    return args;
}
exports.transformArguments = transformArguments;
}),
"[project]/dawg-ai/node_modules/@redis/json/dist/commands/ARRPOP.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformReply = exports.transformArguments = exports.FIRST_KEY_INDEX = void 0;
const _1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/json/dist/commands/index.js [app-client] (ecmascript)");
exports.FIRST_KEY_INDEX = 1;
function transformArguments(key, path, index) {
    const args = [
        'JSON.ARRPOP',
        key
    ];
    if (path) {
        args.push(path);
        if (index !== undefined && index !== null) {
            args.push(index.toString());
        }
    }
    return args;
}
exports.transformArguments = transformArguments;
function transformReply(reply) {
    if (reply === null) return null;
    if (Array.isArray(reply)) {
        return reply.map(_1.transformRedisJsonNullReply);
    }
    return (0, _1.transformRedisJsonNullReply)(reply);
}
exports.transformReply = transformReply;
}),
"[project]/dawg-ai/node_modules/@redis/json/dist/commands/ARRTRIM.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformArguments = exports.FIRST_KEY_INDEX = void 0;
exports.FIRST_KEY_INDEX = 1;
function transformArguments(key, path, start, stop) {
    return [
        'JSON.ARRTRIM',
        key,
        path,
        start.toString(),
        stop.toString()
    ];
}
exports.transformArguments = transformArguments;
}),
"[project]/dawg-ai/node_modules/@redis/json/dist/commands/DEBUG_MEMORY.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformArguments = exports.FIRST_KEY_INDEX = void 0;
exports.FIRST_KEY_INDEX = 2;
function transformArguments(key, path) {
    const args = [
        'JSON.DEBUG',
        'MEMORY',
        key
    ];
    if (path) {
        args.push(path);
    }
    return args;
}
exports.transformArguments = transformArguments;
}),
"[project]/dawg-ai/node_modules/@redis/json/dist/commands/DEL.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformArguments = exports.FIRST_KEY_INDEX = void 0;
exports.FIRST_KEY_INDEX = 1;
function transformArguments(key, path) {
    const args = [
        'JSON.DEL',
        key
    ];
    if (path) {
        args.push(path);
    }
    return args;
}
exports.transformArguments = transformArguments;
}),
"[project]/dawg-ai/node_modules/@redis/json/dist/commands/FORGET.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformArguments = exports.FIRST_KEY_INDEX = void 0;
exports.FIRST_KEY_INDEX = 1;
function transformArguments(key, path) {
    const args = [
        'JSON.FORGET',
        key
    ];
    if (path) {
        args.push(path);
    }
    return args;
}
exports.transformArguments = transformArguments;
}),
"[project]/dawg-ai/node_modules/@redis/json/dist/commands/GET.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformReply = exports.transformArguments = exports.IS_READ_ONLY = exports.FIRST_KEY_INDEX = void 0;
const generic_transformers_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/client/dist/lib/commands/generic-transformers.js [app-client] (ecmascript)");
exports.FIRST_KEY_INDEX = 1;
exports.IS_READ_ONLY = true;
function transformArguments(key, options) {
    let args = [
        'JSON.GET',
        key
    ];
    if (options === null || options === void 0 ? void 0 : options.path) {
        args = (0, generic_transformers_1.pushVerdictArguments)(args, options.path);
    }
    if (options === null || options === void 0 ? void 0 : options.INDENT) {
        args.push('INDENT', options.INDENT);
    }
    if (options === null || options === void 0 ? void 0 : options.NEWLINE) {
        args.push('NEWLINE', options.NEWLINE);
    }
    if (options === null || options === void 0 ? void 0 : options.SPACE) {
        args.push('SPACE', options.SPACE);
    }
    if (options === null || options === void 0 ? void 0 : options.NOESCAPE) {
        args.push('NOESCAPE');
    }
    return args;
}
exports.transformArguments = transformArguments;
var _1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/json/dist/commands/index.js [app-client] (ecmascript)");
Object.defineProperty(exports, "transformReply", {
    enumerable: true,
    get: function() {
        return _1.transformRedisJsonNullReply;
    }
});
}),
"[project]/dawg-ai/node_modules/@redis/json/dist/commands/MERGE.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformArguments = exports.FIRST_KEY_INDEX = void 0;
const _1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/json/dist/commands/index.js [app-client] (ecmascript)");
exports.FIRST_KEY_INDEX = 1;
function transformArguments(key, path, json) {
    return [
        'JSON.MERGE',
        key,
        path,
        (0, _1.transformRedisJsonArgument)(json)
    ];
}
exports.transformArguments = transformArguments;
}),
"[project]/dawg-ai/node_modules/@redis/json/dist/commands/MGET.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformReply = exports.transformArguments = exports.IS_READ_ONLY = exports.FIRST_KEY_INDEX = void 0;
const _1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/json/dist/commands/index.js [app-client] (ecmascript)");
exports.FIRST_KEY_INDEX = 1;
exports.IS_READ_ONLY = true;
function transformArguments(keys, path) {
    return [
        'JSON.MGET',
        ...keys,
        path
    ];
}
exports.transformArguments = transformArguments;
function transformReply(reply) {
    return reply.map(_1.transformRedisJsonNullReply);
}
exports.transformReply = transformReply;
}),
"[project]/dawg-ai/node_modules/@redis/json/dist/commands/MSET.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformArguments = exports.FIRST_KEY_INDEX = void 0;
const _1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/json/dist/commands/index.js [app-client] (ecmascript)");
exports.FIRST_KEY_INDEX = 1;
function transformArguments(items) {
    const args = new Array(1 + items.length * 3);
    args[0] = 'JSON.MSET';
    let argsIndex = 1;
    for(let i = 0; i < items.length; i++){
        const item = items[i];
        args[argsIndex++] = item.key;
        args[argsIndex++] = item.path;
        args[argsIndex++] = (0, _1.transformRedisJsonArgument)(item.value);
    }
    return args;
}
exports.transformArguments = transformArguments;
}),
"[project]/dawg-ai/node_modules/@redis/json/dist/commands/NUMINCRBY.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformReply = exports.transformArguments = exports.FIRST_KEY_INDEX = void 0;
exports.FIRST_KEY_INDEX = 1;
function transformArguments(key, path, by) {
    return [
        'JSON.NUMINCRBY',
        key,
        path,
        by.toString()
    ];
}
exports.transformArguments = transformArguments;
var _1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/json/dist/commands/index.js [app-client] (ecmascript)");
Object.defineProperty(exports, "transformReply", {
    enumerable: true,
    get: function() {
        return _1.transformNumbersReply;
    }
});
}),
"[project]/dawg-ai/node_modules/@redis/json/dist/commands/NUMMULTBY.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformReply = exports.transformArguments = exports.FIRST_KEY_INDEX = void 0;
exports.FIRST_KEY_INDEX = 1;
function transformArguments(key, path, by) {
    return [
        'JSON.NUMMULTBY',
        key,
        path,
        by.toString()
    ];
}
exports.transformArguments = transformArguments;
var _1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/json/dist/commands/index.js [app-client] (ecmascript)");
Object.defineProperty(exports, "transformReply", {
    enumerable: true,
    get: function() {
        return _1.transformNumbersReply;
    }
});
}),
"[project]/dawg-ai/node_modules/@redis/json/dist/commands/OBJKEYS.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformArguments = exports.FIRST_KEY_INDEX = void 0;
exports.FIRST_KEY_INDEX = 1;
function transformArguments(key, path) {
    const args = [
        'JSON.OBJKEYS',
        key
    ];
    if (path) {
        args.push(path);
    }
    return args;
}
exports.transformArguments = transformArguments;
}),
"[project]/dawg-ai/node_modules/@redis/json/dist/commands/OBJLEN.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformArguments = exports.FIRST_KEY_INDEX = void 0;
exports.FIRST_KEY_INDEX = 1;
function transformArguments(key, path) {
    const args = [
        'JSON.OBJLEN',
        key
    ];
    if (path) {
        args.push(path);
    }
    return args;
}
exports.transformArguments = transformArguments;
}),
"[project]/dawg-ai/node_modules/@redis/json/dist/commands/RESP.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformArguments = exports.FIRST_KEY_INDEX = void 0;
exports.FIRST_KEY_INDEX = 1;
function transformArguments(key, path) {
    const args = [
        'JSON.RESP',
        key
    ];
    if (path) {
        args.push(path);
    }
    return args;
}
exports.transformArguments = transformArguments;
}),
"[project]/dawg-ai/node_modules/@redis/json/dist/commands/SET.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformArguments = exports.FIRST_KEY_INDEX = void 0;
const _1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/json/dist/commands/index.js [app-client] (ecmascript)");
exports.FIRST_KEY_INDEX = 1;
function transformArguments(key, path, json, options) {
    const args = [
        'JSON.SET',
        key,
        path,
        (0, _1.transformRedisJsonArgument)(json)
    ];
    if (options === null || options === void 0 ? void 0 : options.NX) {
        args.push('NX');
    } else if (options === null || options === void 0 ? void 0 : options.XX) {
        args.push('XX');
    }
    return args;
}
exports.transformArguments = transformArguments;
}),
"[project]/dawg-ai/node_modules/@redis/json/dist/commands/STRAPPEND.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformArguments = exports.FIRST_KEY_INDEX = void 0;
const _1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/json/dist/commands/index.js [app-client] (ecmascript)");
exports.FIRST_KEY_INDEX = 1;
function transformArguments() {
    for(var _len = arguments.length, _tmp = new Array(_len), _key = 0; _key < _len; _key++){
        _tmp[_key] = arguments[_key];
    }
    let [key, pathOrAppend, append] = _tmp;
    const args = [
        'JSON.STRAPPEND',
        key
    ];
    if (append !== undefined && append !== null) {
        args.push(pathOrAppend, (0, _1.transformRedisJsonArgument)(append));
    } else {
        args.push((0, _1.transformRedisJsonArgument)(pathOrAppend));
    }
    return args;
}
exports.transformArguments = transformArguments;
}),
"[project]/dawg-ai/node_modules/@redis/json/dist/commands/STRLEN.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformArguments = exports.IS_READ_ONLY = exports.FIRST_KEY_INDEX = void 0;
exports.FIRST_KEY_INDEX = 1;
exports.IS_READ_ONLY = true;
function transformArguments(key, path) {
    const args = [
        'JSON.STRLEN',
        key
    ];
    if (path) {
        args.push(path);
    }
    return args;
}
exports.transformArguments = transformArguments;
}),
"[project]/dawg-ai/node_modules/@redis/json/dist/commands/TYPE.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformArguments = exports.FIRST_KEY_INDEX = void 0;
exports.FIRST_KEY_INDEX = 1;
function transformArguments(key, path) {
    const args = [
        'JSON.TYPE',
        key
    ];
    if (path) {
        args.push(path);
    }
    return args;
}
exports.transformArguments = transformArguments;
}),
"[project]/dawg-ai/node_modules/@redis/json/dist/commands/index.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformNumbersReply = exports.transformRedisJsonNullReply = exports.transformRedisJsonReply = exports.transformRedisJsonArgument = void 0;
const ARRAPPEND = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/json/dist/commands/ARRAPPEND.js [app-client] (ecmascript)");
const ARRINDEX = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/json/dist/commands/ARRINDEX.js [app-client] (ecmascript)");
const ARRINSERT = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/json/dist/commands/ARRINSERT.js [app-client] (ecmascript)");
const ARRLEN = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/json/dist/commands/ARRLEN.js [app-client] (ecmascript)");
const ARRPOP = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/json/dist/commands/ARRPOP.js [app-client] (ecmascript)");
const ARRTRIM = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/json/dist/commands/ARRTRIM.js [app-client] (ecmascript)");
const DEBUG_MEMORY = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/json/dist/commands/DEBUG_MEMORY.js [app-client] (ecmascript)");
const DEL = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/json/dist/commands/DEL.js [app-client] (ecmascript)");
const FORGET = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/json/dist/commands/FORGET.js [app-client] (ecmascript)");
const GET = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/json/dist/commands/GET.js [app-client] (ecmascript)");
const MERGE = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/json/dist/commands/MERGE.js [app-client] (ecmascript)");
const MGET = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/json/dist/commands/MGET.js [app-client] (ecmascript)");
const MSET = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/json/dist/commands/MSET.js [app-client] (ecmascript)");
const NUMINCRBY = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/json/dist/commands/NUMINCRBY.js [app-client] (ecmascript)");
const NUMMULTBY = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/json/dist/commands/NUMMULTBY.js [app-client] (ecmascript)");
const OBJKEYS = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/json/dist/commands/OBJKEYS.js [app-client] (ecmascript)");
const OBJLEN = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/json/dist/commands/OBJLEN.js [app-client] (ecmascript)");
const RESP = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/json/dist/commands/RESP.js [app-client] (ecmascript)");
const SET = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/json/dist/commands/SET.js [app-client] (ecmascript)");
const STRAPPEND = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/json/dist/commands/STRAPPEND.js [app-client] (ecmascript)");
const STRLEN = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/json/dist/commands/STRLEN.js [app-client] (ecmascript)");
const TYPE = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/json/dist/commands/TYPE.js [app-client] (ecmascript)");
exports.default = {
    ARRAPPEND,
    arrAppend: ARRAPPEND,
    ARRINDEX,
    arrIndex: ARRINDEX,
    ARRINSERT,
    arrInsert: ARRINSERT,
    ARRLEN,
    arrLen: ARRLEN,
    ARRPOP,
    arrPop: ARRPOP,
    ARRTRIM,
    arrTrim: ARRTRIM,
    DEBUG_MEMORY,
    debugMemory: DEBUG_MEMORY,
    DEL,
    del: DEL,
    FORGET,
    forget: FORGET,
    GET,
    get: GET,
    MERGE,
    merge: MERGE,
    MGET,
    mGet: MGET,
    MSET,
    mSet: MSET,
    NUMINCRBY,
    numIncrBy: NUMINCRBY,
    NUMMULTBY,
    numMultBy: NUMMULTBY,
    OBJKEYS,
    objKeys: OBJKEYS,
    OBJLEN,
    objLen: OBJLEN,
    RESP,
    resp: RESP,
    SET,
    set: SET,
    STRAPPEND,
    strAppend: STRAPPEND,
    STRLEN,
    strLen: STRLEN,
    TYPE,
    type: TYPE
};
function transformRedisJsonArgument(json) {
    return JSON.stringify(json);
}
exports.transformRedisJsonArgument = transformRedisJsonArgument;
function transformRedisJsonReply(json) {
    return JSON.parse(json);
}
exports.transformRedisJsonReply = transformRedisJsonReply;
function transformRedisJsonNullReply(json) {
    if (json === null) return null;
    return transformRedisJsonReply(json);
}
exports.transformRedisJsonNullReply = transformRedisJsonNullReply;
function transformNumbersReply(reply) {
    return JSON.parse(reply);
}
exports.transformNumbersReply = transformNumbersReply;
}),
"[project]/dawg-ai/node_modules/@redis/json/dist/index.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = void 0;
var commands_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/json/dist/commands/index.js [app-client] (ecmascript)");
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return commands_1.default;
    }
});
}),
"[project]/dawg-ai/node_modules/@redis/search/dist/commands/_LIST.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformArguments = void 0;
function transformArguments() {
    return [
        'FT._LIST'
    ];
}
exports.transformArguments = transformArguments;
}),
"[project]/dawg-ai/node_modules/@redis/search/dist/commands/ALTER.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformArguments = void 0;
const _1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/search/dist/commands/index.js [app-client] (ecmascript)");
function transformArguments(index, schema) {
    const args = [
        'FT.ALTER',
        index,
        'SCHEMA',
        'ADD'
    ];
    (0, _1.pushSchema)(args, schema);
    return args;
}
exports.transformArguments = transformArguments;
}),
"[project]/dawg-ai/node_modules/@redis/search/dist/commands/AGGREGATE.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformReply = exports.pushAggregatehOptions = exports.transformArguments = exports.IS_READ_ONLY = exports.FIRST_KEY_INDEX = exports.AggregateGroupByReducers = exports.AggregateSteps = void 0;
const generic_transformers_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/client/dist/lib/commands/generic-transformers.js [app-client] (ecmascript)");
const _1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/search/dist/commands/index.js [app-client] (ecmascript)");
var AggregateSteps;
(function(AggregateSteps) {
    AggregateSteps["GROUPBY"] = "GROUPBY";
    AggregateSteps["SORTBY"] = "SORTBY";
    AggregateSteps["APPLY"] = "APPLY";
    AggregateSteps["LIMIT"] = "LIMIT";
    AggregateSteps["FILTER"] = "FILTER";
})(AggregateSteps || (exports.AggregateSteps = AggregateSteps = {}));
var AggregateGroupByReducers;
(function(AggregateGroupByReducers) {
    AggregateGroupByReducers["COUNT"] = "COUNT";
    AggregateGroupByReducers["COUNT_DISTINCT"] = "COUNT_DISTINCT";
    AggregateGroupByReducers["COUNT_DISTINCTISH"] = "COUNT_DISTINCTISH";
    AggregateGroupByReducers["SUM"] = "SUM";
    AggregateGroupByReducers["MIN"] = "MIN";
    AggregateGroupByReducers["MAX"] = "MAX";
    AggregateGroupByReducers["AVG"] = "AVG";
    AggregateGroupByReducers["STDDEV"] = "STDDEV";
    AggregateGroupByReducers["QUANTILE"] = "QUANTILE";
    AggregateGroupByReducers["TOLIST"] = "TOLIST";
    AggregateGroupByReducers["TO_LIST"] = "TOLIST";
    AggregateGroupByReducers["FIRST_VALUE"] = "FIRST_VALUE";
    AggregateGroupByReducers["RANDOM_SAMPLE"] = "RANDOM_SAMPLE";
})(AggregateGroupByReducers || (exports.AggregateGroupByReducers = AggregateGroupByReducers = {}));
exports.FIRST_KEY_INDEX = 1;
exports.IS_READ_ONLY = true;
function transformArguments(index, query, options) {
    return pushAggregatehOptions([
        'FT.AGGREGATE',
        index,
        query
    ], options);
}
exports.transformArguments = transformArguments;
function pushAggregatehOptions(args, options) {
    if (options === null || options === void 0 ? void 0 : options.VERBATIM) {
        args.push('VERBATIM');
    }
    if (options === null || options === void 0 ? void 0 : options.ADDSCORES) {
        args.push('ADDSCORES');
    }
    if (options === null || options === void 0 ? void 0 : options.LOAD) {
        args.push('LOAD');
        (0, _1.pushArgumentsWithLength)(args, ()=>{
            if (Array.isArray(options.LOAD)) {
                for (const load of options.LOAD){
                    pushLoadField(args, load);
                }
            } else {
                pushLoadField(args, options.LOAD);
            }
        });
    }
    if (options === null || options === void 0 ? void 0 : options.STEPS) {
        for (const step of options.STEPS){
            switch(step.type){
                case AggregateSteps.GROUPBY:
                    args.push('GROUPBY');
                    if (!step.properties) {
                        args.push('0');
                    } else {
                        (0, generic_transformers_1.pushVerdictArgument)(args, step.properties);
                    }
                    if (Array.isArray(step.REDUCE)) {
                        for (const reducer of step.REDUCE){
                            pushGroupByReducer(args, reducer);
                        }
                    } else {
                        pushGroupByReducer(args, step.REDUCE);
                    }
                    break;
                case AggregateSteps.SORTBY:
                    (0, _1.pushSortByArguments)(args, 'SORTBY', step.BY);
                    if (step.MAX) {
                        args.push('MAX', step.MAX.toString());
                    }
                    break;
                case AggregateSteps.APPLY:
                    args.push('APPLY', step.expression, 'AS', step.AS);
                    break;
                case AggregateSteps.LIMIT:
                    args.push('LIMIT', step.from.toString(), step.size.toString());
                    break;
                case AggregateSteps.FILTER:
                    args.push('FILTER', step.expression);
                    break;
            }
        }
    }
    (0, _1.pushParamsArgs)(args, options === null || options === void 0 ? void 0 : options.PARAMS);
    if (options === null || options === void 0 ? void 0 : options.DIALECT) {
        args.push('DIALECT', options.DIALECT.toString());
    }
    if ((options === null || options === void 0 ? void 0 : options.TIMEOUT) !== undefined) {
        args.push('TIMEOUT', options.TIMEOUT.toString());
    }
    return args;
}
exports.pushAggregatehOptions = pushAggregatehOptions;
function pushLoadField(args, toLoad) {
    if (typeof toLoad === 'string') {
        args.push(toLoad);
    } else {
        args.push(toLoad.identifier);
        if (toLoad.AS) {
            args.push('AS', toLoad.AS);
        }
    }
}
function pushGroupByReducer(args, reducer) {
    args.push('REDUCE', reducer.type);
    switch(reducer.type){
        case AggregateGroupByReducers.COUNT:
            args.push('0');
            break;
        case AggregateGroupByReducers.COUNT_DISTINCT:
        case AggregateGroupByReducers.COUNT_DISTINCTISH:
        case AggregateGroupByReducers.SUM:
        case AggregateGroupByReducers.MIN:
        case AggregateGroupByReducers.MAX:
        case AggregateGroupByReducers.AVG:
        case AggregateGroupByReducers.STDDEV:
        case AggregateGroupByReducers.TOLIST:
            args.push('1', reducer.property);
            break;
        case AggregateGroupByReducers.QUANTILE:
            args.push('2', reducer.property, reducer.quantile.toString());
            break;
        case AggregateGroupByReducers.FIRST_VALUE:
            {
                (0, _1.pushArgumentsWithLength)(args, ()=>{
                    args.push(reducer.property);
                    if (reducer.BY) {
                        args.push('BY');
                        if (typeof reducer.BY === 'string') {
                            args.push(reducer.BY);
                        } else {
                            args.push(reducer.BY.property);
                            if (reducer.BY.direction) {
                                args.push(reducer.BY.direction);
                            }
                        }
                    }
                });
                break;
            }
        case AggregateGroupByReducers.RANDOM_SAMPLE:
            args.push('2', reducer.property, reducer.sampleSize.toString());
            break;
    }
    if (reducer.AS) {
        args.push('AS', reducer.AS);
    }
}
function transformReply(rawReply) {
    const results = [];
    for(let i = 1; i < rawReply.length; i++){
        results.push((0, generic_transformers_1.transformTuplesReply)(rawReply[i]));
    }
    return {
        total: rawReply[0],
        results
    };
}
exports.transformReply = transformReply;
}),
"[project]/dawg-ai/node_modules/@redis/search/dist/commands/AGGREGATE_WITHCURSOR.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformReply = exports.transformArguments = exports.IS_READ_ONLY = exports.FIRST_KEY_INDEX = void 0;
const AGGREGATE_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/search/dist/commands/AGGREGATE.js [app-client] (ecmascript)");
var AGGREGATE_2 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/search/dist/commands/AGGREGATE.js [app-client] (ecmascript)");
Object.defineProperty(exports, "FIRST_KEY_INDEX", {
    enumerable: true,
    get: function() {
        return AGGREGATE_2.FIRST_KEY_INDEX;
    }
});
Object.defineProperty(exports, "IS_READ_ONLY", {
    enumerable: true,
    get: function() {
        return AGGREGATE_2.IS_READ_ONLY;
    }
});
function transformArguments(index, query, options) {
    const args = (0, AGGREGATE_1.transformArguments)(index, query, options);
    args.push('WITHCURSOR');
    if (options === null || options === void 0 ? void 0 : options.COUNT) {
        args.push('COUNT', options.COUNT.toString());
    }
    return args;
}
exports.transformArguments = transformArguments;
function transformReply(reply) {
    return {
        ...(0, AGGREGATE_1.transformReply)(reply[0]),
        cursor: reply[1]
    };
}
exports.transformReply = transformReply;
}),
"[project]/dawg-ai/node_modules/@redis/search/dist/commands/ALIASADD.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformArguments = void 0;
function transformArguments(name, index) {
    return [
        'FT.ALIASADD',
        name,
        index
    ];
}
exports.transformArguments = transformArguments;
}),
"[project]/dawg-ai/node_modules/@redis/search/dist/commands/ALIASDEL.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformArguments = void 0;
function transformArguments(name, index) {
    return [
        'FT.ALIASDEL',
        name,
        index
    ];
}
exports.transformArguments = transformArguments;
}),
"[project]/dawg-ai/node_modules/@redis/search/dist/commands/ALIASUPDATE.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformArguments = void 0;
function transformArguments(name, index) {
    return [
        'FT.ALIASUPDATE',
        name,
        index
    ];
}
exports.transformArguments = transformArguments;
}),
"[project]/dawg-ai/node_modules/@redis/search/dist/commands/CONFIG_GET.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformReply = exports.transformArguments = void 0;
function transformArguments(option) {
    return [
        'FT.CONFIG',
        'GET',
        option
    ];
}
exports.transformArguments = transformArguments;
function transformReply(rawReply) {
    const transformedReply = Object.create(null);
    for (const [key, value] of rawReply){
        transformedReply[key] = value;
    }
    return transformedReply;
}
exports.transformReply = transformReply;
}),
"[project]/dawg-ai/node_modules/@redis/search/dist/commands/CONFIG_SET.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformArguments = void 0;
function transformArguments(option, value) {
    return [
        'FT.CONFIG',
        'SET',
        option,
        value
    ];
}
exports.transformArguments = transformArguments;
}),
"[project]/dawg-ai/node_modules/@redis/search/dist/commands/CREATE.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformArguments = void 0;
const generic_transformers_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/client/dist/lib/commands/generic-transformers.js [app-client] (ecmascript)");
const _1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/search/dist/commands/index.js [app-client] (ecmascript)");
function transformArguments(index, schema, options) {
    const args = [
        'FT.CREATE',
        index
    ];
    if (options === null || options === void 0 ? void 0 : options.ON) {
        args.push('ON', options.ON);
    }
    (0, generic_transformers_1.pushOptionalVerdictArgument)(args, 'PREFIX', options === null || options === void 0 ? void 0 : options.PREFIX);
    if (options === null || options === void 0 ? void 0 : options.FILTER) {
        args.push('FILTER', options.FILTER);
    }
    if (options === null || options === void 0 ? void 0 : options.LANGUAGE) {
        args.push('LANGUAGE', options.LANGUAGE);
    }
    if (options === null || options === void 0 ? void 0 : options.LANGUAGE_FIELD) {
        args.push('LANGUAGE_FIELD', options.LANGUAGE_FIELD);
    }
    if (options === null || options === void 0 ? void 0 : options.SCORE) {
        args.push('SCORE', options.SCORE.toString());
    }
    if (options === null || options === void 0 ? void 0 : options.SCORE_FIELD) {
        args.push('SCORE_FIELD', options.SCORE_FIELD);
    }
    // if (options?.PAYLOAD_FIELD) {
    //     args.push('PAYLOAD_FIELD', options.PAYLOAD_FIELD);
    // }
    if (options === null || options === void 0 ? void 0 : options.MAXTEXTFIELDS) {
        args.push('MAXTEXTFIELDS');
    }
    if (options === null || options === void 0 ? void 0 : options.TEMPORARY) {
        args.push('TEMPORARY', options.TEMPORARY.toString());
    }
    if (options === null || options === void 0 ? void 0 : options.NOOFFSETS) {
        args.push('NOOFFSETS');
    }
    if (options === null || options === void 0 ? void 0 : options.NOHL) {
        args.push('NOHL');
    }
    if (options === null || options === void 0 ? void 0 : options.NOFIELDS) {
        args.push('NOFIELDS');
    }
    if (options === null || options === void 0 ? void 0 : options.NOFREQS) {
        args.push('NOFREQS');
    }
    if (options === null || options === void 0 ? void 0 : options.SKIPINITIALSCAN) {
        args.push('SKIPINITIALSCAN');
    }
    (0, generic_transformers_1.pushOptionalVerdictArgument)(args, 'STOPWORDS', options === null || options === void 0 ? void 0 : options.STOPWORDS);
    args.push('SCHEMA');
    (0, _1.pushSchema)(args, schema);
    return args;
}
exports.transformArguments = transformArguments;
}),
"[project]/dawg-ai/node_modules/@redis/search/dist/commands/CURSOR_DEL.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformArguments = exports.FIRST_KEY_INDEX = void 0;
exports.FIRST_KEY_INDEX = 1;
function transformArguments(index, cursorId) {
    return [
        'FT.CURSOR',
        'DEL',
        index,
        cursorId.toString()
    ];
}
exports.transformArguments = transformArguments;
}),
"[project]/dawg-ai/node_modules/@redis/search/dist/commands/CURSOR_READ.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformReply = exports.transformArguments = exports.IS_READ_ONLY = exports.FIRST_KEY_INDEX = void 0;
exports.FIRST_KEY_INDEX = 1;
exports.IS_READ_ONLY = true;
function transformArguments(index, cursor, options) {
    const args = [
        'FT.CURSOR',
        'READ',
        index,
        cursor.toString()
    ];
    if (options === null || options === void 0 ? void 0 : options.COUNT) {
        args.push('COUNT', options.COUNT.toString());
    }
    return args;
}
exports.transformArguments = transformArguments;
var AGGREGATE_WITHCURSOR_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/search/dist/commands/AGGREGATE_WITHCURSOR.js [app-client] (ecmascript)");
Object.defineProperty(exports, "transformReply", {
    enumerable: true,
    get: function() {
        return AGGREGATE_WITHCURSOR_1.transformReply;
    }
});
}),
"[project]/dawg-ai/node_modules/@redis/search/dist/commands/DICTADD.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformArguments = void 0;
const generic_transformers_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/client/dist/lib/commands/generic-transformers.js [app-client] (ecmascript)");
function transformArguments(dictionary, term) {
    return (0, generic_transformers_1.pushVerdictArguments)([
        'FT.DICTADD',
        dictionary
    ], term);
}
exports.transformArguments = transformArguments;
}),
"[project]/dawg-ai/node_modules/@redis/search/dist/commands/DICTDEL.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformArguments = void 0;
const generic_transformers_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/client/dist/lib/commands/generic-transformers.js [app-client] (ecmascript)");
function transformArguments(dictionary, term) {
    return (0, generic_transformers_1.pushVerdictArguments)([
        'FT.DICTDEL',
        dictionary
    ], term);
}
exports.transformArguments = transformArguments;
}),
"[project]/dawg-ai/node_modules/@redis/search/dist/commands/DICTDUMP.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformArguments = void 0;
function transformArguments(dictionary) {
    return [
        'FT.DICTDUMP',
        dictionary
    ];
}
exports.transformArguments = transformArguments;
}),
"[project]/dawg-ai/node_modules/@redis/search/dist/commands/DROPINDEX.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformArguments = void 0;
function transformArguments(index, options) {
    const args = [
        'FT.DROPINDEX',
        index
    ];
    if (options === null || options === void 0 ? void 0 : options.DD) {
        args.push('DD');
    }
    return args;
}
exports.transformArguments = transformArguments;
}),
"[project]/dawg-ai/node_modules/@redis/search/dist/commands/EXPLAIN.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformArguments = exports.IS_READ_ONLY = void 0;
const _1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/search/dist/commands/index.js [app-client] (ecmascript)");
exports.IS_READ_ONLY = true;
function transformArguments(index, query, options) {
    const args = [
        'FT.EXPLAIN',
        index,
        query
    ];
    (0, _1.pushParamsArgs)(args, options === null || options === void 0 ? void 0 : options.PARAMS);
    if (options === null || options === void 0 ? void 0 : options.DIALECT) {
        args.push('DIALECT', options.DIALECT.toString());
    }
    return args;
}
exports.transformArguments = transformArguments;
}),
"[project]/dawg-ai/node_modules/@redis/search/dist/commands/EXPLAINCLI.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformArguments = exports.IS_READ_ONLY = void 0;
exports.IS_READ_ONLY = true;
function transformArguments(index, query) {
    return [
        'FT.EXPLAINCLI',
        index,
        query
    ];
}
exports.transformArguments = transformArguments;
}),
"[project]/dawg-ai/node_modules/@redis/search/dist/commands/INFO.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformReply = exports.transformArguments = void 0;
const generic_transformers_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/client/dist/lib/commands/generic-transformers.js [app-client] (ecmascript)");
function transformArguments(index) {
    return [
        'FT.INFO',
        index
    ];
}
exports.transformArguments = transformArguments;
function transformReply(rawReply) {
    return {
        indexName: rawReply[1],
        indexOptions: rawReply[3],
        indexDefinition: (0, generic_transformers_1.transformTuplesReply)(rawReply[5]),
        attributes: rawReply[7].map((attribute)=>(0, generic_transformers_1.transformTuplesReply)(attribute)),
        numDocs: rawReply[9],
        maxDocId: rawReply[11],
        numTerms: rawReply[13],
        numRecords: rawReply[15],
        invertedSzMb: rawReply[17],
        vectorIndexSzMb: rawReply[19],
        totalInvertedIndexBlocks: rawReply[21],
        offsetVectorsSzMb: rawReply[23],
        docTableSizeMb: rawReply[25],
        sortableValuesSizeMb: rawReply[27],
        keyTableSizeMb: rawReply[29],
        recordsPerDocAvg: rawReply[31],
        bytesPerRecordAvg: rawReply[33],
        offsetsPerTermAvg: rawReply[35],
        offsetBitsPerRecordAvg: rawReply[37],
        hashIndexingFailures: rawReply[39],
        indexing: rawReply[41],
        percentIndexed: rawReply[43],
        gcStats: {
            bytesCollected: rawReply[45][1],
            totalMsRun: rawReply[45][3],
            totalCycles: rawReply[45][5],
            averageCycleTimeMs: rawReply[45][7],
            lastRunTimeMs: rawReply[45][9],
            gcNumericTreesMissed: rawReply[45][11],
            gcBlocksDenied: rawReply[45][13]
        },
        cursorStats: {
            globalIdle: rawReply[47][1],
            globalTotal: rawReply[47][3],
            indexCapacity: rawReply[47][5],
            idnexTotal: rawReply[47][7]
        },
        stopWords: rawReply[49]
    };
}
exports.transformReply = transformReply;
}),
"[project]/dawg-ai/node_modules/@redis/search/dist/commands/SEARCH.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformReply = exports.transformArguments = exports.IS_READ_ONLY = exports.FIRST_KEY_INDEX = void 0;
const _1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/search/dist/commands/index.js [app-client] (ecmascript)");
exports.FIRST_KEY_INDEX = 1;
exports.IS_READ_ONLY = true;
function transformArguments(index, query, options) {
    return (0, _1.pushSearchOptions)([
        'FT.SEARCH',
        index,
        query
    ], options);
}
exports.transformArguments = transformArguments;
function transformReply(reply, withoutDocuments) {
    const documents = [];
    let i = 1;
    while(i < reply.length){
        documents.push({
            id: reply[i++],
            value: withoutDocuments ? Object.create(null) : documentValue(reply[i++])
        });
    }
    return {
        total: reply[0],
        documents
    };
}
exports.transformReply = transformReply;
function documentValue(tuples) {
    const message = Object.create(null);
    let i = 0;
    while(i < tuples.length){
        const key = tuples[i++], value = tuples[i++];
        if (key === '$') {
            try {
                Object.assign(message, JSON.parse(value));
                continue;
            } catch (e) {
            // set as a regular property if not a valid JSON
            }
        }
        message[key] = value;
    }
    return message;
}
}),
"[project]/dawg-ai/node_modules/@redis/search/dist/commands/PROFILE_SEARCH.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformReply = exports.transformArguments = exports.IS_READ_ONLY = void 0;
const SEARCH_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/search/dist/commands/SEARCH.js [app-client] (ecmascript)");
const _1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/search/dist/commands/index.js [app-client] (ecmascript)");
exports.IS_READ_ONLY = true;
function transformArguments(index, query, options) {
    let args = [
        'FT.PROFILE',
        index,
        'SEARCH'
    ];
    if (options === null || options === void 0 ? void 0 : options.LIMITED) {
        args.push('LIMITED');
    }
    args.push('QUERY', query);
    return (0, _1.pushSearchOptions)(args, options);
}
exports.transformArguments = transformArguments;
function transformReply(reply, withoutDocuments) {
    return {
        results: (0, SEARCH_1.transformReply)(reply[0], withoutDocuments),
        profile: (0, _1.transformProfile)(reply[1])
    };
}
exports.transformReply = transformReply;
}),
"[project]/dawg-ai/node_modules/@redis/search/dist/commands/PROFILE_AGGREGATE.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformReply = exports.transformArguments = exports.IS_READ_ONLY = void 0;
const AGGREGATE_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/search/dist/commands/AGGREGATE.js [app-client] (ecmascript)");
const _1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/search/dist/commands/index.js [app-client] (ecmascript)");
exports.IS_READ_ONLY = true;
function transformArguments(index, query, options) {
    const args = [
        'FT.PROFILE',
        index,
        'AGGREGATE'
    ];
    if (options === null || options === void 0 ? void 0 : options.LIMITED) {
        args.push('LIMITED');
    }
    args.push('QUERY', query);
    (0, AGGREGATE_1.pushAggregatehOptions)(args, options);
    return args;
}
exports.transformArguments = transformArguments;
function transformReply(reply) {
    return {
        results: (0, AGGREGATE_1.transformReply)(reply[0]),
        profile: (0, _1.transformProfile)(reply[1])
    };
}
exports.transformReply = transformReply;
}),
"[project]/dawg-ai/node_modules/@redis/search/dist/commands/SEARCH_NOCONTENT.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformReply = exports.transformArguments = exports.IS_READ_ONLY = exports.FIRST_KEY_INDEX = void 0;
const _1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/search/dist/commands/index.js [app-client] (ecmascript)");
exports.FIRST_KEY_INDEX = 1;
exports.IS_READ_ONLY = true;
function transformArguments(index, query, options) {
    return (0, _1.pushSearchOptions)([
        'FT.SEARCH',
        index,
        query,
        'NOCONTENT'
    ], options);
}
exports.transformArguments = transformArguments;
;
function transformReply(reply) {
    return {
        total: reply[0],
        documents: reply.slice(1)
    };
}
exports.transformReply = transformReply;
}),
"[project]/dawg-ai/node_modules/@redis/search/dist/commands/SPELLCHECK.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformReply = exports.transformArguments = void 0;
function transformArguments(index, query, options) {
    const args = [
        'FT.SPELLCHECK',
        index,
        query
    ];
    if (options === null || options === void 0 ? void 0 : options.DISTANCE) {
        args.push('DISTANCE', options.DISTANCE.toString());
    }
    if (options === null || options === void 0 ? void 0 : options.TERMS) {
        if (Array.isArray(options.TERMS)) {
            for (const term of options.TERMS){
                pushTerms(args, term);
            }
        } else {
            pushTerms(args, options.TERMS);
        }
    }
    if (options === null || options === void 0 ? void 0 : options.DIALECT) {
        args.push('DIALECT', options.DIALECT.toString());
    }
    return args;
}
exports.transformArguments = transformArguments;
function pushTerms(args, param) {
    let { mode, dictionary } = param;
    args.push('TERMS', mode, dictionary);
}
function transformReply(rawReply) {
    return rawReply.map((param)=>{
        let [, term, suggestions] = param;
        return {
            term,
            suggestions: suggestions.map((param)=>{
                let [score, suggestion] = param;
                return {
                    score: Number(score),
                    suggestion
                };
            })
        };
    });
}
exports.transformReply = transformReply;
}),
"[project]/dawg-ai/node_modules/@redis/search/dist/commands/SUGADD.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformArguments = void 0;
function transformArguments(key, string, score, options) {
    const args = [
        'FT.SUGADD',
        key,
        string,
        score.toString()
    ];
    if (options === null || options === void 0 ? void 0 : options.INCR) {
        args.push('INCR');
    }
    if (options === null || options === void 0 ? void 0 : options.PAYLOAD) {
        args.push('PAYLOAD', options.PAYLOAD);
    }
    return args;
}
exports.transformArguments = transformArguments;
}),
"[project]/dawg-ai/node_modules/@redis/search/dist/commands/SUGDEL.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformReply = exports.transformArguments = void 0;
function transformArguments(key, string) {
    return [
        'FT.SUGDEL',
        key,
        string
    ];
}
exports.transformArguments = transformArguments;
var generic_transformers_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/client/dist/lib/commands/generic-transformers.js [app-client] (ecmascript)");
Object.defineProperty(exports, "transformReply", {
    enumerable: true,
    get: function() {
        return generic_transformers_1.transformBooleanReply;
    }
});
}),
"[project]/dawg-ai/node_modules/@redis/search/dist/commands/SUGGET.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformArguments = exports.IS_READ_ONLY = void 0;
exports.IS_READ_ONLY = true;
function transformArguments(key, prefix, options) {
    const args = [
        'FT.SUGGET',
        key,
        prefix
    ];
    if (options === null || options === void 0 ? void 0 : options.FUZZY) {
        args.push('FUZZY');
    }
    if (options === null || options === void 0 ? void 0 : options.MAX) {
        args.push('MAX', options.MAX.toString());
    }
    return args;
}
exports.transformArguments = transformArguments;
}),
"[project]/dawg-ai/node_modules/@redis/search/dist/commands/SUGGET_WITHPAYLOADS.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformReply = exports.transformArguments = exports.IS_READ_ONLY = void 0;
const SUGGET_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/search/dist/commands/SUGGET.js [app-client] (ecmascript)");
var SUGGET_2 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/search/dist/commands/SUGGET.js [app-client] (ecmascript)");
Object.defineProperty(exports, "IS_READ_ONLY", {
    enumerable: true,
    get: function() {
        return SUGGET_2.IS_READ_ONLY;
    }
});
function transformArguments(key, prefix, options) {
    return [
        ...(0, SUGGET_1.transformArguments)(key, prefix, options),
        'WITHPAYLOADS'
    ];
}
exports.transformArguments = transformArguments;
function transformReply(rawReply) {
    if (rawReply === null) return null;
    const transformedReply = [];
    for(let i = 0; i < rawReply.length; i += 2){
        transformedReply.push({
            suggestion: rawReply[i],
            payload: rawReply[i + 1]
        });
    }
    return transformedReply;
}
exports.transformReply = transformReply;
}),
"[project]/dawg-ai/node_modules/@redis/search/dist/commands/SUGGET_WITHSCORES_WITHPAYLOADS.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformReply = exports.transformArguments = exports.IS_READ_ONLY = void 0;
const SUGGET_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/search/dist/commands/SUGGET.js [app-client] (ecmascript)");
var SUGGET_2 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/search/dist/commands/SUGGET.js [app-client] (ecmascript)");
Object.defineProperty(exports, "IS_READ_ONLY", {
    enumerable: true,
    get: function() {
        return SUGGET_2.IS_READ_ONLY;
    }
});
function transformArguments(key, prefix, options) {
    return [
        ...(0, SUGGET_1.transformArguments)(key, prefix, options),
        'WITHSCORES',
        'WITHPAYLOADS'
    ];
}
exports.transformArguments = transformArguments;
function transformReply(rawReply) {
    if (rawReply === null) return null;
    const transformedReply = [];
    for(let i = 0; i < rawReply.length; i += 3){
        transformedReply.push({
            suggestion: rawReply[i],
            score: Number(rawReply[i + 1]),
            payload: rawReply[i + 2]
        });
    }
    return transformedReply;
}
exports.transformReply = transformReply;
}),
"[project]/dawg-ai/node_modules/@redis/search/dist/commands/SUGGET_WITHSCORES.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformReply = exports.transformArguments = exports.IS_READ_ONLY = void 0;
const SUGGET_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/search/dist/commands/SUGGET.js [app-client] (ecmascript)");
var SUGGET_2 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/search/dist/commands/SUGGET.js [app-client] (ecmascript)");
Object.defineProperty(exports, "IS_READ_ONLY", {
    enumerable: true,
    get: function() {
        return SUGGET_2.IS_READ_ONLY;
    }
});
function transformArguments(key, prefix, options) {
    return [
        ...(0, SUGGET_1.transformArguments)(key, prefix, options),
        'WITHSCORES'
    ];
}
exports.transformArguments = transformArguments;
function transformReply(rawReply) {
    if (rawReply === null) return null;
    const transformedReply = [];
    for(let i = 0; i < rawReply.length; i += 2){
        transformedReply.push({
            suggestion: rawReply[i],
            score: Number(rawReply[i + 1])
        });
    }
    return transformedReply;
}
exports.transformReply = transformReply;
}),
"[project]/dawg-ai/node_modules/@redis/search/dist/commands/SUGLEN.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformArguments = exports.IS_READ_ONLY = void 0;
exports.IS_READ_ONLY = true;
function transformArguments(key) {
    return [
        'FT.SUGLEN',
        key
    ];
}
exports.transformArguments = transformArguments;
}),
"[project]/dawg-ai/node_modules/@redis/search/dist/commands/SYNDUMP.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformArguments = void 0;
function transformArguments(index) {
    return [
        'FT.SYNDUMP',
        index
    ];
}
exports.transformArguments = transformArguments;
}),
"[project]/dawg-ai/node_modules/@redis/search/dist/commands/SYNUPDATE.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformArguments = void 0;
const generic_transformers_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/client/dist/lib/commands/generic-transformers.js [app-client] (ecmascript)");
function transformArguments(index, groupId, terms, options) {
    const args = [
        'FT.SYNUPDATE',
        index,
        groupId
    ];
    if (options === null || options === void 0 ? void 0 : options.SKIPINITIALSCAN) {
        args.push('SKIPINITIALSCAN');
    }
    return (0, generic_transformers_1.pushVerdictArguments)(args, terms);
}
exports.transformArguments = transformArguments;
}),
"[project]/dawg-ai/node_modules/@redis/search/dist/commands/TAGVALS.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformArguments = void 0;
function transformArguments(index, fieldName) {
    return [
        'FT.TAGVALS',
        index,
        fieldName
    ];
}
exports.transformArguments = transformArguments;
}),
"[project]/dawg-ai/node_modules/@redis/search/dist/commands/index.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformProfile = exports.pushSearchOptions = exports.pushParamsArgs = exports.pushSchema = exports.SCHEMA_GEO_SHAPE_COORD_SYSTEM = exports.VectorAlgorithms = exports.SchemaTextFieldPhonetics = exports.SchemaFieldTypes = exports.pushArgumentsWithLength = exports.pushSortByArguments = exports.pushSortByProperty = exports.RedisSearchLanguages = void 0;
const _LIST = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/search/dist/commands/_LIST.js [app-client] (ecmascript)");
const ALTER = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/search/dist/commands/ALTER.js [app-client] (ecmascript)");
const AGGREGATE_WITHCURSOR = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/search/dist/commands/AGGREGATE_WITHCURSOR.js [app-client] (ecmascript)");
const AGGREGATE = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/search/dist/commands/AGGREGATE.js [app-client] (ecmascript)");
const ALIASADD = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/search/dist/commands/ALIASADD.js [app-client] (ecmascript)");
const ALIASDEL = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/search/dist/commands/ALIASDEL.js [app-client] (ecmascript)");
const ALIASUPDATE = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/search/dist/commands/ALIASUPDATE.js [app-client] (ecmascript)");
const CONFIG_GET = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/search/dist/commands/CONFIG_GET.js [app-client] (ecmascript)");
const CONFIG_SET = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/search/dist/commands/CONFIG_SET.js [app-client] (ecmascript)");
const CREATE = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/search/dist/commands/CREATE.js [app-client] (ecmascript)");
const CURSOR_DEL = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/search/dist/commands/CURSOR_DEL.js [app-client] (ecmascript)");
const CURSOR_READ = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/search/dist/commands/CURSOR_READ.js [app-client] (ecmascript)");
const DICTADD = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/search/dist/commands/DICTADD.js [app-client] (ecmascript)");
const DICTDEL = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/search/dist/commands/DICTDEL.js [app-client] (ecmascript)");
const DICTDUMP = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/search/dist/commands/DICTDUMP.js [app-client] (ecmascript)");
const DROPINDEX = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/search/dist/commands/DROPINDEX.js [app-client] (ecmascript)");
const EXPLAIN = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/search/dist/commands/EXPLAIN.js [app-client] (ecmascript)");
const EXPLAINCLI = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/search/dist/commands/EXPLAINCLI.js [app-client] (ecmascript)");
const INFO = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/search/dist/commands/INFO.js [app-client] (ecmascript)");
const PROFILESEARCH = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/search/dist/commands/PROFILE_SEARCH.js [app-client] (ecmascript)");
const PROFILEAGGREGATE = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/search/dist/commands/PROFILE_AGGREGATE.js [app-client] (ecmascript)");
const SEARCH = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/search/dist/commands/SEARCH.js [app-client] (ecmascript)");
const SEARCH_NOCONTENT = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/search/dist/commands/SEARCH_NOCONTENT.js [app-client] (ecmascript)");
const SPELLCHECK = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/search/dist/commands/SPELLCHECK.js [app-client] (ecmascript)");
const SUGADD = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/search/dist/commands/SUGADD.js [app-client] (ecmascript)");
const SUGDEL = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/search/dist/commands/SUGDEL.js [app-client] (ecmascript)");
const SUGGET_WITHPAYLOADS = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/search/dist/commands/SUGGET_WITHPAYLOADS.js [app-client] (ecmascript)");
const SUGGET_WITHSCORES_WITHPAYLOADS = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/search/dist/commands/SUGGET_WITHSCORES_WITHPAYLOADS.js [app-client] (ecmascript)");
const SUGGET_WITHSCORES = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/search/dist/commands/SUGGET_WITHSCORES.js [app-client] (ecmascript)");
const SUGGET = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/search/dist/commands/SUGGET.js [app-client] (ecmascript)");
const SUGLEN = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/search/dist/commands/SUGLEN.js [app-client] (ecmascript)");
const SYNDUMP = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/search/dist/commands/SYNDUMP.js [app-client] (ecmascript)");
const SYNUPDATE = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/search/dist/commands/SYNUPDATE.js [app-client] (ecmascript)");
const TAGVALS = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/search/dist/commands/TAGVALS.js [app-client] (ecmascript)");
const generic_transformers_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/client/dist/lib/commands/generic-transformers.js [app-client] (ecmascript)");
exports.default = {
    _LIST,
    _list: _LIST,
    ALTER,
    alter: ALTER,
    AGGREGATE_WITHCURSOR,
    aggregateWithCursor: AGGREGATE_WITHCURSOR,
    AGGREGATE,
    aggregate: AGGREGATE,
    ALIASADD,
    aliasAdd: ALIASADD,
    ALIASDEL,
    aliasDel: ALIASDEL,
    ALIASUPDATE,
    aliasUpdate: ALIASUPDATE,
    CONFIG_GET,
    configGet: CONFIG_GET,
    CONFIG_SET,
    configSet: CONFIG_SET,
    CREATE,
    create: CREATE,
    CURSOR_DEL,
    cursorDel: CURSOR_DEL,
    CURSOR_READ,
    cursorRead: CURSOR_READ,
    DICTADD,
    dictAdd: DICTADD,
    DICTDEL,
    dictDel: DICTDEL,
    DICTDUMP,
    dictDump: DICTDUMP,
    DROPINDEX,
    dropIndex: DROPINDEX,
    EXPLAIN,
    explain: EXPLAIN,
    EXPLAINCLI,
    explainCli: EXPLAINCLI,
    INFO,
    info: INFO,
    PROFILESEARCH,
    profileSearch: PROFILESEARCH,
    PROFILEAGGREGATE,
    profileAggregate: PROFILEAGGREGATE,
    SEARCH,
    search: SEARCH,
    SEARCH_NOCONTENT,
    searchNoContent: SEARCH_NOCONTENT,
    SPELLCHECK,
    spellCheck: SPELLCHECK,
    SUGADD,
    sugAdd: SUGADD,
    SUGDEL,
    sugDel: SUGDEL,
    SUGGET_WITHPAYLOADS,
    sugGetWithPayloads: SUGGET_WITHPAYLOADS,
    SUGGET_WITHSCORES_WITHPAYLOADS,
    sugGetWithScoresWithPayloads: SUGGET_WITHSCORES_WITHPAYLOADS,
    SUGGET_WITHSCORES,
    sugGetWithScores: SUGGET_WITHSCORES,
    SUGGET,
    sugGet: SUGGET,
    SUGLEN,
    sugLen: SUGLEN,
    SYNDUMP,
    synDump: SYNDUMP,
    SYNUPDATE,
    synUpdate: SYNUPDATE,
    TAGVALS,
    tagVals: TAGVALS
};
var RedisSearchLanguages;
(function(RedisSearchLanguages) {
    RedisSearchLanguages["ARABIC"] = "Arabic";
    RedisSearchLanguages["BASQUE"] = "Basque";
    RedisSearchLanguages["CATALANA"] = "Catalan";
    RedisSearchLanguages["DANISH"] = "Danish";
    RedisSearchLanguages["DUTCH"] = "Dutch";
    RedisSearchLanguages["ENGLISH"] = "English";
    RedisSearchLanguages["FINNISH"] = "Finnish";
    RedisSearchLanguages["FRENCH"] = "French";
    RedisSearchLanguages["GERMAN"] = "German";
    RedisSearchLanguages["GREEK"] = "Greek";
    RedisSearchLanguages["HUNGARIAN"] = "Hungarian";
    RedisSearchLanguages["INDONESAIN"] = "Indonesian";
    RedisSearchLanguages["IRISH"] = "Irish";
    RedisSearchLanguages["ITALIAN"] = "Italian";
    RedisSearchLanguages["LITHUANIAN"] = "Lithuanian";
    RedisSearchLanguages["NEPALI"] = "Nepali";
    RedisSearchLanguages["NORWEIGAN"] = "Norwegian";
    RedisSearchLanguages["PORTUGUESE"] = "Portuguese";
    RedisSearchLanguages["ROMANIAN"] = "Romanian";
    RedisSearchLanguages["RUSSIAN"] = "Russian";
    RedisSearchLanguages["SPANISH"] = "Spanish";
    RedisSearchLanguages["SWEDISH"] = "Swedish";
    RedisSearchLanguages["TAMIL"] = "Tamil";
    RedisSearchLanguages["TURKISH"] = "Turkish";
    RedisSearchLanguages["CHINESE"] = "Chinese";
})(RedisSearchLanguages || (exports.RedisSearchLanguages = RedisSearchLanguages = {}));
function pushSortByProperty(args, sortBy) {
    if (typeof sortBy === 'string') {
        args.push(sortBy);
    } else {
        args.push(sortBy.BY);
        if (sortBy.DIRECTION) {
            args.push(sortBy.DIRECTION);
        }
    }
}
exports.pushSortByProperty = pushSortByProperty;
function pushSortByArguments(args, name, sortBy) {
    const lengthBefore = args.push(name, '' // will be overwritten
    );
    if (Array.isArray(sortBy)) {
        for (const field of sortBy){
            pushSortByProperty(args, field);
        }
    } else {
        pushSortByProperty(args, sortBy);
    }
    args[lengthBefore - 1] = (args.length - lengthBefore).toString();
    return args;
}
exports.pushSortByArguments = pushSortByArguments;
function pushArgumentsWithLength(args, fn) {
    const lengthIndex = args.push('') - 1;
    fn(args);
    args[lengthIndex] = (args.length - lengthIndex - 1).toString();
    return args;
}
exports.pushArgumentsWithLength = pushArgumentsWithLength;
var SchemaFieldTypes;
(function(SchemaFieldTypes) {
    SchemaFieldTypes["TEXT"] = "TEXT";
    SchemaFieldTypes["NUMERIC"] = "NUMERIC";
    SchemaFieldTypes["GEO"] = "GEO";
    SchemaFieldTypes["TAG"] = "TAG";
    SchemaFieldTypes["VECTOR"] = "VECTOR";
    SchemaFieldTypes["GEOSHAPE"] = "GEOSHAPE";
})(SchemaFieldTypes || (exports.SchemaFieldTypes = SchemaFieldTypes = {}));
function pushCommonFieldArguments(args, fieldOptions) {
    if (fieldOptions.SORTABLE) {
        args.push('SORTABLE');
        if (fieldOptions.SORTABLE === 'UNF') {
            args.push('UNF');
        }
    }
    if (fieldOptions.NOINDEX) {
        args.push('NOINDEX');
    }
}
var SchemaTextFieldPhonetics;
(function(SchemaTextFieldPhonetics) {
    SchemaTextFieldPhonetics["DM_EN"] = "dm:en";
    SchemaTextFieldPhonetics["DM_FR"] = "dm:fr";
    SchemaTextFieldPhonetics["FM_PT"] = "dm:pt";
    SchemaTextFieldPhonetics["DM_ES"] = "dm:es";
})(SchemaTextFieldPhonetics || (exports.SchemaTextFieldPhonetics = SchemaTextFieldPhonetics = {}));
var VectorAlgorithms;
(function(VectorAlgorithms) {
    VectorAlgorithms["FLAT"] = "FLAT";
    VectorAlgorithms["HNSW"] = "HNSW";
})(VectorAlgorithms || (exports.VectorAlgorithms = VectorAlgorithms = {}));
exports.SCHEMA_GEO_SHAPE_COORD_SYSTEM = {
    SPHERICAL: 'SPHERICAL',
    FLAT: 'FLAT'
};
function pushSchema(args, schema) {
    for (const [field, fieldOptions] of Object.entries(schema)){
        args.push(field);
        if (typeof fieldOptions === 'string') {
            args.push(fieldOptions);
            continue;
        }
        if (fieldOptions.AS) {
            args.push('AS', fieldOptions.AS);
        }
        args.push(fieldOptions.type);
        switch(fieldOptions.type){
            case SchemaFieldTypes.TEXT:
                if (fieldOptions.NOSTEM) {
                    args.push('NOSTEM');
                }
                if (fieldOptions.WEIGHT) {
                    args.push('WEIGHT', fieldOptions.WEIGHT.toString());
                }
                if (fieldOptions.PHONETIC) {
                    args.push('PHONETIC', fieldOptions.PHONETIC);
                }
                if (fieldOptions.WITHSUFFIXTRIE) {
                    args.push('WITHSUFFIXTRIE');
                }
                pushCommonFieldArguments(args, fieldOptions);
                if (fieldOptions.INDEXEMPTY) {
                    args.push('INDEXEMPTY');
                }
                break;
            case SchemaFieldTypes.NUMERIC:
            case SchemaFieldTypes.GEO:
                pushCommonFieldArguments(args, fieldOptions);
                break;
            case SchemaFieldTypes.TAG:
                if (fieldOptions.SEPARATOR) {
                    args.push('SEPARATOR', fieldOptions.SEPARATOR);
                }
                if (fieldOptions.CASESENSITIVE) {
                    args.push('CASESENSITIVE');
                }
                if (fieldOptions.WITHSUFFIXTRIE) {
                    args.push('WITHSUFFIXTRIE');
                }
                pushCommonFieldArguments(args, fieldOptions);
                if (fieldOptions.INDEXEMPTY) {
                    args.push('INDEXEMPTY');
                }
                break;
            case SchemaFieldTypes.VECTOR:
                args.push(fieldOptions.ALGORITHM);
                pushArgumentsWithLength(args, ()=>{
                    args.push('TYPE', fieldOptions.TYPE, 'DIM', fieldOptions.DIM.toString(), 'DISTANCE_METRIC', fieldOptions.DISTANCE_METRIC);
                    if (fieldOptions.INITIAL_CAP) {
                        args.push('INITIAL_CAP', fieldOptions.INITIAL_CAP.toString());
                    }
                    switch(fieldOptions.ALGORITHM){
                        case VectorAlgorithms.FLAT:
                            if (fieldOptions.BLOCK_SIZE) {
                                args.push('BLOCK_SIZE', fieldOptions.BLOCK_SIZE.toString());
                            }
                            break;
                        case VectorAlgorithms.HNSW:
                            if (fieldOptions.M) {
                                args.push('M', fieldOptions.M.toString());
                            }
                            if (fieldOptions.EF_CONSTRUCTION) {
                                args.push('EF_CONSTRUCTION', fieldOptions.EF_CONSTRUCTION.toString());
                            }
                            if (fieldOptions.EF_RUNTIME) {
                                args.push('EF_RUNTIME', fieldOptions.EF_RUNTIME.toString());
                            }
                            break;
                    }
                });
                break;
            case SchemaFieldTypes.GEOSHAPE:
                if (fieldOptions.COORD_SYSTEM !== undefined) {
                    args.push('COORD_SYSTEM', fieldOptions.COORD_SYSTEM);
                }
                pushCommonFieldArguments(args, fieldOptions);
                break;
        }
        if (fieldOptions.INDEXMISSING) {
            args.push('INDEXMISSING');
        }
    }
}
exports.pushSchema = pushSchema;
function pushParamsArgs(args, params) {
    if (params) {
        const enrties = Object.entries(params);
        args.push('PARAMS', (enrties.length * 2).toString());
        for (const [key, value] of enrties){
            args.push(key, typeof value === 'number' ? value.toString() : value);
        }
    }
    return args;
}
exports.pushParamsArgs = pushParamsArgs;
function pushSearchOptions(args, options) {
    var _options_RETURN;
    if (options === null || options === void 0 ? void 0 : options.VERBATIM) {
        args.push('VERBATIM');
    }
    if (options === null || options === void 0 ? void 0 : options.NOSTOPWORDS) {
        args.push('NOSTOPWORDS');
    }
    // if (options?.WITHSCORES) {
    //     args.push('WITHSCORES');
    // }
    // if (options?.WITHPAYLOADS) {
    //     args.push('WITHPAYLOADS');
    // }
    (0, generic_transformers_1.pushOptionalVerdictArgument)(args, 'INKEYS', options === null || options === void 0 ? void 0 : options.INKEYS);
    (0, generic_transformers_1.pushOptionalVerdictArgument)(args, 'INFIELDS', options === null || options === void 0 ? void 0 : options.INFIELDS);
    (0, generic_transformers_1.pushOptionalVerdictArgument)(args, 'RETURN', options === null || options === void 0 ? void 0 : options.RETURN);
    if (options === null || options === void 0 ? void 0 : options.SUMMARIZE) {
        args.push('SUMMARIZE');
        if (typeof options.SUMMARIZE === 'object') {
            if (options.SUMMARIZE.FIELDS) {
                args.push('FIELDS');
                (0, generic_transformers_1.pushVerdictArgument)(args, options.SUMMARIZE.FIELDS);
            }
            if (options.SUMMARIZE.FRAGS) {
                args.push('FRAGS', options.SUMMARIZE.FRAGS.toString());
            }
            if (options.SUMMARIZE.LEN) {
                args.push('LEN', options.SUMMARIZE.LEN.toString());
            }
            if (options.SUMMARIZE.SEPARATOR) {
                args.push('SEPARATOR', options.SUMMARIZE.SEPARATOR);
            }
        }
    }
    if (options === null || options === void 0 ? void 0 : options.HIGHLIGHT) {
        args.push('HIGHLIGHT');
        if (typeof options.HIGHLIGHT === 'object') {
            if (options.HIGHLIGHT.FIELDS) {
                args.push('FIELDS');
                (0, generic_transformers_1.pushVerdictArgument)(args, options.HIGHLIGHT.FIELDS);
            }
            if (options.HIGHLIGHT.TAGS) {
                args.push('TAGS', options.HIGHLIGHT.TAGS.open, options.HIGHLIGHT.TAGS.close);
            }
        }
    }
    if (options === null || options === void 0 ? void 0 : options.SLOP) {
        args.push('SLOP', options.SLOP.toString());
    }
    if (options === null || options === void 0 ? void 0 : options.INORDER) {
        args.push('INORDER');
    }
    if (options === null || options === void 0 ? void 0 : options.LANGUAGE) {
        args.push('LANGUAGE', options.LANGUAGE);
    }
    if (options === null || options === void 0 ? void 0 : options.EXPANDER) {
        args.push('EXPANDER', options.EXPANDER);
    }
    if (options === null || options === void 0 ? void 0 : options.SCORER) {
        args.push('SCORER', options.SCORER);
    }
    // if (options?.EXPLAINSCORE) {
    //     args.push('EXPLAINSCORE');
    // }
    // if (options?.PAYLOAD) {
    //     args.push('PAYLOAD', options.PAYLOAD);
    // }
    if (options === null || options === void 0 ? void 0 : options.SORTBY) {
        args.push('SORTBY');
        pushSortByProperty(args, options.SORTBY);
    }
    // if (options?.MSORTBY) {
    //     pushSortByArguments(args, 'MSORTBY', options.MSORTBY);
    // }
    if (options === null || options === void 0 ? void 0 : options.LIMIT) {
        args.push('LIMIT', options.LIMIT.from.toString(), options.LIMIT.size.toString());
    }
    if (options === null || options === void 0 ? void 0 : options.PARAMS) {
        pushParamsArgs(args, options.PARAMS);
    }
    if (options === null || options === void 0 ? void 0 : options.DIALECT) {
        args.push('DIALECT', options.DIALECT.toString());
    }
    if ((options === null || options === void 0 ? void 0 : (_options_RETURN = options.RETURN) === null || _options_RETURN === void 0 ? void 0 : _options_RETURN.length) === 0) {
        args.preserve = true;
    }
    if ((options === null || options === void 0 ? void 0 : options.TIMEOUT) !== undefined) {
        args.push('TIMEOUT', options.TIMEOUT.toString());
    }
    return args;
}
exports.pushSearchOptions = pushSearchOptions;
function transformProfile(reply) {
    return {
        totalProfileTime: reply[0][1],
        parsingTime: reply[1][1],
        pipelineCreationTime: reply[2][1],
        iteratorsProfile: transformIterators(reply[3][1])
    };
}
exports.transformProfile = transformProfile;
function transformIterators(IteratorsProfile) {
    var res = {};
    for(let i = 0; i < IteratorsProfile.length; i += 2){
        const value = IteratorsProfile[i + 1];
        switch(IteratorsProfile[i]){
            case 'Type':
                res.type = value;
                break;
            case 'Counter':
                res.counter = value;
                break;
            case 'Time':
                res.time = value;
                break;
            case 'Query type':
                res.queryType = value;
                break;
            case 'Child iterators':
                res.childIterators = value.map(transformChildIterators);
                break;
        }
    }
    return res;
}
function transformChildIterators(IteratorsProfile) {
    var res = {};
    for(let i = 1; i < IteratorsProfile.length; i += 2){
        const value = IteratorsProfile[i + 1];
        switch(IteratorsProfile[i]){
            case 'Type':
                res.type = value;
                break;
            case 'Counter':
                res.counter = value;
                break;
            case 'Time':
                res.time = value;
                break;
            case 'Size':
                res.size = value;
                break;
            case 'Term':
                res.term = value;
                break;
            case 'Child iterators':
                res.childIterators = value.map(transformChildIterators);
                break;
        }
    }
    return res;
}
}),
"[project]/dawg-ai/node_modules/@redis/search/dist/index.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.AggregateSteps = exports.AggregateGroupByReducers = exports.VectorAlgorithms = exports.SchemaTextFieldPhonetics = exports.SchemaFieldTypes = exports.RedisSearchLanguages = exports.default = void 0;
var commands_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/search/dist/commands/index.js [app-client] (ecmascript)");
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return commands_1.default;
    }
});
var commands_2 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/search/dist/commands/index.js [app-client] (ecmascript)");
Object.defineProperty(exports, "RedisSearchLanguages", {
    enumerable: true,
    get: function() {
        return commands_2.RedisSearchLanguages;
    }
});
Object.defineProperty(exports, "SchemaFieldTypes", {
    enumerable: true,
    get: function() {
        return commands_2.SchemaFieldTypes;
    }
});
Object.defineProperty(exports, "SchemaTextFieldPhonetics", {
    enumerable: true,
    get: function() {
        return commands_2.SchemaTextFieldPhonetics;
    }
});
Object.defineProperty(exports, "VectorAlgorithms", {
    enumerable: true,
    get: function() {
        return commands_2.VectorAlgorithms;
    }
});
var AGGREGATE_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/search/dist/commands/AGGREGATE.js [app-client] (ecmascript)");
Object.defineProperty(exports, "AggregateGroupByReducers", {
    enumerable: true,
    get: function() {
        return AGGREGATE_1.AggregateGroupByReducers;
    }
});
Object.defineProperty(exports, "AggregateSteps", {
    enumerable: true,
    get: function() {
        return AGGREGATE_1.AggregateSteps;
    }
});
}),
"[project]/dawg-ai/node_modules/@redis/time-series/dist/commands/ADD.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformArguments = exports.FIRST_KEY_INDEX = void 0;
const _1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/time-series/dist/commands/index.js [app-client] (ecmascript)");
exports.FIRST_KEY_INDEX = 1;
function transformArguments(key, timestamp, value, options) {
    const args = [
        'TS.ADD',
        key,
        (0, _1.transformTimestampArgument)(timestamp),
        value.toString()
    ];
    (0, _1.pushRetentionArgument)(args, options === null || options === void 0 ? void 0 : options.RETENTION);
    (0, _1.pushEncodingArgument)(args, options === null || options === void 0 ? void 0 : options.ENCODING);
    (0, _1.pushChunkSizeArgument)(args, options === null || options === void 0 ? void 0 : options.CHUNK_SIZE);
    if (options === null || options === void 0 ? void 0 : options.ON_DUPLICATE) {
        args.push('ON_DUPLICATE', options.ON_DUPLICATE);
    }
    (0, _1.pushLabelsArgument)(args, options === null || options === void 0 ? void 0 : options.LABELS);
    (0, _1.pushIgnoreArgument)(args, options === null || options === void 0 ? void 0 : options.IGNORE);
    return args;
}
exports.transformArguments = transformArguments;
}),
"[project]/dawg-ai/node_modules/@redis/time-series/dist/commands/ALTER.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformArguments = exports.FIRST_KEY_INDEX = void 0;
const _1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/time-series/dist/commands/index.js [app-client] (ecmascript)");
exports.FIRST_KEY_INDEX = 1;
function transformArguments(key, options) {
    const args = [
        'TS.ALTER',
        key
    ];
    (0, _1.pushRetentionArgument)(args, options === null || options === void 0 ? void 0 : options.RETENTION);
    (0, _1.pushChunkSizeArgument)(args, options === null || options === void 0 ? void 0 : options.CHUNK_SIZE);
    (0, _1.pushDuplicatePolicy)(args, options === null || options === void 0 ? void 0 : options.DUPLICATE_POLICY);
    (0, _1.pushLabelsArgument)(args, options === null || options === void 0 ? void 0 : options.LABELS);
    (0, _1.pushIgnoreArgument)(args, options === null || options === void 0 ? void 0 : options.IGNORE);
    return args;
}
exports.transformArguments = transformArguments;
}),
"[project]/dawg-ai/node_modules/@redis/time-series/dist/commands/CREATE.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformArguments = exports.FIRST_KEY_INDEX = void 0;
const _1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/time-series/dist/commands/index.js [app-client] (ecmascript)");
exports.FIRST_KEY_INDEX = 1;
function transformArguments(key, options) {
    const args = [
        'TS.CREATE',
        key
    ];
    (0, _1.pushRetentionArgument)(args, options === null || options === void 0 ? void 0 : options.RETENTION);
    (0, _1.pushEncodingArgument)(args, options === null || options === void 0 ? void 0 : options.ENCODING);
    (0, _1.pushChunkSizeArgument)(args, options === null || options === void 0 ? void 0 : options.CHUNK_SIZE);
    (0, _1.pushDuplicatePolicy)(args, options === null || options === void 0 ? void 0 : options.DUPLICATE_POLICY);
    (0, _1.pushLabelsArgument)(args, options === null || options === void 0 ? void 0 : options.LABELS);
    (0, _1.pushIgnoreArgument)(args, options === null || options === void 0 ? void 0 : options.IGNORE);
    return args;
}
exports.transformArguments = transformArguments;
}),
"[project]/dawg-ai/node_modules/@redis/time-series/dist/commands/CREATERULE.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformArguments = exports.FIRST_KEY_INDEX = void 0;
exports.FIRST_KEY_INDEX = 1;
function transformArguments(sourceKey, destinationKey, aggregationType, bucketDuration, alignTimestamp) {
    const args = [
        'TS.CREATERULE',
        sourceKey,
        destinationKey,
        'AGGREGATION',
        aggregationType,
        bucketDuration.toString()
    ];
    if (alignTimestamp) {
        args.push(alignTimestamp.toString());
    }
    return args;
}
exports.transformArguments = transformArguments;
}),
"[project]/dawg-ai/node_modules/@redis/time-series/dist/commands/DECRBY.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformArguments = exports.FIRST_KEY_INDEX = void 0;
const _1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/time-series/dist/commands/index.js [app-client] (ecmascript)");
exports.FIRST_KEY_INDEX = 1;
function transformArguments(key, value, options) {
    return (0, _1.transformIncrDecrArguments)('TS.DECRBY', key, value, options);
}
exports.transformArguments = transformArguments;
}),
"[project]/dawg-ai/node_modules/@redis/time-series/dist/commands/DEL.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformArguments = exports.FIRTS_KEY_INDEX = void 0;
const _1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/time-series/dist/commands/index.js [app-client] (ecmascript)");
exports.FIRTS_KEY_INDEX = 1;
function transformArguments(key, fromTimestamp, toTimestamp) {
    return [
        'TS.DEL',
        key,
        (0, _1.transformTimestampArgument)(fromTimestamp),
        (0, _1.transformTimestampArgument)(toTimestamp)
    ];
}
exports.transformArguments = transformArguments;
}),
"[project]/dawg-ai/node_modules/@redis/time-series/dist/commands/DELETERULE.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformArguments = exports.FIRST_KEY_INDEX = void 0;
exports.FIRST_KEY_INDEX = 1;
function transformArguments(sourceKey, destinationKey) {
    return [
        'TS.DELETERULE',
        sourceKey,
        destinationKey
    ];
}
exports.transformArguments = transformArguments;
}),
"[project]/dawg-ai/node_modules/@redis/time-series/dist/commands/GET.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformReply = exports.transformArguments = exports.IS_READ_ONLY = exports.FIRST_KEY_INDEX = void 0;
const _1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/time-series/dist/commands/index.js [app-client] (ecmascript)");
exports.FIRST_KEY_INDEX = 1;
exports.IS_READ_ONLY = true;
function transformArguments(key, options) {
    return (0, _1.pushLatestArgument)([
        'TS.GET',
        key
    ], options === null || options === void 0 ? void 0 : options.LATEST);
}
exports.transformArguments = transformArguments;
function transformReply(reply) {
    if (reply.length === 0) return null;
    return (0, _1.transformSampleReply)(reply);
}
exports.transformReply = transformReply;
}),
"[project]/dawg-ai/node_modules/@redis/time-series/dist/commands/INCRBY.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformArguments = exports.FIRST_KEY_INDEX = void 0;
const _1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/time-series/dist/commands/index.js [app-client] (ecmascript)");
exports.FIRST_KEY_INDEX = 1;
function transformArguments(key, value, options) {
    return (0, _1.transformIncrDecrArguments)('TS.INCRBY', key, value, options);
}
exports.transformArguments = transformArguments;
}),
"[project]/dawg-ai/node_modules/@redis/time-series/dist/commands/INFO.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformReply = exports.transformArguments = exports.IS_READ_ONLY = exports.FIRST_KEY_INDEX = void 0;
exports.FIRST_KEY_INDEX = 1;
exports.IS_READ_ONLY = true;
function transformArguments(key) {
    return [
        'TS.INFO',
        key
    ];
}
exports.transformArguments = transformArguments;
function transformReply(reply) {
    return {
        totalSamples: reply[1],
        memoryUsage: reply[3],
        firstTimestamp: reply[5],
        lastTimestamp: reply[7],
        retentionTime: reply[9],
        chunkCount: reply[11],
        chunkSize: reply[13],
        chunkType: reply[15],
        duplicatePolicy: reply[17],
        labels: reply[19].map((param)=>{
            let [name, value] = param;
            return {
                name,
                value
            };
        }),
        sourceKey: reply[21],
        rules: reply[23].map((param)=>{
            let [key, timeBucket, aggregationType] = param;
            return {
                key,
                timeBucket,
                aggregationType
            };
        })
    };
}
exports.transformReply = transformReply;
}),
"[project]/dawg-ai/node_modules/@redis/time-series/dist/commands/INFO_DEBUG.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformReply = exports.transformArguments = exports.FIRST_KEY_INDEX = exports.IS_READ_ONLY = void 0;
const INFO_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/time-series/dist/commands/INFO.js [app-client] (ecmascript)");
var INFO_2 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/time-series/dist/commands/INFO.js [app-client] (ecmascript)");
Object.defineProperty(exports, "IS_READ_ONLY", {
    enumerable: true,
    get: function() {
        return INFO_2.IS_READ_ONLY;
    }
});
Object.defineProperty(exports, "FIRST_KEY_INDEX", {
    enumerable: true,
    get: function() {
        return INFO_2.FIRST_KEY_INDEX;
    }
});
function transformArguments(key) {
    const args = (0, INFO_1.transformArguments)(key);
    args.push('DEBUG');
    return args;
}
exports.transformArguments = transformArguments;
function transformReply(rawReply) {
    const reply = (0, INFO_1.transformReply)(rawReply);
    reply.keySelfName = rawReply[25];
    reply.chunks = rawReply[27].map((chunk)=>({
            startTimestamp: chunk[1],
            endTimestamp: chunk[3],
            samples: chunk[5],
            size: chunk[7],
            bytesPerSample: chunk[9]
        }));
    return reply;
}
exports.transformReply = transformReply;
}),
"[project]/dawg-ai/node_modules/@redis/time-series/dist/commands/MADD.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformArguments = exports.FIRST_KEY_INDEX = void 0;
const _1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/time-series/dist/commands/index.js [app-client] (ecmascript)");
exports.FIRST_KEY_INDEX = 1;
function transformArguments(toAdd) {
    const args = [
        'TS.MADD'
    ];
    for (const { key, timestamp, value } of toAdd){
        args.push(key, (0, _1.transformTimestampArgument)(timestamp), value.toString());
    }
    return args;
}
exports.transformArguments = transformArguments;
}),
"[project]/dawg-ai/node_modules/@redis/time-series/dist/commands/MGET.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformReply = exports.transformArguments = exports.IS_READ_ONLY = void 0;
const _1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/time-series/dist/commands/index.js [app-client] (ecmascript)");
exports.IS_READ_ONLY = true;
function transformArguments(filter, options) {
    const args = (0, _1.pushLatestArgument)([
        'TS.MGET'
    ], options === null || options === void 0 ? void 0 : options.LATEST);
    return (0, _1.pushFilterArgument)(args, filter);
}
exports.transformArguments = transformArguments;
function transformReply(reply) {
    return reply.map((param)=>{
        let [key, _, sample] = param;
        return {
            key,
            sample: (0, _1.transformSampleReply)(sample)
        };
    });
}
exports.transformReply = transformReply;
}),
"[project]/dawg-ai/node_modules/@redis/time-series/dist/commands/MGET_WITHLABELS.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformReply = exports.transformArguments = exports.IS_READ_ONLY = void 0;
const _1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/time-series/dist/commands/index.js [app-client] (ecmascript)");
exports.IS_READ_ONLY = true;
function transformArguments(filter, options) {
    const args = (0, _1.pushWithLabelsArgument)([
        'TS.MGET'
    ], options === null || options === void 0 ? void 0 : options.SELECTED_LABELS);
    return (0, _1.pushFilterArgument)(args, filter);
}
exports.transformArguments = transformArguments;
;
function transformReply(reply) {
    return reply.map((param)=>{
        let [key, labels, sample] = param;
        return {
            key,
            labels: (0, _1.transformLablesReply)(labels),
            sample: (0, _1.transformSampleReply)(sample)
        };
    });
}
exports.transformReply = transformReply;
}),
"[project]/dawg-ai/node_modules/@redis/time-series/dist/commands/QUERYINDEX.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformArguments = exports.IS_READ_ONLY = void 0;
const generic_transformers_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/client/dist/lib/commands/generic-transformers.js [app-client] (ecmascript)");
exports.IS_READ_ONLY = true;
function transformArguments(filter) {
    return (0, generic_transformers_1.pushVerdictArguments)([
        'TS.QUERYINDEX'
    ], filter);
}
exports.transformArguments = transformArguments;
}),
"[project]/dawg-ai/node_modules/@redis/time-series/dist/commands/RANGE.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformReply = exports.transformArguments = exports.IS_READ_ONLY = exports.FIRST_KEY_INDEX = void 0;
const _1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/time-series/dist/commands/index.js [app-client] (ecmascript)");
exports.FIRST_KEY_INDEX = 1;
exports.IS_READ_ONLY = true;
function transformArguments(key, fromTimestamp, toTimestamp, options) {
    return (0, _1.pushRangeArguments)([
        'TS.RANGE',
        key
    ], fromTimestamp, toTimestamp, options);
}
exports.transformArguments = transformArguments;
function transformReply(reply) {
    return (0, _1.transformRangeReply)(reply);
}
exports.transformReply = transformReply;
}),
"[project]/dawg-ai/node_modules/@redis/time-series/dist/commands/REVRANGE.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformReply = exports.transformArguments = exports.IS_READ_ONLY = exports.FIRST_KEY_INDEX = void 0;
const _1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/time-series/dist/commands/index.js [app-client] (ecmascript)");
exports.FIRST_KEY_INDEX = 1;
exports.IS_READ_ONLY = true;
function transformArguments(key, fromTimestamp, toTimestamp, options) {
    return (0, _1.pushRangeArguments)([
        'TS.REVRANGE',
        key
    ], fromTimestamp, toTimestamp, options);
}
exports.transformArguments = transformArguments;
function transformReply(reply) {
    return (0, _1.transformRangeReply)(reply);
}
exports.transformReply = transformReply;
}),
"[project]/dawg-ai/node_modules/@redis/time-series/dist/commands/MRANGE.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformReply = exports.transformArguments = exports.IS_READ_ONLY = void 0;
const _1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/time-series/dist/commands/index.js [app-client] (ecmascript)");
exports.IS_READ_ONLY = true;
function transformArguments(fromTimestamp, toTimestamp, filters, options) {
    return (0, _1.pushMRangeArguments)([
        'TS.MRANGE'
    ], fromTimestamp, toTimestamp, filters, options);
}
exports.transformArguments = transformArguments;
var _2 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/time-series/dist/commands/index.js [app-client] (ecmascript)");
Object.defineProperty(exports, "transformReply", {
    enumerable: true,
    get: function() {
        return _2.transformMRangeReply;
    }
});
}),
"[project]/dawg-ai/node_modules/@redis/time-series/dist/commands/MRANGE_WITHLABELS.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformReply = exports.transformArguments = exports.IS_READ_ONLY = void 0;
const _1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/time-series/dist/commands/index.js [app-client] (ecmascript)");
exports.IS_READ_ONLY = true;
function transformArguments(fromTimestamp, toTimestamp, filters, options) {
    return (0, _1.pushMRangeWithLabelsArguments)([
        'TS.MRANGE'
    ], fromTimestamp, toTimestamp, filters, options);
}
exports.transformArguments = transformArguments;
var _2 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/time-series/dist/commands/index.js [app-client] (ecmascript)");
Object.defineProperty(exports, "transformReply", {
    enumerable: true,
    get: function() {
        return _2.transformMRangeWithLabelsReply;
    }
});
}),
"[project]/dawg-ai/node_modules/@redis/time-series/dist/commands/MREVRANGE.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformReply = exports.transformArguments = exports.IS_READ_ONLY = void 0;
const _1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/time-series/dist/commands/index.js [app-client] (ecmascript)");
exports.IS_READ_ONLY = true;
function transformArguments(fromTimestamp, toTimestamp, filters, options) {
    return (0, _1.pushMRangeArguments)([
        'TS.MREVRANGE'
    ], fromTimestamp, toTimestamp, filters, options);
}
exports.transformArguments = transformArguments;
var _2 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/time-series/dist/commands/index.js [app-client] (ecmascript)");
Object.defineProperty(exports, "transformReply", {
    enumerable: true,
    get: function() {
        return _2.transformMRangeReply;
    }
});
}),
"[project]/dawg-ai/node_modules/@redis/time-series/dist/commands/MREVRANGE_WITHLABELS.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.transformReply = exports.transformArguments = exports.IS_READ_ONLY = void 0;
const _1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/time-series/dist/commands/index.js [app-client] (ecmascript)");
exports.IS_READ_ONLY = true;
function transformArguments(fromTimestamp, toTimestamp, filters, options) {
    return (0, _1.pushMRangeWithLabelsArguments)([
        'TS.MREVRANGE'
    ], fromTimestamp, toTimestamp, filters, options);
}
exports.transformArguments = transformArguments;
var _2 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/time-series/dist/commands/index.js [app-client] (ecmascript)");
Object.defineProperty(exports, "transformReply", {
    enumerable: true,
    get: function() {
        return _2.transformMRangeWithLabelsReply;
    }
});
}),
"[project]/dawg-ai/node_modules/@redis/time-series/dist/commands/index.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.pushLatestArgument = exports.transformMRangeWithLabelsReply = exports.transformMRangeReply = exports.transformRangeReply = exports.pushMRangeWithLabelsArguments = exports.pushWithLabelsArgument = exports.pushMRangeArguments = exports.pushFilterArgument = exports.pushMRangeGroupByArguments = exports.pushRangeArguments = exports.TimeSeriesBucketTimestamp = exports.transformSampleReply = exports.transformIncrDecrArguments = exports.pushLabelsArgument = exports.transformLablesReply = exports.pushDuplicatePolicy = exports.pushChunkSizeArgument = exports.pushEncodingArgument = exports.TimeSeriesEncoding = exports.pushRetentionArgument = exports.pushIgnoreArgument = exports.transformTimestampArgument = exports.TimeSeriesReducers = exports.TimeSeriesDuplicatePolicies = exports.TimeSeriesAggregationType = void 0;
const ADD = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/time-series/dist/commands/ADD.js [app-client] (ecmascript)");
const ALTER = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/time-series/dist/commands/ALTER.js [app-client] (ecmascript)");
const CREATE = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/time-series/dist/commands/CREATE.js [app-client] (ecmascript)");
const CREATERULE = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/time-series/dist/commands/CREATERULE.js [app-client] (ecmascript)");
const DECRBY = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/time-series/dist/commands/DECRBY.js [app-client] (ecmascript)");
const DEL = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/time-series/dist/commands/DEL.js [app-client] (ecmascript)");
const DELETERULE = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/time-series/dist/commands/DELETERULE.js [app-client] (ecmascript)");
const GET = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/time-series/dist/commands/GET.js [app-client] (ecmascript)");
const INCRBY = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/time-series/dist/commands/INCRBY.js [app-client] (ecmascript)");
const INFO_DEBUG = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/time-series/dist/commands/INFO_DEBUG.js [app-client] (ecmascript)");
const INFO = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/time-series/dist/commands/INFO.js [app-client] (ecmascript)");
const MADD = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/time-series/dist/commands/MADD.js [app-client] (ecmascript)");
const MGET = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/time-series/dist/commands/MGET.js [app-client] (ecmascript)");
const MGET_WITHLABELS = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/time-series/dist/commands/MGET_WITHLABELS.js [app-client] (ecmascript)");
const QUERYINDEX = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/time-series/dist/commands/QUERYINDEX.js [app-client] (ecmascript)");
const RANGE = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/time-series/dist/commands/RANGE.js [app-client] (ecmascript)");
const REVRANGE = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/time-series/dist/commands/REVRANGE.js [app-client] (ecmascript)");
const MRANGE = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/time-series/dist/commands/MRANGE.js [app-client] (ecmascript)");
const MRANGE_WITHLABELS = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/time-series/dist/commands/MRANGE_WITHLABELS.js [app-client] (ecmascript)");
const MREVRANGE = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/time-series/dist/commands/MREVRANGE.js [app-client] (ecmascript)");
const MREVRANGE_WITHLABELS = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/time-series/dist/commands/MREVRANGE_WITHLABELS.js [app-client] (ecmascript)");
const generic_transformers_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/client/dist/lib/commands/generic-transformers.js [app-client] (ecmascript)");
exports.default = {
    ADD,
    add: ADD,
    ALTER,
    alter: ALTER,
    CREATE,
    create: CREATE,
    CREATERULE,
    createRule: CREATERULE,
    DECRBY,
    decrBy: DECRBY,
    DEL,
    del: DEL,
    DELETERULE,
    deleteRule: DELETERULE,
    GET,
    get: GET,
    INCRBY,
    incrBy: INCRBY,
    INFO_DEBUG,
    infoDebug: INFO_DEBUG,
    INFO,
    info: INFO,
    MADD,
    mAdd: MADD,
    MGET,
    mGet: MGET,
    MGET_WITHLABELS,
    mGetWithLabels: MGET_WITHLABELS,
    QUERYINDEX,
    queryIndex: QUERYINDEX,
    RANGE,
    range: RANGE,
    REVRANGE,
    revRange: REVRANGE,
    MRANGE,
    mRange: MRANGE,
    MRANGE_WITHLABELS,
    mRangeWithLabels: MRANGE_WITHLABELS,
    MREVRANGE,
    mRevRange: MREVRANGE,
    MREVRANGE_WITHLABELS,
    mRevRangeWithLabels: MREVRANGE_WITHLABELS
};
var TimeSeriesAggregationType;
(function(TimeSeriesAggregationType) {
    TimeSeriesAggregationType["AVG"] = "AVG";
    // @deprecated
    TimeSeriesAggregationType["AVERAGE"] = "AVG";
    TimeSeriesAggregationType["FIRST"] = "FIRST";
    TimeSeriesAggregationType["LAST"] = "LAST";
    TimeSeriesAggregationType["MIN"] = "MIN";
    // @deprecated
    TimeSeriesAggregationType["MINIMUM"] = "MIN";
    TimeSeriesAggregationType["MAX"] = "MAX";
    // @deprecated
    TimeSeriesAggregationType["MAXIMUM"] = "MAX";
    TimeSeriesAggregationType["SUM"] = "SUM";
    TimeSeriesAggregationType["RANGE"] = "RANGE";
    TimeSeriesAggregationType["COUNT"] = "COUNT";
    TimeSeriesAggregationType["STD_P"] = "STD.P";
    TimeSeriesAggregationType["STD_S"] = "STD.S";
    TimeSeriesAggregationType["VAR_P"] = "VAR.P";
    TimeSeriesAggregationType["VAR_S"] = "VAR.S";
    TimeSeriesAggregationType["TWA"] = "TWA";
})(TimeSeriesAggregationType || (exports.TimeSeriesAggregationType = TimeSeriesAggregationType = {}));
var TimeSeriesDuplicatePolicies;
(function(TimeSeriesDuplicatePolicies) {
    TimeSeriesDuplicatePolicies["BLOCK"] = "BLOCK";
    TimeSeriesDuplicatePolicies["FIRST"] = "FIRST";
    TimeSeriesDuplicatePolicies["LAST"] = "LAST";
    TimeSeriesDuplicatePolicies["MIN"] = "MIN";
    TimeSeriesDuplicatePolicies["MAX"] = "MAX";
    TimeSeriesDuplicatePolicies["SUM"] = "SUM";
})(TimeSeriesDuplicatePolicies || (exports.TimeSeriesDuplicatePolicies = TimeSeriesDuplicatePolicies = {}));
var TimeSeriesReducers;
(function(TimeSeriesReducers) {
    TimeSeriesReducers["AVG"] = "AVG";
    TimeSeriesReducers["SUM"] = "SUM";
    TimeSeriesReducers["MIN"] = "MIN";
    // @deprecated
    TimeSeriesReducers["MINIMUM"] = "MIN";
    TimeSeriesReducers["MAX"] = "MAX";
    // @deprecated
    TimeSeriesReducers["MAXIMUM"] = "MAX";
    TimeSeriesReducers["RANGE"] = "range";
    TimeSeriesReducers["COUNT"] = "COUNT";
    TimeSeriesReducers["STD_P"] = "STD.P";
    TimeSeriesReducers["STD_S"] = "STD.S";
    TimeSeriesReducers["VAR_P"] = "VAR.P";
    TimeSeriesReducers["VAR_S"] = "VAR.S";
})(TimeSeriesReducers || (exports.TimeSeriesReducers = TimeSeriesReducers = {}));
function transformTimestampArgument(timestamp) {
    if (typeof timestamp === 'string') return timestamp;
    return (typeof timestamp === 'number' ? timestamp : timestamp.getTime()).toString();
}
exports.transformTimestampArgument = transformTimestampArgument;
function pushIgnoreArgument(args, ignore) {
    if (ignore !== undefined) {
        args.push('IGNORE', ignore.MAX_TIME_DIFF.toString(), ignore.MAX_VAL_DIFF.toString());
    }
}
exports.pushIgnoreArgument = pushIgnoreArgument;
function pushRetentionArgument(args, retention) {
    if (retention !== undefined) {
        args.push('RETENTION', retention.toString());
    }
    return args;
}
exports.pushRetentionArgument = pushRetentionArgument;
var TimeSeriesEncoding;
(function(TimeSeriesEncoding) {
    TimeSeriesEncoding["COMPRESSED"] = "COMPRESSED";
    TimeSeriesEncoding["UNCOMPRESSED"] = "UNCOMPRESSED";
})(TimeSeriesEncoding || (exports.TimeSeriesEncoding = TimeSeriesEncoding = {}));
function pushEncodingArgument(args, encoding) {
    if (encoding !== undefined) {
        args.push('ENCODING', encoding);
    }
    return args;
}
exports.pushEncodingArgument = pushEncodingArgument;
function pushChunkSizeArgument(args, chunkSize) {
    if (chunkSize !== undefined) {
        args.push('CHUNK_SIZE', chunkSize.toString());
    }
    return args;
}
exports.pushChunkSizeArgument = pushChunkSizeArgument;
function pushDuplicatePolicy(args, duplicatePolicy) {
    if (duplicatePolicy !== undefined) {
        args.push('DUPLICATE_POLICY', duplicatePolicy);
    }
    return args;
}
exports.pushDuplicatePolicy = pushDuplicatePolicy;
function transformLablesReply(reply) {
    const labels = {};
    for (const [key, value] of reply){
        labels[key] = value;
    }
    return labels;
}
exports.transformLablesReply = transformLablesReply;
function pushLabelsArgument(args, labels) {
    if (labels) {
        args.push('LABELS');
        for (const [label, value] of Object.entries(labels)){
            args.push(label, value);
        }
    }
    return args;
}
exports.pushLabelsArgument = pushLabelsArgument;
function transformIncrDecrArguments(command, key, value, options) {
    const args = [
        command,
        key,
        value.toString()
    ];
    if ((options === null || options === void 0 ? void 0 : options.TIMESTAMP) !== undefined && (options === null || options === void 0 ? void 0 : options.TIMESTAMP) !== null) {
        args.push('TIMESTAMP', transformTimestampArgument(options.TIMESTAMP));
    }
    pushRetentionArgument(args, options === null || options === void 0 ? void 0 : options.RETENTION);
    if (options === null || options === void 0 ? void 0 : options.UNCOMPRESSED) {
        args.push('UNCOMPRESSED');
    }
    pushChunkSizeArgument(args, options === null || options === void 0 ? void 0 : options.CHUNK_SIZE);
    pushLabelsArgument(args, options === null || options === void 0 ? void 0 : options.LABELS);
    return args;
}
exports.transformIncrDecrArguments = transformIncrDecrArguments;
function transformSampleReply(reply) {
    return {
        timestamp: reply[0],
        value: Number(reply[1])
    };
}
exports.transformSampleReply = transformSampleReply;
var TimeSeriesBucketTimestamp;
(function(TimeSeriesBucketTimestamp) {
    TimeSeriesBucketTimestamp["LOW"] = "-";
    TimeSeriesBucketTimestamp["HIGH"] = "+";
    TimeSeriesBucketTimestamp["MID"] = "~";
})(TimeSeriesBucketTimestamp || (exports.TimeSeriesBucketTimestamp = TimeSeriesBucketTimestamp = {}));
function pushRangeArguments(args, fromTimestamp, toTimestamp, options) {
    args.push(transformTimestampArgument(fromTimestamp), transformTimestampArgument(toTimestamp));
    pushLatestArgument(args, options === null || options === void 0 ? void 0 : options.LATEST);
    if (options === null || options === void 0 ? void 0 : options.FILTER_BY_TS) {
        args.push('FILTER_BY_TS');
        for (const ts of options.FILTER_BY_TS){
            args.push(transformTimestampArgument(ts));
        }
    }
    if (options === null || options === void 0 ? void 0 : options.FILTER_BY_VALUE) {
        args.push('FILTER_BY_VALUE', options.FILTER_BY_VALUE.min.toString(), options.FILTER_BY_VALUE.max.toString());
    }
    if (options === null || options === void 0 ? void 0 : options.COUNT) {
        args.push('COUNT', options.COUNT.toString());
    }
    if (options === null || options === void 0 ? void 0 : options.ALIGN) {
        args.push('ALIGN', transformTimestampArgument(options.ALIGN));
    }
    if (options === null || options === void 0 ? void 0 : options.AGGREGATION) {
        args.push('AGGREGATION', options.AGGREGATION.type, transformTimestampArgument(options.AGGREGATION.timeBucket));
        if (options.AGGREGATION.BUCKETTIMESTAMP) {
            args.push('BUCKETTIMESTAMP', options.AGGREGATION.BUCKETTIMESTAMP);
        }
        if (options.AGGREGATION.EMPTY) {
            args.push('EMPTY');
        }
    }
    return args;
}
exports.pushRangeArguments = pushRangeArguments;
function pushMRangeGroupByArguments(args, groupBy) {
    if (groupBy) {
        args.push('GROUPBY', groupBy.label, 'REDUCE', groupBy.reducer);
    }
    return args;
}
exports.pushMRangeGroupByArguments = pushMRangeGroupByArguments;
function pushFilterArgument(args, filter) {
    args.push('FILTER');
    return (0, generic_transformers_1.pushVerdictArguments)(args, filter);
}
exports.pushFilterArgument = pushFilterArgument;
function pushMRangeArguments(args, fromTimestamp, toTimestamp, filter, options) {
    args = pushRangeArguments(args, fromTimestamp, toTimestamp, options);
    args = pushFilterArgument(args, filter);
    return pushMRangeGroupByArguments(args, options === null || options === void 0 ? void 0 : options.GROUPBY);
}
exports.pushMRangeArguments = pushMRangeArguments;
function pushWithLabelsArgument(args, selectedLabels) {
    if (!selectedLabels) {
        args.push('WITHLABELS');
    } else {
        args.push('SELECTED_LABELS');
        args = (0, generic_transformers_1.pushVerdictArguments)(args, selectedLabels);
    }
    return args;
}
exports.pushWithLabelsArgument = pushWithLabelsArgument;
function pushMRangeWithLabelsArguments(args, fromTimestamp, toTimestamp, filter, options) {
    args = pushRangeArguments(args, fromTimestamp, toTimestamp, options);
    args = pushWithLabelsArgument(args, options === null || options === void 0 ? void 0 : options.SELECTED_LABELS);
    args = pushFilterArgument(args, filter);
    return pushMRangeGroupByArguments(args, options === null || options === void 0 ? void 0 : options.GROUPBY);
}
exports.pushMRangeWithLabelsArguments = pushMRangeWithLabelsArguments;
function transformRangeReply(reply) {
    return reply.map(transformSampleReply);
}
exports.transformRangeReply = transformRangeReply;
function transformMRangeReply(reply) {
    const args = [];
    for (const [key, _, sample] of reply){
        args.push({
            key,
            samples: sample.map(transformSampleReply)
        });
    }
    return args;
}
exports.transformMRangeReply = transformMRangeReply;
function transformMRangeWithLabelsReply(reply) {
    const args = [];
    for (const [key, labels, samples] of reply){
        args.push({
            key,
            labels: transformLablesReply(labels),
            samples: samples.map(transformSampleReply)
        });
    }
    return args;
}
exports.transformMRangeWithLabelsReply = transformMRangeWithLabelsReply;
function pushLatestArgument(args, latest) {
    if (latest) {
        args.push('LATEST');
    }
    return args;
}
exports.pushLatestArgument = pushLatestArgument;
}),
"[project]/dawg-ai/node_modules/@redis/time-series/dist/index.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.TimeSeriesBucketTimestamp = exports.TimeSeriesReducers = exports.TimeSeriesAggregationType = exports.TimeSeriesEncoding = exports.TimeSeriesDuplicatePolicies = exports.default = void 0;
var commands_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/time-series/dist/commands/index.js [app-client] (ecmascript)");
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return commands_1.default;
    }
});
var commands_2 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/time-series/dist/commands/index.js [app-client] (ecmascript)");
Object.defineProperty(exports, "TimeSeriesDuplicatePolicies", {
    enumerable: true,
    get: function() {
        return commands_2.TimeSeriesDuplicatePolicies;
    }
});
Object.defineProperty(exports, "TimeSeriesEncoding", {
    enumerable: true,
    get: function() {
        return commands_2.TimeSeriesEncoding;
    }
});
Object.defineProperty(exports, "TimeSeriesAggregationType", {
    enumerable: true,
    get: function() {
        return commands_2.TimeSeriesAggregationType;
    }
});
Object.defineProperty(exports, "TimeSeriesReducers", {
    enumerable: true,
    get: function() {
        return commands_2.TimeSeriesReducers;
    }
});
Object.defineProperty(exports, "TimeSeriesBucketTimestamp", {
    enumerable: true,
    get: function() {
        return commands_2.TimeSeriesBucketTimestamp;
    }
});
}),
"[project]/dawg-ai/node_modules/redis/dist/index.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __createBinding = /*TURBOPACK member replacement*/ __turbopack_context__.e && /*TURBOPACK member replacement*/ __turbopack_context__.e.__createBinding || (Object.create ? function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = {
            enumerable: true,
            get: function() {
                return m[k];
            }
        };
    }
    Object.defineProperty(o, k2, desc);
} : function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
});
var __exportStar = /*TURBOPACK member replacement*/ __turbopack_context__.e && /*TURBOPACK member replacement*/ __turbopack_context__.e.__exportStar || function(m, exports1) {
    for(var p in m)if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports1, p)) __createBinding(exports1, m, p);
};
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.createCluster = exports.createClient = void 0;
const client_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/client/dist/index.js [app-client] (ecmascript)");
const bloom_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/bloom/dist/index.js [app-client] (ecmascript)");
const graph_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/graph/dist/index.js [app-client] (ecmascript)");
const json_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/json/dist/index.js [app-client] (ecmascript)");
const search_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/search/dist/index.js [app-client] (ecmascript)");
const time_series_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/time-series/dist/index.js [app-client] (ecmascript)");
__exportStar(__turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/client/dist/index.js [app-client] (ecmascript)"), exports);
__exportStar(__turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/bloom/dist/index.js [app-client] (ecmascript)"), exports);
__exportStar(__turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/graph/dist/index.js [app-client] (ecmascript)"), exports);
__exportStar(__turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/json/dist/index.js [app-client] (ecmascript)"), exports);
__exportStar(__turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/search/dist/index.js [app-client] (ecmascript)"), exports);
__exportStar(__turbopack_context__.r("[project]/dawg-ai/node_modules/@redis/time-series/dist/index.js [app-client] (ecmascript)"), exports);
const modules = {
    ...bloom_1.default,
    graph: graph_1.default,
    json: json_1.default,
    ft: search_1.default,
    ts: time_series_1.default
};
function createClient(options) {
    return (0, client_1.createClient)({
        ...options,
        modules: {
            ...modules,
            ...options === null || options === void 0 ? void 0 : options.modules
        }
    });
}
exports.createClient = createClient;
function createCluster(options) {
    return (0, client_1.createCluster)({
        ...options,
        modules: {
            ...modules,
            ...options === null || options === void 0 ? void 0 : options.modules
        }
    });
}
exports.createCluster = createCluster;
}),
]);

//# sourceMappingURL=f2656_1088a723._.js.map