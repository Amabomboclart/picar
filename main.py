from picamera2 import Picamera2
from PIL import Image, ImageOps
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
    _, thresh = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY_INV)
    edges = cv2.Canny(thresh, 50, 150)
    contours = cv2.HoughLines(edges, 1, np.pi/180, 200)

# # Draw the lines on the original image
#     if lines is not None:
#         for rho, theta in lines[:, 0]:
#             a = np.cos(theta)
#             b = np.sin(theta)
#             x0 = a * rho
#             y0 = b * rho
#             x1 = int(x0 + 1000 * (-b))
#             x2 = int(x0 - 1000 * (-b))
#             y1 = int(y0 + 1000 * (a))
#             y2 = int(y0 - 1000 * (a))
#             cv2.line(image, (x1, y1), (x2, y2), (0, 0, 255), 2)
    #contours, _ = cv2.findContours(edges, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    cv2.drawContours(img, contours, -1, (0, 255, 0), 3)
    return contours, img

# Functions for xar control actions
def turn_left():
    print("Turn Left")
    front_wheels.turn_left()
    back_wheels.speed = 50
    back_wheels.forward()

def turn_right():
    print("Turn Right")
    front_wheels.turn_right()
    back_wheels.speed = 50
    back_wheels.forward()

def go_straight():
    print("Go Straight")
    front_wheels.turn_straight()
    back_wheels.speed = 80
    back_wheels.forward()

def stop_car():
    print("Stop")
    back_wheels.stop()

def drive_car(contours):
    if len(contours) == 0:
        print("No line detected!")
        stop_car()
        return

    largest_contour = max(contours, key=cv2.contourArea)
    moments = cv2.moments(largest_contour)
    if moments["m00"] != 0:
        cx = int(moments["m10"] / moments["m00"])
        image_width = 640 

        if cx < image_width // 3:
            turn_left()
        elif cx > 2 * image_width // 3:
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
        
        contours, processed_img = process_image_for_lines(flipped_img)
        drive_car(contours)

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
