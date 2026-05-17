import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard {
  constructor(private router: Router) {}

  canActivate(): boolean {
    // Vérifier si l'admin est connecté
    const isAdmin = localStorage.getItem('isAdmin');
    
    if (isAdmin === 'true') {
      return true;
    }
    
    // Rediriger vers la page de login admin
    this.router.navigate(['/admin/login']);
    return false;
  }
}