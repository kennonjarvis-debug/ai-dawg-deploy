/**
 * Audio Storage - IndexedDB persistence for recordings
 * Saves and loads audio buffers and project data
 */

const DB_NAME = 'ai-dawg-audio';
const DB_VERSION = 1;
const RECORDINGS_STORE = 'recordings';
const PROJECTS_STORE = 'projects';

export interface StoredRecording {
  id: string;
  name: string;
  projectId: string;
  trackId: string;
  clipId: string;
  audioData: ArrayBuffer;
  sampleRate: number;
  duration: number;
  channels: number;
  waveformData: number[];
  createdAt: number;
}

export interface StoredProject {
  id: string;
  name: string;
  bpm: number;
  timeSignature: { numerator: number; denominator: number };
  tracks: any[];
  createdAt: number;
  updatedAt: number;
}

class AudioStorage {
  private db: IDBDatabase | null = null;

  /**
   * Initialize IndexedDB
   */
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('[AudioStorage] Failed to open database');
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('[AudioStorage] Database opened successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create recordings store
        if (!db.objectStoreNames.contains(RECORDINGS_STORE)) {
          const recordingsStore = db.createObjectStore(RECORDINGS_STORE, { keyPath: 'id' });
          recordingsStore.createIndex('projectId', 'projectId', { unique: false });
          recordingsStore.createIndex('trackId', 'trackId', { unique: false });
          recordingsStore.createIndex('clipId', 'clipId', { unique: true });
          console.log('[AudioStorage] Created recordings store');
        }

        // Create projects store
        if (!db.objectStoreNames.contains(PROJECTS_STORE)) {
          const projectsStore = db.createObjectStore(PROJECTS_STORE, { keyPath: 'id' });
          projectsStore.createIndex('updatedAt', 'updatedAt', { unique: false });
          console.log('[AudioStorage] Created projects store');
        }
      };
    });
  }

  /**
   * Save audio buffer to IndexedDB
   */
  async saveRecording(
    clipId: string,
    buffer: AudioBuffer,
    waveformData: Float32Array,
    projectId: string,
    trackId: string,
    name: string
  ): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Convert audio buffer to raw array buffer
    const channelData = buffer.getChannelData(0);
    const audioData = channelData.buffer;

    const recording: StoredRecording = {
      id: `recording-${Date.now()}`,
      name,
      projectId,
      trackId,
      clipId,
      audioData,
      sampleRate: buffer.sampleRate,
      duration: buffer.duration,
      channels: buffer.numberOfChannels,
      waveformData: Array.from(waveformData),
      createdAt: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([RECORDINGS_STORE], 'readwrite');
      const store = transaction.objectStore(RECORDINGS_STORE);
      const request = store.put(recording);

      request.onsuccess = () => {
        console.log('[AudioStorage] Saved recording:', clipId);
        resolve();
      };

      request.onerror = () => {
        console.error('[AudioStorage] Failed to save recording:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Load audio buffer from IndexedDB
   */
  async loadRecording(clipId: string, audioContext: AudioContext): Promise<{
    buffer: AudioBuffer;
    waveformData: Float32Array;
  } | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([RECORDINGS_STORE], 'readonly');
      const store = transaction.objectStore(RECORDINGS_STORE);
      const index = store.index('clipId');
      const request = index.get(clipId);

      request.onsuccess = () => {
        const recording: StoredRecording | undefined = request.result;

        if (!recording) {
          resolve(null);
          return;
        }

        // Reconstruct audio buffer
        const buffer = audioContext.createBuffer(
          recording.channels,
          recording.audioData.byteLength / 4, // Float32 = 4 bytes
          recording.sampleRate
        );

        const channelData = new Float32Array(recording.audioData);
        buffer.copyToChannel(channelData, 0);

        console.log('[AudioStorage] Loaded recording:', clipId);

        resolve({
          buffer,
          waveformData: new Float32Array(recording.waveformData),
        });
      };

      request.onerror = () => {
        console.error('[AudioStorage] Failed to load recording:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Delete recording
   */
  async deleteRecording(clipId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([RECORDINGS_STORE], 'readwrite');
      const store = transaction.objectStore(RECORDINGS_STORE);
      const index = store.index('clipId');
      const request = index.openCursor(IDBKeyRange.only(clipId));

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          cursor.delete();
          console.log('[AudioStorage] Deleted recording:', clipId);
        }
        resolve();
      };

      request.onerror = () => {
        console.error('[AudioStorage] Failed to delete recording:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get all recordings for a project
   */
  async getProjectRecordings(projectId: string): Promise<StoredRecording[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([RECORDINGS_STORE], 'readonly');
      const store = transaction.objectStore(RECORDINGS_STORE);
      const index = store.index('projectId');
      const request = index.getAll(projectId);

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Save project to IndexedDB
   */
  async saveProject(project: StoredProject): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([PROJECTS_STORE], 'readwrite');
      const store = transaction.objectStore(PROJECTS_STORE);
      const request = store.put({
        ...project,
        updatedAt: Date.now(),
      });

      request.onsuccess = () => {
        console.log('[AudioStorage] Saved project:', project.id);
        resolve();
      };

      request.onerror = () => {
        console.error('[AudioStorage] Failed to save project:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Load project from IndexedDB
   */
  async loadProject(projectId: string): Promise<StoredProject | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([PROJECTS_STORE], 'readonly');
      const store = transaction.objectStore(PROJECTS_STORE);
      const request = store.get(projectId);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Get all projects
   */
  async getAllProjects(): Promise<StoredProject[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([PROJECTS_STORE], 'readonly');
      const store = transaction.objectStore(PROJECTS_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        const projects = request.result || [];
        // Sort by most recently updated
        projects.sort((a, b) => b.updatedAt - a.updatedAt);
        resolve(projects);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Delete project and all its recordings
   */
  async deleteProject(projectId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Delete all recordings for this project
    const recordings = await this.getProjectRecordings(projectId);
    await Promise.all(recordings.map(r => this.deleteRecording(r.clipId)));

    // Delete project
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([PROJECTS_STORE], 'readwrite');
      const store = transaction.objectStore(PROJECTS_STORE);
      const request = store.delete(projectId);

      request.onsuccess = () => {
        console.log('[AudioStorage] Deleted project:', projectId);
        resolve();
      };

      request.onerror = () => {
        console.error('[AudioStorage] Failed to delete project:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats(): Promise<{
    recordings: number;
    projects: number;
    totalSize: number;
  }> {
    if (!this.db) throw new Error('Database not initialized');

    const recordings = await new Promise<StoredRecording[]>((resolve, reject) => {
      const transaction = this.db!.transaction([RECORDINGS_STORE], 'readonly');
      const store = transaction.objectStore(RECORDINGS_STORE);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });

    const projects = await this.getAllProjects();

    const totalSize = recordings.reduce((sum, r) => sum + r.audioData.byteLength, 0);

    return {
      recordings: recordings.length,
      projects: projects.length,
      totalSize,
    };
  }
}

// Singleton instance
let audioStorageInstance: AudioStorage | null = null;

export const getAudioStorage = (): AudioStorage => {
  if (!audioStorageInstance) {
    audioStorageInstance = new AudioStorage();
  }
  return audioStorageInstance;
};

export const initializeAudioStorage = async (): Promise<AudioStorage> => {
  const storage = getAudioStorage();
  await storage.initialize();
  return storage;
};
