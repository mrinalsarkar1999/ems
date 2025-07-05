@echo off
echo Starting Face Authentication Server...
echo.
echo Make sure you're in the attendanceFaceID directory
cd attendanceFaceID
echo.
echo Starting server on http://localhost:8000
echo Press Ctrl+C to stop the server
echo.
python -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload
pause 