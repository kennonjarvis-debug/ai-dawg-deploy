import { b as attr_class, g as attr, h as head, p as prevent_snippet_stringification } from "../../../chunks/index2.js";
import { o as onDestroy } from "../../../chunks/index-server.js";
import "@anthropic-ai/sdk";
import "../../../chunks/logger.js";
import { p as push_element, a as pop_element } from "../../../chunks/dev.js";
import { Z as escape_html, W as FILENAME } from "../../../chunks/context.js";
import "../../../chunks/Timeline.svelte_svelte_type_style_lang.js";
import { B as Button } from "../../../chunks/InspectorPanel.svelte_svelte_type_style_lang.js";
VoiceControl[FILENAME] = "src/lib/voice/VoiceControl.svelte";
function VoiceControl($$renderer, $$props) {
  $$renderer.component(
    ($$renderer2) => {
      let isListening = false;
      let transcript = "";
      let interimTranscript = "";
      let isSpeaking = false;
      let currentAction = "";
      let error = "";
      onDestroy(() => {
        window.removeEventListener("voice:listening-started", handleListeningStarted);
        window.removeEventListener("voice:listening-stopped", handleListeningStopped);
        window.removeEventListener("voice:transcript", handleTranscript);
        window.removeEventListener("voice:interim-transcript", handleInterimTranscript);
        window.removeEventListener("voice:speaking", handleSpeaking);
        window.removeEventListener("voice:speaking-done", handleSpeakingDone);
        window.removeEventListener("voice:action-executed", handleActionExecuted);
        window.removeEventListener("voice:error", handleError);
        window.removeEventListener("voice:wake-word-detected", handleWakeWord);
      });
      function handleListeningStarted() {
        isListening = true;
        error = "";
      }
      function handleListeningStopped() {
        isListening = false;
      }
      function handleTranscript(e) {
        transcript = e.detail.transcript;
        interimTranscript = "";
      }
      function handleInterimTranscript(e) {
        interimTranscript = e.detail.transcript;
      }
      function handleSpeaking(e) {
        isSpeaking = true;
      }
      function handleSpeakingDone(e) {
        isSpeaking = false;
      }
      function handleActionExecuted(e) {
        currentAction = `Executed: ${e.detail.action}`;
        setTimeout(() => currentAction = "", 3e3);
      }
      function handleError(e) {
        console.error("Voice error:", e.detail.error);
        error = "Voice error occurred";
        setTimeout(() => error = "", 5e3);
      }
      function handleWakeWord(e) {
        console.log("Wake word detected:", e.detail.transcript);
      }
      $$renderer2.push(`<div class="voice-control svelte-1igazn7">`);
      push_element($$renderer2, "div", 119, 0);
      $$renderer2.push(`<button${attr_class("voice-button svelte-1igazn7", void 0, {
        "listening": isListening,
        "speaking": isSpeaking,
        "disabled": true
      })}${attr("title", isListening ? "Stop listening" : "Start voice control")}${attr("disabled", true, true)}>`);
      push_element($$renderer2, "button", 120, 1);
      if (isListening) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<span class="icon svelte-1igazn7">`);
        push_element($$renderer2, "span", 130, 3);
        $$renderer2.push(`🎤</span>`);
        pop_element();
        $$renderer2.push(` <span class="pulse svelte-1igazn7">`);
        push_element($$renderer2, "span", 131, 3);
        $$renderer2.push(`</span>`);
        pop_element();
      } else {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`<span class="icon svelte-1igazn7">`);
        push_element($$renderer2, "span", 133, 3);
        $$renderer2.push(`🎤</span>`);
        pop_element();
      }
      $$renderer2.push(`<!--]--></button>`);
      pop_element();
      $$renderer2.push(` `);
      if (error) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="error-display svelte-1igazn7">`);
        push_element($$renderer2, "div", 138, 2);
        $$renderer2.push(`<p class="error svelte-1igazn7">`);
        push_element($$renderer2, "p", 139, 3);
        $$renderer2.push(`❌ ${escape_html(error)}</p>`);
        pop_element();
        $$renderer2.push(`</div>`);
        pop_element();
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (isListening || transcript) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="transcript-display svelte-1igazn7">`);
        push_element($$renderer2, "div", 144, 2);
        $$renderer2.push(`<div class="header svelte-1igazn7">`);
        push_element($$renderer2, "div", 145, 3);
        $$renderer2.push(`<h4 class="svelte-1igazn7">`);
        push_element($$renderer2, "h4", 146, 4);
        $$renderer2.push(`Voice Command</h4>`);
        pop_element();
        $$renderer2.push(` <button class="reset-btn svelte-1igazn7" title="Reset conversation">`);
        push_element($$renderer2, "button", 147, 4);
        $$renderer2.push(`🔄</button>`);
        pop_element();
        $$renderer2.push(`</div>`);
        pop_element();
        $$renderer2.push(` `);
        if (interimTranscript) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<p class="interim svelte-1igazn7">`);
          push_element($$renderer2, "p", 151, 4);
          $$renderer2.push(`${escape_html(interimTranscript)}</p>`);
          pop_element();
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--> `);
        if (transcript) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<p class="final svelte-1igazn7">`);
          push_element($$renderer2, "p", 154, 4);
          $$renderer2.push(`${escape_html(transcript)}</p>`);
          pop_element();
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--> `);
        if (isSpeaking) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<p class="response svelte-1igazn7">`);
          push_element($$renderer2, "p", 157, 4);
          $$renderer2.push(`🔊 DAWG AI is speaking...</p>`);
          pop_element();
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--> `);
        if (currentAction) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<p class="action svelte-1igazn7">`);
          push_element($$renderer2, "p", 160, 4);
          $$renderer2.push(`✓ ${escape_html(currentAction)}</p>`);
          pop_element();
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--></div>`);
        pop_element();
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div>`);
      pop_element();
    },
    VoiceControl
  );
}
VoiceControl.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
_page[FILENAME] = "src/routes/voice-demo/+page.svelte";
function _page($$renderer, $$props) {
  $$renderer.component(
    ($$renderer2) => {
      let showInstructions = true;
      head($$renderer2, ($$renderer3) => {
        $$renderer3.title(($$renderer4) => {
          $$renderer4.push(`<title>Voice Interface Demo - DAWG AI</title>`);
        });
      });
      $$renderer2.push(`<div class="min-h-screen p-8">`);
      push_element($$renderer2, "div", 17, 0);
      $$renderer2.push(`<div class="mb-8">`);
      push_element($$renderer2, "div", 18, 1);
      $$renderer2.push(`<h1 class="text-4xl font-bold mb-2 bg-gradient-to-r from-accent-primary to-accent-secondary bg-clip-text text-transparent">`);
      push_element($$renderer2, "h1", 19, 2);
      $$renderer2.push(`Voice Interface Demo</h1>`);
      pop_element();
      $$renderer2.push(` <p class="text-white/70">`);
      push_element($$renderer2, "p", 24, 2);
      $$renderer2.push(`Module 6: Conversational DAW Control</p>`);
      pop_element();
      $$renderer2.push(`</div>`);
      pop_element();
      $$renderer2.push(` `);
      if (showInstructions) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="glass-strong rounded-panel p-8 mb-8">`);
        push_element($$renderer2, "div", 28, 2);
        $$renderer2.push(`<h2 class="text-2xl font-bold mb-4">`);
        push_element($$renderer2, "h2", 29, 3);
        $$renderer2.push(`Getting Started</h2>`);
        pop_element();
        $$renderer2.push(` <div class="mb-6">`);
        push_element($$renderer2, "div", 31, 3);
        $$renderer2.push(`<h3 class="text-xl font-semibold mb-2">`);
        push_element($$renderer2, "h3", 32, 4);
        $$renderer2.push(`Setup Required:</h3>`);
        pop_element();
        $$renderer2.push(` <p class="text-white/70 mb-4">`);
        push_element($$renderer2, "p", 33, 4);
        $$renderer2.push(`Add these environment variables to your <code class="svelte-4zv8u7">`);
        push_element($$renderer2, "code", 34, 45);
        $$renderer2.push(`.env</code>`);
        pop_element();
        $$renderer2.push(` file:</p>`);
        pop_element();
        $$renderer2.push(` <pre class="bg-black/50 p-4 rounded border border-white/10 overflow-x-auto svelte-4zv8u7">`);
        push_element($$renderer2, "pre", 36, 4);
        $$renderer2.push(`<code class="svelte-4zv8u7">`);
        push_element($$renderer2, "code", 37, 76);
        $$renderer2.push(`VITE_DEEPGRAM_API_KEY=your_deepgram_api_key
VITE_ANTHROPIC_API_KEY=your_anthropic_api_key
VITE_ELEVENLABS_API_KEY=your_elevenlabs_api_key</code>`);
        pop_element();
        $$renderer2.push(`</pre>`);
        pop_element();
        $$renderer2.push(`</div>`);
        pop_element();
        $$renderer2.push(` <div class="mb-6">`);
        push_element($$renderer2, "div", 42, 3);
        $$renderer2.push(`<h3 class="text-xl font-semibold mb-2">`);
        push_element($$renderer2, "h3", 43, 4);
        $$renderer2.push(`How to Use:</h3>`);
        pop_element();
        $$renderer2.push(` <ol class="list-decimal list-inside space-y-2 text-white/70">`);
        push_element($$renderer2, "ol", 44, 4);
        $$renderer2.push(`<li>`);
        push_element($$renderer2, "li", 45, 5);
        $$renderer2.push(`Click the floating microphone button (bottom right)</li>`);
        pop_element();
        $$renderer2.push(` <li>`);
        push_element($$renderer2, "li", 46, 5);
        $$renderer2.push(`Say the wake word: <strong>`);
        push_element($$renderer2, "strong", 46, 28);
        $$renderer2.push(`"Hey DAWG"</strong>`);
        pop_element();
        $$renderer2.push(`</li>`);
        pop_element();
        $$renderer2.push(` <li>`);
        push_element($$renderer2, "li", 47, 5);
        $$renderer2.push(`Give a voice command (see examples below)</li>`);
        pop_element();
        $$renderer2.push(` <li>`);
        push_element($$renderer2, "li", 48, 5);
        $$renderer2.push(`DAWG AI will execute the command and respond</li>`);
        pop_element();
        $$renderer2.push(`</ol>`);
        pop_element();
        $$renderer2.push(`</div>`);
        pop_element();
        $$renderer2.push(` <div class="mb-6">`);
        push_element($$renderer2, "div", 52, 3);
        $$renderer2.push(`<h3 class="text-xl font-semibold mb-2">`);
        push_element($$renderer2, "h3", 53, 4);
        $$renderer2.push(`Example Commands:</h3>`);
        pop_element();
        $$renderer2.push(` <div class="grid grid-cols-1 md:grid-cols-2 gap-4">`);
        push_element($$renderer2, "div", 54, 4);
        $$renderer2.push(`<div class="bg-black/30 p-4 rounded">`);
        push_element($$renderer2, "div", 55, 5);
        $$renderer2.push(`<h4 class="font-semibold mb-2 text-accent-primary">`);
        push_element($$renderer2, "h4", 56, 6);
        $$renderer2.push(`Playback</h4>`);
        pop_element();
        $$renderer2.push(` <ul class="text-sm text-white/70 space-y-1">`);
        push_element($$renderer2, "ul", 57, 6);
        $$renderer2.push(`<li>`);
        push_element($$renderer2, "li", 58, 7);
        $$renderer2.push(`"Play"</li>`);
        pop_element();
        $$renderer2.push(` <li>`);
        push_element($$renderer2, "li", 59, 7);
        $$renderer2.push(`"Stop playback"</li>`);
        pop_element();
        $$renderer2.push(` <li>`);
        push_element($$renderer2, "li", 60, 7);
        $$renderer2.push(`"Pause"</li>`);
        pop_element();
        $$renderer2.push(` <li>`);
        push_element($$renderer2, "li", 61, 7);
        $$renderer2.push(`"Start recording"</li>`);
        pop_element();
        $$renderer2.push(`</ul>`);
        pop_element();
        $$renderer2.push(`</div>`);
        pop_element();
        $$renderer2.push(` <div class="bg-black/30 p-4 rounded">`);
        push_element($$renderer2, "div", 65, 5);
        $$renderer2.push(`<h4 class="font-semibold mb-2 text-accent-primary">`);
        push_element($$renderer2, "h4", 66, 6);
        $$renderer2.push(`Track Management</h4>`);
        pop_element();
        $$renderer2.push(` <ul class="text-sm text-white/70 space-y-1">`);
        push_element($$renderer2, "ul", 67, 6);
        $$renderer2.push(`<li>`);
        push_element($$renderer2, "li", 68, 7);
        $$renderer2.push(`"Add an audio track"</li>`);
        pop_element();
        $$renderer2.push(` <li>`);
        push_element($$renderer2, "li", 69, 7);
        $$renderer2.push(`"Add a MIDI track called Drums"</li>`);
        pop_element();
        $$renderer2.push(` <li>`);
        push_element($$renderer2, "li", 70, 7);
        $$renderer2.push(`"Mute track 1"</li>`);
        pop_element();
        $$renderer2.push(` <li>`);
        push_element($$renderer2, "li", 71, 7);
        $$renderer2.push(`"Solo the vocals"</li>`);
        pop_element();
        $$renderer2.push(`</ul>`);
        pop_element();
        $$renderer2.push(`</div>`);
        pop_element();
        $$renderer2.push(` <div class="bg-black/30 p-4 rounded">`);
        push_element($$renderer2, "div", 75, 5);
        $$renderer2.push(`<h4 class="font-semibold mb-2 text-accent-primary">`);
        push_element($$renderer2, "h4", 76, 6);
        $$renderer2.push(`Volume Control</h4>`);
        pop_element();
        $$renderer2.push(` <ul class="text-sm text-white/70 space-y-1">`);
        push_element($$renderer2, "ul", 77, 6);
        $$renderer2.push(`<li>`);
        push_element($$renderer2, "li", 78, 7);
        $$renderer2.push(`"Make the vocals louder"</li>`);
        pop_element();
        $$renderer2.push(` <li>`);
        push_element($$renderer2, "li", 79, 7);
        $$renderer2.push(`"Set volume to -6 dB"</li>`);
        pop_element();
        $$renderer2.push(` <li>`);
        push_element($$renderer2, "li", 80, 7);
        $$renderer2.push(`"Turn down track 2 by 3 dB"</li>`);
        pop_element();
        $$renderer2.push(`</ul>`);
        pop_element();
        $$renderer2.push(`</div>`);
        pop_element();
        $$renderer2.push(` <div class="bg-black/30 p-4 rounded">`);
        push_element($$renderer2, "div", 84, 5);
        $$renderer2.push(`<h4 class="font-semibold mb-2 text-accent-primary">`);
        push_element($$renderer2, "h4", 85, 6);
        $$renderer2.push(`Effects</h4>`);
        pop_element();
        $$renderer2.push(` <ul class="text-sm text-white/70 space-y-1">`);
        push_element($$renderer2, "ul", 86, 6);
        $$renderer2.push(`<li>`);
        push_element($$renderer2, "li", 87, 7);
        $$renderer2.push(`"Add reverb to the vocals"</li>`);
        pop_element();
        $$renderer2.push(` <li>`);
        push_element($$renderer2, "li", 88, 7);
        $$renderer2.push(`"Put a compressor on track 1"</li>`);
        pop_element();
        $$renderer2.push(` <li>`);
        push_element($$renderer2, "li", 89, 7);
        $$renderer2.push(`"Add EQ to the selected track"</li>`);
        pop_element();
        $$renderer2.push(`</ul>`);
        pop_element();
        $$renderer2.push(`</div>`);
        pop_element();
        $$renderer2.push(` <div class="bg-black/30 p-4 rounded">`);
        push_element($$renderer2, "div", 93, 5);
        $$renderer2.push(`<h4 class="font-semibold mb-2 text-accent-primary">`);
        push_element($$renderer2, "h4", 94, 6);
        $$renderer2.push(`Tempo</h4>`);
        pop_element();
        $$renderer2.push(` <ul class="text-sm text-white/70 space-y-1">`);
        push_element($$renderer2, "ul", 95, 6);
        $$renderer2.push(`<li>`);
        push_element($$renderer2, "li", 96, 7);
        $$renderer2.push(`"Set the tempo to 120 BPM"</li>`);
        pop_element();
        $$renderer2.push(` <li>`);
        push_element($$renderer2, "li", 97, 7);
        $$renderer2.push(`"Change BPM to 140"</li>`);
        pop_element();
        $$renderer2.push(`</ul>`);
        pop_element();
        $$renderer2.push(`</div>`);
        pop_element();
        $$renderer2.push(` <div class="bg-black/30 p-4 rounded">`);
        push_element($$renderer2, "div", 101, 5);
        $$renderer2.push(`<h4 class="font-semibold mb-2 text-accent-secondary">`);
        push_element($$renderer2, "h4", 102, 6);
        $$renderer2.push(`AI Generation (Coming Soon)</h4>`);
        pop_element();
        $$renderer2.push(` <ul class="text-sm text-white/70 space-y-1">`);
        push_element($$renderer2, "ul", 105, 6);
        $$renderer2.push(`<li>`);
        push_element($$renderer2, "li", 106, 7);
        $$renderer2.push(`"Generate a trap beat" (Module 7)</li>`);
        pop_element();
        $$renderer2.push(` <li>`);
        push_element($$renderer2, "li", 107, 7);
        $$renderer2.push(`"Create a lo-fi drum pattern" (Module 7)</li>`);
        pop_element();
        $$renderer2.push(` <li>`);
        push_element($$renderer2, "li", 108, 7);
        $$renderer2.push(`"Help me mix these vocals" (Module 9)</li>`);
        pop_element();
        $$renderer2.push(`</ul>`);
        pop_element();
        $$renderer2.push(`</div>`);
        pop_element();
        $$renderer2.push(`</div>`);
        pop_element();
        $$renderer2.push(`</div>`);
        pop_element();
        $$renderer2.push(` `);
        Button($$renderer2, {
          variant: "ghost",
          size: "sm",
          onclick: () => showInstructions = false,
          children: prevent_snippet_stringification(($$renderer3) => {
            $$renderer3.push(`<!---->Hide Instructions`);
          })
        });
        $$renderer2.push(`<!----></div>`);
        pop_element();
      } else {
        $$renderer2.push("<!--[!-->");
        Button($$renderer2, {
          variant: "ghost",
          size: "sm",
          onclick: () => showInstructions = true,
          children: prevent_snippet_stringification(($$renderer3) => {
            $$renderer3.push(`<!---->Show Instructions`);
          })
        });
      }
      $$renderer2.push(`<!--]--> <div class="glass rounded-panel p-6 mb-8">`);
      push_element($$renderer2, "div", 124, 1);
      $$renderer2.push(`<h3 class="text-xl font-bold mb-4">`);
      push_element($$renderer2, "h3", 125, 2);
      $$renderer2.push(`Status</h3>`);
      pop_element();
      $$renderer2.push(` <div class="space-y-2 text-sm">`);
      push_element($$renderer2, "div", 126, 2);
      $$renderer2.push(`<div class="flex items-center gap-2">`);
      push_element($$renderer2, "div", 127, 3);
      $$renderer2.push(`<span class="w-24 text-white/70">`);
      push_element($$renderer2, "span", 128, 4);
      $$renderer2.push(`API Keys:</span>`);
      pop_element();
      $$renderer2.push(` <span class="font-mono text-xs">`);
      push_element($$renderer2, "span", 129, 4);
      {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`<span class="text-danger">`);
        push_element($$renderer2, "span", 133, 6);
        $$renderer2.push(`✗ Deepgram</span>`);
        pop_element();
      }
      $$renderer2.push(`<!--]--> `);
      {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`<span class="text-danger ml-2">`);
        push_element($$renderer2, "span", 138, 6);
        $$renderer2.push(`✗ Anthropic</span>`);
        pop_element();
      }
      $$renderer2.push(`<!--]--> `);
      {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`<span class="text-white/50 ml-2">`);
        push_element($$renderer2, "span", 143, 6);
        $$renderer2.push(`○ ElevenLabs (optional)</span>`);
        pop_element();
      }
      $$renderer2.push(`<!--]--></span>`);
      pop_element();
      $$renderer2.push(`</div>`);
      pop_element();
      $$renderer2.push(` <div class="flex items-center gap-2">`);
      push_element($$renderer2, "div", 147, 3);
      $$renderer2.push(`<span class="w-24 text-white/70">`);
      push_element($$renderer2, "span", 148, 4);
      $$renderer2.push(`Microphone:</span>`);
      pop_element();
      $$renderer2.push(` <span class="text-xs">`);
      push_element($$renderer2, "span", 149, 4);
      if (navigator.mediaDevices) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<span class="text-success">`);
        push_element($$renderer2, "span", 151, 6);
        $$renderer2.push(`✓ Available</span>`);
        pop_element();
      } else {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`<span class="text-danger">`);
        push_element($$renderer2, "span", 153, 6);
        $$renderer2.push(`✗ Not available</span>`);
        pop_element();
      }
      $$renderer2.push(`<!--]--></span>`);
      pop_element();
      $$renderer2.push(`</div>`);
      pop_element();
      $$renderer2.push(`</div>`);
      pop_element();
      $$renderer2.push(`</div>`);
      pop_element();
      $$renderer2.push(` <div class="glass rounded-panel p-6">`);
      push_element($$renderer2, "div", 160, 1);
      $$renderer2.push(`<h3 class="text-xl font-bold mb-4">`);
      push_element($$renderer2, "h3", 161, 2);
      $$renderer2.push(`Features</h3>`);
      pop_element();
      $$renderer2.push(` <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">`);
      push_element($$renderer2, "div", 162, 2);
      $$renderer2.push(`<div>`);
      push_element($$renderer2, "div", 163, 3);
      $$renderer2.push(`<h4 class="font-semibold mb-2">`);
      push_element($$renderer2, "h4", 164, 4);
      $$renderer2.push(`Implemented:</h4>`);
      pop_element();
      $$renderer2.push(` <ul class="list-disc list-inside space-y-1 text-white/70">`);
      push_element($$renderer2, "ul", 165, 4);
      $$renderer2.push(`<li>`);
      push_element($$renderer2, "li", 166, 5);
      $$renderer2.push(`Real-time speech-to-text (Deepgram Nova-2)</li>`);
      pop_element();
      $$renderer2.push(` <li>`);
      push_element($$renderer2, "li", 167, 5);
      $$renderer2.push(`Natural language understanding (Claude 3.5 Sonnet)</li>`);
      pop_element();
      $$renderer2.push(` <li>`);
      push_element($$renderer2, "li", 168, 5);
      $$renderer2.push(`Text-to-speech responses (ElevenLabs + Browser fallback)</li>`);
      pop_element();
      $$renderer2.push(` <li>`);
      push_element($$renderer2, "li", 169, 5);
      $$renderer2.push(`Wake word detection ("Hey DAWG")</li>`);
      pop_element();
      $$renderer2.push(` <li>`);
      push_element($$renderer2, "li", 170, 5);
      $$renderer2.push(`Conversation memory (last 10 exchanges)</li>`);
      pop_element();
      $$renderer2.push(` <li>`);
      push_element($$renderer2, "li", 171, 5);
      $$renderer2.push(`Playback control</li>`);
      pop_element();
      $$renderer2.push(` <li>`);
      push_element($$renderer2, "li", 172, 5);
      $$renderer2.push(`Track management</li>`);
      pop_element();
      $$renderer2.push(` <li>`);
      push_element($$renderer2, "li", 173, 5);
      $$renderer2.push(`Volume adjustment</li>`);
      pop_element();
      $$renderer2.push(` <li>`);
      push_element($$renderer2, "li", 174, 5);
      $$renderer2.push(`Effect management</li>`);
      pop_element();
      $$renderer2.push(` <li>`);
      push_element($$renderer2, "li", 175, 5);
      $$renderer2.push(`Tempo control</li>`);
      pop_element();
      $$renderer2.push(`</ul>`);
      pop_element();
      $$renderer2.push(`</div>`);
      pop_element();
      $$renderer2.push(` <div>`);
      push_element($$renderer2, "div", 178, 3);
      $$renderer2.push(`<h4 class="font-semibold mb-2">`);
      push_element($$renderer2, "h4", 179, 4);
      $$renderer2.push(`Coming Soon:</h4>`);
      pop_element();
      $$renderer2.push(` <ul class="list-disc list-inside space-y-1 text-white/70">`);
      push_element($$renderer2, "ul", 180, 4);
      $$renderer2.push(`<li>`);
      push_element($$renderer2, "li", 181, 5);
      $$renderer2.push(`AI beat generation (Module 7)</li>`);
      pop_element();
      $$renderer2.push(` <li>`);
      push_element($$renderer2, "li", 182, 5);
      $$renderer2.push(`AI vocal coaching (Module 8)</li>`);
      pop_element();
      $$renderer2.push(` <li>`);
      push_element($$renderer2, "li", 183, 5);
      $$renderer2.push(`Automated mixing/mastering (Module 9)</li>`);
      pop_element();
      $$renderer2.push(` <li>`);
      push_element($$renderer2, "li", 184, 5);
      $$renderer2.push(`MIDI editing commands</li>`);
      pop_element();
      $$renderer2.push(` <li>`);
      push_element($$renderer2, "li", 185, 5);
      $$renderer2.push(`Complex multi-step workflows</li>`);
      pop_element();
      $$renderer2.push(` <li>`);
      push_element($$renderer2, "li", 186, 5);
      $$renderer2.push(`Project management commands</li>`);
      pop_element();
      $$renderer2.push(`</ul>`);
      pop_element();
      $$renderer2.push(`</div>`);
      pop_element();
      $$renderer2.push(`</div>`);
      pop_element();
      $$renderer2.push(`</div>`);
      pop_element();
      $$renderer2.push(` `);
      VoiceControl($$renderer2);
      $$renderer2.push(`<!----></div>`);
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
