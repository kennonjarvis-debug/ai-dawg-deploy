import { s as store_get, p as prevent_snippet_stringification, u as unsubscribe_stores, a as ensure_array_like, b as attr_class, c as stringify, d as slot } from "../../chunks/index2.js";
import { T as ThemeProvider } from "../../chunks/Timeline.svelte_svelte_type_style_lang.js";
import "../../chunks/InspectorPanel.svelte_svelte_type_style_lang.js";
import "../../chunks/authStore.js";
import "tone";
import "../../chunks/logger.js";
import "../../chunks/index-client.js";
import "../../chunks/eventBus.js";
import { Y as getContext, W as FILENAME, Z as escape_html } from "../../chunks/context.js";
import "../../chunks/client.js";
import { p as push_element, a as pop_element } from "../../chunks/dev.js";
const getStores = () => {
  const stores$1 = getContext("__svelte__");
  return {
    /** @type {typeof page} */
    page: {
      subscribe: stores$1.page.subscribe
    },
    /** @type {typeof navigating} */
    navigating: {
      subscribe: stores$1.navigating.subscribe
    },
    /** @type {typeof updated} */
    updated: stores$1.updated
  };
};
const page = {
  subscribe(fn) {
    const store = get_store("page");
    return store.subscribe(fn);
  }
};
function get_store(name) {
  try {
    return getStores()[name];
  } catch {
    throw new Error(
      `Cannot subscribe to '${name}' store on the server outside of a Svelte component, as it is bound to the current request via component context. This prevents state from leaking between users.For more information, see https://svelte.dev/docs/kit/state-management#avoid-shared-state-on-the-server`
    );
  }
}
_layout[FILENAME] = "src/routes/+layout.svelte";
function _layout($$renderer, $$props) {
  $$renderer.component(
    ($$renderer2) => {
      var $$store_subs;
      let currentPath;
      const navItems = [
        { label: "Home", path: "/" },
        { label: "DAW", path: "/daw" },
        { label: "Pricing", path: "/pricing" }
      ];
      currentPath = store_get($$store_subs ??= {}, "$page", page).url.pathname;
      ThemeProvider($$renderer2, {
        children: prevent_snippet_stringification(($$renderer3) => {
          $$renderer3.push(`<nav class="fixed top-0 left-0 right-0 z-40 glass-strong border-b border-white/10">`);
          push_element($$renderer3, "nav", 72, 1);
          $$renderer3.push(`<div class="max-w-7xl mx-auto px-8 py-4">`);
          push_element($$renderer3, "div", 73, 2);
          $$renderer3.push(`<div class="flex items-center justify-between">`);
          push_element($$renderer3, "div", 74, 3);
          $$renderer3.push(`<button class="text-2xl font-bold bg-gradient-to-r from-accent-primary to-accent-secondary bg-clip-text text-transparent hover:opacity-80 transition-opacity">`);
          push_element($$renderer3, "button", 76, 4);
          $$renderer3.push(`DAWG AI</button>`);
          pop_element();
          $$renderer3.push(` <div class="flex items-center gap-6">`);
          push_element($$renderer3, "div", 84, 4);
          $$renderer3.push(`<!--[-->`);
          const each_array = ensure_array_like(navItems);
          for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
            let item = each_array[$$index];
            $$renderer3.push(`<button${attr_class(`text-white/80 hover:text-white transition-colors ${stringify(currentPath === item.path ? "text-accent-primary font-semibold" : "")}`)}>`);
            push_element($$renderer3, "button", 86, 6);
            $$renderer3.push(`${escape_html(item.label)}</button>`);
            pop_element();
          }
          $$renderer3.push(`<!--]--></div>`);
          pop_element();
          $$renderer3.push(`</div>`);
          pop_element();
          $$renderer3.push(`</div>`);
          pop_element();
          $$renderer3.push(`</nav>`);
          pop_element();
          $$renderer3.push(` <div class="pt-20">`);
          push_element($$renderer3, "div", 99, 1);
          $$renderer3.push(`<!--[-->`);
          slot($$renderer3, $$props, "default", {});
          $$renderer3.push(`<!--]--></div>`);
          pop_element();
          $$renderer3.push(` `);
          {
            $$renderer3.push("<!--[!-->");
          }
          $$renderer3.push(`<!--]-->`);
        }),
        $$slots: { default: true }
      });
      if ($$store_subs) unsubscribe_stores($$store_subs);
    },
    _layout
  );
}
_layout.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
export {
  _layout as default
};
