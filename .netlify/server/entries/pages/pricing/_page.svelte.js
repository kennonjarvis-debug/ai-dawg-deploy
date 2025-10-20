import { h as head, a as ensure_array_like, b as attr_class, c as stringify, p as prevent_snippet_stringification } from "../../../chunks/index2.js";
import "../../../chunks/Timeline.svelte_svelte_type_style_lang.js";
import { I as Icon, B as Button } from "../../../chunks/InspectorPanel.svelte_svelte_type_style_lang.js";
import { g as goto } from "../../../chunks/client.js";
import { p as push_element, a as pop_element } from "../../../chunks/dev.js";
import { Z as escape_html, W as FILENAME } from "../../../chunks/context.js";
_page[FILENAME] = "src/routes/pricing/+page.svelte";
function _page($$renderer, $$props) {
  $$renderer.component(
    ($$renderer2) => {
      const tiers = [
        {
          name: "Free",
          price: "$0",
          period: "forever",
          description: "Perfect for getting started",
          features: [
            { text: "2 Projects", included: true },
            { text: "8 Tracks per project", included: true },
            { text: "Basic effects & instruments", included: true },
            { text: "Export to WAV/MP3", included: true },
            { text: "Community support", included: true },
            { text: "Cloud storage: 500MB", included: true },
            { text: "Advanced AI features", included: false },
            { text: "Collaboration", included: false },
            { text: "Priority support", included: false }
          ],
          cta: "Get Started Free",
          variant: "secondary",
          popular: false
        },
        {
          name: "Pro",
          price: "$12",
          period: "per month",
          description: "For serious producers",
          features: [
            { text: "Unlimited Projects", included: true },
            { text: "Unlimited Tracks", included: true },
            { text: "All effects & instruments", included: true },
            { text: "Export to all formats", included: true },
            { text: "Priority support", included: true },
            { text: "Cloud storage: 20GB", included: true },
            { text: "AI-powered mastering", included: true },
            { text: "Real-time collaboration", included: true },
            { text: "VST plugin support", included: true },
            { text: "Stem separation", included: true }
          ],
          cta: "Start Free Trial",
          variant: "primary",
          popular: true
        },
        {
          name: "Studio",
          price: "$49",
          period: "per month",
          description: "For professional studios",
          features: [
            { text: "Everything in Pro, plus:", included: true },
            { text: "Team workspace (5 users)", included: true },
            { text: "Cloud storage: 100GB", included: true },
            { text: "Advanced analytics", included: true },
            { text: "Custom branding", included: true },
            { text: "API access", included: true },
            { text: "Dedicated account manager", included: true },
            { text: "On-premise deployment option", included: true },
            { text: "SLA guarantee", included: true }
          ],
          cta: "Contact Sales",
          variant: "secondary",
          popular: false
        }
      ];
      function handleSelectPlan(tierName) {
        if (tierName === "Free") {
          goto();
        } else if (tierName === "Studio") {
          window.location.href = "mailto:sales@dawg-ai.com?subject=Studio%20Plan%20Inquiry";
        } else {
          goto();
        }
      }
      head($$renderer2, ($$renderer3) => {
        $$renderer3.title(($$renderer4) => {
          $$renderer4.push(`<title>Pricing - DAWG AI</title>`);
        });
        $$renderer3.push(`<meta name="description" content="Choose the perfect plan for your music production needs. Start free, upgrade when you're ready."/>`);
        push_element($$renderer3, "meta", 89, 1);
        pop_element();
      });
      $$renderer2.push(`<div class="min-h-screen p-8">`);
      push_element($$renderer2, "div", 92, 0);
      $$renderer2.push(`<div class="max-w-7xl mx-auto">`);
      push_element($$renderer2, "div", 93, 1);
      $$renderer2.push(`<div class="text-center mb-16">`);
      push_element($$renderer2, "div", 95, 2);
      $$renderer2.push(`<h1 class="text-5xl font-bold mb-4 bg-gradient-to-r from-accent-primary to-accent-secondary bg-clip-text text-transparent">`);
      push_element($$renderer2, "h1", 96, 3);
      $$renderer2.push(`Simple, Transparent Pricing</h1>`);
      pop_element();
      $$renderer2.push(` <p class="text-xl text-white/70 mb-2">`);
      push_element($$renderer2, "p", 99, 3);
      $$renderer2.push(`Start free. Upgrade when you're ready.</p>`);
      pop_element();
      $$renderer2.push(` <p class="text-white/50">`);
      push_element($$renderer2, "p", 102, 3);
      $$renderer2.push(`No credit card required. Cancel anytime.</p>`);
      pop_element();
      $$renderer2.push(`</div>`);
      pop_element();
      $$renderer2.push(` <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">`);
      push_element($$renderer2, "div", 108, 2);
      $$renderer2.push(`<!--[-->`);
      const each_array = ensure_array_like(tiers);
      for (let $$index_1 = 0, $$length = each_array.length; $$index_1 < $$length; $$index_1++) {
        let tier = each_array[$$index_1];
        $$renderer2.push(`<div class="relative">`);
        push_element($$renderer2, "div", 110, 4);
        if (tier.popular) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<div class="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">`);
          push_element($$renderer2, "div", 113, 6);
          $$renderer2.push(`<div class="glass-purple px-4 py-1 rounded-full text-sm font-bold">`);
          push_element($$renderer2, "div", 114, 7);
          $$renderer2.push(`Most Popular</div>`);
          pop_element();
          $$renderer2.push(`</div>`);
          pop_element();
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--> <div${attr_class(`glass-strong rounded-panel p-8 h-full flex flex-col ${stringify(tier.popular ? "border-2 border-accent-primary" : "")}`)}>`);
        push_element($$renderer2, "div", 121, 5);
        $$renderer2.push(`<h2 class="text-2xl font-bold mb-2">`);
        push_element($$renderer2, "h2", 123, 6);
        $$renderer2.push(`${escape_html(tier.name)}</h2>`);
        pop_element();
        $$renderer2.push(` <p class="text-white/60 mb-6">`);
        push_element($$renderer2, "p", 126, 6);
        $$renderer2.push(`${escape_html(tier.description)}</p>`);
        pop_element();
        $$renderer2.push(` <div class="mb-6">`);
        push_element($$renderer2, "div", 129, 6);
        $$renderer2.push(`<div class="flex items-baseline gap-2">`);
        push_element($$renderer2, "div", 130, 7);
        $$renderer2.push(`<span class="text-5xl font-bold">`);
        push_element($$renderer2, "span", 131, 8);
        $$renderer2.push(`${escape_html(tier.price)}</span>`);
        pop_element();
        $$renderer2.push(` <span class="text-white/60">`);
        push_element($$renderer2, "span", 132, 8);
        $$renderer2.push(`/ ${escape_html(tier.period)}</span>`);
        pop_element();
        $$renderer2.push(`</div>`);
        pop_element();
        $$renderer2.push(`</div>`);
        pop_element();
        $$renderer2.push(` <ul class="space-y-3 mb-8 flex-grow">`);
        push_element($$renderer2, "ul", 137, 6);
        $$renderer2.push(`<!--[-->`);
        const each_array_1 = ensure_array_like(tier.features);
        for (let $$index = 0, $$length2 = each_array_1.length; $$index < $$length2; $$index++) {
          let feature = each_array_1[$$index];
          $$renderer2.push(`<li class="flex items-start gap-3">`);
          push_element($$renderer2, "li", 139, 8);
          if (feature.included) {
            $$renderer2.push("<!--[-->");
            $$renderer2.push(`<div class="mt-1">`);
            push_element($$renderer2, "div", 141, 10);
            Icon($$renderer2, { name: "check", size: "sm", class: "text-accent-primary" });
            $$renderer2.push(`<!----></div>`);
            pop_element();
            $$renderer2.push(` <span class="text-white/80">`);
            push_element($$renderer2, "span", 144, 10);
            $$renderer2.push(`${escape_html(feature.text)}</span>`);
            pop_element();
          } else {
            $$renderer2.push("<!--[!-->");
            $$renderer2.push(`<div class="mt-1">`);
            push_element($$renderer2, "div", 146, 10);
            Icon($$renderer2, { name: "x", size: "sm", class: "text-white/30" });
            $$renderer2.push(`<!----></div>`);
            pop_element();
            $$renderer2.push(` <span class="text-white/40 line-through">`);
            push_element($$renderer2, "span", 149, 10);
            $$renderer2.push(`${escape_html(feature.text)}</span>`);
            pop_element();
          }
          $$renderer2.push(`<!--]--></li>`);
          pop_element();
        }
        $$renderer2.push(`<!--]--></ul>`);
        pop_element();
        $$renderer2.push(` `);
        Button($$renderer2, {
          variant: tier.variant,
          size: "lg",
          fullWidth: true,
          onclick: () => handleSelectPlan(tier.name),
          children: prevent_snippet_stringification(($$renderer3) => {
            $$renderer3.push(`<!---->${escape_html(tier.cta)}`);
          })
        });
        $$renderer2.push(`<!----></div>`);
        pop_element();
        $$renderer2.push(`</div>`);
        pop_element();
      }
      $$renderer2.push(`<!--]--></div>`);
      pop_element();
      $$renderer2.push(` <div class="glass-strong rounded-panel p-12">`);
      push_element($$renderer2, "div", 170, 2);
      $$renderer2.push(`<h2 class="text-3xl font-bold mb-8 text-center">`);
      push_element($$renderer2, "h2", 171, 3);
      $$renderer2.push(`Frequently Asked Questions</h2>`);
      pop_element();
      $$renderer2.push(` <div class="grid grid-cols-1 md:grid-cols-2 gap-8">`);
      push_element($$renderer2, "div", 173, 3);
      $$renderer2.push(`<div>`);
      push_element($$renderer2, "div", 174, 4);
      $$renderer2.push(`<h3 class="text-xl font-bold mb-2">`);
      push_element($$renderer2, "h3", 175, 5);
      $$renderer2.push(`Can I switch plans later?</h3>`);
      pop_element();
      $$renderer2.push(` <p class="text-white/70">`);
      push_element($$renderer2, "p", 176, 5);
      $$renderer2.push(`Yes! You can upgrade or downgrade at any time. Changes take effect immediately.</p>`);
      pop_element();
      $$renderer2.push(`</div>`);
      pop_element();
      $$renderer2.push(` <div>`);
      push_element($$renderer2, "div", 181, 4);
      $$renderer2.push(`<h3 class="text-xl font-bold mb-2">`);
      push_element($$renderer2, "h3", 182, 5);
      $$renderer2.push(`What payment methods do you accept?</h3>`);
      pop_element();
      $$renderer2.push(` <p class="text-white/70">`);
      push_element($$renderer2, "p", 183, 5);
      $$renderer2.push(`We accept all major credit cards, PayPal, and bank transfers for Studio plans.</p>`);
      pop_element();
      $$renderer2.push(`</div>`);
      pop_element();
      $$renderer2.push(` <div>`);
      push_element($$renderer2, "div", 188, 4);
      $$renderer2.push(`<h3 class="text-xl font-bold mb-2">`);
      push_element($$renderer2, "h3", 189, 5);
      $$renderer2.push(`Is there a free trial?</h3>`);
      pop_element();
      $$renderer2.push(` <p class="text-white/70">`);
      push_element($$renderer2, "p", 190, 5);
      $$renderer2.push(`Yes! Pro plans include a 14-day free trial. No credit card required to start.</p>`);
      pop_element();
      $$renderer2.push(`</div>`);
      pop_element();
      $$renderer2.push(` <div>`);
      push_element($$renderer2, "div", 195, 4);
      $$renderer2.push(`<h3 class="text-xl font-bold mb-2">`);
      push_element($$renderer2, "h3", 196, 5);
      $$renderer2.push(`What happens to my projects if I downgrade?</h3>`);
      pop_element();
      $$renderer2.push(` <p class="text-white/70">`);
      push_element($$renderer2, "p", 197, 5);
      $$renderer2.push(`All your projects are preserved. You'll just be limited to the tier's project count until you upgrade again.</p>`);
      pop_element();
      $$renderer2.push(`</div>`);
      pop_element();
      $$renderer2.push(` <div>`);
      push_element($$renderer2, "div", 202, 4);
      $$renderer2.push(`<h3 class="text-xl font-bold mb-2">`);
      push_element($$renderer2, "h3", 203, 5);
      $$renderer2.push(`Do you offer educational discounts?</h3>`);
      pop_element();
      $$renderer2.push(` <p class="text-white/70">`);
      push_element($$renderer2, "p", 204, 5);
      $$renderer2.push(`Yes! Students and educators get 50% off Pro plans. Contact us with your .edu email.</p>`);
      pop_element();
      $$renderer2.push(`</div>`);
      pop_element();
      $$renderer2.push(` <div>`);
      push_element($$renderer2, "div", 209, 4);
      $$renderer2.push(`<h3 class="text-xl font-bold mb-2">`);
      push_element($$renderer2, "h3", 210, 5);
      $$renderer2.push(`Can I cancel anytime?</h3>`);
      pop_element();
      $$renderer2.push(` <p class="text-white/70">`);
      push_element($$renderer2, "p", 211, 5);
      $$renderer2.push(`Absolutely. No lock-in contracts. Cancel anytime and keep access until the end of your billing period.</p>`);
      pop_element();
      $$renderer2.push(`</div>`);
      pop_element();
      $$renderer2.push(`</div>`);
      pop_element();
      $$renderer2.push(`</div>`);
      pop_element();
      $$renderer2.push(` <div class="text-center mt-16">`);
      push_element($$renderer2, "div", 219, 2);
      $$renderer2.push(`<h2 class="text-3xl font-bold mb-4">`);
      push_element($$renderer2, "h2", 220, 3);
      $$renderer2.push(`Ready to create?</h2>`);
      pop_element();
      $$renderer2.push(` <p class="text-white/70 mb-8">`);
      push_element($$renderer2, "p", 221, 3);
      $$renderer2.push(`Join thousands of producers making music on DAWG AI</p>`);
      pop_element();
      $$renderer2.push(` <div class="flex gap-4 justify-center">`);
      push_element($$renderer2, "div", 224, 3);
      Button($$renderer2, {
        variant: "primary",
        size: "xl",
        onclick: () => goto(),
        children: prevent_snippet_stringification(($$renderer3) => {
          Icon($$renderer3, { name: "play", size: "md" });
          $$renderer3.push(`<!----> <span class="ml-2">`);
          push_element($$renderer3, "span", 227, 5);
          $$renderer3.push(`Start Creating</span>`);
          pop_element();
        })
      });
      $$renderer2.push(`<!----> `);
      Button($$renderer2, {
        variant: "secondary",
        size: "xl",
        onclick: () => goto(),
        children: prevent_snippet_stringification(($$renderer3) => {
          Icon($$renderer3, { name: "music", size: "md" });
          $$renderer3.push(`<!----> <span class="ml-2">`);
          push_element($$renderer3, "span", 231, 5);
          $$renderer3.push(`Try the DAW</span>`);
          pop_element();
        })
      });
      $$renderer2.push(`<!----></div>`);
      pop_element();
      $$renderer2.push(`</div>`);
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
