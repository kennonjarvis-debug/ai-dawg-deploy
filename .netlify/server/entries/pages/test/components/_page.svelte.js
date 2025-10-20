import { h as head, b as attr_class, p as prevent_snippet_stringification } from "../../../../chunks/index2.js";
import { L as Label, B as Button, F as Fader, K as Knob, T as Toggle, a as Input, I as Icon, M as Meter } from "../../../../chunks/InspectorPanel.svelte_svelte_type_style_lang.js";
import { p as push_element, a as pop_element } from "../../../../chunks/dev.js";
import { Z as escape_html, W as FILENAME } from "../../../../chunks/context.js";
_page[FILENAME] = "src/routes/test/components/+page.svelte";
function _page($$renderer, $$props) {
  $$renderer.component(
    ($$renderer2) => {
      let testValues = {
        fader: 0.7,
        knob: 0.5,
        toggle: false,
        input: "",
        meter: 0.8
      };
      let selectedSection = "atoms";
      let $$settled = true;
      let $$inner_renderer;
      function $$render_inner($$renderer3) {
        head($$renderer3, ($$renderer4) => {
          $$renderer4.title(($$renderer5) => {
            $$renderer5.push(`<title>Component Testing | DAWG AI</title>`);
          });
        });
        $$renderer3.push(`<div class="test-page svelte-1feml9i">`);
        push_element($$renderer3, "div", 63, 0);
        $$renderer3.push(`<header class="test-header svelte-1feml9i">`);
        push_element($$renderer3, "header", 64, 2);
        $$renderer3.push(`<h1 class="svelte-1feml9i">`);
        push_element($$renderer3, "h1", 65, 4);
        $$renderer3.push(`🧪 Component Testing Lab</h1>`);
        pop_element();
        $$renderer3.push(` <p class="svelte-1feml9i">`);
        push_element($$renderer3, "p", 66, 4);
        $$renderer3.push(`Visual testing for DAWG AI Design System</p>`);
        pop_element();
        $$renderer3.push(` <nav class="section-nav svelte-1feml9i">`);
        push_element($$renderer3, "nav", 68, 4);
        $$renderer3.push(`<button${attr_class("svelte-1feml9i", void 0, { "active": selectedSection === "atoms" })}>`);
        push_element($$renderer3, "button", 69, 6);
        $$renderer3.push(`Atoms (8)</button>`);
        pop_element();
        $$renderer3.push(` <button${attr_class("svelte-1feml9i", void 0, { "active": selectedSection === "molecules" })}>`);
        push_element($$renderer3, "button", 75, 6);
        $$renderer3.push(`Molecules (6)</button>`);
        pop_element();
        $$renderer3.push(` <button${attr_class("svelte-1feml9i", void 0, { "active": selectedSection === "organisms" })}>`);
        push_element($$renderer3, "button", 81, 6);
        $$renderer3.push(`Organisms (4)</button>`);
        pop_element();
        $$renderer3.push(`</nav>`);
        pop_element();
        $$renderer3.push(`</header>`);
        pop_element();
        $$renderer3.push(` <main class="test-content">`);
        push_element($$renderer3, "main", 90, 2);
        {
          $$renderer3.push("<!--[-->");
          $$renderer3.push(`<section class="test-section svelte-1feml9i">`);
          push_element($$renderer3, "section", 92, 6);
          $$renderer3.push(`<h2 class="svelte-1feml9i">`);
          push_element($$renderer3, "h2", 93, 8);
          $$renderer3.push(`⚛️ Atoms</h2>`);
          pop_element();
          $$renderer3.push(` <p class="section-desc svelte-1feml9i">`);
          push_element($$renderer3, "p", 94, 8);
          $$renderer3.push(`Basic building blocks - smallest UI components</p>`);
          pop_element();
          $$renderer3.push(` <div class="component-test svelte-1feml9i">`);
          push_element($$renderer3, "div", 97, 8);
          $$renderer3.push(`<h3 class="svelte-1feml9i">`);
          push_element($$renderer3, "h3", 98, 10);
          $$renderer3.push(`Button</h3>`);
          pop_element();
          $$renderer3.push(` <div class="test-grid svelte-1feml9i">`);
          push_element($$renderer3, "div", 99, 10);
          $$renderer3.push(`<div class="test-item svelte-1feml9i">`);
          push_element($$renderer3, "div", 100, 12);
          Label($$renderer3, {
            size: "sm",
            children: prevent_snippet_stringification(($$renderer4) => {
              $$renderer4.push(`<!---->Variants`);
            })
          });
          $$renderer3.push(`<!----> <div class="button-row svelte-1feml9i">`);
          push_element($$renderer3, "div", 102, 14);
          Button($$renderer3, {
            variant: "primary",
            children: prevent_snippet_stringification(($$renderer4) => {
              $$renderer4.push(`<!---->Primary`);
            })
          });
          $$renderer3.push(`<!----> `);
          Button($$renderer3, {
            variant: "secondary",
            children: prevent_snippet_stringification(($$renderer4) => {
              $$renderer4.push(`<!---->Secondary`);
            })
          });
          $$renderer3.push(`<!----> `);
          Button($$renderer3, {
            variant: "ghost",
            children: prevent_snippet_stringification(($$renderer4) => {
              $$renderer4.push(`<!---->Ghost`);
            })
          });
          $$renderer3.push(`<!----> `);
          Button($$renderer3, {
            variant: "danger",
            children: prevent_snippet_stringification(($$renderer4) => {
              $$renderer4.push(`<!---->Danger`);
            })
          });
          $$renderer3.push(`<!----></div>`);
          pop_element();
          $$renderer3.push(`</div>`);
          pop_element();
          $$renderer3.push(` <div class="test-item svelte-1feml9i">`);
          push_element($$renderer3, "div", 110, 12);
          Label($$renderer3, {
            size: "sm",
            children: prevent_snippet_stringification(($$renderer4) => {
              $$renderer4.push(`<!---->Sizes`);
            })
          });
          $$renderer3.push(`<!----> <div class="button-row svelte-1feml9i">`);
          push_element($$renderer3, "div", 112, 14);
          Button($$renderer3, {
            size: "xs",
            children: prevent_snippet_stringification(($$renderer4) => {
              $$renderer4.push(`<!---->XS`);
            })
          });
          $$renderer3.push(`<!----> `);
          Button($$renderer3, {
            size: "sm",
            children: prevent_snippet_stringification(($$renderer4) => {
              $$renderer4.push(`<!---->SM`);
            })
          });
          $$renderer3.push(`<!----> `);
          Button($$renderer3, {
            size: "md",
            children: prevent_snippet_stringification(($$renderer4) => {
              $$renderer4.push(`<!---->MD`);
            })
          });
          $$renderer3.push(`<!----> `);
          Button($$renderer3, {
            size: "lg",
            children: prevent_snippet_stringification(($$renderer4) => {
              $$renderer4.push(`<!---->LG`);
            })
          });
          $$renderer3.push(`<!----> `);
          Button($$renderer3, {
            size: "xl",
            children: prevent_snippet_stringification(($$renderer4) => {
              $$renderer4.push(`<!---->XL`);
            })
          });
          $$renderer3.push(`<!----></div>`);
          pop_element();
          $$renderer3.push(`</div>`);
          pop_element();
          $$renderer3.push(` <div class="test-item svelte-1feml9i">`);
          push_element($$renderer3, "div", 121, 12);
          Label($$renderer3, {
            size: "sm",
            children: prevent_snippet_stringification(($$renderer4) => {
              $$renderer4.push(`<!---->States`);
            })
          });
          $$renderer3.push(`<!----> <div class="button-row svelte-1feml9i">`);
          push_element($$renderer3, "div", 123, 14);
          Button($$renderer3, {
            children: prevent_snippet_stringification(($$renderer4) => {
              $$renderer4.push(`<!---->Normal`);
            })
          });
          $$renderer3.push(`<!----> `);
          Button($$renderer3, {
            disabled: true,
            children: prevent_snippet_stringification(($$renderer4) => {
              $$renderer4.push(`<!---->Disabled`);
            })
          });
          $$renderer3.push(`<!----> `);
          Button($$renderer3, {
            loading: true,
            children: prevent_snippet_stringification(($$renderer4) => {
              $$renderer4.push(`<!---->Loading`);
            })
          });
          $$renderer3.push(`<!----></div>`);
          pop_element();
          $$renderer3.push(`</div>`);
          pop_element();
          $$renderer3.push(`</div>`);
          pop_element();
          $$renderer3.push(`</div>`);
          pop_element();
          $$renderer3.push(` <div class="component-test svelte-1feml9i">`);
          push_element($$renderer3, "div", 133, 8);
          $$renderer3.push(`<h3 class="svelte-1feml9i">`);
          push_element($$renderer3, "h3", 134, 10);
          $$renderer3.push(`Fader</h3>`);
          pop_element();
          $$renderer3.push(` <div class="test-grid svelte-1feml9i">`);
          push_element($$renderer3, "div", 135, 10);
          $$renderer3.push(`<div class="test-item svelte-1feml9i">`);
          push_element($$renderer3, "div", 136, 12);
          Label($$renderer3, {
            size: "sm",
            children: prevent_snippet_stringification(($$renderer4) => {
              $$renderer4.push(`<!---->Value: ${escape_html(testValues.fader.toFixed(2))}`);
            })
          });
          $$renderer3.push(`<!----> `);
          Fader($$renderer3, {
            label: "Volume",
            get value() {
              return testValues.fader;
            },
            set value($$value) {
              testValues.fader = $$value;
              $$settled = false;
            }
          });
          $$renderer3.push(`<!----></div>`);
          pop_element();
          $$renderer3.push(` <div class="test-item svelte-1feml9i">`);
          push_element($$renderer3, "div", 140, 12);
          Label($$renderer3, {
            size: "sm",
            children: prevent_snippet_stringification(($$renderer4) => {
              $$renderer4.push(`<!---->Disabled`);
            })
          });
          $$renderer3.push(`<!----> `);
          Fader($$renderer3, { value: 0.5, disabled: true, label: "Disabled" });
          $$renderer3.push(`<!----></div>`);
          pop_element();
          $$renderer3.push(`</div>`);
          pop_element();
          $$renderer3.push(`</div>`);
          pop_element();
          $$renderer3.push(` <div class="component-test svelte-1feml9i">`);
          push_element($$renderer3, "div", 148, 8);
          $$renderer3.push(`<h3 class="svelte-1feml9i">`);
          push_element($$renderer3, "h3", 149, 10);
          $$renderer3.push(`Knob</h3>`);
          pop_element();
          $$renderer3.push(` <div class="test-grid svelte-1feml9i">`);
          push_element($$renderer3, "div", 150, 10);
          $$renderer3.push(`<div class="test-item svelte-1feml9i">`);
          push_element($$renderer3, "div", 151, 12);
          Label($$renderer3, {
            size: "sm",
            children: prevent_snippet_stringification(($$renderer4) => {
              $$renderer4.push(`<!---->Value: ${escape_html(testValues.knob.toFixed(2))}`);
            })
          });
          $$renderer3.push(`<!----> `);
          Knob($$renderer3, {
            label: "Pan",
            size: "md",
            get value() {
              return testValues.knob;
            },
            set value($$value) {
              testValues.knob = $$value;
              $$settled = false;
            }
          });
          $$renderer3.push(`<!----></div>`);
          pop_element();
          $$renderer3.push(` <div class="test-item svelte-1feml9i">`);
          push_element($$renderer3, "div", 155, 12);
          Label($$renderer3, {
            size: "sm",
            children: prevent_snippet_stringification(($$renderer4) => {
              $$renderer4.push(`<!---->Bipolar Mode`);
            })
          });
          $$renderer3.push(`<!----> `);
          Knob($$renderer3, { value: 0, label: "Pan", bipolar: true, size: "md" });
          $$renderer3.push(`<!----></div>`);
          pop_element();
          $$renderer3.push(` <div class="test-item svelte-1feml9i">`);
          push_element($$renderer3, "div", 159, 12);
          Label($$renderer3, {
            size: "sm",
            children: prevent_snippet_stringification(($$renderer4) => {
              $$renderer4.push(`<!---->Different Sizes`);
            })
          });
          $$renderer3.push(`<!----> <div class="knob-row svelte-1feml9i">`);
          push_element($$renderer3, "div", 161, 14);
          Knob($$renderer3, { value: 0.5, label: "SM", size: "sm" });
          $$renderer3.push(`<!----> `);
          Knob($$renderer3, { value: 0.5, label: "MD", size: "md" });
          $$renderer3.push(`<!----> `);
          Knob($$renderer3, { value: 0.5, label: "LG", size: "lg" });
          $$renderer3.push(`<!----></div>`);
          pop_element();
          $$renderer3.push(`</div>`);
          pop_element();
          $$renderer3.push(`</div>`);
          pop_element();
          $$renderer3.push(`</div>`);
          pop_element();
          $$renderer3.push(` <div class="component-test svelte-1feml9i">`);
          push_element($$renderer3, "div", 171, 8);
          $$renderer3.push(`<h3 class="svelte-1feml9i">`);
          push_element($$renderer3, "h3", 172, 10);
          $$renderer3.push(`Toggle</h3>`);
          pop_element();
          $$renderer3.push(` <div class="test-grid svelte-1feml9i">`);
          push_element($$renderer3, "div", 173, 10);
          $$renderer3.push(`<div class="test-item svelte-1feml9i">`);
          push_element($$renderer3, "div", 174, 12);
          Label($$renderer3, {
            size: "sm",
            children: prevent_snippet_stringification(($$renderer4) => {
              $$renderer4.push(`<!---->State: ${escape_html(testValues.toggle ? "ON" : "OFF")}`);
            })
          });
          $$renderer3.push(`<!----> `);
          Toggle($$renderer3, {
            label: "Enable Effect",
            get checked() {
              return testValues.toggle;
            },
            set checked($$value) {
              testValues.toggle = $$value;
              $$settled = false;
            }
          });
          $$renderer3.push(`<!----></div>`);
          pop_element();
          $$renderer3.push(` <div class="test-item svelte-1feml9i">`);
          push_element($$renderer3, "div", 178, 12);
          Label($$renderer3, {
            size: "sm",
            children: prevent_snippet_stringification(($$renderer4) => {
              $$renderer4.push(`<!---->Disabled`);
            })
          });
          $$renderer3.push(`<!----> `);
          Toggle($$renderer3, { checked: false, disabled: true, label: "Disabled" });
          $$renderer3.push(`<!----></div>`);
          pop_element();
          $$renderer3.push(`</div>`);
          pop_element();
          $$renderer3.push(`</div>`);
          pop_element();
          $$renderer3.push(` <div class="component-test svelte-1feml9i">`);
          push_element($$renderer3, "div", 186, 8);
          $$renderer3.push(`<h3 class="svelte-1feml9i">`);
          push_element($$renderer3, "h3", 187, 10);
          $$renderer3.push(`Input</h3>`);
          pop_element();
          $$renderer3.push(` <div class="test-grid svelte-1feml9i">`);
          push_element($$renderer3, "div", 188, 10);
          $$renderer3.push(`<div class="test-item svelte-1feml9i">`);
          push_element($$renderer3, "div", 189, 12);
          Label($$renderer3, {
            size: "sm",
            children: prevent_snippet_stringification(($$renderer4) => {
              $$renderer4.push(`<!---->Text Input`);
            })
          });
          $$renderer3.push(`<!----> `);
          Input($$renderer3, {
            placeholder: "Type something...",
            get value() {
              return testValues.input;
            },
            set value($$value) {
              testValues.input = $$value;
              $$settled = false;
            }
          });
          $$renderer3.push(`<!----></div>`);
          pop_element();
          $$renderer3.push(` <div class="test-item svelte-1feml9i">`);
          push_element($$renderer3, "div", 193, 12);
          Label($$renderer3, {
            size: "sm",
            children: prevent_snippet_stringification(($$renderer4) => {
              $$renderer4.push(`<!---->Number Input`);
            })
          });
          $$renderer3.push(`<!----> `);
          Input($$renderer3, { type: "number", value: "120" });
          $$renderer3.push(`<!----></div>`);
          pop_element();
          $$renderer3.push(` <div class="test-item svelte-1feml9i">`);
          push_element($$renderer3, "div", 197, 12);
          Label($$renderer3, {
            size: "sm",
            children: prevent_snippet_stringification(($$renderer4) => {
              $$renderer4.push(`<!---->Password Input`);
            })
          });
          $$renderer3.push(`<!----> `);
          Input($$renderer3, { type: "password", placeholder: "Enter password" });
          $$renderer3.push(`<!----></div>`);
          pop_element();
          $$renderer3.push(` <div class="test-item svelte-1feml9i">`);
          push_element($$renderer3, "div", 201, 12);
          Label($$renderer3, {
            size: "sm",
            children: prevent_snippet_stringification(($$renderer4) => {
              $$renderer4.push(`<!---->Disabled`);
            })
          });
          $$renderer3.push(`<!----> `);
          Input($$renderer3, { value: "Disabled field", disabled: true });
          $$renderer3.push(`<!----></div>`);
          pop_element();
          $$renderer3.push(`</div>`);
          pop_element();
          $$renderer3.push(`</div>`);
          pop_element();
          $$renderer3.push(` <div class="component-test svelte-1feml9i">`);
          push_element($$renderer3, "div", 209, 8);
          $$renderer3.push(`<h3 class="svelte-1feml9i">`);
          push_element($$renderer3, "h3", 210, 10);
          $$renderer3.push(`Label</h3>`);
          pop_element();
          $$renderer3.push(` <div class="test-grid svelte-1feml9i">`);
          push_element($$renderer3, "div", 211, 10);
          $$renderer3.push(`<div class="test-item svelte-1feml9i">`);
          push_element($$renderer3, "div", 212, 12);
          Label($$renderer3, {
            size: "xs",
            children: prevent_snippet_stringification(($$renderer4) => {
              $$renderer4.push(`<!---->Extra Small`);
            })
          });
          $$renderer3.push(`<!----> `);
          Label($$renderer3, {
            size: "sm",
            children: prevent_snippet_stringification(($$renderer4) => {
              $$renderer4.push(`<!---->Small`);
            })
          });
          $$renderer3.push(`<!----> `);
          Label($$renderer3, {
            size: "md",
            children: prevent_snippet_stringification(($$renderer4) => {
              $$renderer4.push(`<!---->Medium`);
            })
          });
          $$renderer3.push(`<!----> `);
          Label($$renderer3, {
            size: "lg",
            children: prevent_snippet_stringification(($$renderer4) => {
              $$renderer4.push(`<!---->Large`);
            })
          });
          $$renderer3.push(`<!----> `);
          Label($$renderer3, {
            size: "xl",
            children: prevent_snippet_stringification(($$renderer4) => {
              $$renderer4.push(`<!---->Extra Large`);
            })
          });
          $$renderer3.push(`<!----></div>`);
          pop_element();
          $$renderer3.push(` <div class="test-item svelte-1feml9i">`);
          push_element($$renderer3, "div", 219, 12);
          Label($$renderer3, {
            weight: "normal",
            children: prevent_snippet_stringification(($$renderer4) => {
              $$renderer4.push(`<!---->Normal Weight`);
            })
          });
          $$renderer3.push(`<!----> `);
          Label($$renderer3, {
            weight: "medium",
            children: prevent_snippet_stringification(($$renderer4) => {
              $$renderer4.push(`<!---->Medium Weight`);
            })
          });
          $$renderer3.push(`<!----> `);
          Label($$renderer3, {
            weight: "semibold",
            children: prevent_snippet_stringification(($$renderer4) => {
              $$renderer4.push(`<!---->Semibold Weight`);
            })
          });
          $$renderer3.push(`<!----> `);
          Label($$renderer3, {
            weight: "bold",
            children: prevent_snippet_stringification(($$renderer4) => {
              $$renderer4.push(`<!---->Bold Weight`);
            })
          });
          $$renderer3.push(`<!----></div>`);
          pop_element();
          $$renderer3.push(`</div>`);
          pop_element();
          $$renderer3.push(`</div>`);
          pop_element();
          $$renderer3.push(` <div class="component-test svelte-1feml9i">`);
          push_element($$renderer3, "div", 229, 8);
          $$renderer3.push(`<h3 class="svelte-1feml9i">`);
          push_element($$renderer3, "h3", 230, 10);
          $$renderer3.push(`Icon</h3>`);
          pop_element();
          $$renderer3.push(` <div class="test-grid svelte-1feml9i">`);
          push_element($$renderer3, "div", 231, 10);
          $$renderer3.push(`<div class="test-item svelte-1feml9i">`);
          push_element($$renderer3, "div", 232, 12);
          Label($$renderer3, {
            size: "sm",
            children: prevent_snippet_stringification(($$renderer4) => {
              $$renderer4.push(`<!---->Transport Icons`);
            })
          });
          $$renderer3.push(`<!----> <div class="icon-row svelte-1feml9i">`);
          push_element($$renderer3, "div", 234, 14);
          Icon($$renderer3, { name: "play", size: "md" });
          $$renderer3.push(`<!----> `);
          Icon($$renderer3, { name: "pause", size: "md" });
          $$renderer3.push(`<!----> `);
          Icon($$renderer3, { name: "stop", size: "md" });
          $$renderer3.push(`<!----> `);
          Icon($$renderer3, { name: "record", size: "md" });
          $$renderer3.push(`<!----></div>`);
          pop_element();
          $$renderer3.push(`</div>`);
          pop_element();
          $$renderer3.push(` <div class="test-item svelte-1feml9i">`);
          push_element($$renderer3, "div", 241, 12);
          Label($$renderer3, {
            size: "sm",
            children: prevent_snippet_stringification(($$renderer4) => {
              $$renderer4.push(`<!---->Tool Icons`);
            })
          });
          $$renderer3.push(`<!----> <div class="icon-row svelte-1feml9i">`);
          push_element($$renderer3, "div", 243, 14);
          Icon($$renderer3, { name: "cut", size: "md" });
          $$renderer3.push(`<!----> `);
          Icon($$renderer3, { name: "copy", size: "md" });
          $$renderer3.push(`<!----> `);
          Icon($$renderer3, { name: "paste", size: "md" });
          $$renderer3.push(`<!----> `);
          Icon($$renderer3, { name: "delete", size: "md" });
          $$renderer3.push(`<!----></div>`);
          pop_element();
          $$renderer3.push(`</div>`);
          pop_element();
          $$renderer3.push(` <div class="test-item svelte-1feml9i">`);
          push_element($$renderer3, "div", 250, 12);
          Label($$renderer3, {
            size: "sm",
            children: prevent_snippet_stringification(($$renderer4) => {
              $$renderer4.push(`<!---->Sizes`);
            })
          });
          $$renderer3.push(`<!----> <div class="icon-row svelte-1feml9i">`);
          push_element($$renderer3, "div", 252, 14);
          Icon($$renderer3, { name: "play", size: "sm" });
          $$renderer3.push(`<!----> `);
          Icon($$renderer3, { name: "play", size: "md" });
          $$renderer3.push(`<!----> `);
          Icon($$renderer3, { name: "play", size: "lg" });
          $$renderer3.push(`<!----></div>`);
          pop_element();
          $$renderer3.push(`</div>`);
          pop_element();
          $$renderer3.push(`</div>`);
          pop_element();
          $$renderer3.push(`</div>`);
          pop_element();
          $$renderer3.push(` <div class="component-test svelte-1feml9i">`);
          push_element($$renderer3, "div", 262, 8);
          $$renderer3.push(`<h3 class="svelte-1feml9i">`);
          push_element($$renderer3, "h3", 263, 10);
          $$renderer3.push(`Meter</h3>`);
          pop_element();
          $$renderer3.push(` <div class="test-grid svelte-1feml9i">`);
          push_element($$renderer3, "div", 264, 10);
          $$renderer3.push(`<div class="test-item svelte-1feml9i">`);
          push_element($$renderer3, "div", 265, 12);
          Label($$renderer3, {
            size: "sm",
            children: prevent_snippet_stringification(($$renderer4) => {
              $$renderer4.push(`<!---->Level: ${escape_html((testValues.meter * 100).toFixed(0))}%`);
            })
          });
          $$renderer3.push(`<!----> `);
          Meter($$renderer3, { value: testValues.meter, height: 200 });
          $$renderer3.push(`<!----></div>`);
          pop_element();
          $$renderer3.push(` <div class="test-item svelte-1feml9i">`);
          push_element($$renderer3, "div", 269, 12);
          Label($$renderer3, {
            size: "sm",
            children: prevent_snippet_stringification(($$renderer4) => {
              $$renderer4.push(`<!---->Peak at 0.95`);
            })
          });
          $$renderer3.push(`<!----> `);
          Meter($$renderer3, { value: 0.95, height: 200 });
          $$renderer3.push(`<!----></div>`);
          pop_element();
          $$renderer3.push(` <div class="test-item svelte-1feml9i">`);
          push_element($$renderer3, "div", 273, 12);
          Label($$renderer3, {
            size: "sm",
            children: prevent_snippet_stringification(($$renderer4) => {
              $$renderer4.push(`<!---->Clipping`);
            })
          });
          $$renderer3.push(`<!----> `);
          Meter($$renderer3, { value: 1, height: 200 });
          $$renderer3.push(`<!----></div>`);
          pop_element();
          $$renderer3.push(`</div>`);
          pop_element();
          $$renderer3.push(`</div>`);
          pop_element();
          $$renderer3.push(`</section>`);
          pop_element();
        }
        $$renderer3.push(`<!--]--></main>`);
        pop_element();
        $$renderer3.push(`</div>`);
        pop_element();
      }
      do {
        $$settled = true;
        $$inner_renderer = $$renderer2.copy();
        $$render_inner($$inner_renderer);
      } while (!$$settled);
      $$renderer2.subsume($$inner_renderer);
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
