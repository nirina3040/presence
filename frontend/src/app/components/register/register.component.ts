import { Component, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
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
  @ViewChild('fileInput') fileInput!: ElementRef;
  
  student: Student = {
    student_id: '',
    name: '',
    class_name: '',
    email: '',
    phone: '',
    address: '',
    photo: ''
  };
  
  photoPreview: string | null = null;
  isLoading: boolean = false;

  constructor(
    private router: Router,
    private attendanceService: AttendanceService,
    private notificationService: NotificationService,
    private dialogService: DialogService
  ) {}

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  onPhotoSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Vérifier la taille (2MB max)
      if (file.size > 2 * 1024 * 1024) {
        this.notificationService.showWarning('Fichier trop grand', 'La photo ne doit pas dépasser 2MB');
        return;
      }
      
      // Vérifier le type
      if (!file.type.match('image/jpeg') && !file.type.match('image/png')) {
        this.notificationService.showWarning('Format non supporté', 'Seuls les formats JPG et PNG sont acceptés');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.photoPreview = e.target.result;
        this.student.photo = e.target.result; // Stocker en base64
      };
      reader.readAsDataURL(file);
    }
  }

  removePhoto(): void {
    this.photoPreview = null;
    this.student.photo = '';
    this.fileInput.nativeElement.value = '';
  }

  async register(): Promise<void> {
    if (!this.validateForm()) {
      return;
    }

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
            5000
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
      class_name: '',
      email: '',
      phone: '',
      address: '',
      photo: ''
    };
    this.photoPreview = null;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  logout(): void {
    this.dialogService.confirm({
      title: 'Déconnexion',
      message: 'Êtes-vous sûr de vouloir vous déconnecter ?',
      confirmText: 'Oui',
      cancelText: 'Non',
      type: 'warning'
    }).then((confirmed: boolean) => {
      if (confirmed) {
        localStorage.removeItem('isAdmin');
        this.router.navigate(['/admin/login']);
        this.notificationService.showSuccess('Déconnecté', 'À bientôt !');
      }
    });
  }
}