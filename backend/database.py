import sqlite3
import os
import pickle
from datetime import datetime
from models.student import Student
from models.attendance import Attendance

class Database:
    def __init__(self):
        # Créer le dossier database s'il n'existe pas
        os.makedirs('database', exist_ok=True)
        
        self.db_path = 'database/attendance.db'
        self.conn = sqlite3.connect(self.db_path, check_same_thread=False)
        self.conn.row_factory = sqlite3.Row
        self.create_tables()
    
    def create_tables(self):
        """Crée les tables si elles n'existent pas"""
        cursor = self.conn.cursor()
        
        # Table étudiants avec tous les champs
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS students (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                class_name TEXT,
                email TEXT,
                phone TEXT,
                address TEXT,
                photo TEXT,
                face_encoding BLOB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Table présence
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS attendance (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id TEXT NOT NULL,
                name TEXT NOT NULL,
                date TEXT NOT NULL,
                time TEXT NOT NULL,
                status TEXT DEFAULT 'present',
                FOREIGN KEY (student_id) REFERENCES students(student_id)
            )
        ''')
        
        # Index pour accélérer les recherches
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id)')
        
        self.conn.commit()
    
    # ========== Méthodes Student ==========
    
    def add_student(self, student_id, name, face_encoding, class_name, 
                    email=None, phone=None, address=None, photo=None):
        """Ajoute un nouvel étudiant avec tous les champs"""
        try:
            cursor = self.conn.cursor()
            cursor.execute('''
                INSERT INTO students 
                (student_id, name, face_encoding, class_name, email, phone, address, photo) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (student_id, name, face_encoding, class_name, email, phone, address, photo))
            self.conn.commit()
            return True
        except sqlite3.IntegrityError:
            print(f"❌ L'étudiant {student_id} existe déjà")
            return False
    
    def get_student_by_id(self, student_id):
        """Récupère un étudiant par son ID"""
        cursor = self.conn.cursor()
        cursor.execute("SELECT * FROM students WHERE student_id = ?", (student_id,))
        row = cursor.fetchone()
        if row:
            return Student.from_db_row(row)
        return None
    
    def get_all_students(self):
        """Récupère tous les étudiants (sans face_encoding pour performance)"""
        cursor = self.conn.cursor()
        cursor.execute("SELECT id, student_id, name, class_name, email, phone, address, photo, created_at FROM students ORDER BY name")
        rows = cursor.fetchall()
        students = []
        for row in rows:
            student = Student()
            student.id = row[0]
            student.student_id = row[1]
            student.name = row[2]
            student.class_name = row[3]
            student.email = row[4] if len(row) > 4 else None
            student.phone = row[5] if len(row) > 5 else None
            student.address = row[6] if len(row) > 6 else None
            student.photo = row[7] if len(row) > 7 else None
            
            # Gérer la date (colonne 8)
            if len(row) > 8 and row[8]:
                if isinstance(row[8], str):
                    try:
                        student.created_at = datetime.strptime(row[8], '%Y-%m-%d %H:%M:%S')
                    except:
                        student.created_at = datetime.now()
                else:
                    student.created_at = row[8]
            else:
                student.created_at = datetime.now()
            
            students.append(student)
        
        return students
    
    def get_students_count(self):
        """Retourne le nombre total d'étudiants"""
        cursor = self.conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM students")
        return cursor.fetchone()[0]
    
    def update_student(self, student_id, name=None, class_name=None, 
                       email=None, phone=None, address=None, photo=None):
        """Met à jour les informations d'un étudiant"""
        cursor = self.conn.cursor()
        
        # Construire la requête dynamiquement
        updates = []
        params = []
        
        if name is not None:
            updates.append("name = ?")
            params.append(name)
        if class_name is not None:
            updates.append("class_name = ?")
            params.append(class_name)
        if email is not None:
            updates.append("email = ?")
            params.append(email)
        if phone is not None:
            updates.append("phone = ?")
            params.append(phone)
        if address is not None:
            updates.append("address = ?")
            params.append(address)
        if photo is not None:
            updates.append("photo = ?")
            params.append(photo)
        
        if updates:
            params.append(student_id)
            query = f"UPDATE students SET {', '.join(updates)} WHERE student_id = ?"
            cursor.execute(query, params)
            self.conn.commit()
            return True
        return False
    
    def delete_student(self, student_id):
        """Supprime un étudiant et ses présences associées"""
        cursor = self.conn.cursor()
        # Supprimer d'abord les présences (clé étrangère)
        cursor.execute("DELETE FROM attendance WHERE student_id = ?", (student_id,))
        # Puis supprimer l'étudiant
        cursor.execute("DELETE FROM students WHERE student_id = ?", (student_id,))
        self.conn.commit()
        return cursor.rowcount > 0
    
    # ========== Méthodes Attendance ==========
    
    def mark_attendance(self, student_id, name):
        """Marque la présence d'un étudiant"""
        today = datetime.now().strftime("%Y-%m-%d")
        time_now = datetime.now().strftime("%H:%M:%S")
        
        cursor = self.conn.cursor()
        
        # Vérifier si déjà présent aujourd'hui
        cursor.execute(
            "SELECT * FROM attendance WHERE student_id = ? AND date = ?",
            (student_id, today)
        )
        
        if not cursor.fetchone():
            cursor.execute(
                "INSERT INTO attendance (student_id, name, date, time) VALUES (?, ?, ?, ?)",
                (student_id, name, today, time_now)
            )
            self.conn.commit()
            return True
        return False
    
    def get_attendance_by_date(self, date):
        """Récupère toutes les présences pour une date donnée"""
        cursor = self.conn.cursor()
        cursor.execute(
            "SELECT * FROM attendance WHERE date = ? ORDER BY time",
            (date,)
        )
        rows = cursor.fetchall()
        return [Attendance.from_db_row(row) for row in rows]
    
    def get_attendance_by_date_range(self, start_date, end_date):
        """Récupère les présences sur une période"""
        cursor = self.conn.cursor()
        cursor.execute(
            "SELECT * FROM attendance WHERE date BETWEEN ? AND ? ORDER BY date, time",
            (start_date, end_date)
        )
        rows = cursor.fetchall()
        return [Attendance.from_db_row(row) for row in rows]
    
    def get_attendance_by_student(self, student_id):
        """Récupère l'historique des présences d'un étudiant"""
        cursor = self.conn.cursor()
        cursor.execute(
            "SELECT * FROM attendance WHERE student_id = ? ORDER BY date DESC",
            (student_id,)
        )
        rows = cursor.fetchall()
        return [Attendance.from_db_row(row) for row in rows]
    
    def get_today_attendance(self):
        """Récupère les présences du jour"""
        today = datetime.now().strftime("%Y-%m-%d")
        return self.get_attendance_by_date(today)
    
    def get_attendance_stats(self, date):
        """Récupère les statistiques de présence pour une date"""
        total_students = self.get_students_count()
        present_students = len(self.get_attendance_by_date(date))
        
        return {
            'date': date,
            'total_students': total_students,
            'present_count': present_students,
            'absent_count': total_students - present_students,
            'attendance_rate': (present_students / total_students * 100) if total_students > 0 else 0
        }
    
    def get_monthly_stats(self, year, month):
        """Récupère les statistiques mensuelles"""
        start_date = f"{year}-{month:02d}-01"
        
        # Calculer le dernier jour du mois
        if month == 12:
            end_date = f"{year + 1}-01-01"
        else:
            end_date = f"{year}-{month + 1:02d}-01"
        
        cursor = self.conn.cursor()
        cursor.execute(
            "SELECT date, COUNT(*) FROM attendance WHERE date BETWEEN ? AND ? GROUP BY date",
            (start_date, end_date)
        )
        
        daily_stats = {}
        for row in cursor.fetchall():
            daily_stats[row[0]] = row[1]
        
        return {
            'year': year,
            'month': month,
            'daily_stats': daily_stats
        }
    
    def get_classes(self):
        """Récupère la liste des classes uniques"""
        cursor = self.conn.cursor()
        cursor.execute("SELECT DISTINCT class_name FROM students WHERE class_name IS NOT NULL AND class_name != ''")
        rows = cursor.fetchall()
        return [row[0] for row in rows]
    
    def search_students(self, search_term):
        """Recherche des étudiants par nom ou ID"""
        cursor = self.conn.cursor()
        cursor.execute('''
            SELECT * FROM students 
            WHERE name LIKE ? OR student_id LIKE ? 
            ORDER BY name
        ''', (f'%{search_term}%', f'%{search_term}%'))
        rows = cursor.fetchall()
        students = []
        for row in rows:
            student = Student()
            student.id = row[0]
            student.student_id = row[1]
            student.name = row[2]
            student.class_name = row[3]
            student.email = row[4] if len(row) > 4 else None
            student.phone = row[5] if len(row) > 5 else None
            student.address = row[6] if len(row) > 6 else None
            student.photo = row[7] if len(row) > 7 else None
            student.created_at = row[9] if len(row) > 9 else datetime.now()
            students.append(student)
        return students
    
    def close(self):
        """Ferme la connexion à la base de données"""
        self.conn.close()