from datetime import datetime
import pickle

class Student:
    """Modèle Student représentant un étudiant"""
    
    def __init__(self, student_id=None, name=None, class_name=None, face_encoding=None, created_at=None):
        self.id = None
        self.student_id = student_id
        self.name = name
        self.class_name = class_name
        self.face_encoding = face_encoding
        self.created_at = created_at or datetime.now()
    
    @classmethod
    def from_db_row(cls, row):
        """Crée un objet Student à partir d'une ligne de base de données"""
        student = cls()
        student.id = row[0]
        student.student_id = row[1]
        student.name = row[2]
        
        # Désérialiser face_encoding si présent
        if row[3]:
            student.face_encoding = pickle.loads(row[3])
        
        student.class_name = row[4]
        
        # Convertir la date en objet datetime si c'est une chaîne
        if row[5]:
            if isinstance(row[5], str):
                try:
                    student.created_at = datetime.strptime(row[5], '%Y-%m-%d %H:%M:%S')
                except:
                    student.created_at = datetime.now()
            else:
                student.created_at = row[5]
        else:
            student.created_at = datetime.now()
            
        return student
    
    def to_dict(self):
        """Convertit l'objet en dictionnaire pour JSON"""
        return {
            'id': self.id,
            'student_id': self.student_id,
            'name': self.name,
            'class_name': self.class_name,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S') if self.created_at and hasattr(self.created_at, 'strftime') else str(self.created_at) if self.created_at else None
        }
    
    def __str__(self):
        return f"Student({self.student_id} - {self.name})"
    
    def __repr__(self):
        return self.__str__()