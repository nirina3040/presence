import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { StudentAuthService } from '../services/student-auth.service';

@Injectable({
  providedIn: 'root'
})
export class StudentGuard {
  constructor(
    private studentAuthService: StudentAuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    if (this.studentAuthService.isLoggedIn()) {
      return true;
    }
    
    this.router.navigate(['/student/login']);
    return false;
  }
}