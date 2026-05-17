from datetime import datetime

class Attendance:
    """Modèle Attendance représentant une présence"""
    
    def __init__(self, student_id=None, name=None, date=None, time=None, status='present', id=None):
        self.id = id
        self.student_id = student_id
        self.name = name
        self.date = date or datetime.now().strftime("%Y-%m-%d")
        self.time = time or datetime.now().strftime("%H:%M:%S")
        self.status = status
    
    @classmethod
    def from_db_row(cls, row):
        """Crée un objet Attendance à partir d'une ligne de base de données"""
        return cls(
            id=row[0],
            student_id=row[1],
            name=row[2],
            date=row[3],
            time=row[4],
            status=row[5]
        )
    
    def to_dict(self):
        """Convertit l'objet en dictionnaire pour JSON"""
        return {
            'id': self.id,
            'student_id': self.student_id,
            'name': self.name,
            'date': self.date,
            'time': self.time,
            'status': self.status
        }
    
    def __str__(self):
        return f"Attendance({self.student_id} - {self.name} - {self.date} {self.time})"
    
    def __repr__(self):
        return self.__str__()