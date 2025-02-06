import cv2
import numpy as np
import urllib.request
import requests
import time  # Import the time module

# Replace with your Pi's IP address and port for controlling the car
PI_SERVER_IP = "http://10.10.40.23:5000"

url = "http://10.10.40.23:7123/stream.mjpg"  # MJPEG stream URL from the Pi

def send_command(command):
    """Send a control command to the PiCar"""
    try:
        # Send a POST request with the command as JSON
        response = requests.post(f"{PI_SERVER_IP}/move", json={"command": command})
        print(f"Sent {command}: {response.text}")
    except requests.exceptions.RequestException as e:
        print(f"Error sending command: {e}")

try:
    stream = urllib.request.urlopen(url)
    byte_data = b""

    while True:
        byte_data += stream.read(1024)

        start_idx = byte_data.find(b'\xff\xd8')  # Start of JPEG
        end_idx = byte_data.find(b'\xff\xd9')    # End of JPEG

        if start_idx != -1 and end_idx != -1:
            jpg_data = byte_data[start_idx:end_idx+2]
            byte_data = byte_data[end_idx+2:]

            img_array = np.frombuffer(jpg_data, dtype=np.uint8)
            frame = cv2.imdecode(img_array, cv2.IMREAD_COLOR)

            if frame is not None:
                # Flip the image 180 degrees
                flipped_frame = cv2.rotate(frame, cv2.ROTATE_180)

                # Crop the top 60% of the flipped frame
                height, width = flipped_frame.shape[:2]
                crop_start = int(0.4 * height)
                cropped_frame = flipped_frame[crop_start:, :]

                # Convert the cropped frame to grayscale
                gray_frame = cv2.cvtColor(cropped_frame, cv2.COLOR_BGR2GRAY)

                # Edge detection on the grayscale frame
                edges = cv2.Canny(gray_frame, 50, 150)

                # Probabilistic Hough Line Transform
                lines = cv2.HoughLinesP(edges, 1, np.pi / 180, 100, minLineLength=50, maxLineGap=10)

                # Draw lines on the cropped frame
                processed_frame = cv2.cvtColor(gray_frame, cv2.COLOR_GRAY2BGR)  # Convert back to BGR for drawing
                left_line = None
                right_line = None

                if lines is not None:
                    for x1, y1, x2, y2 in lines[:, 0]:
                        cv2.line(processed_frame, (x1, y1), (x2, y2), (0, 0, 255), 2)

                        # Determine which side has the most significant line
                        if x1 < width / 2 and x2 < width / 2:  # Left side
                            left_line = (x1 + x2) / 2
                        elif x1 > width / 2 and x2 > width / 2:  # Right side
                            right_line = (x1 + x2) / 2

                    # Now, check if both lines are detected and decide the movement
                    if left_line and right_line:
                        # Check if both lines are near the center
                        if abs(left_line - right_line) < 50:  # Lines are near the center, move straight
                            send_command("straight")
                        else:
                            # Turn towards the side with the largest difference
                            if left_line > right_line:
                                send_command("left")
                            else:
                                send_command("right")
                    else:
                        # If no lines detected, stop the car
                        send_command("stop")

                # Show the original flipped stream
                cv2.imshow("Original Stream", flipped_frame)

                # Show the processed stream (cropped and black-and-white)
                cv2.imshow("Processed Stream", processed_frame)

                # Exit on 'q'
                if cv2.waitKey(1) & 0xFF == ord('q'):
                    break

                # Add a delay to reduce the load on the server
                time.sleep(0.1)  # 0.1 second delay (adjust as needed)

except Exception as e:
    print(f"Error: {e}")

cv2.destroyAllWindows()
