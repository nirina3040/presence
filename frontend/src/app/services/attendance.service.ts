import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Student, StudentResponse } from '../models/student';
import { Attendance, AttendanceResponse, TodayAttendanceResponse } from '../models/attendance';

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private apiUrl = 'http://localhost:5000/api';

  constructor(private http: HttpClient) { }

  // Récupérer tous les étudiants
  getStudents(): Observable<StudentResponse> {
    return this.http.get<StudentResponse>(`${this.apiUrl}/students`);
  }

  // Enregistrer un nouvel étudiant
  registerStudent(student: Student): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, student);
  }

  // Démarrer la reconnaissance faciale
  startRecognition(): Observable<any> {
    return this.http.post(`${this.apiUrl}/start-recognition`, {});
  }

  // Récupérer les présences par date
  getAttendanceByDate(date: string): Observable<AttendanceResponse> {
    return this.http.get<AttendanceResponse>(`${this.apiUrl}/attendance/${date}`);
  }

  // Récupérer les présences du jour
  getTodayAttendance(): Observable<TodayAttendanceResponse> {
    return this.http.get<TodayAttendanceResponse>(`${this.apiUrl}/attendance/today`);
  }

  // Télécharger le rapport PDF
  downloadReport(date: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/report/daily/${date}`, {
      responseType: 'blob'
    });
  }

  // Marquer la présence manuellement (optionnel)
  markAttendance(student_id: string, name: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/attendance/mark`, { student_id, name });
  }
}