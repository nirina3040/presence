import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Student } from '../../models/student';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-student-detail',
  templateUrl: './student-detail.component.html',
  styleUrls: ['./student-detail.component.css']
})
export class StudentDetailComponent {
  @Input() student: Student | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<Student>();
  
  isEditing: boolean = false;
  editedStudent: Student = {} as Student;
  photoPreview: string | null = null;

  constructor(private notificationService: NotificationService) {}

  open(student: Student): void {
    this.student = { ...student };
    this.editedStudent = { ...student };
    this.photoPreview = student.photo || null;
    this.isEditing = false;
  }

  edit(): void {
    this.isEditing = true;
    this.editedStudent = { ...this.student! };
    this.photoPreview = this.student!.photo || null;
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.editedStudent = { ...this.student! };
    this.photoPreview = this.student!.photo || null;
  }

  saveChanges(): void {
    if (this.validateForm()) {
      this.save.emit(this.editedStudent);
      this.student = { ...this.editedStudent };
      this.isEditing = false;
      this.notificationService.showSuccess('Succès', 'Étudiant modifié avec succès');
    }
  }

  onPhotoSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.photoPreview = e.target.result;
        this.editedStudent.photo = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  validateForm(): boolean {
    if (!this.editedStudent.name?.trim()) {
      this.notificationService.showWarning('Erreur', 'Le nom est requis');
      return false;
    }
    if (!this.editedStudent.class_name?.trim()) {
      this.notificationService.showWarning('Erreur', 'La classe est requise');
      return false;
    }
    return true;
  }

  closeDialog(): void {
    this.close.emit();
  }
}