#!/bin/bash
cd /home/john/attack-path-mapper/backend
source venv/bin/activate
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --log-level warning
