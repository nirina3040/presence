import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StudentPresenceService {
  private apiUrl = 'http://localhost:5000/api';

  constructor(private http: HttpClient) { }

  getStudents(): Observable<any> {
    return this.http.get(`${this.apiUrl}/students`);
  }

  startRecognition(): Observable<any> {
    return this.http.post(`${this.apiUrl}/start-recognition`, {});
  }

  checkTodayPresence(studentId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/attendance/today`);
  }
}