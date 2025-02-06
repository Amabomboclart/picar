import os
import shutil
import random
from collections import defaultdict

def organize_dataset(images_dir, labels_dir, output_dir, val_ratio=0.1):
    """
    Organiseer een dataset in YOLO formaat in train en val sets.
    
    :param images_dir: Map met afbeeldingen.
    :param labels_dir: Map met corresponderende YOLO labels (.txt bestanden).
    :param output_dir: Map waar de geordende dataset opgeslagen wordt.
    :param val_ratio: Percentage van dataset dat in validatieset moet komen.
    """
    # Output directories maken
    train_images_dir = os.path.join(output_dir, "train/images")
    train_labels_dir = os.path.join(output_dir, "train/labels")
    val_images_dir = os.path.join(output_dir, "val/images")
    val_labels_dir = os.path.join(output_dir, "val/labels")
    
    os.makedirs(train_images_dir, exist_ok=True)
    os.makedirs(train_labels_dir, exist_ok=True)
    os.makedirs(val_images_dir, exist_ok=True)
    os.makedirs(val_labels_dir, exist_ok=True)
    
    # Verzamelen van bestanden
    labels_files = [f for f in os.listdir(labels_dir) if f.endswith('.txt')]
    class_to_files = defaultdict(list)
    
    for label_file in labels_files:
        label_path = os.path.join(labels_dir, label_file)
        with open(label_path, 'r') as f:
            for line in f:
                class_id = line.split()[0]  # Eerste kolom is class_id
                class_to_files[class_id].append(label_file)
                break  # Voeg alleen het bestand toe, één keer per label
    
    # Zorg ervoor dat minstens één voorbeeld per klasse in de validatieset zit
    val_files = set()
    for class_id, files in class_to_files.items():
        random.shuffle(files)
        val_files.add(files[0])  # Eén voorbeeld van deze klasse toevoegen
    
    # Voeg extra bestanden toe aan de validatieset op basis van de verhouding
    all_files = list(set(labels_files) - val_files)
    random.shuffle(all_files)
    val_count = int(len(labels_files) * val_ratio)
    val_files.update(all_files[:val_count])
    
    # Bestanden verdelen
    for label_file in labels_files:
        label_path = os.path.join(labels_dir, label_file)
        image_file = label_file.replace('.txt', '.png')  # Zorg dat extensies kloppen
        image_path = os.path.join(images_dir, image_file)
        
        if label_file in val_files:
            shutil.copy(image_path, val_images_dir)
            shutil.copy(label_path, val_labels_dir)
        else:
            shutil.copy(image_path, train_images_dir)
            shutil.copy(label_path, train_labels_dir)
    
    print(f"Dataset georganiseerd in '{output_dir}'")
    print(f"Train set: {len(os.listdir(train_images_dir))} afbeeldingen")
    print(f"Validation set: {len(os.listdir(val_images_dir))} afbeeldingen")

# Parameters instellen
images_dir = r"C:\Users\robin\Python\self-driving-picar\YoloV8_Traffic_Light_Model\images"  # Map met je afbeeldingen
labels_dir = r"C:\Users\robin\Python\self-driving-picar\YoloV8_Traffic_Light_Model\labels"  # Map met je YOLO labels
output_dir = r"C:\Users\robin\Python\self-driving-picar\YoloV8_train_model"  # Waar de geordende dataset moet worden opgeslagen

# Functie aanroepen
organize_dataset(images_dir, labels_dir, output_dir, val_ratio=0.1)
