#!/usr/bin/env python3
"""
Test both trained models - Morgan Wallen & Drake styles
"""
import replicate
import os
from dotenv import load_dotenv

load_dotenv()
# Ensure REPLICATE_API_TOKEN is set in your .env file

models = [
    {
        "name": "Morgan Wallen Style",
        "model_id": "kennonjarvis-debug/morgan_wallen_style-musicgen:7feb3d6ba5ee76e3af79c7ab923aa70ed55c1fbcd96a9d8fcd724150daaf5d29",
        "prompt": "upbeat modern country song with catchy guitar riffs and driving drums"
    },
    {
        "name": "Drake Style",
        "model_id": "kennonjarvis-debug/drake_style-musicgen:e37bd554db93ea40ba192f3296381ee096b760dcb5bf2145d0169f4c8a75173d",
        "prompt": "moody hip hop beat with melodic trap vibes and atmospheric synths"
    }
]

print("\n🎵 Testing your custom trained models!\n")

for model_info in models:
    print(f"{'='*70}")
    print(f"🎸 Testing: {model_info['name']}")
    print(f"{'='*70}")
    print(f"Prompt: {model_info['prompt']}")
    print(f"Generating 10 seconds...")

    try:
        output = replicate.run(
            model_info['model_id'],
            input={
                "prompt": model_info['prompt'],
                "duration": 10,
                "output_format": "mp3",
                "normalization_strategy": "peak"
            }
        )

        audio_url = str(output)
        print(f"\n✅ SUCCESS!")
        print(f"🎵 Audio URL: {audio_url}")
        print(f"\nDownload and play:")
        print(f"   curl '{audio_url}' -o '{model_info['name'].replace(' ', '_').lower()}_test.mp3' && open '{model_info['name'].replace(' ', '_').lower()}_test.mp3'")
        print()

    except Exception as e:
        print(f"\n❌ ERROR: {e}\n")

print(f"{'='*70}")
print("✨ Testing complete!")
print(f"{'='*70}")
