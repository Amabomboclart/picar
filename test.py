from picamera2 import Picamera2
from PIL import Image
import io
import time
import numpy as np
import cv2
from back_wheels import Back_Wheels
from front_wheels import Front_Wheels

camera = Picamera2()
camera.start()
back_wheels = Back_Wheels()
front_wheels = Front_Wheels()

back_wheels.ready()
front_wheels.ready()

time.sleep(2)

def process_image_for_lines(image):
    img = np.array(image)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blurred, 50, 150)
    
    height, width = edges.shape
    mask = np.zeros_like(edges)
    mask[int(height / 2):, :] = 255  # Focus on the lower half
    cropped_edges = cv2.bitwise_and(edges, mask)
    
    lines = cv2.HoughLinesP(cropped_edges, 1, np.pi / 180, threshold=100, minLineLength=100, maxLineGap=50)
    return lines, img

# Car control functions
def turn_left():
    print("Turn Left")
    back_wheels.ready()
    front_wheels.ready()
    back_wheels.forward()
    front_wheels.turn_left()
    back_wheels.speed = 50

def turn_right():
    print("Turn Right")
    back_wheels.ready()
    front_wheels.ready()
    back_wheels.forward()
    front_wheels.turn_right()
    back_wheels.speed = 50

def go_straight():
    print("Go Straight")
    back_wheels.ready()
    front_wheels.ready()
    back_wheels.forward()
    front_wheels.turn_straight()
    back_wheels.speed = 80

def stop_car():
    print("Stop")
    back_wheels.stop()


def drive_car(lines, image_width):
    if lines is None:
        print("No lines detected!")
        stop_car()
        return

    # Extract line coordinates to find the leftmost and rightmost boundaries
    left_line = None
    right_line = None

    for line in lines:
        for x1, y1, x2, y2 in line:
            if x1 < image_width / 2 and (left_line is None or x1 < left_line[0]):
                left_line = (x1, y1, x2, y2)
            elif x1 > image_width / 2 and (right_line is None or x1 > right_line[0]):
                right_line = (x1, y1, x2, y2)

    if left_line and right_line:
        mid_x = (left_line[0] + right_line[0]) // 2
        if mid_x < image_width // 3:
            turn_left()
        elif mid_x > 2 * image_width // 3:
            turn_right()
        else:
            go_straight()
    else:
        stop_car()

try:
    while True:
        image_stream = io.BytesIO()
        camera.capture_file(image_stream, format="jpeg")
        image_stream.seek(0)

        original_img = Image.open(image_stream)
        flipped_img = original_img.transpose(method=Image.FLIP_TOP_BOTTOM).transpose(method=Image.FLIP_LEFT_RIGHT)
        
        lines, processed_img = process_image_for_lines(flipped_img)
        image_width = processed_img.shape[1]
        
        drive_car(lines, image_width)

        original_img.close()
        flipped_img.close()
        image_stream.close()
        time.sleep(0.1)

except KeyboardInterrupt:
    print("Stopping line-following loop.")
    stop_car()
    front_wheels.turn_straight()
    camera.stop()
    cv2.destroyAllWindows()
