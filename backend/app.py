from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from face_recognition_system import FaceRecognitionSystem
from report_generator import ReportGenerator
from database import Database
import threading
import os
import cv2

app = Flask(__name__)
CORS(app)

# Initialisation des composants
recognition_system = FaceRecognitionSystem()
report_gen = ReportGenerator()
db = Database()

recognition_thread = None

@app.route('/api/students', methods=['GET'])
def get_students():
    """Récupérer tous les étudiants"""
    students = db.get_all_students()
    return jsonify({
        'students': [s.to_dict() for s in students],
        'count': len(students)
    })

@app.route('/api/students/<student_id>', methods=['GET'])
def get_student(student_id):
    """Récupérer un étudiant par son ID"""
    student = db.get_student_by_id(student_id)
    if student:
        return jsonify(student.to_dict())
    return jsonify({'error': 'Student not found'}), 404

@app.route('/api/students/<student_id>', methods=['PUT'])
def update_student(student_id):
    """Mettre à jour un étudiant"""
    data = request.json
    name = data.get('name')
    class_name = data.get('class_name')
    email = data.get('email')
    phone = data.get('phone')
    address = data.get('address')
    photo = data.get('photo')
    
    success = db.update_student(student_id, name, class_name, email, phone, address, photo)
    
    if success:
        return jsonify({'success': True, 'message': 'Étudiant mis à jour avec succès'})
    else:
        return jsonify({'success': False, 'message': 'Erreur lors de la mise à jour'}), 404

@app.route('/api/students/<student_id>', methods=['DELETE'])
def delete_student(student_id):
    """Supprimer un étudiant"""
    success = db.delete_student(student_id)
    if success:
        return jsonify({'success': True, 'message': 'Étudiant supprimé avec succès'})
    return jsonify({'success': False, 'message': 'Étudiant non trouvé'}), 404

@app.route('/api/register', methods=['POST'])
def register_student():
    """Enregistrer un nouvel étudiant avec tous les champs"""
    data = request.json
    student_id = data.get('student_id')
    name = data.get('name')
    class_name = data.get('class_name')
    email = data.get('email')
    phone = data.get('phone')
    address = data.get('address')
    photo = data.get('photo')
    
    # Vérifier si l'étudiant existe déjà
    existing = db.get_student_by_id(student_id)
    if existing:
        return jsonify({'success': False, 'message': 'ID étudiant existe déjà'})
    
    # Lancer l'enregistrement facial
    success = recognition_system.register_face(student_id, name, class_name)
    
    if success:
        # Mettre à jour l'étudiant avec les informations supplémentaires
        db.update_student(student_id, name, class_name, email, phone, address, photo)
        return jsonify({'success': True, 'message': 'Étudiant enregistré avec succès'})
    else:
        return jsonify({'success': False, 'message': "Erreur lors de l'enregistrement facial"})

@app.route('/api/start-recognition', methods=['POST'])
def start_recognition():
    """Démarrer la reconnaissance faciale (version thread)"""
    def run_recognition():
        recognition_system.start_recognition()
    
    global recognition_thread
    if recognition_thread is None or not recognition_thread.is_alive():
        recognition_thread = threading.Thread(target=run_recognition)
        recognition_thread.daemon = True
        recognition_thread.start()
        return jsonify({'status': 'recognition started', 'message': 'Reconnaissance démarrée'})
    else:
        return jsonify({'status': 'already running', 'message': 'Reconnaissance déjà en cours'})

@app.route('/api/attendance/today', methods=['GET'])
def get_today_attendance():
    """Récupérer les présences du jour"""
    from datetime import datetime
    today = datetime.now().strftime("%Y-%m-%d")
    records = db.get_attendance_by_date(today)
    stats = db.get_attendance_stats(today)
    
    return jsonify({
        'date': today,
        'records': [r.to_dict() for r in records],
        'stats': stats
    })

@app.route('/api/attendance/<date>', methods=['GET'])
def get_attendance_by_date(date):
    """Récupérer les présences par date"""
    records = db.get_attendance_by_date(date)
    stats = db.get_attendance_stats(date)
    
    return jsonify({
        'date': date,
        'records': [r.to_dict() for r in records],
        'stats': stats
    })

@app.route('/api/attendance/range/<start_date>/<end_date>', methods=['GET'])
def get_attendance_range(start_date, end_date):
    """Récupérer les présences sur une période"""
    records = db.get_attendance_by_date_range(start_date, end_date)
    return jsonify({
        'start_date': start_date,
        'end_date': end_date,
        'records': [r.to_dict() for r in records],
        'count': len(records)
    })

@app.route('/api/report/daily/<date>', methods=['GET'])
def get_daily_report(date):
    """Générer et télécharger le rapport PDF quotidien"""
    try:
        filename = report_gen.generate_daily_report(date)
        return send_file(filename, as_attachment=True, download_name=f'rapport_presence_{date}.pdf')
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/report/monthly/<int:year>/<int:month>', methods=['GET'])
def get_monthly_report(year, month):
    """Générer et télécharger le rapport PDF mensuel"""
    try:
        filename = report_gen.generate_monthly_report(year, month)
        return send_file(filename, as_attachment=True)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Récupérer les statistiques globales"""
    from datetime import datetime
    today = datetime.now().strftime("%Y-%m-%d")
    
    total_students = db.get_students_count()
    today_stats = db.get_attendance_stats(today)
    
    return jsonify({
        'total_students': total_students,
        'today': today_stats,
        'system_status': 'running'
    })

@app.route('/api/classes', methods=['GET'])
def get_classes():
    """Récupérer la liste des classes uniques"""
    students = db.get_all_students()
    classes = list(set([s.class_name for s in students if s.class_name]))
    return jsonify({'classes': classes})

@app.route('/api/health', methods=['GET'])
def health_check():
    """Vérifier l'état du backend"""
    try:
        cap = cv2.VideoCapture(0)
        camera_ok = cap.isOpened()
        cap.release()
    except:
        camera_ok = False
    
    return jsonify({
        'status': 'healthy',
        'database': 'connected',
        'camera': 'available' if camera_ok else 'unavailable',
        'students_count': db.get_students_count()
    })

if __name__ == '__main__':
    print("=" * 50)
    print("🚀 Démarrage du backend de reconnaissance faciale")
    print("=" * 50)
    print(f"📊 Base de données: {db.db_path}")
    print(f"👥 Étudiants enregistrés: {db.get_students_count()}")
    print(f"🎯 Reconnaissance: {'Modèle chargé' if recognition_system.labels else 'Aucun modèle'}")
    print("=" * 50)
    print("🌐 Serveur démarré sur http://localhost:5000")
    print("📋 API endpoints disponibles:")
    print("   GET  /api/students")
    print("   GET  /api/attendance/today")
    print("   POST /api/register")
    print("   PUT  /api/students/<id>")
    print("   DELETE /api/students/<id>")
    print("   POST /api/start-recognition")
    print("   GET  /api/report/daily/<date>")
    print("   GET  /api/classes")
    print("=" * 50)
    print("\n💡 Pour lancer la reconnaissance faciale:")
    print("   python run_recognition.py")
    print("=" * 50)
    
    app.run(debug=True, port=5000)