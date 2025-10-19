#!/usr/bin/env python3
import replicate
import os
from dotenv import load_dotenv

load_dotenv()
# Ensure REPLICATE_API_TOKEN is set in your .env file

training_ids = [
    "pgz3r4yczsrj60csz55sqwap6w",  # Drake (GitHub URL)
    "chyn43phphz5rj40csz55r1kv42c"   # Morgan Wallen (GitHub URL)
]

for training_id in training_ids:
    print(f"\n{'='*60}")
    print(f"Training ID: {training_id}")
    print(f"{'='*60}")

    try:
        training = replicate.trainings.get(training_id)

        print(f"Status: {training.status}")

        if hasattr(training, 'error') and training.error:
            print(f"\n❌ ERROR:")
            print(training.error)

        if hasattr(training, 'logs') and training.logs:
            print(f"\n📋 LOGS:")
            print(training.logs)

        # Print input to see what was sent
        if hasattr(training, 'input'):
            print(f"\n📥 INPUT:")
            for key, value in training.input.items():
                if key == "dataset_path":
                    print(f"  {key}: {value}")
    except Exception as e:
        print(f"Error fetching training: {e}")
