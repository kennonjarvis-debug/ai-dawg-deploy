import { h as head } from "../../chunks/index2.js";
import "../../chunks/client.js";
import { p as push_element, a as pop_element } from "../../chunks/dev.js";
import { W as FILENAME } from "../../chunks/context.js";
_page[FILENAME] = "src/routes/+page.svelte";
function _page($$renderer, $$props) {
  $$renderer.component(
    ($$renderer2) => {
      head($$renderer2, ($$renderer3) => {
        $$renderer3.title(($$renderer4) => {
          $$renderer4.push(`<title>DAWG AI - Loading...</title>`);
        });
      });
      $$renderer2.push(`<div class="min-h-screen flex items-center justify-center">`);
      push_element($$renderer2, "div", 21, 0);
      $$renderer2.push(`<div class="text-center">`);
      push_element($$renderer2, "div", 22, 1);
      $$renderer2.push(`<div class="text-6xl font-bold mb-4 bg-gradient-to-r from-accent-primary to-accent-secondary bg-clip-text text-transparent animate-pulse">`);
      push_element($$renderer2, "div", 23, 2);
      $$renderer2.push(`DAWG AI</div>`);
      pop_element();
      $$renderer2.push(` <p class="text-white/60">`);
      push_element($$renderer2, "p", 26, 2);
      $$renderer2.push(`Loading...</p>`);
      pop_element();
      $$renderer2.push(`</div>`);
      pop_element();
      $$renderer2.push(`</div>`);
      pop_element();
    },
    _page
  );
}
_page.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
export {
  _page as default
};
