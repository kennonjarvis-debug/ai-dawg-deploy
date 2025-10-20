import { g as attr, b as attr_class, c as stringify, j as bind_props, f as attr_style, a as ensure_array_like } from "./index2.js";
import { p as push_element, a as pop_element } from "./dev.js";
import { W as FILENAME, Z as escape_html } from "./context.js";
function mapValueToRotation(value, min, max, minAngle = -135, maxAngle = 135) {
  const normalized = (value - min) / (max - min);
  return minAngle + normalized * (maxAngle - minAngle);
}
function formatKnobValue(value, unit, decimals = 1) {
  const formatted = value.toFixed(decimals);
  return unit ? `${formatted}${unit}` : formatted;
}
function mapValueToPosition(value, min, max) {
  return (value - min) / (max - min);
}
function formatFaderValue(value, unit) {
  if (unit === "dB") {
    if (value <= -90) return "-∞ dB";
    return `${value.toFixed(1)} dB`;
  }
  if (unit === "%") {
    return `${Math.round(value)}%`;
  }
  return value.toFixed(1) + (unit || "");
}
Button[FILENAME] = "src/lib/design-system/atoms/Button.svelte";
function Button($$renderer, $$props) {
  $$renderer.component(
    ($$renderer2) => {
      let {
        variant = "primary",
        size = "md",
        disabled = false,
        loading = false,
        fullWidth = false,
        class: className = "",
        type = "button",
        "data-testid": dataTestId,
        onclick,
        children
      } = $$props;
      const sizeClasses = {
        xs: "px-2 py-1 text-2xs",
        sm: "px-3 py-1.5 text-xs",
        md: "px-4 py-2 text-sm",
        lg: "px-6 py-3 text-base",
        xl: "px-8 py-4 text-lg"
      };
      const variantClasses = {
        primary: "glass-purple text-white hover:brightness-110 active:brightness-90",
        secondary: "glass text-white hover:bg-white/10 active:bg-white/5",
        ghost: "bg-transparent text-white hover:bg-white/5 active:bg-white/10",
        danger: "bg-danger/80 text-white hover:bg-danger active:bg-danger/70"
      };
      $$renderer2.push(`<button${attr("type", type)}${attr("disabled", disabled || loading, true)}${attr("data-testid", dataTestId)}${attr_class(` relative font-medium rounded-control transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background-dark disabled:opacity-50 disabled:cursor-not-allowed ${stringify(sizeClasses[size])} ${stringify(variantClasses[variant])} ${stringify(fullWidth ? "w-full" : "")} ${stringify(className)} `, "svelte-12im9e1")}${attr("aria-busy", loading)}>`);
      push_element($$renderer2, "button", 48, 0);
      if (loading) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<span class="absolute inset-0 flex items-center justify-center">`);
        push_element($$renderer2, "span", 74, 4);
        $$renderer2.push(`<span class="animate-pulse">`);
        push_element($$renderer2, "span", 75, 6);
        $$renderer2.push(`⏳</span>`);
        pop_element();
        $$renderer2.push(`</span>`);
        pop_element();
        $$renderer2.push(` <span class="invisible">`);
        push_element($$renderer2, "span", 77, 4);
        children?.($$renderer2);
        $$renderer2.push(`<!----></span>`);
        pop_element();
      } else {
        $$renderer2.push("<!--[!-->");
        children?.($$renderer2);
        $$renderer2.push(`<!---->`);
      }
      $$renderer2.push(`<!--]--></button>`);
      pop_element();
    },
    Button
  );
}
Button.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
Knob[FILENAME] = "src/lib/design-system/atoms/Knob.svelte";
function Knob($$renderer, $$props) {
  $$renderer.component(
    ($$renderer2) => {
      let {
        value = 0,
        min = 0,
        max = 127,
        step = 1,
        label = "",
        unit = "",
        size = "md",
        disabled = false,
        bipolar = false,
        sensitivity = 100,
        onchange
      } = $$props;
      const sizeMap = { xs: 32, sm: 48, md: 64, lg: 80, xl: 96 };
      const knobSize = sizeMap[size];
      const rotation = mapValueToRotation(value, min, max);
      const displayValue = formatKnobValue(value, unit);
      $$renderer2.push(`<div${attr_class("knob-container flex flex-col items-center gap-1 select-none svelte-8076gl", void 0, {
        "opacity-50": disabled,
        "cursor-not-allowed": disabled,
        "cursor-ns-resize": !disabled
      })}>`);
      push_element($$renderer2, "div", 85, 0);
      $$renderer2.push(`<svg${attr("width", knobSize)}${attr("height", knobSize)} viewBox="0 0 100 100" role="slider"${attr("aria-valuemin", min)}${attr("aria-valuemax", max)}${attr("aria-valuenow", value)}${attr("aria-label", label || "Knob control")}${attr("tabindex", disabled ? -1 : 0)}>`);
      push_element($$renderer2, "svg", 91, 2);
      $$renderer2.push(`<circle cx="50" cy="50" r="42" fill="var(--color-surface)" stroke="var(--color-border)" stroke-width="2">`);
      push_element($$renderer2, "circle", 106, 4);
      $$renderer2.push(`</circle>`);
      pop_element();
      $$renderer2.push(`<circle cx="50" cy="50" r="42" fill="none" stroke="url(#knob-gradient)" stroke-width="4" stroke-linecap="round"${attr("stroke-dasharray", `${stringify((value - min) / (max - min) * 236)} 236`)} transform="rotate(-118 50 50)" class="transition-all duration-100">`);
      push_element($$renderer2, "circle", 116, 4);
      $$renderer2.push(`</circle>`);
      pop_element();
      $$renderer2.push(`<circle cx="50" cy="50" r="35" fill="var(--glass-purple-medium)" class="glass-strong">`);
      push_element($$renderer2, "circle", 130, 4);
      $$renderer2.push(`</circle>`);
      pop_element();
      $$renderer2.push(`<line x1="50" y1="18" x2="50" y2="32" stroke="var(--color-accent-primary)" stroke-width="3" stroke-linecap="round"${attr("transform", `rotate(${stringify(rotation)} 50 50)`)} class="transition-transform duration-100">`);
      push_element($$renderer2, "line", 139, 4);
      $$renderer2.push(`</line>`);
      pop_element();
      $$renderer2.push(`<defs>`);
      push_element($$renderer2, "defs", 152, 4);
      $$renderer2.push(`<linearGradient id="knob-gradient" x1="0%" y1="0%" x2="100%" y2="100%">`);
      push_element($$renderer2, "linearGradient", 153, 6);
      $$renderer2.push(`<stop offset="0%" stop-color="#a855f7">`);
      push_element($$renderer2, "stop", 154, 8);
      $$renderer2.push(`</stop>`);
      pop_element();
      $$renderer2.push(`<stop offset="100%" stop-color="#c084fc">`);
      push_element($$renderer2, "stop", 155, 8);
      $$renderer2.push(`</stop>`);
      pop_element();
      $$renderer2.push(`</linearGradient>`);
      pop_element();
      $$renderer2.push(`</defs>`);
      pop_element();
      $$renderer2.push(`</svg>`);
      pop_element();
      $$renderer2.push(` `);
      if (label) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<span class="text-xs text-white/70 font-medium">`);
        push_element($$renderer2, "span", 161, 4);
        $$renderer2.push(`${escape_html(label)}</span>`);
        pop_element();
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> <span class="text-2xs font-mono text-white/90">`);
      push_element($$renderer2, "span", 164, 2);
      $$renderer2.push(`${escape_html(displayValue)}</span>`);
      pop_element();
      $$renderer2.push(`</div>`);
      pop_element();
      bind_props($$props, { value });
    },
    Knob
  );
}
Knob.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
Fader[FILENAME] = "src/lib/design-system/atoms/Fader.svelte";
function Fader($$renderer, $$props) {
  $$renderer.component(
    ($$renderer2) => {
      let {
        value = 0,
        min = -90,
        max = 12,
        step = 0.1,
        label = "",
        unit = "dB",
        height = 200,
        width = 40,
        disabled = false,
        showValue = true,
        onchange
      } = $$props;
      const position = mapValueToPosition(value, min, max);
      const thumbPosition = `${(1 - position) * 100}%`;
      const fillHeight = `${position * 100}%`;
      const displayValue = formatFaderValue(value, unit);
      $$renderer2.push(`<div${attr_class("fader-container flex flex-col items-center gap-2 select-none svelte-14mtyph", void 0, { "opacity-50": disabled, "cursor-not-allowed": disabled })}${attr_style(`width: ${stringify(width)}px;`)}>`);
      push_element($$renderer2, "div", 82, 0);
      if (label) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<span class="text-2xs text-white/70 font-medium text-center">`);
        push_element($$renderer2, "span", 89, 4);
        $$renderer2.push(`${escape_html(label)}</span>`);
        pop_element();
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> <div class="fader-track relative glass rounded-control overflow-hidden"${attr_style(`width: 12px; height: ${stringify(height)}px;`)} role="slider"${attr("aria-valuemin", min)}${attr("aria-valuemax", max)}${attr("aria-valuenow", value)}${attr("aria-label", label || "Fader control")}${attr("tabindex", disabled ? -1 : 0)}>`);
      push_element($$renderer2, "div", 92, 2);
      $$renderer2.push(`<div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-accent-primary to-accent-secondary transition-all duration-100"${attr_style(`height: ${stringify(fillHeight)};`)}>`);
      push_element($$renderer2, "div", 106, 4);
      $$renderer2.push(`</div>`);
      pop_element();
      $$renderer2.push(` <div class="absolute left-1/2 -translate-x-1/2 w-8 h-6 glass-purple rounded-control cursor-ns-resize transition-all duration-100 shadow-glass-md"${attr_style(`top: ${stringify(thumbPosition)}; transform: translate(-50%, -50%);`)}>`);
      push_element($$renderer2, "div", 112, 4);
      $$renderer2.push(`<div class="absolute inset-0 flex flex-col items-center justify-center gap-0.5">`);
      push_element($$renderer2, "div", 118, 6);
      $$renderer2.push(`<div class="w-4 h-0.5 bg-white/30 rounded-full">`);
      push_element($$renderer2, "div", 119, 8);
      $$renderer2.push(`</div>`);
      pop_element();
      $$renderer2.push(` <div class="w-4 h-0.5 bg-white/30 rounded-full">`);
      push_element($$renderer2, "div", 120, 8);
      $$renderer2.push(`</div>`);
      pop_element();
      $$renderer2.push(` <div class="w-4 h-0.5 bg-white/30 rounded-full">`);
      push_element($$renderer2, "div", 121, 8);
      $$renderer2.push(`</div>`);
      pop_element();
      $$renderer2.push(`</div>`);
      pop_element();
      $$renderer2.push(`</div>`);
      pop_element();
      $$renderer2.push(`</div>`);
      pop_element();
      $$renderer2.push(` `);
      if (showValue) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<span class="text-2xs font-mono text-white/90">`);
        push_element($$renderer2, "span", 127, 4);
        $$renderer2.push(`${escape_html(displayValue)}</span>`);
        pop_element();
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div>`);
      pop_element();
      bind_props($$props, { value });
    },
    Fader
  );
}
Fader.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
Toggle[FILENAME] = "src/lib/design-system/atoms/Toggle.svelte";
function Toggle($$renderer, $$props) {
  $$renderer.component(
    ($$renderer2) => {
      let {
        checked = false,
        label = "",
        disabled = false,
        size = "md",
        onchange
      } = $$props;
      const sizeMap = {
        xs: { width: 32, height: 16, circle: 12 },
        sm: { width: 40, height: 20, circle: 16 },
        md: { width: 48, height: 24, circle: 20 },
        lg: { width: 56, height: 28, circle: 24 },
        xl: { width: 64, height: 32, circle: 28 }
      };
      const dimensions = sizeMap[size];
      $$renderer2.push(`<button type="button" role="switch"${attr("aria-checked", checked)}${attr("aria-label", label)}${attr("disabled", disabled, true)}${attr_class(` toggle relative inline-flex items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background-dark ${stringify(checked ? "glass-purple" : "glass")} ${stringify(disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer")} `, "svelte-131odzd")}${attr_style(`width: ${stringify(dimensions.width)}px; height: ${stringify(dimensions.height)}px;`)}>`);
      push_element($$renderer2, "button", 48, 0);
      $$renderer2.push(`<span class="inline-block rounded-full bg-white transform transition-transform duration-200 shadow-md"${attr_style(` width: ${stringify(dimensions.circle)}px; height: ${stringify(dimensions.circle)}px; transform: translateX(${stringify(checked ? dimensions.width - dimensions.circle - 4 : 2)}px); `)}>`);
      push_element($$renderer2, "span", 74, 2);
      $$renderer2.push(`</span>`);
      pop_element();
      $$renderer2.push(`</button>`);
      pop_element();
      $$renderer2.push(` `);
      if (label) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<span class="ml-2 text-sm text-white/90">`);
        push_element($$renderer2, "span", 93, 2);
        $$renderer2.push(`${escape_html(label)}</span>`);
        pop_element();
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]-->`);
      bind_props($$props, { checked });
    },
    Toggle
  );
}
Toggle.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
Input[FILENAME] = "src/lib/design-system/atoms/Input.svelte";
function Input($$renderer, $$props) {
  $$renderer.component(
    ($$renderer2) => {
      let {
        type = "text",
        value = "",
        placeholder = "",
        label = "",
        error = "",
        disabled = false,
        required = false,
        size = "md",
        min,
        max,
        step,
        class: className = "",
        "data-testid": dataTestId,
        oninput,
        onchange
      } = $$props;
      const sizeClasses = {
        xs: "px-2 py-1 text-2xs",
        sm: "px-3 py-1.5 text-xs",
        md: "px-4 py-2 text-sm",
        lg: "px-5 py-3 text-base",
        xl: "px-6 py-4 text-lg"
      };
      $$renderer2.push(`<div class="input-wrapper w-full">`);
      push_element($$renderer2, "div", 66, 0);
      if (label) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<label class="block text-sm font-medium text-white/90 mb-1">`);
        push_element($$renderer2, "label", 68, 4);
        $$renderer2.push(`${escape_html(label)} `);
        if (required) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<span class="text-danger">`);
          push_element($$renderer2, "span", 71, 8);
          $$renderer2.push(`*</span>`);
          pop_element();
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--></label>`);
        pop_element();
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> <input${attr("type", type)}${attr("placeholder", placeholder)}${attr("disabled", disabled, true)}${attr("required", required, true)}${attr("min", min)}${attr("max", max)}${attr("step", step)}${attr("value", value)}${attr("data-testid", dataTestId)}${attr_class(
        ` w-full glass rounded-control border transition-all duration-200 font-sans text-white placeholder:text-white/30 focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 disabled:opacity-50 disabled:cursor-not-allowed ${stringify(error ? "border-danger focus:border-danger focus:ring-danger/20" : "border-transparent")} ${stringify(sizeClasses[size])} ${stringify(className)} `,
        "svelte-pxfdqp"
      )}${attr("aria-invalid", !!error)}${attr("aria-describedby", error ? "input-error" : void 0)}/>`);
      push_element($$renderer2, "input", 76, 2);
      pop_element();
      $$renderer2.push(` `);
      if (error) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<p id="input-error" class="mt-1 text-xs text-danger">`);
        push_element($$renderer2, "p", 113, 4);
        $$renderer2.push(`${escape_html(error)}</p>`);
        pop_element();
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div>`);
      pop_element();
      bind_props($$props, { value });
    },
    Input
  );
}
Input.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
Label[FILENAME] = "src/lib/design-system/atoms/Label.svelte";
function Label($$renderer, $$props) {
  $$renderer.component(
    ($$renderer2) => {
      let {
        size = "md",
        weight = "normal",
        color = "var(--color-text-primary)",
        mono = false,
        uppercase = false,
        class: className = "",
        children
      } = $$props;
      const sizeClasses = {
        xs: "text-2xs",
        sm: "text-xs",
        md: "text-sm",
        lg: "text-base",
        xl: "text-lg"
      };
      const weightClasses = {
        normal: "font-normal",
        medium: "font-medium",
        semibold: "font-semibold",
        bold: "font-bold"
      };
      $$renderer2.push(`<span${attr_class(` label ${stringify(sizeClasses[size])} ${stringify(weightClasses[weight])} ${stringify(mono ? "font-mono" : "font-sans")} ${stringify(uppercase ? "uppercase" : "")} ${stringify(className)} `, "svelte-170lbhb")}${attr_style(`color: ${stringify(color)};`)}>`);
      push_element($$renderer2, "span", 42, 0);
      children?.($$renderer2);
      $$renderer2.push(`<!----></span>`);
      pop_element();
    },
    Label
  );
}
Label.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
Icon[FILENAME] = "src/lib/design-system/atoms/Icon.svelte";
function Icon($$renderer, $$props) {
  $$renderer.component(
    ($$renderer2) => {
      let {
        name,
        size = "md",
        color = "currentColor",
        class: className = ""
      } = $$props;
      const sizeMap = { xs: 12, sm: 16, md: 20, lg: 24, xl: 32 };
      const iconSize = typeof size === "number" ? size : sizeMap[size];
      const icons = {
        play: "M8 5v14l11-7z",
        stop: "M6 6h12v12H6z",
        record: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z",
        pause: "M6 4h4v16H6V4zm8 0h4v16h-4V4z",
        loop: "M17 2.1l4 4-4 4M7 21.9l-4-4 4-4",
        settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
        trash: "M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z",
        plus: "M12 5v14m-7-7h14",
        minus: "M5 12h14",
        check: "M20 6L9 17l-5-5",
        x: "M18 6L6 18M6 6l12 12",
        volume: "M11 5L6 9H2v6h4l5 4V5z",
        mute: "M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6m0-6l6 6",
        solo: "M20 12a8 8 0 1 0-16 0 8 8 0 0 0 16 0z",
        folder: "M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-6l-2-2H5a2 2 0 0 0-2 2z",
        audio: "M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z",
        midi: "M9 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4m6-16h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4m-6 0a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H9z",
        waveform: "M2 10h4l3-6 4 12 3-6h6",
        chevronDown: "M6 9l6 6 6-6",
        chevronRight: "M9 6l6 6-6 6",
        sun: "M12 3v1m0 16v1m9-9h-1M4 12H3m15.4 6.4l-.7-.7M6.3 6.3l-.7-.7m12.8 0l-.7.7M6.3 17.7l-.7.7M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z",
        moon: "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
      };
      const iconPath = icons[name] || icons.settings;
      $$renderer2.push(`<svg${attr("width", iconSize)}${attr("height", iconSize)} viewBox="0 0 24 24" fill="none"${attr("stroke", color)} stroke-width="2" stroke-linecap="round" stroke-linejoin="round"${attr_class(`icon ${stringify(className)}`, "svelte-8t0epg")} aria-hidden="true">`);
      push_element($$renderer2, "svg", 61, 0);
      $$renderer2.push(`<path${attr("d", iconPath)}>`);
      push_element($$renderer2, "path", 73, 2);
      $$renderer2.push(`</path>`);
      pop_element();
      $$renderer2.push(`</svg>`);
      pop_element();
    },
    Icon
  );
}
Icon.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
Meter[FILENAME] = "src/lib/design-system/atoms/Meter.svelte";
function Meter($$renderer, $$props) {
  $$renderer.component(
    ($$renderer2) => {
      let {
        value = -90,
        peak = void 0,
        type = "peak",
        height = 200,
        width = 24,
        showScale = false,
        showPeak = true
      } = $$props;
      const scaleMarks = [12, 6, 0, -6, -12, -18, -24, -30, -40, -60];
      $$renderer2.push(`<div class="meter-container flex gap-1 svelte-18gakyy">`);
      push_element($$renderer2, "div", 53, 0);
      $$renderer2.push(`<canvas class="meter-canvas rounded-sm svelte-18gakyy" role="progressbar"${attr("aria-valuemin", -90)}${attr("aria-valuemax", 12)}${attr("aria-valuenow", value)} aria-label="Audio level meter">`);
      push_element($$renderer2, "canvas", 54, 2);
      $$renderer2.push(`</canvas>`);
      pop_element();
      $$renderer2.push(` `);
      if (showScale) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="meter-scale flex flex-col justify-between text-2xs font-mono text-white/50"${attr_style(`height: ${stringify(height)}px;`)}>`);
        push_element($$renderer2, "div", 65, 4);
        $$renderer2.push(`<!--[-->`);
        const each_array = ensure_array_like(scaleMarks);
        for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
          let mark = each_array[$$index];
          $$renderer2.push(`<span>`);
          push_element($$renderer2, "span", 67, 8);
          $$renderer2.push(`${escape_html(mark > 0 ? "+" : "")}${escape_html(mark)}</span>`);
          pop_element();
        }
        $$renderer2.push(`<!--]--></div>`);
        pop_element();
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div>`);
      pop_element();
    },
    Meter
  );
}
Meter.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
export {
  Button as B,
  Fader as F,
  Icon as I,
  Knob as K,
  Label as L,
  Meter as M,
  Toggle as T,
  Input as a
};
