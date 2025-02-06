from ultralytics import YOLO
import cv2

# Load the trained YOLOv8 model
model = YOLO(r"C:\Users\robin\Python\self-driving-picar\YoloV8_train_model\best.pt")

# Open the laptop's camera (0 is usually the default camera ID)
cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("Error: Could not open the camera.")
    exit()

# Set video frame width and height (optional)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

print("Press 'q' to exit")

while True:
    ret, frame = cap.read()
    if not ret:
        print("Error: Unable to capture video")
        break

    # Perform inference
    results = model.predict(source=frame, save=False, conf=0.5, show=True)

    # Display the predictions
    annotated_frame = results[0].plot()
    cv2.imshow("YOLOv8 Real-Time Detection", annotated_frame)

    # Break the loop if 'q' is pressed
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# Release the camera and close all OpenCV windows
cap.release()
cv2.destroyAllWindows()
