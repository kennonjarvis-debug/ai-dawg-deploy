

export const index = 1;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/fallbacks/error.svelte.js')).default;
export const imports = ["_app/immutable/nodes/1.BSBK6rxl.js","_app/immutable/chunks/Qdd5QB-r.js","_app/immutable/chunks/8Gi8pbBQ.js","_app/immutable/chunks/DIze1LIt.js"];
export const stylesheets = [];
export const fonts = [];
