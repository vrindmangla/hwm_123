from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import uuid
from ultralytics import YOLO
from PIL import Image
import cv2

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configuration
UPLOAD_FOLDER = 'uploads'
RESULT_FOLDER = 'results'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(RESULT_FOLDER, exist_ok=True)

# Load YOLOv8 model (use yolov8n.pt or your trained weights)
model = YOLO("yolov8n.pt")  # You can replace with 'yolov8m.pt', 'yolov8s.pt' or custom weights

@app.route('/api/detect', methods=['POST'])
def detect():
    if 'image' not in request.files:
        return jsonify({'error': 'No image part in request'}), 400

    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    # Save uploaded file
    filename = f"{uuid.uuid4().hex}.jpg"
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)

    # Run YOLOv8 detection
    results = model(filepath)[0]

    # Filter for vehicle classes (car, truck, bus, motorcycle = 2, 5, 7, 3)
    vehicle_classes = {2, 3, 5, 7}
    vehicle_count = sum(1 for cls in results.boxes.cls if int(cls) in vehicle_classes)

    # Draw bounding boxes on image
    annotated_frame = results.plot()
    result_path = os.path.join(RESULT_FOLDER, filename)
    cv2.imwrite(result_path, annotated_frame)

    return jsonify({
        'vehicleCount': vehicle_count,
        'signalTime': max(10 + (vehicle_count * 2), 10),
        'detectedImage': f'/results/{filename}'
    })

@app.route('/results/<path:filename>')
def serve_result(filename):
    return send_from_directory(RESULT_FOLDER, filename)

if __name__ == '__main__':
    app.run(debug=True)
