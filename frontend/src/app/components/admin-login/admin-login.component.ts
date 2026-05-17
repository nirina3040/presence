import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-admin-login',
  templateUrl: './admin-login.component.html',
  styleUrls: ['./admin-login.component.css']
})
export class AdminLoginComponent {
  email: string = '';
  password: string = '';
  isLoading: boolean = false;
  showPassword: boolean = false;  // ← AJOUTER CETTE PROPRIÉTÉ
  demoEmail: string = 'admin@example.com';

  constructor(
    private router: Router,
    private notificationService: NotificationService
  ) {}

  // ← AJOUTER CETTE MÉTHODE
  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  login(): void {
    if (!this.email || !this.password) {
      this.notificationService.showWarning('Champs manquants', 'Veuillez entrer vos identifiants');
      return;
    }

    this.isLoading = true;

    if (this.email === 'nirinaolivier9@gmail.com' && this.password === '304000') {
      localStorage.setItem('isAdmin', 'true');
      this.notificationService.showSuccess('Connexion réussie', 'Bienvenue dans l\'espace administrateur');
      this.router.navigate(['/admin/dashboard']);
    } else {
      this.notificationService.showError('Erreur', 'Email ou mot de passe incorrect');
    }
    
    this.isLoading = false;
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}