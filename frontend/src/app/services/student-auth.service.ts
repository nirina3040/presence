import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface StudentUser {
  id: string;
  student_id: string;
  name: string;
  class_name: string;
  role: 'student';
}

@Injectable({
  providedIn: 'root'
})
export class StudentAuthService {
  private apiUrl = 'http://localhost:5000/api';
  private currentStudentSubject = new BehaviorSubject<StudentUser | null>(null);
  public currentStudent$ = this.currentStudentSubject.asObservable();

  constructor(private http: HttpClient) {
    const savedStudent = localStorage.getItem('currentStudent');
    if (savedStudent) {
      this.currentStudentSubject.next(JSON.parse(savedStudent));
    }
  }

  // Vérifier si l'étudiant existe dans la base
  verifyStudent(studentId: string, name: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/students`);
  }

  // Connexion étudiant
  login(studentId: string, name: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.http.get(`${this.apiUrl}/students`).subscribe({
        next: (data: any) => {
          const student = data.students.find(
            (s: any) => s.student_id === studentId && s.name.toLowerCase() === name.toLowerCase()
          );
          
          if (student) {
            const studentUser: StudentUser = {
              id: student.student_id,
              student_id: student.student_id,
              name: student.name,
              class_name: student.class_name,
              role: 'student'
            };
            localStorage.setItem('currentStudent', JSON.stringify(studentUser));
            this.currentStudentSubject.next(studentUser);
            resolve(true);
          } else {
            resolve(false);
          }
        },
        error: () => {
          resolve(false);
        }
      });
    });
  }

  // Déconnexion
  logout(): void {
    localStorage.removeItem('currentStudent');
    this.currentStudentSubject.next(null);
  }

  // Vérifier si connecté
  isLoggedIn(): boolean {
    return this.currentStudentSubject.value !== null;
  }

  // Récupérer l'étudiant courant
  getCurrentStudent(): StudentUser | null {
    return this.currentStudentSubject.value;
  }
}