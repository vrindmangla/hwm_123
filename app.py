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
model_coco = YOLO("yolov8n.pt")        # Pretrained COCO model
model_custom = YOLO("best.pt")         # Your custom retrained model # You can replace with 'yolov8m.pt', 'yolov8s.pt' or custom weights

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
    results_coco = model_coco(filepath)[0]
    results_custom = model_custom(filepath)[0]

    vehicle_classes = {2, 3, 5, 7}
    vehicle_count = sum(1 for cls in results_coco.boxes.cls if int(cls) in vehicle_classes)

    emergency_classes = {80, 81}  # assuming your custom model labels are 0: ambulance, 1: fire truck
    emergency_detected = any(int(cls) in emergency_classes for cls in results_custom.boxes.cls)

    frame = cv2.imread(filepath)
    annotated_frame = results_coco.plot()
    
    for box in results_custom.boxes:
        cls_id = int(box.cls[0])
        if cls_id in emergency_classes:  # only for custom emergency classes
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            label = "ambulance" if cls_id == 80 else "fire truck"
            conf = float(box.conf[0])
            text = f"{label} {conf:.2f}"

            (tw, th), baseline = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)


            cv2.rectangle(
            annotated_frame,
            (x1, y1 - th - baseline - 3),
            (x1 + tw, y1),
            (0, 0, 255),
            -1  # filled
            )
            cv2.putText(
            annotated_frame,
            text,
            (x1, y1 - baseline - 2),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (255, 255, 255),  # white text
            2
            )

            cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
    
    result_path = os.path.join(RESULT_FOLDER, filename)
    cv2.imwrite(result_path, annotated_frame)

    signal_time = min(max(10 + (vehicle_count * 2), 10),65)
    if emergency_detected:
        signal_time += 10  # extend green time for emergency vehicles

    

    return jsonify({
        'vehicleCount': vehicle_count,
        'emergencyDetected': emergency_detected,
        'signalTime': signal_time,
        'detectedImage': f'/results/{filename}'
       
    })

@app.route('/results/<path:filename>')
def serve_result(filename):
    return send_from_directory(RESULT_FOLDER, filename)

if __name__ == '__main__':
    app.run(debug=True)
