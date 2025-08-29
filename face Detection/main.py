import cv2
import os
import datetime
import json
from deepface import DeepFace
from pymongo import MongoClient
import time

# === MongoDB Setup ===
client = MongoClient('mongodb://localhost:27017/')
db = client['attendance_system']
attendance_collection = db['attendance']
frames_collection = db['captured_frames']

# === Folder Setup ===
db_path = 'images'  # known faces folder
captured_frames_folder = 'captured_frames'
os.makedirs(captured_frames_folder, exist_ok=True)

# === Already Marked Set ===
already_marked_present = set()

# Load previously marked students
for record in attendance_collection.find({"Status": "Present"}):
    already_marked_present.add((record["Name"], record["Subject"]))

# === Load session config ===
with open('sessions.json') as f:
    sessions = json.load(f)

def mark_attendance(name, status, subject):
    now = datetime.datetime.now()
    timestamp = now.strftime("%Y-%m-%d %H:%M:%S")

    if status == "Present":
        if (name, subject) in already_marked_present:
            return  # already marked
        already_marked_present.add((name, subject))

    attendance_collection.insert_one({
        'Name': name,
        'Subject': subject,
        'Status': status,
        'Timestamp': timestamp
    })

    print(f"Attendance marked for {name} in subject {subject}")

def wait_until_start(start_time):
    print(f"Waiting until start time {start_time} ...")
    while True:
        now = datetime.datetime.now().time()
        if now >= start_time:
            break
        time.sleep(10)
    print("Starting attendance capture...")

def capture_and_mark_attendance(session):
    subject = session["subject"]
    start_time = datetime.datetime.strptime(session["start"], "%H:%M").time()
    end_time = datetime.datetime.strptime(session["end"], "%H:%M").time()

    wait_until_start(start_time)

    cap = cv2.VideoCapture(0)

    if not cap.isOpened():
        print("Error: Could not open camera.")
        return

    best_frame = None
    max_faces_detected = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            print("Failed to grab frame")
            break

        current_time = datetime.datetime.now().time()
        if current_time >= end_time:
            print("Session Ended.")
            break

        temp_filename = "temp_frame.jpg"
        cv2.imwrite(temp_filename, frame)

        try:
            result = DeepFace.find(img_path=temp_filename, db_path=db_path, enforce_detection=False, silent=True)

            faces_detected = result[0].shape[0]

            if faces_detected > max_faces_detected:
                best_frame = frame.copy()
                max_faces_detected = faces_detected

            if faces_detected > 0:
                identity_path = result[0]['identity'][0]
                if identity_path == '':  # no match found
                    continue  # skip unknown faces

                name = os.path.basename(identity_path).split('.')[0]
                mark_attendance(name, "Present", subject)
            # else: (if no faces detected) --> we don't log anything at all.

        except Exception:
            pass  # no printing

        cv2.imshow('Attendance System', frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            print("Quit manually.")
            break

    # Save the best frame if any
    if best_frame is not None:
        now = datetime.datetime.now()
        best_frame_filename = now.strftime("%Y%m%d_%H%M%S_best.jpg")
        best_frame_path = os.path.join(captured_frames_folder, best_frame_filename)
        cv2.imwrite(best_frame_path, best_frame)

        frames_collection.insert_one({
            'CapturedTime': now.strftime("%Y-%m-%d %H:%M:%S"),
            'FacesDetected': max_faces_detected,
            'Subject': subject,
            'ImagePath': best_frame_path
        })

    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    for session in sessions:
        capture_and_mark_attendance(session)
