import { p as prevent_snippet_stringification, a as ensure_array_like, b as attr_class, h as head } from "../../../chunks/index2.js";
import * as Tone from "tone";
import "../../../chunks/eventBus.js";
import "../../../chunks/Timeline.svelte_svelte_type_style_lang.js";
import { B as Button, I as Icon, T as Toggle } from "../../../chunks/InspectorPanel.svelte_svelte_type_style_lang.js";
import { p as push_element, a as pop_element } from "../../../chunks/dev.js";
import { Z as escape_html, W as FILENAME } from "../../../chunks/context.js";
PianoRoll[FILENAME] = "src/lib/components/midi/PianoRoll.svelte";
function PianoRoll($$renderer, $$props) {
  $$renderer.component(
    ($$renderer2) => {
      let { trackId, notes = [] } = $$props;
      let editor;
      let tool = "draw";
      let gridDivision = "1/16";
      let snapToGrid = true;
      let snapToScale = false;
      let selectedScale = "major";
      let rootNote = 60;
      const scales = {
        major: [0, 2, 4, 5, 7, 9, 11],
        minor: [0, 2, 3, 5, 7, 8, 10],
        harmonic_minor: [0, 2, 3, 5, 7, 8, 11],
        pentatonic: [0, 2, 4, 7, 9],
        blues: [0, 3, 5, 6, 7, 10],
        chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
      };
      function setTool(newTool) {
        tool = newTool;
        editor.setTool(newTool);
      }
      function setGridDivision(division) {
        gridDivision = division;
        editor.setGridDivision(division);
      }
      function toggleSnapToGrid() {
        snapToGrid = !snapToGrid;
        editor.setSnapToGrid(snapToGrid);
      }
      function toggleSnapToScale() {
        snapToScale = !snapToScale;
        editor.setSnapToScale(snapToScale);
      }
      function handleScaleChange(event) {
        const select = event.target;
        selectedScale = select.value;
        editor.setScale(scales[selectedScale], rootNote);
      }
      function quantizeNotes() {
        editor.quantizeSelectedNotes();
      }
      function clearNotes() {
        if (confirm("Clear all notes?")) {
          editor.setNotes([]);
          notes = [];
        }
      }
      function selectAll() {
        const allNotes = editor.getNotes();
        allNotes.forEach((note) => editor.selectNote(note.id, true));
      }
      $$renderer2.push(`<div class="piano-roll svelte-1dm2aw0">`);
      push_element($$renderer2, "div", 172, 0);
      $$renderer2.push(`<div class="toolbar glass-strong svelte-1dm2aw0">`);
      push_element($$renderer2, "div", 174, 2);
      $$renderer2.push(`<div class="tool-group svelte-1dm2aw0">`);
      push_element($$renderer2, "div", 176, 4);
      $$renderer2.push(`<span class="tool-label svelte-1dm2aw0">`);
      push_element($$renderer2, "span", 177, 6);
      $$renderer2.push(`Tools:</span>`);
      pop_element();
      $$renderer2.push(` `);
      Button($$renderer2, {
        variant: tool === "select" ? "primary" : "secondary",
        size: "sm",
        onclick: () => setTool("select"),
        children: prevent_snippet_stringification(($$renderer3) => {
          Icon($$renderer3, { name: "cursor", size: "sm" });
        })
      });
      $$renderer2.push(`<!----> `);
      Button($$renderer2, {
        variant: tool === "draw" ? "primary" : "secondary",
        size: "sm",
        onclick: () => setTool("draw"),
        children: prevent_snippet_stringification(($$renderer3) => {
          Icon($$renderer3, { name: "pencil", size: "sm" });
        })
      });
      $$renderer2.push(`<!----> `);
      Button($$renderer2, {
        variant: tool === "erase" ? "primary" : "secondary",
        size: "sm",
        onclick: () => setTool("erase"),
        children: prevent_snippet_stringification(($$renderer3) => {
          Icon($$renderer3, { name: "eraser", size: "sm" });
        })
      });
      $$renderer2.push(`<!----></div>`);
      pop_element();
      $$renderer2.push(` <div class="grid-controls svelte-1dm2aw0">`);
      push_element($$renderer2, "div", 205, 4);
      $$renderer2.push(`<span class="tool-label svelte-1dm2aw0">`);
      push_element($$renderer2, "span", 206, 6);
      $$renderer2.push(`Grid:</span>`);
      pop_element();
      $$renderer2.push(` `);
      $$renderer2.select(
        {
          class: "grid-select",
          value: gridDivision,
          onchange: (e) => setGridDivision(e.target.value)
        },
        ($$renderer3) => {
          $$renderer3.option({ value: "1/4" }, ($$renderer4) => {
            $$renderer4.push(`1/4`);
          });
          $$renderer3.option({ value: "1/8" }, ($$renderer4) => {
            $$renderer4.push(`1/8`);
          });
          $$renderer3.option({ value: "1/16" }, ($$renderer4) => {
            $$renderer4.push(`1/16`);
          });
          $$renderer3.option({ value: "1/32" }, ($$renderer4) => {
            $$renderer4.push(`1/32`);
          });
          $$renderer3.option({ value: "1/64" }, ($$renderer4) => {
            $$renderer4.push(`1/64`);
          });
          $$renderer3.option({ value: "1/4T" }, ($$renderer4) => {
            $$renderer4.push(`1/4T`);
          });
          $$renderer3.option({ value: "1/8T" }, ($$renderer4) => {
            $$renderer4.push(`1/8T`);
          });
          $$renderer3.option({ value: "1/16T" }, ($$renderer4) => {
            $$renderer4.push(`1/16T`);
          });
        },
        "svelte-1dm2aw0"
      );
      $$renderer2.push(` `);
      Toggle($$renderer2, {
        checked: snapToGrid,
        label: "Snap to Grid",
        onchange: toggleSnapToGrid
      });
      $$renderer2.push(`<!----></div>`);
      pop_element();
      $$renderer2.push(` <div class="scale-controls svelte-1dm2aw0">`);
      push_element($$renderer2, "div", 230, 4);
      Toggle($$renderer2, {
        checked: snapToScale,
        label: "Snap to Scale",
        onchange: toggleSnapToScale
      });
      $$renderer2.push(`<!----> `);
      if (snapToScale) {
        $$renderer2.push("<!--[-->");
        $$renderer2.select(
          {
            class: "scale-select",
            value: selectedScale,
            onchange: handleScaleChange
          },
          ($$renderer3) => {
            $$renderer3.option({ value: "major" }, ($$renderer4) => {
              $$renderer4.push(`Major`);
            });
            $$renderer3.option({ value: "minor" }, ($$renderer4) => {
              $$renderer4.push(`Minor`);
            });
            $$renderer3.option({ value: "harmonic_minor" }, ($$renderer4) => {
              $$renderer4.push(`Harmonic Minor`);
            });
            $$renderer3.option({ value: "pentatonic" }, ($$renderer4) => {
              $$renderer4.push(`Pentatonic`);
            });
            $$renderer3.option({ value: "blues" }, ($$renderer4) => {
              $$renderer4.push(`Blues`);
            });
            $$renderer3.option({ value: "chromatic" }, ($$renderer4) => {
              $$renderer4.push(`Chromatic`);
            });
          },
          "svelte-1dm2aw0"
        );
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div>`);
      pop_element();
      $$renderer2.push(` <div class="actions svelte-1dm2aw0">`);
      push_element($$renderer2, "div", 250, 4);
      Button($$renderer2, {
        variant: "secondary",
        size: "sm",
        onclick: quantizeNotes,
        children: prevent_snippet_stringification(($$renderer3) => {
          Icon($$renderer3, { name: "grid", size: "sm" });
          $$renderer3.push(`<!----> Quantize`);
        })
      });
      $$renderer2.push(`<!----> `);
      Button($$renderer2, {
        variant: "ghost",
        size: "sm",
        onclick: selectAll,
        children: prevent_snippet_stringification(($$renderer3) => {
          $$renderer3.push(`<!---->Select All`);
        })
      });
      $$renderer2.push(`<!----> `);
      Button($$renderer2, {
        variant: "ghost",
        size: "sm",
        onclick: clearNotes,
        children: prevent_snippet_stringification(($$renderer3) => {
          $$renderer3.push(`<!---->Clear`);
        })
      });
      $$renderer2.push(`<!----></div>`);
      pop_element();
      $$renderer2.push(`</div>`);
      pop_element();
      $$renderer2.push(` <div class="editor-container svelte-1dm2aw0">`);
      push_element($$renderer2, "div", 265, 2);
      $$renderer2.push(`<div class="piano-roll-canvas-wrapper svelte-1dm2aw0">`);
      push_element($$renderer2, "div", 267, 4);
      {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="piano-keyboard svelte-1dm2aw0">`);
        push_element($$renderer2, "div", 269, 8);
        $$renderer2.push(`<!--[-->`);
        const each_array = ensure_array_like(Array.from({ length: 72 }, (_, i) => 96 - i));
        for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
          let pitch = each_array[$$index];
          const isBlackKey = [1, 3, 6, 8, 10].includes(pitch % 12);
          const isC = pitch % 12 === 0;
          $$renderer2.push(`<div${attr_class("piano-key svelte-1dm2aw0", void 0, { "black": isBlackKey, "white": !isBlackKey, "c-key": isC })}>`);
          push_element($$renderer2, "div", 274, 12);
          if (isC) {
            $$renderer2.push("<!--[-->");
            $$renderer2.push(`<span class="note-label svelte-1dm2aw0">`);
            push_element($$renderer2, "span", 281, 16);
            $$renderer2.push(`C${escape_html(Math.floor(pitch / 12) - 2)}</span>`);
            pop_element();
          } else {
            $$renderer2.push("<!--[!-->");
          }
          $$renderer2.push(`<!--]--></div>`);
          pop_element();
        }
        $$renderer2.push(`<!--]--></div>`);
        pop_element();
      }
      $$renderer2.push(`<!--]--> <div class="canvas-scroll svelte-1dm2aw0">`);
      push_element($$renderer2, "div", 288, 6);
      $$renderer2.push(`<canvas width="2400" height="600" class="piano-roll-canvas svelte-1dm2aw0">`);
      push_element($$renderer2, "canvas", 289, 8);
      $$renderer2.push(`</canvas>`);
      pop_element();
      $$renderer2.push(`</div>`);
      pop_element();
      $$renderer2.push(`</div>`);
      pop_element();
      $$renderer2.push(` <div class="velocity-editor-wrapper svelte-1dm2aw0">`);
      push_element($$renderer2, "div", 299, 4);
      $$renderer2.push(`<div class="velocity-label svelte-1dm2aw0">`);
      push_element($$renderer2, "div", 300, 6);
      $$renderer2.push(`Velocity</div>`);
      pop_element();
      $$renderer2.push(` <div class="velocity-canvas-scroll svelte-1dm2aw0">`);
      push_element($$renderer2, "div", 301, 6);
      $$renderer2.push(`<canvas width="2400" height="120" class="velocity-canvas svelte-1dm2aw0">`);
      push_element($$renderer2, "canvas", 302, 8);
      $$renderer2.push(`</canvas>`);
      pop_element();
      $$renderer2.push(`</div>`);
      pop_element();
      $$renderer2.push(`</div>`);
      pop_element();
      $$renderer2.push(`</div>`);
      pop_element();
      $$renderer2.push(` <div class="status-bar glass svelte-1dm2aw0">`);
      push_element($$renderer2, "div", 313, 2);
      $$renderer2.push(`<span>`);
      push_element($$renderer2, "span", 314, 4);
      $$renderer2.push(`Notes: ${escape_html(notes.length)}</span>`);
      pop_element();
      $$renderer2.push(` <span>`);
      push_element($$renderer2, "span", 315, 4);
      $$renderer2.push(`Selected: ${escape_html(0)}</span>`);
      pop_element();
      $$renderer2.push(` <span>`);
      push_element($$renderer2, "span", 316, 4);
      $$renderer2.push(`Tool: ${escape_html(tool)}</span>`);
      pop_element();
      $$renderer2.push(` <span>`);
      push_element($$renderer2, "span", 317, 4);
      $$renderer2.push(`Grid: ${escape_html(gridDivision)}</span>`);
      pop_element();
      $$renderer2.push(`</div>`);
      pop_element();
      $$renderer2.push(`</div>`);
      pop_element();
    },
    PianoRoll
  );
}
PianoRoll.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
_page[FILENAME] = "src/routes/midi-demo/+page.svelte";
function _page($$renderer, $$props) {
  $$renderer.component(
    ($$renderer2) => {
      let initialized = false;
      async function initializeAudio() {
        await Tone.start();
        initialized = true;
      }
      head($$renderer2, ($$renderer3) => {
        $$renderer3.title(($$renderer4) => {
          $$renderer4.push(`<title>MIDI Editor Demo - DAWG AI</title>`);
        });
      });
      $$renderer2.push(`<div class="min-h-screen p-8">`);
      push_element($$renderer2, "div", 24, 0);
      $$renderer2.push(`<div class="mb-8">`);
      push_element($$renderer2, "div", 25, 2);
      $$renderer2.push(`<h1 class="text-4xl font-bold mb-2 bg-gradient-to-r from-accent-primary to-accent-secondary bg-clip-text text-transparent">`);
      push_element($$renderer2, "h1", 26, 4);
      $$renderer2.push(`MIDI Editor Demo</h1>`);
      pop_element();
      $$renderer2.push(` <p class="text-white/70">`);
      push_element($$renderer2, "p", 29, 4);
      $$renderer2.push(`Module 4: Piano Roll Editor</p>`);
      pop_element();
      $$renderer2.push(`</div>`);
      pop_element();
      $$renderer2.push(` `);
      if (!initialized) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="glass-strong rounded-panel p-12 text-center">`);
        push_element($$renderer2, "div", 33, 4);
        $$renderer2.push(`<h2 class="text-2xl font-bold mb-4">`);
        push_element($$renderer2, "h2", 34, 6);
        $$renderer2.push(`Audio Not Initialized</h2>`);
        pop_element();
        $$renderer2.push(` <p class="text-white/70 mb-6">`);
        push_element($$renderer2, "p", 35, 6);
        $$renderer2.push(`Click the button below to initialize the audio engine</p>`);
        pop_element();
        $$renderer2.push(` `);
        Button($$renderer2, {
          variant: "primary",
          size: "lg",
          onclick: initializeAudio,
          children: prevent_snippet_stringification(($$renderer3) => {
            $$renderer3.push(`<!---->Initialize Audio`);
          })
        });
        $$renderer2.push(`<!----></div>`);
        pop_element();
      } else {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`<div class="glass-strong rounded-panel p-4" style="height: 800px;">`);
        push_element($$renderer2, "div", 43, 4);
        PianoRoll($$renderer2, { trackId: "demo-track", notes: [] });
        $$renderer2.push(`<!----></div>`);
        pop_element();
        $$renderer2.push(` <div class="mt-8 glass rounded-panel p-6">`);
        push_element($$renderer2, "div", 47, 4);
        $$renderer2.push(`<h3 class="text-xl font-bold mb-4">`);
        push_element($$renderer2, "h3", 48, 6);
        $$renderer2.push(`Keyboard Shortcuts</h3>`);
        pop_element();
        $$renderer2.push(` <div class="grid grid-cols-2 md:grid-cols-3 gap-4">`);
        push_element($$renderer2, "div", 49, 6);
        $$renderer2.push(`<div>`);
        push_element($$renderer2, "div", 50, 8);
        $$renderer2.push(`<kbd class="kbd svelte-gvbxsc">`);
        push_element($$renderer2, "kbd", 51, 10);
        $$renderer2.push(`V</kbd>`);
        pop_element();
        $$renderer2.push(` - Select Tool</div>`);
        pop_element();
        $$renderer2.push(` <div>`);
        push_element($$renderer2, "div", 53, 8);
        $$renderer2.push(`<kbd class="kbd svelte-gvbxsc">`);
        push_element($$renderer2, "kbd", 54, 10);
        $$renderer2.push(`B</kbd>`);
        pop_element();
        $$renderer2.push(` - Draw Tool</div>`);
        pop_element();
        $$renderer2.push(` <div>`);
        push_element($$renderer2, "div", 56, 8);
        $$renderer2.push(`<kbd class="kbd svelte-gvbxsc">`);
        push_element($$renderer2, "kbd", 57, 10);
        $$renderer2.push(`E</kbd>`);
        pop_element();
        $$renderer2.push(` - Erase Tool</div>`);
        pop_element();
        $$renderer2.push(` <div>`);
        push_element($$renderer2, "div", 59, 8);
        $$renderer2.push(`<kbd class="kbd svelte-gvbxsc">`);
        push_element($$renderer2, "kbd", 60, 10);
        $$renderer2.push(`Cmd/Ctrl+Q</kbd>`);
        pop_element();
        $$renderer2.push(` - Quantize</div>`);
        pop_element();
        $$renderer2.push(` <div>`);
        push_element($$renderer2, "div", 62, 8);
        $$renderer2.push(`<kbd class="kbd svelte-gvbxsc">`);
        push_element($$renderer2, "kbd", 63, 10);
        $$renderer2.push(`Cmd/Ctrl+A</kbd>`);
        pop_element();
        $$renderer2.push(` - Select All</div>`);
        pop_element();
        $$renderer2.push(` <div>`);
        push_element($$renderer2, "div", 65, 8);
        $$renderer2.push(`<kbd class="kbd svelte-gvbxsc">`);
        push_element($$renderer2, "kbd", 66, 10);
        $$renderer2.push(`Delete/Backspace</kbd>`);
        pop_element();
        $$renderer2.push(` - Delete Selected</div>`);
        pop_element();
        $$renderer2.push(`</div>`);
        pop_element();
        $$renderer2.push(`</div>`);
        pop_element();
        $$renderer2.push(` <div class="mt-4 glass rounded-panel p-6">`);
        push_element($$renderer2, "div", 71, 4);
        $$renderer2.push(`<h3 class="text-xl font-bold mb-4">`);
        push_element($$renderer2, "h3", 72, 6);
        $$renderer2.push(`Features</h3>`);
        pop_element();
        $$renderer2.push(` <ul class="list-disc list-inside space-y-2 text-white/70">`);
        push_element($$renderer2, "ul", 73, 6);
        $$renderer2.push(`<li>`);
        push_element($$renderer2, "li", 74, 8);
        $$renderer2.push(`Click and drag to draw MIDI notes</li>`);
        pop_element();
        $$renderer2.push(` <li>`);
        push_element($$renderer2, "li", 75, 8);
        $$renderer2.push(`Select notes with selection tool</li>`);
        pop_element();
        $$renderer2.push(` <li>`);
        push_element($$renderer2, "li", 76, 8);
        $$renderer2.push(`Erase notes with eraser tool</li>`);
        pop_element();
        $$renderer2.push(` <li>`);
        push_element($$renderer2, "li", 77, 8);
        $$renderer2.push(`Quantize to grid (1/4, 1/8, 1/16, 1/32, triplets)</li>`);
        pop_element();
        $$renderer2.push(` <li>`);
        push_element($$renderer2, "li", 78, 8);
        $$renderer2.push(`Snap to scale (Major, Minor, Pentatonic, Blues, etc.)</li>`);
        pop_element();
        $$renderer2.push(` <li>`);
        push_element($$renderer2, "li", 79, 8);
        $$renderer2.push(`Edit note velocities in velocity editor</li>`);
        pop_element();
        $$renderer2.push(` <li>`);
        push_element($$renderer2, "li", 80, 8);
        $$renderer2.push(`Piano keyboard shows note names</li>`);
        pop_element();
        $$renderer2.push(` <li>`);
        push_element($$renderer2, "li", 81, 8);
        $$renderer2.push(`Grid lines for timing reference</li>`);
        pop_element();
        $$renderer2.push(`</ul>`);
        pop_element();
        $$renderer2.push(`</div>`);
        pop_element();
      }
      $$renderer2.push(`<!--]--></div>`);
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
