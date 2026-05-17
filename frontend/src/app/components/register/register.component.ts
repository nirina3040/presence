import { Component } from '@angular/core';
import { AttendanceService } from '../../services/attendance.service';
import { NotificationService } from '../../services/notification.service';
import { DialogService } from '../../services/dialog.service';
import { Student } from '../../models/student';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  student: Student = {
    student_id: '',
    name: '',
    class_name: ''
  };
  
  isLoading: boolean = false;

  constructor(
    private attendanceService: AttendanceService,
    private notificationService: NotificationService,
    private dialogService: DialogService
  ) { }

  async register(): Promise<void> {
    if (!this.validateForm()) {
      return;
    }

    // Dialogue de confirmation
    const confirmed = await this.dialogService.confirm({
      title: 'Confirmation d\'enregistrement',
      message: `Êtes-vous sûr de vouloir enregistrer l'étudiant "${this.student.name}" ?\n\nLa webcam va s'ouvrir pour capturer son visage.`,
      confirmText: 'Oui, enregistrer',
      cancelText: 'Annuler',
      type: 'info'
    });

    if (!confirmed) {
      this.notificationService.showInfo('Annulé', 'Enregistrement annulé');
      return;
    }

    this.isLoading = true;

    this.attendanceService.registerStudent(this.student).subscribe({
      next: (response) => {
        if (response.success) {
          this.notificationService.showSuccess(
            'Succès !',
            `L'étudiant ${this.student.name} a été enregistré avec succès. Regardez la caméra pour capturer son visage.`,
            4000
          );
          this.resetForm();
        } else {
          this.notificationService.showError(
            'Erreur',
            response.message || 'Erreur lors de l\'enregistrement'
          );
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur:', error);
        this.notificationService.showError(
          'Erreur de connexion',
          'Impossible de contacter le serveur. Vérifiez que le backend est démarré.'
        );
        this.isLoading = false;
      }
    });
  }

  validateForm(): boolean {
    if (!this.student.student_id.trim()) {
      this.notificationService.showWarning('Champ manquant', 'Veuillez entrer un ID étudiant');
      return false;
    }
    
    if (!this.student.name.trim()) {
      this.notificationService.showWarning('Champ manquant', 'Veuillez entrer un nom complet');
      return false;
    }
    
    if (!this.student.class_name.trim()) {
      this.notificationService.showWarning('Champ manquant', 'Veuillez entrer une classe');
      return false;
    }
    
    return true;
  }

  resetForm(): void {
    this.student = {
      student_id: '',
      name: '',
      class_name: ''
    };
  }
}