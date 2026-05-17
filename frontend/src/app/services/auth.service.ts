import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  student_id?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    // Vérifier si l'utilisateur est déjà connecté (localStorage)
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      this.currentUserSubject.next(JSON.parse(savedUser));
    }
  }

  // Connexion étudiant (par ID étudiant)
  loginStudent(studentId: string, name: string): Observable<User> {
    // Simuler une API - à adapter avec votre backend
    return new Observable(observer => {
      const user: User = {
        id: studentId,
        name: name,
        email: `${studentId}@etudiant.com`,
        role: 'student',
        student_id: studentId
      };
      
      localStorage.setItem('currentUser', JSON.stringify(user));
      this.currentUserSubject.next(user);
      observer.next(user);
      observer.complete();
    });
  }

  // Connexion responsable (par email/mot de passe)
  loginAdmin(email: string, password: string): Observable<User> {
    // Simuler une API - à adapter avec votre backend
    return new Observable(observer => {
      // Pour test: admin@example.com / admin123
      if (email === 'admin@example.com' && password === 'admin123') {
        const user: User = {
          id: 'admin1',
          name: 'Administrateur',
          email: email,
          role: 'admin'
        };
        
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUserSubject.next(user);
        observer.next(user);
      } else {
        observer.error(new Error('Email ou mot de passe incorrect'));
      }
      observer.complete();
    });
  }

  // Déconnexion
  logout(): void {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  // Vérifier si l'utilisateur est connecté
  isLoggedIn(): boolean {
    return this.currentUserSubject.value !== null;
  }

  // Récupérer le rôle de l'utilisateur
  getUserRole(): 'student' | 'admin' | null {
    return this.currentUserSubject.value?.role || null;
  }

  // Récupérer l'utilisateur courant
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }
}