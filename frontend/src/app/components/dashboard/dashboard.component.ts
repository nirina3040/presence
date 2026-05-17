import { Component, OnInit } from '@angular/core';
import { AttendanceService } from '../../services/attendance.service';
import { NotificationService } from '../../services/notification.service';
import { DialogService } from '../../services/dialog.service';
import { Attendance } from '../../models/attendance';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  todayAttendance: Attendance[] = [];
  totalStudents: number = 0;
  presentCount: number = 0;
  absentCount: number = 0;
  attendanceRate: number = 0;
  selectedDate: string = new Date().toISOString().split('T')[0];
  todayDate: string = this.selectedDate;
  isLoading: boolean = false;
  recognitionActive: boolean = false;

  constructor(
    private attendanceService: AttendanceService,
    private notificationService: NotificationService,
    private dialogService: DialogService
  ) { }

  ngOnInit(): void {
    this.loadTodayAttendance();
    this.loadStudents();
  }

  loadTodayAttendance(): void {
    this.isLoading = true;
    this.attendanceService.getTodayAttendance().subscribe({
      next: (data) => {
        this.todayAttendance = data.records;
        this.todayDate = data.date;
        this.calculateStats();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur:', error);
        this.notificationService.showError('Erreur', 'Impossible de charger les présences');
        this.isLoading = false;
      }
    });
  }

  loadStudents(): void {
    this.attendanceService.getStudents().subscribe({
      next: (data) => {
        this.totalStudents = data.students.length;
        this.calculateStats();
      },
      error: (error) => {
        console.error('Erreur:', error);
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

  async startRecognition(): Promise<void> {
    if (this.totalStudents === 0) {
      this.notificationService.showWarning(
        'Aucun étudiant',
        'Veuillez d\'abord enregistrer des étudiants avant de lancer la reconnaissance.'
      );
      return;
    }

    const confirmed = await this.dialogService.confirm({
      title: 'Démarrer la reconnaissance',
      message: 'La webcam va s\'ouvrir pour détecter les visages. Les présences seront enregistrées automatiquement.\n\nAppuyez sur Q pour arrêter la reconnaissance.',
      confirmText: 'Démarrer',
      cancelText: 'Annuler',
      type: 'info'
    });

    if (!confirmed) return;

    this.recognitionActive = true;
    this.notificationService.showInfo('Reconnaissance démarrée', 'La caméra s\'ouvre... Attendez quelques secondes.');

    this.attendanceService.startRecognition().subscribe({
      next: () => {
        this.notificationService.showSuccess(
          'Reconnaissance en cours',
          'Les visages sont détectés automatiquement. Appuyez sur Q dans la fenêtre OpenCV pour arrêter.',
          5000
        );
        
        setTimeout(() => {
          this.loadTodayAttendance();
          this.recognitionActive = false;
          this.notificationService.showInfo('Mise à jour', 'Liste des présences actualisée');
        }, 3000);
      },
      error: (error) => {
        console.error('Erreur:', error);
        this.notificationService.showError('Erreur', 'Impossible de démarrer la reconnaissance');
        this.recognitionActive = false;
      }
    });
  }

  async downloadReport(): Promise<void> {
    const confirmed = await this.dialogService.confirm({
      title: 'Télécharger le rapport',
      message: `Voulez-vous télécharger le rapport de présence pour le ${this.selectedDate} ?`,
      confirmText: 'Télécharger',
      cancelText: 'Annuler',
      type: 'info'
    });

    if (!confirmed) return;

    this.isLoading = true;
    this.attendanceService.downloadReport(this.selectedDate).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rapport_presence_${this.selectedDate}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        this.notificationService.showSuccess(
          'Téléchargement terminé',
          `Le rapport du ${this.selectedDate} a été téléchargé avec succès.`
        );
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur:', error);
        this.notificationService.showError('Erreur', 'Impossible de générer le rapport');
        this.isLoading = false;
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
}