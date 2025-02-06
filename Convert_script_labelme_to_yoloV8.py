import json
import os
import shutil

def labelme_to_yolo(labelme_dir, output_dir, classes):
    """
    Converteer Labelme JSON-bestanden naar YOLOv8-compatibel formaat.
    Args:
        labelme_dir: Pad naar de map met Labelme JSON-bestanden en afbeeldingen.
        output_dir: Pad waar YOLOv8 bestanden moeten worden opgeslagen.
        classes: Lijst van klassen in dezelfde volgorde als hun class_id.
    """
    os.makedirs(output_dir, exist_ok=True)
    os.makedirs(os.path.join(output_dir, "labels"), exist_ok=True)
    os.makedirs(os.path.join(output_dir, "images"), exist_ok=True)

    for label_file in os.listdir(labelme_dir):
        if not label_file.endswith(".json"):
            continue

        label_path = os.path.join(labelme_dir, label_file)
        with open(label_path, 'r') as f:
            data = json.load(f)

        # Kopieer de afbeelding naar de YOLOv8 dataset
        img_path = os.path.join(labelme_dir, data['imagePath'])
        output_img_path = os.path.join(output_dir, "images", data['imagePath'])
        shutil.copy(img_path, output_img_path)

        # Maak een .txt-bestand voor YOLO labels
        txt_path = os.path.join(output_dir, "labels", os.path.splitext(data['imagePath'])[0] + '.txt')
        img_width = data['imageWidth']
        img_height = data['imageHeight']

        with open(txt_path, 'w') as txt_file:
            for shape in data['shapes']:
                label = shape['label']
                points = shape['points']
                
                # Bereken bounding box
                x_min = min(p[0] for p in points)
                y_min = min(p[1] for p in points)
                x_max = max(p[0] for p in points)
                y_max = max(p[1] for p in points)
                
                # Normaleer coördinaten naar 0-1
                x_center = ((x_min + x_max) / 2) / img_width
                y_center = ((y_min + y_max) / 2) / img_height
                width = (x_max - x_min) / img_width
                height = (y_max - y_min) / img_height
                
                # Schrijf de YOLO-indeling naar het bestand
                class_id = classes.index(label)
                txt_file.write(f"{class_id} {x_center:.6f} {y_center:.6f} {width:.6f} {height:.6f}\n")

# Klassenlijst: geef hier je labels op
classes = ["Red_Light", "Green_Light", "Yellow_Light", "All_Light"]

# Pad naar je Labelme JSON-bestanden en uitvoermap
labelme_to_yolo(r"C:\Users\robin\Python\self-driving-picar\All_Traffic_Light", r"C:\Users\robin\Python\self-driving-picar\YoloV8_Traffic_Light_Model", classes)
