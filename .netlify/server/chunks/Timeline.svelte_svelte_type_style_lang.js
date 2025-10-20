import { d as slot, j as bind_props } from "./index2.js";
import { f as fallback } from "./index-client.js";
import { w as writable } from "./index.js";
import { W as FILENAME } from "./context.js";
ThemeProvider[FILENAME] = "src/lib/design-system/theme/ThemeProvider.svelte";
function ThemeProvider($$renderer, $$props) {
  $$renderer.component(
    ($$renderer2) => {
      let defaultTheme = fallback($$props["defaultTheme"], "dark");
      const theme2 = writable(defaultTheme);
      function toggleTheme() {
        theme2.update((current) => current === "dark" ? "light" : "dark");
      }
      function setTheme(newTheme) {
        theme2.set(newTheme);
      }
      $$renderer2.push(`<!--[-->`);
      slot($$renderer2, $$props, "default", {});
      $$renderer2.push(`<!--]-->`);
      bind_props($$props, { defaultTheme, theme: theme2, toggleTheme, setTheme });
    },
    ThemeProvider
  );
}
ThemeProvider.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
function createThemeStore() {
  const { subscribe, set, update } = writable("dark");
  return {
    subscribe,
    set,
    update,
    toggle: () => {
      update((current) => {
        const newTheme = current === "dark" ? "light" : "dark";
        return newTheme;
      });
    },
    initialize: () => {
    }
  };
}
const theme = createThemeStore();
export {
  ThemeProvider as T,
  theme as t
};
