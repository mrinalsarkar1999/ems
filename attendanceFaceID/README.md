# Face Recognition Attendance System

A FastAPI-based application that combines face recognition with geolocation validation for attendance tracking.

## Features

- 📸 Face recognition using AWS Rekognition
- 🗺 Geo-fencing with configurable radius
- 🌐 Web-based interface with webcam capture
- 📱 Location-based authentication

## Prerequisites

- Python 3.8 or higher
- AWS account with Rekognition and S3 access
- Webcam-enabled device
- GPS/location services enabled

## Setup Instructions

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure AWS Credentials

The application uses hardcoded AWS credentials in `app.py`. For production, consider using:
- AWS IAM roles
- Environment variables
- AWS credentials file

**Current configuration:**
- AWS Region: `ap-south-1`
- S3 Bucket: `emp-info-kiran`
- S3 Folder: `emp-imges`

### 3. Prepare S3 Bucket

1. Create an S3 bucket named `emp-info-kiran` (or update the bucket name in `app.py`)
2. Create a folder named `emp-imges` in the bucket
3. Upload employee photos to this folder (JPG or PNG format)
4. Ensure the photos are clear and show the employee's face

### 4. Configure Geo-fence

Update the authorized location in `app.py`:
```python
AUTHORIZED_LOCATION = (17.483114, 78.320068)  # Your office coordinates
GEOFENCE_RADIUS_METERS = 100  # Adjust radius as needed
```

## Running the Application

### 1. Start the FastAPI Server

```bash
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Access the Web Interface

Open `app.html` in your web browser. You can:
- Double-click the file
- Or serve it using a local server:
  ```bash
  python -m http.server 8080
  ```
  Then visit: `http://localhost:8080/app.html`

### 3. Update Server URL (if needed)

If your server is running on a different IP/port, update the fetch URL in `app.html`:
```javascript
const res = await fetch("http://YOUR_IP:8000/validate/", {
```

## Usage

1. Allow camera and location access when prompted
2. Click "📸 Capture & Validate" button
3. The system will:
   - Capture your photo
   - Get your current location
   - Compare your face with stored images
   - Check if you're within the geo-fence
   - Display the results

## API Endpoints

- `POST /validate/` - Validates face and location
  - Parameters: `file` (image), `latitude`, `longitude`
  - Returns: JSON with validation results

## Troubleshooting

### Common Issues:

1. **Camera not working**: Ensure camera permissions are granted
2. **Location denied**: Allow location access in browser
3. **AWS errors**: Check credentials and bucket configuration
4. **CORS errors**: The server is configured to allow all origins

### Security Notes:

- ⚠️ **Important**: The current AWS credentials are exposed in the code
- For production use, implement proper credential management
- Consider adding authentication to the API endpoints
- Use HTTPS in production

## Project Structure

```
attendanceFaceID/
├── app.py          # FastAPI backend
├── app.html        # Web interface
├── requirements.txt # Python dependencies
└── README.md       # This file
``` 