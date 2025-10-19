"""
Training Data Preparation Utilities
Prepares audio files for MusicGen fine-tuning on Replicate
"""

import os
import zipfile
from pathlib import Path
import librosa
import soundfile as sf
from typing import List, Optional
import json

class TrainingDataPrep:
    def __init__(self, source_dir: str, output_dir: str = "training-data-prepared"):
        self.source_dir = Path(source_dir)
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True, parents=True)

    def validate_audio_files(self) -> List[Path]:
        """
        Validate audio files:
        - Must be > 30 seconds
        - Supported formats: mp3, wav, flac, m4a
        """
        valid_files = []
        supported_formats = ['.mp3', '.wav', '.flac', '.m4a', '.aac']

        for file_path in self.source_dir.rglob('*'):
            if file_path.suffix.lower() in supported_formats:
                try:
                    # Load audio to check duration
                    y, sr = librosa.load(str(file_path), sr=None, duration=1)
                    duration = librosa.get_duration(path=str(file_path))

                    if duration >= 30:
                        valid_files.append(file_path)
                        print(f"✓ Valid: {file_path.name} ({duration:.1f}s)")
                    else:
                        print(f"✗ Too short: {file_path.name} ({duration:.1f}s < 30s)")

                except Exception as e:
                    print(f"✗ Error reading {file_path.name}: {e}")

        print(f"\n✅ Found {len(valid_files)} valid audio files")
        return valid_files

    def convert_to_wav(self, file_path: Path, output_path: Path) -> bool:
        """Convert audio file to WAV format (preferred for training)"""
        try:
            # Load audio
            y, sr = librosa.load(str(file_path), sr=44100, mono=False)

            # Save as WAV
            sf.write(str(output_path), y.T if y.ndim > 1 else y, sr)

            print(f"✓ Converted: {file_path.name} -> {output_path.name}")
            return True

        except Exception as e:
            print(f"✗ Error converting {file_path.name}: {e}")
            return False

    def create_metadata_json(self, audio_files: List[Path]) -> dict:
        """
        Create metadata JSON for each audio file
        (Optional - Replicate can auto-label, but manual metadata is better)
        """
        metadata = {}

        for audio_file in audio_files:
            # Basic metadata
            meta = {
                "duration": float(librosa.get_duration(path=str(audio_file))),
                "sample_rate": librosa.get_samplerate(str(audio_file))
            }

            # Try to extract BPM and key (optional)
            try:
                y, sr = librosa.load(str(audio_file), duration=30)
                tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
                meta["bpm"] = float(tempo)
            except:
                meta["bpm"] = None

            metadata[audio_file.name] = meta

        return metadata

    def prepare_dataset(self, instrument_name: str, auto_convert: bool = True) -> Path:
        """
        Prepare complete dataset for training:
        1. Validate audio files
        2. Convert to WAV (optional)
        3. Create metadata
        4. Create zip file for upload
        """
        print(f"\n🎵 Preparing training data for: {instrument_name}")
        print(f"Source: {self.source_dir}")

        # Step 1: Validate files
        valid_files = self.validate_audio_files()

        if len(valid_files) < 9:
            raise ValueError(f"Need at least 9 valid audio files, found only {len(valid_files)}")

        # Create instrument-specific output directory
        instrument_dir = self.output_dir / instrument_name
        instrument_dir.mkdir(exist_ok=True, parents=True)

        # Step 2: Convert to WAV if needed
        processed_files = []
        for file_path in valid_files:
            if auto_convert and file_path.suffix.lower() != '.wav':
                output_path = instrument_dir / f"{file_path.stem}.wav"
                if self.convert_to_wav(file_path, output_path):
                    processed_files.append(output_path)
            else:
                # Copy as-is
                import shutil
                output_path = instrument_dir / file_path.name
                shutil.copy(file_path, output_path)
                processed_files.append(output_path)

        # Step 3: Create metadata
        metadata = self.create_metadata_json(processed_files)
        metadata_file = instrument_dir / "metadata.json"
        with open(metadata_file, 'w') as f:
            json.dump(metadata, f, indent=2)

        print(f"✓ Created metadata: {metadata_file}")

        # Step 4: Create README for dataset
        readme_content = f"""# {instrument_name} Training Dataset

Total files: {len(processed_files)}
Prepared on: {Path.ctime(instrument_dir)}

## Files:
"""
        for i, file in enumerate(processed_files, 1):
            readme_content += f"{i}. {file.name}\n"

        readme_file = instrument_dir / "README.md"
        with open(readme_file, 'w') as f:
            f.write(readme_content)

        # Step 5: Create zip file
        zip_path = self.output_dir / f"{instrument_name}.zip"
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for file in processed_files:
                zipf.write(file, arcname=file.name)
            zipf.write(metadata_file, arcname="metadata.json")
            zipf.write(readme_file, arcname="README.md")

        print(f"\n✅ Dataset prepared: {zip_path}")
        print(f"Size: {zip_path.stat().st_size / 1024 / 1024:.1f} MB")
        print(f"\n📤 Upload this file to a cloud storage service (S3, Dropbox, etc.)")
        print(f"Then use the URL for training on Replicate")

        return zip_path


def prepare_telecaster_dataset():
    """Example: Prepare Telecaster guitar training data"""
    prep = TrainingDataPrep(
        source_dir="training-data/telecaster",
        output_dir="training-data-prepared"
    )

    zip_file = prep.prepare_dataset(
        instrument_name="telecaster",
        auto_convert=True
    )

    return zip_file


def prepare_drums_dataset():
    """Example: Prepare Metro Boomin-style drums training data"""
    prep = TrainingDataPrep(
        source_dir="training-data/metro-drums",
        output_dir="training-data-prepared"
    )

    zip_file = prep.prepare_dataset(
        instrument_name="metro_drums",
        auto_convert=True
    )

    return zip_file


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 3:
        print("Usage: python prepare_training_data.py <source_dir> <instrument_name>")
        print("\nExample:")
        print("  python prepare_training_data.py training-data/telecaster telecaster")
        sys.exit(1)

    source_dir = sys.argv[1]
    instrument_name = sys.argv[2]

    prep = TrainingDataPrep(source_dir=source_dir)
    zip_file = prep.prepare_dataset(instrument_name=instrument_name)

    print(f"\n✅ Done! Upload {zip_file} to start training.")
