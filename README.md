This repository contains all the scripting done for the selfdriving picar. It's a school project that requires a picar to move between two white lines, this is done using 2 scripts. Host.py is the script that the picar needs, this contains the live video streaming and the receiving of commands. The client.py script contains the line detection functions, using cv2.

To execute the host.py script, install the following dependencies using pip:
numpy
io
logging
socketserver
http
threading
picamera2
flask
time
threading

For the client.py script, install the following dependencies using pip:
cv2
numpy
urllib.request
requests
time

For traffic light detection on laptop or pc:
- Install yolov8 with pip3 install ultralytics

- Install pytorch with pip3 install pytorch or pip3 install torch torch-vision opencv-python (voor het installeren van torch en torchvision, check eerst de cuda versie die je hebt (je kunt nvidia-smi gebruiken en daar vind je het rechtsboven). En gebruik daarna de juiste versie. Ik heb het volgende gebruikt: pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu124)

- Install labelme for labeling with pip3 install labelme

- command for training: yolo task=detect mode=train data=path/to/dataset.yaml model=yolov8n.pt epochs=50 imgsz=512 (pas hierbij wel het path aan naar het correcte path en epochs naar het nummer runs dat je wil testen)

- voor testen met laptopcamera doe: pip install ultralytics opencv-python-headless en run dan Traffic_light_test_camera.py (pas het nummer in cv2.VideoCapture(...) aan om de juiste camera te pakken)
