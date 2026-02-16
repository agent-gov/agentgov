"""A regular Python application with no AI agents."""
import os
import json
from pathlib import Path

def process_data(input_file: str) -> dict:
    """Process some data from a file."""
    with open(input_file) as f:
        data = json.load(f)
    return {"count": len(data), "status": "processed"}

if __name__ == "__main__":
    result = process_data("data.json")
    print(result)
