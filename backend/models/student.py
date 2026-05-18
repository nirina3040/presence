from datetime import datetime
import pickle
import base64

class Student:
    """Modèle Student représentant un étudiant"""
    
    def __init__(self, student_id=None, name=None, class_name=None, 
                 email=None, phone=None, address=None, photo=None,
                 face_encoding=None, created_at=None):
        self.id = None
        self.student_id = student_id
        self.name = name
        self.class_name = class_name
        self.email = email
        self.phone = phone
        self.address = address
        self.photo = photo
        self.face_encoding = face_encoding
        self.created_at = created_at or datetime.now()
    
    @classmethod
    def from_db_row(cls, row):
        """Crée un objet Student à partir d'une ligne de base de données"""
        student = cls()
        student.id = row[0]
        student.student_id = row[1]
        student.name = row[2]
        
        # Désérialiser face_encoding si présent (colonne 8)
        if len(row) > 8 and row[8]:
            try:
                student.face_encoding = pickle.loads(row[8])
            except:
                student.face_encoding = None
        
        student.class_name = row[3] if len(row) > 3 else None
        student.email = row[4] if len(row) > 4 else None
        student.phone = row[5] if len(row) > 5 else None
        student.address = row[6] if len(row) > 6 else None
        student.photo = row[7] if len(row) > 7 else None
        
        # Convertir la date en objet datetime (colonne 9)
        if len(row) > 9 and row[9]:
            if isinstance(row[9], str):
                try:
                    student.created_at = datetime.strptime(row[9], '%Y-%m-%d %H:%M:%S')
                except:
                    student.created_at = datetime.now()
            else:
                student.created_at = row[9]
        else:
            student.created_at = datetime.now()
            
        return student
    
    def to_dict(self):
        """Convertit l'objet en dictionnaire pour JSON (sans les bytes)"""
        return {
            'id': self.id,
            'student_id': self.student_id,
            'name': self.name,
            'class_name': self.class_name,
            'email': self.email,
            'phone': self.phone,
            'address': self.address,
            'photo': self.photo,
            # Ne pas inclure face_encoding car c'est des bytes
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S') if self.created_at and hasattr(self.created_at, 'strftime') else str(self.created_at) if self.created_at else None
        }
    
    def __str__(self):
        return f"Student({self.student_id} - {self.name})"
    
    def __repr__(self):
        return self.__str__()