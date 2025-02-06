import numpy as np
import io
import logging
import socketserver
from http import server
from threading import Condition
from picamera2 import Picamera2
from picamera2.encoders import JpegEncoder
from picamera2.outputs import FileOutput
from flask import Flask, request, jsonify
from back_wheels import Back_Wheels
from front_wheels import Front_Wheels
import time
import threading

# Initialize the motors
back_wheels = Back_Wheels()
front_wheels = Front_Wheels()

back_wheels.ready()
front_wheels.ready()

time.sleep(2)

# MJPEG Streaming Page
PAGE = """\
<html>
<head>
<title>picamera2 MJPEG streaming demo</title>
</head>
<body>
<h1>Picamera2 MJPEG Streaming Demo</h1>
<img src="stream.mjpg" width="640" height="480" style="transform: rotate(180deg);" />
</body>
</html>
"""

# MJPEG Streaming Output class
class StreamingOutput(io.BufferedIOBase):
    def __init__(self):
        self.frame = None
        self.condition = Condition()

    def write(self, buf):
        with self.condition:
            self.frame = buf
            self.condition.notify_all()

# MJPEG Streaming Handler
class StreamingHandler(server.BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.send_response(301)
            self.send_header('Location', '/index.html')
            self.end_headers()
        elif self.path == '/index.html':
            content = PAGE.encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.send_header('Content-Length', len(content))
            self.end_headers()
            self.wfile.write(content)
        elif self.path == '/stream.mjpg':
            self.send_response(200)
            self.send_header('Age', 0)
            self.send_header('Cache-Control', 'no-cache, private')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Content-Type', 'multipart/x-mixed-replace; boundary=FRAME')
            self.end_headers()
            try:
                while True:
                    with output.condition:
                        output.condition.wait()
                        frame = output.frame
                    self.wfile.write(b'--FRAME\r\n')
                    self.send_header('Content-Type', 'image/jpeg')
                    self.send_header('Content-Length', len(frame))
                    self.end_headers()
                    self.wfile.write(frame)
                    self.wfile.write(b'\r\n')
            except Exception as e:
                logging.warning(
                    'Removed streaming client %s: %s',
                    self.client_address, str(e))
        else:
            self.send_error(404)
            self.end_headers()

# Streaming Server class
class StreamingServer(socketserver.ThreadingMixIn, server.HTTPServer):
    allow_reuse_address = True
    daemon_threads = True

# Control Logic (Flask server to receive commands)
app = Flask(__name__)

@app.route('/move', methods=['POST'])
def move():
    data = request.get_json()
    command = data.get('command')

    if command == 'left':
        print("Turn Left")
        front_wheels.turn_left()
        back_wheels.speed = 50
        back_wheels.forward()
        return jsonify({"status": "success", "message": "Turning Left"}), 200
    elif command == 'right':
        print("Turn Right")
        front_wheels.turn_right()
        back_wheels.speed = 50
        back_wheels.forward()
        return jsonify({"status": "success", "message": "Turning Right"}), 200
    elif command == 'straight':
        print("Go Straight")
        front_wheels.turn_straight()
        back_wheels.speed = 80
        back_wheels.forward()
        return jsonify({"status": "success", "message": "Going Straight"}), 200
    elif command == 'stop':
        print("Stop")
        back_wheels.stop()
        return jsonify({"status": "success", "message": "Car Stopped"}), 200
    else:
        return jsonify({"status": "error", "message": "Invalid command"}), 400

# MJPEG Stream Setup
picam2 = Picamera2()
picam2.configure(picam2.create_video_configuration(main={"size": (640, 480)}))
output = StreamingOutput()
picam2.start_recording(JpegEncoder(), FileOutput(output))

# Start MJPEG Streaming Server
try:
    # MJPEG server address
    address = ('10.10.40.23', 7123)
    streaming_server = StreamingServer(address, StreamingHandler)
    streaming_server_thread = threading.Thread(target=streaming_server.serve_forever)
    streaming_server_thread.start()
    
    # Start Flask server for PiCar control
    app.run(host='0.0.0.0', port=5000, threaded=True)

finally:
    picam2.stop_recording()
