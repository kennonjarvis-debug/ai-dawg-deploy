#!/usr/bin/env python3
"""
Railway Deployment Monitor
Checks deployment status every 15 seconds for up to 3 minutes
"""

import urllib.request
import time
from datetime import datetime

URL = "https://dawg-ai-web-production.up.railway.app"
MAX_CHECKS = 12  # 12 checks * 15 seconds = 3 minutes
CHECK_INTERVAL = 15

def get_utc_time():
    return datetime.utcnow().strftime("%H:%M:%S")

def check_deployment():
    try:
        req = urllib.request.Request(URL, method='HEAD')
        with urllib.request.urlopen(req, timeout=10) as response:
            return response.status, dict(response.headers)
    except urllib.error.HTTPError as e:
        return e.code, dict(e.headers)
    except Exception as e:
        return None, str(e)

print(f"Starting deployment monitoring at {get_utc_time()} UTC")
print(f"Will check every {CHECK_INTERVAL} seconds for up to 3 minutes...")
print()

for check_num in range(1, MAX_CHECKS + 1):
    current_time = get_utc_time()
    print(f"=== Check #{check_num} at {current_time} UTC ===")

    status_code, headers = check_deployment()

    if status_code is None:
        print(f"Connection error: {headers}")
    else:
        print(f"HTTP Status: {status_code}")

        if status_code == 200:
            print()
            print("✓ DEPLOYMENT IS LIVE!")
            print(f"Time became live: {current_time} UTC")
            print()
            print("Full HTTP Headers:")
            for key, value in headers.items():
                print(f"{key}: {value}")
            print()
            print("SUCCESS: Port fix worked! The application is responding with HTTP 200.")
            exit(0)

    if check_num < MAX_CHECKS:
        print(f"Still deploying... waiting {CHECK_INTERVAL} seconds")
        print()
        time.sleep(CHECK_INTERVAL)

print("=== TIMEOUT ===")
print("Deployment did not become live within 3 minutes.")
print(f"Last status code: {status_code}")
exit(1)
