#!/usr/bin/env python3
"""
Check detailed training logs from Replicate
"""
import replicate
import os
from dotenv import load_dotenv

load_dotenv()
# Ensure REPLICATE_API_TOKEN is set in your .env file

training_ids = [
    "xq2xr6h8g5rj20csz52vrhqmw0",  # Drake
    "6jm53yvaqdrj60csz52vxk6ws4"   # Morgan Wallen
]

for training_id in training_ids:
    print(f"\n{'='*60}")
    print(f"Training ID: {training_id}")
    print(f"{'='*60}")

    training = replicate.trainings.get(training_id)

    print(f"Status: {training.status}")
    print(f"Created: {training.created_at}")

    if hasattr(training, 'error') and training.error:
        print(f"\n❌ ERROR:")
        print(training.error)

    if hasattr(training, 'logs') and training.logs:
        print(f"\n📋 LOGS:")
        print(training.logs)
    else:
        print("\nNo logs available yet")

    if hasattr(training, 'input'):
        print(f"\n📥 INPUT:")
        for key, value in training.input.items():
            print(f"  {key}: {value}")
