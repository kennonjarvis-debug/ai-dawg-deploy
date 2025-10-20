import { s as store_get, u as unsubscribe_stores, b as attr_class, f as attr_style, c as stringify, p as prevent_snippet_stringification, a as ensure_array_like, h as head, g as attr } from "../../../chunks/index2.js";
import { t as theme } from "../../../chunks/Timeline.svelte_svelte_type_style_lang.js";
import { I as Icon, L as Label, B as Button, T as Toggle } from "../../../chunks/InspectorPanel.svelte_svelte_type_style_lang.js";
import { w as writable, g as get, d as derived } from "../../../chunks/index.js";
import { A as AudioEngine } from "../../../chunks/AudioEngine.js";
import { p as push_element, a as pop_element } from "../../../chunks/dev.js";
import { Z as escape_html, W as FILENAME } from "../../../chunks/context.js";
class TrackManager {
  audioEngine;
  // Svelte stores for reactive UI
  tracks;
  trackOrder;
  selectedTrackId;
  selectedClipIds;
  constructor(audioEngine) {
    this.audioEngine = audioEngine;
    this.tracks = writable(/* @__PURE__ */ new Map());
    this.trackOrder = writable([]);
    this.selectedTrackId = writable(null);
    this.selectedClipIds = writable(/* @__PURE__ */ new Set());
  }
  /**
   * Create a new track
   */
  createTrack(type, name) {
    const id = this.generateId();
    const defaultColors = this.getDefaultColors();
    const colorIndex = get(this.trackOrder).length % defaultColors.length;
    const trackData = {
      id,
      name: name || `${this.capitalizeFirst(type)} ${get(this.trackOrder).length + 1}`,
      type,
      color: defaultColors[colorIndex],
      order: get(this.trackOrder).length,
      height: "medium",
      clips: [],
      settings: {
        volume: 0,
        pan: 0,
        mute: false,
        solo: false,
        recordArm: false,
        monitor: false,
        frozen: false,
        input: "default",
        output: "master"
      }
    };
    if (type !== "folder") {
      this.audioEngine.addTrack({
        id,
        name: trackData.name,
        type: type === "midi" ? "midi" : "audio",
        color: trackData.color
      });
    }
    this.tracks.update((tracks2) => {
      tracks2.set(id, trackData);
      return new Map(tracks2);
    });
    this.trackOrder.update((order) => [...order, id]);
    this.emitEvent("track:created", { trackId: id, track: trackData });
    return trackData;
  }
  /**
   * Delete a track
   */
  deleteTrack(id) {
    const track = get(this.tracks).get(id);
    if (!track) return;
    if (track.type !== "folder") {
      this.audioEngine.removeTrack(id);
    }
    if (track.type === "folder") {
      this.ungroupTracks(id);
    }
    this.tracks.update((tracks2) => {
      tracks2.delete(id);
      return new Map(tracks2);
    });
    this.trackOrder.update((order) => order.filter((tid) => tid !== id));
    this.selectedTrackId.update((selected) => selected === id ? null : selected);
    this.emitEvent("track:deleted", { trackId: id });
  }
  /**
   * Duplicate a track with its settings
   */
  duplicateTrack(id) {
    const originalTrack = get(this.tracks).get(id);
    if (!originalTrack) return null;
    const newTrack = this.createTrack(
      originalTrack.type,
      `${originalTrack.name} (Copy)`
    );
    this.updateTrackSettings(newTrack.id, { ...originalTrack.settings });
    this.tracks.update((tracks2) => {
      const track = tracks2.get(newTrack.id);
      if (track) {
        track.color = originalTrack.color;
      }
      return new Map(tracks2);
    });
    return newTrack;
  }
  /**
   * Rename a track
   */
  renameTrack(id, name) {
    this.tracks.update((tracks2) => {
      const track = tracks2.get(id);
      if (track) {
        track.name = name;
        const audioTrack = this.audioEngine.getTrack(id);
        if (audioTrack) {
          audioTrack.name = name;
        }
      }
      return new Map(tracks2);
    });
    this.emitEvent("track:updated", { trackId: id, property: "name", value: name });
  }
  /**
   * Reorder tracks (drag and drop)
   */
  reorderTrack(trackId, newIndex) {
    this.trackOrder.update((order) => {
      const currentIndex = order.indexOf(trackId);
      if (currentIndex === -1) return order;
      const newOrder = [...order];
      newOrder.splice(currentIndex, 1);
      newOrder.splice(newIndex, 0, trackId);
      this.tracks.update((tracks2) => {
        newOrder.forEach((id, index) => {
          const track = tracks2.get(id);
          if (track) {
            track.order = index;
          }
        });
        return new Map(tracks2);
      });
      return newOrder;
    });
    this.emitEvent("track:reordered", { trackId, newIndex });
  }
  /**
   * Group tracks into a folder
   */
  groupTracks(trackIds, folderName) {
    const folderId = this.createTrack("folder", folderName).id;
    const folderIndex = get(this.trackOrder).indexOf(folderId);
    trackIds.forEach((trackId, index) => {
      this.tracks.update((tracks2) => {
        const track = tracks2.get(trackId);
        if (track) {
          track.parentId = folderId;
        }
        return new Map(tracks2);
      });
      this.reorderTrack(trackId, folderIndex + index + 1);
    });
    return folderId;
  }
  /**
   * Ungroup tracks from a folder
   */
  ungroupTracks(folderId) {
    this.tracks.update((tracks2) => {
      tracks2.forEach((track) => {
        if (track.parentId === folderId) {
          track.parentId = void 0;
        }
      });
      return new Map(tracks2);
    });
  }
  /**
   * Update track settings
   */
  updateTrackSettings(id, settings) {
    this.tracks.update((tracks2) => {
      const track = tracks2.get(id);
      if (!track) return tracks2;
      track.settings = { ...track.settings, ...settings };
      const audioTrack = this.audioEngine.getTrack(id);
      if (audioTrack) {
        if (settings.volume !== void 0) {
          audioTrack.setVolume(settings.volume);
        }
        if (settings.pan !== void 0) {
          audioTrack.setPan(settings.pan);
        }
        if (settings.mute !== void 0) {
          audioTrack.setMute(settings.mute);
        }
        if (settings.solo !== void 0) {
          audioTrack.setSolo(settings.solo);
        }
      }
      return new Map(tracks2);
    });
    this.emitEvent("track:updated", { trackId: id, settings });
  }
  /**
   * Change track color
   */
  setTrackColor(id, color) {
    this.tracks.update((tracks2) => {
      const track = tracks2.get(id);
      if (track) {
        track.color = color;
      }
      return new Map(tracks2);
    });
    this.emitEvent("track:updated", { trackId: id, property: "color", value: color });
  }
  /**
   * Set track height
   */
  setTrackHeight(id, height) {
    this.tracks.update((tracks2) => {
      const track = tracks2.get(id);
      if (track) {
        track.height = height;
      }
      return new Map(tracks2);
    });
  }
  /**
   * Freeze track (render to audio for CPU savings)
   */
  async freezeTrack(id) {
    const track = get(this.tracks).get(id);
    if (!track || track.settings.frozen) return;
    this.updateTrackSettings(id, { frozen: true });
  }
  /**
   * Unfreeze track
   */
  unfreezeTrack(id) {
    this.updateTrackSettings(id, { frozen: false });
  }
  /**
   * Select a track
   */
  selectTrack(id) {
    this.selectedTrackId.set(id);
    this.emitEvent("track:selected", { trackId: id });
  }
  /**
   * Get selected track
   */
  getSelectedTrack() {
    const selectedId = get(this.selectedTrackId);
    if (!selectedId) return null;
    return get(this.tracks).get(selectedId) || null;
  }
  /**
   * Get track by ID
   */
  getTrack(id) {
    return get(this.tracks).get(id);
  }
  /**
   * Get all tracks
   */
  getAllTracks() {
    return Array.from(get(this.tracks).values());
  }
  /**
   * Get tracks in order
   */
  getOrderedTracks() {
    const tracks2 = get(this.tracks);
    const order = get(this.trackOrder);
    return order.map((id) => tracks2.get(id)).filter(Boolean);
  }
  /**
   * Add clip to track
   */
  addClip(trackId, clip) {
    this.tracks.update((tracks2) => {
      const track = tracks2.get(trackId);
      if (track) {
        track.clips.push(clip);
      }
      return new Map(tracks2);
    });
  }
  /**
   * Remove clip from track
   */
  removeClip(trackId, clipId) {
    this.tracks.update((tracks2) => {
      const track = tracks2.get(trackId);
      if (track) {
        track.clips = track.clips.filter((c) => c.id !== clipId);
      }
      return new Map(tracks2);
    });
  }
  /**
   * Select clips
   */
  selectClip(clipId, addToSelection = false) {
    this.selectedClipIds.update((selected) => {
      if (!addToSelection) {
        selected.clear();
      }
      selected.add(clipId);
      return new Set(selected);
    });
  }
  /**
   * Clear clip selection
   */
  clearClipSelection() {
    this.selectedClipIds.set(/* @__PURE__ */ new Set());
  }
  // === PRIVATE UTILITIES ===
  generateId() {
    return `track-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  getDefaultColors() {
    return [
      "#ff006e",
      // Pink
      "#00d9ff",
      // Cyan
      "#00ff88",
      // Green
      "#a855f7",
      // Purple
      "#ffaa00",
      // Orange
      "#ff3366",
      // Red
      "#c084fc",
      // Light Purple
      "#ffd700"
      // Gold
    ];
  }
  emitEvent(type, payload) {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(type, { detail: payload }));
    }
  }
}
let audioEngineInstance;
function getAudioEngine() {
  if (!audioEngineInstance) {
    audioEngineInstance = AudioEngine.getInstance({
      sampleRate: 48e3,
      latencyHint: "interactive",
      lookAhead: 0.1
    });
  }
  return audioEngineInstance;
}
const trackManager = new TrackManager(getAudioEngine());
const tracks = trackManager.tracks;
const trackOrder = trackManager.trackOrder;
const selectedTrackId = trackManager.selectedTrackId;
trackManager.selectedClipIds;
const orderedTracks = derived(
  [tracks, trackOrder],
  ([$tracks, $trackOrder]) => {
    return $trackOrder.map((id) => $tracks.get(id)).filter(Boolean);
  }
);
const selectedTrack = derived(
  [tracks, selectedTrackId],
  ([$tracks, $selectedTrackId]) => {
    if (!$selectedTrackId) return null;
    return $tracks.get($selectedTrackId) || null;
  }
);
derived(
  selectedTrackId,
  ($selectedTrackId) => $selectedTrackId !== null
);
const trackCount = derived(
  tracks,
  ($tracks) => $tracks.size
);
TrackRow[FILENAME] = "src/lib/tracks/components/TrackRow.svelte";
function TrackRow($$renderer, $$props) {
  $$renderer.component(
    ($$renderer2) => {
      var $$store_subs;
      let { track } = $$props;
      track.name;
      let showMenu = false;
      const isSelected = store_get($$store_subs ??= {}, "$selectedTrackId", selectedTrackId) === track.id;
      const typeIcons = {
        audio: "audio",
        midi: "midi",
        aux: "volume",
        folder: "folder"
      };
      function toggleMute() {
        trackManager.updateTrackSettings(track.id, { mute: !track.settings.mute });
      }
      function toggleSolo() {
        trackManager.updateTrackSettings(track.id, { solo: !track.settings.solo });
      }
      function toggleRecordArm() {
        trackManager.updateTrackSettings(track.id, { recordArm: !track.settings.recordArm });
      }
      let $$settled = true;
      let $$inner_renderer;
      function $$render_inner($$renderer3) {
        $$renderer3.push(`<div${attr_class(`track-row glass rounded-control p-3 mb-2 cursor-pointer transition-all ${stringify(isSelected ? "ring-2 ring-accent-primary selected" : "")}`, "svelte-10yu844")} role="button" tabindex="0">`);
        push_element($$renderer3, "div", 75, 0);
        $$renderer3.push(`<div class="track-content flex items-center gap-3">`);
        push_element($$renderer3, "div", 82, 2);
        $$renderer3.push(`<div class="track-color w-1 h-12 rounded-full flex-shrink-0"${attr_style(`background-color: ${stringify(track.color)};`)}>`);
        push_element($$renderer3, "div", 84, 4);
        $$renderer3.push(`</div>`);
        pop_element();
        $$renderer3.push(` `);
        Icon($$renderer3, { name: typeIcons[track.type], size: "md" });
        $$renderer3.push(`<!----> <div class="track-name flex-1 min-w-0">`);
        push_element($$renderer3, "div", 93, 4);
        {
          $$renderer3.push("<!--[!-->");
          Label($$renderer3, {
            size: "sm",
            weight: "semibold",
            class: "block truncate",
            children: prevent_snippet_stringification(($$renderer4) => {
              $$renderer4.push(`<!---->${escape_html(track.name)}`);
            })
          });
          $$renderer3.push(`<!----> `);
          Label($$renderer3, {
            size: "xs",
            color: "var(--color-text-secondary)",
            class: "block truncate",
            children: prevent_snippet_stringification(($$renderer4) => {
              $$renderer4.push(`<!---->${escape_html(track.type === "folder" ? `${track.clips?.length || 0} tracks` : `${track.clips?.length || 0} clips`)}`);
            })
          });
          $$renderer3.push(`<!---->`);
        }
        $$renderer3.push(`<!--]--></div>`);
        pop_element();
        $$renderer3.push(` <div class="track-controls flex gap-1">`);
        push_element($$renderer3, "div", 117, 4);
        if (track.type !== "folder") {
          $$renderer3.push("<!--[-->");
          Button($$renderer3, {
            variant: track.settings.recordArm ? "danger" : "ghost",
            size: "xs",
            onclick: (e) => {
              e.stopPropagation();
              toggleRecordArm();
            },
            children: prevent_snippet_stringification(($$renderer4) => {
              Icon($$renderer4, { name: "record", size: "xs" });
            })
          });
        } else {
          $$renderer3.push("<!--[!-->");
        }
        $$renderer3.push(`<!--]--> `);
        Button($$renderer3, {
          variant: track.settings.mute ? "danger" : "ghost",
          size: "xs",
          onclick: (e) => {
            e.stopPropagation();
            toggleMute();
          },
          children: prevent_snippet_stringification(($$renderer4) => {
            $$renderer4.push(`<!---->M`);
          })
        });
        $$renderer3.push(`<!----> `);
        Button($$renderer3, {
          variant: track.settings.solo ? "primary" : "ghost",
          size: "xs",
          onclick: (e) => {
            e.stopPropagation();
            toggleSolo();
          },
          children: prevent_snippet_stringification(($$renderer4) => {
            $$renderer4.push(`<!---->S`);
          })
        });
        $$renderer3.push(`<!----> <div class="relative">`);
        push_element($$renderer3, "div", 157, 6);
        Button($$renderer3, {
          variant: "ghost",
          size: "xs",
          onclick: (e) => {
            e.stopPropagation();
            showMenu = !showMenu;
          },
          children: prevent_snippet_stringification(($$renderer4) => {
            Icon($$renderer4, { name: "settings", size: "xs" });
          })
        });
        $$renderer3.push(`<!----> `);
        if (showMenu) {
          $$renderer3.push("<!--[-->");
          $$renderer3.push(`<div class="track-menu glass-purple rounded-control p-2 absolute right-0 mt-1 z-10 min-w-32 svelte-10yu844">`);
          push_element($$renderer3, "div", 170, 10);
          $$renderer3.push(`<button class="menu-item svelte-10yu844">`);
          push_element($$renderer3, "button", 171, 12);
          $$renderer3.push(`<span>`);
          push_element($$renderer3, "span", 172, 14);
          $$renderer3.push(`Duplicate</span>`);
          pop_element();
          $$renderer3.push(`</button>`);
          pop_element();
          $$renderer3.push(` <button class="menu-item text-danger svelte-10yu844">`);
          push_element($$renderer3, "button", 174, 12);
          $$renderer3.push(`<span>`);
          push_element($$renderer3, "span", 175, 14);
          $$renderer3.push(`Delete</span>`);
          pop_element();
          $$renderer3.push(`</button>`);
          pop_element();
          $$renderer3.push(`</div>`);
          pop_element();
        } else {
          $$renderer3.push("<!--[!-->");
        }
        $$renderer3.push(`<!--]--></div>`);
        pop_element();
        $$renderer3.push(`</div>`);
        pop_element();
        $$renderer3.push(`</div>`);
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
      if ($$store_subs) unsubscribe_stores($$store_subs);
    },
    TrackRow
  );
}
TrackRow.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
TrackList[FILENAME] = "src/lib/tracks/components/TrackList.svelte";
function TrackList($$renderer, $$props) {
  $$renderer.component(
    ($$renderer2) => {
      var $$store_subs;
      let showAddMenu = false;
      $$renderer2.push(`<div class="track-list glass-strong rounded-panel svelte-1w40grs">`);
      push_element($$renderer2, "div", 42, 0);
      $$renderer2.push(`<div class="track-list-header glass rounded-control p-4 mb-2 flex items-center justify-between">`);
      push_element($$renderer2, "div", 44, 2);
      Label($$renderer2, {
        size: "lg",
        weight: "bold",
        children: prevent_snippet_stringification(($$renderer3) => {
          $$renderer3.push(`<!---->Tracks (${escape_html(store_get($$store_subs ??= {}, "$orderedTracks", orderedTracks).length)})`);
        })
      });
      $$renderer2.push(`<!----> <div class="relative">`);
      push_element($$renderer2, "div", 47, 4);
      Button($$renderer2, {
        variant: "primary",
        size: "sm",
        onclick: () => showAddMenu = !showAddMenu,
        children: prevent_snippet_stringification(($$renderer3) => {
          Icon($$renderer3, { name: "plus", size: "sm" });
          $$renderer3.push(`<!----> <span class="ml-2">`);
          push_element($$renderer3, "span", 54, 8);
          $$renderer3.push(`Add Track</span>`);
          pop_element();
        })
      });
      $$renderer2.push(`<!----> `);
      if (showAddMenu) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="add-menu glass-purple rounded-control p-2 absolute right-0 mt-2 z-10 min-w-48 svelte-1w40grs">`);
        push_element($$renderer2, "div", 58, 8);
        $$renderer2.push(`<button class="menu-item svelte-1w40grs">`);
        push_element($$renderer2, "button", 59, 10);
        Icon($$renderer2, { name: "audio", size: "sm" });
        $$renderer2.push(`<!----> <span>`);
        push_element($$renderer2, "span", 64, 12);
        $$renderer2.push(`Audio Track</span>`);
        pop_element();
        $$renderer2.push(`</button>`);
        pop_element();
        $$renderer2.push(` <button class="menu-item svelte-1w40grs">`);
        push_element($$renderer2, "button", 66, 10);
        Icon($$renderer2, { name: "midi", size: "sm" });
        $$renderer2.push(`<!----> <span>`);
        push_element($$renderer2, "span", 71, 12);
        $$renderer2.push(`MIDI Track</span>`);
        pop_element();
        $$renderer2.push(`</button>`);
        pop_element();
        $$renderer2.push(` <button class="menu-item svelte-1w40grs">`);
        push_element($$renderer2, "button", 73, 10);
        Icon($$renderer2, { name: "volume", size: "sm" });
        $$renderer2.push(`<!----> <span>`);
        push_element($$renderer2, "span", 78, 12);
        $$renderer2.push(`Aux Track</span>`);
        pop_element();
        $$renderer2.push(`</button>`);
        pop_element();
        $$renderer2.push(` <button class="menu-item svelte-1w40grs">`);
        push_element($$renderer2, "button", 80, 10);
        Icon($$renderer2, { name: "folder", size: "sm" });
        $$renderer2.push(`<!----> <span>`);
        push_element($$renderer2, "span", 85, 12);
        $$renderer2.push(`Folder</span>`);
        pop_element();
        $$renderer2.push(`</button>`);
        pop_element();
        $$renderer2.push(`</div>`);
        pop_element();
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div>`);
      pop_element();
      $$renderer2.push(`</div>`);
      pop_element();
      $$renderer2.push(` <div class="tracks-container svelte-1w40grs">`);
      push_element($$renderer2, "div", 93, 2);
      if (store_get($$store_subs ??= {}, "$orderedTracks", orderedTracks).length === 0) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="empty-state glass rounded-control p-12 text-center svelte-1w40grs">`);
        push_element($$renderer2, "div", 95, 6);
        Icon($$renderer2, { name: "waveform", size: "xl", class: "mb-4 opacity-30" });
        $$renderer2.push(`<!----> `);
        Label($$renderer2, {
          size: "lg",
          color: "var(--color-text-secondary)",
          class: "block mb-2",
          children: prevent_snippet_stringification(($$renderer3) => {
            $$renderer3.push(`<!---->No tracks yet`);
          })
        });
        $$renderer2.push(`<!----> `);
        Label($$renderer2, {
          size: "sm",
          color: "var(--color-text-tertiary)",
          children: prevent_snippet_stringification(($$renderer3) => {
            $$renderer3.push(`<!---->Click "Add Track" to get started`);
          })
        });
        $$renderer2.push(`<!----></div>`);
        pop_element();
      } else {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`<!--[-->`);
        const each_array = ensure_array_like(store_get($$store_subs ??= {}, "$orderedTracks", orderedTracks));
        for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
          let track = each_array[$$index];
          $$renderer2.push(`<div draggable="true">`);
          push_element($$renderer2, "div", 106, 8);
          TrackRow($$renderer2, { track });
          $$renderer2.push(`<!----></div>`);
          pop_element();
        }
        $$renderer2.push(`<!--]-->`);
      }
      $$renderer2.push(`<!--]--></div>`);
      pop_element();
      $$renderer2.push(`</div>`);
      pop_element();
      if ($$store_subs) unsubscribe_stores($$store_subs);
    },
    TrackList
  );
}
TrackList.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
_page[FILENAME] = "src/routes/tracks/+page.svelte";
function _page($$renderer, $$props) {
  $$renderer.component(
    ($$renderer2) => {
      var $$store_subs;
      let isDark = true;
      function handleThemeToggle() {
        theme.toggle();
        isDark = !isDark;
      }
      function handleClearAll() {
        if (confirm("Delete all tracks?")) {
          store_get($$store_subs ??= {}, "$orderedTracks", orderedTracks).forEach((track) => {
            trackManager.deleteTrack(track.id);
          });
        }
      }
      head($$renderer2, ($$renderer3) => {
        $$renderer3.title(($$renderer4) => {
          $$renderer4.push(`<title>Track Manager - DAWG AI</title>`);
        });
      });
      $$renderer2.push(`<div class="min-h-screen p-8">`);
      push_element($$renderer2, "div", 61, 0);
      $$renderer2.push(`<div class="glass-purple rounded-panel p-6 mb-8 flex items-center justify-between">`);
      push_element($$renderer2, "div", 63, 2);
      $$renderer2.push(`<div>`);
      push_element($$renderer2, "div", 64, 4);
      $$renderer2.push(`<h1 class="text-4xl font-bold mb-2 bg-gradient-to-r from-accent-primary to-accent-secondary bg-clip-text text-transparent">`);
      push_element($$renderer2, "h1", 65, 6);
      $$renderer2.push(`Module 3: Track Manager</h1>`);
      pop_element();
      $$renderer2.push(` <p class="text-white/70">`);
      push_element($$renderer2, "p", 68, 6);
      $$renderer2.push(`Track creation, organization, and management</p>`);
      pop_element();
      $$renderer2.push(`</div>`);
      pop_element();
      $$renderer2.push(` <div class="flex gap-3">`);
      push_element($$renderer2, "div", 71, 4);
      Button($$renderer2, {
        variant: "secondary",
        size: "md",
        onclick: handleClearAll,
        children: prevent_snippet_stringification(($$renderer3) => {
          Icon($$renderer3, { name: "trash", size: "sm" });
          $$renderer3.push(`<!----> <span class="ml-2">`);
          push_element($$renderer3, "span", 74, 8);
          $$renderer3.push(`Clear All</span>`);
          pop_element();
        })
      });
      $$renderer2.push(`<!----> `);
      Button($$renderer2, {
        variant: "secondary",
        size: "md",
        onclick: handleThemeToggle,
        children: prevent_snippet_stringification(($$renderer3) => {
          Icon($$renderer3, { name: isDark ? "sun" : "moon", size: "sm" });
          $$renderer3.push(`<!----> <span class="ml-2">`);
          push_element($$renderer3, "span", 79, 8);
          $$renderer3.push(`${escape_html(isDark ? "Light" : "Dark")}</span>`);
          pop_element();
        })
      });
      $$renderer2.push(`<!----></div>`);
      pop_element();
      $$renderer2.push(`</div>`);
      pop_element();
      $$renderer2.push(` <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">`);
      push_element($$renderer2, "div", 84, 2);
      $$renderer2.push(`<div class="lg:col-span-2">`);
      push_element($$renderer2, "div", 86, 4);
      TrackList($$renderer2);
      $$renderer2.push(`<!----></div>`);
      pop_element();
      $$renderer2.push(` <div class="glass-strong rounded-panel p-6">`);
      push_element($$renderer2, "div", 91, 4);
      Label($$renderer2, {
        size: "lg",
        weight: "bold",
        class: "mb-4 block",
        children: prevent_snippet_stringification(($$renderer3) => {
          $$renderer3.push(`<!---->Track Inspector`);
        })
      });
      $$renderer2.push(`<!----> `);
      if (store_get($$store_subs ??= {}, "$selectedTrack", selectedTrack)) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="space-y-6">`);
        push_element($$renderer2, "div", 95, 8);
        $$renderer2.push(`<div>`);
        push_element($$renderer2, "div", 97, 10);
        Label($$renderer2, {
          size: "sm",
          weight: "semibold",
          class: "mb-2 block",
          children: prevent_snippet_stringification(($$renderer3) => {
            $$renderer3.push(`<!---->Track Info`);
          })
        });
        $$renderer2.push(`<!----> <div class="glass rounded-control p-3 space-y-2">`);
        push_element($$renderer2, "div", 99, 12);
        $$renderer2.push(`<div class="flex justify-between items-center">`);
        push_element($$renderer2, "div", 100, 14);
        Label($$renderer2, {
          size: "xs",
          color: "var(--color-text-secondary)",
          children: prevent_snippet_stringification(($$renderer3) => {
            $$renderer3.push(`<!---->Name:`);
          })
        });
        $$renderer2.push(`<!----> `);
        Label($$renderer2, {
          size: "sm",
          weight: "medium",
          children: prevent_snippet_stringification(($$renderer3) => {
            $$renderer3.push(`<!---->${escape_html(store_get($$store_subs ??= {}, "$selectedTrack", selectedTrack).name)}`);
          })
        });
        $$renderer2.push(`<!----></div>`);
        pop_element();
        $$renderer2.push(` <div class="flex justify-between items-center">`);
        push_element($$renderer2, "div", 104, 14);
        Label($$renderer2, {
          size: "xs",
          color: "var(--color-text-secondary)",
          children: prevent_snippet_stringification(($$renderer3) => {
            $$renderer3.push(`<!---->Type:`);
          })
        });
        $$renderer2.push(`<!----> `);
        Label($$renderer2, {
          size: "sm",
          weight: "medium",
          class: "capitalize",
          children: prevent_snippet_stringification(($$renderer3) => {
            $$renderer3.push(`<!---->${escape_html(store_get($$store_subs ??= {}, "$selectedTrack", selectedTrack).type)}`);
          })
        });
        $$renderer2.push(`<!----></div>`);
        pop_element();
        $$renderer2.push(` <div class="flex justify-between items-center">`);
        push_element($$renderer2, "div", 108, 14);
        Label($$renderer2, {
          size: "xs",
          color: "var(--color-text-secondary)",
          children: prevent_snippet_stringification(($$renderer3) => {
            $$renderer3.push(`<!---->Clips:`);
          })
        });
        $$renderer2.push(`<!----> `);
        Label($$renderer2, {
          size: "sm",
          weight: "medium",
          children: prevent_snippet_stringification(($$renderer3) => {
            $$renderer3.push(`<!---->${escape_html(store_get($$store_subs ??= {}, "$selectedTrack", selectedTrack).clips?.length || 0)}`);
          })
        });
        $$renderer2.push(`<!----></div>`);
        pop_element();
        $$renderer2.push(`</div>`);
        pop_element();
        $$renderer2.push(`</div>`);
        pop_element();
        $$renderer2.push(` <div>`);
        push_element($$renderer2, "div", 116, 10);
        Label($$renderer2, {
          size: "sm",
          weight: "semibold",
          class: "mb-2 block",
          children: prevent_snippet_stringification(($$renderer3) => {
            $$renderer3.push(`<!---->Track Color`);
          })
        });
        $$renderer2.push(`<!----> <div class="flex gap-2">`);
        push_element($$renderer2, "div", 118, 12);
        $$renderer2.push(`<!--[-->`);
        const each_array = ensure_array_like([
          "#ff006e",
          "#00d9ff",
          "#00ff88",
          "#a855f7",
          "#ffaa00",
          "#ff3366",
          "#c084fc",
          "#ffd700"
        ]);
        for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
          let color = each_array[$$index];
          $$renderer2.push(`<button${attr_class(`w-8 h-8 rounded-control transition-transform hover:scale-110 ${stringify(store_get($$store_subs ??= {}, "$selectedTrack", selectedTrack).color === color ? "ring-2 ring-white" : "")}`)}${attr_style(`background-color: ${stringify(color)};`)}${attr("aria-label", `Set color to ${stringify(color)}`)}>`);
          push_element($$renderer2, "button", 120, 16);
          $$renderer2.push(`</button>`);
          pop_element();
        }
        $$renderer2.push(`<!--]--></div>`);
        pop_element();
        $$renderer2.push(`</div>`);
        pop_element();
        $$renderer2.push(` <div>`);
        push_element($$renderer2, "div", 131, 10);
        Label($$renderer2, {
          size: "sm",
          weight: "semibold",
          class: "mb-3 block",
          children: prevent_snippet_stringification(($$renderer3) => {
            $$renderer3.push(`<!---->Track Settings`);
          })
        });
        $$renderer2.push(`<!----> <div class="space-y-4">`);
        push_element($$renderer2, "div", 133, 12);
        $$renderer2.push(`<div class="flex items-center justify-between">`);
        push_element($$renderer2, "div", 134, 14);
        Label($$renderer2, {
          size: "sm",
          children: prevent_snippet_stringification(($$renderer3) => {
            $$renderer3.push(`<!---->Volume`);
          })
        });
        $$renderer2.push(`<!----> `);
        Label($$renderer2, {
          size: "xs",
          mono: true,
          class: "text-accent-primary",
          children: prevent_snippet_stringification(($$renderer3) => {
            $$renderer3.push(`<!---->${escape_html(store_get($$store_subs ??= {}, "$selectedTrack", selectedTrack).settings.volume.toFixed(1))} dB`);
          })
        });
        $$renderer2.push(`<!----></div>`);
        pop_element();
        $$renderer2.push(` <div class="flex items-center justify-between">`);
        push_element($$renderer2, "div", 141, 14);
        Label($$renderer2, {
          size: "sm",
          children: prevent_snippet_stringification(($$renderer3) => {
            $$renderer3.push(`<!---->Pan`);
          })
        });
        $$renderer2.push(`<!----> `);
        Label($$renderer2, {
          size: "xs",
          mono: true,
          class: "text-accent-primary",
          children: prevent_snippet_stringification(($$renderer3) => {
            $$renderer3.push(`<!---->${escape_html((store_get($$store_subs ??= {}, "$selectedTrack", selectedTrack).settings.pan * 100).toFixed(0))}%`);
          })
        });
        $$renderer2.push(`<!----></div>`);
        pop_element();
        $$renderer2.push(` <div class="flex items-center justify-between">`);
        push_element($$renderer2, "div", 148, 14);
        Label($$renderer2, {
          size: "sm",
          children: prevent_snippet_stringification(($$renderer3) => {
            $$renderer3.push(`<!---->Mute`);
          })
        });
        $$renderer2.push(`<!----> `);
        Toggle($$renderer2, {
          checked: store_get($$store_subs ??= {}, "$selectedTrack", selectedTrack).settings.mute,
          size: "sm",
          onchange: (checked) => trackManager.updateTrackSettings(store_get($$store_subs ??= {}, "$selectedTrack", selectedTrack).id, { mute: checked })
        });
        $$renderer2.push(`<!----></div>`);
        pop_element();
        $$renderer2.push(` <div class="flex items-center justify-between">`);
        push_element($$renderer2, "div", 157, 14);
        Label($$renderer2, {
          size: "sm",
          children: prevent_snippet_stringification(($$renderer3) => {
            $$renderer3.push(`<!---->Solo`);
          })
        });
        $$renderer2.push(`<!----> `);
        Toggle($$renderer2, {
          checked: store_get($$store_subs ??= {}, "$selectedTrack", selectedTrack).settings.solo,
          size: "sm",
          onchange: (checked) => trackManager.updateTrackSettings(store_get($$store_subs ??= {}, "$selectedTrack", selectedTrack).id, { solo: checked })
        });
        $$renderer2.push(`<!----></div>`);
        pop_element();
        $$renderer2.push(` <div class="flex items-center justify-between">`);
        push_element($$renderer2, "div", 166, 14);
        Label($$renderer2, {
          size: "sm",
          children: prevent_snippet_stringification(($$renderer3) => {
            $$renderer3.push(`<!---->Record Arm`);
          })
        });
        $$renderer2.push(`<!----> `);
        Toggle($$renderer2, {
          checked: store_get($$store_subs ??= {}, "$selectedTrack", selectedTrack).settings.recordArm,
          size: "sm",
          onchange: (checked) => trackManager.updateTrackSettings(store_get($$store_subs ??= {}, "$selectedTrack", selectedTrack).id, { recordArm: checked })
        });
        $$renderer2.push(`<!----></div>`);
        pop_element();
        $$renderer2.push(`</div>`);
        pop_element();
        $$renderer2.push(`</div>`);
        pop_element();
        $$renderer2.push(` <div>`);
        push_element($$renderer2, "div", 178, 10);
        Label($$renderer2, {
          size: "sm",
          weight: "semibold",
          class: "mb-2 block",
          children: prevent_snippet_stringification(($$renderer3) => {
            $$renderer3.push(`<!---->Track Height`);
          })
        });
        $$renderer2.push(`<!----> <div class="flex gap-2">`);
        push_element($$renderer2, "div", 180, 12);
        $$renderer2.push(`<!--[-->`);
        const each_array_1 = ensure_array_like(["collapsed", "small", "medium", "large"]);
        for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
          let height = each_array_1[$$index_1];
          Button($$renderer2, {
            variant: store_get($$store_subs ??= {}, "$selectedTrack", selectedTrack).height === height ? "primary" : "secondary",
            size: "xs",
            onclick: () => trackManager.setTrackHeight(store_get($$store_subs ??= {}, "$selectedTrack", selectedTrack).id, height),
            children: prevent_snippet_stringification(($$renderer3) => {
              $$renderer3.push(`<!---->${escape_html(height.charAt(0).toUpperCase())}`);
            })
          });
        }
        $$renderer2.push(`<!--]--></div>`);
        pop_element();
        $$renderer2.push(`</div>`);
        pop_element();
        $$renderer2.push(`</div>`);
        pop_element();
      } else {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`<div class="glass rounded-control p-8 text-center">`);
        push_element($$renderer2, "div", 194, 8);
        Icon($$renderer2, { name: "waveform", size: "xl", class: "mb-3 opacity-30" });
        $$renderer2.push(`<!----> `);
        Label($$renderer2, {
          size: "sm",
          color: "var(--color-text-secondary)",
          children: prevent_snippet_stringification(($$renderer3) => {
            $$renderer3.push(`<!---->No track selected`);
          })
        });
        $$renderer2.push(`<!----></div>`);
        pop_element();
      }
      $$renderer2.push(`<!--]--></div>`);
      pop_element();
      $$renderer2.push(`</div>`);
      pop_element();
      $$renderer2.push(` <div class="glass rounded-control p-4 mt-8 flex items-center justify-between">`);
      push_element($$renderer2, "div", 205, 2);
      Label($$renderer2, {
        size: "sm",
        color: "var(--color-text-secondary)",
        children: prevent_snippet_stringification(($$renderer3) => {
          $$renderer3.push(`<!---->Module 3: Track Manager • ${escape_html(store_get($$store_subs ??= {}, "$trackCount", trackCount))} tracks`);
        })
      });
      $$renderer2.push(`<!----> `);
      Label($$renderer2, {
        size: "xs",
        color: "var(--color-text-tertiary)",
        children: prevent_snippet_stringification(($$renderer3) => {
          $$renderer3.push(`<!---->Drag tracks to reorder • Double-click to rename`);
        })
      });
      $$renderer2.push(`<!----></div>`);
      pop_element();
      $$renderer2.push(`</div>`);
      pop_element();
      if ($$store_subs) unsubscribe_stores($$store_subs);
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
