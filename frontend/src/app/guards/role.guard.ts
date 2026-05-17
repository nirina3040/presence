import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: any): boolean {
    const requiredRole = route.data['role'];
    const userRole = this.authService.getUserRole();
    
    if (userRole === requiredRole) {
      return true;
    }
    
    if (userRole === 'student') {
      this.router.navigate(['/student/dashboard']);
    } else if (userRole === 'admin') {
      this.router.navigate(['/admin/dashboard']);
    } else {
      this.router.navigate(['/login']);
    }
    
    return false;
  }
}