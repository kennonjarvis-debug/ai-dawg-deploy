"""
Expert Music AI - FastAPI Service
Multi-model music generation with specialized instrument models
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict
import replicate
import os
import json
from datetime import datetime
import logging
import tempfile
import shutil

# Import our custom utilities
from utils.pitch_extractor import extract_melody_from_file
from utils.lyric_generator import generate_lyrics_from_melody

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(title="Expert Music AI", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Replicate API setup
REPLICATE_API_TOKEN = os.getenv("REPLICATE_API_TOKEN")
if not REPLICATE_API_TOKEN:
    raise ValueError("REPLICATE_API_TOKEN environment variable is required")
os.environ["REPLICATE_API_TOKEN"] = REPLICATE_API_TOKEN

# Model registry - maps instrument/style to Replicate model IDs
MODEL_REGISTRY_FILE = "src/backend/expert-music-ai/models/registry.json"

def load_model_registry():
    """Load the model registry from file"""
    try:
        with open(MODEL_REGISTRY_FILE, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        # Default registry with base MusicGen models
        return {
            "base": {
                "small": "meta/musicgen:b05b1dff1d8c6dc63d14b0cdb42135378dcb87f6373b0d3d341ede46e59e2b38",
                "medium": "meta/musicgen:7a76a8258b23fae65c5a22debb8841d1d7e816b75c2f24218cd2bd8573787906",
                "melody": "meta/musicgen:671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb",
                "large": "meta/musicgen:7be0f12c54a8d033a0fbd14418c9af98962da9a86f5ff7811f9b3b17a1c0f1fc"
            },
            "fine_tuned": {}
        }

def save_model_registry(registry):
    """Save the model registry to file"""
    os.makedirs(os.path.dirname(MODEL_REGISTRY_FILE), exist_ok=True)
    with open(MODEL_REGISTRY_FILE, 'w') as f:
        json.dump(registry, f, indent=2)

# Load registry on startup
model_registry = load_model_registry()

# Request/Response Models
class MusicGenerationRequest(BaseModel):
    prompt: str
    instruments: Optional[List[str]] = None  # ['telecaster', 'metro_drums', 'piano']
    style: Optional[str] = None  # 'morgan_wallen', 'metro_boomin', etc.
    include_vocals: bool = False
    custom_lyrics: Optional[str] = None
    duration: int = 30
    bpm: Optional[int] = None
    key: Optional[str] = None
    model_version: str = "medium"  # small, medium, melody, large

class TrainingRequest(BaseModel):
    instrument_name: str  # 'telecaster', 'metro_drums', etc.
    description: str  # Description for model
    dataset_url: str  # URL to zip file with training audio
    model_version: str = "medium"
    epochs: int = 10
    auto_labeling: bool = True
    drop_vocals: bool = True

class MusicGenerationResponse(BaseModel):
    success: bool
    audio_url: Optional[str] = None
    prediction_id: Optional[str] = None
    model_used: Optional[str] = None
    message: str
    duration: Optional[int] = None

class TrainingResponse(BaseModel):
    success: bool
    training_id: str
    status: str
    message: str
    model_name: Optional[str] = None

class ModelInfo(BaseModel):
    name: str
    description: str
    model_id: str
    created_at: str
    type: str  # 'base' or 'fine_tuned'

@app.get("/")
async def root():
    return {
        "service": "Expert Music AI",
        "version": "1.0.0",
        "status": "running",
        "models_available": len(model_registry.get("fine_tuned", {}))
    }

@app.get("/models", response_model=List[ModelInfo])
async def list_models():
    """List all available models (base + fine-tuned)"""
    models = []

    # Add base models
    for name, model_id in model_registry.get("base", {}).items():
        models.append(ModelInfo(
            name=f"base_{name}",
            description=f"Meta MusicGen {name} (base model)",
            model_id=model_id,
            created_at="2023-08-01",
            type="base"
        ))

    # Add fine-tuned models
    for name, info in model_registry.get("fine_tuned", {}).items():
        models.append(ModelInfo(
            name=name,
            description=info.get("description", ""),
            model_id=info["model_id"],
            created_at=info.get("created_at", "unknown"),
            type="fine_tuned"
        ))

    return models

@app.post("/generate", response_model=MusicGenerationResponse)
async def generate_music(request: MusicGenerationRequest):
    """
    Generate music using specialized models or base MusicGen
    """
    try:
        logger.info(f"🎵 Music generation request: {request.dict()}")

        # Determine which model to use
        model_id = None
        model_name = "base"

        # Check if specific instrument models are requested
        if request.instruments and len(request.instruments) > 0:
            # For now, use the first instrument's model
            instrument = request.instruments[0]
            if instrument in model_registry.get("fine_tuned", {}):
                model_id = model_registry["fine_tuned"][instrument]["model_id"]
                model_name = instrument
                logger.info(f"Using fine-tuned model: {instrument}")

        # Check if style-specific model is requested
        if request.style and request.style in model_registry.get("fine_tuned", {}):
            model_id = model_registry["fine_tuned"][request.style]["model_id"]
            model_name = request.style
            logger.info(f"Using style model: {request.style}")

        # Fallback to base model
        if not model_id:
            model_id = model_registry["base"].get(request.model_version,
                                                   model_registry["base"]["medium"])
            model_name = f"base_{request.model_version}"
            logger.info(f"Using base model: {request.model_version}")

        # Build enhanced prompt
        prompt_parts = []
        if request.bpm:
            prompt_parts.append(f"{request.bpm} BPM")
        if request.key:
            prompt_parts.append(f"key of {request.key}")
        if request.instruments:
            prompt_parts.append(", ".join(request.instruments))

        prompt_parts.append(request.prompt)
        full_prompt = " - ".join(prompt_parts)

        logger.info(f"Full prompt: {full_prompt}")

        # Run prediction on Replicate
        output = replicate.run(
            model_id,
            input={
                "prompt": full_prompt,
                "duration": request.duration,
                "output_format": "mp3",
                "normalization_strategy": "peak"
            }
        )

        # Extract audio URL from output
        # Replicate returns a FileOutput object which can be converted to string
        audio_url = str(output) if output else None

        if not audio_url or not audio_url.startswith('http'):
            raise HTTPException(status_code=500, detail=f"Invalid audio URL: {audio_url}")

        logger.info(f"✅ Generated audio: {audio_url}")

        return MusicGenerationResponse(
            success=True,
            audio_url=audio_url,
            model_used=model_name,
            message=f"Music generated successfully with {model_name} model",
            duration=request.duration
        )

    except Exception as e:
        logger.error(f"❌ Generation error: {str(e)}")
        return MusicGenerationResponse(
            success=False,
            message=f"Generation failed: {str(e)}"
        )

@app.post("/train", response_model=TrainingResponse)
async def train_model(request: TrainingRequest):
    """
    Fine-tune a new specialized model on Replicate
    """
    try:
        logger.info(f"🎓 Starting training for: {request.instrument_name}")

        # Use the Replicate username from environment variable or default
        replicate_username = os.getenv("REPLICATE_USERNAME", "kennonjarvis-debug")
        destination_model_name = f"{request.instrument_name}-musicgen"
        destination = f"{replicate_username}/{destination_model_name}"

        logger.info(f"Preparing training with destination: {destination}")

        # Create the destination model if it doesn't exist
        try:
            existing_model = replicate.models.get(destination)
            logger.info(f"Destination model already exists: {destination}")
        except Exception as e:
            # Model doesn't exist, create it
            logger.info(f"Creating destination model: {destination}")
            try:
                replicate.models.create(
                    owner=replicate_username,
                    name=destination_model_name,
                    visibility="private",
                    hardware="cpu",  # Hardware is for inference, not training
                    description=request.description
                )
                logger.info(f"✅ Created destination model: {destination}")
            except Exception as create_error:
                logger.error(f"Failed to create model: {create_error}")
                raise

        # Get the latest version of the fine-tuner model
        try:
            model = replicate.models.get("sakemin/musicgen-fine-tuner")
            version_id = model.latest_version.id
            logger.info(f"Using fine-tuner version: {version_id}")
        except Exception as e:
            # Fallback to a known working version if we can't fetch the latest
            version_id = "8d02c56b9a3d69abd2f1d6cc1a65027de5bfef7f0d34bd23e0624ecabb65acac"
            logger.warn(f"Could not fetch latest version, using fallback: {version_id}")

        # Create training using both model and version parameters
        training = replicate.trainings.create(
            model="sakemin/musicgen-fine-tuner",
            version=version_id,
            input={
                "dataset_path": request.dataset_url,
                "auto_labeling": request.auto_labeling,
                "drop_vocals": request.drop_vocals,
                "model_version": request.model_version,
                "epochs": request.epochs,
            },
            destination=destination
        )

        training_id = training.id

        logger.info(f"✅ Training started: {training_id}")

        # Store training info for later retrieval
        training_info = {
            "instrument_name": request.instrument_name,
            "description": request.description,
            "training_id": training_id,
            "status": "training",
            "started_at": datetime.now().isoformat()
        }

        # Save to a training jobs file
        os.makedirs("src/backend/expert-music-ai/training", exist_ok=True)
        with open(f"src/backend/expert-music-ai/training/{request.instrument_name}.json", 'w') as f:
            json.dump(training_info, f, indent=2)

        return TrainingResponse(
            success=True,
            training_id=training_id,
            status="training",
            message=f"Training started for {request.instrument_name}",
            model_name=request.instrument_name
        )

    except Exception as e:
        logger.error(f"❌ Training error: {str(e)}")
        return TrainingResponse(
            success=False,
            training_id="",
            status="failed",
            message=f"Training failed: {str(e)}"
        )

@app.get("/training/{training_id}")
async def get_training_status(training_id: str):
    """Get status of a training job"""
    try:
        training = replicate.trainings.get(training_id)

        status = training.status

        # If training is complete, update model registry
        if status == "succeeded" and training.output:
            model_id = training.output.get("model")

            # Try to find the instrument name from training jobs
            for file in os.listdir("src/backend/expert-music-ai/training"):
                if file.endswith(".json"):
                    with open(f"src/backend/expert-music-ai/training/{file}", 'r') as f:
                        job = json.load(f)
                        if job.get("training_id") == training_id:
                            instrument_name = job["instrument_name"]

                            # Update registry
                            model_registry["fine_tuned"][instrument_name] = {
                                "model_id": model_id,
                                "description": job.get("description", ""),
                                "created_at": datetime.now().isoformat()
                            }
                            save_model_registry(model_registry)

                            logger.info(f"✅ Model {instrument_name} registered: {model_id}")
                            break

        return {
            "training_id": training_id,
            "status": status,
            "logs": training.logs if hasattr(training, 'logs') else None
        }

    except Exception as e:
        logger.error(f"❌ Error getting training status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/register-model")
async def register_model(
    name: str,
    model_id: str,
    description: str = ""
):
    """Manually register a fine-tuned model"""
    try:
        model_registry["fine_tuned"][name] = {
            "model_id": model_id,
            "description": description,
            "created_at": datetime.now().isoformat()
        }
        save_model_registry(model_registry)

        return {
            "success": True,
            "message": f"Model {name} registered successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/melody-to-vocals")
async def melody_to_vocals(
    audio_file: UploadFile = File(..., description="Audio file with hummed/sung melody"),
    prompt: str = Form(..., description="Creative prompt for lyrics"),
    genre: str = Form(default="pop", description="Music genre"),
    theme: Optional[str] = Form(default=None, description="Song theme"),
    mood: Optional[str] = Form(default=None, description="Desired mood"),
    style: Optional[str] = Form(default=None, description="Reference artist style"),
    ai_provider: str = Form(default="anthropic", description="AI provider for lyrics (anthropic or openai)"),
    vocal_model: str = Form(default="bark", description="Vocal synthesis model (bark or musicgen)")
):
    """
    Convert hummed melody to full vocals with AI-generated lyrics

    Pipeline:
    1. Extract pitch/melody from uploaded audio
    2. Generate lyrics matching the melody structure
    3. Synthesize vocals with the generated lyrics

    Returns:
        JSON with audio_url, lyrics, and metadata
    """
    temp_dir = None

    try:
        logger.info(f"🎵 Starting melody-to-vocals pipeline: {audio_file.filename}")

        # Create temp directory for processing
        temp_dir = tempfile.mkdtemp(prefix="melody_to_vocals_")

        # Save uploaded audio
        input_path = os.path.join(temp_dir, "input_melody.wav")
        with open(input_path, "wb") as f:
            shutil.copyfileobj(audio_file.file, f)

        logger.info(f"📁 Saved input audio to {input_path}")

        # Step 1: Extract melody
        logger.info("🎼 Extracting pitch/melody...")
        melody_data = extract_melody_from_file(input_path, model='full')
        notes = melody_data['notes']
        summary = melody_data['summary']

        logger.info(f"✓ Extracted {summary['num_notes']} notes")
        logger.info(f"  Duration: {summary['total_duration']:.1f}s")
        logger.info(f"  Key estimate: {summary['key_estimate']}")
        logger.info(f"  Range: {summary['lowest_note']} to {summary['highest_note']}")

        if len(notes) < 3:
            raise HTTPException(
                status_code=400,
                detail="Could not extract clear melody from audio. Please try humming more clearly."
            )

        # Step 2: Generate lyrics
        logger.info("✍️  Generating lyrics...")
        lyrics_data = generate_lyrics_from_melody(
            notes,
            prompt=prompt,
            genre=genre,
            provider=ai_provider,
            theme=theme,
            mood=mood,
            style=style
        )

        lyrics = lyrics_data['lyrics']
        logger.info(f"✓ Generated lyrics: {lyrics_data['num_lines']} lines")
        logger.info(f"  Syllables: {lyrics_data['estimated_syllables']} (target: {lyrics_data['target_syllables']})")

        # Step 3: Synthesize vocals
        logger.info(f"🎤 Synthesizing vocals with {vocal_model}...")

        if vocal_model == "bark":
            # Use Bark for text-to-speech
            # Bark model on Replicate
            bark_model = "pollinations/bark:a6010c33e7a5be4e3cb1c03de0d8d6c0b65bb49d2ac39a3a8cd4fc9c8fd94bac"

            # Format lyrics for speech synthesis
            speech_text = lyrics.replace('\n', '. ')

            output = replicate.run(
                bark_model,
                input={
                    "prompt": speech_text,
                    "text_temp": 0.7,
                    "waveform_temp": 0.7,
                    "output_full": False
                }
            )

            audio_url = str(output.get('audio_out', output)) if isinstance(output, dict) else str(output)

        else:  # musicgen
            # Use MusicGen melody model
            musicgen_melody_model = "meta/musicgen:671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb"

            # Create a prompt combining the lyrics idea with musical description
            music_prompt = f"{genre} song, {mood or 'emotional'} vocals singing: {prompt}. Key: {summary['key_estimate']}"

            output = replicate.run(
                musicgen_melody_model,
                input={
                    "prompt": music_prompt,
                    "melody": input_path,  # Use the hummed melody as guidance
                    "duration": int(summary['total_duration']) + 2,
                    "output_format": "mp3",
                    "normalization_strategy": "peak"
                }
            )

            audio_url = str(output)

        logger.info(f"✓ Generated vocal audio: {audio_url}")

        # Prepare response
        response = {
            "success": True,
            "audio_url": audio_url,
            "lyrics": lyrics,
            "melody_info": {
                "num_notes": summary['num_notes'],
                "duration": summary['total_duration'],
                "key": summary['key_estimate'],
                "range": f"{summary['lowest_note']} to {summary['highest_note']}",
                "notes": summary['note_names'][:5]  # First 5 notes
            },
            "lyrics_info": {
                "num_lines": lyrics_data['num_lines'],
                "syllables": lyrics_data['estimated_syllables'],
                "genre": genre,
                "theme": theme,
                "mood": mood
            },
            "processing_steps": [
                f"Extracted {summary['num_notes']} notes from melody",
                f"Generated {lyrics_data['num_lines']} lines of lyrics",
                f"Synthesized vocals using {vocal_model}"
            ]
        }

        logger.info("✅ Melody-to-vocals pipeline complete!")
        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Melody-to-vocals error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

    finally:
        # Cleanup temp files
        if temp_dir and os.path.exists(temp_dir):
            try:
                shutil.rmtree(temp_dir)
                logger.info(f"🧹 Cleaned up temp directory: {temp_dir}")
            except Exception as e:
                logger.warning(f"Failed to cleanup temp directory: {e}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)
