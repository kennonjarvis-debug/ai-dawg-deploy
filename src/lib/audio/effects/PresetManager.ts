/**
 * PresetManager - DAWG AI Audio Engine
 * Manages effect presets for quick recall
 * @module audio/effects/PresetManager
 */

import type { Effect, EffectConfig } from './Effect';
import type { UUID, EffectType } from '../../types/core';

import { logger } from '$lib/utils/logger';
/**
 * Preset definition
 */
export interface EffectPreset {
	id: UUID;
	name: string;
	effectType: EffectType;
	description?: string;
	category?: string;
	parameters: Record<string, number>;
	tags?: string[];
	author?: string;
	createdAt: number;
}

/**
 * Preset category
 */
export type PresetCategory =
	| 'vocal'
	| 'instrument'
	| 'drum'
	| 'master'
	| 'creative'
	| 'corrective'
	| 'utility';

/**
 * PresetManager - Manages effect presets
 */
export class PresetManager {
	private presets: Map<UUID, EffectPreset>;
	private presetsByType: Map<EffectType, EffectPreset[]>;

	constructor() {
		this.presets = new Map();
		this.presetsByType = new Map();
		this.loadFactoryPresets();
	}

	/**
	 * Add a preset
	 * @param preset - Preset to add
	 */
	addPreset(preset: EffectPreset): void {
		this.presets.set(preset.id, preset);

		// Update by-type index
		if (!this.presetsByType.has(preset.effectType)) {
			this.presetsByType.set(preset.effectType, []);
		}
		this.presetsByType.get(preset.effectType)!.push(preset);
	}

	/**
	 * Get preset by ID
	 * @param id - Preset ID
	 */
	getPreset(id: UUID): EffectPreset | undefined {
		return this.presets.get(id);
	}

	/**
	 * Get all presets for an effect type
	 * @param effectType - Effect type
	 */
	getPresetsForType(effectType: EffectType): EffectPreset[] {
		return this.presetsByType.get(effectType) || [];
	}

	/**
	 * Get all presets
	 */
	getAllPresets(): EffectPreset[] {
		return Array.from(this.presets.values());
	}

	/**
	 * Get presets by category
	 * @param category - Preset category
	 */
	getPresetsByCategory(category: PresetCategory): EffectPreset[] {
		return this.getAllPresets().filter(p => p.category === category);
	}

	/**
	 * Search presets
	 * @param query - Search query
	 */
	searchPresets(query: string): EffectPreset[] {
		const lowerQuery = query.toLowerCase();
		return this.getAllPresets().filter(preset =>
			preset.name.toLowerCase().includes(lowerQuery) ||
			preset.description?.toLowerCase().includes(lowerQuery) ||
			preset.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
		);
	}

	/**
	 * Apply preset to effect
	 * @param preset - Preset to apply
	 * @param effect - Effect instance
	 */
	applyPreset(preset: EffectPreset, effect: Effect): void {
		if (effect.type !== preset.effectType) {
			throw new Error(`Preset type ${preset.effectType} does not match effect type ${effect.type}`);
		}

		// Apply parameters
		Object.entries(preset.parameters).forEach(([name, value]) => {
			try {
				effect.setParameter(name, value);
			} catch (error) {
				logger.warn(`Failed to set parameter ${name}:`, error);
			}
		});
	}

	/**
	 * Save effect state as preset
	 * @param effect - Effect instance
	 * @param name - Preset name
	 * @param description - Optional description
	 */
	savePreset(effect: Effect, name: string, description?: string): EffectPreset {
		const parameters: Record<string, number> = {};

		effect.parameters.forEach((param, paramName) => {
			parameters[paramName] = param.value;
		});

		const preset: EffectPreset = {
			id: this.generateId(),
			name,
			effectType: effect.type,
			description,
			parameters,
			createdAt: Date.now()
		};

		this.addPreset(preset);
		return preset;
	}

	/**
	 * Delete preset
	 * @param id - Preset ID
	 */
	deletePreset(id: UUID): void {
		const preset = this.presets.get(id);
		if (!preset) return;

		this.presets.delete(id);

		// Remove from by-type index
		const typePresets = this.presetsByType.get(preset.effectType);
		if (typePresets) {
			const index = typePresets.findIndex(p => p.id === id);
			if (index !== -1) {
				typePresets.splice(index, 1);
			}
		}
	}

	/**
	 * Export presets to JSON
	 */
	exportPresets(): string {
		return JSON.stringify(this.getAllPresets(), null, 2);
	}

	/**
	 * Import presets from JSON
	 * @param json - JSON string
	 */
	importPresets(json: string): void {
		try {
			const presets: EffectPreset[] = JSON.parse(json);
			presets.forEach(preset => this.addPreset(preset));
		} catch (error) {
			throw new Error(`Failed to import presets: ${error}`);
		}
	}

	/**
	 * Load factory presets
	 */
	private loadFactoryPresets(): void {
		// EQ presets
		this.addPreset({
			id: 'eq-vocal-presence',
			name: 'Vocal Presence',
			effectType: 'eq',
			category: 'vocal',
			description: 'Enhance vocal clarity and presence',
			parameters: {
				lowGain: -2,
				midGain: 3,
				highGain: 2,
				lowFrequency: 300,
				highFrequency: 3000
			},
			tags: ['vocal', 'presence', 'clarity'],
			createdAt: Date.now()
		});

		this.addPreset({
			id: 'eq-bass-boost',
			name: 'Bass Boost',
			effectType: 'eq',
			category: 'instrument',
			description: 'Add weight to bass instruments',
			parameters: {
				lowGain: 6,
				midGain: -2,
				highGain: 0,
				lowFrequency: 200,
				highFrequency: 2500
			},
			tags: ['bass', 'low-end', 'weight'],
			createdAt: Date.now()
		});

		// Compressor presets
		this.addPreset({
			id: 'comp-vocal-leveling',
			name: 'Vocal Leveling',
			effectType: 'compressor',
			category: 'vocal',
			description: 'Even out vocal dynamics',
			parameters: {
				threshold: -18,
				ratio: 3,
				attack: 0.005,
				release: 0.1,
				knee: 6
			},
			tags: ['vocal', 'leveling', 'dynamics'],
			createdAt: Date.now()
		});

		this.addPreset({
			id: 'comp-drum-punch',
			name: 'Drum Punch',
			effectType: 'compressor',
			category: 'drum',
			description: 'Add punch to drums',
			parameters: {
				threshold: -12,
				ratio: 4,
				attack: 0.001,
				release: 0.05,
				knee: 2
			},
			tags: ['drums', 'punch', 'impact'],
			createdAt: Date.now()
		});

		// Reverb presets
		this.addPreset({
			id: 'reverb-vocal-plate',
			name: 'Vocal Plate',
			effectType: 'reverb',
			category: 'vocal',
			description: 'Classic plate reverb for vocals',
			parameters: {
				decay: 2.0,
				preDelay: 0.02,
				wet: 0.25
			},
			tags: ['vocal', 'plate', 'smooth'],
			createdAt: Date.now()
		});

		this.addPreset({
			id: 'reverb-large-hall',
			name: 'Large Hall',
			effectType: 'reverb',
			category: 'creative',
			description: 'Spacious hall reverb',
			parameters: {
				decay: 4.5,
				preDelay: 0.04,
				wet: 0.35
			},
			tags: ['hall', 'spacious', 'large'],
			createdAt: Date.now()
		});

		// Delay presets
		this.addPreset({
			id: 'delay-slapback',
			name: 'Slapback',
			effectType: 'delay',
			category: 'vocal',
			description: 'Short slapback delay',
			parameters: {
				delayTime: 0.12,
				feedback: 0.1,
				wet: 0.3
			},
			tags: ['slapback', 'vintage', 'short'],
			createdAt: Date.now()
		});

		// Distortion presets
		this.addPreset({
			id: 'dist-subtle-warmth',
			name: 'Subtle Warmth',
			effectType: 'distortion',
			category: 'utility',
			description: 'Gentle saturation for warmth',
			parameters: {
				drive: 0.2,
				tone: 0.6,
				output: 0,
				mix: 0.3
			},
			tags: ['warmth', 'subtle', 'saturation'],
			createdAt: Date.now()
		});

		// Filter presets
		this.addPreset({
			id: 'filter-low-cut',
			name: 'Low Cut',
			effectType: 'filter',
			category: 'corrective',
			description: 'Remove low-frequency rumble',
			parameters: {
				frequency: 80,
				resonance: 0.7,
				rolloff: -24,
				gain: 0,
				mix: 1
			},
			tags: ['highpass', 'cleaning', 'rumble'],
			createdAt: Date.now()
		});
	}

	/**
	 * Generate unique ID
	 */
	private generateId(): UUID {
		return `preset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	}
}

/**
 * Global preset manager instance
 */
let globalPresetManager: PresetManager | null = null;

/**
 * Get global preset manager
 */
export function getPresetManager(): PresetManager {
	if (!globalPresetManager) {
		globalPresetManager = new PresetManager();
	}
	return globalPresetManager;
}
