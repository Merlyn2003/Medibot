import streamlit as st
import requests
import os
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from threading import Thread
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
import pymongo
from bson import ObjectId
import base64

# --- FASTAPI BACKEND SETUP ---
app = FastAPI()

UPLOAD_FOLDER = "reports"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client["healthapp"]
collection = db["medical_reports"]

@app.post("/upload-report/")
async def upload_report(file: UploadFile = File(...)):
    file_location = os.path.join(UPLOAD_FOLDER, file.filename)

    # Check if already exists
    if await collection.find_one({"filename": file.filename}):
        return {"message": "Already exists"}

    with open(file_location, "wb") as f:
        f.write(await file.read())

    await collection.insert_one({
        "filename": file.filename,
        "file_path": file_location,
        "uploaded_at": datetime.utcnow()
    })

    return {"message": "Uploaded", "filename": file.filename}

@app.delete("/delete-report/{report_id}")
async def delete_report(report_id: str):
    try:
        report = await collection.find_one({"_id": ObjectId(report_id)})
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid ID format")

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    if os.path.exists(report["file_path"]):
        os.remove(report["file_path"])

    await collection.delete_one({"_id": ObjectId(report_id)})
    return {"message": "Deleted", "filename": report["filename"]}

def run_fastapi():
    uvicorn.run(app, host="127.0.0.1", port=8000)

# Start FastAPI in background
if "api_started" not in st.session_state:
    thread = Thread(target=run_fastapi, daemon=True)
    thread.start()
    st.session_state.api_started = True

# --- STREAMLIT FRONTEND ---
st.title("🩺 Medical Report Uploader")

uploaded_file = st.file_uploader("Upload your medical report", type=["pdf", "jpg", "png"])

if uploaded_file is not None:
    # Always try to upload when a new file is selected
    response = requests.post(
        "http://127.0.0.1:8000/upload-report/",
        files={"file": (uploaded_file.name, uploaded_file.getvalue())}
    )

    if response.status_code == 200:
        if response.json().get("message") == "Uploaded":
            st.success("✅ Report uploaded successfully!")
        elif response.json().get("message") == "Already exists":
            st.warning("⚠️ Report already exists.")
        else:
            st.warning(response.json().get("message"))
        st.rerun()
    else:
        st.error("❌ Upload failed!")


# --- DISPLAY UPLOADED REPORTS ---
st.markdown("---")
st.subheader("📁 Uploaded Reports")

sync_client = pymongo.MongoClient("mongodb://localhost:27017")
sync_collection = sync_client["healthapp"]["medical_reports"]
reports = list(sync_collection.find().sort("uploaded_at", -1))

if reports:
    for report in reports:
        col1, col2, col3 = st.columns([4, 2, 2])

        with col1:
            st.write(f"📄 **{report['filename']}**")
            st.write(f"🕒 Uploaded: {report['uploaded_at'].strftime('%Y-%m-%d %H:%M:%S')}")

        with col2:
            if os.path.exists(report["file_path"]):
                with open(report["file_path"], "rb") as f:
                    b64 = base64.b64encode(f.read()).decode()
                    href = f'<a href="data:application/octet-stream;base64,{b64}" download="{report["filename"]}">📥 Download</a>'
                    st.markdown(href, unsafe_allow_html=True)

        with col3:
            if st.button("🗑️ Delete", key=str(report["_id"])):
                delete_url = f"http://127.0.0.1:8000/delete-report/{str(report['_id'])}"
                response = requests.delete(delete_url)
                if response.status_code == 200:
                    st.success(f"Deleted {report['filename']}")
                    st.rerun()
                else:
                    st.error(f"Failed to delete: {response.text}")
else:
    st.info("No reports uploaded yet.")
