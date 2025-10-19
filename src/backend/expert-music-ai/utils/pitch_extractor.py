"""
Pitch Extraction Utility
Uses CREPE (Convolutional Representation for Pitch Estimation) to extract melody from audio
"""

import torch
import torchcrepe
import librosa
import numpy as np
from typing import Tuple, List, Dict
import logging

logger = logging.getLogger(__name__)

class PitchExtractor:
    """
    Extract pitch/melody contour from audio using CREPE
    """

    def __init__(self, model: str = 'full', device: str = None):
        """
        Initialize pitch extractor

        Args:
            model: CREPE model size ('tiny', 'small', 'medium', 'large', 'full')
            device: Device to run on ('cuda', 'mps', 'cpu')
        """
        if device is None:
            if torch.cuda.is_available():
                device = 'cuda'
            elif torch.backends.mps.is_available():
                device = 'mps'
            else:
                device = 'cpu'

        self.device = device
        self.model = model
        logger.info(f"Initialized PitchExtractor with model={model}, device={device}")

    def extract_pitch(
        self,
        audio_path: str,
        fmin: float = 80.0,
        fmax: float = 880.0,
        sample_rate: int = 16000
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        Extract pitch contour from audio file

        Args:
            audio_path: Path to audio file
            fmin: Minimum frequency in Hz (default: 80 Hz ~ E2)
            fmax: Maximum frequency in Hz (default: 880 Hz ~ A5)
            sample_rate: Target sample rate for CREPE

        Returns:
            Tuple of (time, frequency, confidence)
            - time: Time stamps in seconds
            - frequency: Pitch values in Hz
            - confidence: Confidence scores (0-1)
        """
        logger.info(f"Extracting pitch from {audio_path}")

        # Load audio
        audio, sr = librosa.load(audio_path, sr=sample_rate, mono=True)

        # Convert to torch tensor
        audio_tensor = torch.tensor(audio).unsqueeze(0).to(self.device)

        # Run CREPE
        # hop_length determines time resolution (10ms default)
        hop_length = 160  # ~10ms at 16kHz

        frequency, confidence = torchcrepe.predict(
            audio_tensor,
            sample_rate,
            hop_length,
            fmin,
            fmax,
            model=self.model,
            device=self.device,
            batch_size=2048
        )

        # Convert to numpy
        frequency = frequency.squeeze().cpu().numpy()
        confidence = confidence.squeeze().cpu().numpy()

        # Create time array
        time = np.arange(len(frequency)) * hop_length / sample_rate

        logger.info(f"Extracted {len(frequency)} pitch points")
        logger.info(f"Pitch range: {np.min(frequency[frequency > 0]):.1f} - {np.max(frequency):.1f} Hz")
        logger.info(f"Mean confidence: {np.mean(confidence):.3f}")

        return time, frequency, confidence

    def get_melody_notes(
        self,
        time: np.ndarray,
        frequency: np.ndarray,
        confidence: np.ndarray,
        confidence_threshold: float = 0.5,
        min_note_duration: float = 0.1
    ) -> List[Dict]:
        """
        Convert pitch contour to discrete notes

        Args:
            time: Time stamps
            frequency: Pitch values in Hz
            confidence: Confidence scores
            confidence_threshold: Minimum confidence to consider (default: 0.5)
            min_note_duration: Minimum note duration in seconds

        Returns:
            List of notes with {start_time, end_time, frequency, midi_note}
        """
        # Filter by confidence
        valid_mask = confidence > confidence_threshold
        valid_times = time[valid_mask]
        valid_freqs = frequency[valid_mask]

        if len(valid_freqs) == 0:
            logger.warning("No valid pitches found")
            return []

        # Convert Hz to MIDI note numbers
        midi_notes = librosa.hz_to_midi(valid_freqs)

        # Round to nearest semitone
        midi_notes = np.round(midi_notes).astype(int)

        # Group consecutive same notes
        notes = []
        current_note = midi_notes[0]
        start_time = valid_times[0]

        for i in range(1, len(midi_notes)):
            if midi_notes[i] != current_note or (valid_times[i] - valid_times[i-1]) > 0.2:
                # Note changed or gap detected
                end_time = valid_times[i-1]
                duration = end_time - start_time

                if duration >= min_note_duration:
                    notes.append({
                        'start_time': float(start_time),
                        'end_time': float(end_time),
                        'duration': float(duration),
                        'midi_note': int(current_note),
                        'frequency': float(librosa.midi_to_hz(current_note)),
                        'note_name': librosa.midi_to_note(current_note)
                    })

                current_note = midi_notes[i]
                start_time = valid_times[i]

        # Add last note
        end_time = valid_times[-1]
        duration = end_time - start_time
        if duration >= min_note_duration:
            notes.append({
                'start_time': float(start_time),
                'end_time': float(end_time),
                'duration': float(duration),
                'midi_note': int(current_note),
                'frequency': float(librosa.midi_to_hz(current_note)),
                'note_name': librosa.midi_to_note(current_note)
            })

        logger.info(f"Extracted {len(notes)} discrete notes")
        return notes

    def get_melody_summary(self, notes: List[Dict]) -> Dict:
        """
        Get summary statistics about the melody

        Args:
            notes: List of note dictionaries

        Returns:
            Dictionary with melody statistics
        """
        if not notes:
            return {
                'num_notes': 0,
                'total_duration': 0,
                'avg_note_duration': 0,
                'pitch_range': 0,
                'key_estimate': 'Unknown'
            }

        midi_notes = [n['midi_note'] for n in notes]
        durations = [n['duration'] for n in notes]

        # Estimate key (most common pitch class)
        pitch_classes = np.array(midi_notes) % 12
        pitch_class_counts = np.bincount(pitch_classes, minlength=12)
        key_pitch_class = np.argmax(pitch_class_counts)
        key_names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
        key_estimate = key_names[key_pitch_class]

        return {
            'num_notes': len(notes),
            'total_duration': float(sum(durations)),
            'avg_note_duration': float(np.mean(durations)),
            'pitch_range': int(max(midi_notes) - min(midi_notes)),
            'lowest_note': librosa.midi_to_note(min(midi_notes)),
            'highest_note': librosa.midi_to_note(max(midi_notes)),
            'key_estimate': key_estimate,
            'note_names': [n['note_name'] for n in notes[:10]]  # First 10 notes
        }


def extract_melody_from_file(audio_path: str, model: str = 'full') -> Dict:
    """
    Convenience function to extract melody from audio file

    Args:
        audio_path: Path to audio file
        model: CREPE model size

    Returns:
        Dictionary with melody data and summary
    """
    extractor = PitchExtractor(model=model)

    # Extract pitch
    time, frequency, confidence = extractor.extract_pitch(audio_path)

    # Get notes
    notes = extractor.get_melody_notes(time, frequency, confidence)

    # Get summary
    summary = extractor.get_melody_summary(notes)

    return {
        'notes': notes,
        'summary': summary,
        'raw_pitch': {
            'time': time.tolist(),
            'frequency': frequency.tolist(),
            'confidence': confidence.tolist()
        }
    }


if __name__ == "__main__":
    # Test the pitch extractor
    import sys

    if len(sys.argv) < 2:
        print("Usage: python pitch_extractor.py <audio_file>")
        sys.exit(1)

    audio_file = sys.argv[1]
    result = extract_melody_from_file(audio_file)

    print("\n=== MELODY SUMMARY ===")
    print(f"Number of notes: {result['summary']['num_notes']}")
    print(f"Total duration: {result['summary']['total_duration']:.2f}s")
    print(f"Average note duration: {result['summary']['avg_note_duration']:.3f}s")
    print(f"Pitch range: {result['summary']['pitch_range']} semitones")
    print(f"Lowest note: {result['summary']['lowest_note']}")
    print(f"Highest note: {result['summary']['highest_note']}")
    print(f"Estimated key: {result['summary']['key_estimate']}")
    print(f"\nFirst notes: {', '.join(result['summary']['note_names'])}")
