"""
Lyric Generation Utility
Uses Claude or GPT-4 to generate lyrics matching melody structure
"""

import os
from typing import List, Dict, Optional
from anthropic import Anthropic
from openai import OpenAI
import logging

logger = logging.getLogger(__name__)


class LyricGenerator:
    """
    Generate lyrics that match a melody structure using AI
    """

    def __init__(self, provider: str = "anthropic"):
        """
        Initialize lyric generator

        Args:
            provider: 'anthropic' or 'openai'
        """
        self.provider = provider.lower()

        if self.provider == "anthropic":
            api_key = os.getenv("ANTHROPIC_API_KEY")
            if not api_key:
                raise ValueError("ANTHROPIC_API_KEY not found in environment")
            self.client = Anthropic(api_key=api_key)
            self.model = "claude-3-5-sonnet-20241022"
        elif self.provider == "openai":
            api_key = os.getenv("OPENAI_API_KEY")
            if not api_key:
                raise ValueError("OPENAI_API_KEY not found in environment")
            self.client = OpenAI(api_key=api_key)
            self.model = "gpt-4"
        else:
            raise ValueError(f"Unknown provider: {provider}")

        logger.info(f"Initialized LyricGenerator with provider={provider}")

    def generate_lyrics(
        self,
        melody_notes: List[Dict],
        prompt: str,
        genre: str = "pop",
        theme: Optional[str] = None,
        mood: Optional[str] = None,
        style: Optional[str] = None
    ) -> Dict:
        """
        Generate lyrics matching the melody structure

        Args:
            melody_notes: List of note dictionaries from pitch extraction
            prompt: User's creative prompt/idea
            genre: Music genre
            theme: Theme/topic of the song
            mood: Desired mood/emotion
            style: Reference artist style

        Returns:
            Dictionary with lyrics and metadata
        """
        # Calculate syllable requirements from melody
        num_notes = len(melody_notes)
        total_duration = sum(n['duration'] for n in melody_notes)
        avg_note_duration = total_duration / num_notes if num_notes > 0 else 0

        # Estimate syllables needed (rough heuristic: ~2-4 syllables per second of melody)
        estimated_syllables = int(total_duration * 3)

        # Group notes into phrases (notes separated by > 0.3s are phrase breaks)
        phrases = []
        current_phrase = []
        for i, note in enumerate(melody_notes):
            current_phrase.append(note)
            if i < len(melody_notes) - 1:
                gap = melody_notes[i+1]['start_time'] - note['end_time']
                if gap > 0.3:  # Phrase break
                    phrases.append(current_phrase)
                    current_phrase = []

        if current_phrase:
            phrases.append(current_phrase)

        num_phrases = len(phrases)
        syllables_per_phrase = [len(phrase) for phrase in phrases]

        # Build the prompt
        system_prompt = f"""You are an expert songwriter and lyricist. Your task is to write lyrics that match a specific melody structure.

Key Requirements:
1. Match the syllable count as closely as possible to the melody structure
2. Create natural, flowing lyrics that sound good when sung
3. Stay true to the genre, theme, and mood requested
4. Use simple, singable words (avoid complex consonant clusters)
5. Consider the melody's rhythm when choosing words

Output Format:
Return ONLY the lyrics, with each line on a new line. No explanations, no metadata, just the lyrics."""

        user_prompt = f"""Write lyrics for a {genre} song with the following specifications:

MELODY STRUCTURE:
- Total duration: {total_duration:.1f} seconds
- Number of melodic phrases: {num_phrases}
- Estimated total syllables: {estimated_syllables}
- Syllables per phrase: {', '.join(map(str, syllables_per_phrase))}

CREATIVE DIRECTION:
- Main idea/prompt: {prompt}
{f'- Theme: {theme}' if theme else ''}
{f'- Mood: {mood}' if mood else ''}
{f'- Style reference: {style}' if style else ''}

Generate lyrics that match the melody structure. Each phrase should have approximately the syllable count specified. Make the lyrics catchy, memorable, and appropriate for the genre.

LYRICS:"""

        try:
            if self.provider == "anthropic":
                response = self.client.messages.create(
                    model=self.model,
                    max_tokens=1024,
                    temperature=0.8,
                    system=system_prompt,
                    messages=[
                        {"role": "user", "content": user_prompt}
                    ]
                )
                lyrics_text = response.content[0].text.strip()

            else:  # openai
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    max_tokens=1024,
                    temperature=0.8
                )
                lyrics_text = response.choices[0].message.content.strip()

            # Split into lines
            lyrics_lines = [line.strip() for line in lyrics_text.split('\n') if line.strip()]

            # Count syllables (rough approximation)
            def count_syllables(text):
                # Very rough syllable counter - counts vowel groups
                vowels = 'aeiouy'
                text = text.lower()
                count = 0
                prev_was_vowel = False
                for char in text:
                    is_vowel = char in vowels
                    if is_vowel and not prev_was_vowel:
                        count += 1
                    prev_was_vowel = is_vowel
                return max(1, count)  # Minimum 1 syllable

            total_syllables = sum(count_syllables(line) for line in lyrics_lines)

            logger.info(f"Generated lyrics with {len(lyrics_lines)} lines, ~{total_syllables} syllables")

            return {
                'lyrics': lyrics_text,
                'lines': lyrics_lines,
                'num_lines': len(lyrics_lines),
                'estimated_syllables': total_syllables,
                'target_syllables': estimated_syllables,
                'metadata': {
                    'genre': genre,
                    'theme': theme,
                    'mood': mood,
                    'style': style,
                    'melody_duration': total_duration,
                    'num_phrases': num_phrases
                }
            }

        except Exception as e:
            logger.error(f"Error generating lyrics: {str(e)}")
            raise


def generate_lyrics_from_melody(
    melody_notes: List[Dict],
    prompt: str,
    genre: str = "pop",
    provider: str = "anthropic",
    **kwargs
) -> Dict:
    """
    Convenience function to generate lyrics

    Args:
        melody_notes: List of note dictionaries
        prompt: User's creative prompt
        genre: Music genre
        provider: 'anthropic' or 'openai'
        **kwargs: Additional parameters (theme, mood, style)

    Returns:
        Dictionary with lyrics and metadata
    """
    generator = LyricGenerator(provider=provider)
    return generator.generate_lyrics(
        melody_notes,
        prompt,
        genre,
        theme=kwargs.get('theme'),
        mood=kwargs.get('mood'),
        style=kwargs.get('style')
    )


if __name__ == "__main__":
    # Test lyric generation with mock melody
    mock_melody = [
        {'start_time': 0.0, 'end_time': 0.5, 'duration': 0.5, 'midi_note': 60, 'note_name': 'C4'},
        {'start_time': 0.5, 'end_time': 1.0, 'duration': 0.5, 'midi_note': 62, 'note_name': 'D4'},
        {'start_time': 1.0, 'end_time': 1.5, 'duration': 0.5, 'midi_note': 64, 'note_name': 'E4'},
        {'start_time': 1.5, 'end_time': 2.0, 'duration': 0.5, 'midi_note': 65, 'note_name': 'F4'},
        {'start_time': 2.5, 'end_time': 3.0, 'duration': 0.5, 'midi_note': 67, 'note_name': 'G4'},
        {'start_time': 3.0, 'end_time': 3.5, 'duration': 0.5, 'midi_note': 69, 'note_name': 'A4'},
        {'start_time': 3.5, 'end_time': 4.0, 'duration': 0.5, 'midi_note': 67, 'note_name': 'G4'},
        {'start_time': 4.0, 'end_time': 4.5, 'duration': 0.5, 'midi_note': 65, 'note_name': 'F4'},
    ]

    result = generate_lyrics_from_melody(
        mock_melody,
        prompt="A love song about summer nights",
        genre="pop",
        mood="nostalgic",
        provider="anthropic"
    )

    print("\n=== GENERATED LYRICS ===")
    print(result['lyrics'])
    print(f"\n{result['num_lines']} lines, ~{result['estimated_syllables']} syllables")
    print(f"Target was ~{result['target_syllables']} syllables")
