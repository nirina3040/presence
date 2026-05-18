import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AttendanceService } from '../../services/attendance.service';
import { NotificationService } from '../../services/notification.service';
import { DialogService } from '../../services/dialog.service';
import { Attendance } from '../../models/attendance';
import { Student } from '../../models/student';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  // Onglets
  activeTab: 'presences' | 'etudiants' = 'presences';
  selectedClass: string = '';
  classesList: string[] = [];
  selectedStudent: Student | null = null;
  
  // Présences
  todayAttendance: Attendance[] = [];
  totalStudents: number = 0;
  presentCount: number = 0;
  absentCount: number = 0;
  attendanceRate: number = 0;
  selectedDate: string = new Date().toISOString().split('T')[0];
  todayDate: string = this.selectedDate;
  isLoading: boolean = false;
  recognitionActive: boolean = false;

  // Étudiants
  studentsList: Student[] = [];
  filteredStudents: Student[] = [];
  studentSearchTerm: string = '';
  isLoadingStudents: boolean = false;

  constructor(
    private router: Router,
    private attendanceService: AttendanceService,
    private notificationService: NotificationService,
    private dialogService: DialogService
  ) { }

  ngOnInit(): void {
    this.loadTodayAttendance();
    this.loadStudents();
  }

  // ========== MÉTHODES PRÉSENCES ==========
  loadTodayAttendance(): void {
    this.isLoading = true;
    this.attendanceService.getTodayAttendance().subscribe({
      next: (data: any) => {
        this.todayAttendance = data.records;
        this.todayDate = data.date;
        this.calculateStats();
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Erreur:', error);
        this.notificationService.showError('Erreur', 'Impossible de charger les présences');
        this.isLoading = false;
      }
    });
  }

  loadStudents(): void {
    this.isLoadingStudents = true;
    this.attendanceService.getStudents().subscribe({
      next: (data: any) => {
        this.studentsList = data.students;
        this.filteredStudents = [...this.studentsList];
        this.totalStudents = data.students.length;
        this.calculateStats();
        this.loadClasses(); // Appeler après chargement des étudiants
        this.isLoadingStudents = false;
      },
      error: (error: any) => {
        console.error('Erreur:', error);
        this.notificationService.showError('Erreur', 'Impossible de charger les étudiants');
        this.isLoadingStudents = false;
      }
    });
  }

  calculateStats(): void {
    this.presentCount = this.todayAttendance.length;
    this.absentCount = this.totalStudents - this.presentCount;
    this.attendanceRate = this.totalStudents > 0
      ? (this.presentCount / this.totalStudents) * 100
      : 0;
  }

  startRecognition(): void {
    this.recognitionActive = true;
    this.attendanceService.startRecognition().subscribe({
      next: () => {
        this.notificationService.showSuccess('Reconnaissance démarrée', 'Regardez la fenêtre OpenCV');
        setTimeout(() => {
          this.loadTodayAttendance();
          this.recognitionActive = false;
        }, 3000);
      },
      error: (error: any) => {
        console.error('Erreur:', error);
        this.notificationService.showError('Erreur', 'Impossible de démarrer la reconnaissance');
        this.recognitionActive = false;
      }
    });
  }

  downloadReport(): void {
    this.attendanceService.downloadReport(this.selectedDate).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rapport_presence_${this.selectedDate}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.notificationService.showSuccess('Téléchargement réussi', 'Le rapport a été téléchargé');
      },
      error: (error: any) => {
        console.error('Erreur:', error);
        this.notificationService.showError('Erreur', 'Impossible de générer le rapport');
      }
    });
  }

  onDateChange(): void {
    this.loadTodayAttendance();
  }

  refresh(): void {
    this.loadTodayAttendance();
    this.loadStudents();
    this.notificationService.showInfo('Actualisation', 'Les données ont été actualisées');
  }

  // ========== MÉTHODES ÉTUDIANTS ==========
  filterStudents(): void {
    const term = this.studentSearchTerm.toLowerCase();
    this.filteredStudents = this.studentsList.filter((student: Student) =>
      student.student_id.toLowerCase().includes(term) ||
      student.name.toLowerCase().includes(term) ||
      (student.class_name && student.class_name.toLowerCase().includes(term))
    );
  }

  loadClasses(): void {
    this.classesList = [...new Set(this.studentsList.map(s => s.class_name))];
  }

  filterByClass(): void {
    if (this.selectedClass) {
      this.filteredStudents = this.studentsList.filter(
        s => s.class_name === this.selectedClass
      );
    } else {
      this.filteredStudents = [...this.studentsList];
    }
  }

  viewDetails(student: Student): void {
    this.selectedStudent = student;
  }

  saveStudentDetails(updatedStudent: Student): void {
    this.attendanceService.updateStudent(updatedStudent).subscribe({
      next: () => {
        this.loadStudents();
        this.selectedStudent = null;
        this.notificationService.showSuccess('Succès', 'Étudiant modifié avec succès');
      },
      error: (error: any) => {
        console.error('Erreur:', error);
        this.notificationService.showError('Erreur', 'Impossible de modifier l\'étudiant');
      }
    });
  }

  closeDetail(): void {
    this.selectedStudent = null;
  }

  async deleteStudent(studentId: string, studentName: string): Promise<void> {
    const confirmed = await this.dialogService.confirm({
      title: 'Supprimer un étudiant',
      message: `Êtes-vous sûr de vouloir supprimer l'étudiant "${studentName}" (${studentId}) ?\n\nCette action est irréversible.`,
      confirmText: 'Oui, supprimer',
      cancelText: 'Annuler',
      type: 'danger'
    });

    if (confirmed) {
      this.attendanceService.deleteStudent(studentId).subscribe({
        next: () => {
          this.notificationService.showSuccess('Supprimé', `L'étudiant ${studentName} a été supprimé`);
          this.loadStudents();
        },
        error: (error: any) => {
          console.error('Erreur:', error);
          this.notificationService.showError('Erreur', 'Impossible de supprimer l\'étudiant');
        }
      });
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