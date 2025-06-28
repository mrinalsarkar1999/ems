import os
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import boto3
from geopy.distance import geodesic
import traceback
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# AWS Configuration
AWS_ACCESS_KEY = os.getenv("AWS_ACCESS_KEY")
AWS_SECRET_KEY = os.getenv("AWS_SECRET_KEY")
AWS_REGION = os.getenv("AWS_REGION")
BUCKET_NAME = os.getenv("BUCKET_NAME")
FOLDER_NAME = os.getenv("FOLDER_NAME")

# Geo-fence configuration
AUTHORIZED_LOCATION = (17.483114, 78.320068)  # Example coordinates (latitude, longitude)
# Radius in meters for the geo-fence
GEOFENCE_RADIUS_METERS = 100  # 100 meters

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "Face authentication server is running"}

@app.post("/validate/")
async def validate_face_and_location(
    file: UploadFile = File(...),
    latitude: float = Form(...),
    longitude: float = Form(...)
):
   # print("📍 Received user location:", latitude, longitude)

    try:
        # Step 1: Geo-fence check
        user_location = (latitude, longitude)
        distance = geodesic(user_location, AUTHORIZED_LOCATION).meters
        location_ok = distance <= GEOFENCE_RADIUS_METERS

        # Step 2: Read uploaded image
        contents = await file.read()

        # Step 3: AWS Rekognition + S3 setup
        rekognition = boto3.client('rekognition',
            aws_access_key_id=AWS_ACCESS_KEY,
            aws_secret_access_key=AWS_SECRET_KEY,
            region_name=AWS_REGION)

        s3 = boto3.client('s3',
            aws_access_key_id=AWS_ACCESS_KEY,
            aws_secret_access_key=AWS_SECRET_KEY,
            region_name=AWS_REGION)

        face_matched = False
        matched_key = None
        similarity = 0

        # Step 4: Iterate over known faces in S3
        try:
            files = s3.list_objects_v2(Bucket=BUCKET_NAME, Prefix=FOLDER_NAME + '/')
            if 'Contents' not in files or len(files['Contents']) == 0:
                # No images found, return location-only result
                result = {
                    "face_matched": False,
                    "matched_with": None,
                    "similarity": 0,
                    "location_ok": location_ok,
                    "distance_m": round(distance, 2),
                    "status": f"⚠ No employee photos found in S3. Location {'ok' if location_ok else 'outside geo-fence'}",
                    "note": "Upload employee photos to S3 bucket for face recognition"
                }
                return result

            for obj in files['Contents']:
                key = obj['Key']
                if key.endswith('.jpg') or key.endswith('.png'):
                    try:
                        response = rekognition.compare_faces(
                            SourceImage={'S3Object': {'Bucket': BUCKET_NAME, 'Name': key}},
                            TargetImage={'Bytes': contents},
                            SimilarityThreshold=90
                        )
                        if response['FaceMatches']:
                            similarity = response['FaceMatches'][0]['Similarity']
                            matched_key = key
                            face_matched = True
                            break
                    except Exception as e:
                        print(f"❌ Error comparing with {key}: {e}")
                        continue
        except Exception as e:
            print(f"❌ S3 error: {e}")
            # Return location-only result if S3 fails
            result = {
                "face_matched": False,
                "matched_with": None,
                "similarity": 0,
                "location_ok": location_ok,
                "distance_m": round(distance, 2),
                "status": f"⚠ S3 error. Location {'ok' if location_ok else 'outside geo-fence'}",
                "note": "Check AWS credentials and S3 bucket configuration"
            }
            return result

        # ✅ Final result
        result = {
            "face_matched": face_matched,
            "matched_with": matched_key,
            "similarity": round(similarity, 2),
            "location_ok": location_ok,
            "distance_m": round(distance, 2),
            "status": ""
        }

        # ✅ Determine final status
        if face_matched and location_ok:
            result["status"] = "✅ Face matched & inside geo-fence"
        elif face_matched and not location_ok:
            result["status"] = "⚠ Face matched but outside geo-fence"
        elif not face_matched and location_ok:
            result["status"] = "❌ Face not matched but inside geo-fence"
        else:
            result["status"] = "❌ Face not matched and outside geo-fence"

        # 📋 Print server-side log
        print("======== VERIFICATION RESULT ========")
        print("📍 Location ok   :", location_ok)
        print("📏 Distance (m)  :", round(distance, 2))
        print("🧠 Face matched  :", face_matched)
        print("🖼  Matched file :", matched_key or "None")
        print("🔢 Similarity    :", round(similarity, 2))
        print("📦 Final status  :", result["status"])
        print("=====================================")
        

        return result

    except Exception as e:
        print("❌ Server error:\n", traceback.format_exc())
        return JSONResponse(status_code=500, content={"error": "Internal Server Error", "details": str(e)})