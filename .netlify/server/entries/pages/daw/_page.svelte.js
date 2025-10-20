import { h as head, s as store_get, u as unsubscribe_stores } from "../../../chunks/index2.js";
import { o as onDestroy } from "../../../chunks/index-server.js";
import "../../../chunks/client.js";
import { d as derived, w as writable, g as get } from "../../../chunks/index.js";
import { A as AudioEngine } from "../../../chunks/AudioEngine.js";
import { s as supabase } from "../../../chunks/authStore.js";
import { l as logger } from "../../../chunks/logger.js";
import { E as EventBus } from "../../../chunks/eventBus.js";
import "../../../chunks/Timeline.svelte_svelte_type_style_lang.js";
import "../../../chunks/InspectorPanel.svelte_svelte_type_style_lang.js";
import "tone";
import "../../../chunks/index-client.js";
import { Z as escape_html, W as FILENAME } from "../../../chunks/context.js";
import { p as push_element, a as pop_element } from "../../../chunks/dev.js";
class ProjectAPI {
  supabase;
  constructor() {
    this.supabase = supabase;
  }
  ensureSupabase() {
    if (!this.supabase) {
      throw new Error("Supabase not configured - project features unavailable in test mode");
    }
    return this.supabase;
  }
  /**
   * Save a new project
   */
  async saveProject(name, data) {
    const { data: project, error } = await this.supabase.from("projects").insert({
      name,
      data
    }).select().single();
    if (error) {
      throw new Error(`Failed to save project: ${error.message}`);
    }
    return project;
  }
  /**
   * Load a project by ID
   */
  async loadProject(id) {
    const { data: project, error } = await this.supabase.from("projects").select("*").eq("id", id).single();
    if (error) {
      throw new Error(`Failed to load project: ${error.message}`);
    }
    return project;
  }
  /**
   * List all projects for current user
   */
  async listProjects() {
    const { data: projects, error } = await this.supabase.from("projects").select("*").order("updated_at", { ascending: false });
    if (error) {
      throw new Error(`Failed to list projects: ${error.message}`);
    }
    return projects || [];
  }
  /**
   * Update an existing project
   */
  async updateProject(id, name, data) {
    const { data: project, error } = await this.supabase.from("projects").update({
      name,
      data,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", id).select().single();
    if (error) {
      throw new Error(`Failed to update project: ${error.message}`);
    }
    return project;
  }
  /**
   * Delete a project
   */
  async deleteProject(id) {
    const { error } = await this.supabase.from("projects").delete().eq("id", id);
    if (error) {
      throw new Error(`Failed to delete project: ${error.message}`);
    }
  }
  /**
   * Share a project (generate share token)
   */
  async shareProject(id) {
    const { data: project, error: fetchError } = await this.supabase.from("projects").select("share_token, id").eq("id", id).single();
    if (fetchError) {
      throw new Error(`Failed to fetch project: ${fetchError.message}`);
    }
    if (project.share_token) {
      return project.share_token;
    }
    const shareToken = this.generateShareToken();
    const { error: updateError } = await this.supabase.from("projects").update({
      share_token: shareToken,
      is_public: true
    }).eq("id", id);
    if (updateError) {
      throw new Error(`Failed to share project: ${updateError.message}`);
    }
    return shareToken;
  }
  /**
   * Get a shared project by token (no auth required)
   */
  async getSharedProject(token) {
    const { data: project, error } = await this.supabase.from("projects").select("*").eq("share_token", token).eq("is_public", true).single();
    if (error) {
      throw new Error(`Failed to load shared project: ${error.message}`);
    }
    return project;
  }
  /**
   * Upload a file (audio sample, etc.)
   */
  async uploadFile(file, projectId) {
    const timestamp = Date.now();
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const { data: { user } } = await this.ensureSupabase().auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }
    const fileName = `${user.id}/${timestamp}-${sanitizedFilename}`;
    const { data: uploadData, error: uploadError } = await this.ensureSupabase().storage.from("audio-files").upload(fileName, file, {
      cacheControl: "3600",
      upsert: false
    });
    if (uploadError) {
      throw new Error(`Failed to upload file: ${uploadError.message}`);
    }
    const { error: metadataError } = await this.supabase.from("files").insert({
      user_id: user.id,
      project_id: projectId || null,
      filename: file.name,
      storage_path: fileName,
      size_bytes: file.size,
      mime_type: file.type
    });
    if (metadataError) {
      logger.error("Failed to save file metadata:", metadataError);
    }
    const { data: urlData } = this.ensureSupabase().storage.from("audio-files").getPublicUrl(fileName);
    return urlData.publicUrl;
  }
  /**
   * Get project versions (for undo/redo)
   */
  async getProjectVersions(projectId) {
    const { data: versions, error } = await this.supabase.from("project_versions").select("*").eq("project_id", projectId).order("version_number", { ascending: false }).limit(50);
    if (error) {
      throw new Error(`Failed to fetch versions: ${error.message}`);
    }
    return versions || [];
  }
  /**
   * Create a project version snapshot
   */
  async createProjectVersion(projectId, data) {
    const { error } = await this.ensureSupabase().rpc("create_project_version", {
      p_project_id: projectId,
      p_data: data
    });
    if (error) {
      throw new Error(`Failed to create version: ${error.message}`);
    }
  }
  /**
   * Duplicate a project
   */
  async duplicateProject(id) {
    const original = await this.loadProject(id);
    const duplicate = await this.saveProject(
      `${original.name} (copy)`,
      original.data
    );
    return duplicate;
  }
  /**
   * Generate a random share token
   */
  generateShareToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  /**
   * Get Supabase client instance (for direct use if needed)
   */
  getSupabase() {
    return this.supabase;
  }
}
const projectAPI = new ProjectAPI();
const initialState = {
  audioEngine: null,
  isPlaying: false,
  isRecording: false,
  currentTime: 0,
  tempo: 120,
  timeSignature: [4, 4],
  currentProject: null,
  projectId: null,
  projectName: "Untitled Project",
  hasUnsavedChanges: false,
  isSaving: false,
  lastSaved: null,
  currentView: "arrangement",
  selectedTrackId: null,
  isInitialized: false,
  error: null
};
function createAppStore() {
  const { subscribe, set, update } = writable(initialState);
  let autoSaveInterval = null;
  async function initializeAudioEngine() {
    try {
      const engine = AudioEngine.getInstance({
        sampleRate: 48e3,
        latencyHint: "interactive",
        lookAhead: 0.1
      });
      await engine.initialize();
      if (true) {
        try {
          await engine.context.resume();
          logger.info("✅ Audio engine auto-initialized for testing");
        } catch (err) {
          logger.warn("Auto-resume failed (may still need user interaction):", err);
        }
      }
      update((state) => ({
        ...state,
        audioEngine: engine,
        isInitialized: true,
        tempo: engine.getTempo()
      }));
      setupEventListeners(engine);
      startAutoSave();
      return engine;
    } catch (error) {
      logger.error("Failed to initialize audio engine:", error);
      update((state) => ({
        ...state,
        error: error instanceof Error ? error.message : "Failed to initialize audio"
      }));
      throw error;
    }
  }
  function setupEventListeners(engine) {
    const eventBus = EventBus.getInstance();
    eventBus.on("playback:play", () => {
      update((state) => ({ ...state, isPlaying: true }));
    });
    eventBus.on("playback:stop", () => {
      update((state) => ({ ...state, isPlaying: false }));
    });
    eventBus.on("playback:pause", () => {
      update((state) => ({ ...state, isPlaying: false }));
    });
    eventBus.on("track:created", () => markUnsaved());
    eventBus.on("track:deleted", () => markUnsaved());
    eventBus.on("track:updated", () => markUnsaved());
  }
  function play() {
    const state = get({ subscribe });
    if (state.audioEngine) {
      state.audioEngine.play();
      update((s) => ({ ...s, isPlaying: true }));
    }
  }
  function stop() {
    const state = get({ subscribe });
    if (state.audioEngine) {
      state.audioEngine.stop();
      update((s) => ({ ...s, isPlaying: false }));
    }
  }
  function pause() {
    const state = get({ subscribe });
    if (state.audioEngine) {
      state.audioEngine.pause();
      update((s) => ({ ...s, isPlaying: false }));
    }
  }
  function setTempo(bpm) {
    const state = get({ subscribe });
    if (state.audioEngine) {
      state.audioEngine.setTempo(bpm);
      update((s) => ({ ...s, tempo: bpm, hasUnsavedChanges: true }));
    }
  }
  async function newProject(name) {
    const projectName2 = name || "Untitled Project";
    update((state2) => ({
      ...state2,
      currentProject: null,
      projectId: null,
      projectName: projectName2,
      hasUnsavedChanges: false,
      lastSaved: null
    }));
    const state = get({ subscribe });
    if (state.audioEngine) {
      const tracks = state.audioEngine.getAllTracks();
      tracks.forEach((track) => state.audioEngine.removeTrack(track.id));
    }
    return { success: true };
  }
  async function saveProject() {
    update((state) => ({ ...state, isSaving: true, error: null }));
    try {
      const state = get({ subscribe });
      if (!state.audioEngine) {
        throw new Error("Audio engine not initialized");
      }
      const projectData = serializeProject(state.audioEngine);
      let project;
      if (state.projectId) {
        project = await projectAPI.updateProject(
          state.projectId,
          state.projectName,
          projectData
        );
      } else {
        project = await projectAPI.saveProject(state.projectName, projectData);
      }
      update((state2) => ({
        ...state2,
        currentProject: project,
        projectId: project.id,
        hasUnsavedChanges: false,
        isSaving: false,
        lastSaved: /* @__PURE__ */ new Date()
      }));
      EventBus.getInstance().emit("project:saved", { projectId: project.id });
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save project";
      update((state) => ({
        ...state,
        isSaving: false,
        error: message
      }));
      return { success: false, error: message };
    }
  }
  async function loadProject(projectId) {
    try {
      const project = await projectAPI.loadProject(projectId);
      update((state2) => ({
        ...state2,
        currentProject: project,
        projectId: project.id,
        projectName: project.name,
        hasUnsavedChanges: false,
        lastSaved: new Date(project.updated_at)
      }));
      const state = get({ subscribe });
      if (state.audioEngine && project.data) {
        await deserializeProject(state.audioEngine, project.data);
        if (project.data.tempo) {
          setTempo(project.data.tempo);
        }
      }
      EventBus.getInstance().emit("project:loaded", { projectId: project.id });
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load project";
      update((state) => ({ ...state, error: message }));
      return { success: false, error: message };
    }
  }
  function serializeProject(engine) {
    const tracks = engine.getAllTracks();
    return {
      tracks: tracks.map((track) => ({
        id: track.id,
        name: track.name,
        type: track.type,
        color: track.color,
        order: 0,
        settings: {
          volume: track.getVolume(),
          pan: track.getPan(),
          mute: track.isMuted(),
          solo: track.isSoloed(),
          recordArm: false,
          monitor: false,
          frozen: false,
          input: "default",
          output: "master"
        }
      })),
      tempo: engine.getTempo(),
      timeSignature: [4, 4],
      effects: [],
      clips: []
    };
  }
  async function deserializeProject(engine, data) {
    const existingTracks = engine.getAllTracks();
    existingTracks.forEach((track) => engine.removeTrack(track.id));
    if (data.tracks) {
      for (const trackData of data.tracks) {
        const track = engine.addTrack({
          id: trackData.id,
          name: trackData.name,
          type: trackData.type,
          color: trackData.color
        });
        if (trackData.settings) {
          track.setVolume(trackData.settings.volume);
          track.setPan(trackData.settings.pan);
          track.setMute(trackData.settings.mute);
          track.setSolo(trackData.settings.solo);
        }
      }
    }
  }
  function markUnsaved() {
    update((state) => ({ ...state, hasUnsavedChanges: true }));
  }
  function setProjectName(name) {
    update((state) => ({
      ...state,
      projectName: name,
      hasUnsavedChanges: true
    }));
  }
  function startAutoSave() {
    if (autoSaveInterval) return;
    autoSaveInterval = window.setInterval(async () => {
      const state = get({ subscribe });
      if (state.hasUnsavedChanges && state.projectId) {
        logger.info("Auto-saving project...");
        await saveProject();
      }
    }, 3e4);
  }
  function stopAutoSave() {
    if (autoSaveInterval) {
      clearInterval(autoSaveInterval);
      autoSaveInterval = null;
    }
  }
  function setView(view) {
    update((state) => ({ ...state, currentView: view }));
  }
  function selectTrack(trackId) {
    update((state) => ({ ...state, selectedTrackId: trackId }));
    EventBus.getInstance().emit("track:selected", { trackId });
  }
  function clearError() {
    update((state) => ({ ...state, error: null }));
  }
  function cleanup() {
    stopAutoSave();
    const state = get({ subscribe });
    if (state.audioEngine) {
      state.audioEngine.dispose();
    }
  }
  return {
    subscribe,
    // Initialization
    initializeAudioEngine,
    // Transport
    play,
    stop,
    pause,
    setTempo,
    // Project
    newProject,
    saveProject,
    loadProject,
    setProjectName,
    // UI
    setView,
    selectTrack,
    clearError,
    // Cleanup
    cleanup
  };
}
const appStore = createAppStore();
derived(appStore, ($app) => $app.audioEngine);
derived(appStore, ($app) => $app.isPlaying);
derived(appStore, ($app) => $app.currentProject);
const hasUnsavedChanges = derived(appStore, ($app) => $app.hasUnsavedChanges);
const projectName = derived(appStore, ($app) => $app.projectName);
_page[FILENAME] = "src/routes/daw/+page.svelte";
function _page($$renderer, $$props) {
  $$renderer.component(
    ($$renderer2) => {
      var $$store_subs;
      onDestroy(() => {
        if (typeof window !== "undefined") {
          window.removeEventListener("beforeunload", handleBeforeUnload);
        }
      });
      function handleBeforeUnload(e) {
        if (store_get($$store_subs ??= {}, "$hasUnsavedChanges", hasUnsavedChanges)) {
          e.preventDefault();
          e.returnValue = "";
        }
      }
      let $$settled = true;
      let $$inner_renderer;
      function $$render_inner($$renderer3) {
        head($$renderer3, ($$renderer4) => {
          $$renderer4.title(($$renderer5) => {
            $$renderer5.push(`<title>${escape_html(store_get($$store_subs ??= {}, "$projectName", projectName))} - DAWG AI</title>`);
          });
        });
        {
          $$renderer3.push("<!--[!-->");
          {
            $$renderer3.push("<!--[-->");
            $$renderer3.push(`<div class="flex items-center justify-center min-h-screen">`);
            push_element($$renderer3, "div", 303, 1);
            $$renderer3.push(`<div class="text-center">`);
            push_element($$renderer3, "div", 304, 2);
            $$renderer3.push(`<div class="spinner mb-4 svelte-18lm2wj">`);
            push_element($$renderer3, "div", 305, 3);
            $$renderer3.push(`</div>`);
            pop_element();
            $$renderer3.push(` <p class="text-white/70">`);
            push_element($$renderer3, "p", 306, 3);
            $$renderer3.push(`Initializing audio engine...</p>`);
            pop_element();
            $$renderer3.push(`</div>`);
            pop_element();
            $$renderer3.push(`</div>`);
            pop_element();
          }
          $$renderer3.push(`<!--]-->`);
        }
        $$renderer3.push(`<!--]--> `);
        {
          $$renderer3.push("<!--[!-->");
        }
        $$renderer3.push(`<!--]-->`);
      }
      do {
        $$settled = true;
        $$inner_renderer = $$renderer2.copy();
        $$render_inner($$inner_renderer);
      } while (!$$settled);
      $$renderer2.subsume($$inner_renderer);
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
