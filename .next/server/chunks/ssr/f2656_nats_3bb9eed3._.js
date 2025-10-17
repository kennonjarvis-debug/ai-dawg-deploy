module.exports = [
"[project]/dawg-ai/node_modules/nats/lib/nats-base-client/encoders.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.TD = exports.TE = exports.Empty = void 0;
exports.encode = encode;
exports.decode = decode;
/*
 * Copyright 2020 The NATS Authors
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
 */ exports.Empty = new Uint8Array(0);
exports.TE = new TextEncoder();
exports.TD = new TextDecoder();
function concat(...bufs) {
    let max = 0;
    for(let i = 0; i < bufs.length; i++){
        max += bufs[i].length;
    }
    const out = new Uint8Array(max);
    let index = 0;
    for(let i = 0; i < bufs.length; i++){
        out.set(bufs[i], index);
        index += bufs[i].length;
    }
    return out;
}
function encode(...a) {
    const bufs = [];
    for(let i = 0; i < a.length; i++){
        bufs.push(exports.TE.encode(a[i]));
    }
    if (bufs.length === 0) {
        return exports.Empty;
    }
    if (bufs.length === 1) {
        return bufs[0];
    }
    return concat(...bufs);
}
function decode(a) {
    if (!a || a.length === 0) {
        return "";
    }
    return exports.TD.decode(a);
} //# sourceMappingURL=encoders.js.map
}),
"[project]/dawg-ai/node_modules/nats/lib/nats-base-client/nuid.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

/*
 * Copyright 2016-2021 The NATS Authors
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
exports.nuid = exports.Nuid = void 0;
const digits = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const base = 36;
const preLen = 12;
const seqLen = 10;
const maxSeq = 3656158440062976; // base^seqLen == 36^10
const minInc = 33;
const maxInc = 333;
const totalLen = preLen + seqLen;
function _getRandomValues(a) {
    for(let i = 0; i < a.length; i++){
        a[i] = Math.floor(Math.random() * 255);
    }
}
function fillRandom(a) {
    var _a;
    if ((_a = globalThis === null || globalThis === void 0 ? void 0 : globalThis.crypto) === null || _a === void 0 ? void 0 : _a.getRandomValues) {
        globalThis.crypto.getRandomValues(a);
    } else {
        _getRandomValues(a);
    }
}
/**
 * Create and initialize a nuid.
 *
 * @api private
 */ class Nuid {
    constructor(){
        this.buf = new Uint8Array(totalLen);
        this.inited = false;
    }
    /**
     * Initializes a nuid with a crypto random prefix,
     * and pseudo-random sequence and increment.
     *
     * @api private
     */ init() {
        this.inited = true;
        this.setPre();
        this.initSeqAndInc();
        this.fillSeq();
    }
    /**
     * Initializes the pseudo randmon sequence number and the increment range.
     *
     * @api private
     */ initSeqAndInc() {
        this.seq = Math.floor(Math.random() * maxSeq);
        this.inc = Math.floor(Math.random() * (maxInc - minInc) + minInc);
    }
    /**
     * Sets the prefix from crypto random bytes. Converts to base36.
     *
     * @api private
     */ setPre() {
        const cbuf = new Uint8Array(preLen);
        fillRandom(cbuf);
        for(let i = 0; i < preLen; i++){
            const di = cbuf[i] % base;
            this.buf[i] = digits.charCodeAt(di);
        }
    }
    /**
     * Fills the sequence part of the nuid as base36 from this.seq.
     *
     * @api private
     */ fillSeq() {
        let n = this.seq;
        for(let i = totalLen - 1; i >= preLen; i--){
            this.buf[i] = digits.charCodeAt(n % base);
            n = Math.floor(n / base);
        }
    }
    /**
     * Returns the next nuid.
     *
     * @api private
     */ next() {
        if (!this.inited) {
            this.init();
        }
        this.seq += this.inc;
        if (this.seq > maxSeq) {
            this.setPre();
            this.initSeqAndInc();
        }
        this.fillSeq();
        // @ts-ignore - Uint8Arrays can be an argument
        return String.fromCharCode.apply(String, this.buf);
    }
    reset() {
        this.init();
    }
}
exports.Nuid = Nuid;
exports.nuid = new Nuid(); //# sourceMappingURL=nuid.js.map
}),
"[project]/dawg-ai/node_modules/nats/lib/nats-base-client/core.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

/*
 * Copyright 2023 The NATS Authors
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
 */ var __awaiter = /*TURBOPACK member replacement*/ __turbopack_context__.e && /*TURBOPACK member replacement*/ __turbopack_context__.e.__awaiter || function(thisArg, _arguments, P, generator) {
    function adopt(value) {
        return value instanceof P ? value : new P(function(resolve) {
            resolve(value);
        });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
        function fulfilled(value) {
            try {
                step(generator.next(value));
            } catch (e) {
                reject(e);
            }
        }
        function rejected(value) {
            try {
                step(generator["throw"](value));
            } catch (e) {
                reject(e);
            }
        }
        function step(result) {
            result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ServiceVerb = exports.DEFAULT_HOST = exports.DEFAULT_PORT = exports.ServiceError = exports.ServiceErrorCodeHeader = exports.ServiceErrorHeader = exports.ServiceResponseType = exports.RequestStrategy = exports.Match = exports.NatsError = exports.Messages = exports.ErrorCode = exports.DebugEvents = exports.Events = void 0;
exports.isNatsError = isNatsError;
exports.syncIterator = syncIterator;
exports.createInbox = createInbox;
const nuid_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/nuid.js [app-ssr] (ecmascript)");
/**
 * Events reported by the {@link NatsConnection#status} iterator.
 */ var Events;
(function(Events) {
    /** Client disconnected */ Events["Disconnect"] = "disconnect";
    /** Client reconnected */ Events["Reconnect"] = "reconnect";
    /** Client received a cluster update */ Events["Update"] = "update";
    /** Client received a signal telling it that the server is transitioning to Lame Duck Mode */ Events["LDM"] = "ldm";
    /** Client received an async error from the server */ Events["Error"] = "error";
})(Events || (exports.Events = Events = {}));
/**
 * Other events that can be reported by the {@link NatsConnection#status} iterator.
 * These can usually be safely ignored, as higher-order functionality of the client
 * will handle them.
 */ var DebugEvents;
(function(DebugEvents) {
    DebugEvents["Reconnecting"] = "reconnecting";
    DebugEvents["PingTimer"] = "pingTimer";
    DebugEvents["StaleConnection"] = "staleConnection";
    DebugEvents["ClientInitiatedReconnect"] = "client initiated reconnect";
})(DebugEvents || (exports.DebugEvents = DebugEvents = {}));
var ErrorCode;
(function(ErrorCode) {
    // emitted by the client
    ErrorCode["ApiError"] = "BAD API";
    ErrorCode["BadAuthentication"] = "BAD_AUTHENTICATION";
    ErrorCode["BadCreds"] = "BAD_CREDS";
    ErrorCode["BadHeader"] = "BAD_HEADER";
    ErrorCode["BadJson"] = "BAD_JSON";
    ErrorCode["BadPayload"] = "BAD_PAYLOAD";
    ErrorCode["BadSubject"] = "BAD_SUBJECT";
    ErrorCode["Cancelled"] = "CANCELLED";
    ErrorCode["ConnectionClosed"] = "CONNECTION_CLOSED";
    ErrorCode["ConnectionDraining"] = "CONNECTION_DRAINING";
    ErrorCode["ConnectionRefused"] = "CONNECTION_REFUSED";
    ErrorCode["ConnectionTimeout"] = "CONNECTION_TIMEOUT";
    ErrorCode["Disconnect"] = "DISCONNECT";
    ErrorCode["InvalidOption"] = "INVALID_OPTION";
    ErrorCode["InvalidPayload"] = "INVALID_PAYLOAD";
    ErrorCode["MaxPayloadExceeded"] = "MAX_PAYLOAD_EXCEEDED";
    ErrorCode["NoResponders"] = "503";
    ErrorCode["NotFunction"] = "NOT_FUNC";
    ErrorCode["RequestError"] = "REQUEST_ERROR";
    ErrorCode["ServerOptionNotAvailable"] = "SERVER_OPT_NA";
    ErrorCode["SubClosed"] = "SUB_CLOSED";
    ErrorCode["SubDraining"] = "SUB_DRAINING";
    ErrorCode["Timeout"] = "TIMEOUT";
    ErrorCode["Tls"] = "TLS";
    ErrorCode["Unknown"] = "UNKNOWN_ERROR";
    ErrorCode["WssRequired"] = "WSS_REQUIRED";
    // jetstream
    ErrorCode["JetStreamInvalidAck"] = "JESTREAM_INVALID_ACK";
    ErrorCode["JetStream404NoMessages"] = "404";
    ErrorCode["JetStream408RequestTimeout"] = "408";
    //@deprecated: use JetStream409
    ErrorCode["JetStream409MaxAckPendingExceeded"] = "409";
    ErrorCode["JetStream409"] = "409";
    ErrorCode["JetStreamNotEnabled"] = "503";
    ErrorCode["JetStreamIdleHeartBeat"] = "IDLE_HEARTBEAT";
    // emitted by the server
    ErrorCode["AuthorizationViolation"] = "AUTHORIZATION_VIOLATION";
    ErrorCode["AuthenticationExpired"] = "AUTHENTICATION_EXPIRED";
    ErrorCode["ProtocolError"] = "NATS_PROTOCOL_ERR";
    ErrorCode["PermissionsViolation"] = "PERMISSIONS_VIOLATION";
    ErrorCode["AuthenticationTimeout"] = "AUTHENTICATION_TIMEOUT";
    ErrorCode["AccountExpired"] = "ACCOUNT_EXPIRED";
})(ErrorCode || (exports.ErrorCode = ErrorCode = {}));
function isNatsError(err) {
    return typeof err.code === "string";
}
class Messages {
    constructor(){
        this.messages = new Map();
        this.messages.set(ErrorCode.InvalidPayload, "Invalid payload type - payloads can be 'binary', 'string', or 'json'");
        this.messages.set(ErrorCode.BadJson, "Bad JSON");
        this.messages.set(ErrorCode.WssRequired, "TLS is required, therefore a secure websocket connection is also required");
    }
    static getMessage(s) {
        return messages.getMessage(s);
    }
    getMessage(s) {
        return this.messages.get(s) || s;
    }
}
exports.Messages = Messages;
// safari doesn't support static class members
const messages = new Messages();
class NatsError extends Error {
    /**
     * @param {String} message
     * @param {String} code
     * @param {Error} [chainedError]
     * @constructor
     *
     * @api private
     */ constructor(message, code, chainedError){
        super(message);
        this.name = "NatsError";
        this.message = message;
        this.code = code;
        this.chainedError = chainedError;
    }
    static errorForCode(code, chainedError) {
        const m = Messages.getMessage(code);
        return new NatsError(m, code, chainedError);
    }
    isAuthError() {
        return this.code === ErrorCode.AuthenticationExpired || this.code === ErrorCode.AuthorizationViolation || this.code === ErrorCode.AccountExpired;
    }
    isAuthTimeout() {
        return this.code === ErrorCode.AuthenticationTimeout;
    }
    isPermissionError() {
        return this.code === ErrorCode.PermissionsViolation;
    }
    isProtocolError() {
        return this.code === ErrorCode.ProtocolError;
    }
    isJetStreamError() {
        return this.api_error !== undefined;
    }
    jsError() {
        return this.api_error ? this.api_error : null;
    }
}
exports.NatsError = NatsError;
var Match;
(function(Match) {
    // Exact option is case sensitive
    Match[Match["Exact"] = 0] = "Exact";
    // Case sensitive, but key is transformed to Canonical MIME representation
    Match[Match["CanonicalMIME"] = 1] = "CanonicalMIME";
    // Case insensitive matches
    Match[Match["IgnoreCase"] = 2] = "IgnoreCase";
})(Match || (exports.Match = Match = {}));
var RequestStrategy;
(function(RequestStrategy) {
    RequestStrategy["Timer"] = "timer";
    RequestStrategy["Count"] = "count";
    RequestStrategy["JitterTimer"] = "jitterTimer";
    RequestStrategy["SentinelMsg"] = "sentinelMsg";
})(RequestStrategy || (exports.RequestStrategy = RequestStrategy = {}));
/**
 * syncIterator is a utility function that allows an AsyncIterator to be triggered
 * by calling next() - the utility will yield null if the underlying iterator is closed.
 * Note it is possibly an error to call use this function on an AsyncIterable that has
 * already been started (Symbol.asyncIterator() has been called) from a looping construct.
 */ function syncIterator(src) {
    const iter = src[Symbol.asyncIterator]();
    return {
        next () {
            return __awaiter(this, void 0, void 0, function*() {
                const m = yield iter.next();
                if (m.done) {
                    return Promise.resolve(null);
                }
                return Promise.resolve(m.value);
            });
        }
    };
}
var ServiceResponseType;
(function(ServiceResponseType) {
    ServiceResponseType["STATS"] = "io.nats.micro.v1.stats_response";
    ServiceResponseType["INFO"] = "io.nats.micro.v1.info_response";
    ServiceResponseType["PING"] = "io.nats.micro.v1.ping_response";
})(ServiceResponseType || (exports.ServiceResponseType = ServiceResponseType = {}));
exports.ServiceErrorHeader = "Nats-Service-Error";
exports.ServiceErrorCodeHeader = "Nats-Service-Error-Code";
class ServiceError extends Error {
    constructor(code, message){
        super(message);
        this.code = code;
    }
    static isServiceError(msg) {
        return ServiceError.toServiceError(msg) !== null;
    }
    static toServiceError(msg) {
        var _a, _b;
        const scode = ((_a = msg === null || msg === void 0 ? void 0 : msg.headers) === null || _a === void 0 ? void 0 : _a.get(exports.ServiceErrorCodeHeader)) || "";
        if (scode !== "") {
            const code = parseInt(scode) || 400;
            const description = ((_b = msg === null || msg === void 0 ? void 0 : msg.headers) === null || _b === void 0 ? void 0 : _b.get(exports.ServiceErrorHeader)) || "";
            return new ServiceError(code, description.length ? description : scode);
        }
        return null;
    }
}
exports.ServiceError = ServiceError;
function createInbox(prefix = "") {
    prefix = prefix || "_INBOX";
    if (typeof prefix !== "string") {
        throw new Error("prefix must be a string");
    }
    prefix.split(".").forEach((v)=>{
        if (v === "*" || v === ">") {
            throw new Error(`inbox prefixes cannot have wildcards '${prefix}'`);
        }
    });
    return `${prefix}.${nuid_1.nuid.next()}`;
}
exports.DEFAULT_PORT = 4222;
exports.DEFAULT_HOST = "127.0.0.1";
var ServiceVerb;
(function(ServiceVerb) {
    ServiceVerb["PING"] = "PING";
    ServiceVerb["STATS"] = "STATS";
    ServiceVerb["INFO"] = "INFO";
})(ServiceVerb || (exports.ServiceVerb = ServiceVerb = {})); //# sourceMappingURL=core.js.map
}),
"[project]/dawg-ai/node_modules/nats/lib/nats-base-client/util.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __awaiter = /*TURBOPACK member replacement*/ __turbopack_context__.e && /*TURBOPACK member replacement*/ __turbopack_context__.e.__awaiter || function(thisArg, _arguments, P, generator) {
    function adopt(value) {
        return value instanceof P ? value : new P(function(resolve) {
            resolve(value);
        });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
        function fulfilled(value) {
            try {
                step(generator.next(value));
            } catch (e) {
                reject(e);
            }
        }
        function rejected(value) {
            try {
                step(generator["throw"](value));
            } catch (e) {
                reject(e);
            }
        }
        function step(result) {
            result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = /*TURBOPACK member replacement*/ __turbopack_context__.e && /*TURBOPACK member replacement*/ __turbopack_context__.e.__asyncValues || function(o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function() {
        return this;
    }, i);
    //TURBOPACK unreachable
    ;
    function verb(n) {
        i[n] = o[n] && function(v) {
            return new Promise(function(resolve, reject) {
                v = o[n](v), settle(resolve, reject, v.done, v.value);
            });
        };
    }
    function settle(resolve, reject, d, v) {
        Promise.resolve(v).then(function(v) {
            resolve({
                value: v,
                done: d
            });
        }, reject);
    }
};
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.SimpleMutex = exports.Perf = void 0;
exports.extend = extend;
exports.render = render;
exports.timeout = timeout;
exports.delay = delay;
exports.deadline = deadline;
exports.deferred = deferred;
exports.debugDeferred = debugDeferred;
exports.shuffle = shuffle;
exports.collect = collect;
exports.jitter = jitter;
exports.backoffWithMax = backoffWithMax;
exports.backoff = backoff;
exports.nanos = nanos;
exports.millis = millis;
/*
 * Copyright 2018-2023 The NATS Authors
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
 */ // deno-lint-ignore-file no-explicit-any
const encoders_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/encoders.js [app-ssr] (ecmascript)");
const core_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/core.js [app-ssr] (ecmascript)");
function extend(a, ...b) {
    for(let i = 0; i < b.length; i++){
        const o = b[i];
        Object.keys(o).forEach(function(k) {
            a[k] = o[k];
        });
    }
    return a;
}
function render(frame) {
    const cr = "␍";
    const lf = "␊";
    return encoders_1.TD.decode(frame).replace(/\n/g, lf).replace(/\r/g, cr);
}
function timeout(ms, asyncTraces = true) {
    // by generating the stack here to help identify what timed out
    const err = asyncTraces ? core_1.NatsError.errorForCode(core_1.ErrorCode.Timeout) : null;
    let methods;
    let timer;
    const p = new Promise((_resolve, reject)=>{
        const cancel = ()=>{
            if (timer) {
                clearTimeout(timer);
            }
        };
        methods = {
            cancel
        };
        // @ts-ignore: node is not a number
        timer = setTimeout(()=>{
            if (err === null) {
                reject(core_1.NatsError.errorForCode(core_1.ErrorCode.Timeout));
            } else {
                reject(err);
            }
        }, ms);
    });
    // noinspection JSUnusedAssignment
    return Object.assign(p, methods);
}
function delay(ms = 0) {
    let methods;
    const p = new Promise((resolve)=>{
        const timer = setTimeout(()=>{
            resolve();
        }, ms);
        const cancel = ()=>{
            if (timer) {
                clearTimeout(timer);
            }
        };
        methods = {
            cancel
        };
    });
    return Object.assign(p, methods);
}
function deadline(p, millis = 1000) {
    const err = new Error(`deadline exceeded`);
    const d = deferred();
    const timer = setTimeout(()=>d.reject(err), millis);
    return Promise.race([
        p,
        d
    ]).finally(()=>clearTimeout(timer));
}
/**
 * Returns a Promise that has a resolve/reject methods that can
 * be used to resolve and defer the Deferred.
 */ function deferred() {
    let methods = {};
    const p = new Promise((resolve, reject)=>{
        methods = {
            resolve,
            reject
        };
    });
    return Object.assign(p, methods);
}
function debugDeferred() {
    let methods = {};
    const p = new Promise((resolve, reject)=>{
        methods = {
            resolve: (v)=>{
                console.trace("resolve", v);
                resolve(v);
            },
            reject: (err)=>{
                console.trace("reject");
                reject(err);
            }
        };
    });
    return Object.assign(p, methods);
}
function shuffle(a) {
    for(let i = a.length - 1; i > 0; i--){
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [
            a[j],
            a[i]
        ];
    }
    return a;
}
function collect(iter) {
    return __awaiter(this, void 0, void 0, function*() {
        var _a, iter_1, iter_1_1;
        var _b, e_1, _c, _d;
        const buf = [];
        try {
            for(_a = true, iter_1 = __asyncValues(iter); iter_1_1 = yield iter_1.next(), _b = iter_1_1.done, !_b; _a = true){
                _d = iter_1_1.value;
                _a = false;
                const v = _d;
                buf.push(v);
            }
        } catch (e_1_1) {
            e_1 = {
                error: e_1_1
            };
        } finally{
            try {
                if (!_a && !_b && (_c = iter_1.return)) yield _c.call(iter_1);
            } finally{
                if (e_1) throw e_1.error;
            }
        }
        return buf;
    });
}
class Perf {
    constructor(){
        this.timers = new Map();
        this.measures = new Map();
    }
    mark(key) {
        this.timers.set(key, performance.now());
    }
    measure(key, startKey, endKey) {
        const s = this.timers.get(startKey);
        if (s === undefined) {
            throw new Error(`${startKey} is not defined`);
        }
        const e = this.timers.get(endKey);
        if (e === undefined) {
            throw new Error(`${endKey} is not defined`);
        }
        this.measures.set(key, e - s);
    }
    getEntries() {
        const values = [];
        this.measures.forEach((v, k)=>{
            values.push({
                name: k,
                duration: v
            });
        });
        return values;
    }
}
exports.Perf = Perf;
class SimpleMutex {
    /**
     * @param max number of concurrent operations
     */ constructor(max = 1){
        this.max = max;
        this.current = 0;
        this.waiting = [];
    }
    /**
     * Returns a promise that resolves when the mutex is acquired
     */ lock() {
        // increment the count
        this.current++;
        // if we have runners, resolve it
        if (this.current <= this.max) {
            return Promise.resolve();
        }
        // otherwise defer it
        const d = deferred();
        this.waiting.push(d);
        return d;
    }
    /**
     * Release an acquired mutex - must be called
     */ unlock() {
        // decrement the count
        this.current--;
        // if we have deferred, resolve one
        const d = this.waiting.pop();
        d === null || d === void 0 ? void 0 : d.resolve();
    }
}
exports.SimpleMutex = SimpleMutex;
/**
 * Returns a new number between  .5*n and 1.5*n.
 * If the n is 0, returns 0.
 * @param n
 */ function jitter(n) {
    if (n === 0) {
        return 0;
    }
    return Math.floor(n / 2 + Math.random() * n);
}
function backoffWithMax(max = 30000) {
    const a = [
        max
    ];
    while(true){
        const n = Math.floor(max / 2);
        if (n < 100) {
            // always try right away
            a.unshift(0);
            break;
        }
        a.unshift(n);
        max = n;
    }
    return backoff(a);
}
/**
 * Returns a Backoff with the specified interval policy set.
 * @param policy
 */ function backoff(policy = [
    0,
    250,
    250,
    500,
    500,
    3000,
    5000
]) {
    if (!Array.isArray(policy)) {
        policy = [
            0,
            250,
            250,
            500,
            500,
            3000,
            5000
        ];
    }
    const max = policy.length - 1;
    return {
        backoff (attempt) {
            return jitter(attempt > max ? policy[max] : policy[attempt]);
        }
    };
}
/**
 * Converts the specified millis into Nanos
 * @param millis
 */ function nanos(millis) {
    return millis * 1000000;
}
/**
 * Convert the specified Nanos into millis
 * @param ns
 */ function millis(ns) {
    return Math.floor(ns / 1000000);
} //# sourceMappingURL=util.js.map
}),
"[project]/dawg-ai/node_modules/nats/lib/nats-base-client/databuffer.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
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
exports.DataBuffer = void 0;
const encoders_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/encoders.js [app-ssr] (ecmascript)");
class DataBuffer {
    constructor(){
        this.buffers = [];
        this.byteLength = 0;
    }
    static concat(...bufs) {
        let max = 0;
        for(let i = 0; i < bufs.length; i++){
            max += bufs[i].length;
        }
        const out = new Uint8Array(max);
        let index = 0;
        for(let i = 0; i < bufs.length; i++){
            out.set(bufs[i], index);
            index += bufs[i].length;
        }
        return out;
    }
    static fromAscii(m) {
        if (!m) {
            m = "";
        }
        return encoders_1.TE.encode(m);
    }
    static toAscii(a) {
        return encoders_1.TD.decode(a);
    }
    reset() {
        this.buffers.length = 0;
        this.byteLength = 0;
    }
    pack() {
        if (this.buffers.length > 1) {
            const v = new Uint8Array(this.byteLength);
            let index = 0;
            for(let i = 0; i < this.buffers.length; i++){
                v.set(this.buffers[i], index);
                index += this.buffers[i].length;
            }
            this.buffers.length = 0;
            this.buffers.push(v);
        }
    }
    shift() {
        if (this.buffers.length) {
            const a = this.buffers.shift();
            if (a) {
                this.byteLength -= a.length;
                return a;
            }
        }
        return new Uint8Array(0);
    }
    drain(n) {
        if (this.buffers.length) {
            this.pack();
            const v = this.buffers.pop();
            if (v) {
                const max = this.byteLength;
                if (n === undefined || n > max) {
                    n = max;
                }
                const d = v.subarray(0, n);
                if (max > n) {
                    this.buffers.push(v.subarray(n));
                }
                this.byteLength = max - n;
                return d;
            }
        }
        return new Uint8Array(0);
    }
    fill(a, ...bufs) {
        if (a) {
            this.buffers.push(a);
            this.byteLength += a.length;
        }
        for(let i = 0; i < bufs.length; i++){
            if (bufs[i] && bufs[i].length) {
                this.buffers.push(bufs[i]);
                this.byteLength += bufs[i].length;
            }
        }
    }
    peek() {
        if (this.buffers.length) {
            this.pack();
            return this.buffers[0];
        }
        return new Uint8Array(0);
    }
    size() {
        return this.byteLength;
    }
    length() {
        return this.buffers.length;
    }
}
exports.DataBuffer = DataBuffer; //# sourceMappingURL=databuffer.js.map
}),
"[project]/dawg-ai/node_modules/nats/lib/nats-base-client/transport.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.LF = exports.CR = exports.CRLF = exports.CR_LF_LEN = exports.CR_LF = void 0;
exports.setTransportFactory = setTransportFactory;
exports.defaultPort = defaultPort;
exports.getUrlParseFn = getUrlParseFn;
exports.newTransport = newTransport;
exports.getResolveFn = getResolveFn;
exports.protoLen = protoLen;
exports.extractProtocolMessage = extractProtocolMessage;
/*
 * Copyright 2020-2021 The NATS Authors
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
 */ const encoders_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/encoders.js [app-ssr] (ecmascript)");
const core_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/core.js [app-ssr] (ecmascript)");
const databuffer_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/databuffer.js [app-ssr] (ecmascript)");
let transportConfig;
function setTransportFactory(config) {
    transportConfig = config;
}
function defaultPort() {
    return transportConfig !== undefined && transportConfig.defaultPort !== undefined ? transportConfig.defaultPort : core_1.DEFAULT_PORT;
}
function getUrlParseFn() {
    return transportConfig !== undefined && transportConfig.urlParseFn ? transportConfig.urlParseFn : undefined;
}
function newTransport() {
    if (!transportConfig || typeof transportConfig.factory !== "function") {
        throw new Error("transport fn is not set");
    }
    return transportConfig.factory();
}
function getResolveFn() {
    return transportConfig !== undefined && transportConfig.dnsResolveFn ? transportConfig.dnsResolveFn : undefined;
}
exports.CR_LF = "\r\n";
exports.CR_LF_LEN = exports.CR_LF.length;
exports.CRLF = databuffer_1.DataBuffer.fromAscii(exports.CR_LF);
exports.CR = new Uint8Array(exports.CRLF)[0]; // 13
exports.LF = new Uint8Array(exports.CRLF)[1]; // 10
function protoLen(ba) {
    for(let i = 0; i < ba.length; i++){
        const n = i + 1;
        if (ba.byteLength > n && ba[i] === exports.CR && ba[n] === exports.LF) {
            return n + 1;
        }
    }
    return 0;
}
function extractProtocolMessage(a) {
    // protocol messages are ascii, so Uint8Array
    const len = protoLen(a);
    if (len > 0) {
        const ba = new Uint8Array(a);
        const out = ba.slice(0, len);
        return encoders_1.TD.decode(out);
    }
    return "";
} //# sourceMappingURL=transport.js.map
}),
"[project]/dawg-ai/node_modules/nats/lib/nats-base-client/ipparser.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

/*
 * Copyright 2020-2021 The NATS Authors
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
exports.ipV4 = ipV4;
exports.isIP = isIP;
exports.parseIP = parseIP;
// JavaScript port of go net/ip/ParseIP
// https://github.com/golang/go/blob/master/src/net/ip.go
// Copyright 2009 The Go Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.
const IPv4LEN = 4;
const IPv6LEN = 16;
const ASCII0 = 48;
const ASCII9 = 57;
const ASCIIA = 65;
const ASCIIF = 70;
const ASCIIa = 97;
const ASCIIf = 102;
const big = 0xFFFFFF;
function ipV4(a, b, c, d) {
    const ip = new Uint8Array(IPv6LEN);
    const prefix = [
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
        0xff,
        0xff
    ];
    prefix.forEach((v, idx)=>{
        ip[idx] = v;
    });
    ip[12] = a;
    ip[13] = b;
    ip[14] = c;
    ip[15] = d;
    return ip;
}
function isIP(h) {
    return parseIP(h) !== undefined;
}
function parseIP(h) {
    for(let i = 0; i < h.length; i++){
        switch(h[i]){
            case ".":
                return parseIPv4(h);
            case ":":
                return parseIPv6(h);
        }
    }
    return;
}
function parseIPv4(s) {
    const ip = new Uint8Array(IPv4LEN);
    for(let i = 0; i < IPv4LEN; i++){
        if (s.length === 0) {
            return undefined;
        }
        if (i > 0) {
            if (s[0] !== ".") {
                return undefined;
            }
            s = s.substring(1);
        }
        const { n, c, ok } = dtoi(s);
        if (!ok || n > 0xFF) {
            return undefined;
        }
        s = s.substring(c);
        ip[i] = n;
    }
    return ipV4(ip[0], ip[1], ip[2], ip[3]);
}
function parseIPv6(s) {
    const ip = new Uint8Array(IPv6LEN);
    let ellipsis = -1;
    if (s.length >= 2 && s[0] === ":" && s[1] === ":") {
        ellipsis = 0;
        s = s.substring(2);
        if (s.length === 0) {
            return ip;
        }
    }
    let i = 0;
    while(i < IPv6LEN){
        const { n, c, ok } = xtoi(s);
        if (!ok || n > 0xFFFF) {
            return undefined;
        }
        if (c < s.length && s[c] === ".") {
            if (ellipsis < 0 && i != IPv6LEN - IPv4LEN) {
                return undefined;
            }
            if (i + IPv4LEN > IPv6LEN) {
                return undefined;
            }
            const ip4 = parseIPv4(s);
            if (ip4 === undefined) {
                return undefined;
            }
            ip[i] = ip4[12];
            ip[i + 1] = ip4[13];
            ip[i + 2] = ip4[14];
            ip[i + 3] = ip4[15];
            s = "";
            i += IPv4LEN;
            break;
        }
        ip[i] = n >> 8;
        ip[i + 1] = n;
        i += 2;
        s = s.substring(c);
        if (s.length === 0) {
            break;
        }
        if (s[0] !== ":" || s.length == 1) {
            return undefined;
        }
        s = s.substring(1);
        if (s[0] === ":") {
            if (ellipsis >= 0) {
                return undefined;
            }
            ellipsis = i;
            s = s.substring(1);
            if (s.length === 0) {
                break;
            }
        }
    }
    if (s.length !== 0) {
        return undefined;
    }
    if (i < IPv6LEN) {
        if (ellipsis < 0) {
            return undefined;
        }
        const n = IPv6LEN - i;
        for(let j = i - 1; j >= ellipsis; j--){
            ip[j + n] = ip[j];
        }
        for(let j = ellipsis + n - 1; j >= ellipsis; j--){
            ip[j] = 0;
        }
    } else if (ellipsis >= 0) {
        return undefined;
    }
    return ip;
}
function dtoi(s) {
    let i = 0;
    let n = 0;
    for(i = 0; i < s.length && ASCII0 <= s.charCodeAt(i) && s.charCodeAt(i) <= ASCII9; i++){
        n = n * 10 + (s.charCodeAt(i) - ASCII0);
        if (n >= big) {
            return {
                n: big,
                c: i,
                ok: false
            };
        }
    }
    if (i === 0) {
        return {
            n: 0,
            c: 0,
            ok: false
        };
    }
    return {
        n: n,
        c: i,
        ok: true
    };
}
function xtoi(s) {
    let n = 0;
    let i = 0;
    for(i = 0; i < s.length; i++){
        if (ASCII0 <= s.charCodeAt(i) && s.charCodeAt(i) <= ASCII9) {
            n *= 16;
            n += s.charCodeAt(i) - ASCII0;
        } else if (ASCIIa <= s.charCodeAt(i) && s.charCodeAt(i) <= ASCIIf) {
            n *= 16;
            n += s.charCodeAt(i) - ASCIIa + 10;
        } else if (ASCIIA <= s.charCodeAt(i) && s.charCodeAt(i) <= ASCIIF) {
            n *= 16;
            n += s.charCodeAt(i) - ASCIIA + 10;
        } else {
            break;
        }
        if (n >= big) {
            return {
                n: 0,
                c: i,
                ok: false
            };
        }
    }
    if (i === 0) {
        return {
            n: 0,
            c: i,
            ok: false
        };
    }
    return {
        n: n,
        c: i,
        ok: true
    };
} //# sourceMappingURL=ipparser.js.map
}),
"[project]/dawg-ai/node_modules/nats/lib/nats-base-client/servers.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __awaiter = /*TURBOPACK member replacement*/ __turbopack_context__.e && /*TURBOPACK member replacement*/ __turbopack_context__.e.__awaiter || function(thisArg, _arguments, P, generator) {
    function adopt(value) {
        return value instanceof P ? value : new P(function(resolve) {
            resolve(value);
        });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
        function fulfilled(value) {
            try {
                step(generator.next(value));
            } catch (e) {
                reject(e);
            }
        }
        function rejected(value) {
            try {
                step(generator["throw"](value));
            } catch (e) {
                reject(e);
            }
        }
        function step(result) {
            result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Servers = exports.ServerImpl = void 0;
exports.isIPV4OrHostname = isIPV4OrHostname;
exports.hostPort = hostPort;
/*
 * Copyright 2018-2022 The NATS Authors
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
 */ const transport_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/transport.js [app-ssr] (ecmascript)");
const util_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/util.js [app-ssr] (ecmascript)");
const ipparser_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/ipparser.js [app-ssr] (ecmascript)");
const core_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/core.js [app-ssr] (ecmascript)");
function isIPV4OrHostname(hp) {
    if (hp.indexOf("[") !== -1 || hp.indexOf("::") !== -1) {
        return false;
    }
    if (hp.indexOf(".") !== -1) {
        return true;
    }
    // if we have a plain hostname or host:port
    if (hp.split(":").length <= 2) {
        return true;
    }
    return false;
}
function isIPV6(hp) {
    return !isIPV4OrHostname(hp);
}
function filterIpv6MappedToIpv4(hp) {
    const prefix = "::FFFF:";
    const idx = hp.toUpperCase().indexOf(prefix);
    if (idx !== -1 && hp.indexOf(".") !== -1) {
        // we have something like: ::FFFF:127.0.0.1 or [::FFFF:127.0.0.1]:4222
        let ip = hp.substring(idx + prefix.length);
        ip = ip.replace("[", "");
        return ip.replace("]", "");
    }
    return hp;
}
function hostPort(u) {
    u = u.trim();
    // remove any protocol that may have been provided
    if (u.match(/^(.*:\/\/)(.*)/m)) {
        u = u.replace(/^(.*:\/\/)(.*)/gm, "$2");
    }
    // in web environments, URL may not be a living standard
    // that means that protocols other than HTTP/S are not
    // parsable correctly.
    // the third complication is that we may have been given
    // an IPv6 or worse IPv6 mapping an Ipv4
    u = filterIpv6MappedToIpv4(u);
    // we only wrap cases where they gave us a plain ipv6
    // and we are not already bracketed
    if (isIPV6(u) && u.indexOf("[") === -1) {
        u = `[${u}]`;
    }
    // if we have ipv6, we expect port after ']:' otherwise after ':'
    const op = isIPV6(u) ? u.match(/(]:)(\d+)/) : u.match(/(:)(\d+)/);
    const port = op && op.length === 3 && op[1] && op[2] ? parseInt(op[2]) : core_1.DEFAULT_PORT;
    // the next complication is that new URL() may
    // eat ports which match the protocol - so for example
    // port 80 may be eliminated - so we flip the protocol
    // so that it always yields a value
    const protocol = port === 80 ? "https" : "http";
    const url = new URL(`${protocol}://${u}`);
    url.port = `${port}`;
    let hostname = url.hostname;
    // if we are bracketed, we need to rip it out
    if (hostname.charAt(0) === "[") {
        hostname = hostname.substring(1, hostname.length - 1);
    }
    const listen = url.host;
    return {
        listen,
        hostname,
        port
    };
}
/**
 * @hidden
 */ class ServerImpl {
    constructor(u, gossiped = false){
        this.src = u;
        this.tlsName = "";
        const v = hostPort(u);
        this.listen = v.listen;
        this.hostname = v.hostname;
        this.port = v.port;
        this.didConnect = false;
        this.reconnects = 0;
        this.lastConnect = 0;
        this.gossiped = gossiped;
    }
    toString() {
        return this.listen;
    }
    resolve(opts) {
        return __awaiter(this, void 0, void 0, function*() {
            if (!opts.fn || opts.resolve === false) {
                // we cannot resolve - transport doesn't support it
                // or user opted out
                // don't add - to resolves or we get a circ reference
                return [
                    this
                ];
            }
            const buf = [];
            if ((0, ipparser_1.isIP)(this.hostname)) {
                // don't add - to resolves or we get a circ reference
                return [
                    this
                ];
            } else {
                // resolve the hostname to ips
                const ips = yield opts.fn(this.hostname);
                if (opts.debug) {
                    console.log(`resolve ${this.hostname} = ${ips.join(",")}`);
                }
                for (const ip of ips){
                    // letting URL handle the details of representing IPV6 ip with a port, etc
                    // careful to make sure the protocol doesn't line with standard ports or they
                    // get swallowed
                    const proto = this.port === 80 ? "https" : "http";
                    // ipv6 won't be bracketed here, because it came from resolve
                    const url = new URL(`${proto}://${isIPV6(ip) ? "[" + ip + "]" : ip}`);
                    url.port = `${this.port}`;
                    const ss = new ServerImpl(url.host, false);
                    ss.tlsName = this.hostname;
                    buf.push(ss);
                }
            }
            if (opts.randomize) {
                (0, util_1.shuffle)(buf);
            }
            this.resolves = buf;
            return buf;
        });
    }
}
exports.ServerImpl = ServerImpl;
/**
 * @hidden
 */ class Servers {
    constructor(listens = [], opts = {}){
        this.firstSelect = true;
        this.servers = [];
        this.tlsName = "";
        this.randomize = opts.randomize || false;
        const urlParseFn = (0, transport_1.getUrlParseFn)();
        if (listens) {
            listens.forEach((hp)=>{
                hp = urlParseFn ? urlParseFn(hp) : hp;
                this.servers.push(new ServerImpl(hp));
            });
            if (this.randomize) {
                this.servers = (0, util_1.shuffle)(this.servers);
            }
        }
        if (this.servers.length === 0) {
            this.addServer(`${core_1.DEFAULT_HOST}:${(0, transport_1.defaultPort)()}`, false);
        }
        this.currentServer = this.servers[0];
    }
    clear() {
        this.servers.length = 0;
    }
    updateTLSName() {
        const cs = this.getCurrentServer();
        if (!(0, ipparser_1.isIP)(cs.hostname)) {
            this.tlsName = cs.hostname;
            this.servers.forEach((s)=>{
                if (s.gossiped) {
                    s.tlsName = this.tlsName;
                }
            });
        }
    }
    getCurrentServer() {
        return this.currentServer;
    }
    addServer(u, implicit = false) {
        const urlParseFn = (0, transport_1.getUrlParseFn)();
        u = urlParseFn ? urlParseFn(u) : u;
        const s = new ServerImpl(u, implicit);
        if ((0, ipparser_1.isIP)(s.hostname)) {
            s.tlsName = this.tlsName;
        }
        this.servers.push(s);
    }
    selectServer() {
        // allow using select without breaking the order of the servers
        if (this.firstSelect) {
            this.firstSelect = false;
            return this.currentServer;
        }
        const t = this.servers.shift();
        if (t) {
            this.servers.push(t);
            this.currentServer = t;
        }
        return t;
    }
    removeCurrentServer() {
        this.removeServer(this.currentServer);
    }
    removeServer(server) {
        if (server) {
            const index = this.servers.indexOf(server);
            this.servers.splice(index, 1);
        }
    }
    length() {
        return this.servers.length;
    }
    next() {
        return this.servers.length ? this.servers[0] : undefined;
    }
    getServers() {
        return this.servers;
    }
    update(info, encrypted) {
        const added = [];
        let deleted = [];
        const urlParseFn = (0, transport_1.getUrlParseFn)();
        const discovered = new Map();
        if (info.connect_urls && info.connect_urls.length > 0) {
            info.connect_urls.forEach((hp)=>{
                hp = urlParseFn ? urlParseFn(hp, encrypted) : hp;
                const s = new ServerImpl(hp, true);
                discovered.set(hp, s);
            });
        }
        // remove gossiped servers that are no longer reported
        const toDelete = [];
        this.servers.forEach((s, index)=>{
            const u = s.listen;
            if (s.gossiped && this.currentServer.listen !== u && discovered.get(u) === undefined) {
                // server was removed
                toDelete.push(index);
            }
            // remove this entry from reported
            discovered.delete(u);
        });
        // perform the deletion
        toDelete.reverse();
        toDelete.forEach((index)=>{
            const removed = this.servers.splice(index, 1);
            deleted = deleted.concat(removed[0].listen);
        });
        // remaining servers are new
        discovered.forEach((v, k)=>{
            this.servers.push(v);
            added.push(k);
        });
        return {
            added,
            deleted
        };
    }
}
exports.Servers = Servers; //# sourceMappingURL=servers.js.map
}),
"[project]/dawg-ai/node_modules/nats/lib/nats-base-client/queued_iterator.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __await = /*TURBOPACK member replacement*/ __turbopack_context__.e && /*TURBOPACK member replacement*/ __turbopack_context__.e.__await || function(v) {
    return this instanceof __await ? (this.v = v, this) : new __await(v);
};
var __asyncGenerator = /*TURBOPACK member replacement*/ __turbopack_context__.e && /*TURBOPACK member replacement*/ __turbopack_context__.e.__asyncGenerator || function(thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = Object.create((typeof AsyncIterator === "function" ? AsyncIterator : Object).prototype), verb("next"), verb("throw"), verb("return", awaitReturn), i[Symbol.asyncIterator] = function() {
        return this;
    }, i;
    //TURBOPACK unreachable
    ;
    function awaitReturn(f) {
        return function(v) {
            return Promise.resolve(v).then(f, reject);
        };
    }
    function verb(n, f) {
        if (g[n]) {
            i[n] = function(v) {
                return new Promise(function(a, b) {
                    q.push([
                        n,
                        v,
                        a,
                        b
                    ]) > 1 || resume(n, v);
                });
            };
            if (f) i[n] = f(i[n]);
        }
    }
    function resume(n, v) {
        try {
            step(g[n](v));
        } catch (e) {
            settle(q[0][3], e);
        }
    }
    function step(r) {
        r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r);
    }
    function fulfill(value) {
        resume("next", value);
    }
    function reject(value) {
        resume("throw", value);
    }
    function settle(f, v) {
        if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]);
    }
};
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.QueuedIteratorImpl = void 0;
/*
 * Copyright 2020-2022 The NATS Authors
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
 */ const util_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/util.js [app-ssr] (ecmascript)");
const core_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/core.js [app-ssr] (ecmascript)");
class QueuedIteratorImpl {
    constructor(){
        this.inflight = 0;
        this.filtered = 0;
        this.pendingFiltered = 0;
        this.processed = 0;
        this.received = 0;
        this.noIterator = false;
        this.done = false;
        this.signal = (0, util_1.deferred)();
        this.yields = [];
        this.iterClosed = (0, util_1.deferred)();
        this.time = 0;
        this.yielding = false;
    }
    [Symbol.asyncIterator]() {
        return this.iterate();
    }
    push(v) {
        if (this.done) {
            return;
        }
        if (typeof v === "function") {
            this.yields.push(v);
            this.signal.resolve();
            return;
        }
        const { ingest, protocol } = this.ingestionFilterFn ? this.ingestionFilterFn(v, this.ctx || this) : {
            ingest: true,
            protocol: false
        };
        if (ingest) {
            if (protocol) {
                this.filtered++;
                this.pendingFiltered++;
            }
            this.yields.push(v);
            this.signal.resolve();
        }
    }
    iterate() {
        return __asyncGenerator(this, arguments, function* iterate_1() {
            if (this.noIterator) {
                throw new core_1.NatsError("unsupported iterator", core_1.ErrorCode.ApiError);
            }
            if (this.yielding) {
                throw new core_1.NatsError("already yielding", core_1.ErrorCode.ApiError);
            }
            this.yielding = true;
            try {
                while(true){
                    if (this.yields.length === 0) {
                        yield __await(this.signal);
                    }
                    if (this.err) {
                        throw this.err;
                    }
                    const yields = this.yields;
                    this.inflight = yields.length;
                    this.yields = [];
                    for(let i = 0; i < yields.length; i++){
                        if (typeof yields[i] === "function") {
                            const fn = yields[i];
                            try {
                                fn();
                            } catch (err) {
                                // failed on the invocation - fail the iterator
                                // so they know to fix the callback
                                throw err;
                            }
                            // fn could have also set an error
                            if (this.err) {
                                throw this.err;
                            }
                            continue;
                        }
                        // only pass messages that pass the filter
                        const ok = this.protocolFilterFn ? this.protocolFilterFn(yields[i]) : true;
                        if (ok) {
                            this.processed++;
                            const start = Date.now();
                            yield yield __await(yields[i]);
                            this.time = Date.now() - start;
                            if (this.dispatchedFn && yields[i]) {
                                this.dispatchedFn(yields[i]);
                            }
                        } else {
                            this.pendingFiltered--;
                        }
                        this.inflight--;
                    }
                    // yielding could have paused and microtask
                    // could have added messages. Prevent allocations
                    // if possible
                    if (this.done) {
                        break;
                    } else if (this.yields.length === 0) {
                        yields.length = 0;
                        this.yields = yields;
                        this.signal = (0, util_1.deferred)();
                    }
                }
            } finally{
                // the iterator used break/return
                this.stop();
            }
        });
    }
    stop(err) {
        if (this.done) {
            return;
        }
        this.err = err;
        this.done = true;
        this.signal.resolve();
        this.iterClosed.resolve(err);
    }
    getProcessed() {
        return this.noIterator ? this.received : this.processed;
    }
    getPending() {
        return this.yields.length + this.inflight - this.pendingFiltered;
    }
    getReceived() {
        return this.received - this.filtered;
    }
}
exports.QueuedIteratorImpl = QueuedIteratorImpl; //# sourceMappingURL=queued_iterator.js.map
}),
"[project]/dawg-ai/node_modules/nats/lib/nats-base-client/headers.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

/*
 * Copyright 2020-2023 The NATS Authors
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
exports.MsgHdrsImpl = void 0;
exports.canonicalMIMEHeaderKey = canonicalMIMEHeaderKey;
exports.headers = headers;
// Heavily inspired by Golang's https://golang.org/src/net/http/header.go
const encoders_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/encoders.js [app-ssr] (ecmascript)");
const core_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/core.js [app-ssr] (ecmascript)");
// https://www.ietf.org/rfc/rfc822.txt
// 3.1.2.  STRUCTURE OF HEADER FIELDS
//
// Once a field has been unfolded, it may be viewed as being com-
// posed of a field-name followed by a colon (":"), followed by a
// field-body, and  terminated  by  a  carriage-return/line-feed.
// The  field-name must be composed of printable ASCII characters
// (i.e., characters that  have  values  between  33.  and  126.,
// decimal, except colon).  The field-body may be composed of any
// ASCII characters, except CR or LF.  (While CR and/or LF may be
// present  in the actual text, they are removed by the action of
// unfolding the field.)
function canonicalMIMEHeaderKey(k) {
    const a = 97;
    const A = 65;
    const Z = 90;
    const z = 122;
    const dash = 45;
    const colon = 58;
    const start = 33;
    const end = 126;
    const toLower = a - A;
    let upper = true;
    const buf = new Array(k.length);
    for(let i = 0; i < k.length; i++){
        let c = k.charCodeAt(i);
        if (c === colon || c < start || c > end) {
            throw new core_1.NatsError(`'${k[i]}' is not a valid character for a header key`, core_1.ErrorCode.BadHeader);
        }
        if (upper && a <= c && c <= z) {
            c -= toLower;
        } else if (!upper && A <= c && c <= Z) {
            c += toLower;
        }
        buf[i] = c;
        upper = c == dash;
    }
    return String.fromCharCode(...buf);
}
function headers(code = 0, description = "") {
    if (code === 0 && description !== "" || code > 0 && description === "") {
        throw new Error("setting status requires both code and description");
    }
    return new MsgHdrsImpl(code, description);
}
const HEADER = "NATS/1.0";
class MsgHdrsImpl {
    constructor(code = 0, description = ""){
        this._code = code;
        this._description = description;
        this.headers = new Map();
    }
    [Symbol.iterator]() {
        return this.headers.entries();
    }
    size() {
        return this.headers.size;
    }
    equals(mh) {
        if (mh && this.headers.size === mh.headers.size && this._code === mh._code) {
            for (const [k, v] of this.headers){
                const a = mh.values(k);
                if (v.length !== a.length) {
                    return false;
                }
                const vv = [
                    ...v
                ].sort();
                const aa = [
                    ...a
                ].sort();
                for(let i = 0; i < vv.length; i++){
                    if (vv[i] !== aa[i]) {
                        return false;
                    }
                }
            }
            return true;
        }
        return false;
    }
    static decode(a) {
        const mh = new MsgHdrsImpl();
        const s = encoders_1.TD.decode(a);
        const lines = s.split("\r\n");
        const h = lines[0];
        if (h !== HEADER) {
            // malformed headers could add extra space without adding a code or description
            let str = h.replace(HEADER, "").trim();
            if (str.length > 0) {
                mh._code = parseInt(str, 10);
                if (isNaN(mh._code)) {
                    mh._code = 0;
                }
                const scode = mh._code.toString();
                str = str.replace(scode, "");
                mh._description = str.trim();
            }
        }
        if (lines.length >= 1) {
            lines.slice(1).map((s)=>{
                if (s) {
                    const idx = s.indexOf(":");
                    if (idx > -1) {
                        const k = s.slice(0, idx);
                        const v = s.slice(idx + 1).trim();
                        mh.append(k, v);
                    }
                }
            });
        }
        return mh;
    }
    toString() {
        if (this.headers.size === 0 && this._code === 0) {
            return "";
        }
        let s = HEADER;
        if (this._code > 0 && this._description !== "") {
            s += ` ${this._code} ${this._description}`;
        }
        for (const [k, v] of this.headers){
            for(let i = 0; i < v.length; i++){
                s = `${s}\r\n${k}: ${v[i]}`;
            }
        }
        return `${s}\r\n\r\n`;
    }
    encode() {
        return encoders_1.TE.encode(this.toString());
    }
    static validHeaderValue(k) {
        const inv = /[\r\n]/;
        if (inv.test(k)) {
            throw new core_1.NatsError("invalid header value - \\r and \\n are not allowed.", core_1.ErrorCode.BadHeader);
        }
        return k.trim();
    }
    keys() {
        const keys = [];
        for (const sk of this.headers.keys()){
            keys.push(sk);
        }
        return keys;
    }
    findKeys(k, match = core_1.Match.Exact) {
        const keys = this.keys();
        switch(match){
            case core_1.Match.Exact:
                return keys.filter((v)=>{
                    return v === k;
                });
            case core_1.Match.CanonicalMIME:
                k = canonicalMIMEHeaderKey(k);
                return keys.filter((v)=>{
                    return v === k;
                });
            default:
                {
                    const lci = k.toLowerCase();
                    return keys.filter((v)=>{
                        return lci === v.toLowerCase();
                    });
                }
        }
    }
    get(k, match = core_1.Match.Exact) {
        const keys = this.findKeys(k, match);
        if (keys.length) {
            const v = this.headers.get(keys[0]);
            if (v) {
                return Array.isArray(v) ? v[0] : v;
            }
        }
        return "";
    }
    last(k, match = core_1.Match.Exact) {
        const keys = this.findKeys(k, match);
        if (keys.length) {
            const v = this.headers.get(keys[0]);
            if (v) {
                return Array.isArray(v) ? v[v.length - 1] : v;
            }
        }
        return "";
    }
    has(k, match = core_1.Match.Exact) {
        return this.findKeys(k, match).length > 0;
    }
    set(k, v, match = core_1.Match.Exact) {
        this.delete(k, match);
        this.append(k, v, match);
    }
    append(k, v, match = core_1.Match.Exact) {
        // validate the key
        const ck = canonicalMIMEHeaderKey(k);
        if (match === core_1.Match.CanonicalMIME) {
            k = ck;
        }
        // if we get non-sensical ignores/etc, we should try
        // to do the right thing and use the first key that matches
        const keys = this.findKeys(k, match);
        k = keys.length > 0 ? keys[0] : k;
        const value = MsgHdrsImpl.validHeaderValue(v);
        let a = this.headers.get(k);
        if (!a) {
            a = [];
            this.headers.set(k, a);
        }
        a.push(value);
    }
    values(k, match = core_1.Match.Exact) {
        const buf = [];
        const keys = this.findKeys(k, match);
        keys.forEach((v)=>{
            const values = this.headers.get(v);
            if (values) {
                buf.push(...values);
            }
        });
        return buf;
    }
    delete(k, match = core_1.Match.Exact) {
        const keys = this.findKeys(k, match);
        keys.forEach((v)=>{
            this.headers.delete(v);
        });
    }
    get hasError() {
        return this._code >= 300;
    }
    get status() {
        return `${this._code} ${this._description}`.trim();
    }
    toRecord() {
        const data = {};
        this.keys().forEach((v)=>{
            data[v] = this.values(v);
        });
        return data;
    }
    get code() {
        return this._code;
    }
    get description() {
        return this._description;
    }
    static fromRecord(r) {
        const h = new MsgHdrsImpl();
        for(const k in r){
            h.headers.set(k, r[k]);
        }
        return h;
    }
}
exports.MsgHdrsImpl = MsgHdrsImpl; //# sourceMappingURL=headers.js.map
}),
"[project]/dawg-ai/node_modules/nats/lib/nats-base-client/codec.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

/*
 * Copyright 2020-2022 The NATS Authors
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
exports.StringCodec = StringCodec;
exports.JSONCodec = JSONCodec;
const encoders_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/encoders.js [app-ssr] (ecmascript)");
const core_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/core.js [app-ssr] (ecmascript)");
/**
 * Returns a {@link Codec} for encoding strings to a message payload
 * and decoding message payloads into strings.
 * @constructor
 */ function StringCodec() {
    return {
        encode (d) {
            return encoders_1.TE.encode(d);
        },
        decode (a) {
            return encoders_1.TD.decode(a);
        }
    };
}
/**
 * Returns a {@link Codec}  for encoding JavaScript object to JSON and
 * serialize them to an Uint8Array, and conversely, from an
 * Uint8Array to JSON to a JavaScript Object.
 * @param reviver
 * @constructor
 */ function JSONCodec(reviver) {
    return {
        encode (d) {
            try {
                if (d === undefined) {
                    // @ts-ignore: json will not handle undefined
                    d = null;
                }
                return encoders_1.TE.encode(JSON.stringify(d));
            } catch (err) {
                throw core_1.NatsError.errorForCode(core_1.ErrorCode.BadJson, err);
            }
        },
        decode (a) {
            try {
                return JSON.parse(encoders_1.TD.decode(a), reviver);
            } catch (err) {
                throw core_1.NatsError.errorForCode(core_1.ErrorCode.BadJson, err);
            }
        }
    };
} //# sourceMappingURL=codec.js.map
}),
"[project]/dawg-ai/node_modules/nats/lib/nats-base-client/msg.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.MsgImpl = void 0;
exports.isRequestError = isRequestError;
/*
 * Copyright 2020-2023 The NATS Authors
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
 */ const headers_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/headers.js [app-ssr] (ecmascript)");
const encoders_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/encoders.js [app-ssr] (ecmascript)");
const codec_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/codec.js [app-ssr] (ecmascript)");
const core_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/core.js [app-ssr] (ecmascript)");
function isRequestError(msg) {
    var _a;
    // NATS core only considers errors 503s on messages that have no payload
    // everything else simply forwarded as part of the message and is considered
    // application level information
    if (msg && msg.data.length === 0 && ((_a = msg.headers) === null || _a === void 0 ? void 0 : _a.code) === 503) {
        return core_1.NatsError.errorForCode(core_1.ErrorCode.NoResponders);
    }
    return null;
}
class MsgImpl {
    constructor(msg, data, publisher){
        this._msg = msg;
        this._rdata = data;
        this.publisher = publisher;
    }
    get subject() {
        if (this._subject) {
            return this._subject;
        }
        this._subject = encoders_1.TD.decode(this._msg.subject);
        return this._subject;
    }
    get reply() {
        if (this._reply) {
            return this._reply;
        }
        this._reply = encoders_1.TD.decode(this._msg.reply);
        return this._reply;
    }
    get sid() {
        return this._msg.sid;
    }
    get headers() {
        if (this._msg.hdr > -1 && !this._headers) {
            const buf = this._rdata.subarray(0, this._msg.hdr);
            this._headers = headers_1.MsgHdrsImpl.decode(buf);
        }
        return this._headers;
    }
    get data() {
        if (!this._rdata) {
            return new Uint8Array(0);
        }
        return this._msg.hdr > -1 ? this._rdata.subarray(this._msg.hdr) : this._rdata;
    }
    // eslint-ignore-next-line @typescript-eslint/no-explicit-any
    respond(data = encoders_1.Empty, opts) {
        if (this.reply) {
            this.publisher.publish(this.reply, data, opts);
            return true;
        }
        return false;
    }
    size() {
        var _a;
        const subj = this._msg.subject.length;
        const reply = ((_a = this._msg.reply) === null || _a === void 0 ? void 0 : _a.length) || 0;
        const payloadAndHeaders = this._msg.size === -1 ? 0 : this._msg.size;
        return subj + reply + payloadAndHeaders;
    }
    json(reviver) {
        return (0, codec_1.JSONCodec)(reviver).decode(this.data);
    }
    string() {
        return encoders_1.TD.decode(this.data);
    }
    requestInfo() {
        var _a;
        const v = (_a = this.headers) === null || _a === void 0 ? void 0 : _a.get("Nats-Request-Info");
        if (v) {
            return JSON.parse(v, function(key, value) {
                if ((key === "start" || key === "stop") && value !== "") {
                    return new Date(Date.parse(value));
                }
                return value;
            });
        }
        return null;
    }
}
exports.MsgImpl = MsgImpl; //# sourceMappingURL=msg.js.map
}),
"[project]/dawg-ai/node_modules/nats/lib/nats-base-client/muxsubscription.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.MuxSubscription = void 0;
/*
 * Copyright 2020-2021 The NATS Authors
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
 */ const msg_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/msg.js [app-ssr] (ecmascript)");
const core_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/core.js [app-ssr] (ecmascript)");
class MuxSubscription {
    constructor(){
        this.reqs = new Map();
    }
    size() {
        return this.reqs.size;
    }
    init(prefix) {
        this.baseInbox = `${(0, core_1.createInbox)(prefix)}.`;
        return this.baseInbox;
    }
    add(r) {
        if (!isNaN(r.received)) {
            r.received = 0;
        }
        this.reqs.set(r.token, r);
    }
    get(token) {
        return this.reqs.get(token);
    }
    cancel(r) {
        this.reqs.delete(r.token);
    }
    getToken(m) {
        const s = m.subject || "";
        if (s.indexOf(this.baseInbox) === 0) {
            return s.substring(this.baseInbox.length);
        }
        return null;
    }
    all() {
        return Array.from(this.reqs.values());
    }
    handleError(isMuxPermissionError, err) {
        if (err && err.permissionContext) {
            if (isMuxPermissionError) {
                // one or more requests queued but mux cannot process them
                this.all().forEach((r)=>{
                    r.resolver(err, {});
                });
                return true;
            }
            const ctx = err.permissionContext;
            if (ctx.operation === "publish") {
                const req = this.all().find((s)=>{
                    return s.requestSubject === ctx.subject;
                });
                if (req) {
                    req.resolver(err, {});
                    return true;
                }
            }
        }
        return false;
    }
    dispatcher() {
        return (err, m)=>{
            const token = this.getToken(m);
            if (token) {
                const r = this.get(token);
                if (r) {
                    if (err === null && m.headers) {
                        err = (0, msg_1.isRequestError)(m);
                    }
                    r.resolver(err, m);
                }
            }
        };
    }
    close() {
        const err = core_1.NatsError.errorForCode(core_1.ErrorCode.Timeout);
        this.reqs.forEach((req)=>{
            req.resolver(err, {});
        });
    }
}
exports.MuxSubscription = MuxSubscription; //# sourceMappingURL=muxsubscription.js.map
}),
"[project]/dawg-ai/node_modules/nats/lib/nats-base-client/heartbeats.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Heartbeat = void 0;
/*
 * Copyright 2020-2021 The NATS Authors
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
 */ const util_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/util.js [app-ssr] (ecmascript)");
const core_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/core.js [app-ssr] (ecmascript)");
class Heartbeat {
    constructor(ph, interval, maxOut){
        this.ph = ph;
        this.interval = interval;
        this.maxOut = maxOut;
        this.pendings = [];
    }
    // api to start the heartbeats, since this can be
    // spuriously called from dial, ensure we don't
    // leak timers
    start() {
        this.cancel();
        this._schedule();
    }
    // api for canceling the heartbeats, if stale is
    // true it will initiate a client disconnect
    cancel(stale) {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = undefined;
        }
        this._reset();
        if (stale) {
            this.ph.disconnect();
        }
    }
    _schedule() {
        // @ts-ignore: node is not a number - we treat this opaquely
        this.timer = setTimeout(()=>{
            this.ph.dispatchStatus({
                type: core_1.DebugEvents.PingTimer,
                data: `${this.pendings.length + 1}`
            });
            if (this.pendings.length === this.maxOut) {
                this.cancel(true);
                return;
            }
            const ping = (0, util_1.deferred)();
            this.ph.flush(ping).then(()=>{
                this._reset();
            }).catch(()=>{
                // we disconnected - pongs were rejected
                this.cancel();
            });
            this.pendings.push(ping);
            this._schedule();
        }, this.interval);
    }
    _reset() {
        // clear pendings after resolving them
        this.pendings = this.pendings.filter((p)=>{
            const d = p;
            d.resolve();
            return false;
        });
    }
}
exports.Heartbeat = Heartbeat; //# sourceMappingURL=heartbeats.js.map
}),
"[project]/dawg-ai/node_modules/nats/lib/nats-base-client/denobuffer.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.DenoBuffer = exports.MAX_SIZE = exports.AssertionError = void 0;
exports.assert = assert;
exports.concat = concat;
exports.append = append;
exports.readAll = readAll;
exports.writeAll = writeAll;
// This code has been ported almost directly from Go's src/bytes/buffer.go
// Copyright 2009 The Go Authors. All rights reserved. BSD license.
// https://github.com/golang/go/blob/master/LICENSE
// This code removes all Deno specific functionality to enable its use
// in a browser environment
//@internal
const encoders_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/encoders.js [app-ssr] (ecmascript)");
class AssertionError extends Error {
    constructor(msg){
        super(msg);
        this.name = "AssertionError";
    }
}
exports.AssertionError = AssertionError;
// @internal
function assert(cond, msg = "Assertion failed.") {
    if (!cond) {
        throw new AssertionError(msg);
    }
}
// MIN_READ is the minimum ArrayBuffer size passed to a read call by
// buffer.ReadFrom. As long as the Buffer has at least MIN_READ bytes beyond
// what is required to hold the contents of r, readFrom() will not grow the
// underlying buffer.
const MIN_READ = 32 * 1024;
exports.MAX_SIZE = Math.pow(2, 32) - 2;
// `off` is the offset into `dst` where it will at which to begin writing values
// from `src`.
// Returns the number of bytes copied.
function copy(src, dst, off = 0) {
    const r = dst.byteLength - off;
    if (src.byteLength > r) {
        src = src.subarray(0, r);
    }
    dst.set(src, off);
    return src.byteLength;
}
function concat(origin, b) {
    if (origin === undefined && b === undefined) {
        return new Uint8Array(0);
    }
    if (origin === undefined) {
        return b;
    }
    if (b === undefined) {
        return origin;
    }
    const output = new Uint8Array(origin.length + b.length);
    output.set(origin, 0);
    output.set(b, origin.length);
    return output;
}
function append(origin, b) {
    return concat(origin, Uint8Array.of(b));
}
class DenoBuffer {
    constructor(ab){
        this._off = 0;
        if (ab == null) {
            this._buf = new Uint8Array(0);
            return;
        }
        this._buf = new Uint8Array(ab);
    }
    bytes(options = {
        copy: true
    }) {
        if (options.copy === false) return this._buf.subarray(this._off);
        return this._buf.slice(this._off);
    }
    empty() {
        return this._buf.byteLength <= this._off;
    }
    get length() {
        return this._buf.byteLength - this._off;
    }
    get capacity() {
        return this._buf.buffer.byteLength;
    }
    truncate(n) {
        if (n === 0) {
            this.reset();
            return;
        }
        if (n < 0 || n > this.length) {
            throw Error("bytes.Buffer: truncation out of range");
        }
        this._reslice(this._off + n);
    }
    reset() {
        this._reslice(0);
        this._off = 0;
    }
    _tryGrowByReslice(n) {
        const l = this._buf.byteLength;
        if (n <= this.capacity - l) {
            this._reslice(l + n);
            return l;
        }
        return -1;
    }
    _reslice(len) {
        assert(len <= this._buf.buffer.byteLength);
        this._buf = new Uint8Array(this._buf.buffer, 0, len);
    }
    readByte() {
        const a = new Uint8Array(1);
        if (this.read(a)) {
            return a[0];
        }
        return null;
    }
    read(p) {
        if (this.empty()) {
            // Buffer is empty, reset to recover space.
            this.reset();
            if (p.byteLength === 0) {
                // this edge case is tested in 'bufferReadEmptyAtEOF' test
                return 0;
            }
            return null;
        }
        const nread = copy(this._buf.subarray(this._off), p);
        this._off += nread;
        return nread;
    }
    writeByte(n) {
        return this.write(Uint8Array.of(n));
    }
    writeString(s) {
        return this.write(encoders_1.TE.encode(s));
    }
    write(p) {
        const m = this._grow(p.byteLength);
        return copy(p, this._buf, m);
    }
    _grow(n) {
        const m = this.length;
        // If buffer is empty, reset to recover space.
        if (m === 0 && this._off !== 0) {
            this.reset();
        }
        // Fast: Try to _grow by means of a _reslice.
        const i = this._tryGrowByReslice(n);
        if (i >= 0) {
            return i;
        }
        const c = this.capacity;
        if (n <= Math.floor(c / 2) - m) {
            // We can slide things down instead of allocating a new
            // ArrayBuffer. We only need m+n <= c to slide, but
            // we instead let capacity get twice as large so we
            // don't spend all our time copying.
            copy(this._buf.subarray(this._off), this._buf);
        } else if (c + n > exports.MAX_SIZE) {
            throw new Error("The buffer cannot be grown beyond the maximum size.");
        } else {
            // Not enough space anywhere, we need to allocate.
            const buf = new Uint8Array(Math.min(2 * c + n, exports.MAX_SIZE));
            copy(this._buf.subarray(this._off), buf);
            this._buf = buf;
        }
        // Restore this.off and len(this._buf).
        this._off = 0;
        this._reslice(Math.min(m + n, exports.MAX_SIZE));
        return m;
    }
    grow(n) {
        if (n < 0) {
            throw Error("Buffer._grow: negative count");
        }
        const m = this._grow(n);
        this._reslice(m);
    }
    readFrom(r) {
        let n = 0;
        const tmp = new Uint8Array(MIN_READ);
        while(true){
            const shouldGrow = this.capacity - this.length < MIN_READ;
            // read into tmp buffer if there's not enough room
            // otherwise read directly into the internal buffer
            const buf = shouldGrow ? tmp : new Uint8Array(this._buf.buffer, this.length);
            const nread = r.read(buf);
            if (nread === null) {
                return n;
            }
            // write will grow if needed
            if (shouldGrow) this.write(buf.subarray(0, nread));
            else this._reslice(this.length + nread);
            n += nread;
        }
    }
}
exports.DenoBuffer = DenoBuffer;
function readAll(r) {
    const buf = new DenoBuffer();
    buf.readFrom(r);
    return buf.bytes();
}
function writeAll(w, arr) {
    let nwritten = 0;
    while(nwritten < arr.length){
        nwritten += w.write(arr.subarray(nwritten));
    }
} //# sourceMappingURL=denobuffer.js.map
}),
"[project]/dawg-ai/node_modules/nats/lib/nats-base-client/parser.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.State = exports.Parser = exports.Kind = void 0;
exports.describe = describe;
// deno-lint-ignore-file no-undef
/*
 * Copyright 2020-2021 The NATS Authors
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
 */ const denobuffer_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/denobuffer.js [app-ssr] (ecmascript)");
const encoders_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/encoders.js [app-ssr] (ecmascript)");
var Kind;
(function(Kind) {
    Kind[Kind["OK"] = 0] = "OK";
    Kind[Kind["ERR"] = 1] = "ERR";
    Kind[Kind["MSG"] = 2] = "MSG";
    Kind[Kind["INFO"] = 3] = "INFO";
    Kind[Kind["PING"] = 4] = "PING";
    Kind[Kind["PONG"] = 5] = "PONG";
})(Kind || (exports.Kind = Kind = {}));
function describe(e) {
    let ks;
    let data = "";
    switch(e.kind){
        case Kind.MSG:
            ks = "MSG";
            break;
        case Kind.OK:
            ks = "OK";
            break;
        case Kind.ERR:
            ks = "ERR";
            data = encoders_1.TD.decode(e.data);
            break;
        case Kind.PING:
            ks = "PING";
            break;
        case Kind.PONG:
            ks = "PONG";
            break;
        case Kind.INFO:
            ks = "INFO";
            data = encoders_1.TD.decode(e.data);
    }
    return `${ks}: ${data}`;
}
function newMsgArg() {
    const ma = {};
    ma.sid = -1;
    ma.hdr = -1;
    ma.size = -1;
    return ma;
}
const ASCII_0 = 48;
const ASCII_9 = 57;
// This is an almost verbatim port of the Go NATS parser
// https://github.com/nats-io/nats.go/blob/master/parser.go
class Parser {
    constructor(dispatcher){
        this.dispatcher = dispatcher;
        this.state = State.OP_START;
        this.as = 0;
        this.drop = 0;
        this.hdr = 0;
    }
    parse(buf) {
        let i;
        for(i = 0; i < buf.length; i++){
            const b = buf[i];
            switch(this.state){
                case State.OP_START:
                    switch(b){
                        case cc.M:
                        case cc.m:
                            this.state = State.OP_M;
                            this.hdr = -1;
                            this.ma = newMsgArg();
                            break;
                        case cc.H:
                        case cc.h:
                            this.state = State.OP_H;
                            this.hdr = 0;
                            this.ma = newMsgArg();
                            break;
                        case cc.P:
                        case cc.p:
                            this.state = State.OP_P;
                            break;
                        case cc.PLUS:
                            this.state = State.OP_PLUS;
                            break;
                        case cc.MINUS:
                            this.state = State.OP_MINUS;
                            break;
                        case cc.I:
                        case cc.i:
                            this.state = State.OP_I;
                            break;
                        default:
                            throw this.fail(buf.subarray(i));
                    }
                    break;
                case State.OP_H:
                    switch(b){
                        case cc.M:
                        case cc.m:
                            this.state = State.OP_M;
                            break;
                        default:
                            throw this.fail(buf.subarray(i));
                    }
                    break;
                case State.OP_M:
                    switch(b){
                        case cc.S:
                        case cc.s:
                            this.state = State.OP_MS;
                            break;
                        default:
                            throw this.fail(buf.subarray(i));
                    }
                    break;
                case State.OP_MS:
                    switch(b){
                        case cc.G:
                        case cc.g:
                            this.state = State.OP_MSG;
                            break;
                        default:
                            throw this.fail(buf.subarray(i));
                    }
                    break;
                case State.OP_MSG:
                    switch(b){
                        case cc.SPACE:
                        case cc.TAB:
                            this.state = State.OP_MSG_SPC;
                            break;
                        default:
                            throw this.fail(buf.subarray(i));
                    }
                    break;
                case State.OP_MSG_SPC:
                    switch(b){
                        case cc.SPACE:
                        case cc.TAB:
                            continue;
                        default:
                            this.state = State.MSG_ARG;
                            this.as = i;
                    }
                    break;
                case State.MSG_ARG:
                    switch(b){
                        case cc.CR:
                            this.drop = 1;
                            break;
                        case cc.NL:
                            {
                                const arg = this.argBuf ? this.argBuf.bytes() : buf.subarray(this.as, i - this.drop);
                                this.processMsgArgs(arg);
                                this.drop = 0;
                                this.as = i + 1;
                                this.state = State.MSG_PAYLOAD;
                                // jump ahead with the index. If this overruns
                                // what is left we fall out and process a split buffer.
                                i = this.as + this.ma.size - 1;
                                break;
                            }
                        default:
                            if (this.argBuf) {
                                this.argBuf.writeByte(b);
                            }
                    }
                    break;
                case State.MSG_PAYLOAD:
                    if (this.msgBuf) {
                        if (this.msgBuf.length >= this.ma.size) {
                            const data = this.msgBuf.bytes({
                                copy: false
                            });
                            this.dispatcher.push({
                                kind: Kind.MSG,
                                msg: this.ma,
                                data: data
                            });
                            this.argBuf = undefined;
                            this.msgBuf = undefined;
                            this.state = State.MSG_END;
                        } else {
                            let toCopy = this.ma.size - this.msgBuf.length;
                            const avail = buf.length - i;
                            if (avail < toCopy) {
                                toCopy = avail;
                            }
                            if (toCopy > 0) {
                                this.msgBuf.write(buf.subarray(i, i + toCopy));
                                i = i + toCopy - 1;
                            } else {
                                this.msgBuf.writeByte(b);
                            }
                        }
                    } else if (i - this.as >= this.ma.size) {
                        this.dispatcher.push({
                            kind: Kind.MSG,
                            msg: this.ma,
                            data: buf.subarray(this.as, i)
                        });
                        this.argBuf = undefined;
                        this.msgBuf = undefined;
                        this.state = State.MSG_END;
                    }
                    break;
                case State.MSG_END:
                    switch(b){
                        case cc.NL:
                            this.drop = 0;
                            this.as = i + 1;
                            this.state = State.OP_START;
                            break;
                        default:
                            continue;
                    }
                    break;
                case State.OP_PLUS:
                    switch(b){
                        case cc.O:
                        case cc.o:
                            this.state = State.OP_PLUS_O;
                            break;
                        default:
                            throw this.fail(buf.subarray(i));
                    }
                    break;
                case State.OP_PLUS_O:
                    switch(b){
                        case cc.K:
                        case cc.k:
                            this.state = State.OP_PLUS_OK;
                            break;
                        default:
                            throw this.fail(buf.subarray(i));
                    }
                    break;
                case State.OP_PLUS_OK:
                    switch(b){
                        case cc.NL:
                            this.dispatcher.push({
                                kind: Kind.OK
                            });
                            this.drop = 0;
                            this.state = State.OP_START;
                            break;
                    }
                    break;
                case State.OP_MINUS:
                    switch(b){
                        case cc.E:
                        case cc.e:
                            this.state = State.OP_MINUS_E;
                            break;
                        default:
                            throw this.fail(buf.subarray(i));
                    }
                    break;
                case State.OP_MINUS_E:
                    switch(b){
                        case cc.R:
                        case cc.r:
                            this.state = State.OP_MINUS_ER;
                            break;
                        default:
                            throw this.fail(buf.subarray(i));
                    }
                    break;
                case State.OP_MINUS_ER:
                    switch(b){
                        case cc.R:
                        case cc.r:
                            this.state = State.OP_MINUS_ERR;
                            break;
                        default:
                            throw this.fail(buf.subarray(i));
                    }
                    break;
                case State.OP_MINUS_ERR:
                    switch(b){
                        case cc.SPACE:
                        case cc.TAB:
                            this.state = State.OP_MINUS_ERR_SPC;
                            break;
                        default:
                            throw this.fail(buf.subarray(i));
                    }
                    break;
                case State.OP_MINUS_ERR_SPC:
                    switch(b){
                        case cc.SPACE:
                        case cc.TAB:
                            continue;
                        default:
                            this.state = State.MINUS_ERR_ARG;
                            this.as = i;
                    }
                    break;
                case State.MINUS_ERR_ARG:
                    switch(b){
                        case cc.CR:
                            this.drop = 1;
                            break;
                        case cc.NL:
                            {
                                let arg;
                                if (this.argBuf) {
                                    arg = this.argBuf.bytes();
                                    this.argBuf = undefined;
                                } else {
                                    arg = buf.subarray(this.as, i - this.drop);
                                }
                                this.dispatcher.push({
                                    kind: Kind.ERR,
                                    data: arg
                                });
                                this.drop = 0;
                                this.as = i + 1;
                                this.state = State.OP_START;
                                break;
                            }
                        default:
                            if (this.argBuf) {
                                this.argBuf.write(Uint8Array.of(b));
                            }
                    }
                    break;
                case State.OP_P:
                    switch(b){
                        case cc.I:
                        case cc.i:
                            this.state = State.OP_PI;
                            break;
                        case cc.O:
                        case cc.o:
                            this.state = State.OP_PO;
                            break;
                        default:
                            throw this.fail(buf.subarray(i));
                    }
                    break;
                case State.OP_PO:
                    switch(b){
                        case cc.N:
                        case cc.n:
                            this.state = State.OP_PON;
                            break;
                        default:
                            throw this.fail(buf.subarray(i));
                    }
                    break;
                case State.OP_PON:
                    switch(b){
                        case cc.G:
                        case cc.g:
                            this.state = State.OP_PONG;
                            break;
                        default:
                            throw this.fail(buf.subarray(i));
                    }
                    break;
                case State.OP_PONG:
                    switch(b){
                        case cc.NL:
                            this.dispatcher.push({
                                kind: Kind.PONG
                            });
                            this.drop = 0;
                            this.state = State.OP_START;
                            break;
                    }
                    break;
                case State.OP_PI:
                    switch(b){
                        case cc.N:
                        case cc.n:
                            this.state = State.OP_PIN;
                            break;
                        default:
                            throw this.fail(buf.subarray(i));
                    }
                    break;
                case State.OP_PIN:
                    switch(b){
                        case cc.G:
                        case cc.g:
                            this.state = State.OP_PING;
                            break;
                        default:
                            throw this.fail(buf.subarray(i));
                    }
                    break;
                case State.OP_PING:
                    switch(b){
                        case cc.NL:
                            this.dispatcher.push({
                                kind: Kind.PING
                            });
                            this.drop = 0;
                            this.state = State.OP_START;
                            break;
                    }
                    break;
                case State.OP_I:
                    switch(b){
                        case cc.N:
                        case cc.n:
                            this.state = State.OP_IN;
                            break;
                        default:
                            throw this.fail(buf.subarray(i));
                    }
                    break;
                case State.OP_IN:
                    switch(b){
                        case cc.F:
                        case cc.f:
                            this.state = State.OP_INF;
                            break;
                        default:
                            throw this.fail(buf.subarray(i));
                    }
                    break;
                case State.OP_INF:
                    switch(b){
                        case cc.O:
                        case cc.o:
                            this.state = State.OP_INFO;
                            break;
                        default:
                            throw this.fail(buf.subarray(i));
                    }
                    break;
                case State.OP_INFO:
                    switch(b){
                        case cc.SPACE:
                        case cc.TAB:
                            this.state = State.OP_INFO_SPC;
                            break;
                        default:
                            throw this.fail(buf.subarray(i));
                    }
                    break;
                case State.OP_INFO_SPC:
                    switch(b){
                        case cc.SPACE:
                        case cc.TAB:
                            continue;
                        default:
                            this.state = State.INFO_ARG;
                            this.as = i;
                    }
                    break;
                case State.INFO_ARG:
                    switch(b){
                        case cc.CR:
                            this.drop = 1;
                            break;
                        case cc.NL:
                            {
                                let arg;
                                if (this.argBuf) {
                                    arg = this.argBuf.bytes();
                                    this.argBuf = undefined;
                                } else {
                                    arg = buf.subarray(this.as, i - this.drop);
                                }
                                this.dispatcher.push({
                                    kind: Kind.INFO,
                                    data: arg
                                });
                                this.drop = 0;
                                this.as = i + 1;
                                this.state = State.OP_START;
                                break;
                            }
                        default:
                            if (this.argBuf) {
                                this.argBuf.writeByte(b);
                            }
                    }
                    break;
                default:
                    throw this.fail(buf.subarray(i));
            }
        }
        if ((this.state === State.MSG_ARG || this.state === State.MINUS_ERR_ARG || this.state === State.INFO_ARG) && !this.argBuf) {
            this.argBuf = new denobuffer_1.DenoBuffer(buf.subarray(this.as, i - this.drop));
        }
        if (this.state === State.MSG_PAYLOAD && !this.msgBuf) {
            if (!this.argBuf) {
                this.cloneMsgArg();
            }
            this.msgBuf = new denobuffer_1.DenoBuffer(buf.subarray(this.as));
        }
    }
    cloneMsgArg() {
        const s = this.ma.subject.length;
        const r = this.ma.reply ? this.ma.reply.length : 0;
        const buf = new Uint8Array(s + r);
        buf.set(this.ma.subject);
        if (this.ma.reply) {
            buf.set(this.ma.reply, s);
        }
        this.argBuf = new denobuffer_1.DenoBuffer(buf);
        this.ma.subject = buf.subarray(0, s);
        if (this.ma.reply) {
            this.ma.reply = buf.subarray(s);
        }
    }
    processMsgArgs(arg) {
        if (this.hdr >= 0) {
            return this.processHeaderMsgArgs(arg);
        }
        const args = [];
        let start = -1;
        for(let i = 0; i < arg.length; i++){
            const b = arg[i];
            switch(b){
                case cc.SPACE:
                case cc.TAB:
                case cc.CR:
                case cc.NL:
                    if (start >= 0) {
                        args.push(arg.subarray(start, i));
                        start = -1;
                    }
                    break;
                default:
                    if (start < 0) {
                        start = i;
                    }
            }
        }
        if (start >= 0) {
            args.push(arg.subarray(start));
        }
        switch(args.length){
            case 3:
                this.ma.subject = args[0];
                this.ma.sid = this.protoParseInt(args[1]);
                this.ma.reply = undefined;
                this.ma.size = this.protoParseInt(args[2]);
                break;
            case 4:
                this.ma.subject = args[0];
                this.ma.sid = this.protoParseInt(args[1]);
                this.ma.reply = args[2];
                this.ma.size = this.protoParseInt(args[3]);
                break;
            default:
                throw this.fail(arg, "processMsgArgs Parse Error");
        }
        if (this.ma.sid < 0) {
            throw this.fail(arg, "processMsgArgs Bad or Missing Sid Error");
        }
        if (this.ma.size < 0) {
            throw this.fail(arg, "processMsgArgs Bad or Missing Size Error");
        }
    }
    fail(data, label = "") {
        if (!label) {
            label = `parse error [${this.state}]`;
        } else {
            label = `${label} [${this.state}]`;
        }
        return new Error(`${label}: ${encoders_1.TD.decode(data)}`);
    }
    processHeaderMsgArgs(arg) {
        const args = [];
        let start = -1;
        for(let i = 0; i < arg.length; i++){
            const b = arg[i];
            switch(b){
                case cc.SPACE:
                case cc.TAB:
                case cc.CR:
                case cc.NL:
                    if (start >= 0) {
                        args.push(arg.subarray(start, i));
                        start = -1;
                    }
                    break;
                default:
                    if (start < 0) {
                        start = i;
                    }
            }
        }
        if (start >= 0) {
            args.push(arg.subarray(start));
        }
        switch(args.length){
            case 4:
                this.ma.subject = args[0];
                this.ma.sid = this.protoParseInt(args[1]);
                this.ma.reply = undefined;
                this.ma.hdr = this.protoParseInt(args[2]);
                this.ma.size = this.protoParseInt(args[3]);
                break;
            case 5:
                this.ma.subject = args[0];
                this.ma.sid = this.protoParseInt(args[1]);
                this.ma.reply = args[2];
                this.ma.hdr = this.protoParseInt(args[3]);
                this.ma.size = this.protoParseInt(args[4]);
                break;
            default:
                throw this.fail(arg, "processHeaderMsgArgs Parse Error");
        }
        if (this.ma.sid < 0) {
            throw this.fail(arg, "processHeaderMsgArgs Bad or Missing Sid Error");
        }
        if (this.ma.hdr < 0 || this.ma.hdr > this.ma.size) {
            throw this.fail(arg, "processHeaderMsgArgs Bad or Missing Header Size Error");
        }
        if (this.ma.size < 0) {
            throw this.fail(arg, "processHeaderMsgArgs Bad or Missing Size Error");
        }
    }
    protoParseInt(a) {
        if (a.length === 0) {
            return -1;
        }
        let n = 0;
        for(let i = 0; i < a.length; i++){
            if (a[i] < ASCII_0 || a[i] > ASCII_9) {
                return -1;
            }
            n = n * 10 + (a[i] - ASCII_0);
        }
        return n;
    }
}
exports.Parser = Parser;
var State;
(function(State) {
    State[State["OP_START"] = 0] = "OP_START";
    State[State["OP_PLUS"] = 1] = "OP_PLUS";
    State[State["OP_PLUS_O"] = 2] = "OP_PLUS_O";
    State[State["OP_PLUS_OK"] = 3] = "OP_PLUS_OK";
    State[State["OP_MINUS"] = 4] = "OP_MINUS";
    State[State["OP_MINUS_E"] = 5] = "OP_MINUS_E";
    State[State["OP_MINUS_ER"] = 6] = "OP_MINUS_ER";
    State[State["OP_MINUS_ERR"] = 7] = "OP_MINUS_ERR";
    State[State["OP_MINUS_ERR_SPC"] = 8] = "OP_MINUS_ERR_SPC";
    State[State["MINUS_ERR_ARG"] = 9] = "MINUS_ERR_ARG";
    State[State["OP_M"] = 10] = "OP_M";
    State[State["OP_MS"] = 11] = "OP_MS";
    State[State["OP_MSG"] = 12] = "OP_MSG";
    State[State["OP_MSG_SPC"] = 13] = "OP_MSG_SPC";
    State[State["MSG_ARG"] = 14] = "MSG_ARG";
    State[State["MSG_PAYLOAD"] = 15] = "MSG_PAYLOAD";
    State[State["MSG_END"] = 16] = "MSG_END";
    State[State["OP_H"] = 17] = "OP_H";
    State[State["OP_P"] = 18] = "OP_P";
    State[State["OP_PI"] = 19] = "OP_PI";
    State[State["OP_PIN"] = 20] = "OP_PIN";
    State[State["OP_PING"] = 21] = "OP_PING";
    State[State["OP_PO"] = 22] = "OP_PO";
    State[State["OP_PON"] = 23] = "OP_PON";
    State[State["OP_PONG"] = 24] = "OP_PONG";
    State[State["OP_I"] = 25] = "OP_I";
    State[State["OP_IN"] = 26] = "OP_IN";
    State[State["OP_INF"] = 27] = "OP_INF";
    State[State["OP_INFO"] = 28] = "OP_INFO";
    State[State["OP_INFO_SPC"] = 29] = "OP_INFO_SPC";
    State[State["INFO_ARG"] = 30] = "INFO_ARG";
})(State || (exports.State = State = {}));
var cc;
(function(cc) {
    cc[cc["CR"] = "\r".charCodeAt(0)] = "CR";
    cc[cc["E"] = "E".charCodeAt(0)] = "E";
    cc[cc["e"] = "e".charCodeAt(0)] = "e";
    cc[cc["F"] = "F".charCodeAt(0)] = "F";
    cc[cc["f"] = "f".charCodeAt(0)] = "f";
    cc[cc["G"] = "G".charCodeAt(0)] = "G";
    cc[cc["g"] = "g".charCodeAt(0)] = "g";
    cc[cc["H"] = "H".charCodeAt(0)] = "H";
    cc[cc["h"] = "h".charCodeAt(0)] = "h";
    cc[cc["I"] = "I".charCodeAt(0)] = "I";
    cc[cc["i"] = "i".charCodeAt(0)] = "i";
    cc[cc["K"] = "K".charCodeAt(0)] = "K";
    cc[cc["k"] = "k".charCodeAt(0)] = "k";
    cc[cc["M"] = "M".charCodeAt(0)] = "M";
    cc[cc["m"] = "m".charCodeAt(0)] = "m";
    cc[cc["MINUS"] = "-".charCodeAt(0)] = "MINUS";
    cc[cc["N"] = "N".charCodeAt(0)] = "N";
    cc[cc["n"] = "n".charCodeAt(0)] = "n";
    cc[cc["NL"] = "\n".charCodeAt(0)] = "NL";
    cc[cc["O"] = "O".charCodeAt(0)] = "O";
    cc[cc["o"] = "o".charCodeAt(0)] = "o";
    cc[cc["P"] = "P".charCodeAt(0)] = "P";
    cc[cc["p"] = "p".charCodeAt(0)] = "p";
    cc[cc["PLUS"] = "+".charCodeAt(0)] = "PLUS";
    cc[cc["R"] = "R".charCodeAt(0)] = "R";
    cc[cc["r"] = "r".charCodeAt(0)] = "r";
    cc[cc["S"] = "S".charCodeAt(0)] = "S";
    cc[cc["s"] = "s".charCodeAt(0)] = "s";
    cc[cc["SPACE"] = " ".charCodeAt(0)] = "SPACE";
    cc[cc["TAB"] = "\t".charCodeAt(0)] = "TAB";
})(cc || (cc = {})); //# sourceMappingURL=parser.js.map
}),
"[project]/dawg-ai/node_modules/nats/lib/nats-base-client/semver.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

/*
 * Copyright 2022-2023 The NATS Authors
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
exports.Features = exports.Feature = void 0;
exports.parseSemVer = parseSemVer;
exports.compare = compare;
function parseSemVer(s = "") {
    const m = s.match(/(\d+).(\d+).(\d+)/);
    if (m) {
        return {
            major: parseInt(m[1]),
            minor: parseInt(m[2]),
            micro: parseInt(m[3])
        };
    }
    throw new Error(`'${s}' is not a semver value`);
}
function compare(a, b) {
    if (a.major < b.major) return -1;
    if (a.major > b.major) return 1;
    if (a.minor < b.minor) return -1;
    if (a.minor > b.minor) return 1;
    if (a.micro < b.micro) return -1;
    if (a.micro > b.micro) return 1;
    return 0;
}
var Feature;
(function(Feature) {
    Feature["JS_KV"] = "js_kv";
    Feature["JS_OBJECTSTORE"] = "js_objectstore";
    Feature["JS_PULL_MAX_BYTES"] = "js_pull_max_bytes";
    Feature["JS_NEW_CONSUMER_CREATE_API"] = "js_new_consumer_create";
    Feature["JS_ALLOW_DIRECT"] = "js_allow_direct";
    Feature["JS_MULTIPLE_CONSUMER_FILTER"] = "js_multiple_consumer_filter";
    Feature["JS_SIMPLIFICATION"] = "js_simplification";
    Feature["JS_STREAM_CONSUMER_METADATA"] = "js_stream_consumer_metadata";
    Feature["JS_CONSUMER_FILTER_SUBJECTS"] = "js_consumer_filter_subjects";
    Feature["JS_STREAM_FIRST_SEQ"] = "js_stream_first_seq";
    Feature["JS_STREAM_SUBJECT_TRANSFORM"] = "js_stream_subject_transform";
    Feature["JS_STREAM_SOURCE_SUBJECT_TRANSFORM"] = "js_stream_source_subject_transform";
    Feature["JS_STREAM_COMPRESSION"] = "js_stream_compression";
    Feature["JS_DEFAULT_CONSUMER_LIMITS"] = "js_default_consumer_limits";
    Feature["JS_BATCH_DIRECT_GET"] = "js_batch_direct_get";
})(Feature || (exports.Feature = Feature = {}));
class Features {
    constructor(v){
        this.features = new Map();
        this.disabled = [];
        this.update(v);
    }
    /**
     * Removes all disabled entries
     */ resetDisabled() {
        this.disabled.length = 0;
        this.update(this.server);
    }
    /**
     * Disables a particular feature.
     * @param f
     */ disable(f) {
        this.disabled.push(f);
        this.update(this.server);
    }
    isDisabled(f) {
        return this.disabled.indexOf(f) !== -1;
    }
    update(v) {
        if (typeof v === "string") {
            v = parseSemVer(v);
        }
        this.server = v;
        this.set(Feature.JS_KV, "2.6.2");
        this.set(Feature.JS_OBJECTSTORE, "2.6.3");
        this.set(Feature.JS_PULL_MAX_BYTES, "2.8.3");
        this.set(Feature.JS_NEW_CONSUMER_CREATE_API, "2.9.0");
        this.set(Feature.JS_ALLOW_DIRECT, "2.9.0");
        this.set(Feature.JS_MULTIPLE_CONSUMER_FILTER, "2.10.0");
        this.set(Feature.JS_SIMPLIFICATION, "2.9.4");
        this.set(Feature.JS_STREAM_CONSUMER_METADATA, "2.10.0");
        this.set(Feature.JS_CONSUMER_FILTER_SUBJECTS, "2.10.0");
        this.set(Feature.JS_STREAM_FIRST_SEQ, "2.10.0");
        this.set(Feature.JS_STREAM_SUBJECT_TRANSFORM, "2.10.0");
        this.set(Feature.JS_STREAM_SOURCE_SUBJECT_TRANSFORM, "2.10.0");
        this.set(Feature.JS_STREAM_COMPRESSION, "2.10.0");
        this.set(Feature.JS_DEFAULT_CONSUMER_LIMITS, "2.10.0");
        this.set(Feature.JS_BATCH_DIRECT_GET, "2.11.0");
        this.disabled.forEach((f)=>{
            this.features.delete(f);
        });
    }
    /**
     * Register a feature that requires a particular server version.
     * @param f
     * @param requires
     */ set(f, requires) {
        this.features.set(f, {
            min: requires,
            ok: compare(this.server, parseSemVer(requires)) >= 0
        });
    }
    /**
     * Returns whether the feature is available and the min server
     * version that supports it.
     * @param f
     */ get(f) {
        return this.features.get(f) || {
            min: "unknown",
            ok: false
        };
    }
    /**
     * Returns true if the feature is supported
     * @param f
     */ supports(f) {
        var _a;
        return ((_a = this.get(f)) === null || _a === void 0 ? void 0 : _a.ok) || false;
    }
    /**
     * Returns true if the server is at least the specified version
     * @param v
     */ require(v) {
        if (typeof v === "string") {
            v = parseSemVer(v);
        }
        return compare(this.server, v) >= 0;
    }
}
exports.Features = Features; //# sourceMappingURL=semver.js.map
}),
"[project]/dawg-ai/node_modules/nats/lib/nats-base-client/nkeys.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.nkeys = void 0;
exports.nkeys = __turbopack_context__.r("[project]/dawg-ai/node_modules/nkeys.js/lib/index.js [app-ssr] (ecmascript)"); //# sourceMappingURL=nkeys.js.map
}),
"[project]/dawg-ai/node_modules/nats/lib/nats-base-client/authenticator.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.multiAuthenticator = multiAuthenticator;
exports.noAuthFn = noAuthFn;
exports.usernamePasswordAuthenticator = usernamePasswordAuthenticator;
exports.tokenAuthenticator = tokenAuthenticator;
exports.nkeyAuthenticator = nkeyAuthenticator;
exports.jwtAuthenticator = jwtAuthenticator;
exports.credsAuthenticator = credsAuthenticator;
/*
 * Copyright 2020-2023 The NATS Authors
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
 */ const nkeys_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/nkeys.js [app-ssr] (ecmascript)");
const encoders_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/encoders.js [app-ssr] (ecmascript)");
const core_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/core.js [app-ssr] (ecmascript)");
function multiAuthenticator(authenticators) {
    return (nonce)=>{
        let auth = {};
        authenticators.forEach((a)=>{
            const args = a(nonce) || {};
            auth = Object.assign(auth, args);
        });
        return auth;
    };
}
function noAuthFn() {
    return ()=>{
        return;
    };
}
/**
 * Returns a user/pass authenticator for the specified user and optional password
 * @param { string | () => string } user
 * @param {string | () => string } pass
 * @return {UserPass}
 */ function usernamePasswordAuthenticator(user, pass) {
    return ()=>{
        const u = typeof user === "function" ? user() : user;
        const p = typeof pass === "function" ? pass() : pass;
        return {
            user: u,
            pass: p
        };
    };
}
/**
 * Returns a token authenticator for the specified token
 * @param { string | () => string } token
 * @return {TokenAuth}
 */ function tokenAuthenticator(token) {
    return ()=>{
        const auth_token = typeof token === "function" ? token() : token;
        return {
            auth_token
        };
    };
}
/**
 * Returns an Authenticator that returns a NKeyAuth based that uses the
 * specified seed or function returning a seed.
 * @param {Uint8Array | (() => Uint8Array)} seed - the nkey seed
 * @return {NKeyAuth}
 */ function nkeyAuthenticator(seed) {
    return (nonce)=>{
        const s = typeof seed === "function" ? seed() : seed;
        const kp = s ? nkeys_1.nkeys.fromSeed(s) : undefined;
        const nkey = kp ? kp.getPublicKey() : "";
        const challenge = encoders_1.TE.encode(nonce || "");
        const sigBytes = kp !== undefined && nonce ? kp.sign(challenge) : undefined;
        const sig = sigBytes ? nkeys_1.nkeys.encode(sigBytes) : "";
        return {
            nkey,
            sig
        };
    };
}
/**
 * Returns an Authenticator function that returns a JwtAuth.
 * If a seed is provided, the public key, and signature are
 * calculated.
 *
 * @param {string | ()=>string} ajwt - the jwt
 * @param {Uint8Array | ()=> Uint8Array } seed - the optional nkey seed
 * @return {Authenticator}
 */ function jwtAuthenticator(ajwt, seed) {
    return (nonce)=>{
        const jwt = typeof ajwt === "function" ? ajwt() : ajwt;
        const fn = nkeyAuthenticator(seed);
        const { nkey, sig } = fn(nonce);
        return {
            jwt,
            nkey,
            sig
        };
    };
}
/**
 * Returns an Authenticator function that returns a JwtAuth.
 * This is a convenience Authenticator that parses the
 * specified creds and delegates to the jwtAuthenticator.
 * @param {Uint8Array | () => Uint8Array } creds - the contents of a creds file or a function that returns the creds
 * @returns {JwtAuth}
 */ function credsAuthenticator(creds) {
    const fn = typeof creds !== "function" ? ()=>creds : creds;
    const parse = ()=>{
        const CREDS = /\s*(?:(?:[-]{3,}[^\n]*[-]{3,}\n)(.+)(?:\n\s*[-]{3,}[^\n]*[-]{3,}\n))/ig;
        const s = encoders_1.TD.decode(fn());
        // get the JWT
        let m = CREDS.exec(s);
        if (!m) {
            throw core_1.NatsError.errorForCode(core_1.ErrorCode.BadCreds);
        }
        const jwt = m[1].trim();
        // get the nkey
        m = CREDS.exec(s);
        if (!m) {
            throw core_1.NatsError.errorForCode(core_1.ErrorCode.BadCreds);
        }
        if (!m) {
            throw core_1.NatsError.errorForCode(core_1.ErrorCode.BadCreds);
        }
        const seed = encoders_1.TE.encode(m[1].trim());
        return {
            jwt,
            seed
        };
    };
    const jwtFn = ()=>{
        const { jwt } = parse();
        return jwt;
    };
    const nkeyFn = ()=>{
        const { seed } = parse();
        return seed;
    };
    return jwtAuthenticator(jwtFn, nkeyFn);
} //# sourceMappingURL=authenticator.js.map
}),
"[project]/dawg-ai/node_modules/nats/lib/nats-base-client/options.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

/*
 * Copyright 2021-2023 The NATS Authors
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
exports.DEFAULT_RECONNECT_TIME_WAIT = exports.DEFAULT_MAX_PING_OUT = exports.DEFAULT_PING_INTERVAL = exports.DEFAULT_JITTER_TLS = exports.DEFAULT_JITTER = exports.DEFAULT_MAX_RECONNECT_ATTEMPTS = void 0;
exports.defaultOptions = defaultOptions;
exports.buildAuthenticator = buildAuthenticator;
exports.parseOptions = parseOptions;
exports.checkOptions = checkOptions;
exports.checkUnsupportedOption = checkUnsupportedOption;
const util_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/util.js [app-ssr] (ecmascript)");
const transport_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/transport.js [app-ssr] (ecmascript)");
const core_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/core.js [app-ssr] (ecmascript)");
const authenticator_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/authenticator.js [app-ssr] (ecmascript)");
const core_2 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/core.js [app-ssr] (ecmascript)");
exports.DEFAULT_MAX_RECONNECT_ATTEMPTS = 10;
exports.DEFAULT_JITTER = 100;
exports.DEFAULT_JITTER_TLS = 1000;
// Ping interval
exports.DEFAULT_PING_INTERVAL = 2 * 60 * 1000; // 2 minutes
exports.DEFAULT_MAX_PING_OUT = 2;
// DISCONNECT Parameters, 2 sec wait, 10 tries
exports.DEFAULT_RECONNECT_TIME_WAIT = 2 * 1000;
function defaultOptions() {
    return {
        maxPingOut: exports.DEFAULT_MAX_PING_OUT,
        maxReconnectAttempts: exports.DEFAULT_MAX_RECONNECT_ATTEMPTS,
        noRandomize: false,
        pedantic: false,
        pingInterval: exports.DEFAULT_PING_INTERVAL,
        reconnect: true,
        reconnectJitter: exports.DEFAULT_JITTER,
        reconnectJitterTLS: exports.DEFAULT_JITTER_TLS,
        reconnectTimeWait: exports.DEFAULT_RECONNECT_TIME_WAIT,
        tls: undefined,
        verbose: false,
        waitOnFirstConnect: false,
        ignoreAuthErrorAbort: false
    };
}
function buildAuthenticator(opts) {
    const buf = [];
    // jwtAuthenticator is created by the user, since it
    // will require possibly reading files which
    // some of the clients are simply unable to do
    if (typeof opts.authenticator === "function") {
        buf.push(opts.authenticator);
    }
    if (Array.isArray(opts.authenticator)) {
        buf.push(...opts.authenticator);
    }
    if (opts.token) {
        buf.push((0, authenticator_1.tokenAuthenticator)(opts.token));
    }
    if (opts.user) {
        buf.push((0, authenticator_1.usernamePasswordAuthenticator)(opts.user, opts.pass));
    }
    return buf.length === 0 ? (0, authenticator_1.noAuthFn)() : (0, authenticator_1.multiAuthenticator)(buf);
}
function parseOptions(opts) {
    const dhp = `${core_2.DEFAULT_HOST}:${(0, transport_1.defaultPort)()}`;
    opts = opts || {
        servers: [
            dhp
        ]
    };
    opts.servers = opts.servers || [];
    if (typeof opts.servers === "string") {
        opts.servers = [
            opts.servers
        ];
    }
    if (opts.servers.length > 0 && opts.port) {
        throw new core_2.NatsError("port and servers options are mutually exclusive", core_2.ErrorCode.InvalidOption);
    }
    if (opts.servers.length === 0 && opts.port) {
        opts.servers = [
            `${core_2.DEFAULT_HOST}:${opts.port}`
        ];
    }
    if (opts.servers && opts.servers.length === 0) {
        opts.servers = [
            dhp
        ];
    }
    const options = (0, util_1.extend)(defaultOptions(), opts);
    options.authenticator = buildAuthenticator(options);
    [
        "reconnectDelayHandler",
        "authenticator"
    ].forEach((n)=>{
        if (options[n] && typeof options[n] !== "function") {
            throw new core_2.NatsError(`${n} option should be a function`, core_2.ErrorCode.NotFunction);
        }
    });
    if (!options.reconnectDelayHandler) {
        options.reconnectDelayHandler = ()=>{
            let extra = options.tls ? options.reconnectJitterTLS : options.reconnectJitter;
            if (extra) {
                extra++;
                extra = Math.floor(Math.random() * extra);
            }
            return options.reconnectTimeWait + extra;
        };
    }
    if (options.inboxPrefix) {
        try {
            (0, core_1.createInbox)(options.inboxPrefix);
        } catch (err) {
            throw new core_2.NatsError(err.message, core_2.ErrorCode.ApiError);
        }
    }
    // if not set - we set it
    if (options.resolve === undefined) {
        // set a default based on whether the client can resolve or not
        options.resolve = typeof (0, transport_1.getResolveFn)() === "function";
    }
    if (options.resolve) {
        if (typeof (0, transport_1.getResolveFn)() !== "function") {
            throw new core_2.NatsError(`'resolve' is not supported on this client`, core_2.ErrorCode.InvalidOption);
        }
    }
    return options;
}
function checkOptions(info, options) {
    const { proto, tls_required: tlsRequired, tls_available: tlsAvailable } = info;
    if ((proto === undefined || proto < 1) && options.noEcho) {
        throw new core_2.NatsError("noEcho", core_2.ErrorCode.ServerOptionNotAvailable);
    }
    const tls = tlsRequired || tlsAvailable || false;
    if (options.tls && !tls) {
        throw new core_2.NatsError("tls", core_2.ErrorCode.ServerOptionNotAvailable);
    }
}
function checkUnsupportedOption(prop, v) {
    if (v) {
        throw new core_2.NatsError(prop, core_2.ErrorCode.InvalidOption);
    }
} //# sourceMappingURL=options.js.map
}),
"[project]/dawg-ai/node_modules/nats/lib/nats-base-client/protocol.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __awaiter = /*TURBOPACK member replacement*/ __turbopack_context__.e && /*TURBOPACK member replacement*/ __turbopack_context__.e.__awaiter || function(thisArg, _arguments, P, generator) {
    function adopt(value) {
        return value instanceof P ? value : new P(function(resolve) {
            resolve(value);
        });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
        function fulfilled(value) {
            try {
                step(generator.next(value));
            } catch (e) {
                reject(e);
            }
        }
        function rejected(value) {
            try {
                step(generator["throw"](value));
            } catch (e) {
                reject(e);
            }
        }
        function step(result) {
            result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = /*TURBOPACK member replacement*/ __turbopack_context__.e && /*TURBOPACK member replacement*/ __turbopack_context__.e.__asyncValues || function(o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function() {
        return this;
    }, i);
    //TURBOPACK unreachable
    ;
    function verb(n) {
        i[n] = o[n] && function(v) {
            return new Promise(function(resolve, reject) {
                v = o[n](v), settle(resolve, reject, v.done, v.value);
            });
        };
    }
    function settle(resolve, reject, d, v) {
        Promise.resolve(v).then(function(v) {
            resolve({
                value: v,
                done: d
            });
        }, reject);
    }
};
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ProtocolHandler = exports.Subscriptions = exports.SubscriptionImpl = exports.Connect = exports.INFO = void 0;
/*
 * Copyright 2018-2023 The NATS Authors
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
 */ const encoders_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/encoders.js [app-ssr] (ecmascript)");
const transport_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/transport.js [app-ssr] (ecmascript)");
const util_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/util.js [app-ssr] (ecmascript)");
const databuffer_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/databuffer.js [app-ssr] (ecmascript)");
const servers_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/servers.js [app-ssr] (ecmascript)");
const queued_iterator_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/queued_iterator.js [app-ssr] (ecmascript)");
const muxsubscription_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/muxsubscription.js [app-ssr] (ecmascript)");
const heartbeats_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/heartbeats.js [app-ssr] (ecmascript)");
const parser_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/parser.js [app-ssr] (ecmascript)");
const msg_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/msg.js [app-ssr] (ecmascript)");
const semver_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/semver.js [app-ssr] (ecmascript)");
const core_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/core.js [app-ssr] (ecmascript)");
const options_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/options.js [app-ssr] (ecmascript)");
const FLUSH_THRESHOLD = 1024 * 32;
exports.INFO = /^INFO\s+([^\r\n]+)\r\n/i;
const PONG_CMD = (0, encoders_1.encode)("PONG\r\n");
const PING_CMD = (0, encoders_1.encode)("PING\r\n");
class Connect {
    constructor(transport, opts, nonce){
        this.protocol = 1;
        this.version = transport.version;
        this.lang = transport.lang;
        this.echo = opts.noEcho ? false : undefined;
        this.verbose = opts.verbose;
        this.pedantic = opts.pedantic;
        this.tls_required = opts.tls ? true : undefined;
        this.name = opts.name;
        const creds = (opts && typeof opts.authenticator === "function" ? opts.authenticator(nonce) : {}) || {};
        (0, util_1.extend)(this, creds);
    }
}
exports.Connect = Connect;
class SubscriptionImpl extends queued_iterator_1.QueuedIteratorImpl {
    constructor(protocol, subject, opts = {}){
        var _a;
        super();
        (0, util_1.extend)(this, opts);
        this.protocol = protocol;
        this.subject = subject;
        this.draining = false;
        this.noIterator = typeof opts.callback === "function";
        this.closed = (0, util_1.deferred)();
        const asyncTraces = !(((_a = protocol.options) === null || _a === void 0 ? void 0 : _a.noAsyncTraces) || false);
        if (opts.timeout) {
            this.timer = (0, util_1.timeout)(opts.timeout, asyncTraces);
            this.timer.then(()=>{
                // timer was cancelled
                this.timer = undefined;
            }).catch((err)=>{
                // timer fired
                this.stop(err);
                if (this.noIterator) {
                    this.callback(err, {});
                }
            });
        }
        if (!this.noIterator) {
            // cleanup - they used break or return from the iterator
            // make sure we clean up, if they didn't call unsub
            this.iterClosed.then(()=>{
                this.closed.resolve();
                this.unsubscribe();
            });
        }
    }
    setPrePostHandlers(opts) {
        if (this.noIterator) {
            const uc = this.callback;
            const ingestion = opts.ingestionFilterFn ? opts.ingestionFilterFn : ()=>{
                return {
                    ingest: true,
                    protocol: false
                };
            };
            const filter = opts.protocolFilterFn ? opts.protocolFilterFn : ()=>{
                return true;
            };
            const dispatched = opts.dispatchedFn ? opts.dispatchedFn : ()=>{};
            this.callback = (err, msg)=>{
                const { ingest } = ingestion(msg);
                if (!ingest) {
                    return;
                }
                if (filter(msg)) {
                    uc(err, msg);
                    dispatched(msg);
                }
            };
        } else {
            this.protocolFilterFn = opts.protocolFilterFn;
            this.dispatchedFn = opts.dispatchedFn;
        }
    }
    callback(err, msg) {
        this.cancelTimeout();
        err ? this.stop(err) : this.push(msg);
    }
    close() {
        if (!this.isClosed()) {
            this.cancelTimeout();
            const fn = ()=>{
                this.stop();
                if (this.cleanupFn) {
                    try {
                        this.cleanupFn(this, this.info);
                    } catch (_err) {
                    // ignoring
                    }
                }
                this.closed.resolve();
            };
            if (this.noIterator) {
                fn();
            } else {
                //@ts-ignore: schedule the close once all messages are processed
                this.push(fn);
            }
        }
    }
    unsubscribe(max) {
        this.protocol.unsubscribe(this, max);
    }
    cancelTimeout() {
        if (this.timer) {
            this.timer.cancel();
            this.timer = undefined;
        }
    }
    drain() {
        if (this.protocol.isClosed()) {
            return Promise.reject(core_1.NatsError.errorForCode(core_1.ErrorCode.ConnectionClosed));
        }
        if (this.isClosed()) {
            return Promise.reject(core_1.NatsError.errorForCode(core_1.ErrorCode.SubClosed));
        }
        if (!this.drained) {
            this.draining = true;
            this.protocol.unsub(this);
            this.drained = this.protocol.flush((0, util_1.deferred)()).then(()=>{
                this.protocol.subscriptions.cancel(this);
            }).catch(()=>{
                this.protocol.subscriptions.cancel(this);
            });
        }
        return this.drained;
    }
    isDraining() {
        return this.draining;
    }
    isClosed() {
        return this.done;
    }
    getSubject() {
        return this.subject;
    }
    getMax() {
        return this.max;
    }
    getID() {
        return this.sid;
    }
}
exports.SubscriptionImpl = SubscriptionImpl;
class Subscriptions {
    constructor(){
        this.sidCounter = 0;
        this.mux = null;
        this.subs = new Map();
    }
    size() {
        return this.subs.size;
    }
    add(s) {
        this.sidCounter++;
        s.sid = this.sidCounter;
        this.subs.set(s.sid, s);
        return s;
    }
    setMux(s) {
        this.mux = s;
        return s;
    }
    getMux() {
        return this.mux;
    }
    get(sid) {
        return this.subs.get(sid);
    }
    resub(s) {
        this.sidCounter++;
        this.subs.delete(s.sid);
        s.sid = this.sidCounter;
        this.subs.set(s.sid, s);
        return s;
    }
    all() {
        return Array.from(this.subs.values());
    }
    cancel(s) {
        if (s) {
            s.close();
            this.subs.delete(s.sid);
        }
    }
    handleError(err) {
        if (err && err.permissionContext) {
            const ctx = err.permissionContext;
            const subs = this.all();
            let sub;
            if (ctx.operation === "subscription") {
                sub = subs.find((s)=>{
                    return s.subject === ctx.subject && s.queue === ctx.queue;
                });
            }
            if (ctx.operation === "publish") {
                // we have a no mux subscription
                sub = subs.find((s)=>{
                    return s.requestSubject === ctx.subject;
                });
            }
            if (sub) {
                sub.callback(err, {});
                sub.close();
                this.subs.delete(sub.sid);
                return sub !== this.mux;
            }
        }
        return false;
    }
    close() {
        this.subs.forEach((sub)=>{
            sub.close();
        });
    }
}
exports.Subscriptions = Subscriptions;
class ProtocolHandler {
    constructor(options, publisher){
        this._closed = false;
        this.connected = false;
        this.connectedOnce = false;
        this.infoReceived = false;
        this.noMorePublishing = false;
        this.abortReconnect = false;
        this.listeners = [];
        this.pendingLimit = FLUSH_THRESHOLD;
        this.outMsgs = 0;
        this.inMsgs = 0;
        this.outBytes = 0;
        this.inBytes = 0;
        this.options = options;
        this.publisher = publisher;
        this.subscriptions = new Subscriptions();
        this.muxSubscriptions = new muxsubscription_1.MuxSubscription();
        this.outbound = new databuffer_1.DataBuffer();
        this.pongs = [];
        this.whyClosed = "";
        //@ts-ignore: options.pendingLimit is hidden
        this.pendingLimit = options.pendingLimit || this.pendingLimit;
        this.features = new semver_1.Features({
            major: 0,
            minor: 0,
            micro: 0
        });
        this.connectPromise = null;
        const servers = typeof options.servers === "string" ? [
            options.servers
        ] : options.servers;
        this.servers = new servers_1.Servers(servers, {
            randomize: !options.noRandomize
        });
        this.closed = (0, util_1.deferred)();
        this.parser = new parser_1.Parser(this);
        this.heartbeats = new heartbeats_1.Heartbeat(this, this.options.pingInterval || options_1.DEFAULT_PING_INTERVAL, this.options.maxPingOut || options_1.DEFAULT_MAX_PING_OUT);
    }
    resetOutbound() {
        this.outbound.reset();
        const pongs = this.pongs;
        this.pongs = [];
        // reject the pongs - the disconnect from here shouldn't have a trace
        // because that confuses API consumers
        const err = core_1.NatsError.errorForCode(core_1.ErrorCode.Disconnect);
        err.stack = "";
        pongs.forEach((p)=>{
            p.reject(err);
        });
        this.parser = new parser_1.Parser(this);
        this.infoReceived = false;
    }
    dispatchStatus(status) {
        this.listeners.forEach((q)=>{
            q.push(status);
        });
    }
    status() {
        const iter = new queued_iterator_1.QueuedIteratorImpl();
        this.listeners.push(iter);
        return iter;
    }
    prepare() {
        if (this.transport) {
            this.transport.discard();
        }
        this.info = undefined;
        this.resetOutbound();
        const pong = (0, util_1.deferred)();
        pong.catch(()=>{
        // provide at least one catch - as pong rejection can happen before it is expected
        });
        this.pongs.unshift(pong);
        this.connectError = (err)=>{
            pong.reject(err);
        };
        this.transport = (0, transport_1.newTransport)();
        this.transport.closed().then((_err)=>__awaiter(this, void 0, void 0, function*() {
                this.connected = false;
                if (!this.isClosed()) {
                    // if the transport gave an error use that, otherwise
                    // we may have received a protocol error
                    yield this.disconnected(this.transport.closeError || this.lastError);
                    return;
                }
            }));
        return pong;
    }
    disconnect() {
        this.dispatchStatus({
            type: core_1.DebugEvents.StaleConnection,
            data: ""
        });
        this.transport.disconnect();
    }
    reconnect() {
        if (this.connected) {
            this.dispatchStatus({
                type: core_1.DebugEvents.ClientInitiatedReconnect,
                data: ""
            });
            this.transport.disconnect();
        }
        return Promise.resolve();
    }
    disconnected(err) {
        return __awaiter(this, void 0, void 0, function*() {
            this.dispatchStatus({
                type: core_1.Events.Disconnect,
                data: this.servers.getCurrentServer().toString()
            });
            if (this.options.reconnect) {
                yield this.dialLoop().then(()=>{
                    var _a;
                    this.dispatchStatus({
                        type: core_1.Events.Reconnect,
                        data: this.servers.getCurrentServer().toString()
                    });
                    // if we are here we reconnected, but we have an authentication
                    // that expired, we need to clean it up, otherwise we'll queue up
                    // two of these, and the default for the client will be to
                    // close, rather than attempt again - possibly they have an
                    // authenticator that dynamically updates
                    if (((_a = this.lastError) === null || _a === void 0 ? void 0 : _a.code) === core_1.ErrorCode.AuthenticationExpired) {
                        this.lastError = undefined;
                    }
                }).catch((err)=>{
                    this._close(err);
                });
            } else {
                yield this._close(err);
            }
        });
    }
    dial(srv) {
        return __awaiter(this, void 0, void 0, function*() {
            const pong = this.prepare();
            let timer;
            try {
                timer = (0, util_1.timeout)(this.options.timeout || 20000);
                const cp = this.transport.connect(srv, this.options);
                yield Promise.race([
                    cp,
                    timer
                ]);
                (()=>__awaiter(this, void 0, void 0, function*() {
                        var _a, e_1, _b, _c;
                        try {
                            try {
                                for(var _d = true, _e = __asyncValues(this.transport), _f; _f = yield _e.next(), _a = _f.done, !_a; _d = true){
                                    _c = _f.value;
                                    _d = false;
                                    const b = _c;
                                    this.parser.parse(b);
                                }
                            } catch (e_1_1) {
                                e_1 = {
                                    error: e_1_1
                                };
                            } finally{
                                try {
                                    if (!_d && !_a && (_b = _e.return)) yield _b.call(_e);
                                } finally{
                                    if (e_1) throw e_1.error;
                                }
                            }
                        } catch (err) {
                            console.log("reader closed", err);
                        }
                    }))().then();
            } catch (err) {
                pong.reject(err);
            }
            try {
                yield Promise.race([
                    timer,
                    pong
                ]);
                if (timer) {
                    timer.cancel();
                }
                this.connected = true;
                this.connectError = undefined;
                this.sendSubscriptions();
                this.connectedOnce = true;
                this.server.didConnect = true;
                this.server.reconnects = 0;
                this.flushPending();
                this.heartbeats.start();
            } catch (err) {
                if (timer) {
                    timer.cancel();
                }
                yield this.transport.close(err);
                throw err;
            }
        });
    }
    _doDial(srv) {
        return __awaiter(this, void 0, void 0, function*() {
            const { resolve } = this.options;
            const alts = yield srv.resolve({
                fn: (0, transport_1.getResolveFn)(),
                debug: this.options.debug,
                randomize: !this.options.noRandomize,
                resolve
            });
            let lastErr = null;
            for (const a of alts){
                try {
                    lastErr = null;
                    this.dispatchStatus({
                        type: core_1.DebugEvents.Reconnecting,
                        data: a.toString()
                    });
                    yield this.dial(a);
                    // if here we connected
                    return;
                } catch (err) {
                    lastErr = err;
                }
            }
            // if we are here, we failed, and we have no additional
            // alternatives for this server
            throw lastErr;
        });
    }
    dialLoop() {
        if (this.connectPromise === null) {
            this.connectPromise = this.dodialLoop();
            this.connectPromise.then(()=>{}).catch(()=>{}).finally(()=>{
                this.connectPromise = null;
            });
        }
        return this.connectPromise;
    }
    dodialLoop() {
        return __awaiter(this, void 0, void 0, function*() {
            let lastError;
            while(true){
                if (this._closed) {
                    // if we are disconnected, and close is called, the client
                    // still tries to reconnect - to match the reconnect policy
                    // in the case of close, want to stop.
                    this.servers.clear();
                }
                const wait = this.options.reconnectDelayHandler ? this.options.reconnectDelayHandler() : options_1.DEFAULT_RECONNECT_TIME_WAIT;
                let maxWait = wait;
                const srv = this.selectServer();
                if (!srv || this.abortReconnect) {
                    if (lastError) {
                        throw lastError;
                    } else if (this.lastError) {
                        throw this.lastError;
                    } else {
                        throw core_1.NatsError.errorForCode(core_1.ErrorCode.ConnectionRefused);
                    }
                }
                const now = Date.now();
                if (srv.lastConnect === 0 || srv.lastConnect + wait <= now) {
                    srv.lastConnect = Date.now();
                    try {
                        yield this._doDial(srv);
                        break;
                    } catch (err) {
                        lastError = err;
                        if (!this.connectedOnce) {
                            if (this.options.waitOnFirstConnect) {
                                continue;
                            }
                            this.servers.removeCurrentServer();
                        }
                        srv.reconnects++;
                        const mra = this.options.maxReconnectAttempts || 0;
                        if (mra !== -1 && srv.reconnects >= mra) {
                            this.servers.removeCurrentServer();
                        }
                    }
                } else {
                    maxWait = Math.min(maxWait, srv.lastConnect + wait - now);
                    yield (0, util_1.delay)(maxWait);
                }
            }
        });
    }
    static connect(options, publisher) {
        return __awaiter(this, void 0, void 0, function*() {
            const h = new ProtocolHandler(options, publisher);
            yield h.dialLoop();
            return h;
        });
    }
    static toError(s) {
        const t = s ? s.toLowerCase() : "";
        if (t.indexOf("permissions violation") !== -1) {
            const err = new core_1.NatsError(s, core_1.ErrorCode.PermissionsViolation);
            const m = s.match(/(Publish|Subscription) to "(\S+)"/);
            if (m) {
                err.permissionContext = {
                    operation: m[1].toLowerCase(),
                    subject: m[2],
                    queue: undefined
                };
                const qm = s.match(/using queue "(\S+)"/);
                if (qm) {
                    err.permissionContext.queue = qm[1];
                }
            }
            return err;
        } else if (t.indexOf("authorization violation") !== -1) {
            return new core_1.NatsError(s, core_1.ErrorCode.AuthorizationViolation);
        } else if (t.indexOf("user authentication expired") !== -1) {
            return new core_1.NatsError(s, core_1.ErrorCode.AuthenticationExpired);
        } else if (t.indexOf("account authentication expired") != -1) {
            return new core_1.NatsError(s, core_1.ErrorCode.AccountExpired);
        } else if (t.indexOf("authentication timeout") !== -1) {
            return new core_1.NatsError(s, core_1.ErrorCode.AuthenticationTimeout);
        } else {
            return new core_1.NatsError(s, core_1.ErrorCode.ProtocolError);
        }
    }
    processMsg(msg, data) {
        this.inMsgs++;
        this.inBytes += data.length;
        if (!this.subscriptions.sidCounter) {
            return;
        }
        const sub = this.subscriptions.get(msg.sid);
        if (!sub) {
            return;
        }
        sub.received += 1;
        if (sub.callback) {
            sub.callback(null, new msg_1.MsgImpl(msg, data, this));
        }
        if (sub.max !== undefined && sub.received >= sub.max) {
            sub.unsubscribe();
        }
    }
    processError(m) {
        const s = (0, encoders_1.decode)(m);
        const err = ProtocolHandler.toError(s);
        const status = {
            type: core_1.Events.Error,
            data: err.code
        };
        if (err.isPermissionError()) {
            let isMuxPermissionError = false;
            if (err.permissionContext) {
                status.permissionContext = err.permissionContext;
                const mux = this.subscriptions.getMux();
                isMuxPermissionError = (mux === null || mux === void 0 ? void 0 : mux.subject) === err.permissionContext.subject;
            }
            this.subscriptions.handleError(err);
            this.muxSubscriptions.handleError(isMuxPermissionError, err);
            if (isMuxPermissionError) {
                // remove the permission - enable it to be recreated
                this.subscriptions.setMux(null);
            }
        }
        this.dispatchStatus(status);
        this.handleError(err);
    }
    handleError(err) {
        if (err.isAuthError()) {
            this.handleAuthError(err);
        } else if (err.isProtocolError()) {
            this.lastError = err;
        } else if (err.isAuthTimeout()) {
            this.lastError = err;
        }
        // fallthrough here
        if (!err.isPermissionError()) {
            this.lastError = err;
        }
    }
    handleAuthError(err) {
        if (this.lastError && err.code === this.lastError.code && this.options.ignoreAuthErrorAbort === false) {
            this.abortReconnect = true;
        }
        if (this.connectError) {
            this.connectError(err);
        } else {
            this.disconnect();
        }
    }
    processPing() {
        this.transport.send(PONG_CMD);
    }
    processPong() {
        const cb = this.pongs.shift();
        if (cb) {
            cb.resolve();
        }
    }
    processInfo(m) {
        const info = JSON.parse((0, encoders_1.decode)(m));
        this.info = info;
        const updates = this.options && this.options.ignoreClusterUpdates ? undefined : this.servers.update(info, this.transport.isEncrypted());
        if (!this.infoReceived) {
            this.features.update((0, semver_1.parseSemVer)(info.version));
            this.infoReceived = true;
            if (this.transport.isEncrypted()) {
                this.servers.updateTLSName();
            }
            // send connect
            const { version, lang } = this.transport;
            try {
                const c = new Connect({
                    version,
                    lang
                }, this.options, info.nonce);
                if (info.headers) {
                    c.headers = true;
                    c.no_responders = true;
                }
                const cs = JSON.stringify(c);
                this.transport.send((0, encoders_1.encode)(`CONNECT ${cs}${transport_1.CR_LF}`));
                this.transport.send(PING_CMD);
            } catch (err) {
                // if we are dying here, this is likely some an authenticator blowing up
                this._close(err);
            }
        }
        if (updates) {
            this.dispatchStatus({
                type: core_1.Events.Update,
                data: updates
            });
        }
        const ldm = info.ldm !== undefined ? info.ldm : false;
        if (ldm) {
            this.dispatchStatus({
                type: core_1.Events.LDM,
                data: this.servers.getCurrentServer().toString()
            });
        }
    }
    push(e) {
        switch(e.kind){
            case parser_1.Kind.MSG:
                {
                    const { msg, data } = e;
                    this.processMsg(msg, data);
                    break;
                }
            case parser_1.Kind.OK:
                break;
            case parser_1.Kind.ERR:
                this.processError(e.data);
                break;
            case parser_1.Kind.PING:
                this.processPing();
                break;
            case parser_1.Kind.PONG:
                this.processPong();
                break;
            case parser_1.Kind.INFO:
                this.processInfo(e.data);
                break;
        }
    }
    sendCommand(cmd, ...payloads) {
        const len = this.outbound.length();
        let buf;
        if (typeof cmd === "string") {
            buf = (0, encoders_1.encode)(cmd);
        } else {
            buf = cmd;
        }
        this.outbound.fill(buf, ...payloads);
        if (len === 0) {
            queueMicrotask(()=>{
                this.flushPending();
            });
        } else if (this.outbound.size() >= this.pendingLimit) {
            // flush inline
            this.flushPending();
        }
    }
    publish(subject, payload = encoders_1.Empty, options) {
        let data;
        if (payload instanceof Uint8Array) {
            data = payload;
        } else if (typeof payload === "string") {
            data = encoders_1.TE.encode(payload);
        } else {
            throw core_1.NatsError.errorForCode(core_1.ErrorCode.BadPayload);
        }
        let len = data.length;
        options = options || {};
        options.reply = options.reply || "";
        let headers = encoders_1.Empty;
        let hlen = 0;
        if (options.headers) {
            if (this.info && !this.info.headers) {
                throw new core_1.NatsError("headers", core_1.ErrorCode.ServerOptionNotAvailable);
            }
            const hdrs = options.headers;
            headers = hdrs.encode();
            hlen = headers.length;
            len = data.length + hlen;
        }
        if (this.info && len > this.info.max_payload) {
            throw core_1.NatsError.errorForCode(core_1.ErrorCode.MaxPayloadExceeded);
        }
        this.outBytes += len;
        this.outMsgs++;
        let proto;
        if (options.headers) {
            if (options.reply) {
                proto = `HPUB ${subject} ${options.reply} ${hlen} ${len}\r\n`;
            } else {
                proto = `HPUB ${subject} ${hlen} ${len}\r\n`;
            }
            this.sendCommand(proto, headers, data, transport_1.CRLF);
        } else {
            if (options.reply) {
                proto = `PUB ${subject} ${options.reply} ${len}\r\n`;
            } else {
                proto = `PUB ${subject} ${len}\r\n`;
            }
            this.sendCommand(proto, data, transport_1.CRLF);
        }
    }
    request(r) {
        this.initMux();
        this.muxSubscriptions.add(r);
        return r;
    }
    subscribe(s) {
        this.subscriptions.add(s);
        this._subunsub(s);
        return s;
    }
    _sub(s) {
        if (s.queue) {
            this.sendCommand(`SUB ${s.subject} ${s.queue} ${s.sid}\r\n`);
        } else {
            this.sendCommand(`SUB ${s.subject} ${s.sid}\r\n`);
        }
    }
    _subunsub(s) {
        this._sub(s);
        if (s.max) {
            this.unsubscribe(s, s.max);
        }
        return s;
    }
    unsubscribe(s, max) {
        this.unsub(s, max);
        if (s.max === undefined || s.received >= s.max) {
            this.subscriptions.cancel(s);
        }
    }
    unsub(s, max) {
        if (!s || this.isClosed()) {
            return;
        }
        if (max) {
            this.sendCommand(`UNSUB ${s.sid} ${max}\r\n`);
        } else {
            this.sendCommand(`UNSUB ${s.sid}\r\n`);
        }
        s.max = max;
    }
    resub(s, subject) {
        if (!s || this.isClosed()) {
            return;
        }
        this.unsub(s);
        s.subject = subject;
        this.subscriptions.resub(s);
        // we don't auto-unsub here because we don't
        // really know "processed"
        this._sub(s);
    }
    flush(p) {
        if (!p) {
            p = (0, util_1.deferred)();
        }
        this.pongs.push(p);
        this.outbound.fill(PING_CMD);
        this.flushPending();
        return p;
    }
    sendSubscriptions() {
        const cmds = [];
        this.subscriptions.all().forEach((s)=>{
            const sub = s;
            if (sub.queue) {
                cmds.push(`SUB ${sub.subject} ${sub.queue} ${sub.sid}${transport_1.CR_LF}`);
            } else {
                cmds.push(`SUB ${sub.subject} ${sub.sid}${transport_1.CR_LF}`);
            }
        });
        if (cmds.length) {
            this.transport.send((0, encoders_1.encode)(cmds.join("")));
        }
    }
    _close(err) {
        return __awaiter(this, void 0, void 0, function*() {
            if (this._closed) {
                return;
            }
            this.whyClosed = new Error("close trace").stack || "";
            this.heartbeats.cancel();
            if (this.connectError) {
                this.connectError(err);
                this.connectError = undefined;
            }
            this.muxSubscriptions.close();
            this.subscriptions.close();
            this.listeners.forEach((l)=>{
                l.stop();
            });
            this._closed = true;
            yield this.transport.close(err);
            yield this.closed.resolve(err);
        });
    }
    close() {
        return this._close();
    }
    isClosed() {
        return this._closed;
    }
    drain() {
        const subs = this.subscriptions.all();
        const promises = [];
        subs.forEach((sub)=>{
            promises.push(sub.drain());
        });
        return Promise.all(promises).then(()=>__awaiter(this, void 0, void 0, function*() {
                this.noMorePublishing = true;
                yield this.flush();
                return this.close();
            })).catch(()=>{
        // cannot happen
        });
    }
    flushPending() {
        if (!this.infoReceived || !this.connected) {
            return;
        }
        if (this.outbound.size()) {
            const d = this.outbound.drain();
            this.transport.send(d);
        }
    }
    initMux() {
        const mux = this.subscriptions.getMux();
        if (!mux) {
            const inbox = this.muxSubscriptions.init(this.options.inboxPrefix);
            // dot is already part of mux
            const sub = new SubscriptionImpl(this, `${inbox}*`);
            sub.callback = this.muxSubscriptions.dispatcher();
            this.subscriptions.setMux(sub);
            this.subscribe(sub);
        }
    }
    selectServer() {
        const server = this.servers.selectServer();
        if (server === undefined) {
            return undefined;
        }
        // Place in client context.
        this.server = server;
        return this.server;
    }
    getServer() {
        return this.server;
    }
}
exports.ProtocolHandler = ProtocolHandler; //# sourceMappingURL=protocol.js.map
}),
"[project]/dawg-ai/node_modules/nats/lib/nats-base-client/types.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Empty = exports.NatsError = void 0;
var core_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/core.js [app-ssr] (ecmascript)");
Object.defineProperty(exports, "NatsError", {
    enumerable: true,
    get: function() {
        return core_1.NatsError;
    }
});
var encoders_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/encoders.js [app-ssr] (ecmascript)");
Object.defineProperty(exports, "Empty", {
    enumerable: true,
    get: function() {
        return encoders_1.Empty;
    }
}); //# sourceMappingURL=types.js.map
}),
"[project]/dawg-ai/node_modules/nats/lib/nats-base-client/request.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.RequestOne = exports.RequestMany = exports.BaseRequest = void 0;
/*
 * Copyright 2020-2023 The NATS Authors
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
 */ const util_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/util.js [app-ssr] (ecmascript)");
const nuid_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/nuid.js [app-ssr] (ecmascript)");
const core_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/core.js [app-ssr] (ecmascript)");
class BaseRequest {
    constructor(mux, requestSubject, asyncTraces = true){
        this.mux = mux;
        this.requestSubject = requestSubject;
        this.received = 0;
        this.token = nuid_1.nuid.next();
        if (asyncTraces) {
            this.ctx = new Error();
        }
    }
}
exports.BaseRequest = BaseRequest;
/**
 * Request expects multiple message response
 * the request ends when the timer expires,
 * an error arrives or an expected count of messages
 * arrives, end is signaled by a null message
 */ class RequestMany extends BaseRequest {
    constructor(mux, requestSubject, opts = {
        maxWait: 1000
    }){
        super(mux, requestSubject);
        this.opts = opts;
        if (typeof this.opts.callback !== "function") {
            throw new Error("callback is required");
        }
        this.callback = this.opts.callback;
        this.max = typeof opts.maxMessages === "number" && opts.maxMessages > 0 ? opts.maxMessages : -1;
        this.done = (0, util_1.deferred)();
        this.done.then(()=>{
            this.callback(null, null);
        });
        // @ts-ignore: node is not a number
        this.timer = setTimeout(()=>{
            this.cancel();
        }, opts.maxWait);
    }
    cancel(err) {
        if (err) {
            this.callback(err, null);
        }
        clearTimeout(this.timer);
        this.mux.cancel(this);
        this.done.resolve();
    }
    resolver(err, msg) {
        if (err) {
            if (this.ctx) {
                err.stack += `\n\n${this.ctx.stack}`;
            }
            this.cancel(err);
        } else {
            this.callback(null, msg);
            if (this.opts.strategy === core_1.RequestStrategy.Count) {
                this.max--;
                if (this.max === 0) {
                    this.cancel();
                }
            }
            if (this.opts.strategy === core_1.RequestStrategy.JitterTimer) {
                clearTimeout(this.timer);
                // @ts-ignore: node is not a number
                this.timer = setTimeout(()=>{
                    this.cancel();
                }, this.opts.jitter || 300);
            }
            if (this.opts.strategy === core_1.RequestStrategy.SentinelMsg) {
                if (msg && msg.data.length === 0) {
                    this.cancel();
                }
            }
        }
    }
}
exports.RequestMany = RequestMany;
class RequestOne extends BaseRequest {
    constructor(mux, requestSubject, opts = {
        timeout: 1000
    }, asyncTraces = true){
        super(mux, requestSubject, asyncTraces);
        // extend(this, opts);
        this.deferred = (0, util_1.deferred)();
        this.timer = (0, util_1.timeout)(opts.timeout, asyncTraces);
    }
    resolver(err, msg) {
        if (this.timer) {
            this.timer.cancel();
        }
        if (err) {
            if (this.ctx) {
                err.stack += `\n\n${this.ctx.stack}`;
            }
            this.deferred.reject(err);
        } else {
            this.deferred.resolve(msg);
        }
        this.cancel();
    }
    cancel(err) {
        if (this.timer) {
            this.timer.cancel();
        }
        this.mux.cancel(this);
        this.deferred.reject(err ? err : core_1.NatsError.errorForCode(core_1.ErrorCode.Cancelled));
    }
}
exports.RequestOne = RequestOne; //# sourceMappingURL=request.js.map
}),
"[project]/dawg-ai/node_modules/nats/lib/jetstream/jsutil.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Js409Errors = void 0;
exports.validateDurableName = validateDurableName;
exports.validateStreamName = validateStreamName;
exports.minValidation = minValidation;
exports.validateName = validateName;
exports.validName = validName;
exports.isFlowControlMsg = isFlowControlMsg;
exports.isHeartbeatMsg = isHeartbeatMsg;
exports.newJsErrorMsg = newJsErrorMsg;
exports.checkJsError = checkJsError;
exports.setMaxWaitingToFail = setMaxWaitingToFail;
exports.isTerminal409 = isTerminal409;
exports.checkJsErrorCode = checkJsErrorCode;
/*
 * Copyright 2021-2024 The NATS Authors
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
 */ const encoders_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/encoders.js [app-ssr] (ecmascript)");
const headers_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/headers.js [app-ssr] (ecmascript)");
const msg_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/msg.js [app-ssr] (ecmascript)");
const core_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/core.js [app-ssr] (ecmascript)");
function validateDurableName(name) {
    return minValidation("durable", name);
}
function validateStreamName(name) {
    return minValidation("stream", name);
}
function minValidation(context, name = "") {
    // minimum validation on streams/consumers matches nats cli
    if (name === "") {
        throw Error(`${context} name required`);
    }
    const bad = [
        ".",
        "*",
        ">",
        "/",
        "\\",
        " ",
        "\t",
        "\n",
        "\r"
    ];
    bad.forEach((v)=>{
        if (name.indexOf(v) !== -1) {
            // make the error have a meaningful character
            switch(v){
                case "\n":
                    v = "\\n";
                    break;
                case "\r":
                    v = "\\r";
                    break;
                case "\t":
                    v = "\\t";
                    break;
                default:
            }
            throw Error(`invalid ${context} name - ${context} name cannot contain '${v}'`);
        }
    });
    return "";
}
function validateName(context, name = "") {
    if (name === "") {
        throw Error(`${context} name required`);
    }
    const m = validName(name);
    if (m.length) {
        throw new Error(`invalid ${context} name - ${context} name ${m}`);
    }
}
function validName(name = "") {
    if (name === "") {
        throw Error(`name required`);
    }
    const RE = /^[-\w]+$/g;
    const m = name.match(RE);
    if (m === null) {
        for (const c of name.split("")){
            const mm = c.match(RE);
            if (mm === null) {
                return `cannot contain '${c}'`;
            }
        }
    }
    return "";
}
/**
 * Returns true if the message is a flow control message
 * @param msg
 */ function isFlowControlMsg(msg) {
    if (msg.data.length > 0) {
        return false;
    }
    const h = msg.headers;
    if (!h) {
        return false;
    }
    return h.code >= 100 && h.code < 200;
}
/**
 * Returns true if the message is a heart beat message
 * @param msg
 */ function isHeartbeatMsg(msg) {
    var _a;
    return isFlowControlMsg(msg) && ((_a = msg.headers) === null || _a === void 0 ? void 0 : _a.description) === "Idle Heartbeat";
}
function newJsErrorMsg(code, description, subject) {
    const h = (0, headers_1.headers)(code, description);
    const arg = {
        hdr: 1,
        sid: 0,
        size: 0
    };
    const msg = new msg_1.MsgImpl(arg, encoders_1.Empty, {});
    msg._headers = h;
    msg._subject = subject;
    return msg;
}
function checkJsError(msg) {
    // JS error only if no payload - otherwise assume it is application data
    if (msg.data.length !== 0) {
        return null;
    }
    const h = msg.headers;
    if (!h) {
        return null;
    }
    return checkJsErrorCode(h.code, h.description);
}
var Js409Errors;
(function(Js409Errors) {
    Js409Errors["MaxBatchExceeded"] = "exceeded maxrequestbatch of";
    Js409Errors["MaxExpiresExceeded"] = "exceeded maxrequestexpires of";
    Js409Errors["MaxBytesExceeded"] = "exceeded maxrequestmaxbytes of";
    Js409Errors["MaxMessageSizeExceeded"] = "message size exceeds maxbytes";
    Js409Errors["PushConsumer"] = "consumer is push based";
    Js409Errors["MaxWaitingExceeded"] = "exceeded maxwaiting";
    Js409Errors["IdleHeartbeatMissed"] = "idle heartbeats missed";
    Js409Errors["ConsumerDeleted"] = "consumer deleted";
// FIXME: consumer deleted - instead of no responder (terminal error)
//   leadership changed -
})(Js409Errors || (exports.Js409Errors = Js409Errors = {}));
let MAX_WAITING_FAIL = false;
function setMaxWaitingToFail(tf) {
    MAX_WAITING_FAIL = tf;
}
function isTerminal409(err) {
    if (err.code !== core_1.ErrorCode.JetStream409) {
        return false;
    }
    const fatal = [
        Js409Errors.MaxBatchExceeded,
        Js409Errors.MaxExpiresExceeded,
        Js409Errors.MaxBytesExceeded,
        Js409Errors.MaxMessageSizeExceeded,
        Js409Errors.PushConsumer,
        Js409Errors.IdleHeartbeatMissed,
        Js409Errors.ConsumerDeleted
    ];
    if (MAX_WAITING_FAIL) {
        fatal.push(Js409Errors.MaxWaitingExceeded);
    }
    return fatal.find((s)=>{
        return err.message.indexOf(s) !== -1;
    }) !== undefined;
}
function checkJsErrorCode(code, description = "") {
    if (code < 300) {
        return null;
    }
    description = description.toLowerCase();
    switch(code){
        case 404:
            // 404 for jetstream will provide different messages ensure we
            // keep whatever the server returned
            return new core_1.NatsError(description, core_1.ErrorCode.JetStream404NoMessages);
        case 408:
            return new core_1.NatsError(description, core_1.ErrorCode.JetStream408RequestTimeout);
        case 409:
            {
                // the description can be exceeded max waiting or max ack pending, which are
                // recoverable, but can also be terminal errors where the request exceeds
                // some value in the consumer configuration
                const ec = description.startsWith(Js409Errors.IdleHeartbeatMissed) ? core_1.ErrorCode.JetStreamIdleHeartBeat : core_1.ErrorCode.JetStream409;
                return new core_1.NatsError(description, ec);
            }
        case 503:
            return core_1.NatsError.errorForCode(core_1.ErrorCode.JetStreamNotEnabled, new Error(description));
        default:
            if (description === "") {
                description = core_1.ErrorCode.Unknown;
            }
            return new core_1.NatsError(description, `${code}`);
    }
} //# sourceMappingURL=jsutil.js.map
}),
"[project]/dawg-ai/node_modules/nats/lib/jetstream/jsbaseclient_api.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

/*
 * Copyright 2021-2023 The NATS Authors
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
 */ var __awaiter = /*TURBOPACK member replacement*/ __turbopack_context__.e && /*TURBOPACK member replacement*/ __turbopack_context__.e.__awaiter || function(thisArg, _arguments, P, generator) {
    function adopt(value) {
        return value instanceof P ? value : new P(function(resolve) {
            resolve(value);
        });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
        function fulfilled(value) {
            try {
                step(generator.next(value));
            } catch (e) {
                reject(e);
            }
        }
        function rejected(value) {
            try {
                step(generator["throw"](value));
            } catch (e) {
                reject(e);
            }
        }
        function step(result) {
            result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.BaseApiClient = void 0;
exports.defaultJsOptions = defaultJsOptions;
const encoders_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/encoders.js [app-ssr] (ecmascript)");
const codec_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/codec.js [app-ssr] (ecmascript)");
const util_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/util.js [app-ssr] (ecmascript)");
const jsutil_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/jetstream/jsutil.js [app-ssr] (ecmascript)");
const core_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/core.js [app-ssr] (ecmascript)");
const defaultPrefix = "$JS.API";
const defaultTimeout = 5000;
function defaultJsOptions(opts) {
    opts = opts || {};
    if (opts.domain) {
        opts.apiPrefix = `$JS.${opts.domain}.API`;
        delete opts.domain;
    }
    return (0, util_1.extend)({
        apiPrefix: defaultPrefix,
        timeout: defaultTimeout
    }, opts);
}
class BaseApiClient {
    constructor(nc, opts){
        this.nc = nc;
        this.opts = defaultJsOptions(opts);
        this._parseOpts();
        this.prefix = this.opts.apiPrefix;
        this.timeout = this.opts.timeout;
        this.jc = (0, codec_1.JSONCodec)();
    }
    getOptions() {
        return Object.assign({}, this.opts);
    }
    _parseOpts() {
        let prefix = this.opts.apiPrefix;
        if (!prefix || prefix.length === 0) {
            throw new Error("invalid empty prefix");
        }
        const c = prefix[prefix.length - 1];
        if (c === ".") {
            prefix = prefix.substr(0, prefix.length - 1);
        }
        this.opts.apiPrefix = prefix;
    }
    _request(subj_1) {
        return __awaiter(this, arguments, void 0, function*(subj, data = null, opts) {
            opts = opts || {};
            opts.timeout = this.timeout;
            let a = encoders_1.Empty;
            if (data) {
                a = this.jc.encode(data);
            }
            let { retries } = opts;
            retries = retries || 1;
            retries = retries === -1 ? Number.MAX_SAFE_INTEGER : retries;
            const bo = (0, util_1.backoff)();
            for(let i = 0; i < retries; i++){
                try {
                    const m = yield this.nc.request(subj, a, opts);
                    return this.parseJsResponse(m);
                } catch (err) {
                    const ne = err;
                    if ((ne.code === "503" || ne.code === core_1.ErrorCode.Timeout) && i + 1 < retries) {
                        yield (0, util_1.delay)(bo.backoff(i));
                    } else {
                        throw err;
                    }
                }
            }
        });
    }
    findStream(subject) {
        return __awaiter(this, void 0, void 0, function*() {
            const q = {
                subject
            };
            const r = yield this._request(`${this.prefix}.STREAM.NAMES`, q);
            const names = r;
            if (!names.streams || names.streams.length !== 1) {
                throw new Error("no stream matches subject");
            }
            return names.streams[0];
        });
    }
    getConnection() {
        return this.nc;
    }
    parseJsResponse(m) {
        const v = this.jc.decode(m.data);
        const r = v;
        if (r.error) {
            const err = (0, jsutil_1.checkJsErrorCode)(r.error.code, r.error.description);
            if (err !== null) {
                err.api_error = r.error;
                throw err;
            }
        }
        return v;
    }
}
exports.BaseApiClient = BaseApiClient; //# sourceMappingURL=jsbaseclient_api.js.map
}),
"[project]/dawg-ai/node_modules/nats/lib/jetstream/jslister.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __awaiter = /*TURBOPACK member replacement*/ __turbopack_context__.e && /*TURBOPACK member replacement*/ __turbopack_context__.e.__awaiter || function(thisArg, _arguments, P, generator) {
    function adopt(value) {
        return value instanceof P ? value : new P(function(resolve) {
            resolve(value);
        });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
        function fulfilled(value) {
            try {
                step(generator.next(value));
            } catch (e) {
                reject(e);
            }
        }
        function rejected(value) {
            try {
                step(generator["throw"](value));
            } catch (e) {
                reject(e);
            }
        }
        function step(result) {
            result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __await = /*TURBOPACK member replacement*/ __turbopack_context__.e && /*TURBOPACK member replacement*/ __turbopack_context__.e.__await || function(v) {
    return this instanceof __await ? (this.v = v, this) : new __await(v);
};
var __asyncGenerator = /*TURBOPACK member replacement*/ __turbopack_context__.e && /*TURBOPACK member replacement*/ __turbopack_context__.e.__asyncGenerator || function(thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = Object.create((typeof AsyncIterator === "function" ? AsyncIterator : Object).prototype), verb("next"), verb("throw"), verb("return", awaitReturn), i[Symbol.asyncIterator] = function() {
        return this;
    }, i;
    //TURBOPACK unreachable
    ;
    function awaitReturn(f) {
        return function(v) {
            return Promise.resolve(v).then(f, reject);
        };
    }
    function verb(n, f) {
        if (g[n]) {
            i[n] = function(v) {
                return new Promise(function(a, b) {
                    q.push([
                        n,
                        v,
                        a,
                        b
                    ]) > 1 || resume(n, v);
                });
            };
            if (f) i[n] = f(i[n]);
        }
    }
    function resume(n, v) {
        try {
            step(g[n](v));
        } catch (e) {
            settle(q[0][3], e);
        }
    }
    function step(r) {
        r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r);
    }
    function fulfill(value) {
        resume("next", value);
    }
    function reject(value) {
        resume("throw", value);
    }
    function settle(f, v) {
        if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]);
    }
};
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ListerImpl = void 0;
class ListerImpl {
    constructor(subject, filter, jsm, payload){
        if (!subject) {
            throw new Error("subject is required");
        }
        this.subject = subject;
        this.jsm = jsm;
        this.offset = 0;
        this.pageInfo = {};
        this.filter = filter;
        this.payload = payload || {};
    }
    next() {
        return __awaiter(this, void 0, void 0, function*() {
            if (this.err) {
                return [];
            }
            if (this.pageInfo && this.offset >= this.pageInfo.total) {
                return [];
            }
            const offset = {
                offset: this.offset
            };
            if (this.payload) {
                Object.assign(offset, this.payload);
            }
            try {
                const r = yield this.jsm._request(this.subject, offset, {
                    timeout: this.jsm.timeout
                });
                this.pageInfo = r;
                // offsets are reported in total, so need to count
                // all the entries returned
                const count = this.countResponse(r);
                if (count === 0) {
                    // we are done if we get a null set of infos
                    return [];
                }
                this.offset += count;
                const a = this.filter(r);
                return a;
            } catch (err) {
                this.err = err;
                throw err;
            }
        });
    }
    countResponse(r) {
        var _a, _b, _c;
        switch(r === null || r === void 0 ? void 0 : r.type){
            case "io.nats.jetstream.api.v1.stream_names_response":
            case "io.nats.jetstream.api.v1.stream_list_response":
                return ((_a = r.streams) === null || _a === void 0 ? void 0 : _a.length) || 0;
            case "io.nats.jetstream.api.v1.consumer_list_response":
                return ((_b = r.consumers) === null || _b === void 0 ? void 0 : _b.length) || 0;
            default:
                console.error(`jslister.ts: unknown API response for paged output: ${r === null || r === void 0 ? void 0 : r.type}`);
                // has to be a stream...
                return ((_c = r.streams) === null || _c === void 0 ? void 0 : _c.length) || 0;
        }
        return 0;
    }
    [Symbol.asyncIterator]() {
        return __asyncGenerator(this, arguments, function* _a() {
            let page = yield __await(this.next());
            while(page.length > 0){
                for (const item of page){
                    yield yield __await(item);
                }
                page = yield __await(this.next());
            }
        });
    }
}
exports.ListerImpl = ListerImpl; //# sourceMappingURL=jslister.js.map
}),
"[project]/dawg-ai/node_modules/nats/lib/jetstream/jsapi_types.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

/*
 * Copyright 2023-2024 The NATS Authors
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
exports.ConsumerApiAction = exports.StoreCompression = exports.ReplayPolicy = exports.AckPolicy = exports.DeliverPolicy = exports.StorageType = exports.DiscardPolicy = exports.RetentionPolicy = void 0;
exports.defaultConsumer = defaultConsumer;
const util_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/util.js [app-ssr] (ecmascript)");
var RetentionPolicy;
(function(RetentionPolicy) {
    /**
     * Retain messages until the limits are reached, then trigger the discard policy.
     */ RetentionPolicy["Limits"] = "limits";
    /**
     * Retain messages while there is consumer interest on the particular subject.
     */ RetentionPolicy["Interest"] = "interest";
    /**
     * Retain messages until acknowledged
     */ RetentionPolicy["Workqueue"] = "workqueue";
})(RetentionPolicy || (exports.RetentionPolicy = RetentionPolicy = {}));
var DiscardPolicy;
(function(DiscardPolicy) {
    /**
     * Discard old messages to make room for the new ones
     */ DiscardPolicy["Old"] = "old";
    /**
     * Discard the new messages
     */ DiscardPolicy["New"] = "new";
})(DiscardPolicy || (exports.DiscardPolicy = DiscardPolicy = {}));
var StorageType;
(function(StorageType) {
    /**
     * Store persistently on files
     */ StorageType["File"] = "file";
    /**
     * Store in server memory - doesn't survive server restarts
     */ StorageType["Memory"] = "memory";
})(StorageType || (exports.StorageType = StorageType = {}));
var DeliverPolicy;
(function(DeliverPolicy) {
    /**
     * Deliver all messages
     */ DeliverPolicy["All"] = "all";
    /**
     * Deliver starting with the last message
     */ DeliverPolicy["Last"] = "last";
    /**
     * Deliver starting with new messages
     */ DeliverPolicy["New"] = "new";
    /**
     * Deliver starting with the specified sequence
     */ DeliverPolicy["StartSequence"] = "by_start_sequence";
    /**
     * Deliver starting with the specified time
     */ DeliverPolicy["StartTime"] = "by_start_time";
    /**
     * Deliver starting with the last messages for every subject
     */ DeliverPolicy["LastPerSubject"] = "last_per_subject";
})(DeliverPolicy || (exports.DeliverPolicy = DeliverPolicy = {}));
var AckPolicy;
(function(AckPolicy) {
    /**
     * Messages don't need to be Ack'ed.
     */ AckPolicy["None"] = "none";
    /**
     * Ack, acknowledges all messages with a lower sequence
     */ AckPolicy["All"] = "all";
    /**
     * All sequences must be explicitly acknowledged
     */ AckPolicy["Explicit"] = "explicit";
    /**
     * @ignore
     */ AckPolicy["NotSet"] = "";
})(AckPolicy || (exports.AckPolicy = AckPolicy = {}));
var ReplayPolicy;
(function(ReplayPolicy) {
    /**
     * Replays messages as fast as possible
     */ ReplayPolicy["Instant"] = "instant";
    /**
     * Replays messages following the original delay between messages
     */ ReplayPolicy["Original"] = "original";
})(ReplayPolicy || (exports.ReplayPolicy = ReplayPolicy = {}));
var StoreCompression;
(function(StoreCompression) {
    /**
     * No compression
     */ StoreCompression["None"] = "none";
    /**
     * S2 compression
     */ StoreCompression["S2"] = "s2";
})(StoreCompression || (exports.StoreCompression = StoreCompression = {}));
var ConsumerApiAction;
(function(ConsumerApiAction) {
    ConsumerApiAction["CreateOrUpdate"] = "";
    ConsumerApiAction["Update"] = "update";
    ConsumerApiAction["Create"] = "create";
})(ConsumerApiAction || (exports.ConsumerApiAction = ConsumerApiAction = {}));
function defaultConsumer(name, opts = {}) {
    return Object.assign({
        name: name,
        deliver_policy: DeliverPolicy.All,
        ack_policy: AckPolicy.Explicit,
        ack_wait: (0, util_1.nanos)(30 * 1000),
        replay_policy: ReplayPolicy.Instant
    }, opts);
} //# sourceMappingURL=jsapi_types.js.map
}),
"[project]/dawg-ai/node_modules/nats/lib/jetstream/types.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

/*
 * Copyright 2023-2024 The NATS Authors
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
exports.ConsumerOptsBuilderImpl = exports.kvPrefix = exports.RepublishHeaders = exports.DirectMsgHeaders = exports.KvWatchInclude = exports.JsHeaders = exports.AdvisoryKind = void 0;
exports.consumerOpts = consumerOpts;
exports.isConsumerOptsBuilder = isConsumerOptsBuilder;
const jsapi_types_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/jetstream/jsapi_types.js [app-ssr] (ecmascript)");
const jsutil_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/jetstream/jsutil.js [app-ssr] (ecmascript)");
const util_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/util.js [app-ssr] (ecmascript)");
/**
 * The different kinds of Advisories
 */ var AdvisoryKind;
(function(AdvisoryKind) {
    AdvisoryKind["API"] = "api_audit";
    AdvisoryKind["StreamAction"] = "stream_action";
    AdvisoryKind["ConsumerAction"] = "consumer_action";
    AdvisoryKind["SnapshotCreate"] = "snapshot_create";
    AdvisoryKind["SnapshotComplete"] = "snapshot_complete";
    AdvisoryKind["RestoreCreate"] = "restore_create";
    AdvisoryKind["RestoreComplete"] = "restore_complete";
    AdvisoryKind["MaxDeliver"] = "max_deliver";
    AdvisoryKind["Terminated"] = "terminated";
    AdvisoryKind["Ack"] = "consumer_ack";
    AdvisoryKind["StreamLeaderElected"] = "stream_leader_elected";
    AdvisoryKind["StreamQuorumLost"] = "stream_quorum_lost";
    AdvisoryKind["ConsumerLeaderElected"] = "consumer_leader_elected";
    AdvisoryKind["ConsumerQuorumLost"] = "consumer_quorum_lost";
})(AdvisoryKind || (exports.AdvisoryKind = AdvisoryKind = {}));
var JsHeaders;
(function(JsHeaders) {
    /**
     * Set if message is from a stream source - format is `stream seq`
     */ JsHeaders["StreamSourceHdr"] = "Nats-Stream-Source";
    /**
     * Set for heartbeat messages
     */ JsHeaders["LastConsumerSeqHdr"] = "Nats-Last-Consumer";
    /**
     * Set for heartbeat messages
     */ JsHeaders["LastStreamSeqHdr"] = "Nats-Last-Stream";
    /**
     * Set for heartbeat messages if the consumer is stalled
     */ JsHeaders["ConsumerStalledHdr"] = "Nats-Consumer-Stalled";
    /**
     * Set for headers_only consumers indicates the number of bytes in the payload
     */ JsHeaders["MessageSizeHdr"] = "Nats-Msg-Size";
    // rollup header
    JsHeaders["RollupHdr"] = "Nats-Rollup";
    // value for rollup header when rolling up a subject
    JsHeaders["RollupValueSubject"] = "sub";
    // value for rollup header when rolling up all subjects
    JsHeaders["RollupValueAll"] = "all";
    /**
     * Set on protocol messages to indicate pull request message count that
     * was not honored.
     */ JsHeaders["PendingMessagesHdr"] = "Nats-Pending-Messages";
    /**
     * Set on protocol messages to indicate pull request byte count that
     * was not honored
     */ JsHeaders["PendingBytesHdr"] = "Nats-Pending-Bytes";
})(JsHeaders || (exports.JsHeaders = JsHeaders = {}));
var KvWatchInclude;
(function(KvWatchInclude) {
    /**
     * Include the last value for all the keys
     */ KvWatchInclude["LastValue"] = "";
    /**
     * Include all available history for all keys
     */ KvWatchInclude["AllHistory"] = "history";
    /**
     * Don't include history or last values, only notify
     * of updates
     */ KvWatchInclude["UpdatesOnly"] = "updates";
})(KvWatchInclude || (exports.KvWatchInclude = KvWatchInclude = {}));
var DirectMsgHeaders;
(function(DirectMsgHeaders) {
    DirectMsgHeaders["Stream"] = "Nats-Stream";
    DirectMsgHeaders["Sequence"] = "Nats-Sequence";
    DirectMsgHeaders["TimeStamp"] = "Nats-Time-Stamp";
    DirectMsgHeaders["Subject"] = "Nats-Subject";
})(DirectMsgHeaders || (exports.DirectMsgHeaders = DirectMsgHeaders = {}));
var RepublishHeaders;
(function(RepublishHeaders) {
    /**
     * The source stream of the message
     */ RepublishHeaders["Stream"] = "Nats-Stream";
    /**
     * The original subject of the message
     */ RepublishHeaders["Subject"] = "Nats-Subject";
    /**
     * The sequence of the republished message
     */ RepublishHeaders["Sequence"] = "Nats-Sequence";
    /**
     * The stream sequence id of the last message ingested to the same original subject (or 0 if none or deleted)
     */ RepublishHeaders["LastSequence"] = "Nats-Last-Sequence";
    /**
     * The size in bytes of the message's body - Only if {@link Republish#headers_only} is set.
     */ RepublishHeaders["Size"] = "Nats-Msg-Size";
})(RepublishHeaders || (exports.RepublishHeaders = RepublishHeaders = {}));
exports.kvPrefix = "KV_";
// FIXME: some items here that may need to be addressed
// 503s?
// maxRetries()
// retryBackoff()
// ackWait(time)
// replayOriginal()
// rateLimit(bytesPerSec)
class ConsumerOptsBuilderImpl {
    constructor(opts){
        this.stream = "";
        this.mack = false;
        this.ordered = false;
        this.config = (0, jsapi_types_1.defaultConsumer)("", opts || {});
    }
    getOpts() {
        var _a;
        const o = {};
        o.config = Object.assign({}, this.config);
        if (o.config.filter_subject) {
            this.filterSubject(o.config.filter_subject);
            o.config.filter_subject = undefined;
        }
        if (o.config.filter_subjects) {
            (_a = o.config.filter_subjects) === null || _a === void 0 ? void 0 : _a.forEach((v)=>{
                this.filterSubject(v);
            });
            o.config.filter_subjects = undefined;
        }
        o.mack = this.mack;
        o.stream = this.stream;
        o.callbackFn = this.callbackFn;
        o.max = this.max;
        o.queue = this.qname;
        o.ordered = this.ordered;
        o.config.ack_policy = o.ordered ? jsapi_types_1.AckPolicy.None : o.config.ack_policy;
        o.isBind = o.isBind || false;
        if (this.filters) {
            switch(this.filters.length){
                case 0:
                    break;
                case 1:
                    o.config.filter_subject = this.filters[0];
                    break;
                default:
                    o.config.filter_subjects = this.filters;
            }
        }
        return o;
    }
    description(description) {
        this.config.description = description;
        return this;
    }
    deliverTo(subject) {
        this.config.deliver_subject = subject;
        return this;
    }
    durable(name) {
        (0, jsutil_1.validateDurableName)(name);
        this.config.durable_name = name;
        return this;
    }
    startSequence(seq) {
        if (seq <= 0) {
            throw new Error("sequence must be greater than 0");
        }
        this.config.deliver_policy = jsapi_types_1.DeliverPolicy.StartSequence;
        this.config.opt_start_seq = seq;
        return this;
    }
    startTime(time) {
        this.config.deliver_policy = jsapi_types_1.DeliverPolicy.StartTime;
        this.config.opt_start_time = time.toISOString();
        return this;
    }
    deliverAll() {
        this.config.deliver_policy = jsapi_types_1.DeliverPolicy.All;
        return this;
    }
    deliverLastPerSubject() {
        this.config.deliver_policy = jsapi_types_1.DeliverPolicy.LastPerSubject;
        return this;
    }
    deliverLast() {
        this.config.deliver_policy = jsapi_types_1.DeliverPolicy.Last;
        return this;
    }
    deliverNew() {
        this.config.deliver_policy = jsapi_types_1.DeliverPolicy.New;
        return this;
    }
    startAtTimeDelta(millis) {
        this.startTime(new Date(Date.now() - millis));
        return this;
    }
    headersOnly() {
        this.config.headers_only = true;
        return this;
    }
    ackNone() {
        this.config.ack_policy = jsapi_types_1.AckPolicy.None;
        return this;
    }
    ackAll() {
        this.config.ack_policy = jsapi_types_1.AckPolicy.All;
        return this;
    }
    ackExplicit() {
        this.config.ack_policy = jsapi_types_1.AckPolicy.Explicit;
        return this;
    }
    ackWait(millis) {
        this.config.ack_wait = (0, util_1.nanos)(millis);
        return this;
    }
    maxDeliver(max) {
        this.config.max_deliver = max;
        return this;
    }
    filterSubject(s) {
        this.filters = this.filters || [];
        this.filters.push(s);
        return this;
    }
    replayInstantly() {
        this.config.replay_policy = jsapi_types_1.ReplayPolicy.Instant;
        return this;
    }
    replayOriginal() {
        this.config.replay_policy = jsapi_types_1.ReplayPolicy.Original;
        return this;
    }
    sample(n) {
        n = Math.trunc(n);
        if (n < 0 || n > 100) {
            throw new Error(`value must be between 0-100`);
        }
        this.config.sample_freq = `${n}%`;
        return this;
    }
    limit(n) {
        this.config.rate_limit_bps = n;
        return this;
    }
    maxWaiting(max) {
        this.config.max_waiting = max;
        return this;
    }
    maxAckPending(max) {
        this.config.max_ack_pending = max;
        return this;
    }
    idleHeartbeat(millis) {
        this.config.idle_heartbeat = (0, util_1.nanos)(millis);
        return this;
    }
    flowControl() {
        this.config.flow_control = true;
        return this;
    }
    deliverGroup(name) {
        this.queue(name);
        return this;
    }
    manualAck() {
        this.mack = true;
        return this;
    }
    maxMessages(max) {
        this.max = max;
        return this;
    }
    callback(fn) {
        this.callbackFn = fn;
        return this;
    }
    queue(n) {
        this.qname = n;
        this.config.deliver_group = n;
        return this;
    }
    orderedConsumer() {
        this.ordered = true;
        return this;
    }
    bind(stream, durable) {
        this.stream = stream;
        this.config.durable_name = durable;
        this.isBind = true;
        return this;
    }
    bindStream(stream) {
        this.stream = stream;
        return this;
    }
    inactiveEphemeralThreshold(millis) {
        this.config.inactive_threshold = (0, util_1.nanos)(millis);
        return this;
    }
    maxPullBatch(n) {
        this.config.max_batch = n;
        return this;
    }
    maxPullRequestExpires(millis) {
        this.config.max_expires = (0, util_1.nanos)(millis);
        return this;
    }
    memory() {
        this.config.mem_storage = true;
        return this;
    }
    numReplicas(n) {
        this.config.num_replicas = n;
        return this;
    }
    consumerName(n) {
        this.config.name = n;
        return this;
    }
}
exports.ConsumerOptsBuilderImpl = ConsumerOptsBuilderImpl;
function consumerOpts(opts) {
    return new ConsumerOptsBuilderImpl(opts);
}
function isConsumerOptsBuilder(o) {
    return typeof o.getOpts === "function";
} //# sourceMappingURL=types.js.map
}),
"[project]/dawg-ai/node_modules/nats/lib/jetstream/jsmconsumer_api.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __awaiter = /*TURBOPACK member replacement*/ __turbopack_context__.e && /*TURBOPACK member replacement*/ __turbopack_context__.e.__awaiter || function(thisArg, _arguments, P, generator) {
    function adopt(value) {
        return value instanceof P ? value : new P(function(resolve) {
            resolve(value);
        });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
        function fulfilled(value) {
            try {
                step(generator.next(value));
            } catch (e) {
                reject(e);
            }
        }
        function rejected(value) {
            try {
                step(generator["throw"](value));
            } catch (e) {
                reject(e);
            }
        }
        function step(result) {
            result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ConsumerAPIImpl = void 0;
/*
 * Copyright 2021-2023 The NATS Authors
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
 */ const jsbaseclient_api_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/jetstream/jsbaseclient_api.js [app-ssr] (ecmascript)");
const jslister_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/jetstream/jslister.js [app-ssr] (ecmascript)");
const jsutil_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/jetstream/jsutil.js [app-ssr] (ecmascript)");
const semver_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/semver.js [app-ssr] (ecmascript)");
const jsapi_types_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/jetstream/jsapi_types.js [app-ssr] (ecmascript)");
class ConsumerAPIImpl extends jsbaseclient_api_1.BaseApiClient {
    constructor(nc, opts){
        super(nc, opts);
    }
    add(stream_1, cfg_1) {
        return __awaiter(this, arguments, void 0, function*(stream, cfg, action = jsapi_types_1.ConsumerApiAction.Create) {
            var _a, _b, _c;
            (0, jsutil_1.validateStreamName)(stream);
            if (cfg.deliver_group && cfg.flow_control) {
                throw new Error("jetstream flow control is not supported with queue groups");
            }
            if (cfg.deliver_group && cfg.idle_heartbeat) {
                throw new Error("jetstream idle heartbeat is not supported with queue groups");
            }
            const cr = {};
            cr.config = cfg;
            cr.stream_name = stream;
            cr.action = action;
            if (cr.config.durable_name) {
                (0, jsutil_1.validateDurableName)(cr.config.durable_name);
            }
            const nci = this.nc;
            let { min, ok: newAPI } = nci.features.get(semver_1.Feature.JS_NEW_CONSUMER_CREATE_API);
            const name = cfg.name === "" ? undefined : cfg.name;
            if (name && !newAPI) {
                throw new Error(`consumer 'name' requires server ${min}`);
            }
            if (name) {
                try {
                    (0, jsutil_1.minValidation)("name", name);
                } catch (err) {
                    // if we have a cannot contain the message, massage a bit
                    const m = err.message;
                    const idx = m.indexOf("cannot contain");
                    if (idx !== -1) {
                        throw new Error(`consumer 'name' ${m.substring(idx)}`);
                    }
                    throw err;
                }
            }
            let subj;
            let consumerName = "";
            // new api doesn't support multiple filter subjects
            // this delayed until here because the consumer in an update could have
            // been created with the new API, and have a `name`
            if (Array.isArray(cfg.filter_subjects)) {
                const { min, ok } = nci.features.get(semver_1.Feature.JS_MULTIPLE_CONSUMER_FILTER);
                if (!ok) {
                    throw new Error(`consumer 'filter_subjects' requires server ${min}`);
                }
                newAPI = false;
            }
            if (cfg.metadata) {
                const { min, ok } = nci.features.get(semver_1.Feature.JS_STREAM_CONSUMER_METADATA);
                if (!ok) {
                    throw new Error(`consumer 'metadata' requires server ${min}`);
                }
            }
            if (newAPI) {
                consumerName = (_b = (_a = cfg.name) !== null && _a !== void 0 ? _a : cfg.durable_name) !== null && _b !== void 0 ? _b : "";
            }
            if (consumerName !== "") {
                let fs = (_c = cfg.filter_subject) !== null && _c !== void 0 ? _c : undefined;
                if (fs === ">") {
                    fs = undefined;
                }
                subj = fs !== undefined ? `${this.prefix}.CONSUMER.CREATE.${stream}.${consumerName}.${fs}` : `${this.prefix}.CONSUMER.CREATE.${stream}.${consumerName}`;
            } else {
                subj = cfg.durable_name ? `${this.prefix}.CONSUMER.DURABLE.CREATE.${stream}.${cfg.durable_name}` : `${this.prefix}.CONSUMER.CREATE.${stream}`;
            }
            const r = yield this._request(subj, cr);
            return r;
        });
    }
    update(stream, durable, cfg) {
        return __awaiter(this, void 0, void 0, function*() {
            const ci = yield this.info(stream, durable);
            const changable = cfg;
            return this.add(stream, Object.assign(ci.config, changable), jsapi_types_1.ConsumerApiAction.Update);
        });
    }
    info(stream, name) {
        return __awaiter(this, void 0, void 0, function*() {
            (0, jsutil_1.validateStreamName)(stream);
            (0, jsutil_1.validateDurableName)(name);
            const r = yield this._request(`${this.prefix}.CONSUMER.INFO.${stream}.${name}`);
            return r;
        });
    }
    delete(stream, name) {
        return __awaiter(this, void 0, void 0, function*() {
            (0, jsutil_1.validateStreamName)(stream);
            (0, jsutil_1.validateDurableName)(name);
            const r = yield this._request(`${this.prefix}.CONSUMER.DELETE.${stream}.${name}`);
            const cr = r;
            return cr.success;
        });
    }
    list(stream) {
        (0, jsutil_1.validateStreamName)(stream);
        const filter = (v)=>{
            const clr = v;
            return clr.consumers;
        };
        const subj = `${this.prefix}.CONSUMER.LIST.${stream}`;
        return new jslister_1.ListerImpl(subj, filter, this);
    }
    pause(stream, name, until) {
        const subj = `${this.prefix}.CONSUMER.PAUSE.${stream}.${name}`;
        const opts = {
            pause_until: until.toISOString()
        };
        return this._request(subj, opts);
    }
    resume(stream, name) {
        return this.pause(stream, name, new Date(0));
    }
}
exports.ConsumerAPIImpl = ConsumerAPIImpl; //# sourceMappingURL=jsmconsumer_api.js.map
}),
"[project]/dawg-ai/node_modules/nats/lib/nats-base-client/mod.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.usernamePasswordAuthenticator = exports.tokenAuthenticator = exports.syncIterator = exports.StringCodec = exports.ServiceVerb = exports.ServiceResponseType = exports.ServiceErrorHeader = exports.ServiceErrorCodeHeader = exports.ServiceError = exports.RequestStrategy = exports.nuid = exports.Nuid = exports.nkeys = exports.nkeyAuthenticator = exports.NatsError = exports.nanos = exports.MsgHdrsImpl = exports.millis = exports.Metric = exports.Match = exports.jwtAuthenticator = exports.JSONCodec = exports.headers = exports.Events = exports.ErrorCode = exports.Empty = exports.delay = exports.deferred = exports.DebugEvents = exports.deadline = exports.credsAuthenticator = exports.createInbox = exports.canonicalMIMEHeaderKey = exports.buildAuthenticator = exports.Bench = exports.backoff = void 0;
var internal_mod_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/internal_mod.js [app-ssr] (ecmascript)");
Object.defineProperty(exports, "backoff", {
    enumerable: true,
    get: function() {
        return internal_mod_1.backoff;
    }
});
Object.defineProperty(exports, "Bench", {
    enumerable: true,
    get: function() {
        return internal_mod_1.Bench;
    }
});
Object.defineProperty(exports, "buildAuthenticator", {
    enumerable: true,
    get: function() {
        return internal_mod_1.buildAuthenticator;
    }
});
Object.defineProperty(exports, "canonicalMIMEHeaderKey", {
    enumerable: true,
    get: function() {
        return internal_mod_1.canonicalMIMEHeaderKey;
    }
});
Object.defineProperty(exports, "createInbox", {
    enumerable: true,
    get: function() {
        return internal_mod_1.createInbox;
    }
});
Object.defineProperty(exports, "credsAuthenticator", {
    enumerable: true,
    get: function() {
        return internal_mod_1.credsAuthenticator;
    }
});
Object.defineProperty(exports, "deadline", {
    enumerable: true,
    get: function() {
        return internal_mod_1.deadline;
    }
});
Object.defineProperty(exports, "DebugEvents", {
    enumerable: true,
    get: function() {
        return internal_mod_1.DebugEvents;
    }
});
Object.defineProperty(exports, "deferred", {
    enumerable: true,
    get: function() {
        return internal_mod_1.deferred;
    }
});
Object.defineProperty(exports, "delay", {
    enumerable: true,
    get: function() {
        return internal_mod_1.delay;
    }
});
Object.defineProperty(exports, "Empty", {
    enumerable: true,
    get: function() {
        return internal_mod_1.Empty;
    }
});
Object.defineProperty(exports, "ErrorCode", {
    enumerable: true,
    get: function() {
        return internal_mod_1.ErrorCode;
    }
});
Object.defineProperty(exports, "Events", {
    enumerable: true,
    get: function() {
        return internal_mod_1.Events;
    }
});
Object.defineProperty(exports, "headers", {
    enumerable: true,
    get: function() {
        return internal_mod_1.headers;
    }
});
Object.defineProperty(exports, "JSONCodec", {
    enumerable: true,
    get: function() {
        return internal_mod_1.JSONCodec;
    }
});
Object.defineProperty(exports, "jwtAuthenticator", {
    enumerable: true,
    get: function() {
        return internal_mod_1.jwtAuthenticator;
    }
});
Object.defineProperty(exports, "Match", {
    enumerable: true,
    get: function() {
        return internal_mod_1.Match;
    }
});
Object.defineProperty(exports, "Metric", {
    enumerable: true,
    get: function() {
        return internal_mod_1.Metric;
    }
});
Object.defineProperty(exports, "millis", {
    enumerable: true,
    get: function() {
        return internal_mod_1.millis;
    }
});
Object.defineProperty(exports, "MsgHdrsImpl", {
    enumerable: true,
    get: function() {
        return internal_mod_1.MsgHdrsImpl;
    }
});
Object.defineProperty(exports, "nanos", {
    enumerable: true,
    get: function() {
        return internal_mod_1.nanos;
    }
});
Object.defineProperty(exports, "NatsError", {
    enumerable: true,
    get: function() {
        return internal_mod_1.NatsError;
    }
});
Object.defineProperty(exports, "nkeyAuthenticator", {
    enumerable: true,
    get: function() {
        return internal_mod_1.nkeyAuthenticator;
    }
});
Object.defineProperty(exports, "nkeys", {
    enumerable: true,
    get: function() {
        return internal_mod_1.nkeys;
    }
});
Object.defineProperty(exports, "Nuid", {
    enumerable: true,
    get: function() {
        return internal_mod_1.Nuid;
    }
});
Object.defineProperty(exports, "nuid", {
    enumerable: true,
    get: function() {
        return internal_mod_1.nuid;
    }
});
Object.defineProperty(exports, "RequestStrategy", {
    enumerable: true,
    get: function() {
        return internal_mod_1.RequestStrategy;
    }
});
Object.defineProperty(exports, "ServiceError", {
    enumerable: true,
    get: function() {
        return internal_mod_1.ServiceError;
    }
});
Object.defineProperty(exports, "ServiceErrorCodeHeader", {
    enumerable: true,
    get: function() {
        return internal_mod_1.ServiceErrorCodeHeader;
    }
});
Object.defineProperty(exports, "ServiceErrorHeader", {
    enumerable: true,
    get: function() {
        return internal_mod_1.ServiceErrorHeader;
    }
});
Object.defineProperty(exports, "ServiceResponseType", {
    enumerable: true,
    get: function() {
        return internal_mod_1.ServiceResponseType;
    }
});
Object.defineProperty(exports, "ServiceVerb", {
    enumerable: true,
    get: function() {
        return internal_mod_1.ServiceVerb;
    }
});
Object.defineProperty(exports, "StringCodec", {
    enumerable: true,
    get: function() {
        return internal_mod_1.StringCodec;
    }
});
Object.defineProperty(exports, "syncIterator", {
    enumerable: true,
    get: function() {
        return internal_mod_1.syncIterator;
    }
});
Object.defineProperty(exports, "tokenAuthenticator", {
    enumerable: true,
    get: function() {
        return internal_mod_1.tokenAuthenticator;
    }
});
Object.defineProperty(exports, "usernamePasswordAuthenticator", {
    enumerable: true,
    get: function() {
        return internal_mod_1.usernamePasswordAuthenticator;
    }
}); //# sourceMappingURL=mod.js.map
}),
"[project]/dawg-ai/node_modules/nats/lib/jetstream/jsmsg.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __awaiter = /*TURBOPACK member replacement*/ __turbopack_context__.e && /*TURBOPACK member replacement*/ __turbopack_context__.e.__awaiter || function(thisArg, _arguments, P, generator) {
    function adopt(value) {
        return value instanceof P ? value : new P(function(resolve) {
            resolve(value);
        });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
        function fulfilled(value) {
            try {
                step(generator.next(value));
            } catch (e) {
                reject(e);
            }
        }
        function rejected(value) {
            try {
                step(generator["throw"](value));
            } catch (e) {
                reject(e);
            }
        }
        function step(result) {
            result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.JsMsgImpl = exports.ACK = void 0;
exports.toJsMsg = toJsMsg;
exports.parseInfo = parseInfo;
/*
 * Copyright 2021-2024 The NATS Authors
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
 */ const databuffer_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/databuffer.js [app-ssr] (ecmascript)");
const codec_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/codec.js [app-ssr] (ecmascript)");
const request_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/request.js [app-ssr] (ecmascript)");
const mod_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/mod.js [app-ssr] (ecmascript)");
const util_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/util.js [app-ssr] (ecmascript)");
exports.ACK = Uint8Array.of(43, 65, 67, 75);
const NAK = Uint8Array.of(45, 78, 65, 75);
const WPI = Uint8Array.of(43, 87, 80, 73);
const NXT = Uint8Array.of(43, 78, 88, 84);
const TERM = Uint8Array.of(43, 84, 69, 82, 77);
const SPACE = Uint8Array.of(32);
function toJsMsg(m, ackTimeout = 5000) {
    return new JsMsgImpl(m, ackTimeout);
}
function parseInfo(s) {
    const tokens = s.split(".");
    if (tokens.length === 9) {
        tokens.splice(2, 0, "_", "");
    }
    if (tokens.length < 11 || tokens[0] !== "$JS" || tokens[1] !== "ACK") {
        throw new Error(`not js message`);
    }
    // old
    // "$JS.ACK.<stream>.<consumer>.<deliveryCount><streamSeq><deliverySequence>.<timestamp>.<pending>"
    // new
    // $JS.ACK.<domain>.<accounthash>.<stream>.<consumer>.<deliveryCount>.<streamSeq>.<deliverySequence>.<timestamp>.<pending>.<random>
    const di = {};
    // if domain is "_", replace with blank
    di.domain = tokens[2] === "_" ? "" : tokens[2];
    di.account_hash = tokens[3];
    di.stream = tokens[4];
    di.consumer = tokens[5];
    di.deliveryCount = parseInt(tokens[6], 10);
    di.redeliveryCount = di.deliveryCount;
    di.redelivered = di.deliveryCount > 1;
    di.streamSequence = parseInt(tokens[7], 10);
    di.deliverySequence = parseInt(tokens[8], 10);
    di.timestampNanos = parseInt(tokens[9], 10);
    di.pending = parseInt(tokens[10], 10);
    return di;
}
class JsMsgImpl {
    constructor(msg, timeout){
        this.msg = msg;
        this.didAck = false;
        this.timeout = timeout;
    }
    get subject() {
        return this.msg.subject;
    }
    get sid() {
        return this.msg.sid;
    }
    get data() {
        return this.msg.data;
    }
    get headers() {
        return this.msg.headers;
    }
    get info() {
        if (!this.di) {
            this.di = parseInfo(this.reply);
        }
        return this.di;
    }
    get redelivered() {
        return this.info.deliveryCount > 1;
    }
    get reply() {
        return this.msg.reply || "";
    }
    get seq() {
        return this.info.streamSequence;
    }
    doAck(payload) {
        if (!this.didAck) {
            // all acks are final with the exception of +WPI
            this.didAck = !this.isWIP(payload);
            this.msg.respond(payload);
        }
    }
    isWIP(p) {
        return p.length === 4 && p[0] === WPI[0] && p[1] === WPI[1] && p[2] === WPI[2] && p[3] === WPI[3];
    }
    // this has to dig into the internals as the message has access
    // to the protocol but not the high-level client.
    ackAck(opts) {
        return __awaiter(this, void 0, void 0, function*() {
            var _a;
            opts = opts || {};
            opts.timeout = opts.timeout || this.timeout;
            const d = (0, mod_1.deferred)();
            if (!this.didAck) {
                this.didAck = true;
                if (this.msg.reply) {
                    const mi = this.msg;
                    const proto = mi.publisher;
                    const trace = !(((_a = proto.options) === null || _a === void 0 ? void 0 : _a.noAsyncTraces) || false);
                    const r = new request_1.RequestOne(proto.muxSubscriptions, this.msg.reply, {
                        timeout: opts.timeout
                    }, trace);
                    proto.request(r);
                    try {
                        proto.publish(this.msg.reply, exports.ACK, {
                            reply: `${proto.muxSubscriptions.baseInbox}${r.token}`
                        });
                    } catch (err) {
                        r.cancel(err);
                    }
                    try {
                        yield Promise.race([
                            r.timer,
                            r.deferred
                        ]);
                        d.resolve(true);
                    } catch (err) {
                        r.cancel(err);
                        d.reject(err);
                    }
                } else {
                    d.resolve(false);
                }
            } else {
                d.resolve(false);
            }
            return d;
        });
    }
    ack() {
        this.doAck(exports.ACK);
    }
    nak(millis) {
        let payload = NAK;
        if (millis) {
            payload = (0, codec_1.StringCodec)().encode(`-NAK ${JSON.stringify({
                delay: (0, util_1.nanos)(millis)
            })}`);
        }
        this.doAck(payload);
    }
    working() {
        this.doAck(WPI);
    }
    next(subj, opts = {
        batch: 1
    }) {
        const args = {};
        args.batch = opts.batch || 1;
        args.no_wait = opts.no_wait || false;
        if (opts.expires && opts.expires > 0) {
            args.expires = (0, util_1.nanos)(opts.expires);
        }
        const data = (0, codec_1.JSONCodec)().encode(args);
        const payload = databuffer_1.DataBuffer.concat(NXT, SPACE, data);
        const reqOpts = subj ? {
            reply: subj
        } : undefined;
        this.msg.respond(payload, reqOpts);
    }
    term(reason = "") {
        let term = TERM;
        if ((reason === null || reason === void 0 ? void 0 : reason.length) > 0) {
            term = (0, codec_1.StringCodec)().encode(`+TERM ${reason}`);
        }
        this.doAck(term);
    }
    json() {
        return this.msg.json();
    }
    string() {
        return this.msg.string();
    }
}
exports.JsMsgImpl = JsMsgImpl; //# sourceMappingURL=jsmsg.js.map
}),
"[project]/dawg-ai/node_modules/nats/lib/nats-base-client/typedsub.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

/*
 * Copyright 2021 The NATS Authors
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
 */ var __awaiter = /*TURBOPACK member replacement*/ __turbopack_context__.e && /*TURBOPACK member replacement*/ __turbopack_context__.e.__awaiter || function(thisArg, _arguments, P, generator) {
    function adopt(value) {
        return value instanceof P ? value : new P(function(resolve) {
            resolve(value);
        });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
        function fulfilled(value) {
            try {
                step(generator.next(value));
            } catch (e) {
                reject(e);
            }
        }
        function rejected(value) {
            try {
                step(generator["throw"](value));
            } catch (e) {
                reject(e);
            }
        }
        function step(result) {
            result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.TypedSubscription = void 0;
exports.checkFn = checkFn;
const util_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/util.js [app-ssr] (ecmascript)");
const queued_iterator_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/queued_iterator.js [app-ssr] (ecmascript)");
const core_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/core.js [app-ssr] (ecmascript)");
function checkFn(fn, name, required = false) {
    if (required === true && !fn) {
        throw core_1.NatsError.errorForCode(core_1.ErrorCode.ApiError, new Error(`${name} is not a function`));
    }
    if (fn && typeof fn !== "function") {
        throw core_1.NatsError.errorForCode(core_1.ErrorCode.ApiError, new Error(`${name} is not a function`));
    }
}
/**
 * TypedSubscription wraps a subscription to provide payload specific
 * subscription semantics. That is messages are a transport
 * for user data, and the data is presented as application specific
 * data to the client.
 */ class TypedSubscription extends queued_iterator_1.QueuedIteratorImpl {
    constructor(nc, subject, opts){
        super();
        checkFn(opts.adapter, "adapter", true);
        this.adapter = opts.adapter;
        if (opts.callback) {
            checkFn(opts.callback, "callback");
        }
        this.noIterator = typeof opts.callback === "function";
        if (opts.ingestionFilterFn) {
            checkFn(opts.ingestionFilterFn, "ingestionFilterFn");
            this.ingestionFilterFn = opts.ingestionFilterFn;
        }
        if (opts.protocolFilterFn) {
            checkFn(opts.protocolFilterFn, "protocolFilterFn");
            this.protocolFilterFn = opts.protocolFilterFn;
        }
        if (opts.dispatchedFn) {
            checkFn(opts.dispatchedFn, "dispatchedFn");
            this.dispatchedFn = opts.dispatchedFn;
        }
        if (opts.cleanupFn) {
            checkFn(opts.cleanupFn, "cleanupFn");
        }
        let callback = (err, msg)=>{
            this.callback(err, msg);
        };
        if (opts.callback) {
            const uh = opts.callback;
            callback = (err, msg)=>{
                const [jer, tm] = this.adapter(err, msg);
                if (jer) {
                    uh(jer, null);
                    return;
                }
                const { ingest } = this.ingestionFilterFn ? this.ingestionFilterFn(tm, this) : {
                    ingest: true
                };
                if (ingest) {
                    const ok = this.protocolFilterFn ? this.protocolFilterFn(tm) : true;
                    if (ok) {
                        uh(jer, tm);
                        if (this.dispatchedFn && tm) {
                            this.dispatchedFn(tm);
                        }
                    }
                }
            };
        }
        const { max, queue, timeout } = opts;
        const sopts = {
            queue,
            timeout,
            callback
        };
        if (max && max > 0) {
            sopts.max = max;
        }
        this.sub = nc.subscribe(subject, sopts);
        if (opts.cleanupFn) {
            this.sub.cleanupFn = opts.cleanupFn;
        }
        if (!this.noIterator) {
            this.iterClosed.then(()=>{
                this.unsubscribe();
            });
        }
        this.subIterDone = (0, util_1.deferred)();
        Promise.all([
            this.sub.closed,
            this.iterClosed
        ]).then(()=>{
            this.subIterDone.resolve();
        }).catch(()=>{
            this.subIterDone.resolve();
        });
        ((s)=>__awaiter(this, void 0, void 0, function*() {
                yield s.closed;
                this.stop();
            }))(this.sub).then().catch();
    }
    unsubscribe(max) {
        this.sub.unsubscribe(max);
    }
    drain() {
        return this.sub.drain();
    }
    isDraining() {
        return this.sub.isDraining();
    }
    isClosed() {
        return this.sub.isClosed();
    }
    callback(e, msg) {
        this.sub.cancelTimeout();
        const [err, tm] = this.adapter(e, msg);
        if (err) {
            this.stop(err);
        }
        if (tm) {
            this.push(tm);
        }
    }
    getSubject() {
        return this.sub.getSubject();
    }
    getReceived() {
        return this.sub.getReceived();
    }
    getProcessed() {
        return this.sub.getProcessed();
    }
    getPending() {
        return this.sub.getPending();
    }
    getID() {
        return this.sub.getID();
    }
    getMax() {
        return this.sub.getMax();
    }
    get closed() {
        return this.sub.closed;
    }
}
exports.TypedSubscription = TypedSubscription; //# sourceMappingURL=typedsub.js.map
}),
"[project]/dawg-ai/node_modules/nats/lib/nats-base-client/base64.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Base64UrlPaddedCodec = exports.Base64UrlCodec = exports.Base64Codec = void 0;
class Base64Codec {
    static encode(bytes) {
        if (typeof bytes === "string") {
            return btoa(bytes);
        }
        const a = Array.from(bytes);
        return btoa(String.fromCharCode(...a));
    }
    static decode(s, binary = false) {
        const bin = atob(s);
        if (!binary) {
            return bin;
        }
        return Uint8Array.from(bin, (c)=>c.charCodeAt(0));
    }
}
exports.Base64Codec = Base64Codec;
class Base64UrlCodec {
    static encode(bytes) {
        return Base64UrlCodec.toB64URLEncoding(Base64Codec.encode(bytes));
    }
    static decode(s, binary = false) {
        return Base64Codec.decode(Base64UrlCodec.fromB64URLEncoding(s), binary);
    }
    static toB64URLEncoding(b64str) {
        return b64str.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    }
    static fromB64URLEncoding(b64str) {
        // pads are % 4, but not necessary on decoding
        return b64str.replace(/_/g, "/").replace(/-/g, "+");
    }
}
exports.Base64UrlCodec = Base64UrlCodec;
class Base64UrlPaddedCodec {
    static encode(bytes) {
        return Base64UrlPaddedCodec.toB64URLEncoding(Base64Codec.encode(bytes));
    }
    static decode(s, binary = false) {
        return Base64UrlPaddedCodec.decode(Base64UrlPaddedCodec.fromB64URLEncoding(s), binary);
    }
    static toB64URLEncoding(b64str) {
        return b64str.replace(/\+/g, "-").replace(/\//g, "_");
    }
    static fromB64URLEncoding(b64str) {
        // pads are % 4, but not necessary on decoding
        return b64str.replace(/_/g, "/").replace(/-/g, "+");
    }
}
exports.Base64UrlPaddedCodec = Base64UrlPaddedCodec; //# sourceMappingURL=base64.js.map
}),
"[project]/dawg-ai/node_modules/nats/lib/nats-base-client/js-sha256.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually
// https://github.com/emn178/js-sha256 (MIT)
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.sha256 = exports.sha224 = exports.default = void 0;
function t(t, e) {
    return e.forEach(function(e) {
        e && "string" != typeof e && !Array.isArray(e) && Object.keys(e).forEach(function(r) {
            if ("default" !== r && !(r in t)) {
                var i = Object.getOwnPropertyDescriptor(e, r);
                Object.defineProperty(t, r, i.get ? i : {
                    enumerable: !0,
                    get: function() {
                        return e[r];
                    }
                });
            }
        });
    }), Object.freeze(t);
}
var e = ("TURBOPACK compile-time truthy", 1) ? /*TURBOPACK member replacement*/ __turbopack_context__.g : "TURBOPACK unreachable";
function r() {
    throw new Error("setTimeout has not been defined");
}
function i() {
    throw new Error("clearTimeout has not been defined");
}
var h = r, s = i;
function n(t) {
    if (h === setTimeout) return setTimeout(t, 0);
    if ((h === r || !h) && setTimeout) return h = setTimeout, setTimeout(t, 0);
    try {
        return h(t, 0);
    } catch (e) {
        try {
            return h.call(null, t, 0);
        } catch (e) {
            return h.call(this, t, 0);
        }
    }
}
"function" == typeof e.setTimeout && (h = setTimeout), "function" == typeof e.clearTimeout && (s = clearTimeout);
var o, a = [], f = !1, u = -1;
function c() {
    f && o && (f = !1, o.length ? a = o.concat(a) : u = -1, a.length && l());
}
function l() {
    if (!f) {
        var t = n(c);
        f = !0;
        for(var e = a.length; e;){
            for(o = a, a = []; ++u < e;)o && o[u].run();
            u = -1, e = a.length;
        }
        o = null, f = !1, function(t) {
            if (s === clearTimeout) return clearTimeout(t);
            if ((s === i || !s) && clearTimeout) return s = clearTimeout, clearTimeout(t);
            try {
                return s(t);
            } catch (e) {
                try {
                    return s.call(null, t);
                } catch (e) {
                    return s.call(this, t);
                }
            }
        }(t);
    }
}
function y(t, e) {
    this.fun = t, this.array = e;
}
y.prototype.run = function() {
    this.fun.apply(null, this.array);
};
function p() {}
var d = p, w = p, b = p, v = p, A = p, g = p, _ = p;
var m = e.performance || {}, O = m.now || m.mozNow || m.msNow || m.oNow || m.webkitNow || function() {
    return (new Date).getTime();
};
var B = new Date;
var E = {
    nextTick: function(t) {
        var e = new Array(arguments.length - 1);
        if (arguments.length > 1) for(var r = 1; r < arguments.length; r++)e[r - 1] = arguments[r];
        a.push(new y(t, e)), 1 !== a.length || f || n(l);
    },
    title: "browser",
    browser: !0,
    env: {},
    argv: [],
    version: "",
    versions: {},
    on: d,
    addListener: w,
    once: b,
    off: v,
    removeListener: A,
    removeAllListeners: g,
    emit: _,
    binding: function(t) {
        throw new Error("process.binding is not supported");
    },
    cwd: function() {
        return "/";
    },
    chdir: function(t) {
        throw new Error("process.chdir is not supported");
    },
    umask: function() {
        return 0;
    },
    hrtime: function(t) {
        var e = .001 * O.call(m), r = Math.floor(e), i = Math.floor(e % 1 * 1e9);
        return t && (r -= t[0], (i -= t[1]) < 0 && (r--, i += 1e9)), [
            r,
            i
        ];
    },
    platform: "browser",
    release: {},
    config: {},
    uptime: function() {
        return (new Date - B) / 1e3;
    }
}, S = "undefined" != typeof globalThis ? globalThis : ("TURBOPACK compile-time falsy", 0) ? "TURBOPACK unreachable" : ("TURBOPACK compile-time truthy", 1) ? /*TURBOPACK member replacement*/ __turbopack_context__.g : "TURBOPACK unreachable";
function T(t) {
    if (t.__esModule) return t;
    var e = Object.defineProperty({}, "__esModule", {
        value: !0
    });
    return Object.keys(t).forEach(function(r) {
        var i = Object.getOwnPropertyDescriptor(t, r);
        Object.defineProperty(e, r, i.get ? i : {
            enumerable: !0,
            get: function() {
                return t[r];
            }
        });
    }), e;
}
var k, x = {
    exports: {}
}, j = {}, N = T(t({
    __proto__: null,
    default: j
}, [
    j
]));
k = x, function() {
    var t = "input is invalid type", e = "object" == "undefined", r = ("TURBOPACK compile-time falsy", 0) ? "TURBOPACK unreachable" : {};
    r.JS_SHA256_NO_WINDOW && (e = !1);
    var i = !e && "object" == typeof self, h = !r.JS_SHA256_NO_NODE_JS && E.versions && E.versions.node;
    h ? r = S : i && (r = self);
    var s = !r.JS_SHA256_NO_COMMON_JS && k.exports, n = !r.JS_SHA256_NO_ARRAY_BUFFER && "undefined" != typeof ArrayBuffer, o = "0123456789abcdef".split(""), a = [
        -2147483648,
        8388608,
        32768,
        128
    ], f = [
        24,
        16,
        8,
        0
    ], u = [
        1116352408,
        1899447441,
        3049323471,
        3921009573,
        961987163,
        1508970993,
        2453635748,
        2870763221,
        3624381080,
        310598401,
        607225278,
        1426881987,
        1925078388,
        2162078206,
        2614888103,
        3248222580,
        3835390401,
        4022224774,
        264347078,
        604807628,
        770255983,
        1249150122,
        1555081692,
        1996064986,
        2554220882,
        2821834349,
        2952996808,
        3210313671,
        3336571891,
        3584528711,
        113926993,
        338241895,
        666307205,
        773529912,
        1294757372,
        1396182291,
        1695183700,
        1986661051,
        2177026350,
        2456956037,
        2730485921,
        2820302411,
        3259730800,
        3345764771,
        3516065817,
        3600352804,
        4094571909,
        275423344,
        430227734,
        506948616,
        659060556,
        883997877,
        958139571,
        1322822218,
        1537002063,
        1747873779,
        1955562222,
        2024104815,
        2227730452,
        2361852424,
        2428436474,
        2756734187,
        3204031479,
        3329325298
    ], c = [
        "hex",
        "array",
        "digest",
        "arrayBuffer"
    ], l = [];
    !r.JS_SHA256_NO_NODE_JS && Array.isArray || (Array.isArray = function(t) {
        return "[object Array]" === Object.prototype.toString.call(t);
    }), !n || !r.JS_SHA256_NO_ARRAY_BUFFER_IS_VIEW && ArrayBuffer.isView || (ArrayBuffer.isView = function(t) {
        return "object" == typeof t && t.buffer && t.buffer.constructor === ArrayBuffer;
    });
    var y = function(t, e) {
        return function(r) {
            return new v(e, !0).update(r)[t]();
        };
    }, p = function(t) {
        var e = y("hex", t);
        h && (e = d(e, t)), e.create = function() {
            return new v(t);
        }, e.update = function(t) {
            return e.create().update(t);
        };
        for(var r = 0; r < c.length; ++r){
            var i = c[r];
            e[i] = y(i, t);
        }
        return e;
    }, d = function(e, i) {
        var h, s = N, n = N.Buffer, o = i ? "sha224" : "sha256";
        return h = n.from && !r.JS_SHA256_NO_BUFFER_FROM ? n.from : function(t) {
            return new n(t);
        }, function(r) {
            if ("string" == typeof r) return s.createHash(o).update(r, "utf8").digest("hex");
            if (null == r) throw new Error(t);
            return r.constructor === ArrayBuffer && (r = new Uint8Array(r)), Array.isArray(r) || ArrayBuffer.isView(r) || r.constructor === n ? s.createHash(o).update(h(r)).digest("hex") : e(r);
        };
    }, w = function(t, e) {
        return function(r, i) {
            return new A(r, e, !0).update(i)[t]();
        };
    }, b = function(t) {
        var e = w("hex", t);
        e.create = function(e) {
            return new A(e, t);
        }, e.update = function(t, r) {
            return e.create(t).update(r);
        };
        for(var r = 0; r < c.length; ++r){
            var i = c[r];
            e[i] = w(i, t);
        }
        return e;
    };
    function v(t, e) {
        e ? (l[0] = l[16] = l[1] = l[2] = l[3] = l[4] = l[5] = l[6] = l[7] = l[8] = l[9] = l[10] = l[11] = l[12] = l[13] = l[14] = l[15] = 0, this.blocks = l) : this.blocks = [
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
            0,
            0
        ], t ? (this.h0 = 3238371032, this.h1 = 914150663, this.h2 = 812702999, this.h3 = 4144912697, this.h4 = 4290775857, this.h5 = 1750603025, this.h6 = 1694076839, this.h7 = 3204075428) : (this.h0 = 1779033703, this.h1 = 3144134277, this.h2 = 1013904242, this.h3 = 2773480762, this.h4 = 1359893119, this.h5 = 2600822924, this.h6 = 528734635, this.h7 = 1541459225), this.block = this.start = this.bytes = this.hBytes = 0, this.finalized = this.hashed = !1, this.first = !0, this.is224 = t;
    }
    function A(e, r, i) {
        var h, s = typeof e;
        if ("string" === s) {
            var o, a = [], f = e.length, u = 0;
            for(h = 0; h < f; ++h)(o = e.charCodeAt(h)) < 128 ? a[u++] = o : o < 2048 ? (a[u++] = 192 | o >>> 6, a[u++] = 128 | 63 & o) : o < 55296 || o >= 57344 ? (a[u++] = 224 | o >>> 12, a[u++] = 128 | o >>> 6 & 63, a[u++] = 128 | 63 & o) : (o = 65536 + ((1023 & o) << 10 | 1023 & e.charCodeAt(++h)), a[u++] = 240 | o >>> 18, a[u++] = 128 | o >>> 12 & 63, a[u++] = 128 | o >>> 6 & 63, a[u++] = 128 | 63 & o);
            e = a;
        } else {
            if ("object" !== s) throw new Error(t);
            if (null === e) throw new Error(t);
            if (n && e.constructor === ArrayBuffer) e = new Uint8Array(e);
            else if (!(Array.isArray(e) || n && ArrayBuffer.isView(e))) throw new Error(t);
        }
        e.length > 64 && (e = new v(r, !0).update(e).array());
        var c = [], l = [];
        for(h = 0; h < 64; ++h){
            var y = e[h] || 0;
            c[h] = 92 ^ y, l[h] = 54 ^ y;
        }
        v.call(this, r, i), this.update(l), this.oKeyPad = c, this.inner = !0, this.sharedMemory = i;
    }
    v.prototype.update = function(e) {
        if (!this.finalized) {
            var r, i = typeof e;
            if ("string" !== i) {
                if ("object" !== i) throw new Error(t);
                if (null === e) throw new Error(t);
                if (n && e.constructor === ArrayBuffer) e = new Uint8Array(e);
                else if (!(Array.isArray(e) || n && ArrayBuffer.isView(e))) throw new Error(t);
                r = !0;
            }
            for(var h, s, o = 0, a = e.length, u = this.blocks; o < a;){
                if (this.hashed && (this.hashed = !1, u[0] = this.block, this.block = u[16] = u[1] = u[2] = u[3] = u[4] = u[5] = u[6] = u[7] = u[8] = u[9] = u[10] = u[11] = u[12] = u[13] = u[14] = u[15] = 0), r) for(s = this.start; o < a && s < 64; ++o)u[s >>> 2] |= e[o] << f[3 & s++];
                else for(s = this.start; o < a && s < 64; ++o)(h = e.charCodeAt(o)) < 128 ? u[s >>> 2] |= h << f[3 & s++] : h < 2048 ? (u[s >>> 2] |= (192 | h >>> 6) << f[3 & s++], u[s >>> 2] |= (128 | 63 & h) << f[3 & s++]) : h < 55296 || h >= 57344 ? (u[s >>> 2] |= (224 | h >>> 12) << f[3 & s++], u[s >>> 2] |= (128 | h >>> 6 & 63) << f[3 & s++], u[s >>> 2] |= (128 | 63 & h) << f[3 & s++]) : (h = 65536 + ((1023 & h) << 10 | 1023 & e.charCodeAt(++o)), u[s >>> 2] |= (240 | h >>> 18) << f[3 & s++], u[s >>> 2] |= (128 | h >>> 12 & 63) << f[3 & s++], u[s >>> 2] |= (128 | h >>> 6 & 63) << f[3 & s++], u[s >>> 2] |= (128 | 63 & h) << f[3 & s++]);
                this.lastByteIndex = s, this.bytes += s - this.start, s >= 64 ? (this.block = u[16], this.start = s - 64, this.hash(), this.hashed = !0) : this.start = s;
            }
            return this.bytes > 4294967295 && (this.hBytes += this.bytes / 4294967296 | 0, this.bytes = this.bytes % 4294967296), this;
        }
    }, v.prototype.finalize = function() {
        if (!this.finalized) {
            this.finalized = !0;
            var t = this.blocks, e = this.lastByteIndex;
            t[16] = this.block, t[e >>> 2] |= a[3 & e], this.block = t[16], e >= 56 && (this.hashed || this.hash(), t[0] = this.block, t[16] = t[1] = t[2] = t[3] = t[4] = t[5] = t[6] = t[7] = t[8] = t[9] = t[10] = t[11] = t[12] = t[13] = t[14] = t[15] = 0), t[14] = this.hBytes << 3 | this.bytes >>> 29, t[15] = this.bytes << 3, this.hash();
        }
    }, v.prototype.hash = function() {
        var t, e, r, i, h, s, n, o, a, f = this.h0, c = this.h1, l = this.h2, y = this.h3, p = this.h4, d = this.h5, w = this.h6, b = this.h7, v = this.blocks;
        for(t = 16; t < 64; ++t)e = ((h = v[t - 15]) >>> 7 | h << 25) ^ (h >>> 18 | h << 14) ^ h >>> 3, r = ((h = v[t - 2]) >>> 17 | h << 15) ^ (h >>> 19 | h << 13) ^ h >>> 10, v[t] = v[t - 16] + e + v[t - 7] + r | 0;
        for(a = c & l, t = 0; t < 64; t += 4)this.first ? (this.is224 ? (s = 300032, b = (h = v[0] - 1413257819) - 150054599 | 0, y = h + 24177077 | 0) : (s = 704751109, b = (h = v[0] - 210244248) - 1521486534 | 0, y = h + 143694565 | 0), this.first = !1) : (e = (f >>> 2 | f << 30) ^ (f >>> 13 | f << 19) ^ (f >>> 22 | f << 10), i = (s = f & c) ^ f & l ^ a, b = y + (h = b + (r = (p >>> 6 | p << 26) ^ (p >>> 11 | p << 21) ^ (p >>> 25 | p << 7)) + (p & d ^ ~p & w) + u[t] + v[t]) | 0, y = h + (e + i) | 0), e = (y >>> 2 | y << 30) ^ (y >>> 13 | y << 19) ^ (y >>> 22 | y << 10), i = (n = y & f) ^ y & c ^ s, w = l + (h = w + (r = (b >>> 6 | b << 26) ^ (b >>> 11 | b << 21) ^ (b >>> 25 | b << 7)) + (b & p ^ ~b & d) + u[t + 1] + v[t + 1]) | 0, e = ((l = h + (e + i) | 0) >>> 2 | l << 30) ^ (l >>> 13 | l << 19) ^ (l >>> 22 | l << 10), i = (o = l & y) ^ l & f ^ n, d = c + (h = d + (r = (w >>> 6 | w << 26) ^ (w >>> 11 | w << 21) ^ (w >>> 25 | w << 7)) + (w & b ^ ~w & p) + u[t + 2] + v[t + 2]) | 0, e = ((c = h + (e + i) | 0) >>> 2 | c << 30) ^ (c >>> 13 | c << 19) ^ (c >>> 22 | c << 10), i = (a = c & l) ^ c & y ^ o, p = f + (h = p + (r = (d >>> 6 | d << 26) ^ (d >>> 11 | d << 21) ^ (d >>> 25 | d << 7)) + (d & w ^ ~d & b) + u[t + 3] + v[t + 3]) | 0, f = h + (e + i) | 0, this.chromeBugWorkAround = !0;
        this.h0 = this.h0 + f | 0, this.h1 = this.h1 + c | 0, this.h2 = this.h2 + l | 0, this.h3 = this.h3 + y | 0, this.h4 = this.h4 + p | 0, this.h5 = this.h5 + d | 0, this.h6 = this.h6 + w | 0, this.h7 = this.h7 + b | 0;
    }, v.prototype.hex = function() {
        this.finalize();
        var t = this.h0, e = this.h1, r = this.h2, i = this.h3, h = this.h4, s = this.h5, n = this.h6, a = this.h7, f = o[t >>> 28 & 15] + o[t >>> 24 & 15] + o[t >>> 20 & 15] + o[t >>> 16 & 15] + o[t >>> 12 & 15] + o[t >>> 8 & 15] + o[t >>> 4 & 15] + o[15 & t] + o[e >>> 28 & 15] + o[e >>> 24 & 15] + o[e >>> 20 & 15] + o[e >>> 16 & 15] + o[e >>> 12 & 15] + o[e >>> 8 & 15] + o[e >>> 4 & 15] + o[15 & e] + o[r >>> 28 & 15] + o[r >>> 24 & 15] + o[r >>> 20 & 15] + o[r >>> 16 & 15] + o[r >>> 12 & 15] + o[r >>> 8 & 15] + o[r >>> 4 & 15] + o[15 & r] + o[i >>> 28 & 15] + o[i >>> 24 & 15] + o[i >>> 20 & 15] + o[i >>> 16 & 15] + o[i >>> 12 & 15] + o[i >>> 8 & 15] + o[i >>> 4 & 15] + o[15 & i] + o[h >>> 28 & 15] + o[h >>> 24 & 15] + o[h >>> 20 & 15] + o[h >>> 16 & 15] + o[h >>> 12 & 15] + o[h >>> 8 & 15] + o[h >>> 4 & 15] + o[15 & h] + o[s >>> 28 & 15] + o[s >>> 24 & 15] + o[s >>> 20 & 15] + o[s >>> 16 & 15] + o[s >>> 12 & 15] + o[s >>> 8 & 15] + o[s >>> 4 & 15] + o[15 & s] + o[n >>> 28 & 15] + o[n >>> 24 & 15] + o[n >>> 20 & 15] + o[n >>> 16 & 15] + o[n >>> 12 & 15] + o[n >>> 8 & 15] + o[n >>> 4 & 15] + o[15 & n];
        return this.is224 || (f += o[a >>> 28 & 15] + o[a >>> 24 & 15] + o[a >>> 20 & 15] + o[a >>> 16 & 15] + o[a >>> 12 & 15] + o[a >>> 8 & 15] + o[a >>> 4 & 15] + o[15 & a]), f;
    }, v.prototype.toString = v.prototype.hex, v.prototype.digest = function() {
        this.finalize();
        var t = this.h0, e = this.h1, r = this.h2, i = this.h3, h = this.h4, s = this.h5, n = this.h6, o = this.h7, a = [
            t >>> 24 & 255,
            t >>> 16 & 255,
            t >>> 8 & 255,
            255 & t,
            e >>> 24 & 255,
            e >>> 16 & 255,
            e >>> 8 & 255,
            255 & e,
            r >>> 24 & 255,
            r >>> 16 & 255,
            r >>> 8 & 255,
            255 & r,
            i >>> 24 & 255,
            i >>> 16 & 255,
            i >>> 8 & 255,
            255 & i,
            h >>> 24 & 255,
            h >>> 16 & 255,
            h >>> 8 & 255,
            255 & h,
            s >>> 24 & 255,
            s >>> 16 & 255,
            s >>> 8 & 255,
            255 & s,
            n >>> 24 & 255,
            n >>> 16 & 255,
            n >>> 8 & 255,
            255 & n
        ];
        return this.is224 || a.push(o >>> 24 & 255, o >>> 16 & 255, o >>> 8 & 255, 255 & o), a;
    }, v.prototype.array = v.prototype.digest, v.prototype.arrayBuffer = function() {
        this.finalize();
        var t = new ArrayBuffer(this.is224 ? 28 : 32), e = new DataView(t);
        return e.setUint32(0, this.h0), e.setUint32(4, this.h1), e.setUint32(8, this.h2), e.setUint32(12, this.h3), e.setUint32(16, this.h4), e.setUint32(20, this.h5), e.setUint32(24, this.h6), this.is224 || e.setUint32(28, this.h7), t;
    }, A.prototype = new v, A.prototype.finalize = function() {
        if (v.prototype.finalize.call(this), this.inner) {
            this.inner = !1;
            var t = this.array();
            v.call(this, this.is224, this.sharedMemory), this.update(this.oKeyPad), this.update(t), v.prototype.finalize.call(this);
        }
    };
    var g = p();
    g.sha256 = g, g.sha224 = p(!0), g.sha256.hmac = b(), g.sha224.hmac = b(!0), s ? k.exports = g : (r.sha256 = g.sha256, r.sha224 = g.sha224);
}();
var U = x.exports, z = x.exports.sha224, J = x.exports.sha256;
exports.default = U;
exports.sha224 = z;
exports.sha256 = J; //# sourceMappingURL=js-sha256.js.map
}),
"[project]/dawg-ai/node_modules/nats/lib/jetstream/sha_digest.parser.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

/*
 * Copyright 2025 The NATS Authors
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
exports.parseSha256 = parseSha256;
exports.checkSha256 = checkSha256;
function parseSha256(s) {
    return toByteArray(s);
}
function isHex(s) {
    // contains valid hex characters only
    const hexRegex = /^[0-9A-Fa-f]+$/;
    if (!hexRegex.test(s)) {
        // non-hex characters
        return false;
    }
    // check for mixed-case strings - paranoid base64 sneaked in
    const isAllUpperCase = /^[0-9A-F]+$/.test(s);
    const isAllLowerCase = /^[0-9a-f]+$/.test(s);
    if (!(isAllUpperCase || isAllLowerCase)) {
        return false;
    }
    // ensure the input string length is even
    return s.length % 2 === 0;
}
function isBase64(s) {
    // test for padded or normal base64
    return /^[A-Za-z0-9\-_]*(={0,2})?$/.test(s) || /^[A-Za-z0-9+/]*(={0,2})?$/.test(s);
}
function detectEncoding(input) {
    // hex is more reliable to flush out...
    if (isHex(input)) {
        return "hex";
    } else if (isBase64(input)) {
        return "b64";
    }
    return "";
}
function hexToByteArray(s) {
    if (s.length % 2 !== 0) {
        throw new Error("hex string must have an even length");
    }
    const a = new Uint8Array(s.length / 2);
    for(let i = 0; i < s.length; i += 2){
        // parse hex two chars at a time
        a[i / 2] = parseInt(s.substring(i, i + 2), 16);
    }
    return a;
}
function base64ToByteArray(s) {
    // could be url friendly
    s = s.replace(/-/g, "+");
    s = s.replace(/_/g, "/");
    const sbin = atob(s);
    return Uint8Array.from(sbin, (c)=>c.charCodeAt(0));
}
function toByteArray(input) {
    const encoding = detectEncoding(input);
    switch(encoding){
        case "hex":
            return hexToByteArray(input);
        case "b64":
            return base64ToByteArray(input);
    }
    return null;
}
function checkSha256(a, b) {
    const aBytes = typeof a === "string" ? parseSha256(a) : a;
    const bBytes = typeof b === "string" ? parseSha256(b) : b;
    if (aBytes === null || bBytes === null) {
        return false;
    }
    if (aBytes.length !== bBytes.length) {
        return false;
    }
    for(let i = 0; i < aBytes.length; i++){
        if (aBytes[i] !== bBytes[i]) {
            return false;
        }
    }
    return true;
} //# sourceMappingURL=sha_digest.parser.js.map
}),
"[project]/dawg-ai/node_modules/nats/lib/jetstream/objectstore.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

/*
 * Copyright 2022-2025 The NATS Authors
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
 */ var __awaiter = /*TURBOPACK member replacement*/ __turbopack_context__.e && /*TURBOPACK member replacement*/ __turbopack_context__.e.__awaiter || function(thisArg, _arguments, P, generator) {
    function adopt(value) {
        return value instanceof P ? value : new P(function(resolve) {
            resolve(value);
        });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
        function fulfilled(value) {
            try {
                step(generator.next(value));
            } catch (e) {
                reject(e);
            }
        }
        function rejected(value) {
            try {
                step(generator["throw"](value));
            } catch (e) {
                reject(e);
            }
        }
        function step(result) {
            result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = /*TURBOPACK member replacement*/ __turbopack_context__.e && /*TURBOPACK member replacement*/ __turbopack_context__.e.__asyncValues || function(o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function() {
        return this;
    }, i);
    //TURBOPACK unreachable
    ;
    function verb(n) {
        i[n] = o[n] && function(v) {
            return new Promise(function(resolve, reject) {
                v = o[n](v), settle(resolve, reject, v.done, v.value);
            });
        };
    }
    function settle(resolve, reject, d, v) {
        Promise.resolve(v).then(function(v) {
            resolve({
                value: v,
                done: d
            });
        }, reject);
    }
};
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ObjectStoreImpl = exports.ObjectStoreStatusImpl = exports.digestType = exports.osPrefix = void 0;
exports.objectStoreStreamName = objectStoreStreamName;
exports.objectStoreBucketName = objectStoreBucketName;
const kv_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/jetstream/kv.js [app-ssr] (ecmascript)");
const base64_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/base64.js [app-ssr] (ecmascript)");
const codec_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/codec.js [app-ssr] (ecmascript)");
const nuid_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/nuid.js [app-ssr] (ecmascript)");
const util_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/util.js [app-ssr] (ecmascript)");
const databuffer_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/databuffer.js [app-ssr] (ecmascript)");
const headers_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/headers.js [app-ssr] (ecmascript)");
const types_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/jetstream/types.js [app-ssr] (ecmascript)");
const queued_iterator_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/queued_iterator.js [app-ssr] (ecmascript)");
const js_sha256_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/js-sha256.js [app-ssr] (ecmascript)");
const jsapi_types_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/jetstream/jsapi_types.js [app-ssr] (ecmascript)");
const jsclient_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/jetstream/jsclient.js [app-ssr] (ecmascript)");
const sha_digest_parser_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/jetstream/sha_digest.parser.js [app-ssr] (ecmascript)");
exports.osPrefix = "OBJ_";
exports.digestType = "SHA-256=";
function objectStoreStreamName(bucket) {
    (0, kv_1.validateBucket)(bucket);
    return `${exports.osPrefix}${bucket}`;
}
function objectStoreBucketName(stream) {
    if (stream.startsWith(exports.osPrefix)) {
        return stream.substring(4);
    }
    return stream;
}
class ObjectStoreStatusImpl {
    constructor(si){
        this.si = si;
        this.backingStore = "JetStream";
    }
    get bucket() {
        return objectStoreBucketName(this.si.config.name);
    }
    get description() {
        var _a;
        return (_a = this.si.config.description) !== null && _a !== void 0 ? _a : "";
    }
    get ttl() {
        return this.si.config.max_age;
    }
    get storage() {
        return this.si.config.storage;
    }
    get replicas() {
        return this.si.config.num_replicas;
    }
    get sealed() {
        return this.si.config.sealed;
    }
    get size() {
        return this.si.state.bytes;
    }
    get streamInfo() {
        return this.si;
    }
    get metadata() {
        return this.si.config.metadata;
    }
    get compression() {
        if (this.si.config.compression) {
            return this.si.config.compression !== jsapi_types_1.StoreCompression.None;
        }
        return false;
    }
}
exports.ObjectStoreStatusImpl = ObjectStoreStatusImpl;
class ObjectInfoImpl {
    constructor(oi){
        this.info = oi;
    }
    get name() {
        return this.info.name;
    }
    get description() {
        var _a;
        return (_a = this.info.description) !== null && _a !== void 0 ? _a : "";
    }
    get headers() {
        if (!this.hdrs) {
            this.hdrs = headers_1.MsgHdrsImpl.fromRecord(this.info.headers || {});
        }
        return this.hdrs;
    }
    get options() {
        return this.info.options;
    }
    get bucket() {
        return this.info.bucket;
    }
    get chunks() {
        return this.info.chunks;
    }
    get deleted() {
        var _a;
        return (_a = this.info.deleted) !== null && _a !== void 0 ? _a : false;
    }
    get digest() {
        return this.info.digest;
    }
    get mtime() {
        return this.info.mtime;
    }
    get nuid() {
        return this.info.nuid;
    }
    get size() {
        return this.info.size;
    }
    get revision() {
        return this.info.revision;
    }
    get metadata() {
        return this.info.metadata || {};
    }
    isLink() {
        var _a, _b;
        return ((_a = this.info.options) === null || _a === void 0 ? void 0 : _a.link) !== undefined && ((_b = this.info.options) === null || _b === void 0 ? void 0 : _b.link) !== null;
    }
}
function toServerObjectStoreMeta(meta) {
    var _a;
    const v = {
        name: meta.name,
        description: (_a = meta.description) !== null && _a !== void 0 ? _a : "",
        options: meta.options,
        metadata: meta.metadata
    };
    if (meta.headers) {
        const mhi = meta.headers;
        v.headers = mhi.toRecord();
    }
    return v;
}
function emptyReadableStream() {
    return new ReadableStream({
        pull (c) {
            c.enqueue(new Uint8Array(0));
            c.close();
        }
    });
}
class ObjectStoreImpl {
    constructor(name, jsm, js){
        this.name = name;
        this.jsm = jsm;
        this.js = js;
    }
    _checkNotEmpty(name) {
        if (!name || name.length === 0) {
            return {
                name,
                error: new Error("name cannot be empty")
            };
        }
        return {
            name
        };
    }
    info(name) {
        return __awaiter(this, void 0, void 0, function*() {
            const info = yield this.rawInfo(name);
            return info ? new ObjectInfoImpl(info) : null;
        });
    }
    list() {
        return __awaiter(this, void 0, void 0, function*() {
            var _a, e_1, _b, _c;
            const buf = [];
            const iter = yield this.watch({
                ignoreDeletes: true,
                includeHistory: true
            });
            try {
                for(var _d = true, iter_1 = __asyncValues(iter), iter_1_1; iter_1_1 = yield iter_1.next(), _a = iter_1_1.done, !_a; _d = true){
                    _c = iter_1_1.value;
                    _d = false;
                    const info = _c;
                    // watch will give a null when it has initialized
                    // for us that is the hint we are done
                    if (info === null) {
                        break;
                    }
                    buf.push(info);
                }
            } catch (e_1_1) {
                e_1 = {
                    error: e_1_1
                };
            } finally{
                try {
                    if (!_d && !_a && (_b = iter_1.return)) yield _b.call(iter_1);
                } finally{
                    if (e_1) throw e_1.error;
                }
            }
            return Promise.resolve(buf);
        });
    }
    rawInfo(name) {
        return __awaiter(this, void 0, void 0, function*() {
            const { name: obj, error } = this._checkNotEmpty(name);
            if (error) {
                return Promise.reject(error);
            }
            const meta = this._metaSubject(obj);
            try {
                const m = yield this.jsm.streams.getMessage(this.stream, {
                    last_by_subj: meta
                });
                const jc = (0, codec_1.JSONCodec)();
                const soi = jc.decode(m.data);
                soi.revision = m.seq;
                return soi;
            } catch (err) {
                if (err.code === "404") {
                    return null;
                }
                return Promise.reject(err);
            }
        });
    }
    _si(opts) {
        return __awaiter(this, void 0, void 0, function*() {
            try {
                return yield this.jsm.streams.info(this.stream, opts);
            } catch (err) {
                const nerr = err;
                if (nerr.code === "404") {
                    return null;
                }
                return Promise.reject(err);
            }
        });
    }
    seal() {
        return __awaiter(this, void 0, void 0, function*() {
            let info = yield this._si();
            if (info === null) {
                return Promise.reject(new Error("object store not found"));
            }
            info.config.sealed = true;
            info = yield this.jsm.streams.update(this.stream, info.config);
            return Promise.resolve(new ObjectStoreStatusImpl(info));
        });
    }
    status(opts) {
        return __awaiter(this, void 0, void 0, function*() {
            const info = yield this._si(opts);
            if (info === null) {
                return Promise.reject(new Error("object store not found"));
            }
            return Promise.resolve(new ObjectStoreStatusImpl(info));
        });
    }
    destroy() {
        return this.jsm.streams.delete(this.stream);
    }
    _put(meta, rs, opts) {
        return __awaiter(this, void 0, void 0, function*() {
            var _a, _b;
            const jsopts = this.js.getOptions();
            opts = opts || {
                timeout: jsopts.timeout
            };
            opts.timeout = opts.timeout || jsopts.timeout;
            opts.previousRevision = (_a = opts.previousRevision) !== null && _a !== void 0 ? _a : undefined;
            const { timeout, previousRevision } = opts;
            const si = this.js.nc.info;
            const maxPayload = (si === null || si === void 0 ? void 0 : si.max_payload) || 1024;
            meta = meta || {};
            meta.options = meta.options || {};
            let maxChunk = ((_b = meta.options) === null || _b === void 0 ? void 0 : _b.max_chunk_size) || 128 * 1024;
            maxChunk = maxChunk > maxPayload ? maxPayload : maxChunk;
            meta.options.max_chunk_size = maxChunk;
            const old = yield this.info(meta.name);
            const { name: n, error } = this._checkNotEmpty(meta.name);
            if (error) {
                return Promise.reject(error);
            }
            const id = nuid_1.nuid.next();
            const chunkSubj = this._chunkSubject(id);
            const metaSubj = this._metaSubject(n);
            const info = Object.assign({
                bucket: this.name,
                nuid: id,
                size: 0,
                chunks: 0
            }, toServerObjectStoreMeta(meta));
            const d = (0, util_1.deferred)();
            const proms = [];
            const db = new databuffer_1.DataBuffer();
            try {
                const reader = rs ? rs.getReader() : null;
                const sha = js_sha256_1.sha256.create();
                while(true){
                    const { done, value } = reader ? yield reader.read() : {
                        done: true,
                        value: undefined
                    };
                    if (done) {
                        // put any partial chunk in
                        if (db.size() > 0) {
                            const payload = db.drain();
                            sha.update(payload);
                            info.chunks++;
                            info.size += payload.length;
                            proms.push(this.js.publish(chunkSubj, payload, {
                                timeout
                            }));
                        }
                        // wait for all the chunks to write
                        yield Promise.all(proms);
                        proms.length = 0;
                        // prepare the metadata
                        info.mtime = new Date().toISOString();
                        const digest = base64_1.Base64UrlPaddedCodec.encode(sha.digest());
                        info.digest = `${exports.digestType}${digest}`;
                        info.deleted = false;
                        // trailing md for the object
                        const h = (0, headers_1.headers)();
                        if (typeof previousRevision === "number") {
                            h.set(jsclient_1.PubHeaders.ExpectedLastSubjectSequenceHdr, `${previousRevision}`);
                        }
                        h.set(types_1.JsHeaders.RollupHdr, types_1.JsHeaders.RollupValueSubject);
                        // try to update the metadata
                        const pa = yield this.js.publish(metaSubj, (0, codec_1.JSONCodec)().encode(info), {
                            headers: h,
                            timeout
                        });
                        // update the revision to point to the sequence where we inserted
                        info.revision = pa.seq;
                        // if we are here, the new entry is live
                        if (old) {
                            try {
                                yield this.jsm.streams.purge(this.stream, {
                                    filter: `$O.${this.name}.C.${old.nuid}`
                                });
                            } catch (_err) {
                            // rejecting here, would mean send the wrong signal
                            // the update succeeded, but cleanup of old chunks failed.
                            }
                        }
                        // resolve the ObjectInfo
                        d.resolve(new ObjectInfoImpl(info));
                        break;
                    }
                    if (value) {
                        db.fill(value);
                        while(db.size() > maxChunk){
                            info.chunks++;
                            info.size += maxChunk;
                            const payload = db.drain(meta.options.max_chunk_size);
                            sha.update(payload);
                            proms.push(this.js.publish(chunkSubj, payload, {
                                timeout
                            }));
                        }
                    }
                }
            } catch (err) {
                // we failed, remove any partials
                yield this.jsm.streams.purge(this.stream, {
                    filter: chunkSubj
                });
                d.reject(err);
            }
            return d;
        });
    }
    putBlob(meta, data, opts) {
        function readableStreamFrom(data) {
            return new ReadableStream({
                pull (controller) {
                    controller.enqueue(data);
                    controller.close();
                }
            });
        }
        if (data === null) {
            data = new Uint8Array(0);
        }
        return this.put(meta, readableStreamFrom(data), opts);
    }
    put(meta, rs, opts) {
        var _a;
        if ((_a = meta === null || meta === void 0 ? void 0 : meta.options) === null || _a === void 0 ? void 0 : _a.link) {
            return Promise.reject(new Error("link cannot be set when putting the object in bucket"));
        }
        return this._put(meta, rs, opts);
    }
    getBlob(name) {
        return __awaiter(this, void 0, void 0, function*() {
            function fromReadableStream(rs) {
                return __awaiter(this, void 0, void 0, function*() {
                    const buf = new databuffer_1.DataBuffer();
                    const reader = rs.getReader();
                    while(true){
                        const { done, value } = yield reader.read();
                        if (done) {
                            return buf.drain();
                        }
                        if (value && value.length) {
                            buf.fill(value);
                        }
                    }
                });
            }
            const r = yield this.get(name);
            if (r === null) {
                return Promise.resolve(null);
            }
            const vs = yield Promise.all([
                r.error,
                fromReadableStream(r.data)
            ]);
            if (vs[0]) {
                return Promise.reject(vs[0]);
            } else {
                return Promise.resolve(vs[1]);
            }
        });
    }
    get(name) {
        return __awaiter(this, void 0, void 0, function*() {
            const info = yield this.rawInfo(name);
            if (info === null) {
                return Promise.resolve(null);
            }
            if (info.deleted) {
                return Promise.resolve(null);
            }
            if (info.options && info.options.link) {
                const ln = info.options.link.name || "";
                if (ln === "") {
                    throw new Error("link is a bucket");
                }
                const os = info.options.link.bucket !== this.name ? yield ObjectStoreImpl.create(this.js, info.options.link.bucket) : this;
                return os.get(ln);
            }
            if (!info.digest.startsWith(exports.digestType)) {
                return Promise.reject(new Error(`unknown digest type: ${info.digest}`));
            }
            const digest = (0, sha_digest_parser_1.parseSha256)(info.digest.substring(8));
            if (digest === null) {
                return Promise.reject(new Error(`unable to parse digest: ${info.digest}`));
            }
            const d = (0, util_1.deferred)();
            const r = {
                info: new ObjectInfoImpl(info),
                error: d
            };
            if (info.size === 0) {
                r.data = emptyReadableStream();
                d.resolve(null);
                return Promise.resolve(r);
            }
            let controller;
            const oc = (0, types_1.consumerOpts)();
            oc.orderedConsumer();
            const sha = js_sha256_1.sha256.create();
            const subj = `$O.${this.name}.C.${info.nuid}`;
            const sub = yield this.js.subscribe(subj, oc);
            (()=>__awaiter(this, void 0, void 0, function*() {
                    var _a, e_2, _b, _c;
                    try {
                        for(var _d = true, sub_1 = __asyncValues(sub), sub_1_1; sub_1_1 = yield sub_1.next(), _a = sub_1_1.done, !_a; _d = true){
                            _c = sub_1_1.value;
                            _d = false;
                            const jm = _c;
                            if (jm.data.length > 0) {
                                sha.update(jm.data);
                                controller.enqueue(jm.data);
                            }
                            if (jm.info.pending === 0) {
                                if (!(0, sha_digest_parser_1.checkSha256)(digest, sha.digest())) {
                                    controller.error(new Error(`received a corrupt object, digests do not match received: ${info.digest} calculated ${digest}`));
                                } else {
                                    controller.close();
                                }
                                sub.unsubscribe();
                            }
                        }
                    } catch (e_2_1) {
                        e_2 = {
                            error: e_2_1
                        };
                    } finally{
                        try {
                            if (!_d && !_a && (_b = sub_1.return)) yield _b.call(sub_1);
                        } finally{
                            if (e_2) throw e_2.error;
                        }
                    }
                }))().then(()=>{
                d.resolve();
            }).catch((err)=>{
                controller.error(err);
                d.reject(err);
            });
            r.data = new ReadableStream({
                start (c) {
                    controller = c;
                },
                cancel () {
                    sub.unsubscribe();
                }
            });
            return r;
        });
    }
    linkStore(name, bucket) {
        if (!(bucket instanceof ObjectStoreImpl)) {
            return Promise.reject("bucket required");
        }
        const osi = bucket;
        const { name: n, error } = this._checkNotEmpty(name);
        if (error) {
            return Promise.reject(error);
        }
        const meta = {
            name: n,
            options: {
                link: {
                    bucket: osi.name
                }
            }
        };
        return this._put(meta, null);
    }
    link(name, info) {
        return __awaiter(this, void 0, void 0, function*() {
            const { name: n, error } = this._checkNotEmpty(name);
            if (error) {
                return Promise.reject(error);
            }
            if (info.deleted) {
                return Promise.reject(new Error("src object is deleted"));
            }
            if (info.isLink()) {
                return Promise.reject(new Error("src object is a link"));
            }
            const dest = yield this.rawInfo(name);
            if (dest !== null && !dest.deleted) {
                return Promise.reject(new Error("an object already exists with that name"));
            }
            const link = {
                bucket: info.bucket,
                name: info.name
            };
            const mm = {
                name: n,
                bucket: info.bucket,
                options: {
                    link: link
                }
            };
            yield this.js.publish(this._metaSubject(name), JSON.stringify(mm));
            const i = yield this.info(name);
            return Promise.resolve(i);
        });
    }
    delete(name) {
        return __awaiter(this, void 0, void 0, function*() {
            const info = yield this.rawInfo(name);
            if (info === null) {
                return Promise.resolve({
                    purged: 0,
                    success: false
                });
            }
            info.deleted = true;
            info.size = 0;
            info.chunks = 0;
            info.digest = "";
            const jc = (0, codec_1.JSONCodec)();
            const h = (0, headers_1.headers)();
            h.set(types_1.JsHeaders.RollupHdr, types_1.JsHeaders.RollupValueSubject);
            yield this.js.publish(this._metaSubject(info.name), jc.encode(info), {
                headers: h
            });
            return this.jsm.streams.purge(this.stream, {
                filter: this._chunkSubject(info.nuid)
            });
        });
    }
    update(name_1) {
        return __awaiter(this, arguments, void 0, function*(name, meta = {}) {
            var _a;
            const info = yield this.rawInfo(name);
            if (info === null) {
                return Promise.reject(new Error("object not found"));
            }
            if (info.deleted) {
                return Promise.reject(new Error("cannot update meta for a deleted object"));
            }
            meta.name = (_a = meta.name) !== null && _a !== void 0 ? _a : info.name;
            const { name: n, error } = this._checkNotEmpty(meta.name);
            if (error) {
                return Promise.reject(error);
            }
            if (name !== meta.name) {
                const i = yield this.info(meta.name);
                if (i && !i.deleted) {
                    return Promise.reject(new Error("an object already exists with that name"));
                }
            }
            meta.name = n;
            const ii = Object.assign({}, info, toServerObjectStoreMeta(meta));
            // if the name changed, delete the old meta
            const ack = yield this.js.publish(this._metaSubject(ii.name), JSON.stringify(ii));
            if (name !== meta.name) {
                yield this.jsm.streams.purge(this.stream, {
                    filter: this._metaSubject(name)
                });
            }
            return Promise.resolve(ack);
        });
    }
    watch() {
        return __awaiter(this, arguments, void 0, function*(opts = {}) {
            var _a, _b;
            opts.includeHistory = (_a = opts.includeHistory) !== null && _a !== void 0 ? _a : false;
            opts.ignoreDeletes = (_b = opts.ignoreDeletes) !== null && _b !== void 0 ? _b : false;
            let initialized = false;
            const qi = new queued_iterator_1.QueuedIteratorImpl();
            const subj = this._metaSubjectAll();
            try {
                yield this.jsm.streams.getMessage(this.stream, {
                    last_by_subj: subj
                });
            } catch (err) {
                if (err.code === "404") {
                    qi.push(null);
                    initialized = true;
                } else {
                    qi.stop(err);
                }
            }
            const jc = (0, codec_1.JSONCodec)();
            const copts = (0, types_1.consumerOpts)();
            copts.orderedConsumer();
            if (opts.includeHistory) {
                copts.deliverLastPerSubject();
            } else {
                // FIXME: Go's implementation doesn't seem correct - if history is not desired
                //  the watch should only be giving notifications on new entries
                initialized = true;
                copts.deliverNew();
            }
            copts.callback((err, jm)=>{
                var _a;
                if (err) {
                    qi.stop(err);
                    return;
                }
                if (jm !== null) {
                    const oi = jc.decode(jm.data);
                    if (oi.deleted && opts.ignoreDeletes === true) {
                    // do nothing
                    } else {
                        qi.push(oi);
                    }
                    if (((_a = jm.info) === null || _a === void 0 ? void 0 : _a.pending) === 0 && !initialized) {
                        initialized = true;
                        qi.push(null);
                    }
                }
            });
            const sub = yield this.js.subscribe(subj, copts);
            qi._data = sub;
            qi.iterClosed.then(()=>{
                sub.unsubscribe();
            });
            sub.closed.then(()=>{
                qi.stop();
            }).catch((err)=>{
                qi.stop(err);
            });
            return qi;
        });
    }
    _chunkSubject(id) {
        return `$O.${this.name}.C.${id}`;
    }
    _metaSubject(n) {
        return `$O.${this.name}.M.${base64_1.Base64UrlPaddedCodec.encode(n)}`;
    }
    _metaSubjectAll() {
        return `$O.${this.name}.M.>`;
    }
    init() {
        return __awaiter(this, arguments, void 0, function*(opts = {}) {
            var _a;
            try {
                this.stream = objectStoreStreamName(this.name);
            } catch (err) {
                return Promise.reject(err);
            }
            const max_age = (opts === null || opts === void 0 ? void 0 : opts.ttl) || 0;
            delete opts.ttl;
            // pacify the tsc compiler downstream
            const sc = Object.assign({
                max_age
            }, opts);
            sc.name = this.stream;
            sc.num_replicas = (_a = opts.replicas) !== null && _a !== void 0 ? _a : 1;
            sc.allow_direct = true;
            sc.allow_rollup_hdrs = true;
            sc.discard = jsapi_types_1.DiscardPolicy.New;
            sc.subjects = [
                `$O.${this.name}.C.>`,
                `$O.${this.name}.M.>`
            ];
            if (opts.placement) {
                sc.placement = opts.placement;
            }
            if (opts.metadata) {
                sc.metadata = opts.metadata;
            }
            if (typeof opts.compression === "boolean") {
                sc.compression = opts.compression ? jsapi_types_1.StoreCompression.S2 : jsapi_types_1.StoreCompression.None;
            }
            try {
                yield this.jsm.streams.info(sc.name);
            } catch (err) {
                if (err.message === "stream not found") {
                    yield this.jsm.streams.add(sc);
                }
            }
        });
    }
    static create(js_1, name_1) {
        return __awaiter(this, arguments, void 0, function*(js, name, opts = {}) {
            const jsm = yield js.jetstreamManager();
            const os = new ObjectStoreImpl(name, jsm, js);
            yield os.init(opts);
            return Promise.resolve(os);
        });
    }
}
exports.ObjectStoreImpl = ObjectStoreImpl; //# sourceMappingURL=objectstore.js.map
}),
"[project]/dawg-ai/node_modules/nats/lib/nats-base-client/idleheartbeat_monitor.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

/*
 * Copyright 2022 The NATS Authors
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
exports.IdleHeartbeatMonitor = void 0;
class IdleHeartbeatMonitor {
    /**
     * Constructor
     * @param interval in millis to check
     * @param cb a callback to report when heartbeats are missed
     * @param opts monitor options @see IdleHeartbeatOptions
     */ constructor(interval, cb, opts = {
        maxOut: 2
    }){
        this.interval = interval;
        this.maxOut = (opts === null || opts === void 0 ? void 0 : opts.maxOut) || 2;
        this.cancelAfter = (opts === null || opts === void 0 ? void 0 : opts.cancelAfter) || 0;
        this.last = Date.now();
        this.missed = 0;
        this.count = 0;
        this.callback = cb;
        this._schedule();
    }
    /**
     * cancel monitoring
     */ cancel() {
        if (this.autoCancelTimer) {
            clearTimeout(this.autoCancelTimer);
        }
        if (this.timer) {
            clearInterval(this.timer);
        }
        this.timer = 0;
        this.autoCancelTimer = 0;
        this.missed = 0;
    }
    /**
     * work signals that there was work performed
     */ work() {
        this.last = Date.now();
        this.missed = 0;
    }
    /**
     * internal api to change the interval, cancelAfter and maxOut
     * @param interval
     * @param cancelAfter
     * @param maxOut
     */ _change(interval, cancelAfter = 0, maxOut = 2) {
        this.interval = interval;
        this.maxOut = maxOut;
        this.cancelAfter = cancelAfter;
        this.restart();
    }
    /**
     * cancels and restarts the monitoring
     */ restart() {
        this.cancel();
        this._schedule();
    }
    /**
     * internal api called to start monitoring
     */ _schedule() {
        if (this.cancelAfter > 0) {
            // @ts-ignore: in node is not a number - we treat this opaquely
            this.autoCancelTimer = setTimeout(()=>{
                this.cancel();
            }, this.cancelAfter);
        }
        // @ts-ignore: in node is not a number - we treat this opaquely
        this.timer = setInterval(()=>{
            this.count++;
            if (Date.now() - this.last > this.interval) {
                this.missed++;
            }
            if (this.missed >= this.maxOut) {
                try {
                    if (this.callback(this.missed) === true) {
                        this.cancel();
                    }
                } catch (err) {
                    console.log(err);
                }
            }
        }, this.interval);
    }
}
exports.IdleHeartbeatMonitor = IdleHeartbeatMonitor; //# sourceMappingURL=idleheartbeat_monitor.js.map
}),
"[project]/dawg-ai/node_modules/nats/lib/jetstream/jsclient.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

/*
 * Copyright 2022-2024 The NATS Authors
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
 */ var __awaiter = /*TURBOPACK member replacement*/ __turbopack_context__.e && /*TURBOPACK member replacement*/ __turbopack_context__.e.__awaiter || function(thisArg, _arguments, P, generator) {
    function adopt(value) {
        return value instanceof P ? value : new P(function(resolve) {
            resolve(value);
        });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
        function fulfilled(value) {
            try {
                step(generator.next(value));
            } catch (e) {
                reject(e);
            }
        }
        function rejected(value) {
            try {
                step(generator["throw"](value));
            } catch (e) {
                reject(e);
            }
        }
        function step(result) {
            result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.JetStreamSubscriptionImpl = exports.JetStreamClientImpl = exports.PubHeaders = void 0;
const types_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/types.js [app-ssr] (ecmascript)");
const jsbaseclient_api_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/jetstream/jsbaseclient_api.js [app-ssr] (ecmascript)");
const jsutil_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/jetstream/jsutil.js [app-ssr] (ecmascript)");
const jsmconsumer_api_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/jetstream/jsmconsumer_api.js [app-ssr] (ecmascript)");
const jsmsg_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/jetstream/jsmsg.js [app-ssr] (ecmascript)");
const typedsub_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/typedsub.js [app-ssr] (ecmascript)");
const queued_iterator_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/queued_iterator.js [app-ssr] (ecmascript)");
const util_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/util.js [app-ssr] (ecmascript)");
const headers_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/headers.js [app-ssr] (ecmascript)");
const kv_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/jetstream/kv.js [app-ssr] (ecmascript)");
const semver_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/semver.js [app-ssr] (ecmascript)");
const objectstore_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/jetstream/objectstore.js [app-ssr] (ecmascript)");
const idleheartbeat_monitor_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/idleheartbeat_monitor.js [app-ssr] (ecmascript)");
const jsmstream_api_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/jetstream/jsmstream_api.js [app-ssr] (ecmascript)");
const types_2 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/jetstream/types.js [app-ssr] (ecmascript)");
const core_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/core.js [app-ssr] (ecmascript)");
const jsapi_types_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/jetstream/jsapi_types.js [app-ssr] (ecmascript)");
const nuid_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/nuid.js [app-ssr] (ecmascript)");
var PubHeaders;
(function(PubHeaders) {
    PubHeaders["MsgIdHdr"] = "Nats-Msg-Id";
    PubHeaders["ExpectedStreamHdr"] = "Nats-Expected-Stream";
    PubHeaders["ExpectedLastSeqHdr"] = "Nats-Expected-Last-Sequence";
    PubHeaders["ExpectedLastMsgIdHdr"] = "Nats-Expected-Last-Msg-Id";
    PubHeaders["ExpectedLastSubjectSequenceHdr"] = "Nats-Expected-Last-Subject-Sequence";
})(PubHeaders || (exports.PubHeaders = PubHeaders = {}));
class ViewsImpl {
    constructor(js){
        this.js = js;
    }
    kv(name, opts = {}) {
        const jsi = this.js;
        const { ok, min } = jsi.nc.features.get(semver_1.Feature.JS_KV);
        if (!ok) {
            return Promise.reject(new Error(`kv is only supported on servers ${min} or better`));
        }
        if (opts.bindOnly) {
            return kv_1.Bucket.bind(this.js, name, opts);
        }
        return kv_1.Bucket.create(this.js, name, opts);
    }
    os(name, opts = {}) {
        var _a;
        if (typeof ((_a = crypto === null || crypto === void 0 ? void 0 : crypto.subtle) === null || _a === void 0 ? void 0 : _a.digest) !== "function") {
            return Promise.reject(new Error("objectstore: unable to calculate hashes - crypto.subtle.digest with sha256 support is required"));
        }
        const jsi = this.js;
        const { ok, min } = jsi.nc.features.get(semver_1.Feature.JS_OBJECTSTORE);
        if (!ok) {
            return Promise.reject(new Error(`objectstore is only supported on servers ${min} or better`));
        }
        return objectstore_1.ObjectStoreImpl.create(this.js, name, opts);
    }
}
class JetStreamClientImpl extends jsbaseclient_api_1.BaseApiClient {
    constructor(nc, opts){
        super(nc, opts);
        this.consumerAPI = new jsmconsumer_api_1.ConsumerAPIImpl(nc, opts);
        this.streamAPI = new jsmstream_api_1.StreamAPIImpl(nc, opts);
        this.consumers = new jsmstream_api_1.ConsumersImpl(this.consumerAPI);
        this.streams = new jsmstream_api_1.StreamsImpl(this.streamAPI);
    }
    jetstreamManager(checkAPI) {
        if (checkAPI === undefined) {
            checkAPI = this.opts.checkAPI;
        }
        const opts = Object.assign({}, this.opts, {
            checkAPI
        });
        return this.nc.jetstreamManager(opts);
    }
    get apiPrefix() {
        return this.prefix;
    }
    get views() {
        return new ViewsImpl(this);
    }
    publish(subj_1) {
        return __awaiter(this, arguments, void 0, function*(subj, data = types_1.Empty, opts) {
            opts = opts || {};
            opts.expect = opts.expect || {};
            const mh = (opts === null || opts === void 0 ? void 0 : opts.headers) || (0, headers_1.headers)();
            if (opts) {
                if (opts.msgID) {
                    mh.set(PubHeaders.MsgIdHdr, opts.msgID);
                }
                if (opts.expect.lastMsgID) {
                    mh.set(PubHeaders.ExpectedLastMsgIdHdr, opts.expect.lastMsgID);
                }
                if (opts.expect.streamName) {
                    mh.set(PubHeaders.ExpectedStreamHdr, opts.expect.streamName);
                }
                if (typeof opts.expect.lastSequence === "number") {
                    mh.set(PubHeaders.ExpectedLastSeqHdr, `${opts.expect.lastSequence}`);
                }
                if (typeof opts.expect.lastSubjectSequence === "number") {
                    mh.set(PubHeaders.ExpectedLastSubjectSequenceHdr, `${opts.expect.lastSubjectSequence}`);
                }
            }
            const to = opts.timeout || this.timeout;
            const ro = {};
            if (to) {
                ro.timeout = to;
            }
            if (opts) {
                ro.headers = mh;
            }
            let { retries, retry_delay } = opts;
            retries = retries || 1;
            retry_delay = retry_delay || 250;
            let r;
            for(let i = 0; i < retries; i++){
                try {
                    r = yield this.nc.request(subj, data, ro);
                    break;
                } catch (err) {
                    const ne = err;
                    if (ne.code === "503" && i + 1 < retries) {
                        yield (0, util_1.delay)(retry_delay);
                    } else {
                        throw err;
                    }
                }
            }
            const pa = this.parseJsResponse(r);
            if (pa.stream === "") {
                throw types_1.NatsError.errorForCode(core_1.ErrorCode.JetStreamInvalidAck);
            }
            pa.duplicate = pa.duplicate ? pa.duplicate : false;
            return pa;
        });
    }
    pull(stream_1, durable_1) {
        return __awaiter(this, arguments, void 0, function*(stream, durable, expires = 0) {
            (0, jsutil_1.validateStreamName)(stream);
            (0, jsutil_1.validateDurableName)(durable);
            let timeout = this.timeout;
            if (expires > timeout) {
                timeout = expires;
            }
            expires = expires < 0 ? 0 : (0, util_1.nanos)(expires);
            const pullOpts = {
                batch: 1,
                no_wait: expires === 0,
                expires
            };
            const msg = yield this.nc.request(`${this.prefix}.CONSUMER.MSG.NEXT.${stream}.${durable}`, this.jc.encode(pullOpts), {
                noMux: true,
                timeout
            });
            const err = (0, jsutil_1.checkJsError)(msg);
            if (err) {
                throw err;
            }
            return (0, jsmsg_1.toJsMsg)(msg, this.timeout);
        });
    }
    /*
     * Returns available messages upto specified batch count.
     * If expires is set the iterator will wait for the specified
     * amount of millis before closing the subscription.
     * If no_wait is specified, the iterator will return no messages.
     * @param stream
     * @param durable
     * @param opts
     */ fetch(stream, durable, opts = {}) {
        var _a;
        (0, jsutil_1.validateStreamName)(stream);
        (0, jsutil_1.validateDurableName)(durable);
        let timer = null;
        const trackBytes = ((_a = opts.max_bytes) !== null && _a !== void 0 ? _a : 0) > 0;
        let receivedBytes = 0;
        const max_bytes = trackBytes ? opts.max_bytes : 0;
        let monitor = null;
        const args = {};
        args.batch = opts.batch || 1;
        if (max_bytes) {
            const fv = this.nc.features.get(semver_1.Feature.JS_PULL_MAX_BYTES);
            if (!fv.ok) {
                throw new Error(`max_bytes is only supported on servers ${fv.min} or better`);
            }
            args.max_bytes = max_bytes;
        }
        args.no_wait = opts.no_wait || false;
        if (args.no_wait && args.expires) {
            args.expires = 0;
        }
        const expires = opts.expires || 0;
        if (expires) {
            args.expires = (0, util_1.nanos)(expires);
        }
        if (expires === 0 && args.no_wait === false) {
            throw new Error("expires or no_wait is required");
        }
        const hb = opts.idle_heartbeat || 0;
        if (hb) {
            args.idle_heartbeat = (0, util_1.nanos)(hb);
            //@ts-ignore: for testing
            if (opts.delay_heartbeat === true) {
                //@ts-ignore: test option
                args.idle_heartbeat = (0, util_1.nanos)(hb * 4);
            }
        }
        const qi = new queued_iterator_1.QueuedIteratorImpl();
        const wants = args.batch;
        let received = 0;
        qi.protocolFilterFn = (jm, _ingest = false)=>{
            const jsmi = jm;
            if ((0, jsutil_1.isHeartbeatMsg)(jsmi.msg)) {
                monitor === null || monitor === void 0 ? void 0 : monitor.work();
                return false;
            }
            return true;
        };
        // FIXME: this looks weird, we want to stop the iterator
        //   but doing it from a dispatchedFn...
        qi.dispatchedFn = (m)=>{
            if (m) {
                if (trackBytes) {
                    receivedBytes += m.data.length;
                }
                received++;
                if (timer && m.info.pending === 0) {
                    // the expiration will close it
                    return;
                }
                // if we have one pending and we got the expected
                // or there are no more stop the iterator
                if (qi.getPending() === 1 && m.info.pending === 0 || wants === received || max_bytes > 0 && receivedBytes >= max_bytes) {
                    qi.stop();
                }
            }
        };
        const inbox = (0, core_1.createInbox)(this.nc.options.inboxPrefix);
        const sub = this.nc.subscribe(inbox, {
            max: opts.batch,
            callback: (err, msg)=>{
                if (err === null) {
                    err = (0, jsutil_1.checkJsError)(msg);
                }
                if (err !== null) {
                    if (timer) {
                        timer.cancel();
                        timer = null;
                    }
                    if ((0, core_1.isNatsError)(err)) {
                        qi.stop(hideNonTerminalJsErrors(err) === null ? undefined : err);
                    } else {
                        qi.stop(err);
                    }
                } else {
                    // if we are doing heartbeats, message resets
                    monitor === null || monitor === void 0 ? void 0 : monitor.work();
                    qi.received++;
                    qi.push((0, jsmsg_1.toJsMsg)(msg, this.timeout));
                }
            }
        });
        // timer on the client  the issue is that the request
        // is started on the client, which means that it will expire
        // on the client first
        if (expires) {
            timer = (0, util_1.timeout)(expires);
            timer.catch(()=>{
                if (!sub.isClosed()) {
                    sub.drain().catch(()=>{});
                    timer = null;
                }
                if (monitor) {
                    monitor.cancel();
                }
            });
        }
        (()=>__awaiter(this, void 0, void 0, function*() {
                try {
                    if (hb) {
                        monitor = new idleheartbeat_monitor_1.IdleHeartbeatMonitor(hb, (v)=>{
                            //@ts-ignore: pushing a fn
                            qi.push(()=>{
                                // this will terminate the iterator
                                qi.err = new types_1.NatsError(`${jsutil_1.Js409Errors.IdleHeartbeatMissed}: ${v}`, core_1.ErrorCode.JetStreamIdleHeartBeat);
                            });
                            return true;
                        });
                    }
                } catch (_err) {
                // ignore it
                }
                // close the iterator if the connection or subscription closes unexpectedly
                yield sub.closed;
                if (timer !== null) {
                    timer.cancel();
                    timer = null;
                }
                if (monitor) {
                    monitor.cancel();
                }
                qi.stop();
            }))().catch();
        this.nc.publish(`${this.prefix}.CONSUMER.MSG.NEXT.${stream}.${durable}`, this.jc.encode(args), {
            reply: inbox
        });
        return qi;
    }
    pullSubscribe(subject_1) {
        return __awaiter(this, arguments, void 0, function*(subject, opts = (0, types_2.consumerOpts)()) {
            const cso = yield this._processOptions(subject, opts);
            if (cso.ordered) {
                throw new Error("pull subscribers cannot be be ordered");
            }
            if (cso.config.deliver_subject) {
                throw new Error("consumer info specifies deliver_subject - pull consumers cannot have deliver_subject set");
            }
            const ackPolicy = cso.config.ack_policy;
            if (ackPolicy === jsapi_types_1.AckPolicy.None || ackPolicy === jsapi_types_1.AckPolicy.All) {
                throw new Error("ack policy for pull consumers must be explicit");
            }
            const so = this._buildTypedSubscriptionOpts(cso);
            const sub = new JetStreamPullSubscriptionImpl(this, cso.deliver, so);
            sub.info = cso;
            try {
                yield this._maybeCreateConsumer(cso);
            } catch (err) {
                sub.unsubscribe();
                throw err;
            }
            return sub;
        });
    }
    subscribe(subject_1) {
        return __awaiter(this, arguments, void 0, function*(subject, opts = (0, types_2.consumerOpts)()) {
            const cso = yield this._processOptions(subject, opts);
            // this effectively requires deliver subject to be specified
            // as an option otherwise we have a pull consumer
            if (!cso.isBind && !cso.config.deliver_subject) {
                throw new Error("push consumer requires deliver_subject");
            }
            const so = this._buildTypedSubscriptionOpts(cso);
            const sub = new JetStreamSubscriptionImpl(this, cso.deliver, so);
            sub.info = cso;
            try {
                yield this._maybeCreateConsumer(cso);
            } catch (err) {
                sub.unsubscribe();
                throw err;
            }
            sub._maybeSetupHbMonitoring();
            return sub;
        });
    }
    _processOptions(subject_1) {
        return __awaiter(this, arguments, void 0, function*(subject, opts = (0, types_2.consumerOpts)()) {
            var _a, _b;
            const jsi = (0, types_2.isConsumerOptsBuilder)(opts) ? opts.getOpts() : opts;
            jsi.isBind = (0, types_2.isConsumerOptsBuilder)(opts) ? opts.isBind : false;
            jsi.flow_control = {
                heartbeat_count: 0,
                fc_count: 0,
                consumer_restarts: 0
            };
            if (jsi.ordered) {
                jsi.ordered_consumer_sequence = {
                    stream_seq: 0,
                    delivery_seq: 0
                };
                if (jsi.config.ack_policy !== jsapi_types_1.AckPolicy.NotSet && jsi.config.ack_policy !== jsapi_types_1.AckPolicy.None) {
                    throw new types_1.NatsError("ordered consumer: ack_policy can only be set to 'none'", core_1.ErrorCode.ApiError);
                }
                if (jsi.config.durable_name && jsi.config.durable_name.length > 0) {
                    throw new types_1.NatsError("ordered consumer: durable_name cannot be set", core_1.ErrorCode.ApiError);
                }
                if (jsi.config.deliver_subject && jsi.config.deliver_subject.length > 0) {
                    throw new types_1.NatsError("ordered consumer: deliver_subject cannot be set", core_1.ErrorCode.ApiError);
                }
                if (jsi.config.max_deliver !== undefined && jsi.config.max_deliver > 1) {
                    throw new types_1.NatsError("ordered consumer: max_deliver cannot be set", core_1.ErrorCode.ApiError);
                }
                if (jsi.config.deliver_group && jsi.config.deliver_group.length > 0) {
                    throw new types_1.NatsError("ordered consumer: deliver_group cannot be set", core_1.ErrorCode.ApiError);
                }
                jsi.config.deliver_subject = (0, core_1.createInbox)(this.nc.options.inboxPrefix);
                jsi.config.ack_policy = jsapi_types_1.AckPolicy.None;
                jsi.config.max_deliver = 1;
                jsi.config.flow_control = true;
                jsi.config.idle_heartbeat = jsi.config.idle_heartbeat || (0, util_1.nanos)(5000);
                jsi.config.ack_wait = (0, util_1.nanos)(22 * 60 * 60 * 1000);
                jsi.config.mem_storage = true;
                jsi.config.num_replicas = 1;
            }
            if (jsi.config.ack_policy === jsapi_types_1.AckPolicy.NotSet) {
                jsi.config.ack_policy = jsapi_types_1.AckPolicy.All;
            }
            jsi.api = this;
            jsi.config = jsi.config || {};
            jsi.stream = jsi.stream ? jsi.stream : yield this.findStream(subject);
            jsi.attached = false;
            if (jsi.config.durable_name) {
                try {
                    const info = yield this.consumerAPI.info(jsi.stream, jsi.config.durable_name);
                    if (info) {
                        if (info.config.filter_subject && info.config.filter_subject !== subject) {
                            throw new Error("subject does not match consumer");
                        }
                        // check if server returned push_bound, but there's no qn
                        const qn = (_a = jsi.config.deliver_group) !== null && _a !== void 0 ? _a : "";
                        if (qn === "" && info.push_bound === true) {
                            throw new Error(`duplicate subscription`);
                        }
                        const rqn = (_b = info.config.deliver_group) !== null && _b !== void 0 ? _b : "";
                        if (qn !== rqn) {
                            if (rqn === "") {
                                throw new Error(`durable requires no queue group`);
                            } else {
                                throw new Error(`durable requires queue group '${rqn}'`);
                            }
                        }
                        jsi.last = info;
                        jsi.config = info.config;
                        jsi.attached = true;
                        // if not a durable capture the name of the ephemeral so
                        // that consumerInfo from the sub will work
                        if (!jsi.config.durable_name) {
                            jsi.name = info.name;
                        }
                    }
                } catch (err) {
                    //consumer doesn't exist
                    if (err.code !== "404") {
                        throw err;
                    }
                }
            }
            if (!jsi.attached && jsi.config.filter_subject === undefined && jsi.config.filter_subjects === undefined) {
                // if no filter specified, we set the subject as the filter
                jsi.config.filter_subject = subject;
            }
            jsi.deliver = jsi.config.deliver_subject || (0, core_1.createInbox)(this.nc.options.inboxPrefix);
            return jsi;
        });
    }
    _buildTypedSubscriptionOpts(jsi) {
        const so = {};
        so.adapter = msgAdapter(jsi.callbackFn === undefined, this.timeout);
        so.ingestionFilterFn = JetStreamClientImpl.ingestionFn(jsi.ordered);
        so.protocolFilterFn = (jm, ingest = false)=>{
            const jsmi = jm;
            if ((0, jsutil_1.isFlowControlMsg)(jsmi.msg)) {
                if (!ingest) {
                    jsmi.msg.respond();
                }
                return false;
            }
            return true;
        };
        if (!jsi.mack && jsi.config.ack_policy !== jsapi_types_1.AckPolicy.None) {
            so.dispatchedFn = autoAckJsMsg;
        }
        if (jsi.callbackFn) {
            so.callback = jsi.callbackFn;
        }
        so.max = jsi.max || 0;
        so.queue = jsi.queue;
        return so;
    }
    _maybeCreateConsumer(jsi) {
        return __awaiter(this, void 0, void 0, function*() {
            if (jsi.attached) {
                return;
            }
            if (jsi.isBind) {
                throw new Error(`unable to bind - durable consumer ${jsi.config.durable_name} doesn't exist in ${jsi.stream}`);
            }
            jsi.config = Object.assign({
                deliver_policy: jsapi_types_1.DeliverPolicy.All,
                ack_policy: jsapi_types_1.AckPolicy.Explicit,
                ack_wait: (0, util_1.nanos)(30 * 1000),
                replay_policy: jsapi_types_1.ReplayPolicy.Instant
            }, jsi.config);
            const ci = yield this.consumerAPI.add(jsi.stream, jsi.config);
            if (Array.isArray(jsi.config.filter_subjects && !Array.isArray(ci.config.filter_subjects))) {
                // server didn't honor `filter_subjects`
                throw new Error(`jetstream server doesn't support consumers with multiple filter subjects`);
            }
            jsi.name = ci.name;
            jsi.config = ci.config;
            jsi.last = ci;
        });
    }
    static ingestionFn(ordered) {
        return (jm, ctx)=>{
            var _a;
            // ctx is expected to be the iterator (the JetstreamSubscriptionImpl)
            const jsub = ctx;
            // this shouldn't happen
            if (!jm) return {
                ingest: false,
                protocol: false
            };
            const jmi = jm;
            if (!(0, jsutil_1.checkJsError)(jmi.msg)) {
                (_a = jsub.monitor) === null || _a === void 0 ? void 0 : _a.work();
            }
            if ((0, jsutil_1.isHeartbeatMsg)(jmi.msg)) {
                const ingest = ordered ? jsub._checkHbOrderConsumer(jmi.msg) : true;
                if (!ordered) {
                    jsub.info.flow_control.heartbeat_count++;
                }
                return {
                    ingest,
                    protocol: true
                };
            } else if ((0, jsutil_1.isFlowControlMsg)(jmi.msg)) {
                jsub.info.flow_control.fc_count++;
                return {
                    ingest: true,
                    protocol: true
                };
            }
            const ingest = ordered ? jsub._checkOrderedConsumer(jm) : true;
            return {
                ingest,
                protocol: false
            };
        };
    }
}
exports.JetStreamClientImpl = JetStreamClientImpl;
class JetStreamSubscriptionImpl extends typedsub_1.TypedSubscription {
    constructor(js, subject, opts){
        super(js.nc, subject, opts);
        this.js = js;
        this.monitor = null;
        this.sub.closed.then(()=>{
            if (this.monitor) {
                this.monitor.cancel();
            }
        });
    }
    set info(info) {
        this.sub.info = info;
    }
    get info() {
        return this.sub.info;
    }
    _resetOrderedConsumer(sseq) {
        if (this.info === null || this.sub.isClosed()) {
            return;
        }
        const newDeliver = (0, core_1.createInbox)(this.js.nc.options.inboxPrefix);
        const nci = this.js.nc;
        nci._resub(this.sub, newDeliver);
        const info = this.info;
        info.config.name = nuid_1.nuid.next();
        info.ordered_consumer_sequence.delivery_seq = 0;
        info.flow_control.heartbeat_count = 0;
        info.flow_control.fc_count = 0;
        info.flow_control.consumer_restarts++;
        info.deliver = newDeliver;
        info.config.deliver_subject = newDeliver;
        info.config.deliver_policy = jsapi_types_1.DeliverPolicy.StartSequence;
        info.config.opt_start_seq = sseq;
        // put the stream name
        const req = {};
        req.stream_name = this.info.stream;
        req.config = info.config;
        const subj = `${info.api.prefix}.CONSUMER.CREATE.${info.stream}`;
        this.js._request(subj, req, {
            retries: -1
        }).then((v)=>{
            const ci = v;
            const jinfo = this.sub.info;
            jinfo.last = ci;
            this.info.config = ci.config;
            this.info.name = ci.name;
        }).catch((err)=>{
            // to inform the subscription we inject an error this will
            // be at after the last message if using an iterator.
            const nerr = new types_1.NatsError(`unable to recreate ordered consumer ${info.stream} at seq ${sseq}`, core_1.ErrorCode.RequestError, err);
            this.sub.callback(nerr, {});
        });
    }
    // this is called by push subscriptions, to initialize the monitoring
    // if configured on the consumer
    _maybeSetupHbMonitoring() {
        var _a, _b;
        const ns = ((_b = (_a = this.info) === null || _a === void 0 ? void 0 : _a.config) === null || _b === void 0 ? void 0 : _b.idle_heartbeat) || 0;
        if (ns) {
            this._setupHbMonitoring((0, util_1.millis)(ns));
        }
    }
    _setupHbMonitoring(millis, cancelAfter = 0) {
        const opts = {
            cancelAfter: 0,
            maxOut: 2
        };
        if (cancelAfter) {
            opts.cancelAfter = cancelAfter;
        }
        const sub = this.sub;
        const handler = (v)=>{
            var _a, _b, _c, _d;
            const msg = (0, jsutil_1.newJsErrorMsg)(409, `${jsutil_1.Js409Errors.IdleHeartbeatMissed}: ${v}`, this.sub.subject);
            const ordered = (_a = this.info) === null || _a === void 0 ? void 0 : _a.ordered;
            // non-ordered consumers are always notified of the condition
            // as they need to try and recover
            if (!ordered) {
                this.sub.callback(null, msg);
            } else {
                if (!this.js.nc.protocol.connected) {
                    // we are not connected don't do anything
                    return false;
                }
                // reset the consumer
                const seq = ((_c = (_b = this.info) === null || _b === void 0 ? void 0 : _b.ordered_consumer_sequence) === null || _c === void 0 ? void 0 : _c.stream_seq) || 0;
                this._resetOrderedConsumer(seq + 1);
                (_d = this.monitor) === null || _d === void 0 ? void 0 : _d.restart();
                // if we are ordered, we will reset the consumer and keep
                // feeding the iterator or callback - we are not stopping
                return false;
            }
            // let the hb monitor know if we are stopping for callbacks
            // we don't as we deliver the errors via the cb.
            return !sub.noIterator;
        };
        // this only applies for push subscriptions
        this.monitor = new idleheartbeat_monitor_1.IdleHeartbeatMonitor(millis, handler, opts);
    }
    _checkHbOrderConsumer(msg) {
        const rm = msg.headers.get(types_2.JsHeaders.ConsumerStalledHdr);
        if (rm !== "") {
            const nci = this.js.nc;
            nci.publish(rm);
        }
        const lastDelivered = parseInt(msg.headers.get(types_2.JsHeaders.LastConsumerSeqHdr), 10);
        const ordered = this.info.ordered_consumer_sequence;
        this.info.flow_control.heartbeat_count++;
        if (lastDelivered !== ordered.delivery_seq) {
            this._resetOrderedConsumer(ordered.stream_seq + 1);
        }
        return false;
    }
    _checkOrderedConsumer(jm) {
        const ordered = this.info.ordered_consumer_sequence;
        const sseq = jm.info.streamSequence;
        const dseq = jm.info.deliverySequence;
        if (dseq != ordered.delivery_seq + 1) {
            this._resetOrderedConsumer(ordered.stream_seq + 1);
            return false;
        }
        ordered.delivery_seq = dseq;
        ordered.stream_seq = sseq;
        return true;
    }
    destroy() {
        return __awaiter(this, void 0, void 0, function*() {
            if (!this.isClosed()) {
                yield this.drain();
            }
            const jinfo = this.sub.info;
            const name = jinfo.config.durable_name || jinfo.name;
            const subj = `${jinfo.api.prefix}.CONSUMER.DELETE.${jinfo.stream}.${name}`;
            yield jinfo.api._request(subj);
        });
    }
    consumerInfo() {
        return __awaiter(this, void 0, void 0, function*() {
            const jinfo = this.sub.info;
            const name = jinfo.config.durable_name || jinfo.name;
            const subj = `${jinfo.api.prefix}.CONSUMER.INFO.${jinfo.stream}.${name}`;
            const ci = yield jinfo.api._request(subj);
            jinfo.last = ci;
            return ci;
        });
    }
}
exports.JetStreamSubscriptionImpl = JetStreamSubscriptionImpl;
class JetStreamPullSubscriptionImpl extends JetStreamSubscriptionImpl {
    constructor(js, subject, opts){
        super(js, subject, opts);
    }
    pull(opts = {
        batch: 1
    }) {
        var _a, _b;
        const { stream, config, name } = this.sub.info;
        const consumer = (_a = config.durable_name) !== null && _a !== void 0 ? _a : name;
        const args = {};
        args.batch = opts.batch || 1;
        args.no_wait = opts.no_wait || false;
        if (((_b = opts.max_bytes) !== null && _b !== void 0 ? _b : 0) > 0) {
            const fv = this.js.nc.features.get(semver_1.Feature.JS_PULL_MAX_BYTES);
            if (!fv.ok) {
                throw new Error(`max_bytes is only supported on servers ${fv.min} or better`);
            }
            args.max_bytes = opts.max_bytes;
        }
        let expires = 0;
        if (opts.expires && opts.expires > 0) {
            expires = opts.expires;
            args.expires = (0, util_1.nanos)(expires);
        }
        let hb = 0;
        if (opts.idle_heartbeat && opts.idle_heartbeat > 0) {
            hb = opts.idle_heartbeat;
            args.idle_heartbeat = (0, util_1.nanos)(hb);
        }
        if (hb && expires === 0) {
            throw new Error("idle_heartbeat requires expires");
        }
        if (hb > expires) {
            throw new Error("expires must be greater than idle_heartbeat");
        }
        if (this.info) {
            if (this.monitor) {
                this.monitor.cancel();
            }
            if (expires && hb) {
                if (!this.monitor) {
                    this._setupHbMonitoring(hb, expires);
                } else {
                    this.monitor._change(hb, expires);
                }
            }
            const api = this.info.api;
            const subj = `${api.prefix}.CONSUMER.MSG.NEXT.${stream}.${consumer}`;
            const reply = this.sub.subject;
            api.nc.publish(subj, api.jc.encode(args), {
                reply: reply
            });
        }
    }
}
function msgAdapter(iterator, ackTimeout) {
    if (iterator) {
        return iterMsgAdapter(ackTimeout);
    } else {
        return cbMsgAdapter(ackTimeout);
    }
}
function cbMsgAdapter(ackTimeout) {
    return (err, msg)=>{
        if (err) {
            return [
                err,
                null
            ];
        }
        err = (0, jsutil_1.checkJsError)(msg);
        if (err) {
            return [
                err,
                null
            ];
        }
        // assuming that the protocolFilterFn is set!
        return [
            null,
            (0, jsmsg_1.toJsMsg)(msg, ackTimeout)
        ];
    };
}
function iterMsgAdapter(ackTimeout) {
    return (err, msg)=>{
        if (err) {
            return [
                err,
                null
            ];
        }
        // iterator will close if we have an error
        // check for errors that shouldn't close it
        const ne = (0, jsutil_1.checkJsError)(msg);
        if (ne !== null) {
            return [
                hideNonTerminalJsErrors(ne),
                null
            ];
        }
        // assuming that the protocolFilterFn is set
        return [
            null,
            (0, jsmsg_1.toJsMsg)(msg, ackTimeout)
        ];
    };
}
function hideNonTerminalJsErrors(ne) {
    if (ne !== null) {
        switch(ne.code){
            case core_1.ErrorCode.JetStream404NoMessages:
            case core_1.ErrorCode.JetStream408RequestTimeout:
                return null;
            case core_1.ErrorCode.JetStream409:
                if ((0, jsutil_1.isTerminal409)(ne)) {
                    return ne;
                }
                return null;
            default:
                return ne;
        }
    }
    return null;
}
function autoAckJsMsg(data) {
    if (data) {
        data.ack();
    }
} //# sourceMappingURL=jsclient.js.map
}),
"[project]/dawg-ai/node_modules/nats/lib/jetstream/kv.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

/*
 * Copyright 2021-2024 The NATS Authors
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
 */ var __awaiter = /*TURBOPACK member replacement*/ __turbopack_context__.e && /*TURBOPACK member replacement*/ __turbopack_context__.e.__awaiter || function(thisArg, _arguments, P, generator) {
    function adopt(value) {
        return value instanceof P ? value : new P(function(resolve) {
            resolve(value);
        });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
        function fulfilled(value) {
            try {
                step(generator.next(value));
            } catch (e) {
                reject(e);
            }
        }
        function rejected(value) {
            try {
                step(generator["throw"](value));
            } catch (e) {
                reject(e);
            }
        }
        function step(result) {
            result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = /*TURBOPACK member replacement*/ __turbopack_context__.e && /*TURBOPACK member replacement*/ __turbopack_context__.e.__asyncValues || function(o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function() {
        return this;
    }, i);
    //TURBOPACK unreachable
    ;
    function verb(n) {
        i[n] = o[n] && function(v) {
            return new Promise(function(resolve, reject) {
                v = o[n](v), settle(resolve, reject, v.done, v.value);
            });
        };
    }
    function settle(resolve, reject, d, v) {
        Promise.resolve(v).then(function(v) {
            resolve({
                value: v,
                done: d
            });
        }, reject);
    }
};
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.KvStatusImpl = exports.Bucket = exports.kvOperationHdr = void 0;
exports.Base64KeyCodec = Base64KeyCodec;
exports.NoopKvCodecs = NoopKvCodecs;
exports.defaultBucketOpts = defaultBucketOpts;
exports.validateKey = validateKey;
exports.validateSearchKey = validateSearchKey;
exports.hasWildcards = hasWildcards;
exports.validateBucket = validateBucket;
const core_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/core.js [app-ssr] (ecmascript)");
const queued_iterator_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/queued_iterator.js [app-ssr] (ecmascript)");
const headers_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/headers.js [app-ssr] (ecmascript)");
const types_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/jetstream/types.js [app-ssr] (ecmascript)");
const semver_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/semver.js [app-ssr] (ecmascript)");
const util_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/util.js [app-ssr] (ecmascript)");
const encoders_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/encoders.js [app-ssr] (ecmascript)");
const jsapi_types_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/jetstream/jsapi_types.js [app-ssr] (ecmascript)");
const jsclient_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/jetstream/jsclient.js [app-ssr] (ecmascript)");
const nuid_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/nuid.js [app-ssr] (ecmascript)");
function Base64KeyCodec() {
    return {
        encode (key) {
            return btoa(key);
        },
        decode (bkey) {
            return atob(bkey);
        }
    };
}
function NoopKvCodecs() {
    return {
        key: {
            encode (k) {
                return k;
            },
            decode (k) {
                return k;
            }
        },
        value: {
            encode (v) {
                return v;
            },
            decode (v) {
                return v;
            }
        }
    };
}
function defaultBucketOpts() {
    return {
        replicas: 1,
        history: 1,
        timeout: 2000,
        max_bytes: -1,
        maxValueSize: -1,
        codec: NoopKvCodecs(),
        storage: jsapi_types_1.StorageType.File
    };
}
exports.kvOperationHdr = "KV-Operation";
const kvSubjectPrefix = "$KV";
const validKeyRe = /^[-/=.\w]+$/;
const validSearchKey = /^[-/=.>*\w]+$/;
const validBucketRe = /^[-\w]+$/;
// this exported for tests
function validateKey(k) {
    if (k.startsWith(".") || k.endsWith(".") || !validKeyRe.test(k)) {
        throw new Error(`invalid key: ${k}`);
    }
}
function validateSearchKey(k) {
    if (k.startsWith(".") || k.endsWith(".") || !validSearchKey.test(k)) {
        throw new Error(`invalid key: ${k}`);
    }
}
function hasWildcards(k) {
    if (k.startsWith(".") || k.endsWith(".")) {
        throw new Error(`invalid key: ${k}`);
    }
    const chunks = k.split(".");
    let hasWildcards = false;
    for(let i = 0; i < chunks.length; i++){
        switch(chunks[i]){
            case "*":
                hasWildcards = true;
                break;
            case ">":
                if (i !== chunks.length - 1) {
                    throw new Error(`invalid key: ${k}`);
                }
                hasWildcards = true;
                break;
            default:
        }
    }
    return hasWildcards;
}
// this exported for tests
function validateBucket(name) {
    if (!validBucketRe.test(name)) {
        throw new Error(`invalid bucket name: ${name}`);
    }
}
class Bucket {
    constructor(bucket, js, jsm){
        this.validateKey = validateKey;
        this.validateSearchKey = validateSearchKey;
        this.hasWildcards = hasWildcards;
        validateBucket(bucket);
        this.js = js;
        this.jsm = jsm;
        this.bucket = bucket;
        this.prefix = kvSubjectPrefix;
        this.editPrefix = "";
        this.useJsPrefix = false;
        this._prefixLen = 0;
    }
    static create(js_1, name_1) {
        return __awaiter(this, arguments, void 0, function*(js, name, opts = {}) {
            validateBucket(name);
            const jsm = yield js.jetstreamManager();
            const bucket = new Bucket(name, js, jsm);
            yield bucket.init(opts);
            return bucket;
        });
    }
    static bind(js_1, name_1) {
        return __awaiter(this, arguments, void 0, function*(js, name, opts = {}) {
            var _a, _b;
            const jsm = yield js.jetstreamManager();
            const info = {
                config: {
                    allow_direct: opts.allow_direct
                }
            };
            validateBucket(name);
            const bucket = new Bucket(name, js, jsm);
            info.config.name = (_a = opts.streamName) !== null && _a !== void 0 ? _a : bucket.bucketName();
            Object.assign(bucket, info);
            bucket.stream = info.config.name;
            bucket.codec = opts.codec || NoopKvCodecs();
            bucket.direct = (_b = info.config.allow_direct) !== null && _b !== void 0 ? _b : false;
            bucket.initializePrefixes(info);
            return bucket;
        });
    }
    init() {
        return __awaiter(this, arguments, void 0, function*(opts = {}) {
            var _a, _b;
            const bo = Object.assign(defaultBucketOpts(), opts);
            this.codec = bo.codec;
            const sc = {};
            this.stream = sc.name = (_a = opts.streamName) !== null && _a !== void 0 ? _a : this.bucketName();
            sc.retention = jsapi_types_1.RetentionPolicy.Limits;
            sc.max_msgs_per_subject = bo.history;
            if (bo.maxBucketSize) {
                bo.max_bytes = bo.maxBucketSize;
            }
            if (bo.max_bytes) {
                sc.max_bytes = bo.max_bytes;
            }
            sc.max_msg_size = bo.maxValueSize;
            sc.storage = bo.storage;
            const location = (_b = opts.placementCluster) !== null && _b !== void 0 ? _b : "";
            if (location) {
                opts.placement = {};
                opts.placement.cluster = location;
                opts.placement.tags = [];
            }
            if (opts.placement) {
                sc.placement = opts.placement;
            }
            if (opts.republish) {
                sc.republish = opts.republish;
            }
            if (opts.description) {
                sc.description = opts.description;
            }
            if (opts.mirror) {
                const mirror = Object.assign({}, opts.mirror);
                if (!mirror.name.startsWith(types_1.kvPrefix)) {
                    mirror.name = `${types_1.kvPrefix}${mirror.name}`;
                }
                sc.mirror = mirror;
                sc.mirror_direct = true;
            } else if (opts.sources) {
                const sources = opts.sources.map((s)=>{
                    const c = Object.assign({}, s);
                    const srcBucketName = c.name.startsWith(types_1.kvPrefix) ? c.name.substring(types_1.kvPrefix.length) : c.name;
                    if (!c.name.startsWith(types_1.kvPrefix)) {
                        c.name = `${types_1.kvPrefix}${c.name}`;
                    }
                    if (!s.external && srcBucketName !== this.bucket) {
                        c.subject_transforms = [
                            {
                                src: `$KV.${srcBucketName}.>`,
                                dest: `$KV.${this.bucket}.>`
                            }
                        ];
                    }
                    return c;
                });
                sc.sources = sources;
                sc.subjects = [
                    this.subjectForBucket()
                ];
            } else {
                sc.subjects = [
                    this.subjectForBucket()
                ];
            }
            if (opts.metadata) {
                sc.metadata = opts.metadata;
            }
            if (typeof opts.compression === "boolean") {
                sc.compression = opts.compression ? jsapi_types_1.StoreCompression.S2 : jsapi_types_1.StoreCompression.None;
            }
            const nci = this.js.nc;
            const have = nci.getServerVersion();
            const discardNew = have ? (0, semver_1.compare)(have, (0, semver_1.parseSemVer)("2.7.2")) >= 0 : false;
            sc.discard = discardNew ? jsapi_types_1.DiscardPolicy.New : jsapi_types_1.DiscardPolicy.Old;
            const { ok: direct, min } = nci.features.get(semver_1.Feature.JS_ALLOW_DIRECT);
            if (!direct && opts.allow_direct === true) {
                const v = have ? `${have.major}.${have.minor}.${have.micro}` : "unknown";
                return Promise.reject(new Error(`allow_direct is not available on server version ${v} - requires ${min}`));
            }
            // if we are given allow_direct we use it, otherwise what
            // the server supports - in creation this will always rule,
            // but allows the client to opt-in even if it is already
            // available on the stream
            opts.allow_direct = typeof opts.allow_direct === "boolean" ? opts.allow_direct : direct;
            sc.allow_direct = opts.allow_direct;
            this.direct = sc.allow_direct;
            sc.num_replicas = bo.replicas;
            if (bo.ttl) {
                sc.max_age = (0, util_1.nanos)(bo.ttl);
            }
            sc.allow_rollup_hdrs = true;
            let info;
            try {
                info = yield this.jsm.streams.info(sc.name);
                if (!info.config.allow_direct && this.direct === true) {
                    this.direct = false;
                }
            } catch (err) {
                if (err.message === "stream not found") {
                    info = yield this.jsm.streams.add(sc);
                } else {
                    throw err;
                }
            }
            this.initializePrefixes(info);
        });
    }
    initializePrefixes(info) {
        this._prefixLen = 0;
        this.prefix = `$KV.${this.bucket}`;
        this.useJsPrefix = this.js.apiPrefix !== "$JS.API";
        const { mirror } = info.config;
        if (mirror) {
            let n = mirror.name;
            if (n.startsWith(types_1.kvPrefix)) {
                n = n.substring(types_1.kvPrefix.length);
            }
            if (mirror.external && mirror.external.api !== "") {
                const mb = mirror.name.substring(types_1.kvPrefix.length);
                this.useJsPrefix = false;
                this.prefix = `$KV.${mb}`;
                this.editPrefix = `${mirror.external.api}.$KV.${n}`;
            } else {
                this.editPrefix = this.prefix;
            }
        }
    }
    bucketName() {
        var _a;
        return (_a = this.stream) !== null && _a !== void 0 ? _a : `${types_1.kvPrefix}${this.bucket}`;
    }
    subjectForBucket() {
        return `${this.prefix}.${this.bucket}.>`;
    }
    subjectForKey(k, edit = false) {
        const builder = [];
        if (edit) {
            if (this.useJsPrefix) {
                builder.push(this.js.apiPrefix);
            }
            if (this.editPrefix !== "") {
                builder.push(this.editPrefix);
            } else {
                builder.push(this.prefix);
            }
        } else {
            if (this.prefix) {
                builder.push(this.prefix);
            }
        }
        builder.push(k);
        return builder.join(".");
    }
    fullKeyName(k) {
        if (this.prefix !== "") {
            return `${this.prefix}.${k}`;
        }
        return `${kvSubjectPrefix}.${this.bucket}.${k}`;
    }
    get prefixLen() {
        if (this._prefixLen === 0) {
            this._prefixLen = this.prefix.length + 1;
        }
        return this._prefixLen;
    }
    encodeKey(key) {
        const chunks = [];
        for (const t of key.split(".")){
            switch(t){
                case ">":
                case "*":
                    chunks.push(t);
                    break;
                default:
                    chunks.push(this.codec.key.encode(t));
                    break;
            }
        }
        return chunks.join(".");
    }
    decodeKey(ekey) {
        const chunks = [];
        for (const t of ekey.split(".")){
            switch(t){
                case ">":
                case "*":
                    chunks.push(t);
                    break;
                default:
                    chunks.push(this.codec.key.decode(t));
                    break;
            }
        }
        return chunks.join(".");
    }
    close() {
        return Promise.resolve();
    }
    dataLen(data, h) {
        const slen = h ? h.get(types_1.JsHeaders.MessageSizeHdr) || "" : "";
        if (slen !== "") {
            return parseInt(slen, 10);
        }
        return data.length;
    }
    smToEntry(sm) {
        return new KvStoredEntryImpl(this.bucket, this.prefixLen, sm);
    }
    jmToEntry(jm) {
        const key = this.decodeKey(jm.subject.substring(this.prefixLen));
        return new KvJsMsgEntryImpl(this.bucket, key, jm);
    }
    create(k, data) {
        return __awaiter(this, void 0, void 0, function*() {
            var _a;
            let firstErr;
            try {
                const n = yield this.put(k, data, {
                    previousSeq: 0
                });
                return Promise.resolve(n);
            } catch (err) {
                firstErr = err;
                if (((_a = err === null || err === void 0 ? void 0 : err.api_error) === null || _a === void 0 ? void 0 : _a.err_code) !== 10071) {
                    return Promise.reject(err);
                }
            }
            let rev = 0;
            try {
                const e = yield this.get(k);
                if ((e === null || e === void 0 ? void 0 : e.operation) === "DEL" || (e === null || e === void 0 ? void 0 : e.operation) === "PURGE") {
                    rev = e !== null ? e.revision : 0;
                    return this.update(k, data, rev);
                } else {
                    return Promise.reject(firstErr);
                }
            } catch (err) {
                return Promise.reject(err);
            }
        });
    }
    update(k, data, version) {
        if (version <= 0) {
            throw new Error("version must be greater than 0");
        }
        return this.put(k, data, {
            previousSeq: version
        });
    }
    put(k_1, data_1) {
        return __awaiter(this, arguments, void 0, function*(k, data, opts = {}) {
            var _a, _b;
            const ek = this.encodeKey(k);
            this.validateKey(ek);
            const o = {};
            if (opts.previousSeq !== undefined) {
                const h = (0, headers_1.headers)();
                o.headers = h;
                h.set(jsclient_1.PubHeaders.ExpectedLastSubjectSequenceHdr, `${opts.previousSeq}`);
            }
            try {
                const pa = yield this.js.publish(this.subjectForKey(ek, true), data, o);
                return pa.seq;
            } catch (err) {
                const ne = err;
                if (ne.isJetStreamError()) {
                    ne.message = (_a = ne.api_error) === null || _a === void 0 ? void 0 : _a.description;
                    ne.code = `${(_b = ne.api_error) === null || _b === void 0 ? void 0 : _b.code}`;
                    return Promise.reject(ne);
                }
                return Promise.reject(err);
            }
        });
    }
    get(k, opts) {
        return __awaiter(this, void 0, void 0, function*() {
            const ek = this.encodeKey(k);
            this.validateKey(ek);
            let arg = {
                last_by_subj: this.subjectForKey(ek)
            };
            if (opts && opts.revision > 0) {
                arg = {
                    seq: opts.revision
                };
            }
            let sm;
            try {
                if (this.direct) {
                    const direct = this.jsm.direct;
                    sm = yield direct.getMessage(this.bucketName(), arg);
                } else {
                    sm = yield this.jsm.streams.getMessage(this.bucketName(), arg);
                }
                const ke = this.smToEntry(sm);
                if (ke.key !== ek) {
                    return null;
                }
                return ke;
            } catch (err) {
                if (err.code === core_1.ErrorCode.JetStream404NoMessages) {
                    return null;
                }
                throw err;
            }
        });
    }
    purge(k, opts) {
        return this._deleteOrPurge(k, "PURGE", opts);
    }
    delete(k, opts) {
        return this._deleteOrPurge(k, "DEL", opts);
    }
    purgeDeletes() {
        return __awaiter(this, arguments, void 0, function*(olderMillis = 30 * 60 * 1000) {
            const done = (0, util_1.deferred)();
            const buf = [];
            const i = yield this.watch({
                key: ">",
                initializedFn: ()=>{
                    done.resolve();
                }
            });
            (()=>__awaiter(this, void 0, void 0, function*() {
                    var _a, e_1, _b, _c;
                    try {
                        for(var _d = true, i_1 = __asyncValues(i), i_1_1; i_1_1 = yield i_1.next(), _a = i_1_1.done, !_a; _d = true){
                            _c = i_1_1.value;
                            _d = false;
                            const e = _c;
                            if (e.operation === "DEL" || e.operation === "PURGE") {
                                buf.push(e);
                            }
                        }
                    } catch (e_1_1) {
                        e_1 = {
                            error: e_1_1
                        };
                    } finally{
                        try {
                            if (!_d && !_a && (_b = i_1.return)) yield _b.call(i_1);
                        } finally{
                            if (e_1) throw e_1.error;
                        }
                    }
                }))().then();
            yield done;
            i.stop();
            const min = Date.now() - olderMillis;
            const proms = buf.map((e)=>{
                const subj = this.subjectForKey(e.key);
                if (e.created.getTime() >= min) {
                    return this.jsm.streams.purge(this.stream, {
                        filter: subj,
                        keep: 1
                    });
                } else {
                    return this.jsm.streams.purge(this.stream, {
                        filter: subj,
                        keep: 0
                    });
                }
            });
            const purged = yield Promise.all(proms);
            purged.unshift({
                success: true,
                purged: 0
            });
            return purged.reduce((pv, cv)=>{
                pv.purged += cv.purged;
                return pv;
            });
        });
    }
    _deleteOrPurge(k, op, opts) {
        return __awaiter(this, void 0, void 0, function*() {
            var _a, e_2, _b, _c;
            if (!this.hasWildcards(k)) {
                return this._doDeleteOrPurge(k, op, opts);
            }
            const iter = yield this.keys(k);
            const buf = [];
            try {
                for(var _d = true, iter_1 = __asyncValues(iter), iter_1_1; iter_1_1 = yield iter_1.next(), _a = iter_1_1.done, !_a; _d = true){
                    _c = iter_1_1.value;
                    _d = false;
                    const k = _c;
                    buf.push(this._doDeleteOrPurge(k, op));
                    if (buf.length === 100) {
                        yield Promise.all(buf);
                        buf.length = 0;
                    }
                }
            } catch (e_2_1) {
                e_2 = {
                    error: e_2_1
                };
            } finally{
                try {
                    if (!_d && !_a && (_b = iter_1.return)) yield _b.call(iter_1);
                } finally{
                    if (e_2) throw e_2.error;
                }
            }
            if (buf.length > 0) {
                yield Promise.all(buf);
            }
        });
    }
    _doDeleteOrPurge(k, op, opts) {
        return __awaiter(this, void 0, void 0, function*() {
            const ek = this.encodeKey(k);
            this.validateKey(ek);
            const h = (0, headers_1.headers)();
            h.set(exports.kvOperationHdr, op);
            if (op === "PURGE") {
                h.set(types_1.JsHeaders.RollupHdr, types_1.JsHeaders.RollupValueSubject);
            }
            if (opts === null || opts === void 0 ? void 0 : opts.previousSeq) {
                h.set(jsclient_1.PubHeaders.ExpectedLastSubjectSequenceHdr, `${opts.previousSeq}`);
            }
            yield this.js.publish(this.subjectForKey(ek, true), encoders_1.Empty, {
                headers: h
            });
        });
    }
    _buildCC(k, content, opts = {}) {
        const a = !Array.isArray(k) ? [
            k
        ] : k;
        let filter_subjects = a.map((k)=>{
            const ek = this.encodeKey(k);
            this.validateSearchKey(k);
            return this.fullKeyName(ek);
        });
        let deliver_policy = jsapi_types_1.DeliverPolicy.LastPerSubject;
        if (content === types_1.KvWatchInclude.AllHistory) {
            deliver_policy = jsapi_types_1.DeliverPolicy.All;
        }
        if (content === types_1.KvWatchInclude.UpdatesOnly) {
            deliver_policy = jsapi_types_1.DeliverPolicy.New;
        }
        let filter_subject = undefined;
        if (filter_subjects.length === 1) {
            filter_subject = filter_subjects[0];
            filter_subjects = undefined;
        }
        return Object.assign({
            deliver_policy,
            "ack_policy": jsapi_types_1.AckPolicy.None,
            filter_subjects,
            filter_subject,
            "flow_control": true,
            "idle_heartbeat": (0, util_1.nanos)(5 * 1000)
        }, opts);
    }
    remove(k) {
        return this.purge(k);
    }
    history() {
        return __awaiter(this, arguments, void 0, function*(opts = {}) {
            var _a;
            const k = (_a = opts.key) !== null && _a !== void 0 ? _a : ">";
            const qi = new queued_iterator_1.QueuedIteratorImpl();
            const co = {};
            co.headers_only = opts.headers_only || false;
            let fn;
            fn = ()=>{
                qi.stop();
            };
            let count = 0;
            const cc = this._buildCC(k, types_1.KvWatchInclude.AllHistory, co);
            const subj = cc.filter_subject;
            const copts = (0, types_1.consumerOpts)(cc);
            copts.bindStream(this.stream);
            copts.orderedConsumer();
            copts.callback((err, jm)=>{
                if (err) {
                    // sub done
                    qi.stop(err);
                    return;
                }
                if (jm) {
                    const e = this.jmToEntry(jm);
                    qi.push(e);
                    qi.received++;
                    //@ts-ignore - function will be removed
                    if (fn && count > 0 && qi.received >= count || jm.info.pending === 0) {
                        //@ts-ignore: we are injecting an unexpected type
                        qi.push(fn);
                        fn = undefined;
                    }
                }
            });
            const sub = yield this.js.subscribe(subj, copts);
            // by the time we are here, likely the subscription got messages
            if (fn) {
                const { info: { last } } = sub;
                // this doesn't sound correct - we should be looking for a seq number instead
                // then if we see a greater one, we are done.
                const expect = last.num_pending + last.delivered.consumer_seq;
                // if the iterator already queued - the only issue is other modifications
                // did happen like stream was pruned, and the ordered consumer reset, etc
                // we won't get what we are expecting - so the notification will never fire
                // the sentinel ought to be coming from the server
                if (expect === 0 || qi.received >= expect) {
                    try {
                        fn();
                    } catch (err) {
                        // fail it - there's something wrong in the user callback
                        qi.stop(err);
                    } finally{
                        fn = undefined;
                    }
                } else {
                    count = expect;
                }
            }
            qi._data = sub;
            qi.iterClosed.then(()=>{
                sub.unsubscribe();
            });
            sub.closed.then(()=>{
                qi.stop();
            }).catch((err)=>{
                qi.stop(err);
            });
            return qi;
        });
    }
    canSetWatcherName() {
        const jsi = this.js;
        const nci = jsi.nc;
        const { ok } = nci.features.get(semver_1.Feature.JS_NEW_CONSUMER_CREATE_API);
        return ok;
    }
    watch() {
        return __awaiter(this, arguments, void 0, function*(opts = {}) {
            var _a;
            const k = (_a = opts.key) !== null && _a !== void 0 ? _a : ">";
            const qi = new queued_iterator_1.QueuedIteratorImpl();
            const co = {};
            co.headers_only = opts.headers_only || false;
            let content = types_1.KvWatchInclude.LastValue;
            if (opts.include === types_1.KvWatchInclude.AllHistory) {
                content = types_1.KvWatchInclude.AllHistory;
            } else if (opts.include === types_1.KvWatchInclude.UpdatesOnly) {
                content = types_1.KvWatchInclude.UpdatesOnly;
            }
            const ignoreDeletes = opts.ignoreDeletes === true;
            let fn = opts.initializedFn;
            let count = 0;
            const cc = this._buildCC(k, content, co);
            const subj = cc.filter_subject;
            const copts = (0, types_1.consumerOpts)(cc);
            if (this.canSetWatcherName()) {
                copts.consumerName(nuid_1.nuid.next());
            }
            copts.bindStream(this.stream);
            if (opts.resumeFromRevision && opts.resumeFromRevision > 0) {
                copts.startSequence(opts.resumeFromRevision);
            }
            copts.orderedConsumer();
            copts.callback((err, jm)=>{
                if (err) {
                    // sub done
                    qi.stop(err);
                    return;
                }
                if (jm) {
                    const e = this.jmToEntry(jm);
                    if (ignoreDeletes && e.operation === "DEL") {
                        return;
                    }
                    qi.push(e);
                    qi.received++;
                    // count could have changed or has already been received
                    if (fn && (count > 0 && qi.received >= count || jm.info.pending === 0)) {
                        //@ts-ignore: we are injecting an unexpected type
                        qi.push(fn);
                        fn = undefined;
                    }
                }
            });
            const sub = yield this.js.subscribe(subj, copts);
            // by the time we are here, likely the subscription got messages
            if (fn) {
                const { info: { last } } = sub;
                // this doesn't sound correct - we should be looking for a seq number instead
                // then if we see a greater one, we are done.
                const expect = last.num_pending + last.delivered.consumer_seq;
                // if the iterator already queued - the only issue is other modifications
                // did happen like stream was pruned, and the ordered consumer reset, etc
                // we won't get what we are expecting - so the notification will never fire
                // the sentinel ought to be coming from the server
                if (expect === 0 || qi.received >= expect) {
                    try {
                        fn();
                    } catch (err) {
                        // fail it - there's something wrong in the user callback
                        qi.stop(err);
                    } finally{
                        fn = undefined;
                    }
                } else {
                    count = expect;
                }
            }
            qi._data = sub;
            qi.iterClosed.then(()=>{
                sub.unsubscribe();
            });
            sub.closed.then(()=>{
                qi.stop();
            }).catch((err)=>{
                qi.stop(err);
            });
            return qi;
        });
    }
    keys() {
        return __awaiter(this, arguments, void 0, function*(k = ">") {
            const keys = new queued_iterator_1.QueuedIteratorImpl();
            const cc = this._buildCC(k, types_1.KvWatchInclude.LastValue, {
                headers_only: true
            });
            const subj = Array.isArray(k) ? ">" : cc.filter_subject;
            const copts = (0, types_1.consumerOpts)(cc);
            copts.bindStream(this.stream);
            copts.orderedConsumer();
            const sub = yield this.js.subscribe(subj, copts);
            (()=>__awaiter(this, void 0, void 0, function*() {
                    var _a, e_3, _b, _c;
                    var _d;
                    try {
                        for(var _e = true, sub_1 = __asyncValues(sub), sub_1_1; sub_1_1 = yield sub_1.next(), _a = sub_1_1.done, !_a; _e = true){
                            _c = sub_1_1.value;
                            _e = false;
                            const jm = _c;
                            const op = (_d = jm.headers) === null || _d === void 0 ? void 0 : _d.get(exports.kvOperationHdr);
                            if (op !== "DEL" && op !== "PURGE") {
                                const key = this.decodeKey(jm.subject.substring(this.prefixLen));
                                keys.push(key);
                            }
                            if (jm.info.pending === 0) {
                                sub.unsubscribe();
                            }
                        }
                    } catch (e_3_1) {
                        e_3 = {
                            error: e_3_1
                        };
                    } finally{
                        try {
                            if (!_e && !_a && (_b = sub_1.return)) yield _b.call(sub_1);
                        } finally{
                            if (e_3) throw e_3.error;
                        }
                    }
                }))().then(()=>{
                keys.stop();
            }).catch((err)=>{
                keys.stop(err);
            });
            const si = sub;
            if (si.info.last.num_pending === 0) {
                sub.unsubscribe();
            }
            return keys;
        });
    }
    purgeBucket(opts) {
        return this.jsm.streams.purge(this.bucketName(), opts);
    }
    destroy() {
        return this.jsm.streams.delete(this.bucketName());
    }
    status() {
        return __awaiter(this, void 0, void 0, function*() {
            var _a, _b;
            const nc = this.js.nc;
            const cluster = (_b = (_a = nc.info) === null || _a === void 0 ? void 0 : _a.cluster) !== null && _b !== void 0 ? _b : "";
            const bn = this.bucketName();
            const si = yield this.jsm.streams.info(bn);
            return new KvStatusImpl(si, cluster);
        });
    }
}
exports.Bucket = Bucket;
class KvStatusImpl {
    constructor(si, cluster = ""){
        this.si = si;
        this.cluster = cluster;
    }
    get bucket() {
        return this.si.config.name.startsWith(types_1.kvPrefix) ? this.si.config.name.substring(types_1.kvPrefix.length) : this.si.config.name;
    }
    get values() {
        return this.si.state.messages;
    }
    get history() {
        return this.si.config.max_msgs_per_subject;
    }
    get ttl() {
        return (0, util_1.millis)(this.si.config.max_age);
    }
    get bucket_location() {
        return this.cluster;
    }
    get backingStore() {
        return this.si.config.storage;
    }
    get storage() {
        return this.si.config.storage;
    }
    get replicas() {
        return this.si.config.num_replicas;
    }
    get description() {
        var _a;
        return (_a = this.si.config.description) !== null && _a !== void 0 ? _a : "";
    }
    get maxBucketSize() {
        return this.si.config.max_bytes;
    }
    get maxValueSize() {
        return this.si.config.max_msg_size;
    }
    get max_bytes() {
        return this.si.config.max_bytes;
    }
    get placement() {
        return this.si.config.placement || {
            cluster: "",
            tags: []
        };
    }
    get placementCluster() {
        var _a, _b;
        return (_b = (_a = this.si.config.placement) === null || _a === void 0 ? void 0 : _a.cluster) !== null && _b !== void 0 ? _b : "";
    }
    get republish() {
        var _a;
        return (_a = this.si.config.republish) !== null && _a !== void 0 ? _a : {
            src: "",
            dest: ""
        };
    }
    get streamInfo() {
        return this.si;
    }
    get size() {
        return this.si.state.bytes;
    }
    get metadata() {
        var _a;
        return (_a = this.si.config.metadata) !== null && _a !== void 0 ? _a : {};
    }
    get compression() {
        if (this.si.config.compression) {
            return this.si.config.compression !== jsapi_types_1.StoreCompression.None;
        }
        return false;
    }
}
exports.KvStatusImpl = KvStatusImpl;
class KvStoredEntryImpl {
    constructor(bucket, prefixLen, sm){
        this.bucket = bucket;
        this.prefixLen = prefixLen;
        this.sm = sm;
    }
    get key() {
        return this.sm.subject.substring(this.prefixLen);
    }
    get value() {
        return this.sm.data;
    }
    get delta() {
        return 0;
    }
    get created() {
        return this.sm.time;
    }
    get revision() {
        return this.sm.seq;
    }
    get operation() {
        return this.sm.header.get(exports.kvOperationHdr) || "PUT";
    }
    get length() {
        const slen = this.sm.header.get(types_1.JsHeaders.MessageSizeHdr) || "";
        if (slen !== "") {
            return parseInt(slen, 10);
        }
        return this.sm.data.length;
    }
    json() {
        return this.sm.json();
    }
    string() {
        return this.sm.string();
    }
}
class KvJsMsgEntryImpl {
    constructor(bucket, key, sm){
        this.bucket = bucket;
        this.key = key;
        this.sm = sm;
    }
    get value() {
        return this.sm.data;
    }
    get created() {
        return new Date((0, util_1.millis)(this.sm.info.timestampNanos));
    }
    get revision() {
        return this.sm.seq;
    }
    get operation() {
        var _a;
        return ((_a = this.sm.headers) === null || _a === void 0 ? void 0 : _a.get(exports.kvOperationHdr)) || "PUT";
    }
    get delta() {
        return this.sm.info.pending;
    }
    get length() {
        var _a;
        const slen = ((_a = this.sm.headers) === null || _a === void 0 ? void 0 : _a.get(types_1.JsHeaders.MessageSizeHdr)) || "";
        if (slen !== "") {
            return parseInt(slen, 10);
        }
        return this.sm.data.length;
    }
    json() {
        return this.sm.json();
    }
    string() {
        return this.sm.string();
    }
} //# sourceMappingURL=kv.js.map
}),
"[project]/dawg-ai/node_modules/nats/lib/jetstream/consumer.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __awaiter = /*TURBOPACK member replacement*/ __turbopack_context__.e && /*TURBOPACK member replacement*/ __turbopack_context__.e.__awaiter || function(thisArg, _arguments, P, generator) {
    function adopt(value) {
        return value instanceof P ? value : new P(function(resolve) {
            resolve(value);
        });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
        function fulfilled(value) {
            try {
                step(generator.next(value));
            } catch (e) {
                reject(e);
            }
        }
        function rejected(value) {
            try {
                step(generator["throw"](value));
            } catch (e) {
                reject(e);
            }
        }
        function step(result) {
            result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = /*TURBOPACK member replacement*/ __turbopack_context__.e && /*TURBOPACK member replacement*/ __turbopack_context__.e.__asyncValues || function(o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function() {
        return this;
    }, i);
    //TURBOPACK unreachable
    ;
    function verb(n) {
        i[n] = o[n] && function(v) {
            return new Promise(function(resolve, reject) {
                v = o[n](v), settle(resolve, reject, v.done, v.value);
            });
        };
    }
    function settle(resolve, reject, d, v) {
        Promise.resolve(v).then(function(v) {
            resolve({
                value: v,
                done: d
            });
        }, reject);
    }
};
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.OrderedPullConsumerImpl = exports.PullConsumerImpl = exports.OrderedConsumerMessages = exports.PullConsumerMessagesImpl = exports.ConsumerDebugEvents = exports.ConsumerEvents = void 0;
/*
 * Copyright 2022-2024 The NATS Authors
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
 */ const util_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/util.js [app-ssr] (ecmascript)");
const nuid_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/nuid.js [app-ssr] (ecmascript)");
const jsutil_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/jetstream/jsutil.js [app-ssr] (ecmascript)");
const queued_iterator_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/queued_iterator.js [app-ssr] (ecmascript)");
const core_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/core.js [app-ssr] (ecmascript)");
const idleheartbeat_monitor_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/idleheartbeat_monitor.js [app-ssr] (ecmascript)");
const jsmsg_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/jetstream/jsmsg.js [app-ssr] (ecmascript)");
const jsapi_types_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/jetstream/jsapi_types.js [app-ssr] (ecmascript)");
const types_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/jetstream/types.js [app-ssr] (ecmascript)");
var PullConsumerType;
(function(PullConsumerType) {
    PullConsumerType[PullConsumerType["Unset"] = -1] = "Unset";
    PullConsumerType[PullConsumerType["Consume"] = 0] = "Consume";
    PullConsumerType[PullConsumerType["Fetch"] = 1] = "Fetch";
})(PullConsumerType || (PullConsumerType = {}));
/**
 * ConsumerEvents are informational notifications emitted by ConsumerMessages
 * that may be of interest to a client.
 */ var ConsumerEvents;
(function(ConsumerEvents) {
    /**
     * Notification that heartbeats were missed. This notification is informational.
     * The `data` portion of the status, is a number indicating the number of missed heartbeats.
     * Note that when a client disconnects, heartbeat tracking is paused while
     * the client is disconnected.
     */ ConsumerEvents["HeartbeatsMissed"] = "heartbeats_missed";
    /**
     * Notification that the consumer was not found. Consumers that were accessible at
     * least once, will be retried for more messages regardless of the not being found
     * or timeouts etc. This notification includes a count of consecutive attempts to
     * find the consumer. Note that if you get this notification possibly your code should
     * attempt to recreate the consumer. Note that this notification is only informational
     * for ordered consumers, as the consumer will be created in those cases automatically.
     */ ConsumerEvents["ConsumerNotFound"] = "consumer_not_found";
    /**
     * Notification that the stream was not found. Consumers were accessible at least once,
     * will be retried for more messages regardless of the not being found
     * or timeouts etc. This notification includes a count of consecutive attempts to
     * find the consumer. Note that if you get this notification possibly your code should
     * attempt to recreate the consumer. Note that this notification is only informational
     * for ordered consumers, as the consumer will be created in those cases automatically.
     */ ConsumerEvents["StreamNotFound"] = "stream_not_found";
    /*
     * Notification that the consumer was deleted. This notification
     * means the consumer will not get messages unless it is recreated. The client
     * will continue to attempt to pull messages. Ordered consumer will recreate it.
     */ ConsumerEvents["ConsumerDeleted"] = "consumer_deleted";
    /**
     * This notification is specific of ordered consumers and will be notified whenever
     * the consumer is recreated. The argument is the name of the newly created consumer.
     */ ConsumerEvents["OrderedConsumerRecreated"] = "ordered_consumer_recreated";
    /**
     * This notification means that either both the stream and consumer were not
     * found or that JetStream is not available.
     */ ConsumerEvents["NoResponders"] = "no_responders";
})(ConsumerEvents || (exports.ConsumerEvents = ConsumerEvents = {}));
/**
 * These events represent informational notifications emitted by ConsumerMessages
 * that can be safely ignored by clients.
 */ var ConsumerDebugEvents;
(function(ConsumerDebugEvents) {
    /**
     * DebugEvents are effectively statuses returned by the server that were ignored
     * by the client. The `data` portion of the
     * status is just a string indicating the code/message of the status.
     */ ConsumerDebugEvents["DebugEvent"] = "debug";
    /**
     * Requests for messages can be terminated by the server, these notifications
     * provide information on the number of messages and/or bytes that couldn't
     * be satisfied by the consumer request. The `data` portion of the status will
     * have the format of `{msgsLeft: number, bytesLeft: number}`.
     */ ConsumerDebugEvents["Discard"] = "discard";
    /**
     * Notifies that the current consumer will be reset
     */ ConsumerDebugEvents["Reset"] = "reset";
    /**
     * Notifies whenever there's a request for additional messages from the server.
     * This notification telegraphs the request options, which should be treated as
     * read-only. This notification is only useful for debugging. Data is PullOptions.
     */ ConsumerDebugEvents["Next"] = "next";
})(ConsumerDebugEvents || (exports.ConsumerDebugEvents = ConsumerDebugEvents = {}));
class PullConsumerMessagesImpl extends queued_iterator_1.QueuedIteratorImpl {
    // callback: ConsumerCallbackFn;
    constructor(c, opts, refilling = false){
        super();
        this.consumer = c;
        const copts = opts;
        this.opts = this.parseOptions(opts, refilling);
        this.callback = copts.callback || null;
        this.noIterator = typeof this.callback === "function";
        this.monitor = null;
        this.pong = null;
        this.pending = {
            msgs: 0,
            bytes: 0,
            requests: 0
        };
        this.refilling = refilling;
        this.timeout = null;
        this.inbox = (0, core_1.createInbox)(c.api.nc.options.inboxPrefix);
        this.listeners = [];
        this.forOrderedConsumer = false;
        this.abortOnMissingResource = copts.abort_on_missing_resource === true;
        this.bind = copts.bind === true;
        this.inBackOff = false;
        this.start();
    }
    start() {
        const { max_messages, max_bytes, idle_heartbeat, threshold_bytes, threshold_messages } = this.opts;
        // ordered consumer requires the ability to reset the
        // source pull consumer, if promise is registered and
        // close is called, the pull consumer will emit a close
        // which will close the ordered consumer, by registering
        // the close with a handler, we can replace it.
        this.closed().then((err)=>{
            if (this.cleanupHandler) {
                try {
                    this.cleanupHandler(err);
                } catch (_err) {
                // nothing
                }
            }
        });
        const { sub } = this;
        if (sub) {
            sub.unsubscribe();
        }
        this.sub = this.consumer.api.nc.subscribe(this.inbox, {
            callback: (err, msg)=>{
                var _a, _b, _c, _d;
                if (err) {
                    // this is possibly only a permissions error which means
                    // that the server rejected (eliminating the sub)
                    // or the client never had permissions to begin with
                    // so this is terminal
                    this.stop(err);
                    return;
                }
                (_a = this.monitor) === null || _a === void 0 ? void 0 : _a.work();
                const isProtocol = msg.subject === this.inbox;
                if (isProtocol) {
                    if ((0, jsutil_1.isHeartbeatMsg)(msg)) {
                        return;
                    }
                    const code = (_b = msg.headers) === null || _b === void 0 ? void 0 : _b.code;
                    const description = ((_d = (_c = msg.headers) === null || _c === void 0 ? void 0 : _c.description) === null || _d === void 0 ? void 0 : _d.toLowerCase()) || "unknown";
                    const { msgsLeft, bytesLeft } = this.parseDiscard(msg.headers);
                    if (msgsLeft > 0 || bytesLeft > 0) {
                        this.pending.msgs -= msgsLeft;
                        this.pending.bytes -= bytesLeft;
                        this.pending.requests--;
                        this.notify(ConsumerDebugEvents.Discard, {
                            msgsLeft,
                            bytesLeft
                        });
                    } else {
                        // FIXME: 408 can be a Timeout or bad request,
                        //  or it can be sent if a nowait request was
                        //  sent when other waiting requests are pending
                        //  "Requests Pending"
                        // FIXME: 400 bad request Invalid Heartbeat or Unmarshalling Fails
                        //  these are real bad values - so this is bad request
                        //  fail on this
                        // we got a bad request - no progress here
                        if (code === 400) {
                            this.stop(new core_1.NatsError(description, `${code}`));
                            return;
                        } else if (code === 409 && description === "consumer deleted") {
                            this.notify(ConsumerEvents.ConsumerDeleted, `${code} ${description}`);
                            if (!this.refilling || this.abortOnMissingResource) {
                                const error = new core_1.NatsError(description, `${code}`);
                                this.stop(error);
                                return;
                            }
                        } else if (code === 503) {
                            // this is a no responders - possibly the stream/consumer were
                            // deleted from under the client
                            this.notify(ConsumerEvents.NoResponders, `${code} No Responders`);
                            // in cases that we are in consume, the idle heartbeat will kick in
                            // which will do a reset, and possibly refine the error
                            if (!this.refilling || this.abortOnMissingResource) {
                                const error = new core_1.NatsError("no responders", `${code}`);
                                this.stop(error);
                                return;
                            }
                        } else {
                            this.notify(ConsumerDebugEvents.DebugEvent, `${code} ${description}`);
                        }
                    }
                } else {
                    // push the user message
                    this._push((0, jsmsg_1.toJsMsg)(msg, this.consumer.api.timeout));
                    this.received++;
                    if (this.pending.msgs) {
                        this.pending.msgs--;
                    }
                    if (this.pending.bytes) {
                        this.pending.bytes -= msg.size();
                    }
                }
                // if we don't have pending bytes/messages we are done or starving
                if (this.pending.msgs === 0 && this.pending.bytes === 0) {
                    this.pending.requests = 0;
                }
                if (this.refilling) {
                    // FIXME: this could result in  1/4 = 0
                    if (max_messages && this.pending.msgs <= threshold_messages || max_bytes && this.pending.bytes <= threshold_bytes) {
                        const batch = this.pullOptions();
                        // @ts-ignore: we are pushing the pull fn
                        this.pull(batch);
                    }
                } else if (this.pending.requests === 0) {
                    // @ts-ignore: we are pushing the pull fn
                    this._push(()=>{
                        this.stop();
                    });
                }
            }
        });
        this.sub.closed.then(()=>{
            // for ordered consumer we cannot break the iterator
            if (this.sub.draining) {
                // @ts-ignore: we are pushing the pull fn
                this._push(()=>{
                    this.stop();
                });
            }
        });
        if (idle_heartbeat) {
            this.monitor = new idleheartbeat_monitor_1.IdleHeartbeatMonitor(idle_heartbeat, (data)=>{
                // for the pull consumer - missing heartbeats may be corrected
                // on the next pull etc - the only assumption here is we should
                // reset and check if the consumer was deleted from under us
                this.notify(ConsumerEvents.HeartbeatsMissed, data);
                this.resetPending().then(()=>{}).catch(()=>{});
                return false;
            }, {
                maxOut: 2
            });
        }
        // now if we disconnect, the consumer could be gone
        // or we were slow consumer'ed by the server
        (()=>__awaiter(this, void 0, void 0, function*() {
                var _a, e_1, _b, _c;
                var _d;
                const status = this.consumer.api.nc.status();
                this.statusIterator = status;
                try {
                    for(var _e = true, status_1 = __asyncValues(status), status_1_1; status_1_1 = yield status_1.next(), _a = status_1_1.done, !_a; _e = true){
                        _c = status_1_1.value;
                        _e = false;
                        const s = _c;
                        switch(s.type){
                            case core_1.Events.Disconnect:
                                // don't spam hb errors if we are disconnected
                                // @ts-ignore: optional chaining
                                (_d = this.monitor) === null || _d === void 0 ? void 0 : _d.cancel();
                                break;
                            case core_1.Events.Reconnect:
                                // do some sanity checks and reset
                                // if that works resume the monitor
                                this.resetPending().then((ok)=>{
                                    var _a;
                                    if (ok) {
                                        // @ts-ignore: optional chaining
                                        (_a = this.monitor) === null || _a === void 0 ? void 0 : _a.restart();
                                    }
                                }).catch(()=>{
                                // ignored - this should have fired elsewhere
                                });
                                break;
                            default:
                        }
                    }
                } catch (e_1_1) {
                    e_1 = {
                        error: e_1_1
                    };
                } finally{
                    try {
                        if (!_e && !_a && (_b = status_1.return)) yield _b.call(status_1);
                    } finally{
                        if (e_1) throw e_1.error;
                    }
                }
            }))();
        // this is the initial pull
        this.pull(this.pullOptions());
    }
    _push(r) {
        if (!this.callback) {
            super.push(r);
        } else {
            const fn = typeof r === "function" ? r : null;
            try {
                if (!fn) {
                    this.callback(r);
                } else {
                    fn();
                }
            } catch (err) {
                this.stop(err);
            }
        }
    }
    notify(type, data) {
        if (this.listeners.length > 0) {
            (()=>{
                this.listeners.forEach((l)=>{
                    if (!l.done) {
                        l.push({
                            type,
                            data
                        });
                    }
                });
            })();
        }
    }
    resetPending() {
        return this.bind ? this.resetPendingNoInfo() : this.resetPendingWithInfo();
    }
    resetPendingNoInfo() {
        // here we are blind - we won't do an info, so all we are doing
        // is invalidating the previous request results.
        this.pending.msgs = 0;
        this.pending.bytes = 0;
        this.pending.requests = 0;
        this.pull(this.pullOptions());
        return Promise.resolve(true);
    }
    resetPendingWithInfo() {
        return __awaiter(this, void 0, void 0, function*() {
            if (this.inBackOff) {
                // already failing to get stream or consumer
                return false;
            }
            let notFound = 0;
            let streamNotFound = 0;
            const bo = (0, util_1.backoff)([
                this.opts.expires
            ]);
            let attempt = 0;
            while(true){
                if (this.done) {
                    return false;
                }
                if (this.consumer.api.nc.isClosed()) {
                    console.error("aborting resetPending - connection is closed");
                    return false;
                }
                try {
                    // check we exist
                    yield this.consumer.info();
                    this.inBackOff = false;
                    notFound = 0;
                    // we exist, so effectively any pending state is gone
                    // so reset and re-pull
                    this.pending.msgs = 0;
                    this.pending.bytes = 0;
                    this.pending.requests = 0;
                    this.pull(this.pullOptions());
                    return true;
                } catch (err) {
                    // game over
                    if (err.message === "stream not found") {
                        streamNotFound++;
                        this.notify(ConsumerEvents.StreamNotFound, streamNotFound);
                        if (!this.refilling || this.abortOnMissingResource) {
                            this.stop(err);
                            return false;
                        }
                    } else if (err.message === "consumer not found") {
                        notFound++;
                        this.notify(ConsumerEvents.ConsumerNotFound, notFound);
                        if (this.resetHandler) {
                            try {
                                this.resetHandler();
                            } catch (_) {
                            // ignored
                            }
                        }
                        if (!this.refilling || this.abortOnMissingResource) {
                            this.stop(err);
                            return false;
                        }
                        if (this.forOrderedConsumer) {
                            return false;
                        }
                    } else {
                        notFound = 0;
                        streamNotFound = 0;
                    }
                    this.inBackOff = true;
                    const to = bo.backoff(attempt);
                    // wait for delay or till the client closes
                    const de = (0, util_1.delay)(to);
                    yield Promise.race([
                        de,
                        this.consumer.api.nc.closed()
                    ]);
                    de.cancel();
                    attempt++;
                }
            }
        });
    }
    pull(opts) {
        var _a, _b;
        this.pending.bytes += (_a = opts.max_bytes) !== null && _a !== void 0 ? _a : 0;
        this.pending.msgs += (_b = opts.batch) !== null && _b !== void 0 ? _b : 0;
        this.pending.requests++;
        const nc = this.consumer.api.nc;
        //@ts-ignore: iterator will pull
        this._push(()=>{
            nc.publish(`${this.consumer.api.prefix}.CONSUMER.MSG.NEXT.${this.consumer.stream}.${this.consumer.name}`, this.consumer.api.jc.encode(opts), {
                reply: this.inbox
            });
            this.notify(ConsumerDebugEvents.Next, opts);
        });
    }
    pullOptions() {
        const batch = this.opts.max_messages - this.pending.msgs;
        const max_bytes = this.opts.max_bytes - this.pending.bytes;
        const idle_heartbeat = (0, util_1.nanos)(this.opts.idle_heartbeat);
        const expires = (0, util_1.nanos)(this.opts.expires);
        return {
            batch,
            max_bytes,
            idle_heartbeat,
            expires
        };
    }
    parseDiscard(headers) {
        const discard = {
            msgsLeft: 0,
            bytesLeft: 0
        };
        const msgsLeft = headers === null || headers === void 0 ? void 0 : headers.get(types_1.JsHeaders.PendingMessagesHdr);
        if (msgsLeft) {
            discard.msgsLeft = parseInt(msgsLeft);
        }
        const bytesLeft = headers === null || headers === void 0 ? void 0 : headers.get(types_1.JsHeaders.PendingBytesHdr);
        if (bytesLeft) {
            discard.bytesLeft = parseInt(bytesLeft);
        }
        return discard;
    }
    trackTimeout(t) {
        this.timeout = t;
    }
    close() {
        this.stop();
        return this.iterClosed;
    }
    closed() {
        return this.iterClosed;
    }
    clearTimers() {
        var _a, _b;
        (_a = this.monitor) === null || _a === void 0 ? void 0 : _a.cancel();
        this.monitor = null;
        (_b = this.timeout) === null || _b === void 0 ? void 0 : _b.cancel();
        this.timeout = null;
    }
    setCleanupHandler(fn) {
        this.cleanupHandler = fn;
    }
    stop(err) {
        var _a, _b;
        if (this.done) {
            return;
        }
        (_a = this.sub) === null || _a === void 0 ? void 0 : _a.unsubscribe();
        this.clearTimers();
        (_b = this.statusIterator) === null || _b === void 0 ? void 0 : _b.stop();
        //@ts-ignore: fn
        this._push(()=>{
            super.stop(err);
            this.listeners.forEach((n)=>{
                n.stop();
            });
        });
    }
    parseOptions(opts, refilling = false) {
        const args = opts || {};
        args.max_messages = args.max_messages || 0;
        args.max_bytes = args.max_bytes || 0;
        if (args.max_messages !== 0 && args.max_bytes !== 0) {
            throw new Error(`only specify one of max_messages or max_bytes`);
        }
        // we must have at least one limit - default to 100 msgs
        // if they gave bytes but no messages, we will clamp
        // if they gave byte limits, we still need a message limit
        // or the server will send a single message and close the
        // request
        if (args.max_messages === 0) {
            // FIXME: if the server gives end pull completion, then this is not
            //   needed - the client will get 1 message but, we'll know that it
            //   worked - but we'll add a lot of latency, since all requests
            //   will end after one message
            args.max_messages = 100;
        }
        args.expires = args.expires || 30000;
        if (args.expires < 1000) {
            throw new Error("expires should be at least 1000ms");
        }
        // require idle_heartbeat
        args.idle_heartbeat = args.idle_heartbeat || args.expires / 2;
        args.idle_heartbeat = args.idle_heartbeat > 30000 ? 30000 : args.idle_heartbeat;
        if (refilling) {
            const minMsgs = Math.round(args.max_messages * .75) || 1;
            args.threshold_messages = args.threshold_messages || minMsgs;
            const minBytes = Math.round(args.max_bytes * .75) || 1;
            args.threshold_bytes = args.threshold_bytes || minBytes;
        }
        return args;
    }
    status() {
        const iter = new queued_iterator_1.QueuedIteratorImpl();
        this.listeners.push(iter);
        return Promise.resolve(iter);
    }
}
exports.PullConsumerMessagesImpl = PullConsumerMessagesImpl;
class OrderedConsumerMessages extends queued_iterator_1.QueuedIteratorImpl {
    constructor(){
        super();
        this.listeners = [];
    }
    setSource(src) {
        if (this.src) {
            this.src.resetHandler = undefined;
            this.src.setCleanupHandler();
            this.src.stop();
        }
        this.src = src;
        this.src.setCleanupHandler((err)=>{
            this.stop(err || undefined);
        });
        (()=>__awaiter(this, void 0, void 0, function*() {
                var _a, e_2, _b, _c;
                const status = yield this.src.status();
                try {
                    for(var _d = true, status_2 = __asyncValues(status), status_2_1; status_2_1 = yield status_2.next(), _a = status_2_1.done, !_a; _d = true){
                        _c = status_2_1.value;
                        _d = false;
                        const s = _c;
                        this.notify(s.type, s.data);
                    }
                } catch (e_2_1) {
                    e_2 = {
                        error: e_2_1
                    };
                } finally{
                    try {
                        if (!_d && !_a && (_b = status_2.return)) yield _b.call(status_2);
                    } finally{
                        if (e_2) throw e_2.error;
                    }
                }
            }))().catch(()=>{});
    }
    notify(type, data) {
        if (this.listeners.length > 0) {
            (()=>{
                this.listeners.forEach((l)=>{
                    if (!l.done) {
                        l.push({
                            type,
                            data
                        });
                    }
                });
            })();
        }
    }
    stop(err) {
        var _a;
        if (this.done) {
            return;
        }
        (_a = this.src) === null || _a === void 0 ? void 0 : _a.stop(err);
        super.stop(err);
        this.listeners.forEach((n)=>{
            n.stop();
        });
    }
    close() {
        this.stop();
        return this.iterClosed;
    }
    closed() {
        return this.iterClosed;
    }
    status() {
        const iter = new queued_iterator_1.QueuedIteratorImpl();
        this.listeners.push(iter);
        return Promise.resolve(iter);
    }
}
exports.OrderedConsumerMessages = OrderedConsumerMessages;
class PullConsumerImpl {
    constructor(api, info){
        this.api = api;
        this._info = info;
        this.stream = info.stream_name;
        this.name = info.name;
    }
    consume(opts = {
        max_messages: 100,
        expires: 30000
    }) {
        return Promise.resolve(new PullConsumerMessagesImpl(this, opts, true));
    }
    fetch(opts = {
        max_messages: 100,
        expires: 30000
    }) {
        const m = new PullConsumerMessagesImpl(this, opts, false);
        // FIXME: need some way to pad this correctly
        const to = Math.round(m.opts.expires * 1.05);
        const timer = (0, util_1.timeout)(to);
        m.closed().catch(()=>{}).finally(()=>{
            timer.cancel();
        });
        timer.catch(()=>{
            m.close().catch();
        });
        m.trackTimeout(timer);
        return Promise.resolve(m);
    }
    next(opts = {
        expires: 30000
    }) {
        const d = (0, util_1.deferred)();
        const fopts = opts;
        fopts.max_messages = 1;
        const iter = new PullConsumerMessagesImpl(this, fopts, false);
        // FIXME: need some way to pad this correctly
        const to = Math.round(iter.opts.expires * 1.05);
        // watch the messages for heartbeats missed
        if (to >= 60000) {
            (()=>__awaiter(this, void 0, void 0, function*() {
                    var _a, e_3, _b, _c;
                    try {
                        for(var _d = true, _e = __asyncValues((yield iter.status())), _f; _f = yield _e.next(), _a = _f.done, !_a; _d = true){
                            _c = _f.value;
                            _d = false;
                            const s = _c;
                            if (s.type === ConsumerEvents.HeartbeatsMissed && s.data >= 2) {
                                d.reject(new Error("consumer missed heartbeats"));
                                break;
                            }
                        }
                    } catch (e_3_1) {
                        e_3 = {
                            error: e_3_1
                        };
                    } finally{
                        try {
                            if (!_d && !_a && (_b = _e.return)) yield _b.call(_e);
                        } finally{
                            if (e_3) throw e_3.error;
                        }
                    }
                }))().catch();
        }
        (()=>__awaiter(this, void 0, void 0, function*() {
                var _a, e_4, _b, _c;
                try {
                    for(var _d = true, iter_1 = __asyncValues(iter), iter_1_1; iter_1_1 = yield iter_1.next(), _a = iter_1_1.done, !_a; _d = true){
                        _c = iter_1_1.value;
                        _d = false;
                        const m = _c;
                        d.resolve(m);
                        break;
                    }
                } catch (e_4_1) {
                    e_4 = {
                        error: e_4_1
                    };
                } finally{
                    try {
                        if (!_d && !_a && (_b = iter_1.return)) yield _b.call(iter_1);
                    } finally{
                        if (e_4) throw e_4.error;
                    }
                }
            }))().catch(()=>{
        // iterator is going to throw, but we ignore it
        // as it is handled by the closed promise
        });
        const timer = (0, util_1.timeout)(to);
        iter.closed().then((err)=>{
            err ? d.reject(err) : d.resolve(null);
        }).catch((err)=>{
            d.reject(err);
        }).finally(()=>{
            timer.cancel();
        });
        timer.catch((_err)=>{
            d.resolve(null);
            iter.close().catch();
        });
        iter.trackTimeout(timer);
        return d;
    }
    delete() {
        const { stream_name, name } = this._info;
        return this.api.delete(stream_name, name);
    }
    info(cached = false) {
        if (cached) {
            return Promise.resolve(this._info);
        }
        const { stream_name, name } = this._info;
        return this.api.info(stream_name, name).then((ci)=>{
            this._info = ci;
            return this._info;
        });
    }
}
exports.PullConsumerImpl = PullConsumerImpl;
class OrderedPullConsumerImpl {
    constructor(api, stream, opts = {}){
        this.api = api;
        this.stream = stream;
        this.cursor = {
            stream_seq: 1,
            deliver_seq: 0
        };
        this.namePrefix = nuid_1.nuid.next();
        if (typeof opts.name_prefix === "string") {
            // make sure the prefix is valid
            (0, jsutil_1.minValidation)("name_prefix", opts.name_prefix);
            this.namePrefix = opts.name_prefix + this.namePrefix;
        }
        this.serial = 0;
        this.currentConsumer = null;
        this.userCallback = null;
        this.iter = null;
        this.type = PullConsumerType.Unset;
        this.consumerOpts = opts;
        this.maxInitialReset = 30;
        // to support a random start sequence we need to update the cursor
        this.startSeq = this.consumerOpts.opt_start_seq || 0;
        this.cursor.stream_seq = this.startSeq > 0 ? this.startSeq - 1 : 0;
    }
    getConsumerOpts(seq) {
        // change the serial - invalidating any callback not
        // matching the serial
        this.serial++;
        const name = `${this.namePrefix}_${this.serial}`;
        seq = seq === 0 ? 1 : seq;
        const config = {
            name,
            deliver_policy: jsapi_types_1.DeliverPolicy.StartSequence,
            opt_start_seq: seq,
            ack_policy: jsapi_types_1.AckPolicy.None,
            inactive_threshold: (0, util_1.nanos)(5 * 60 * 1000),
            num_replicas: 1
        };
        if (this.consumerOpts.headers_only === true) {
            config.headers_only = true;
        }
        if (Array.isArray(this.consumerOpts.filterSubjects)) {
            config.filter_subjects = this.consumerOpts.filterSubjects;
        }
        if (typeof this.consumerOpts.filterSubjects === "string") {
            config.filter_subject = this.consumerOpts.filterSubjects;
        }
        if (this.consumerOpts.replay_policy) {
            config.replay_policy = this.consumerOpts.replay_policy;
        }
        // this is the initial request - tweak some options
        if (seq === this.startSeq + 1) {
            config.deliver_policy = this.consumerOpts.deliver_policy || jsapi_types_1.DeliverPolicy.StartSequence;
            if (this.consumerOpts.deliver_policy === jsapi_types_1.DeliverPolicy.LastPerSubject || this.consumerOpts.deliver_policy === jsapi_types_1.DeliverPolicy.New || this.consumerOpts.deliver_policy === jsapi_types_1.DeliverPolicy.Last) {
                delete config.opt_start_seq;
                config.deliver_policy = this.consumerOpts.deliver_policy;
            }
            // this requires a filter subject - we only set if they didn't
            // set anything, and to be pre-2.10 we set it as filter_subject
            if (config.deliver_policy === jsapi_types_1.DeliverPolicy.LastPerSubject) {
                if (typeof config.filter_subjects === "undefined" && typeof config.filter_subject === "undefined") {
                    config.filter_subject = ">";
                }
            }
            if (this.consumerOpts.opt_start_time) {
                delete config.opt_start_seq;
                config.deliver_policy = jsapi_types_1.DeliverPolicy.StartTime;
                config.opt_start_time = this.consumerOpts.opt_start_time;
            }
            if (this.consumerOpts.inactive_threshold) {
                config.inactive_threshold = (0, util_1.nanos)(this.consumerOpts.inactive_threshold);
            }
        }
        return config;
    }
    resetConsumer() {
        return __awaiter(this, arguments, void 0, function*(seq = 0) {
            var _a, _b, _c, _d, _e;
            const id = nuid_1.nuid.next();
            const isNew = this.serial === 0;
            // try to delete the consumer
            (_a = this.consumer) === null || _a === void 0 ? void 0 : _a.delete().catch(()=>{});
            seq = seq === 0 ? 1 : seq;
            // reset the consumer sequence as JetStream will renumber from 1
            this.cursor.deliver_seq = 0;
            const config = this.getConsumerOpts(seq);
            config.max_deliver = 1;
            config.mem_storage = true;
            const bo = (0, util_1.backoff)([
                ((_b = this.opts) === null || _b === void 0 ? void 0 : _b.expires) || 30000
            ]);
            let ci;
            for(let i = 0;; i++){
                try {
                    ci = yield this.api.add(this.stream, config);
                    (_c = this.iter) === null || _c === void 0 ? void 0 : _c.notify(ConsumerEvents.OrderedConsumerRecreated, ci.name);
                    break;
                } catch (err) {
                    if (err.message === "stream not found") {
                        // we are not going to succeed
                        (_d = this.iter) === null || _d === void 0 ? void 0 : _d.notify(ConsumerEvents.StreamNotFound, i);
                        // if we are not consume - fail it
                        if (this.type === PullConsumerType.Fetch || this.opts.abort_on_missing_resource === true) {
                            (_e = this.iter) === null || _e === void 0 ? void 0 : _e.stop(err);
                            return Promise.reject(err);
                        }
                    }
                    if (isNew && i >= this.maxInitialReset) {
                        // consumer was never created, so we can fail this
                        throw err;
                    } else {
                        yield (0, util_1.delay)(bo.backoff(i + 1));
                    }
                }
            }
            return ci;
        });
    }
    internalHandler(serial) {
        // this handler will be noop if the consumer's serial changes
        return (m)=>{
            var _a;
            if (this.serial !== serial) {
                return;
            }
            const dseq = m.info.deliverySequence;
            if (dseq !== this.cursor.deliver_seq + 1) {
                this.notifyOrderedResetAndReset();
                return;
            }
            this.cursor.deliver_seq = dseq;
            this.cursor.stream_seq = m.info.streamSequence;
            if (this.userCallback) {
                this.userCallback(m);
            } else {
                (_a = this.iter) === null || _a === void 0 ? void 0 : _a.push(m);
            }
        };
    }
    reset() {
        return __awaiter(this, arguments, void 0, function*(opts = {
            max_messages: 100,
            expires: 30000
        }, info) {
            var _a, _b;
            info = info || {};
            // this is known to be directly related to a pull
            const fromFetch = info.fromFetch || false;
            // a sequence order caused the reset
            const orderedReset = info.orderedReset || false;
            if (this.type === PullConsumerType.Fetch && orderedReset) {
                // the fetch pull simply needs to end the iterator
                (_a = this.iter) === null || _a === void 0 ? void 0 : _a.src.stop();
                yield (_b = this.iter) === null || _b === void 0 ? void 0 : _b.closed();
                this.currentConsumer = null;
                return;
            }
            if (this.currentConsumer === null || orderedReset) {
                this.currentConsumer = yield this.resetConsumer(this.cursor.stream_seq + 1);
            }
            // if we don't have an iterator, or it is a fetch request
            // we create the iterator - otherwise this is a reset that is happening
            // while the OC is active, so simply bind the new OC to current iterator.
            if (this.iter === null || fromFetch) {
                this.iter = new OrderedConsumerMessages();
            }
            this.consumer = new PullConsumerImpl(this.api, this.currentConsumer);
            const copts = opts;
            copts.callback = this.internalHandler(this.serial);
            let msgs = null;
            if (this.type === PullConsumerType.Fetch && fromFetch) {
                // we only repull if client initiates
                msgs = yield this.consumer.fetch(opts);
            } else if (this.type === PullConsumerType.Consume) {
                msgs = yield this.consumer.consume(opts);
            }
            const msgsImpl = msgs;
            msgsImpl.forOrderedConsumer = true;
            msgsImpl.resetHandler = ()=>{
                this.notifyOrderedResetAndReset();
            };
            this.iter.setSource(msgsImpl);
        });
    }
    notifyOrderedResetAndReset() {
        var _a;
        (_a = this.iter) === null || _a === void 0 ? void 0 : _a.notify(ConsumerDebugEvents.Reset, "");
        this.reset(this.opts, {
            orderedReset: true
        });
    }
    consume() {
        return __awaiter(this, arguments, void 0, function*(opts = {
            max_messages: 100,
            expires: 30000
        }) {
            const copts = opts;
            if (copts.bind) {
                return Promise.reject(new Error("bind is not supported"));
            }
            if (this.type === PullConsumerType.Fetch) {
                return Promise.reject(new Error("ordered consumer initialized as fetch"));
            }
            if (this.type === PullConsumerType.Consume) {
                return Promise.reject(new Error("ordered consumer doesn't support concurrent consume"));
            }
            const { callback } = opts;
            if (callback) {
                this.userCallback = callback;
            }
            this.type = PullConsumerType.Consume;
            this.opts = opts;
            yield this.reset(opts);
            return this.iter;
        });
    }
    fetch() {
        return __awaiter(this, arguments, void 0, function*(opts = {
            max_messages: 100,
            expires: 30000
        }) {
            var _a;
            const copts = opts;
            if (copts.bind) {
                return Promise.reject(new Error("bind is not supported"));
            }
            if (this.type === PullConsumerType.Consume) {
                return Promise.reject(new Error("ordered consumer already initialized as consume"));
            }
            if (((_a = this.iter) === null || _a === void 0 ? void 0 : _a.done) === false) {
                return Promise.reject(new Error("ordered consumer doesn't support concurrent fetch"));
            }
            //@ts-ignore: allow this for tests - api doesn't use it because
            // iterator close is the user signal that the pull is done.
            const { callback } = opts;
            if (callback) {
                this.userCallback = callback;
            }
            this.type = PullConsumerType.Fetch;
            this.opts = opts;
            yield this.reset(opts, {
                fromFetch: true
            });
            return this.iter;
        });
    }
    next() {
        return __awaiter(this, arguments, void 0, function*(opts = {
            expires: 30000
        }) {
            const copts = opts;
            if (copts.bind) {
                return Promise.reject(new Error("bind is not supported"));
            }
            copts.max_messages = 1;
            const d = (0, util_1.deferred)();
            copts.callback = (m)=>{
                // we can clobber the callback, because they are not supported
                // except on consume, which will fail when we try to fetch
                this.userCallback = null;
                d.resolve(m);
            };
            const iter = yield this.fetch(copts);
            iter.iterClosed.then((err)=>{
                if (err) {
                    d.reject(err);
                }
                d.resolve(null);
            }).catch((err)=>{
                d.reject(err);
            });
            return d;
        });
    }
    delete() {
        if (!this.currentConsumer) {
            return Promise.resolve(false);
        }
        return this.api.delete(this.stream, this.currentConsumer.name).then((tf)=>{
            return Promise.resolve(tf);
        }).catch((err)=>{
            return Promise.reject(err);
        }).finally(()=>{
            this.currentConsumer = null;
        });
    }
    info(cached) {
        return __awaiter(this, void 0, void 0, function*() {
            if (this.currentConsumer == null) {
                this.currentConsumer = yield this.resetConsumer(this.startSeq);
                return Promise.resolve(this.currentConsumer);
            }
            if (cached && this.currentConsumer) {
                return Promise.resolve(this.currentConsumer);
            }
            return this.api.info(this.stream, this.currentConsumer.name);
        });
    }
}
exports.OrderedPullConsumerImpl = OrderedPullConsumerImpl; //# sourceMappingURL=consumer.js.map
}),
"[project]/dawg-ai/node_modules/nats/lib/jetstream/jsmstream_api.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

/*
 * Copyright 2021-2023 The NATS Authors
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
 */ var __awaiter = /*TURBOPACK member replacement*/ __turbopack_context__.e && /*TURBOPACK member replacement*/ __turbopack_context__.e.__awaiter || function(thisArg, _arguments, P, generator) {
    function adopt(value) {
        return value instanceof P ? value : new P(function(resolve) {
            resolve(value);
        });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
        function fulfilled(value) {
            try {
                step(generator.next(value));
            } catch (e) {
                reject(e);
            }
        }
        function rejected(value) {
            try {
                step(generator["throw"](value));
            } catch (e) {
                reject(e);
            }
        }
        function step(result) {
            result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.StreamsImpl = exports.StoredMsgImpl = exports.StreamAPIImpl = exports.StreamImpl = exports.ConsumersImpl = void 0;
exports.convertStreamSourceDomain = convertStreamSourceDomain;
const types_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/types.js [app-ssr] (ecmascript)");
const jsbaseclient_api_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/jetstream/jsbaseclient_api.js [app-ssr] (ecmascript)");
const jslister_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/jetstream/jslister.js [app-ssr] (ecmascript)");
const jsutil_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/jetstream/jsutil.js [app-ssr] (ecmascript)");
const headers_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/headers.js [app-ssr] (ecmascript)");
const kv_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/jetstream/kv.js [app-ssr] (ecmascript)");
const objectstore_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/jetstream/objectstore.js [app-ssr] (ecmascript)");
const codec_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/codec.js [app-ssr] (ecmascript)");
const encoders_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/encoders.js [app-ssr] (ecmascript)");
const semver_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/semver.js [app-ssr] (ecmascript)");
const types_2 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/jetstream/types.js [app-ssr] (ecmascript)");
const consumer_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/jetstream/consumer.js [app-ssr] (ecmascript)");
const jsmconsumer_api_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/jetstream/jsmconsumer_api.js [app-ssr] (ecmascript)");
function convertStreamSourceDomain(s) {
    if (s === undefined) {
        return undefined;
    }
    const { domain } = s;
    if (domain === undefined) {
        return s;
    }
    const copy = Object.assign({}, s);
    delete copy.domain;
    if (domain === "") {
        return copy;
    }
    if (copy.external) {
        throw new Error("domain and external are both set");
    }
    copy.external = {
        api: `$JS.${domain}.API`
    };
    return copy;
}
class ConsumersImpl {
    constructor(api){
        this.api = api;
        this.notified = false;
    }
    checkVersion() {
        const fv = this.api.nc.features.get(semver_1.Feature.JS_SIMPLIFICATION);
        if (!fv.ok) {
            return Promise.reject(new Error(`consumers framework is only supported on servers ${fv.min} or better`));
        }
        return Promise.resolve();
    }
    getPullConsumerFor(ci) {
        if (ci.config.deliver_subject !== undefined) {
            throw new Error("push consumer not supported");
        }
        return new consumer_1.PullConsumerImpl(this.api, ci);
    }
    get(stream_1) {
        return __awaiter(this, arguments, void 0, function*(stream, name = {}) {
            if (typeof name === "object") {
                return this.ordered(stream, name);
            }
            // check we have support for pending msgs and header notifications
            yield this.checkVersion();
            return this.api.info(stream, name).then((ci)=>{
                if (ci.config.deliver_subject !== undefined) {
                    return Promise.reject(new Error("push consumer not supported"));
                }
                return new consumer_1.PullConsumerImpl(this.api, ci);
            }).catch((err)=>{
                return Promise.reject(err);
            });
        });
    }
    ordered(stream, opts) {
        return __awaiter(this, void 0, void 0, function*() {
            yield this.checkVersion();
            const impl = this.api;
            const sapi = new StreamAPIImpl(impl.nc, impl.opts);
            return sapi.info(stream).then((_si)=>{
                return Promise.resolve(new consumer_1.OrderedPullConsumerImpl(this.api, stream, opts));
            }).catch((err)=>{
                return Promise.reject(err);
            });
        });
    }
}
exports.ConsumersImpl = ConsumersImpl;
class StreamImpl {
    constructor(api, info){
        this.api = api;
        this._info = info;
    }
    get name() {
        return this._info.config.name;
    }
    alternates() {
        return this.info().then((si)=>{
            return si.alternates ? si.alternates : [];
        });
    }
    best() {
        return __awaiter(this, void 0, void 0, function*() {
            yield this.info();
            if (this._info.alternates) {
                const asi = yield this.api.info(this._info.alternates[0].name);
                return new StreamImpl(this.api, asi);
            } else {
                return this;
            }
        });
    }
    info(cached = false, opts) {
        if (cached) {
            return Promise.resolve(this._info);
        }
        return this.api.info(this.name, opts).then((si)=>{
            this._info = si;
            return this._info;
        });
    }
    getConsumerFromInfo(ci) {
        return new ConsumersImpl(new jsmconsumer_api_1.ConsumerAPIImpl(this.api.nc, this.api.opts)).getPullConsumerFor(ci);
    }
    getConsumer(name) {
        return new ConsumersImpl(new jsmconsumer_api_1.ConsumerAPIImpl(this.api.nc, this.api.opts)).get(this.name, name);
    }
    getMessage(query) {
        return this.api.getMessage(this.name, query);
    }
    deleteMessage(seq, erase) {
        return this.api.deleteMessage(this.name, seq, erase);
    }
}
exports.StreamImpl = StreamImpl;
class StreamAPIImpl extends jsbaseclient_api_1.BaseApiClient {
    constructor(nc, opts){
        super(nc, opts);
    }
    checkStreamConfigVersions(cfg) {
        const nci = this.nc;
        if (cfg.metadata) {
            const { min, ok } = nci.features.get(semver_1.Feature.JS_STREAM_CONSUMER_METADATA);
            if (!ok) {
                throw new Error(`stream 'metadata' requires server ${min}`);
            }
        }
        if (cfg.first_seq) {
            const { min, ok } = nci.features.get(semver_1.Feature.JS_STREAM_FIRST_SEQ);
            if (!ok) {
                throw new Error(`stream 'first_seq' requires server ${min}`);
            }
        }
        if (cfg.subject_transform) {
            const { min, ok } = nci.features.get(semver_1.Feature.JS_STREAM_SUBJECT_TRANSFORM);
            if (!ok) {
                throw new Error(`stream 'subject_transform' requires server ${min}`);
            }
        }
        if (cfg.compression) {
            const { min, ok } = nci.features.get(semver_1.Feature.JS_STREAM_COMPRESSION);
            if (!ok) {
                throw new Error(`stream 'compression' requires server ${min}`);
            }
        }
        if (cfg.consumer_limits) {
            const { min, ok } = nci.features.get(semver_1.Feature.JS_DEFAULT_CONSUMER_LIMITS);
            if (!ok) {
                throw new Error(`stream 'consumer_limits' requires server ${min}`);
            }
        }
        function validateStreamSource(context, src) {
            var _a;
            const count = ((_a = src === null || src === void 0 ? void 0 : src.subject_transforms) === null || _a === void 0 ? void 0 : _a.length) || 0;
            if (count > 0) {
                const { min, ok } = nci.features.get(semver_1.Feature.JS_STREAM_SOURCE_SUBJECT_TRANSFORM);
                if (!ok) {
                    throw new Error(`${context} 'subject_transforms' requires server ${min}`);
                }
            }
        }
        if (cfg.sources) {
            cfg.sources.forEach((src)=>{
                validateStreamSource("stream sources", src);
            });
        }
        if (cfg.mirror) {
            validateStreamSource("stream mirror", cfg.mirror);
        }
    }
    add() {
        return __awaiter(this, arguments, void 0, function*(cfg = {}) {
            var _a;
            this.checkStreamConfigVersions(cfg);
            (0, jsutil_1.validateStreamName)(cfg.name);
            cfg.mirror = convertStreamSourceDomain(cfg.mirror);
            //@ts-ignore: the sources are either set or not - so no item should be undefined in the list
            cfg.sources = (_a = cfg.sources) === null || _a === void 0 ? void 0 : _a.map(convertStreamSourceDomain);
            const r = yield this._request(`${this.prefix}.STREAM.CREATE.${cfg.name}`, cfg);
            const si = r;
            this._fixInfo(si);
            return si;
        });
    }
    delete(stream) {
        return __awaiter(this, void 0, void 0, function*() {
            (0, jsutil_1.validateStreamName)(stream);
            const r = yield this._request(`${this.prefix}.STREAM.DELETE.${stream}`);
            const cr = r;
            return cr.success;
        });
    }
    update(name_1) {
        return __awaiter(this, arguments, void 0, function*(name, cfg = {}) {
            var _a;
            if (typeof name === "object") {
                const sc = name;
                name = sc.name;
                cfg = sc;
                console.trace(`\u001B[33m >> streams.update(config: StreamConfig) api changed to streams.update(name: string, config: StreamUpdateConfig) - this shim will be removed - update your code.  \u001B[0m`);
            }
            this.checkStreamConfigVersions(cfg);
            (0, jsutil_1.validateStreamName)(name);
            const old = yield this.info(name);
            const update = Object.assign(old.config, cfg);
            update.mirror = convertStreamSourceDomain(update.mirror);
            //@ts-ignore: the sources are either set or not - so no item should be undefined in the list
            update.sources = (_a = update.sources) === null || _a === void 0 ? void 0 : _a.map(convertStreamSourceDomain);
            const r = yield this._request(`${this.prefix}.STREAM.UPDATE.${name}`, update);
            const si = r;
            this._fixInfo(si);
            return si;
        });
    }
    info(name, data) {
        return __awaiter(this, void 0, void 0, function*() {
            (0, jsutil_1.validateStreamName)(name);
            const subj = `${this.prefix}.STREAM.INFO.${name}`;
            const r = yield this._request(subj, data);
            let si = r;
            let { total, limit } = si;
            // check how many subjects we got in the first request
            let have = si.state.subjects ? Object.getOwnPropertyNames(si.state.subjects).length : 1;
            // if the response is paged, we have a large list of subjects
            // handle the paging and return a StreamInfo with all of it
            if (total && total > have) {
                const infos = [
                    si
                ];
                const paged = data || {};
                let i = 0;
                // total could change, so it is possible to have collected
                // more that the total
                while(total > have){
                    i++;
                    paged.offset = limit * i;
                    const r = yield this._request(subj, paged);
                    // update it in case it changed
                    total = r.total;
                    infos.push(r);
                    const count = Object.getOwnPropertyNames(r.state.subjects).length;
                    have += count;
                    // if request returns less than limit it is done
                    if (count < limit) {
                        break;
                    }
                }
                // collect all the subjects
                let subjects = {};
                for(let i = 0; i < infos.length; i++){
                    si = infos[i];
                    if (si.state.subjects) {
                        subjects = Object.assign(subjects, si.state.subjects);
                    }
                }
                // don't give the impression we paged
                si.offset = 0;
                si.total = 0;
                si.limit = 0;
                si.state.subjects = subjects;
            }
            this._fixInfo(si);
            return si;
        });
    }
    list(subject = "") {
        const payload = (subject === null || subject === void 0 ? void 0 : subject.length) ? {
            subject
        } : {};
        const listerFilter = (v)=>{
            const slr = v;
            slr.streams.forEach((si)=>{
                this._fixInfo(si);
            });
            return slr.streams;
        };
        const subj = `${this.prefix}.STREAM.LIST`;
        return new jslister_1.ListerImpl(subj, listerFilter, this, payload);
    }
    // FIXME: init of sealed, deny_delete, deny_purge shouldn't be necessary
    //  https://github.com/nats-io/nats-server/issues/2633
    _fixInfo(si) {
        si.config.sealed = si.config.sealed || false;
        si.config.deny_delete = si.config.deny_delete || false;
        si.config.deny_purge = si.config.deny_purge || false;
        si.config.allow_rollup_hdrs = si.config.allow_rollup_hdrs || false;
    }
    purge(name, opts) {
        return __awaiter(this, void 0, void 0, function*() {
            if (opts) {
                const { keep, seq } = opts;
                if (typeof keep === "number" && typeof seq === "number") {
                    throw new Error("can specify one of keep or seq");
                }
            }
            (0, jsutil_1.validateStreamName)(name);
            const v = yield this._request(`${this.prefix}.STREAM.PURGE.${name}`, opts);
            return v;
        });
    }
    deleteMessage(stream_1, seq_1) {
        return __awaiter(this, arguments, void 0, function*(stream, seq, erase = true) {
            (0, jsutil_1.validateStreamName)(stream);
            const dr = {
                seq
            };
            if (!erase) {
                dr.no_erase = true;
            }
            const r = yield this._request(`${this.prefix}.STREAM.MSG.DELETE.${stream}`, dr);
            const cr = r;
            return cr.success;
        });
    }
    getMessage(stream, query) {
        return __awaiter(this, void 0, void 0, function*() {
            (0, jsutil_1.validateStreamName)(stream);
            const r = yield this._request(`${this.prefix}.STREAM.MSG.GET.${stream}`, query);
            const sm = r;
            return new StoredMsgImpl(sm);
        });
    }
    find(subject) {
        return this.findStream(subject);
    }
    listKvs() {
        const filter = (v)=>{
            var _a, _b;
            const slr = v;
            const kvStreams = slr.streams.filter((v)=>{
                return v.config.name.startsWith(types_2.kvPrefix);
            });
            kvStreams.forEach((si)=>{
                this._fixInfo(si);
            });
            let cluster = "";
            if (kvStreams.length) {
                cluster = (_b = (_a = this.nc.info) === null || _a === void 0 ? void 0 : _a.cluster) !== null && _b !== void 0 ? _b : "";
            }
            const status = kvStreams.map((si)=>{
                return new kv_1.KvStatusImpl(si, cluster);
            });
            return status;
        };
        const subj = `${this.prefix}.STREAM.LIST`;
        return new jslister_1.ListerImpl(subj, filter, this);
    }
    listObjectStores() {
        const filter = (v)=>{
            const slr = v;
            const objStreams = slr.streams.filter((v)=>{
                return v.config.name.startsWith(objectstore_1.osPrefix);
            });
            objStreams.forEach((si)=>{
                this._fixInfo(si);
            });
            const status = objStreams.map((si)=>{
                return new objectstore_1.ObjectStoreStatusImpl(si);
            });
            return status;
        };
        const subj = `${this.prefix}.STREAM.LIST`;
        return new jslister_1.ListerImpl(subj, filter, this);
    }
    names(subject = "") {
        const payload = (subject === null || subject === void 0 ? void 0 : subject.length) ? {
            subject
        } : {};
        const listerFilter = (v)=>{
            const sr = v;
            return sr.streams;
        };
        const subj = `${this.prefix}.STREAM.NAMES`;
        return new jslister_1.ListerImpl(subj, listerFilter, this, payload);
    }
    get(name) {
        return __awaiter(this, void 0, void 0, function*() {
            const si = yield this.info(name);
            return Promise.resolve(new StreamImpl(this, si));
        });
    }
}
exports.StreamAPIImpl = StreamAPIImpl;
class StoredMsgImpl {
    constructor(smr){
        this.smr = smr;
    }
    get subject() {
        return this.smr.message.subject;
    }
    get seq() {
        return this.smr.message.seq;
    }
    get timestamp() {
        return this.smr.message.time;
    }
    get time() {
        return new Date(Date.parse(this.timestamp));
    }
    get data() {
        return this.smr.message.data ? this._parse(this.smr.message.data) : types_1.Empty;
    }
    get header() {
        if (!this._header) {
            if (this.smr.message.hdrs) {
                const hd = this._parse(this.smr.message.hdrs);
                this._header = headers_1.MsgHdrsImpl.decode(hd);
            } else {
                this._header = (0, headers_1.headers)();
            }
        }
        return this._header;
    }
    _parse(s) {
        const bs = atob(s);
        const len = bs.length;
        const bytes = new Uint8Array(len);
        for(let i = 0; i < len; i++){
            bytes[i] = bs.charCodeAt(i);
        }
        return bytes;
    }
    json(reviver) {
        return (0, codec_1.JSONCodec)(reviver).decode(this.data);
    }
    string() {
        return encoders_1.TD.decode(this.data);
    }
}
exports.StoredMsgImpl = StoredMsgImpl;
class StreamsImpl {
    constructor(api){
        this.api = api;
    }
    get(stream) {
        return this.api.info(stream).then((si)=>{
            return new StreamImpl(this.api, si);
        });
    }
}
exports.StreamsImpl = StreamsImpl; //# sourceMappingURL=jsmstream_api.js.map
}),
"[project]/dawg-ai/node_modules/nats/lib/jetstream/jsm.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

/*
 * Copyright 2021-2023 The NATS Authors
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
 */ var __awaiter = /*TURBOPACK member replacement*/ __turbopack_context__.e && /*TURBOPACK member replacement*/ __turbopack_context__.e.__awaiter || function(thisArg, _arguments, P, generator) {
    function adopt(value) {
        return value instanceof P ? value : new P(function(resolve) {
            resolve(value);
        });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
        function fulfilled(value) {
            try {
                step(generator.next(value));
            } catch (e) {
                reject(e);
            }
        }
        function rejected(value) {
            try {
                step(generator["throw"](value));
            } catch (e) {
                reject(e);
            }
        }
        function step(result) {
            result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = /*TURBOPACK member replacement*/ __turbopack_context__.e && /*TURBOPACK member replacement*/ __turbopack_context__.e.__asyncValues || function(o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function() {
        return this;
    }, i);
    //TURBOPACK unreachable
    ;
    function verb(n) {
        i[n] = o[n] && function(v) {
            return new Promise(function(resolve, reject) {
                v = o[n](v), settle(resolve, reject, v.done, v.value);
            });
        };
    }
    function settle(resolve, reject, d, v) {
        Promise.resolve(v).then(function(v) {
            resolve({
                value: v,
                done: d
            });
        }, reject);
    }
};
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.JetStreamManagerImpl = exports.DirectMsgImpl = exports.DirectStreamAPIImpl = void 0;
const jsbaseclient_api_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/jetstream/jsbaseclient_api.js [app-ssr] (ecmascript)");
const jsmstream_api_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/jetstream/jsmstream_api.js [app-ssr] (ecmascript)");
const jsmconsumer_api_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/jetstream/jsmconsumer_api.js [app-ssr] (ecmascript)");
const queued_iterator_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/queued_iterator.js [app-ssr] (ecmascript)");
const types_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/jetstream/types.js [app-ssr] (ecmascript)");
const core_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/core.js [app-ssr] (ecmascript)");
const jsutil_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/jetstream/jsutil.js [app-ssr] (ecmascript)");
const encoders_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/encoders.js [app-ssr] (ecmascript)");
const codec_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/codec.js [app-ssr] (ecmascript)");
class DirectStreamAPIImpl extends jsbaseclient_api_1.BaseApiClient {
    constructor(nc, opts){
        super(nc, opts);
    }
    getMessage(stream, query) {
        return __awaiter(this, void 0, void 0, function*() {
            (0, jsutil_1.validateStreamName)(stream);
            // if doing a last_by_subj request, we append the subject
            // this allows last_by_subj to be subject to permissions (KV)
            let qq = query;
            const { last_by_subj } = qq;
            if (last_by_subj) {
                qq = null;
            }
            const payload = qq ? this.jc.encode(qq) : encoders_1.Empty;
            const pre = this.opts.apiPrefix || "$JS.API";
            const subj = last_by_subj ? `${pre}.DIRECT.GET.${stream}.${last_by_subj}` : `${pre}.DIRECT.GET.${stream}`;
            const r = yield this.nc.request(subj, payload, {
                timeout: this.timeout
            });
            // response is not a JS.API response
            const err = (0, jsutil_1.checkJsError)(r);
            if (err) {
                return Promise.reject(err);
            }
            const dm = new DirectMsgImpl(r);
            return Promise.resolve(dm);
        });
    }
    getBatch(stream, opts) {
        return __awaiter(this, void 0, void 0, function*() {
            (0, jsutil_1.validateStreamName)(stream);
            const pre = this.opts.apiPrefix || "$JS.API";
            const subj = `${pre}.DIRECT.GET.${stream}`;
            if (!Array.isArray(opts.multi_last) || opts.multi_last.length === 0) {
                return Promise.reject("multi_last is required");
            }
            const payload = JSON.stringify(opts, (key, value)=>{
                if (key === "up_to_time" && value instanceof Date) {
                    return value.toISOString();
                }
                return value;
            });
            const iter = new queued_iterator_1.QueuedIteratorImpl();
            const raw = yield this.nc.requestMany(subj, payload, {
                strategy: core_1.RequestStrategy.SentinelMsg
            });
            (()=>__awaiter(this, void 0, void 0, function*() {
                    var _a, e_1, _b, _c;
                    var _d, _e, _f;
                    let gotFirst = false;
                    let badServer = false;
                    let badRequest;
                    try {
                        for(var _g = true, raw_1 = __asyncValues(raw), raw_1_1; raw_1_1 = yield raw_1.next(), _a = raw_1_1.done, !_a; _g = true){
                            _c = raw_1_1.value;
                            _g = false;
                            const m = _c;
                            if (!gotFirst) {
                                gotFirst = true;
                                const code = ((_d = m.headers) === null || _d === void 0 ? void 0 : _d.code) || 0;
                                if (code !== 0 && code < 200 || code > 299) {
                                    badRequest = (_e = m.headers) === null || _e === void 0 ? void 0 : _e.description.toLowerCase();
                                    break;
                                }
                                // inspect the message and make sure that we have a supported server
                                const v = (_f = m.headers) === null || _f === void 0 ? void 0 : _f.get("Nats-Num-Pending");
                                if (v === "") {
                                    badServer = true;
                                    break;
                                }
                            }
                            if (m.data.length === 0) {
                                break;
                            }
                            iter.push(new DirectMsgImpl(m));
                        }
                    } catch (e_1_1) {
                        e_1 = {
                            error: e_1_1
                        };
                    } finally{
                        try {
                            if (!_g && !_a && (_b = raw_1.return)) yield _b.call(raw_1);
                        } finally{
                            if (e_1) throw e_1.error;
                        }
                    }
                    //@ts-ignore: term function
                    iter.push(()=>{
                        if (badServer) {
                            throw new Error("batch direct get not supported by the server");
                        }
                        if (badRequest) {
                            throw new Error(`bad request: ${badRequest}`);
                        }
                        iter.stop();
                    });
                }))();
            return Promise.resolve(iter);
        });
    }
}
exports.DirectStreamAPIImpl = DirectStreamAPIImpl;
class DirectMsgImpl {
    constructor(m){
        if (!m.headers) {
            throw new Error("headers expected");
        }
        this.data = m.data;
        this.header = m.headers;
    }
    get subject() {
        return this.header.last(types_1.DirectMsgHeaders.Subject);
    }
    get seq() {
        const v = this.header.last(types_1.DirectMsgHeaders.Sequence);
        return typeof v === "string" ? parseInt(v) : 0;
    }
    get time() {
        return new Date(Date.parse(this.timestamp));
    }
    get timestamp() {
        return this.header.last(types_1.DirectMsgHeaders.TimeStamp);
    }
    get stream() {
        return this.header.last(types_1.DirectMsgHeaders.Stream);
    }
    json(reviver) {
        return (0, codec_1.JSONCodec)(reviver).decode(this.data);
    }
    string() {
        return encoders_1.TD.decode(this.data);
    }
}
exports.DirectMsgImpl = DirectMsgImpl;
class JetStreamManagerImpl extends jsbaseclient_api_1.BaseApiClient {
    constructor(nc, opts){
        super(nc, opts);
        this.streams = new jsmstream_api_1.StreamAPIImpl(nc, opts);
        this.consumers = new jsmconsumer_api_1.ConsumerAPIImpl(nc, opts);
        this.direct = new DirectStreamAPIImpl(nc, opts);
    }
    getAccountInfo() {
        return __awaiter(this, void 0, void 0, function*() {
            const r = yield this._request(`${this.prefix}.INFO`);
            return r;
        });
    }
    jetstream() {
        return this.nc.jetstream(this.getOptions());
    }
    advisories() {
        const iter = new queued_iterator_1.QueuedIteratorImpl();
        this.nc.subscribe(`$JS.EVENT.ADVISORY.>`, {
            callback: (err, msg)=>{
                if (err) {
                    throw err;
                }
                try {
                    const d = this.parseJsResponse(msg);
                    const chunks = d.type.split(".");
                    const kind = chunks[chunks.length - 1];
                    iter.push({
                        kind: kind,
                        data: d
                    });
                } catch (err) {
                    iter.stop(err);
                }
            }
        });
        return iter;
    }
}
exports.JetStreamManagerImpl = JetStreamManagerImpl; //# sourceMappingURL=jsm.js.map
}),
"[project]/dawg-ai/node_modules/nats/lib/nats-base-client/service.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __awaiter = /*TURBOPACK member replacement*/ __turbopack_context__.e && /*TURBOPACK member replacement*/ __turbopack_context__.e.__awaiter || function(thisArg, _arguments, P, generator) {
    function adopt(value) {
        return value instanceof P ? value : new P(function(resolve) {
            resolve(value);
        });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
        function fulfilled(value) {
            try {
                step(generator.next(value));
            } catch (e) {
                reject(e);
            }
        }
        function rejected(value) {
            try {
                step(generator["throw"](value));
            } catch (e) {
                reject(e);
            }
        }
        function step(result) {
            result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ServiceImpl = exports.ServiceGroupImpl = exports.ServiceMsgImpl = exports.ServiceApiPrefix = void 0;
/*
 * Copyright 2022-2023 The NATS Authors
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
 */ const util_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/util.js [app-ssr] (ecmascript)");
const headers_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/headers.js [app-ssr] (ecmascript)");
const codec_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/codec.js [app-ssr] (ecmascript)");
const nuid_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/nuid.js [app-ssr] (ecmascript)");
const queued_iterator_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/queued_iterator.js [app-ssr] (ecmascript)");
const jsutil_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/jetstream/jsutil.js [app-ssr] (ecmascript)");
const semver_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/semver.js [app-ssr] (ecmascript)");
const encoders_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/encoders.js [app-ssr] (ecmascript)");
const core_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/core.js [app-ssr] (ecmascript)");
/**
 * Services have common backplane subject pattern:
 *
 * `$SRV.PING|STATS|INFO` - pings or retrieves status for all services
 * `$SRV.PING|STATS|INFO.<name>` - pings or retrieves status for all services having the specified name
 * `$SRV.PING|STATS|INFO.<name>.<id>` - pings or retrieves status of a particular service
 *
 * Note that <name> and <id> are upper-cased.
 */ exports.ServiceApiPrefix = "$SRV";
class ServiceMsgImpl {
    constructor(msg){
        this.msg = msg;
    }
    get data() {
        return this.msg.data;
    }
    get sid() {
        return this.msg.sid;
    }
    get subject() {
        return this.msg.subject;
    }
    get reply() {
        return this.msg.reply || "";
    }
    get headers() {
        return this.msg.headers;
    }
    respond(data, opts) {
        return this.msg.respond(data, opts);
    }
    respondError(code, description, data, opts) {
        var _a, _b;
        opts = opts || {};
        opts.headers = opts.headers || (0, headers_1.headers)();
        (_a = opts.headers) === null || _a === void 0 ? void 0 : _a.set(core_1.ServiceErrorCodeHeader, `${code}`);
        (_b = opts.headers) === null || _b === void 0 ? void 0 : _b.set(core_1.ServiceErrorHeader, description);
        return this.msg.respond(data, opts);
    }
    json(reviver) {
        return this.msg.json(reviver);
    }
    string() {
        return this.msg.string();
    }
}
exports.ServiceMsgImpl = ServiceMsgImpl;
class ServiceGroupImpl {
    constructor(parent, name = "", queue = ""){
        if (name !== "") {
            validInternalToken("service group", name);
        }
        let root = "";
        if (parent instanceof ServiceImpl) {
            this.srv = parent;
            root = "";
        } else if (parent instanceof ServiceGroupImpl) {
            const sg = parent;
            this.srv = sg.srv;
            if (queue === "" && sg.queue !== "") {
                queue = sg.queue;
            }
            root = sg.subject;
        } else {
            throw new Error("unknown ServiceGroup type");
        }
        this.subject = this.calcSubject(root, name);
        this.queue = queue;
    }
    calcSubject(root, name = "") {
        if (name === "") {
            return root;
        }
        return root !== "" ? `${root}.${name}` : name;
    }
    addEndpoint(name = "", opts) {
        opts = opts || {
            subject: name
        };
        const args = typeof opts === "function" ? {
            handler: opts,
            subject: name
        } : opts;
        (0, jsutil_1.validateName)("endpoint", name);
        let { subject, handler, metadata, queue } = args;
        subject = subject || name;
        queue = queue || this.queue;
        validSubjectName("endpoint subject", subject);
        subject = this.calcSubject(this.subject, subject);
        const ne = {
            name,
            subject,
            queue,
            handler,
            metadata
        };
        return this.srv._addEndpoint(ne);
    }
    addGroup(name = "", queue = "") {
        return new ServiceGroupImpl(this, name, queue);
    }
}
exports.ServiceGroupImpl = ServiceGroupImpl;
function validSubjectName(context, subj) {
    if (subj === "") {
        throw new Error(`${context} cannot be empty`);
    }
    if (subj.indexOf(" ") !== -1) {
        throw new Error(`${context} cannot contain spaces: '${subj}'`);
    }
    const tokens = subj.split(".");
    tokens.forEach((v, idx)=>{
        if (v === ">" && idx !== tokens.length - 1) {
            throw new Error(`${context} cannot have internal '>': '${subj}'`);
        }
    });
}
function validInternalToken(context, subj) {
    if (subj.indexOf(" ") !== -1) {
        throw new Error(`${context} cannot contain spaces: '${subj}'`);
    }
    const tokens = subj.split(".");
    tokens.forEach((v)=>{
        if (v === ">") {
            throw new Error(`${context} name cannot contain internal '>': '${subj}'`);
        }
    });
}
class ServiceImpl {
    /**
     * @param verb
     * @param name
     * @param id
     * @param prefix - this is only supplied by tooling when building control subject that crosses an account
     */ static controlSubject(verb, name = "", id = "", prefix) {
        // the prefix is used as is, because it is an
        // account boundary permission
        const pre = prefix !== null && prefix !== void 0 ? prefix : exports.ServiceApiPrefix;
        if (name === "" && id === "") {
            return `${pre}.${verb}`;
        }
        (0, jsutil_1.validateName)("control subject name", name);
        if (id !== "") {
            (0, jsutil_1.validateName)("control subject id", id);
            return `${pre}.${verb}.${name}.${id}`;
        }
        return `${pre}.${verb}.${name}`;
    }
    constructor(nc, config = {
        name: "",
        version: ""
    }){
        this.nc = nc;
        this.config = Object.assign({}, config);
        if (!this.config.queue) {
            this.config.queue = "q";
        }
        // this will throw if no name
        (0, jsutil_1.validateName)("name", this.config.name);
        (0, jsutil_1.validateName)("queue", this.config.queue);
        // this will throw if not semver
        (0, semver_1.parseSemVer)(this.config.version);
        this._id = nuid_1.nuid.next();
        this.internal = [];
        this._done = (0, util_1.deferred)();
        this._stopped = false;
        this.handlers = [];
        this.started = new Date().toISOString();
        // initialize the stats
        this.reset();
        // close if the connection closes
        this.nc.closed().then(()=>{
            this.close().catch();
        }).catch((err)=>{
            this.close(err).catch();
        });
    }
    get subjects() {
        return this.handlers.filter((s)=>{
            return s.internal === false;
        }).map((s)=>{
            return s.subject;
        });
    }
    get id() {
        return this._id;
    }
    get name() {
        return this.config.name;
    }
    get description() {
        var _a;
        return (_a = this.config.description) !== null && _a !== void 0 ? _a : "";
    }
    get version() {
        return this.config.version;
    }
    get metadata() {
        return this.config.metadata;
    }
    errorToHeader(err) {
        const h = (0, headers_1.headers)();
        if (err instanceof core_1.ServiceError) {
            const se = err;
            h.set(core_1.ServiceErrorHeader, se.message);
            h.set(core_1.ServiceErrorCodeHeader, `${se.code}`);
        } else {
            h.set(core_1.ServiceErrorHeader, err.message);
            h.set(core_1.ServiceErrorCodeHeader, "500");
        }
        return h;
    }
    setupHandler(h, internal = false) {
        // internals don't use a queue
        const queue = internal ? "" : h.queue ? h.queue : this.config.queue;
        const { name, subject, handler } = h;
        const sv = h;
        sv.internal = internal;
        if (internal) {
            this.internal.push(sv);
        }
        sv.stats = new NamedEndpointStatsImpl(name, subject, queue);
        sv.queue = queue;
        const callback = handler ? (err, msg)=>{
            if (err) {
                this.close(err);
                return;
            }
            const start = Date.now();
            try {
                handler(err, new ServiceMsgImpl(msg));
            } catch (err) {
                sv.stats.countError(err);
                msg === null || msg === void 0 ? void 0 : msg.respond(encoders_1.Empty, {
                    headers: this.errorToHeader(err)
                });
            } finally{
                sv.stats.countLatency(start);
            }
        } : undefined;
        sv.sub = this.nc.subscribe(subject, {
            callback,
            queue
        });
        sv.sub.closed.then(()=>{
            if (!this._stopped) {
                this.close(new Error(`required subscription ${h.subject} stopped`)).catch();
            }
        }).catch((err)=>{
            if (!this._stopped) {
                const ne = new Error(`required subscription ${h.subject} errored: ${err.message}`);
                ne.stack = err.stack;
                this.close(ne).catch();
            }
        });
        return sv;
    }
    info() {
        return {
            type: core_1.ServiceResponseType.INFO,
            name: this.name,
            id: this.id,
            version: this.version,
            description: this.description,
            metadata: this.metadata,
            endpoints: this.endpoints()
        };
    }
    endpoints() {
        return this.handlers.map((v)=>{
            const { subject, metadata, name, queue } = v;
            return {
                subject,
                metadata,
                name,
                queue_group: queue
            };
        });
    }
    stats() {
        return __awaiter(this, void 0, void 0, function*() {
            const endpoints = [];
            for (const h of this.handlers){
                if (typeof this.config.statsHandler === "function") {
                    try {
                        h.stats.data = yield this.config.statsHandler(h);
                    } catch (err) {
                        h.stats.countError(err);
                    }
                }
                endpoints.push(h.stats.stats(h.qi));
            }
            return {
                type: core_1.ServiceResponseType.STATS,
                name: this.name,
                id: this.id,
                version: this.version,
                started: this.started,
                metadata: this.metadata,
                endpoints
            };
        });
    }
    addInternalHandler(verb, handler) {
        const v = `${verb}`.toUpperCase();
        this._doAddInternalHandler(`${v}-all`, verb, handler);
        this._doAddInternalHandler(`${v}-kind`, verb, handler, this.name);
        this._doAddInternalHandler(`${v}`, verb, handler, this.name, this.id);
    }
    _doAddInternalHandler(name, verb, handler, kind = "", id = "") {
        const endpoint = {};
        endpoint.name = name;
        endpoint.subject = ServiceImpl.controlSubject(verb, kind, id);
        endpoint.handler = handler;
        this.setupHandler(endpoint, true);
    }
    start() {
        const jc = (0, codec_1.JSONCodec)();
        const statsHandler = (err, msg)=>{
            if (err) {
                this.close(err);
                return Promise.reject(err);
            }
            return this.stats().then((s)=>{
                msg === null || msg === void 0 ? void 0 : msg.respond(jc.encode(s));
                return Promise.resolve();
            });
        };
        const infoHandler = (err, msg)=>{
            if (err) {
                this.close(err);
                return Promise.reject(err);
            }
            msg === null || msg === void 0 ? void 0 : msg.respond(jc.encode(this.info()));
            return Promise.resolve();
        };
        const ping = jc.encode(this.ping());
        const pingHandler = (err, msg)=>{
            if (err) {
                this.close(err).then().catch();
                return Promise.reject(err);
            }
            msg.respond(ping);
            return Promise.resolve();
        };
        this.addInternalHandler(core_1.ServiceVerb.PING, pingHandler);
        this.addInternalHandler(core_1.ServiceVerb.STATS, statsHandler);
        this.addInternalHandler(core_1.ServiceVerb.INFO, infoHandler);
        // now the actual service
        this.handlers.forEach((h)=>{
            const { subject } = h;
            if (typeof subject !== "string") {
                return;
            }
            // this is expected in cases where main subject is just
            // a root subject for multiple endpoints - user can disable
            // listening to the root endpoint, by specifying null
            if (h.handler === null) {
                return;
            }
            this.setupHandler(h);
        });
        return Promise.resolve(this);
    }
    close(err) {
        if (this._stopped) {
            return this._done;
        }
        this._stopped = true;
        let buf = [];
        if (!this.nc.isClosed()) {
            buf = this.handlers.concat(this.internal).map((h)=>{
                return h.sub.drain();
            });
        }
        Promise.allSettled(buf).then(()=>{
            this._done.resolve(err ? err : null);
        });
        return this._done;
    }
    get stopped() {
        return this._done;
    }
    get isStopped() {
        return this._stopped;
    }
    stop(err) {
        return this.close(err);
    }
    ping() {
        return {
            type: core_1.ServiceResponseType.PING,
            name: this.name,
            id: this.id,
            version: this.version,
            metadata: this.metadata
        };
    }
    reset() {
        // pretend we restarted
        this.started = new Date().toISOString();
        if (this.handlers) {
            for (const h of this.handlers){
                h.stats.reset(h.qi);
            }
        }
    }
    addGroup(name, queue) {
        return new ServiceGroupImpl(this, name, queue);
    }
    addEndpoint(name, handler) {
        const sg = new ServiceGroupImpl(this);
        return sg.addEndpoint(name, handler);
    }
    _addEndpoint(e) {
        const qi = new queued_iterator_1.QueuedIteratorImpl();
        qi.noIterator = typeof e.handler === "function";
        if (!qi.noIterator) {
            e.handler = (err, msg)=>{
                err ? this.stop(err).catch() : qi.push(new ServiceMsgImpl(msg));
            };
            // close the service if the iterator closes
            qi.iterClosed.then(()=>{
                this.close().catch();
            });
        }
        // track the iterator for stats
        const ss = this.setupHandler(e, false);
        ss.qi = qi;
        this.handlers.push(ss);
        return qi;
    }
}
exports.ServiceImpl = ServiceImpl;
class NamedEndpointStatsImpl {
    constructor(name, subject, queue = ""){
        this.name = name;
        this.subject = subject;
        this.average_processing_time = 0;
        this.num_errors = 0;
        this.num_requests = 0;
        this.processing_time = 0;
        this.queue = queue;
    }
    reset(qi) {
        this.num_requests = 0;
        this.processing_time = 0;
        this.average_processing_time = 0;
        this.num_errors = 0;
        this.last_error = undefined;
        this.data = undefined;
        const qii = qi;
        if (qii) {
            qii.time = 0;
            qii.processed = 0;
        }
    }
    countLatency(start) {
        this.num_requests++;
        this.processing_time += (0, util_1.nanos)(Date.now() - start);
        this.average_processing_time = Math.round(this.processing_time / this.num_requests);
    }
    countError(err) {
        this.num_errors++;
        this.last_error = err.message;
    }
    _stats() {
        const { name, subject, average_processing_time, num_errors, num_requests, processing_time, last_error, data, queue } = this;
        return {
            name,
            subject,
            average_processing_time,
            num_errors,
            num_requests,
            processing_time,
            last_error,
            data,
            queue_group: queue
        };
    }
    stats(qi) {
        const qii = qi;
        if ((qii === null || qii === void 0 ? void 0 : qii.noIterator) === false) {
            // grab stats in the iterator
            this.processing_time = (0, util_1.nanos)(qii.time);
            this.num_requests = qii.processed;
            this.average_processing_time = this.processing_time > 0 && this.num_requests > 0 ? this.processing_time / this.num_requests : 0;
        }
        return this._stats();
    }
} //# sourceMappingURL=service.js.map
}),
"[project]/dawg-ai/node_modules/nats/lib/nats-base-client/serviceclient.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __awaiter = /*TURBOPACK member replacement*/ __turbopack_context__.e && /*TURBOPACK member replacement*/ __turbopack_context__.e.__awaiter || function(thisArg, _arguments, P, generator) {
    function adopt(value) {
        return value instanceof P ? value : new P(function(resolve) {
            resolve(value);
        });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
        function fulfilled(value) {
            try {
                step(generator.next(value));
            } catch (e) {
                reject(e);
            }
        }
        function rejected(value) {
            try {
                step(generator["throw"](value));
            } catch (e) {
                reject(e);
            }
        }
        function step(result) {
            result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = /*TURBOPACK member replacement*/ __turbopack_context__.e && /*TURBOPACK member replacement*/ __turbopack_context__.e.__asyncValues || function(o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function() {
        return this;
    }, i);
    //TURBOPACK unreachable
    ;
    function verb(n) {
        i[n] = o[n] && function(v) {
            return new Promise(function(resolve, reject) {
                v = o[n](v), settle(resolve, reject, v.done, v.value);
            });
        };
    }
    function settle(resolve, reject, d, v) {
        Promise.resolve(v).then(function(v) {
            resolve({
                value: v,
                done: d
            });
        }, reject);
    }
};
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ServiceClientImpl = void 0;
/*
 * Copyright 2022-2023 The NATS Authors
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
 */ const encoders_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/encoders.js [app-ssr] (ecmascript)");
const codec_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/codec.js [app-ssr] (ecmascript)");
const queued_iterator_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/queued_iterator.js [app-ssr] (ecmascript)");
const core_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/core.js [app-ssr] (ecmascript)");
const service_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/service.js [app-ssr] (ecmascript)");
const core_2 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/core.js [app-ssr] (ecmascript)");
class ServiceClientImpl {
    constructor(nc, opts = {
        strategy: core_2.RequestStrategy.JitterTimer,
        maxWait: 2000
    }, prefix){
        this.nc = nc;
        this.prefix = prefix;
        this.opts = opts;
    }
    ping(name = "", id = "") {
        return this.q(core_1.ServiceVerb.PING, name, id);
    }
    stats(name = "", id = "") {
        return this.q(core_1.ServiceVerb.STATS, name, id);
    }
    info(name = "", id = "") {
        return this.q(core_1.ServiceVerb.INFO, name, id);
    }
    q(v_1) {
        return __awaiter(this, arguments, void 0, function*(v, name = "", id = "") {
            const iter = new queued_iterator_1.QueuedIteratorImpl();
            const jc = (0, codec_1.JSONCodec)();
            const subj = service_1.ServiceImpl.controlSubject(v, name, id, this.prefix);
            const responses = yield this.nc.requestMany(subj, encoders_1.Empty, this.opts);
            (()=>__awaiter(this, void 0, void 0, function*() {
                    var _a, e_1, _b, _c;
                    try {
                        for(var _d = true, responses_1 = __asyncValues(responses), responses_1_1; responses_1_1 = yield responses_1.next(), _a = responses_1_1.done, !_a; _d = true){
                            _c = responses_1_1.value;
                            _d = false;
                            const m = _c;
                            try {
                                const s = jc.decode(m.data);
                                iter.push(s);
                            } catch (err) {
                                // @ts-ignore: pushing fn
                                iter.push(()=>{
                                    iter.stop(err);
                                });
                            }
                        }
                    } catch (e_1_1) {
                        e_1 = {
                            error: e_1_1
                        };
                    } finally{
                        try {
                            if (!_d && !_a && (_b = responses_1.return)) yield _b.call(responses_1);
                        } finally{
                            if (e_1) throw e_1.error;
                        }
                    }
                    //@ts-ignore: push a fn
                    iter.push(()=>{
                        iter.stop();
                    });
                }))().catch((err)=>{
                iter.stop(err);
            });
            return iter;
        });
    }
}
exports.ServiceClientImpl = ServiceClientImpl; //# sourceMappingURL=serviceclient.js.map
}),
"[project]/dawg-ai/node_modules/nats/lib/nats-base-client/nats.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

/*
 * Copyright 2018-2023 The NATS Authors
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
 */ var __awaiter = /*TURBOPACK member replacement*/ __turbopack_context__.e && /*TURBOPACK member replacement*/ __turbopack_context__.e.__awaiter || function(thisArg, _arguments, P, generator) {
    function adopt(value) {
        return value instanceof P ? value : new P(function(resolve) {
            resolve(value);
        });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
        function fulfilled(value) {
            try {
                step(generator.next(value));
            } catch (e) {
                reject(e);
            }
        }
        function rejected(value) {
            try {
                step(generator["throw"](value));
            } catch (e) {
                reject(e);
            }
        }
        function step(result) {
            result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = /*TURBOPACK member replacement*/ __turbopack_context__.e && /*TURBOPACK member replacement*/ __turbopack_context__.e.__asyncValues || function(o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function() {
        return this;
    }, i);
    //TURBOPACK unreachable
    ;
    function verb(n) {
        i[n] = o[n] && function(v) {
            return new Promise(function(resolve, reject) {
                v = o[n](v), settle(resolve, reject, v.done, v.value);
            });
        };
    }
    function settle(resolve, reject, d, v) {
        Promise.resolve(v).then(function(v) {
            resolve({
                value: v,
                done: d
            });
        }, reject);
    }
};
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ServicesFactory = exports.NatsConnectionImpl = void 0;
const util_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/util.js [app-ssr] (ecmascript)");
const protocol_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/protocol.js [app-ssr] (ecmascript)");
const encoders_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/encoders.js [app-ssr] (ecmascript)");
const types_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/types.js [app-ssr] (ecmascript)");
const semver_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/semver.js [app-ssr] (ecmascript)");
const options_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/options.js [app-ssr] (ecmascript)");
const queued_iterator_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/queued_iterator.js [app-ssr] (ecmascript)");
const request_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/request.js [app-ssr] (ecmascript)");
const msg_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/msg.js [app-ssr] (ecmascript)");
const jsm_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/jetstream/jsm.js [app-ssr] (ecmascript)");
const jsclient_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/jetstream/jsclient.js [app-ssr] (ecmascript)");
const service_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/service.js [app-ssr] (ecmascript)");
const serviceclient_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/serviceclient.js [app-ssr] (ecmascript)");
const core_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/core.js [app-ssr] (ecmascript)");
class NatsConnectionImpl {
    constructor(opts){
        this.draining = false;
        this.options = (0, options_1.parseOptions)(opts);
        this.listeners = [];
    }
    static connect(opts = {}) {
        return new Promise((resolve, reject)=>{
            const nc = new NatsConnectionImpl(opts);
            protocol_1.ProtocolHandler.connect(nc.options, nc).then((ph)=>{
                nc.protocol = ph;
                (function() {
                    return __awaiter(this, void 0, void 0, function*() {
                        var _a, e_1, _b, _c;
                        try {
                            for(var _d = true, _e = __asyncValues(ph.status()), _f; _f = yield _e.next(), _a = _f.done, !_a; _d = true){
                                _c = _f.value;
                                _d = false;
                                const s = _c;
                                nc.listeners.forEach((l)=>{
                                    l.push(s);
                                });
                            }
                        } catch (e_1_1) {
                            e_1 = {
                                error: e_1_1
                            };
                        } finally{
                            try {
                                if (!_d && !_a && (_b = _e.return)) yield _b.call(_e);
                            } finally{
                                if (e_1) throw e_1.error;
                            }
                        }
                    });
                })();
                resolve(nc);
            }).catch((err)=>{
                reject(err);
            });
        });
    }
    closed() {
        return this.protocol.closed;
    }
    close() {
        return __awaiter(this, void 0, void 0, function*() {
            yield this.protocol.close();
        });
    }
    _check(subject, sub, pub) {
        if (this.isClosed()) {
            throw types_1.NatsError.errorForCode(core_1.ErrorCode.ConnectionClosed);
        }
        if (sub && this.isDraining()) {
            throw types_1.NatsError.errorForCode(core_1.ErrorCode.ConnectionDraining);
        }
        if (pub && this.protocol.noMorePublishing) {
            throw types_1.NatsError.errorForCode(core_1.ErrorCode.ConnectionDraining);
        }
        subject = subject || "";
        if (subject.length === 0) {
            throw types_1.NatsError.errorForCode(core_1.ErrorCode.BadSubject);
        }
    }
    publish(subject, data, options) {
        this._check(subject, false, true);
        this.protocol.publish(subject, data, options);
    }
    publishMessage(msg) {
        return this.publish(msg.subject, msg.data, {
            reply: msg.reply,
            headers: msg.headers
        });
    }
    respondMessage(msg) {
        if (msg.reply) {
            this.publish(msg.reply, msg.data, {
                reply: msg.reply,
                headers: msg.headers
            });
            return true;
        }
        return false;
    }
    subscribe(subject, opts = {}) {
        this._check(subject, true, false);
        const sub = new protocol_1.SubscriptionImpl(this.protocol, subject, opts);
        this.protocol.subscribe(sub);
        return sub;
    }
    _resub(s, subject, max) {
        this._check(subject, true, false);
        const si = s;
        // FIXME: need way of understanding a callbacks processed
        //   count without it, we cannot really do much - ie
        //   for rejected messages, the count would be lower, etc.
        //   To handle cases were for example KV is building a map
        //   the consumer would say how many messages we need to do
        //   a proper build before we can handle updates.
        si.max = max; // this might clear it
        if (max) {
            // we cannot auto-unsub, because we don't know the
            // number of messages we processed vs received
            // allow the auto-unsub on processMsg to work if they
            // we were called with a new max
            si.max = max + si.received;
        }
        this.protocol.resub(si, subject);
    }
    // possibilities are:
    // stop on error or any non-100 status
    // AND:
    // - wait for timer
    // - wait for n messages or timer
    // - wait for unknown messages, done when empty or reset timer expires (with possible alt wait)
    // - wait for unknown messages, done when an empty payload is received or timer expires (with possible alt wait)
    requestMany(subject, data = encoders_1.Empty, opts = {
        maxWait: 1000,
        maxMessages: -1
    }) {
        const asyncTraces = !(this.protocol.options.noAsyncTraces || false);
        try {
            this._check(subject, true, true);
        } catch (err) {
            return Promise.reject(err);
        }
        opts.strategy = opts.strategy || core_1.RequestStrategy.Timer;
        opts.maxWait = opts.maxWait || 1000;
        if (opts.maxWait < 1) {
            return Promise.reject(new types_1.NatsError("timeout", core_1.ErrorCode.InvalidOption));
        }
        // the iterator for user results
        const qi = new queued_iterator_1.QueuedIteratorImpl();
        function stop(err) {
            //@ts-ignore: stop function
            qi.push(()=>{
                qi.stop(err);
            });
        }
        // callback for the subscription or the mux handler
        // simply pushes errors and messages into the iterator
        function callback(err, msg) {
            if (err || msg === null) {
                stop(err === null ? undefined : err);
            } else {
                qi.push(msg);
            }
        }
        if (opts.noMux) {
            // we setup a subscription and manage it
            const stack = asyncTraces ? new Error().stack : null;
            let max = typeof opts.maxMessages === "number" && opts.maxMessages > 0 ? opts.maxMessages : -1;
            const sub = this.subscribe((0, core_1.createInbox)(this.options.inboxPrefix), {
                callback: (err, msg)=>{
                    var _a, _b;
                    // we only expect runtime errors or a no responders
                    if (((_a = msg === null || msg === void 0 ? void 0 : msg.data) === null || _a === void 0 ? void 0 : _a.length) === 0 && ((_b = msg === null || msg === void 0 ? void 0 : msg.headers) === null || _b === void 0 ? void 0 : _b.status) === core_1.ErrorCode.NoResponders) {
                        err = types_1.NatsError.errorForCode(core_1.ErrorCode.NoResponders);
                    }
                    // augment any error with the current stack to provide context
                    // for the error on the suer code
                    if (err) {
                        if (stack) {
                            err.stack += `\n\n${stack}`;
                        }
                        cancel(err);
                        return;
                    }
                    // push the message
                    callback(null, msg);
                    // see if the m request is completed
                    if (opts.strategy === core_1.RequestStrategy.Count) {
                        max--;
                        if (max === 0) {
                            cancel();
                        }
                    }
                    if (opts.strategy === core_1.RequestStrategy.JitterTimer) {
                        clearTimers();
                        timer = setTimeout(()=>{
                            cancel();
                        }, 300);
                    }
                    if (opts.strategy === core_1.RequestStrategy.SentinelMsg) {
                        if (msg && msg.data.length === 0) {
                            cancel();
                        }
                    }
                }
            });
            sub.requestSubject = subject;
            sub.closed.then(()=>{
                stop();
            }).catch((err)=>{
                qi.stop(err);
            });
            const cancel = (err)=>{
                if (err) {
                    //@ts-ignore: error
                    qi.push(()=>{
                        throw err;
                    });
                }
                clearTimers();
                sub.drain().then(()=>{
                    stop();
                }).catch((_err)=>{
                    stop();
                });
            };
            qi.iterClosed.then(()=>{
                clearTimers();
                sub === null || sub === void 0 ? void 0 : sub.unsubscribe();
            }).catch((_err)=>{
                clearTimers();
                sub === null || sub === void 0 ? void 0 : sub.unsubscribe();
            });
            try {
                this.publish(subject, data, {
                    reply: sub.getSubject()
                });
            } catch (err) {
                cancel(err);
            }
            let timer = setTimeout(()=>{
                cancel();
            }, opts.maxWait);
            const clearTimers = ()=>{
                if (timer) {
                    clearTimeout(timer);
                }
            };
        } else {
            // the ingestion is the RequestMany
            const rmo = opts;
            rmo.callback = callback;
            qi.iterClosed.then(()=>{
                r.cancel();
            }).catch((err)=>{
                r.cancel(err);
            });
            const r = new request_1.RequestMany(this.protocol.muxSubscriptions, subject, rmo);
            this.protocol.request(r);
            try {
                this.publish(subject, data, {
                    reply: `${this.protocol.muxSubscriptions.baseInbox}${r.token}`,
                    headers: opts.headers
                });
            } catch (err) {
                r.cancel(err);
            }
        }
        return Promise.resolve(qi);
    }
    request(subject, data, opts = {
        timeout: 1000,
        noMux: false
    }) {
        try {
            this._check(subject, true, true);
        } catch (err) {
            return Promise.reject(err);
        }
        const asyncTraces = !(this.protocol.options.noAsyncTraces || false);
        opts.timeout = opts.timeout || 1000;
        if (opts.timeout < 1) {
            return Promise.reject(new types_1.NatsError("timeout", core_1.ErrorCode.InvalidOption));
        }
        if (!opts.noMux && opts.reply) {
            return Promise.reject(new types_1.NatsError("reply can only be used with noMux", core_1.ErrorCode.InvalidOption));
        }
        if (opts.noMux) {
            const inbox = opts.reply ? opts.reply : (0, core_1.createInbox)(this.options.inboxPrefix);
            const d = (0, util_1.deferred)();
            const errCtx = asyncTraces ? new Error() : null;
            const sub = this.subscribe(inbox, {
                max: 1,
                timeout: opts.timeout,
                callback: (err, msg)=>{
                    if (err) {
                        // timeouts from `timeout()` will have the proper stack
                        if (errCtx && err.code !== core_1.ErrorCode.Timeout) {
                            err.stack += `\n\n${errCtx.stack}`;
                        }
                        sub.unsubscribe();
                        d.reject(err);
                    } else {
                        err = (0, msg_1.isRequestError)(msg);
                        if (err) {
                            // if we failed here, help the developer by showing what failed
                            if (errCtx) {
                                err.stack += `\n\n${errCtx.stack}`;
                            }
                            d.reject(err);
                        } else {
                            d.resolve(msg);
                        }
                    }
                }
            });
            sub.requestSubject = subject;
            this.protocol.publish(subject, data, {
                reply: inbox,
                headers: opts.headers
            });
            return d;
        } else {
            const r = new request_1.RequestOne(this.protocol.muxSubscriptions, subject, opts, asyncTraces);
            this.protocol.request(r);
            try {
                this.publish(subject, data, {
                    reply: `${this.protocol.muxSubscriptions.baseInbox}${r.token}`,
                    headers: opts.headers
                });
            } catch (err) {
                r.cancel(err);
            }
            const p = Promise.race([
                r.timer,
                r.deferred
            ]);
            p.catch(()=>{
                r.cancel();
            });
            return p;
        }
    }
    /** *
     * Flushes to the server. Promise resolves when round-trip completes.
     * @returns {Promise<void>}
     */ flush() {
        if (this.isClosed()) {
            return Promise.reject(types_1.NatsError.errorForCode(core_1.ErrorCode.ConnectionClosed));
        }
        return this.protocol.flush();
    }
    drain() {
        if (this.isClosed()) {
            return Promise.reject(types_1.NatsError.errorForCode(core_1.ErrorCode.ConnectionClosed));
        }
        if (this.isDraining()) {
            return Promise.reject(types_1.NatsError.errorForCode(core_1.ErrorCode.ConnectionDraining));
        }
        this.draining = true;
        return this.protocol.drain();
    }
    isClosed() {
        return this.protocol.isClosed();
    }
    isDraining() {
        return this.draining;
    }
    getServer() {
        const srv = this.protocol.getServer();
        return srv ? srv.listen : "";
    }
    status() {
        const iter = new queued_iterator_1.QueuedIteratorImpl();
        iter.iterClosed.then(()=>{
            const idx = this.listeners.indexOf(iter);
            this.listeners.splice(idx, 1);
        });
        this.listeners.push(iter);
        return iter;
    }
    get info() {
        return this.protocol.isClosed() ? undefined : this.protocol.info;
    }
    context() {
        return __awaiter(this, void 0, void 0, function*() {
            const r = yield this.request(`$SYS.REQ.USER.INFO`);
            return r.json((key, value)=>{
                if (key === "time") {
                    return new Date(Date.parse(value));
                }
                return value;
            });
        });
    }
    stats() {
        return {
            inBytes: this.protocol.inBytes,
            outBytes: this.protocol.outBytes,
            inMsgs: this.protocol.inMsgs,
            outMsgs: this.protocol.outMsgs
        };
    }
    jetstreamManager() {
        return __awaiter(this, arguments, void 0, function*(opts = {}) {
            const adm = new jsm_1.JetStreamManagerImpl(this, opts);
            if (opts.checkAPI !== false) {
                try {
                    yield adm.getAccountInfo();
                } catch (err) {
                    const ne = err;
                    if (ne.code === core_1.ErrorCode.NoResponders) {
                        ne.code = core_1.ErrorCode.JetStreamNotEnabled;
                    }
                    throw ne;
                }
            }
            return adm;
        });
    }
    jetstream(opts = {}) {
        return new jsclient_1.JetStreamClientImpl(this, opts);
    }
    getServerVersion() {
        const info = this.info;
        return info ? (0, semver_1.parseSemVer)(info.version) : undefined;
    }
    rtt() {
        return __awaiter(this, void 0, void 0, function*() {
            if (!this.protocol._closed && !this.protocol.connected) {
                throw types_1.NatsError.errorForCode(core_1.ErrorCode.Disconnect);
            }
            const start = Date.now();
            yield this.flush();
            return Date.now() - start;
        });
    }
    get features() {
        return this.protocol.features;
    }
    get services() {
        if (!this._services) {
            this._services = new ServicesFactory(this);
        }
        return this._services;
    }
    reconnect() {
        if (this.isClosed()) {
            return Promise.reject(types_1.NatsError.errorForCode(core_1.ErrorCode.ConnectionClosed));
        }
        if (this.isDraining()) {
            return Promise.reject(types_1.NatsError.errorForCode(core_1.ErrorCode.ConnectionDraining));
        }
        return this.protocol.reconnect();
    }
}
exports.NatsConnectionImpl = NatsConnectionImpl;
class ServicesFactory {
    constructor(nc){
        this.nc = nc;
    }
    add(config) {
        try {
            const s = new service_1.ServiceImpl(this.nc, config);
            return s.start();
        } catch (err) {
            return Promise.reject(err);
        }
    }
    client(opts, prefix) {
        return new serviceclient_1.ServiceClientImpl(this.nc, opts, prefix);
    }
}
exports.ServicesFactory = ServicesFactory; //# sourceMappingURL=nats.js.map
}),
"[project]/dawg-ai/node_modules/nats/lib/nats-base-client/bench.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

/*
 * Copyright 2020-2022 The NATS Authors
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
 */ var __awaiter = /*TURBOPACK member replacement*/ __turbopack_context__.e && /*TURBOPACK member replacement*/ __turbopack_context__.e.__awaiter || function(thisArg, _arguments, P, generator) {
    function adopt(value) {
        return value instanceof P ? value : new P(function(resolve) {
            resolve(value);
        });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
        function fulfilled(value) {
            try {
                step(generator.next(value));
            } catch (e) {
                reject(e);
            }
        }
        function rejected(value) {
            try {
                step(generator["throw"](value));
            } catch (e) {
                reject(e);
            }
        }
        function step(result) {
            result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = /*TURBOPACK member replacement*/ __turbopack_context__.e && /*TURBOPACK member replacement*/ __turbopack_context__.e.__asyncValues || function(o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function() {
        return this;
    }, i);
    //TURBOPACK unreachable
    ;
    function verb(n) {
        i[n] = o[n] && function(v) {
            return new Promise(function(resolve, reject) {
                v = o[n](v), settle(resolve, reject, v.done, v.value);
            });
        };
    }
    function settle(resolve, reject, d, v) {
        Promise.resolve(v).then(function(v) {
            resolve({
                value: v,
                done: d
            });
        }, reject);
    }
};
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Bench = exports.Metric = void 0;
exports.throughput = throughput;
exports.msgThroughput = msgThroughput;
exports.humanizeBytes = humanizeBytes;
const types_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/types.js [app-ssr] (ecmascript)");
const nuid_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/nuid.js [app-ssr] (ecmascript)");
const util_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/util.js [app-ssr] (ecmascript)");
const core_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/core.js [app-ssr] (ecmascript)");
class Metric {
    constructor(name, duration){
        this.name = name;
        this.duration = duration;
        this.date = Date.now();
        this.payload = 0;
        this.msgs = 0;
        this.bytes = 0;
    }
    toString() {
        const sec = this.duration / 1000;
        const mps = Math.round(this.msgs / sec);
        const label = this.asyncRequests ? "asyncRequests" : "";
        let minmax = "";
        if (this.max) {
            minmax = `${this.min}/${this.max}`;
        }
        return `${this.name}${label ? " [asyncRequests]" : ""} ${humanizeNumber(mps)} msgs/sec - [${sec.toFixed(2)} secs] ~ ${throughput(this.bytes, sec)} ${minmax}`;
    }
    toCsv() {
        return `"${this.name}",${new Date(this.date).toISOString()},${this.lang},${this.version},${this.msgs},${this.payload},${this.bytes},${this.duration},${this.asyncRequests ? this.asyncRequests : false}\n`;
    }
    static header() {
        return `Test,Date,Lang,Version,Count,MsgPayload,Bytes,Millis,Async\n`;
    }
}
exports.Metric = Metric;
class Bench {
    constructor(nc, opts = {
        msgs: 100000,
        size: 128,
        subject: "",
        asyncRequests: false,
        pub: false,
        sub: false,
        req: false,
        rep: false
    }){
        this.nc = nc;
        this.callbacks = opts.callbacks || false;
        this.msgs = opts.msgs || 0;
        this.size = opts.size || 0;
        this.subject = opts.subject || nuid_1.nuid.next();
        this.asyncRequests = opts.asyncRequests || false;
        this.pub = opts.pub || false;
        this.sub = opts.sub || false;
        this.req = opts.req || false;
        this.rep = opts.rep || false;
        this.perf = new util_1.Perf();
        this.payload = this.size ? new Uint8Array(this.size) : types_1.Empty;
        if (!this.pub && !this.sub && !this.req && !this.rep) {
            throw new Error("no bench option selected");
        }
    }
    run() {
        return __awaiter(this, void 0, void 0, function*() {
            this.nc.closed().then((err)=>{
                if (err) {
                    throw new core_1.NatsError(`bench closed with an error: ${err.message}`, core_1.ErrorCode.Unknown, err);
                }
            });
            if (this.callbacks) {
                yield this.runCallbacks();
            } else {
                yield this.runAsync();
            }
            return this.processMetrics();
        });
    }
    processMetrics() {
        const nc = this.nc;
        const { lang, version } = nc.protocol.transport;
        if (this.pub && this.sub) {
            this.perf.measure("pubsub", "pubStart", "subStop");
        }
        if (this.req && this.rep) {
            this.perf.measure("reqrep", "reqStart", "reqStop");
        }
        const measures = this.perf.getEntries();
        const pubsub = measures.find((m)=>m.name === "pubsub");
        const reqrep = measures.find((m)=>m.name === "reqrep");
        const req = measures.find((m)=>m.name === "req");
        const rep = measures.find((m)=>m.name === "rep");
        const pub = measures.find((m)=>m.name === "pub");
        const sub = measures.find((m)=>m.name === "sub");
        const stats = this.nc.stats();
        const metrics = [];
        if (pubsub) {
            const { name, duration } = pubsub;
            const m = new Metric(name, duration);
            m.msgs = this.msgs * 2;
            m.bytes = stats.inBytes + stats.outBytes;
            m.lang = lang;
            m.version = version;
            m.payload = this.payload.length;
            metrics.push(m);
        }
        if (reqrep) {
            const { name, duration } = reqrep;
            const m = new Metric(name, duration);
            m.msgs = this.msgs * 2;
            m.bytes = stats.inBytes + stats.outBytes;
            m.lang = lang;
            m.version = version;
            m.payload = this.payload.length;
            metrics.push(m);
        }
        if (pub) {
            const { name, duration } = pub;
            const m = new Metric(name, duration);
            m.msgs = this.msgs;
            m.bytes = stats.outBytes;
            m.lang = lang;
            m.version = version;
            m.payload = this.payload.length;
            metrics.push(m);
        }
        if (sub) {
            const { name, duration } = sub;
            const m = new Metric(name, duration);
            m.msgs = this.msgs;
            m.bytes = stats.inBytes;
            m.lang = lang;
            m.version = version;
            m.payload = this.payload.length;
            metrics.push(m);
        }
        if (rep) {
            const { name, duration } = rep;
            const m = new Metric(name, duration);
            m.msgs = this.msgs;
            m.bytes = stats.inBytes + stats.outBytes;
            m.lang = lang;
            m.version = version;
            m.payload = this.payload.length;
            metrics.push(m);
        }
        if (req) {
            const { name, duration } = req;
            const m = new Metric(name, duration);
            m.msgs = this.msgs;
            m.bytes = stats.inBytes + stats.outBytes;
            m.lang = lang;
            m.version = version;
            m.payload = this.payload.length;
            metrics.push(m);
        }
        return metrics;
    }
    runCallbacks() {
        return __awaiter(this, void 0, void 0, function*() {
            const jobs = [];
            if (this.sub) {
                const d = (0, util_1.deferred)();
                jobs.push(d);
                let i = 0;
                this.nc.subscribe(this.subject, {
                    max: this.msgs,
                    callback: ()=>{
                        i++;
                        if (i === 1) {
                            this.perf.mark("subStart");
                        }
                        if (i === this.msgs) {
                            this.perf.mark("subStop");
                            this.perf.measure("sub", "subStart", "subStop");
                            d.resolve();
                        }
                    }
                });
            }
            if (this.rep) {
                const d = (0, util_1.deferred)();
                jobs.push(d);
                let i = 0;
                this.nc.subscribe(this.subject, {
                    max: this.msgs,
                    callback: (_, m)=>{
                        m.respond(this.payload);
                        i++;
                        if (i === 1) {
                            this.perf.mark("repStart");
                        }
                        if (i === this.msgs) {
                            this.perf.mark("repStop");
                            this.perf.measure("rep", "repStart", "repStop");
                            d.resolve();
                        }
                    }
                });
            }
            if (this.pub) {
                const job = (()=>__awaiter(this, void 0, void 0, function*() {
                        this.perf.mark("pubStart");
                        for(let i = 0; i < this.msgs; i++){
                            this.nc.publish(this.subject, this.payload);
                        }
                        yield this.nc.flush();
                        this.perf.mark("pubStop");
                        this.perf.measure("pub", "pubStart", "pubStop");
                    }))();
                jobs.push(job);
            }
            if (this.req) {
                const job = (()=>__awaiter(this, void 0, void 0, function*() {
                        if (this.asyncRequests) {
                            this.perf.mark("reqStart");
                            const a = [];
                            for(let i = 0; i < this.msgs; i++){
                                a.push(this.nc.request(this.subject, this.payload, {
                                    timeout: 20000
                                }));
                            }
                            yield Promise.all(a);
                            this.perf.mark("reqStop");
                            this.perf.measure("req", "reqStart", "reqStop");
                        } else {
                            this.perf.mark("reqStart");
                            for(let i = 0; i < this.msgs; i++){
                                yield this.nc.request(this.subject);
                            }
                            this.perf.mark("reqStop");
                            this.perf.measure("req", "reqStart", "reqStop");
                        }
                    }))();
                jobs.push(job);
            }
            yield Promise.all(jobs);
        });
    }
    runAsync() {
        return __awaiter(this, void 0, void 0, function*() {
            const jobs = [];
            if (this.rep) {
                let first = false;
                const sub = this.nc.subscribe(this.subject, {
                    max: this.msgs
                });
                const job = (()=>__awaiter(this, void 0, void 0, function*() {
                        var _a, e_1, _b, _c;
                        try {
                            for(var _d = true, sub_1 = __asyncValues(sub), sub_1_1; sub_1_1 = yield sub_1.next(), _a = sub_1_1.done, !_a; _d = true){
                                _c = sub_1_1.value;
                                _d = false;
                                const m = _c;
                                if (!first) {
                                    this.perf.mark("repStart");
                                    first = true;
                                }
                                m.respond(this.payload);
                            }
                        } catch (e_1_1) {
                            e_1 = {
                                error: e_1_1
                            };
                        } finally{
                            try {
                                if (!_d && !_a && (_b = sub_1.return)) yield _b.call(sub_1);
                            } finally{
                                if (e_1) throw e_1.error;
                            }
                        }
                        yield this.nc.flush();
                        this.perf.mark("repStop");
                        this.perf.measure("rep", "repStart", "repStop");
                    }))();
                jobs.push(job);
            }
            if (this.sub) {
                let first = false;
                const sub = this.nc.subscribe(this.subject, {
                    max: this.msgs
                });
                const job = (()=>__awaiter(this, void 0, void 0, function*() {
                        var _a, e_2, _b, _c;
                        try {
                            for(var _d = true, sub_2 = __asyncValues(sub), sub_2_1; sub_2_1 = yield sub_2.next(), _a = sub_2_1.done, !_a; _d = true){
                                _c = sub_2_1.value;
                                _d = false;
                                const _m = _c;
                                if (!first) {
                                    this.perf.mark("subStart");
                                    first = true;
                                }
                            }
                        } catch (e_2_1) {
                            e_2 = {
                                error: e_2_1
                            };
                        } finally{
                            try {
                                if (!_d && !_a && (_b = sub_2.return)) yield _b.call(sub_2);
                            } finally{
                                if (e_2) throw e_2.error;
                            }
                        }
                        this.perf.mark("subStop");
                        this.perf.measure("sub", "subStart", "subStop");
                    }))();
                jobs.push(job);
            }
            if (this.pub) {
                const job = (()=>__awaiter(this, void 0, void 0, function*() {
                        this.perf.mark("pubStart");
                        for(let i = 0; i < this.msgs; i++){
                            this.nc.publish(this.subject, this.payload);
                        }
                        yield this.nc.flush();
                        this.perf.mark("pubStop");
                        this.perf.measure("pub", "pubStart", "pubStop");
                    }))();
                jobs.push(job);
            }
            if (this.req) {
                const job = (()=>__awaiter(this, void 0, void 0, function*() {
                        if (this.asyncRequests) {
                            this.perf.mark("reqStart");
                            const a = [];
                            for(let i = 0; i < this.msgs; i++){
                                a.push(this.nc.request(this.subject, this.payload, {
                                    timeout: 20000
                                }));
                            }
                            yield Promise.all(a);
                            this.perf.mark("reqStop");
                            this.perf.measure("req", "reqStart", "reqStop");
                        } else {
                            this.perf.mark("reqStart");
                            for(let i = 0; i < this.msgs; i++){
                                yield this.nc.request(this.subject);
                            }
                            this.perf.mark("reqStop");
                            this.perf.measure("req", "reqStart", "reqStop");
                        }
                    }))();
                jobs.push(job);
            }
            yield Promise.all(jobs);
        });
    }
}
exports.Bench = Bench;
function throughput(bytes, seconds) {
    return `${humanizeBytes(bytes / seconds)}/sec`;
}
function msgThroughput(msgs, seconds) {
    return `${Math.floor(msgs / seconds)} msgs/sec`;
}
function humanizeBytes(bytes, si = false) {
    const base = si ? 1000 : 1024;
    const pre = si ? [
        "k",
        "M",
        "G",
        "T",
        "P",
        "E"
    ] : [
        "K",
        "M",
        "G",
        "T",
        "P",
        "E"
    ];
    const post = si ? "iB" : "B";
    if (bytes < base) {
        return `${bytes.toFixed(2)} ${post}`;
    }
    const exp = parseInt(Math.log(bytes) / Math.log(base) + "");
    const index = parseInt(exp - 1 + "");
    return `${(bytes / Math.pow(base, exp)).toFixed(2)} ${pre[index]}${post}`;
}
function humanizeNumber(n) {
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
} //# sourceMappingURL=bench.js.map
}),
"[project]/dawg-ai/node_modules/nats/lib/nats-base-client/internal_mod.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
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
exports.parseIP = exports.isIP = exports.TE = exports.TD = exports.Metric = exports.Bench = exports.writeAll = exports.readAll = exports.MAX_SIZE = exports.DenoBuffer = exports.State = exports.Parser = exports.Kind = exports.QueuedIteratorImpl = exports.StringCodec = exports.JSONCodec = exports.usernamePasswordAuthenticator = exports.tokenAuthenticator = exports.nkeyAuthenticator = exports.jwtAuthenticator = exports.credsAuthenticator = exports.RequestOne = exports.checkUnsupportedOption = exports.checkOptions = exports.buildAuthenticator = exports.DataBuffer = exports.MuxSubscription = exports.Heartbeat = exports.MsgHdrsImpl = exports.headers = exports.canonicalMIMEHeaderKey = exports.timeout = exports.render = exports.nanos = exports.millis = exports.extend = exports.delay = exports.deferred = exports.deadline = exports.collect = exports.backoff = exports.ProtocolHandler = exports.INFO = exports.Connect = exports.setTransportFactory = exports.getResolveFn = exports.MsgImpl = exports.nuid = exports.Nuid = exports.NatsConnectionImpl = void 0;
exports.Subscriptions = exports.SubscriptionImpl = exports.syncIterator = exports.ServiceVerb = exports.ServiceResponseType = exports.ServiceErrorHeader = exports.ServiceErrorCodeHeader = exports.ServiceError = exports.RequestStrategy = exports.NatsError = exports.Match = exports.isNatsError = exports.Events = exports.ErrorCode = exports.DebugEvents = exports.createInbox = exports.extractProtocolMessage = exports.Empty = exports.parseSemVer = exports.compare = exports.NoopKvCodecs = exports.defaultBucketOpts = exports.Bucket = exports.Base64KeyCodec = exports.TypedSubscription = void 0;
var nats_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/nats.js [app-ssr] (ecmascript)");
Object.defineProperty(exports, "NatsConnectionImpl", {
    enumerable: true,
    get: function() {
        return nats_1.NatsConnectionImpl;
    }
});
var nuid_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/nuid.js [app-ssr] (ecmascript)");
Object.defineProperty(exports, "Nuid", {
    enumerable: true,
    get: function() {
        return nuid_1.Nuid;
    }
});
Object.defineProperty(exports, "nuid", {
    enumerable: true,
    get: function() {
        return nuid_1.nuid;
    }
});
var msg_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/msg.js [app-ssr] (ecmascript)");
Object.defineProperty(exports, "MsgImpl", {
    enumerable: true,
    get: function() {
        return msg_1.MsgImpl;
    }
});
var transport_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/transport.js [app-ssr] (ecmascript)");
Object.defineProperty(exports, "getResolveFn", {
    enumerable: true,
    get: function() {
        return transport_1.getResolveFn;
    }
});
Object.defineProperty(exports, "setTransportFactory", {
    enumerable: true,
    get: function() {
        return transport_1.setTransportFactory;
    }
});
var protocol_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/protocol.js [app-ssr] (ecmascript)");
Object.defineProperty(exports, "Connect", {
    enumerable: true,
    get: function() {
        return protocol_1.Connect;
    }
});
Object.defineProperty(exports, "INFO", {
    enumerable: true,
    get: function() {
        return protocol_1.INFO;
    }
});
Object.defineProperty(exports, "ProtocolHandler", {
    enumerable: true,
    get: function() {
        return protocol_1.ProtocolHandler;
    }
});
var util_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/util.js [app-ssr] (ecmascript)");
Object.defineProperty(exports, "backoff", {
    enumerable: true,
    get: function() {
        return util_1.backoff;
    }
});
Object.defineProperty(exports, "collect", {
    enumerable: true,
    get: function() {
        return util_1.collect;
    }
});
Object.defineProperty(exports, "deadline", {
    enumerable: true,
    get: function() {
        return util_1.deadline;
    }
});
Object.defineProperty(exports, "deferred", {
    enumerable: true,
    get: function() {
        return util_1.deferred;
    }
});
Object.defineProperty(exports, "delay", {
    enumerable: true,
    get: function() {
        return util_1.delay;
    }
});
Object.defineProperty(exports, "extend", {
    enumerable: true,
    get: function() {
        return util_1.extend;
    }
});
Object.defineProperty(exports, "millis", {
    enumerable: true,
    get: function() {
        return util_1.millis;
    }
});
Object.defineProperty(exports, "nanos", {
    enumerable: true,
    get: function() {
        return util_1.nanos;
    }
});
Object.defineProperty(exports, "render", {
    enumerable: true,
    get: function() {
        return util_1.render;
    }
});
Object.defineProperty(exports, "timeout", {
    enumerable: true,
    get: function() {
        return util_1.timeout;
    }
});
var headers_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/headers.js [app-ssr] (ecmascript)");
Object.defineProperty(exports, "canonicalMIMEHeaderKey", {
    enumerable: true,
    get: function() {
        return headers_1.canonicalMIMEHeaderKey;
    }
});
Object.defineProperty(exports, "headers", {
    enumerable: true,
    get: function() {
        return headers_1.headers;
    }
});
Object.defineProperty(exports, "MsgHdrsImpl", {
    enumerable: true,
    get: function() {
        return headers_1.MsgHdrsImpl;
    }
});
var heartbeats_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/heartbeats.js [app-ssr] (ecmascript)");
Object.defineProperty(exports, "Heartbeat", {
    enumerable: true,
    get: function() {
        return heartbeats_1.Heartbeat;
    }
});
var muxsubscription_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/muxsubscription.js [app-ssr] (ecmascript)");
Object.defineProperty(exports, "MuxSubscription", {
    enumerable: true,
    get: function() {
        return muxsubscription_1.MuxSubscription;
    }
});
var databuffer_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/databuffer.js [app-ssr] (ecmascript)");
Object.defineProperty(exports, "DataBuffer", {
    enumerable: true,
    get: function() {
        return databuffer_1.DataBuffer;
    }
});
var options_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/options.js [app-ssr] (ecmascript)");
Object.defineProperty(exports, "buildAuthenticator", {
    enumerable: true,
    get: function() {
        return options_1.buildAuthenticator;
    }
});
Object.defineProperty(exports, "checkOptions", {
    enumerable: true,
    get: function() {
        return options_1.checkOptions;
    }
});
Object.defineProperty(exports, "checkUnsupportedOption", {
    enumerable: true,
    get: function() {
        return options_1.checkUnsupportedOption;
    }
});
var request_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/request.js [app-ssr] (ecmascript)");
Object.defineProperty(exports, "RequestOne", {
    enumerable: true,
    get: function() {
        return request_1.RequestOne;
    }
});
var authenticator_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/authenticator.js [app-ssr] (ecmascript)");
Object.defineProperty(exports, "credsAuthenticator", {
    enumerable: true,
    get: function() {
        return authenticator_1.credsAuthenticator;
    }
});
Object.defineProperty(exports, "jwtAuthenticator", {
    enumerable: true,
    get: function() {
        return authenticator_1.jwtAuthenticator;
    }
});
Object.defineProperty(exports, "nkeyAuthenticator", {
    enumerable: true,
    get: function() {
        return authenticator_1.nkeyAuthenticator;
    }
});
Object.defineProperty(exports, "tokenAuthenticator", {
    enumerable: true,
    get: function() {
        return authenticator_1.tokenAuthenticator;
    }
});
Object.defineProperty(exports, "usernamePasswordAuthenticator", {
    enumerable: true,
    get: function() {
        return authenticator_1.usernamePasswordAuthenticator;
    }
});
var codec_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/codec.js [app-ssr] (ecmascript)");
Object.defineProperty(exports, "JSONCodec", {
    enumerable: true,
    get: function() {
        return codec_1.JSONCodec;
    }
});
Object.defineProperty(exports, "StringCodec", {
    enumerable: true,
    get: function() {
        return codec_1.StringCodec;
    }
});
__exportStar(__turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/nkeys.js [app-ssr] (ecmascript)"), exports);
var queued_iterator_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/queued_iterator.js [app-ssr] (ecmascript)");
Object.defineProperty(exports, "QueuedIteratorImpl", {
    enumerable: true,
    get: function() {
        return queued_iterator_1.QueuedIteratorImpl;
    }
});
var parser_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/parser.js [app-ssr] (ecmascript)");
Object.defineProperty(exports, "Kind", {
    enumerable: true,
    get: function() {
        return parser_1.Kind;
    }
});
Object.defineProperty(exports, "Parser", {
    enumerable: true,
    get: function() {
        return parser_1.Parser;
    }
});
Object.defineProperty(exports, "State", {
    enumerable: true,
    get: function() {
        return parser_1.State;
    }
});
var denobuffer_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/denobuffer.js [app-ssr] (ecmascript)");
Object.defineProperty(exports, "DenoBuffer", {
    enumerable: true,
    get: function() {
        return denobuffer_1.DenoBuffer;
    }
});
Object.defineProperty(exports, "MAX_SIZE", {
    enumerable: true,
    get: function() {
        return denobuffer_1.MAX_SIZE;
    }
});
Object.defineProperty(exports, "readAll", {
    enumerable: true,
    get: function() {
        return denobuffer_1.readAll;
    }
});
Object.defineProperty(exports, "writeAll", {
    enumerable: true,
    get: function() {
        return denobuffer_1.writeAll;
    }
});
var bench_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/bench.js [app-ssr] (ecmascript)");
Object.defineProperty(exports, "Bench", {
    enumerable: true,
    get: function() {
        return bench_1.Bench;
    }
});
Object.defineProperty(exports, "Metric", {
    enumerable: true,
    get: function() {
        return bench_1.Metric;
    }
});
var encoders_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/encoders.js [app-ssr] (ecmascript)");
Object.defineProperty(exports, "TD", {
    enumerable: true,
    get: function() {
        return encoders_1.TD;
    }
});
Object.defineProperty(exports, "TE", {
    enumerable: true,
    get: function() {
        return encoders_1.TE;
    }
});
var ipparser_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/ipparser.js [app-ssr] (ecmascript)");
Object.defineProperty(exports, "isIP", {
    enumerable: true,
    get: function() {
        return ipparser_1.isIP;
    }
});
Object.defineProperty(exports, "parseIP", {
    enumerable: true,
    get: function() {
        return ipparser_1.parseIP;
    }
});
var typedsub_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/typedsub.js [app-ssr] (ecmascript)");
Object.defineProperty(exports, "TypedSubscription", {
    enumerable: true,
    get: function() {
        return typedsub_1.TypedSubscription;
    }
});
var kv_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/jetstream/kv.js [app-ssr] (ecmascript)");
Object.defineProperty(exports, "Base64KeyCodec", {
    enumerable: true,
    get: function() {
        return kv_1.Base64KeyCodec;
    }
});
Object.defineProperty(exports, "Bucket", {
    enumerable: true,
    get: function() {
        return kv_1.Bucket;
    }
});
Object.defineProperty(exports, "defaultBucketOpts", {
    enumerable: true,
    get: function() {
        return kv_1.defaultBucketOpts;
    }
});
Object.defineProperty(exports, "NoopKvCodecs", {
    enumerable: true,
    get: function() {
        return kv_1.NoopKvCodecs;
    }
});
var semver_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/semver.js [app-ssr] (ecmascript)");
Object.defineProperty(exports, "compare", {
    enumerable: true,
    get: function() {
        return semver_1.compare;
    }
});
Object.defineProperty(exports, "parseSemVer", {
    enumerable: true,
    get: function() {
        return semver_1.parseSemVer;
    }
});
var types_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/types.js [app-ssr] (ecmascript)");
Object.defineProperty(exports, "Empty", {
    enumerable: true,
    get: function() {
        return types_1.Empty;
    }
});
var transport_2 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/transport.js [app-ssr] (ecmascript)");
Object.defineProperty(exports, "extractProtocolMessage", {
    enumerable: true,
    get: function() {
        return transport_2.extractProtocolMessage;
    }
});
var core_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/core.js [app-ssr] (ecmascript)");
Object.defineProperty(exports, "createInbox", {
    enumerable: true,
    get: function() {
        return core_1.createInbox;
    }
});
Object.defineProperty(exports, "DebugEvents", {
    enumerable: true,
    get: function() {
        return core_1.DebugEvents;
    }
});
Object.defineProperty(exports, "ErrorCode", {
    enumerable: true,
    get: function() {
        return core_1.ErrorCode;
    }
});
Object.defineProperty(exports, "Events", {
    enumerable: true,
    get: function() {
        return core_1.Events;
    }
});
Object.defineProperty(exports, "isNatsError", {
    enumerable: true,
    get: function() {
        return core_1.isNatsError;
    }
});
Object.defineProperty(exports, "Match", {
    enumerable: true,
    get: function() {
        return core_1.Match;
    }
});
Object.defineProperty(exports, "NatsError", {
    enumerable: true,
    get: function() {
        return core_1.NatsError;
    }
});
Object.defineProperty(exports, "RequestStrategy", {
    enumerable: true,
    get: function() {
        return core_1.RequestStrategy;
    }
});
Object.defineProperty(exports, "ServiceError", {
    enumerable: true,
    get: function() {
        return core_1.ServiceError;
    }
});
Object.defineProperty(exports, "ServiceErrorCodeHeader", {
    enumerable: true,
    get: function() {
        return core_1.ServiceErrorCodeHeader;
    }
});
Object.defineProperty(exports, "ServiceErrorHeader", {
    enumerable: true,
    get: function() {
        return core_1.ServiceErrorHeader;
    }
});
Object.defineProperty(exports, "ServiceResponseType", {
    enumerable: true,
    get: function() {
        return core_1.ServiceResponseType;
    }
});
Object.defineProperty(exports, "ServiceVerb", {
    enumerable: true,
    get: function() {
        return core_1.ServiceVerb;
    }
});
Object.defineProperty(exports, "syncIterator", {
    enumerable: true,
    get: function() {
        return core_1.syncIterator;
    }
});
var protocol_2 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/protocol.js [app-ssr] (ecmascript)");
Object.defineProperty(exports, "SubscriptionImpl", {
    enumerable: true,
    get: function() {
        return protocol_2.SubscriptionImpl;
    }
});
Object.defineProperty(exports, "Subscriptions", {
    enumerable: true,
    get: function() {
        return protocol_2.Subscriptions;
    }
}); //# sourceMappingURL=internal_mod.js.map
}),
"[project]/dawg-ai/node_modules/nats/lib/jetstream/internal_mod.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ConsumerEvents = exports.ConsumerDebugEvents = exports.StoreCompression = exports.StorageType = exports.RetentionPolicy = exports.ReplayPolicy = exports.DiscardPolicy = exports.DeliverPolicy = exports.AckPolicy = exports.RepublishHeaders = exports.KvWatchInclude = exports.JsHeaders = exports.isConsumerOptsBuilder = exports.DirectMsgHeaders = exports.consumerOpts = exports.AdvisoryKind = exports.isHeartbeatMsg = exports.isFlowControlMsg = exports.checkJsError = void 0;
/*
 * Copyright 2023-2024 The NATS Authors
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
 */ var jsutil_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/jetstream/jsutil.js [app-ssr] (ecmascript)");
Object.defineProperty(exports, "checkJsError", {
    enumerable: true,
    get: function() {
        return jsutil_1.checkJsError;
    }
});
Object.defineProperty(exports, "isFlowControlMsg", {
    enumerable: true,
    get: function() {
        return jsutil_1.isFlowControlMsg;
    }
});
Object.defineProperty(exports, "isHeartbeatMsg", {
    enumerable: true,
    get: function() {
        return jsutil_1.isHeartbeatMsg;
    }
});
var types_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/jetstream/types.js [app-ssr] (ecmascript)");
Object.defineProperty(exports, "AdvisoryKind", {
    enumerable: true,
    get: function() {
        return types_1.AdvisoryKind;
    }
});
Object.defineProperty(exports, "consumerOpts", {
    enumerable: true,
    get: function() {
        return types_1.consumerOpts;
    }
});
Object.defineProperty(exports, "DirectMsgHeaders", {
    enumerable: true,
    get: function() {
        return types_1.DirectMsgHeaders;
    }
});
Object.defineProperty(exports, "isConsumerOptsBuilder", {
    enumerable: true,
    get: function() {
        return types_1.isConsumerOptsBuilder;
    }
});
Object.defineProperty(exports, "JsHeaders", {
    enumerable: true,
    get: function() {
        return types_1.JsHeaders;
    }
});
Object.defineProperty(exports, "KvWatchInclude", {
    enumerable: true,
    get: function() {
        return types_1.KvWatchInclude;
    }
});
Object.defineProperty(exports, "RepublishHeaders", {
    enumerable: true,
    get: function() {
        return types_1.RepublishHeaders;
    }
});
var jsapi_types_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/jetstream/jsapi_types.js [app-ssr] (ecmascript)");
Object.defineProperty(exports, "AckPolicy", {
    enumerable: true,
    get: function() {
        return jsapi_types_1.AckPolicy;
    }
});
Object.defineProperty(exports, "DeliverPolicy", {
    enumerable: true,
    get: function() {
        return jsapi_types_1.DeliverPolicy;
    }
});
Object.defineProperty(exports, "DiscardPolicy", {
    enumerable: true,
    get: function() {
        return jsapi_types_1.DiscardPolicy;
    }
});
Object.defineProperty(exports, "ReplayPolicy", {
    enumerable: true,
    get: function() {
        return jsapi_types_1.ReplayPolicy;
    }
});
Object.defineProperty(exports, "RetentionPolicy", {
    enumerable: true,
    get: function() {
        return jsapi_types_1.RetentionPolicy;
    }
});
Object.defineProperty(exports, "StorageType", {
    enumerable: true,
    get: function() {
        return jsapi_types_1.StorageType;
    }
});
Object.defineProperty(exports, "StoreCompression", {
    enumerable: true,
    get: function() {
        return jsapi_types_1.StoreCompression;
    }
});
var consumer_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/jetstream/consumer.js [app-ssr] (ecmascript)");
Object.defineProperty(exports, "ConsumerDebugEvents", {
    enumerable: true,
    get: function() {
        return consumer_1.ConsumerDebugEvents;
    }
});
Object.defineProperty(exports, "ConsumerEvents", {
    enumerable: true,
    get: function() {
        return consumer_1.ConsumerEvents;
    }
}); //# sourceMappingURL=internal_mod.js.map
}),
"[project]/dawg-ai/node_modules/nats/lib/src/nats-base-client.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
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
/*
 * Copyright 2020 The NATS Authors
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
 */ __exportStar(__turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/internal_mod.js [app-ssr] (ecmascript)"), exports);
__exportStar(__turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/jetstream/internal_mod.js [app-ssr] (ecmascript)"), exports); //# sourceMappingURL=nats-base-client.js.map
}),
"[project]/dawg-ai/node_modules/nats/lib/src/node_transport.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __awaiter = /*TURBOPACK member replacement*/ __turbopack_context__.e && /*TURBOPACK member replacement*/ __turbopack_context__.e.__awaiter || function(thisArg, _arguments, P, generator) {
    function adopt(value) {
        return value instanceof P ? value : new P(function(resolve) {
            resolve(value);
        });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
        function fulfilled(value) {
            try {
                step(generator.next(value));
            } catch (e) {
                reject(e);
            }
        }
        function rejected(value) {
            try {
                step(generator["throw"](value));
            } catch (e) {
                reject(e);
            }
        }
        function step(result) {
            result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __await = /*TURBOPACK member replacement*/ __turbopack_context__.e && /*TURBOPACK member replacement*/ __turbopack_context__.e.__await || function(v) {
    return this instanceof __await ? (this.v = v, this) : new __await(v);
};
var __asyncGenerator = /*TURBOPACK member replacement*/ __turbopack_context__.e && /*TURBOPACK member replacement*/ __turbopack_context__.e.__asyncGenerator || function(thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = Object.create((typeof AsyncIterator === "function" ? AsyncIterator : Object).prototype), verb("next"), verb("throw"), verb("return", awaitReturn), i[Symbol.asyncIterator] = function() {
        return this;
    }, i;
    //TURBOPACK unreachable
    ;
    function awaitReturn(f) {
        return function(v) {
            return Promise.resolve(v).then(f, reject);
        };
    }
    function verb(n, f) {
        if (g[n]) {
            i[n] = function(v) {
                return new Promise(function(a, b) {
                    q.push([
                        n,
                        v,
                        a,
                        b
                    ]) > 1 || resume(n, v);
                });
            };
            if (f) i[n] = f(i[n]);
        }
    }
    function resume(n, v) {
        try {
            step(g[n](v));
        } catch (e) {
            settle(q[0][3], e);
        }
    }
    function step(r) {
        r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r);
    }
    function fulfill(value) {
        resume("next", value);
    }
    function reject(value) {
        resume("throw", value);
    }
    function settle(f, v) {
        if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]);
    }
};
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.NodeTransport = void 0;
exports.nodeResolveHost = nodeResolveHost;
/*
 * Copyright 2020-2024 The NATS Authors
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
 */ const nats_base_client_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/src/nats-base-client.js [app-ssr] (ecmascript)");
const net_1 = __turbopack_context__.r("[externals]/net [external] (net, cjs)");
const util_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/util.js [app-ssr] (ecmascript)");
const tls_1 = __turbopack_context__.r("[externals]/tls [external] (tls, cjs)");
const { resolve } = __turbopack_context__.r("[externals]/path [external] (path, cjs)");
const { readFile, existsSync } = __turbopack_context__.r("[externals]/fs [external] (fs, cjs)");
const dns = __turbopack_context__.r("[externals]/dns [external] (dns, cjs)");
const VERSION = "2.29.3";
const LANG = "nats.js";
class NodeTransport {
    constructor(){
        this.yields = [];
        this.signal = (0, nats_base_client_1.deferred)();
        this.closedNotification = (0, nats_base_client_1.deferred)();
        this.connected = false;
        this.tlsName = "";
        this.done = false;
        this.lang = LANG;
        this.version = VERSION;
    }
    connect(hp, options) {
        return __awaiter(this, void 0, void 0, function*() {
            this.tlsName = hp.tlsName;
            this.options = options;
            const { tls } = this.options;
            const { handshakeFirst } = tls || {};
            try {
                if (handshakeFirst === true) {
                    this.socket = yield this.tlsFirst(hp);
                } else {
                    this.socket = yield this.dial(hp);
                }
                const info = yield this.peekInfo();
                (0, nats_base_client_1.checkOptions)(info, options);
                const { tls_required: tlsRequired, tls_available: tlsAvailable } = info;
                const desired = tlsAvailable === true && options.tls !== null;
                if (!handshakeFirst && (tlsRequired || desired)) {
                    this.socket = yield this.startTLS();
                }
                //@ts-ignore: this is possibly a TlsSocket
                if (tlsRequired && this.socket.encrypted !== true) {
                    throw new nats_base_client_1.NatsError("tls", nats_base_client_1.ErrorCode.ServerOptionNotAvailable);
                }
                this.connected = true;
                this.setupHandlers();
                this.signal.resolve();
                return Promise.resolve();
            } catch (err) {
                if (!err) {
                    // this seems to be possible in Kubernetes
                    // where an error is thrown, but it is undefined
                    // when something like istio-init is booting up
                    err = nats_base_client_1.NatsError.errorForCode(nats_base_client_1.ErrorCode.ConnectionRefused, new Error("node provided an undefined error!"));
                }
                const { code } = err;
                const perr = code === "ECONNREFUSED" ? nats_base_client_1.NatsError.errorForCode(nats_base_client_1.ErrorCode.ConnectionRefused, err) : err;
                if (this.socket) {
                    this.socket.destroy();
                }
                throw perr;
            }
        });
    }
    dial(hp) {
        const d = (0, nats_base_client_1.deferred)();
        let dialError;
        const socket = (0, net_1.createConnection)(hp.port, hp.hostname, ()=>{
            d.resolve(socket);
            socket.removeAllListeners();
        });
        socket.on("error", (err)=>{
            dialError = err;
        });
        socket.on("close", ()=>{
            socket.removeAllListeners();
            d.reject(dialError);
        });
        socket.setNoDelay(true);
        return d;
    }
    get isClosed() {
        return this.done;
    }
    close(err) {
        return this._closed(err, false);
    }
    peekInfo() {
        const d = (0, nats_base_client_1.deferred)();
        let peekError;
        this.socket.on("data", (frame)=>{
            this.yields.push(frame);
            const t = nats_base_client_1.DataBuffer.concat(...this.yields);
            const pm = (0, nats_base_client_1.extractProtocolMessage)(t);
            if (pm !== "") {
                try {
                    const m = nats_base_client_1.INFO.exec(pm);
                    if (!m) {
                        throw new Error("unexpected response from server");
                    }
                    const info = JSON.parse(m[1]);
                    d.resolve(info);
                } catch (err) {
                    d.reject(err);
                } finally{
                    this.socket.removeAllListeners();
                }
            }
        });
        this.socket.on("error", (err)=>{
            peekError = err;
        });
        this.socket.on("close", ()=>{
            this.socket.removeAllListeners();
            d.reject(peekError);
        });
        return d;
    }
    loadFile(fn) {
        if (!fn) {
            return Promise.resolve();
        }
        const d = (0, nats_base_client_1.deferred)();
        try {
            fn = resolve(fn);
            if (!existsSync(fn)) {
                d.reject(new Error(`${fn} doesn't exist`));
            }
            readFile(fn, (err, data)=>{
                if (err) {
                    return d.reject(err);
                }
                d.resolve(data);
            });
        } catch (err) {
            d.reject(err);
        }
        return d;
    }
    loadClientCerts() {
        return __awaiter(this, void 0, void 0, function*() {
            const tlsOpts = {};
            const { certFile, cert, caFile, ca, keyFile, key } = this.options.tls;
            try {
                if (certFile) {
                    const data = yield this.loadFile(certFile);
                    if (data) {
                        tlsOpts.cert = data;
                    }
                } else if (cert) {
                    tlsOpts.cert = cert;
                }
                if (keyFile) {
                    const data = yield this.loadFile(keyFile);
                    if (data) {
                        tlsOpts.key = data;
                    }
                } else if (key) {
                    tlsOpts.key = key;
                }
                if (caFile) {
                    const data = yield this.loadFile(caFile);
                    if (data) {
                        tlsOpts.ca = [
                            data
                        ];
                    }
                } else if (ca) {
                    tlsOpts.ca = ca;
                }
                return Promise.resolve(tlsOpts);
            } catch (err) {
                return Promise.reject(err);
            }
        });
    }
    tlsFirst(hp) {
        return __awaiter(this, void 0, void 0, function*() {
            let tlsError;
            let tlsOpts = {
                servername: this.tlsName,
                rejectUnauthorized: true
            };
            if (this.socket) {
                tlsOpts.socket = this.socket;
            }
            if (typeof this.options.tls === "object") {
                try {
                    const certOpts = (yield this.loadClientCerts()) || {};
                    tlsOpts = (0, util_1.extend)(tlsOpts, this.options.tls, certOpts);
                } catch (err) {
                    return Promise.reject(new nats_base_client_1.NatsError(err.message, nats_base_client_1.ErrorCode.Tls, err));
                }
            }
            const d = (0, nats_base_client_1.deferred)();
            try {
                const tlsSocket = (0, tls_1.connect)(hp.port, hp.hostname, tlsOpts, ()=>{
                    tlsSocket.removeAllListeners();
                    d.resolve(tlsSocket);
                });
                tlsSocket.on("error", (err)=>{
                    tlsError = err;
                });
                tlsSocket.on("secureConnect", ()=>{
                    // socket won't be authorized, if the user disabled it
                    if (tlsOpts.rejectUnauthorized === false) {
                        return;
                    }
                    if (!tlsSocket.authorized) {
                        throw tlsSocket.authorizationError;
                    }
                });
                tlsSocket.on("close", ()=>{
                    d.reject(tlsError);
                    tlsSocket.removeAllListeners();
                });
                tlsSocket.setNoDelay(true);
            } catch (err) {
                // tls throws errors on bad certs see nats.js#310
                d.reject(nats_base_client_1.NatsError.errorForCode(nats_base_client_1.ErrorCode.Tls, err));
            }
            return d;
        });
    }
    startTLS() {
        return __awaiter(this, void 0, void 0, function*() {
            let tlsError;
            let tlsOpts = {
                socket: this.socket,
                servername: this.tlsName,
                rejectUnauthorized: true
            };
            if (typeof this.options.tls === "object") {
                try {
                    const certOpts = (yield this.loadClientCerts()) || {};
                    tlsOpts = (0, util_1.extend)(tlsOpts, this.options.tls, certOpts);
                } catch (err) {
                    return Promise.reject(new nats_base_client_1.NatsError(err.message, nats_base_client_1.ErrorCode.Tls, err));
                }
            }
            const d = (0, nats_base_client_1.deferred)();
            try {
                const tlsSocket = (0, tls_1.connect)(tlsOpts, ()=>{
                    tlsSocket.removeAllListeners();
                    d.resolve(tlsSocket);
                });
                tlsSocket.on("error", (err)=>{
                    tlsError = err;
                });
                tlsSocket.on("secureConnect", ()=>{
                    // socket won't be authorized, if the user disabled it
                    if (tlsOpts.rejectUnauthorized === false) {
                        return;
                    }
                    if (!tlsSocket.authorized) {
                        throw tlsSocket.authorizationError;
                    }
                });
                tlsSocket.on("close", ()=>{
                    d.reject(tlsError);
                    tlsSocket.removeAllListeners();
                });
            } catch (err) {
                // tls throws errors on bad certs see nats.js#310
                d.reject(nats_base_client_1.NatsError.errorForCode(nats_base_client_1.ErrorCode.Tls, err));
            }
            return d;
        });
    }
    setupHandlers() {
        let connError;
        this.socket.on("data", (frame)=>{
            this.yields.push(frame);
            return this.signal.resolve();
        });
        this.socket.on("error", (err)=>{
            connError = err;
        });
        this.socket.on("end", ()=>{
            var _a, _b;
            if ((_a = this.socket) === null || _a === void 0 ? void 0 : _a.destroyed) {
                return;
            }
            (_b = this.socket) === null || _b === void 0 ? void 0 : _b.write(new Uint8Array(0), ()=>{
                var _a;
                (_a = this.socket) === null || _a === void 0 ? void 0 : _a.end();
            });
        });
        this.socket.on("close", ()=>{
            this._closed(connError, false);
        });
    }
    [Symbol.asyncIterator]() {
        return this.iterate();
    }
    iterate() {
        return __asyncGenerator(this, arguments, function* iterate_1() {
            const debug = this.options.debug;
            while(true){
                if (this.yields.length === 0) {
                    yield __await(this.signal);
                }
                const yields = this.yields;
                this.yields = [];
                for(let i = 0; i < yields.length; i++){
                    if (debug) {
                        console.info(`> ${(0, nats_base_client_1.render)(yields[i])}`);
                    }
                    yield yield __await(yields[i]);
                }
                // yielding could have paused and microtask
                // could have added messages. Prevent allocations
                // if possible
                if (this.done) {
                    break;
                } else if (this.yields.length === 0) {
                    yields.length = 0;
                    this.yields = yields;
                    this.signal = (0, nats_base_client_1.deferred)();
                }
            }
        });
    }
    discard() {
    // ignored - this is not required, as there's no throttling
    }
    disconnect() {
        this._closed(undefined, true).then().catch();
    }
    isEncrypted() {
        return this.socket instanceof tls_1.TLSSocket;
    }
    _send(frame) {
        if (this.isClosed || this.socket === undefined) {
            return Promise.resolve();
        }
        if (this.options.debug) {
            console.info(`< ${(0, nats_base_client_1.render)(frame)}`);
        }
        const d = (0, nats_base_client_1.deferred)();
        try {
            this.socket.write(frame, (err)=>{
                if (err) {
                    if (this.options.debug) {
                        console.error(`!!! ${(0, nats_base_client_1.render)(frame)}: ${err}`);
                    }
                    return d.reject(err);
                }
                return d.resolve();
            });
        } catch (err) {
            if (this.options.debug) {
                console.error(`!!! ${(0, nats_base_client_1.render)(frame)}: ${err}`);
            }
            d.reject(err);
        }
        return d;
    }
    send(frame) {
        const p = this._send(frame);
        p.catch((_err)=>{
        // we ignore write errors because client will
        // fail on a read or when the heartbeat timer
        // detects a stale connection
        });
    }
    _closed(err_1) {
        return __awaiter(this, arguments, void 0, function*(err, internal = true) {
            // if this connection didn't succeed, then ignore it.
            if (!this.connected) return;
            if (this.done) return;
            this.closeError = err;
            // only try to flush the outbound buffer if we got no error and
            // the close is internal, if the transport closed, we are done.
            if (!err && this.socket && internal) {
                try {
                    yield this._send(new TextEncoder().encode(""));
                } catch (err) {
                    if (this.options.debug) {
                        console.log("transport close terminated with an error", err);
                    }
                }
            }
            try {
                if (this.socket) {
                    this.socket.removeAllListeners();
                    this.socket.destroy();
                    this.socket = undefined;
                }
            } catch (err) {
                console.log(err);
            }
            this.done = true;
            this.closedNotification.resolve(this.closeError);
        });
    }
    closed() {
        return this.closedNotification;
    }
}
exports.NodeTransport = NodeTransport;
function nodeResolveHost(s) {
    return __awaiter(this, void 0, void 0, function*() {
        const a = (0, nats_base_client_1.deferred)();
        const aaaa = (0, nats_base_client_1.deferred)();
        dns.resolve4(s, (err, records)=>{
            if (err) {
                a.resolve(err);
            } else {
                a.resolve(records);
            }
        });
        dns.resolve6(s, (err, records)=>{
            if (err) {
                aaaa.resolve(err);
            } else {
                aaaa.resolve(records);
            }
        });
        const ips = [];
        const da = yield a;
        if (Array.isArray(da)) {
            ips.push(...da);
        }
        const daaaa = yield aaaa;
        if (Array.isArray(daaaa)) {
            ips.push(...daaaa);
        }
        if (ips.length === 0) {
            ips.push(s);
        }
        return ips;
    });
} //# sourceMappingURL=node_transport.js.map
}),
"[project]/dawg-ai/node_modules/nats/lib/src/connect.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.connect = connect;
/*
 * Copyright 2020 The NATS Authors
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
 */ const node_transport_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/src/node_transport.js [app-ssr] (ecmascript)");
const nats_base_client_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/src/nats-base-client.js [app-ssr] (ecmascript)");
function connect(opts = {}) {
    (0, nats_base_client_1.setTransportFactory)({
        factory: ()=>{
            return new node_transport_1.NodeTransport();
        },
        dnsResolveFn: node_transport_1.nodeResolveHost
    });
    return nats_base_client_1.NatsConnectionImpl.connect(opts);
} //# sourceMappingURL=connect.js.map
}),
"[project]/dawg-ai/node_modules/nats/lib/jetstream/mod.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.consumerOpts = exports.StoreCompression = exports.StorageType = exports.RetentionPolicy = exports.RepublishHeaders = exports.ReplayPolicy = exports.KvWatchInclude = exports.JsHeaders = exports.DiscardPolicy = exports.DirectMsgHeaders = exports.DeliverPolicy = exports.ConsumerEvents = exports.ConsumerDebugEvents = exports.AdvisoryKind = exports.AckPolicy = exports.isHeartbeatMsg = exports.isFlowControlMsg = exports.checkJsError = void 0;
/*
 * Copyright 2023-2024 The NATS Authors
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
 */ var internal_mod_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/jetstream/internal_mod.js [app-ssr] (ecmascript)");
Object.defineProperty(exports, "checkJsError", {
    enumerable: true,
    get: function() {
        return internal_mod_1.checkJsError;
    }
});
Object.defineProperty(exports, "isFlowControlMsg", {
    enumerable: true,
    get: function() {
        return internal_mod_1.isFlowControlMsg;
    }
});
Object.defineProperty(exports, "isHeartbeatMsg", {
    enumerable: true,
    get: function() {
        return internal_mod_1.isHeartbeatMsg;
    }
});
var internal_mod_2 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/jetstream/internal_mod.js [app-ssr] (ecmascript)");
Object.defineProperty(exports, "AckPolicy", {
    enumerable: true,
    get: function() {
        return internal_mod_2.AckPolicy;
    }
});
Object.defineProperty(exports, "AdvisoryKind", {
    enumerable: true,
    get: function() {
        return internal_mod_2.AdvisoryKind;
    }
});
Object.defineProperty(exports, "ConsumerDebugEvents", {
    enumerable: true,
    get: function() {
        return internal_mod_2.ConsumerDebugEvents;
    }
});
Object.defineProperty(exports, "ConsumerEvents", {
    enumerable: true,
    get: function() {
        return internal_mod_2.ConsumerEvents;
    }
});
Object.defineProperty(exports, "DeliverPolicy", {
    enumerable: true,
    get: function() {
        return internal_mod_2.DeliverPolicy;
    }
});
Object.defineProperty(exports, "DirectMsgHeaders", {
    enumerable: true,
    get: function() {
        return internal_mod_2.DirectMsgHeaders;
    }
});
Object.defineProperty(exports, "DiscardPolicy", {
    enumerable: true,
    get: function() {
        return internal_mod_2.DiscardPolicy;
    }
});
Object.defineProperty(exports, "JsHeaders", {
    enumerable: true,
    get: function() {
        return internal_mod_2.JsHeaders;
    }
});
Object.defineProperty(exports, "KvWatchInclude", {
    enumerable: true,
    get: function() {
        return internal_mod_2.KvWatchInclude;
    }
});
Object.defineProperty(exports, "ReplayPolicy", {
    enumerable: true,
    get: function() {
        return internal_mod_2.ReplayPolicy;
    }
});
Object.defineProperty(exports, "RepublishHeaders", {
    enumerable: true,
    get: function() {
        return internal_mod_2.RepublishHeaders;
    }
});
Object.defineProperty(exports, "RetentionPolicy", {
    enumerable: true,
    get: function() {
        return internal_mod_2.RetentionPolicy;
    }
});
Object.defineProperty(exports, "StorageType", {
    enumerable: true,
    get: function() {
        return internal_mod_2.StorageType;
    }
});
Object.defineProperty(exports, "StoreCompression", {
    enumerable: true,
    get: function() {
        return internal_mod_2.StoreCompression;
    }
});
var types_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/jetstream/types.js [app-ssr] (ecmascript)");
Object.defineProperty(exports, "consumerOpts", {
    enumerable: true,
    get: function() {
        return types_1.consumerOpts;
    }
}); //# sourceMappingURL=mod.js.map
}),
"[project]/dawg-ai/node_modules/nats/lib/src/mod.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
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
exports.connect = void 0;
/*
 * Copyright 2020-2022 The NATS Authors
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
 */ if (typeof TextEncoder === "undefined") {
    const { TextEncoder: TextEncoder1, TextDecoder } = __turbopack_context__.r("[externals]/util [external] (util, cjs)");
    /*TURBOPACK member replacement*/ __turbopack_context__.g.TextEncoder = TextEncoder1;
    /*TURBOPACK member replacement*/ __turbopack_context__.g.TextDecoder = TextDecoder;
}
if (typeof globalThis.crypto === "undefined") {
    const c = __turbopack_context__.r("[externals]/crypto [external] (crypto, cjs)");
    // this will patch to undefined if webcrypto is not available (node 14)
    // views will toss if crypto is not available
    /*TURBOPACK member replacement*/ __turbopack_context__.g.crypto = c.webcrypto;
}
if (typeof globalThis.ReadableStream === "undefined") {
    // @ts-ignore: node global
    const chunks = process.versions.node.split(".");
    const v = parseInt(chunks[0]);
    if (v >= 16) {
        // this won't mess up fetch
        const streams = __turbopack_context__.r("[externals]/stream/web [external] (stream/web, cjs)");
        // views will toss if ReadableStream is not available
        /*TURBOPACK member replacement*/ __turbopack_context__.g.ReadableStream = streams.ReadableStream;
    }
}
var connect_1 = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/src/connect.js [app-ssr] (ecmascript)");
Object.defineProperty(exports, "connect", {
    enumerable: true,
    get: function() {
        return connect_1.connect;
    }
});
__exportStar(__turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/nats-base-client/mod.js [app-ssr] (ecmascript)"), exports);
__exportStar(__turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/jetstream/mod.js [app-ssr] (ecmascript)"), exports); //# sourceMappingURL=mod.js.map
}),
"[project]/dawg-ai/node_modules/nats/index.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

/*
 * Copyright 2013-2020 The NATS Authors
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
 */ module.exports = __turbopack_context__.r("[project]/dawg-ai/node_modules/nats/lib/src/mod.js [app-ssr] (ecmascript)");
}),
];

//# sourceMappingURL=f2656_nats_3bb9eed3._.js.map