/**
 * Beat Search & Discovery
 * Interfaces with Supabase to find beats by style, mood, tempo
 */

import { supabase } from '$lib/api/supabase';
import { mapInputToStyle, BEAT_STYLES, type BeatStyle } from './styles';

import { logger } from '$lib/utils/logger';
export interface BeatSearchParams {
	query?: string; // Free-text search
	style?: string; // Specific style key
	mood?: string; // Mood filter
	tempoMin?: number;
	tempoMax?: number;
	limit?: number;
}

export interface BeatSearchResult {
	id: string;
	title: string;
	style: string;
	mood: string[];
	tempo: number;
	previewUrl: string;
	playCount: number;
	drums?: string;
	melody?: string;
	texture?: string;
}

export class BeatSearch {
	/**
	 * Search beats by criteria
	 * Returns 3 candidates for auditioning
	 */
	async search(params: BeatSearchParams): Promise<BeatSearchResult[]> {
		const limit = params.limit || 3;

		// If query provided, map it to a style
		const style = params.query ? mapInputToStyle(params.query) : params.style;

		// Get tempo range from style if not specified
		const styleData = style ? BEAT_STYLES[style] : null;
		const tempoMin = params.tempoMin || styleData?.tags.tempo[0] || 60;
		const tempoMax = params.tempoMax || styleData?.tags.tempo[1] || 200;

		try {
			// Call Supabase RPC function
			const { data, error } = await supabase.rpc('search_beats', {
				p_style: style || null,
				p_tempo_min: tempoMin,
				p_tempo_max: tempoMax,
				p_mood: params.mood || null,
				p_limit: limit
			});

			if (error) {
				logger.error('Beat search error:', error);
				return this.getFallbackBeats(style, limit);
			}

			if (!data || data.length === 0) {
				return this.getFallbackBeats(style, limit);
			}

			return data.map((beat: any) => ({
				id: beat.id,
				title: beat.title,
				style: beat.style,
				mood: beat.mood || [],
				tempo: beat.tempo,
				previewUrl: beat.preview_url,
				playCount: beat.play_count || 0
			}));
		} catch (err) {
			logger.error('Beat search exception:', err);
			return this.getFallbackBeats(style, limit);
		}
	}

	/**
	 * Get beats by specific style
	 */
	async getByStyle(styleKey: string, limit: number = 3): Promise<BeatSearchResult[]> {
		return this.search({ style: styleKey, limit });
	}

	/**
	 * Get beats by tempo range
	 */
	async getByTempo(min: number, max: number, limit: number = 3): Promise<BeatSearchResult[]> {
		return this.search({ tempoMin: min, tempoMax: max, limit });
	}

	/**
	 * Get beats by mood
	 */
	async getByMood(mood: string, limit: number = 3): Promise<BeatSearchResult[]> {
		return this.search({ mood, limit });
	}

	/**
	 * Increment play count when user previews a beat
	 */
	async incrementPlayCount(beatId: string): Promise<void> {
		try {
			await supabase.rpc('increment_beat_play_count', { p_beat_id: beatId });
		} catch (err) {
			logger.error('Failed to increment play count:', err);
		}
	}

	/**
	 * Increment use count when user adds beat to project
	 */
	async incrementUseCount(beatId: string): Promise<void> {
		try {
			await supabase.rpc('increment_beat_use_count', { p_beat_id: beatId });
		} catch (err) {
			logger.error('Failed to increment use count:', err);
		}
	}

	/**
	 * Get trending beats (most played)
	 */
	async getTrending(limit: number = 10): Promise<BeatSearchResult[]> {
		try {
			const { data, error } = await supabase
				.from('beats')
				.select('id, title, style, mood, tempo, preview_url, play_count')
				.order('play_count', { ascending: false })
				.limit(limit);

			if (error || !data) {
				return [];
			}

			return data.map((beat: any) => ({
				id: beat.id,
				title: beat.title,
				style: beat.style,
				mood: beat.mood || [],
				tempo: beat.tempo,
				previewUrl: beat.preview_url,
				playCount: beat.play_count || 0
			}));
		} catch (err) {
			return [];
		}
	}

	/**
	 * Fallback beats when database unavailable
	 * Returns mock data based on style
	 */
	private getFallbackBeats(styleKey: string | undefined, limit: number): BeatSearchResult[] {
		const fallbackData: Record<string, BeatSearchResult[]> = {
			'toronto-ambient-trap': [
				{
					id: 'fallback-1',
					title: 'Toronto Vibes 1',
					style: 'toronto-ambient-trap',
					mood: ['moody', 'dark', 'atmospheric'],
					tempo: 140,
					previewUrl: '/beats/fallback/toronto-1.wav',
					playCount: 0
				},
				{
					id: 'fallback-2',
					title: 'Toronto Vibes 2',
					style: 'toronto-ambient-trap',
					mood: ['moody', 'dark', 'atmospheric'],
					tempo: 138,
					previewUrl: '/beats/fallback/toronto-2.wav',
					playCount: 0
				},
				{
					id: 'fallback-3',
					title: 'Toronto Vibes 3',
					style: 'toronto-ambient-trap',
					mood: ['moody', 'dark', 'atmospheric'],
					tempo: 142,
					previewUrl: '/beats/fallback/toronto-3.wav',
					playCount: 0
				}
			],
			'drill-aggressive': [
				{
					id: 'fallback-4',
					title: 'Drill Heat 1',
					style: 'drill-aggressive',
					mood: ['aggressive', 'dark'],
					tempo: 145,
					previewUrl: '/beats/fallback/drill-1.wav',
					playCount: 0
				},
				{
					id: 'fallback-5',
					title: 'Drill Heat 2',
					style: 'drill-aggressive',
					mood: ['aggressive', 'dark'],
					tempo: 148,
					previewUrl: '/beats/fallback/drill-2.wav',
					playCount: 0
				},
				{
					id: 'fallback-6',
					title: 'Drill Heat 3',
					style: 'drill-aggressive',
					mood: ['aggressive', 'dark'],
					tempo: 150,
					previewUrl: '/beats/fallback/drill-3.wav',
					playCount: 0
				}
			]
		};

		const styleBeats = styleKey ? fallbackData[styleKey] : null;
		if (styleBeats) {
			return styleBeats.slice(0, limit);
		}

		// Default fallback
		return fallbackData['toronto-ambient-trap'].slice(0, limit);
	}
}

/**
 * Singleton instance
 */
export const beatSearch = new BeatSearch();
