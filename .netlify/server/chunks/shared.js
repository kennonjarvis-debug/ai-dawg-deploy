import * as devalue from "devalue";
import { b as base64_encode, t as text_decoder, c as base64_decode } from "./utils.js";
function validate_depends(route_id, dep) {
  const match = /^(moz-icon|view-source|jar):/.exec(dep);
  if (match) {
    console.warn(
      `${route_id}: Calling \`depends('${dep}')\` will throw an error in Firefox because \`${match[1]}\` is a special URI scheme`
    );
  }
}
const INVALIDATED_PARAM = "x-sveltekit-invalidated";
const TRAILING_SLASH_PARAM = "x-sveltekit-trailing-slash";
function validate_load_response(data, location_description) {
  if (data != null && Object.getPrototypeOf(data) !== Object.prototype) {
    throw new Error(
      `a load function ${location_description} returned ${typeof data !== "object" ? `a ${typeof data}` : data instanceof Response ? "a Response object" : Array.isArray(data) ? "an array" : "a non-plain object"}, but must return a plain object at the top level (i.e. \`return {...}\`)`
    );
  }
}
function stringify(data, transport) {
  const encoders = Object.fromEntries(Object.entries(transport).map(([k, v]) => [k, v.encode]));
  return devalue.stringify(data, encoders);
}
function stringify_remote_arg(value, transport) {
  if (value === void 0) return "";
  const json_string = stringify(value, transport);
  const bytes = new TextEncoder().encode(json_string);
  return base64_encode(bytes).replaceAll("=", "").replaceAll("+", "-").replaceAll("/", "_");
}
function parse_remote_arg(string, transport) {
  if (!string) return void 0;
  const json_string = text_decoder.decode(
    // no need to add back `=` characters, atob can handle it
    base64_decode(string.replaceAll("-", "+").replaceAll("_", "/"))
  );
  const decoders = Object.fromEntries(Object.entries(transport).map(([k, v]) => [k, v.decode]));
  return devalue.parse(json_string, decoders);
}
function create_remote_cache_key(id, payload) {
  return id + "/" + payload;
}
export {
  INVALIDATED_PARAM as I,
  TRAILING_SLASH_PARAM as T,
  validate_load_response as a,
  stringify_remote_arg as b,
  create_remote_cache_key as c,
  parse_remote_arg as p,
  stringify as s,
  validate_depends as v
};
