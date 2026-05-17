import cv2
import numpy as np
import pickle
import os
from datetime import datetime
from database import Database

class FaceRecognitionSystem:
    def __init__(self):
        self.db = Database()
        
        # Détecteur de visage
        self.face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        )
        
        # Reconnaisseur LBPH
        self.recognizer = cv2.face.LBPHFaceRecognizer_create()
        
        # Chemins pour stocker les modèles
        self.training_dir = "training_data"
        if not os.path.exists(self.training_dir):
            os.makedirs(self.training_dir)
            
        self.model_path = "face_model.yml"
        self.labels_path = "face_labels.pkl"
        
        # Charger le modèle existant
        self.labels = {}
        self.load_model()
    
    def load_model(self):
        """Charger le modèle entraîné"""
        if os.path.exists(self.model_path) and os.path.exists(self.labels_path):
            self.recognizer.read(self.model_path)
            with open(self.labels_path, 'rb') as f:
                self.labels = pickle.load(f)
            print(f"✓ Modèle chargé: {len(self.labels)} étudiants")
        else:
            print("Aucun modèle existant, création d'un nouveau")
    
    def save_model(self):
        """Sauvegarder le modèle entraîné"""
        self.recognizer.write(self.model_path)
        with open(self.labels_path, 'wb') as f:
            pickle.dump(self.labels, f)
        print(f"✓ Modèle sauvegardé: {len(self.labels)} étudiants")
    
    def capture_face_samples(self, student_id, name, num_samples=30):
        """Capturer des échantillons du visage"""
        cap = cv2.VideoCapture(0)
        samples_count = 0
        
        print(f"\n📸 Capture d'échantillons pour {name}...")
        print("Regardez la caméra et tournez légèrement la tête")
        
        while samples_count < num_samples:
            ret, frame = cap.read()
            if not ret:
                continue
            
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            faces = self.face_cascade.detectMultiScale(gray, 1.3, 5)
            
            for (x, y, w, h) in faces:
                # Dessiner rectangle
                cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
                
                # Capturer le visage
                face_roi = gray[y:y+h, x:x+w]
                face_roi = cv2.resize(face_roi, (100, 100))
                
                # Sauvegarder l'image
                img_path = os.path.join(self.training_dir, f"{student_id}_{samples_count}.jpg")
                cv2.imwrite(img_path, face_roi)
                
                samples_count += 1
                
                # Afficher le progrès
                cv2.putText(frame, f"Samples: {samples_count}/{num_samples}", 
                           (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
                cv2.putText(frame, name, (x, y-10), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
            
            cv2.imshow('Capture des visages - Appuyez sur ESC pour annuler', frame)
            
            if cv2.waitKey(1) & 0xFF == 27:  # ESC
                break
        
        cap.release()
        cv2.destroyAllWindows()
        
        return samples_count >= num_samples
    
    def train_model(self):
        """Entraîner le modèle avec tous les visages capturés"""
        print("🔄 Entraînement du modèle en cours...")
        
        images = []
        labels = []
        
        # Parcourir toutes les images d'entraînement
        for filename in os.listdir(self.training_dir):
            if filename.endswith(".jpg"):
                # Extraire l'ID de l'étudiant du nom de fichier
                student_id = filename.split('_')[0]
                
                # Charger l'image
                img_path = os.path.join(self.training_dir, filename)
                img = cv2.imread(img_path, cv2.IMREAD_GRAYSCALE)
                
                if img is not None:
                    images.append(img)
                    
                    # Convertir l'ID en label numérique
                    if student_id not in self.labels:
                        self.labels[student_id] = len(self.labels)
                    labels.append(self.labels[student_id])
        
        if len(images) > 0:
            # Convertir en array numpy
            images = np.array(images)
            labels = np.array(labels)
            
            # Entraîner le recognizer
            self.recognizer.train(images, labels)
            
            # Sauvegarder le modèle
            self.save_model()
            print(f"✓ Modèle entraîné avec {len(images)} images")
            return True
        else:
            print("❌ Aucune image trouvée pour l'entraînement")
            return False
    
    def register_face(self, student_id, name, class_name):
        """Enregistrer un nouvel étudiant"""
        # 1. Capturer les échantillons
        if not self.capture_face_samples(student_id, name, num_samples=30):
            print("❌ Enregistrement annulé")
            return False
        
        # 2. Entraîner le modèle
        self.train_model()
        
        # 3. Sauvegarder dans la base de données
        dummy_encoding = pickle.dumps({"student_id": student_id, "name": name})
        self.db.add_student(student_id, name, dummy_encoding, class_name)
        
        print(f"✅ Étudiant {name} enregistré avec succès!")
        return True
    
    def start_recognition(self):
        """Démarrer la reconnaissance en temps réel"""
        if len(self.labels) == 0:
            print("❌ Aucun étudiant enregistré. Veuillez d'abord enregistrer des visages.")
            return
        
        # Inverser le dictionnaire labels pour retrouver les IDs
        reverse_labels = {v: k for k, v in self.labels.items()}
        
        cap = cv2.VideoCapture(0)
        
        # Pour éviter les enregistrements multiples
        last_recognition = {}
        
        print(f"\n🎯 Reconnaissance démarrée")
        print(f"📚 Étudiants enregistrés: {len(self.labels)}")
        print("⌨️ Appuyez sur 'q' pour quitter")
        print("⌨️ Appuyez sur 's' pour voir les statistiques")
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            faces = self.face_cascade.detectMultiScale(gray, 1.3, 5)
            
            for (x, y, w, h) in faces:
                # Extraire le visage
                face_roi = gray[y:y+h, x:x+w]
                face_roi = cv2.resize(face_roi, (100, 100))
                
                # Prédire
                label, confidence = self.recognizer.predict(face_roi)
                
                # Seuil de confiance (plus bas = meilleur)
                student_name = "Inconnu"
                student_id = None
                color = (0, 0, 255)  # Rouge par défaut
                
                if confidence < 70:  # Seuil ajustable
                    student_id = reverse_labels.get(label)
                    if student_id:
                        # Récupérer le nom depuis la base de données
                        student = self.db.get_student_by_id(student_id)
                        if student:
                            student_name = student.name
                            color = (0, 255, 0)  # Vert pour reconnu
                            
                            # Enregistrer la présence (une fois par minute)
                            current_time = datetime.now()
                            last_time = last_recognition.get(student_id)
                            
                            if not last_time or (current_time - last_time).seconds > 10:  # 10 secondes pour test
                                # Marquer la présence
                                success = self.db.mark_attendance(student_id, student_name)
                                if success:
                                    print(f"✅ {current_time.strftime('%H:%M:%S')} - {student_name} (ID: {student_id}) - PRÉSENCE ENREGISTRÉE")
                                    last_recognition[student_id] = current_time
                                    
                                    # Afficher confirmation sur l'image
                                    cv2.putText(frame, "PRESENCE ENREGISTREE!", (x, y-50),
                                              cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
                                else:
                                    print(f"ℹ️ {student_name} déjà enregistré aujourd'hui")
                
                # Afficher le nom et la confiance
                cv2.rectangle(frame, (x, y), (x+w, y+h), color, 2)
                if confidence < 70:
                    text = f"{student_name} ({100-confidence:.0f}%)"
                else:
                    text = f"{student_name} ({100-confidence:.0f}%)"
                cv2.putText(frame, text, (x, y-10), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
            
            # Afficher les statistiques
            cv2.putText(frame, f"Etudiants: {len(self.labels)}", (10, 30),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
            cv2.putText(frame, "Q: Quitter | S: Stats", (10, 60),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
            
            # Afficher le nombre de présences du jour
            today = datetime.now().strftime("%Y-%m-%d")
            today_count = len(self.db.get_attendance_by_date(today))
            cv2.putText(frame, f"Presences aujourd'hui: {today_count}", (10, 90),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 0), 1)
            
            cv2.imshow('Systeme de Presence - Reconnaissance Faciale', frame)
            
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):
                break
            elif key == ord('s'):
                # Afficher les statistiques
                print("\n=== STATISTIQUES ===")
                print(f"Étudiants enregistrés: {len(self.labels)}")
                today_count = len(self.db.get_attendance_by_date(datetime.now().strftime("%Y-%m-%d")))
                print(f"Présences aujourd'hui: {today_count}")
                
                # Afficher la liste des étudiants
                students = self.db.get_all_students()
                print("\nListe des étudiants:")
                for s in students:
                    print(f"  - {s.student_id}: {s.name}")
        
        cap.release()
        cv2.destroyAllWindows()
        print("👋 Reconnaissance arrêtée")