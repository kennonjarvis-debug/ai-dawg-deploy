#!/usr/bin/env python3
import replicate
import os
from dotenv import load_dotenv

load_dotenv()
# Ensure REPLICATE_API_TOKEN is set in your .env file

training_ids = [
    "3e9ythwd3drj60csz56t4r9qx0",  # Morgan Wallen
    "3kdhz4c9jhrj20csz56t2ze6gg"   # Drake
]

for training_id in training_ids:
    print(f"\n{'='*60}")
    print(f"Training ID: {training_id}")
    print(f"{'='*60}")

    try:
        training = replicate.trainings.get(training_id)
        print(f"Status: {training.status}")

        if hasattr(training, 'output') and training.output:
            model_version = training.output.get("version")
            print(f"\n✅ Model created: {model_version}")
            print(f"   Full model ID: kennonjarvis-debug/musicgen:{model_version}")

        if hasattr(training, 'error') and training.error:
            print(f"\n❌ ERROR: {training.error}")

    except Exception as e:
        print(f"Error: {e}")
