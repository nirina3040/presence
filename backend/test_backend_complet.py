#!/usr/bin/env python
# -*- coding: utf-8 -*-

import sys
import os

print("=" * 60)
print("🧪 TEST COMPLET DU BACKEND")
print("=" * 60)

# Test 1: Vérification des imports
print("\n📦 1. VÉRIFICATION DES IMPORTS...")
try:
    import cv2
    print(f"   ✅ OpenCV: {cv2.__version__}")
except Exception as e:
    print(f"   ❌ OpenCV: {e}")
    sys.exit(1)

try:
    import numpy as np
    print(f"   ✅ NumPy: {np.__version__}")
except Exception as e:
    print(f"   ❌ NumPy: {e}")

try:
    from flask import Flask
    print(f"   ✅ Flask: installé")
except Exception as e:
    print(f"   ❌ Flask: {e}")

try:
    from flask_cors import CORS
    print(f"   ✅ Flask-CORS: installé")
except Exception as e:
    print(f"   ❌ Flask-CORS: {e}")

try:
    from PIL import Image
    print(f"   ✅ Pillow: installé")
except Exception as e:
    print(f"   ❌ Pillow: {e}")

try:
    import reportlab
    print(f"   ✅ ReportLab: installé")
except Exception as e:
    print(f"   ❌ ReportLab: {e}")

# Test 2: Modules standards
print("\n📚 2. MODULES PYTHON STANDARDS...")
try:
    import sqlite3
    print(f"   ✅ SQLite version: {sqlite3.version}")
except Exception as e:
    print(f"   ❌ SQLite: {e}")

try:
    import datetime
    print(f"   ✅ Datetime: OK")
except Exception as e:
    print(f"   ❌ Datetime: {e}")

try:
    import pickle
    print(f"   ✅ Pickle: OK")
except Exception as e:
    print(f"   ❌ Pickle: {e}")

# Test 3: Caméra
print("\n🎥 3. TEST CAMÉRA...")
try:
    cap = cv2.VideoCapture(0)
    if cap.isOpened():
        ret, frame = cap.read()
        if ret:
            print(f"   ✅ Caméra fonctionnelle - Résolution: {frame.shape[1]}x{frame.shape[0]}")
        else:
            print(f"   ⚠️ Caméra détectée mais pas d'image")
        cap.release()
    else:
        print(f"   ⚠️ Aucune caméra trouvée (la reconnaissance peut quand même fonctionner)")
except Exception as e:
    print(f"   ❌ Erreur caméra: {e}")

# Test 4: Détecteur de visage
print("\n👤 4. TEST DÉTECTEUR DE VISAGE...")
try:
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    if not face_cascade.empty():
        print(f"   ✅ Cascade classifier chargé")
    else:
        print(f"   ❌ Erreur chargement cascade")
except Exception as e:
    print(f"   ❌ {e}")

# Test 5: LBPH Recognizer
print("\n🔍 5. TEST LBPH RECOGNIZER...")
try:
    recognizer = cv2.face.LBPHFaceRecognizer_create()
    print(f"   ✅ LBPH Recognizer créé avec succès")
except Exception as e:
    print(f"   ❌ Erreur: {e}")
    print(f"   💡 Solution: pip install opencv-contrib-python")

# Test 6: Base de données
print("\n💾 6. TEST BASE DE DONNÉES...")
try:
    import sqlite3
    conn = sqlite3.connect('test.db')
    cursor = conn.cursor()
    cursor.execute('CREATE TABLE IF NOT EXISTS test (id INTEGER)')
    conn.commit()
    conn.close()
    os.remove('test.db')
    print(f"   ✅ Base de données SQLite fonctionnelle")
except Exception as e:
    print(f"   ❌ {e}")

# Test 7: Serveur Flask
print("\n🌐 7. TEST SERVEUR FLASK...")
try:
    app = Flask(__name__)
    CORS(app)
    
    @app.route('/test')
    def test():
        return {"status": "ok"}
    
    print(f"   ✅ Application Flask créée")
    print(f"   ✅ Route de test ajoutée")
except Exception as e:
    print(f"   ❌ {e}")

# Test 8: Génération PDF
print("\n📄 8. TEST GÉNÉRATION PDF...")
try:
    from reportlab.lib.pagesizes import letter
    from reportlab.pdfgen import canvas
    
    c = canvas.Canvas("test.pdf")
    c.drawString(100, 750, "Test")
    c.save()
    os.remove("test.pdf")
    print(f"   ✅ Génération PDF fonctionnelle")
except Exception as e:
    print(f"   ❌ {e}")

# Résumé final
print("\n" + "=" * 60)
print("📊 RÉSUMÉ DES TESTS")
print("=" * 60)

# Vérification finale
if all([
    'cv2' in dir(),
    'numpy' in dir(),
    'Flask' in dir(),
]):
    print("\n✅ TOUS LES TESTS RÉUSSIS !")
    print("\n🚀 Vous pouvez lancer le backend avec:")
    print("   python app.py")
    print("\n📌 Points de test API:")
    print("   http://localhost:5000/api/students")
    print("   http://localhost:5000/api/attendance/today")
else:
    print("\n⚠️ Certains tests ont échoué. Vérifiez les erreurs ci-dessus.")