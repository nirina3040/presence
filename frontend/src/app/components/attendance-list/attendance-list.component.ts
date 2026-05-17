import { Component, OnInit } from '@angular/core';
import { AttendanceService } from '../../services/attendance.service';
import { NotificationService } from '../../services/notification.service';
import { Attendance } from '../../models/attendance';

@Component({
  selector: 'app-attendance-list',
  templateUrl: './attendance-list.component.html',
  styleUrls: ['./attendance-list.component.css']
})
export class AttendanceListComponent implements OnInit {
  attendances: Attendance[] = [];
  filteredAttendances: Attendance[] = [];
  startDate: string = '';
  endDate: string = '';
  searchTerm: string = '';
  isLoading: boolean = false;

  constructor(
    private attendanceService: AttendanceService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.loadTodayAttendance();
  }

  // Charger les présences du jour
  loadTodayAttendance(): void {
    this.isLoading = true;
    this.attendanceService.getTodayAttendance().subscribe({
      next: (data: any) => {
        this.attendances = data.records || [];
        this.filteredAttendances = [...this.attendances];
        
        if (this.attendances.length === 0) {
          this.notificationService.showInfo(
            'Aucune présence', 
            'Aucune présence enregistrée aujourd\'hui. Lancez la reconnaissance faciale pour commencer.'
          );
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Erreur:', error);
        this.notificationService.showError('Erreur', 'Impossible de charger les présences');
        this.isLoading = false;
      }
    });
  }

  // Charger les présences par date sélectionnée
  loadAttendanceByDate(): void {
    if (!this.startDate) {
      this.loadTodayAttendance();
      return;
    }
    
    this.isLoading = true;
    this.attendanceService.getAttendanceByDate(this.startDate).subscribe({
      next: (data: any) => {
        this.attendances = data.records || [];
        this.filteredAttendances = [...this.attendances];
        this.isLoading = false;
        
        if (this.attendances.length === 0) {
          this.notificationService.showInfo('Aucune présence', `Aucune présence pour le ${this.startDate}`);
        }
      },
      error: (error: any) => {
        console.error('Erreur:', error);
        this.notificationService.showError('Erreur', 'Impossible de charger les présences');
        this.isLoading = false;
      }
    });
  }

  // Filtrer par date
  filterByDate(): void {
    if (!this.startDate && !this.endDate) {
      this.filteredAttendances = [...this.attendances];
      return;
    }

    this.filteredAttendances = this.attendances.filter((attendance: Attendance) => {
      const attendanceDate = attendance.date;
      
      if (this.startDate && this.endDate) {
        return attendanceDate >= this.startDate && attendanceDate <= this.endDate;
      } else if (this.startDate) {
        return attendanceDate === this.startDate;
      } else if (this.endDate) {
        return attendanceDate <= this.endDate;
      }
      return true;
    });
  }

  // Filtrer par recherche
  filterBySearch(): void {
    if (!this.searchTerm.trim()) {
      this.filterByDate();
      return;
    }

    const term = this.searchTerm.toLowerCase();
    this.filteredAttendances = this.attendances.filter((attendance: Attendance) => 
      attendance.name.toLowerCase().includes(term) ||
      attendance.student_id.toLowerCase().includes(term)
    );
    
    this.filterByDate();
  }

  // Recherche en temps réel
  onSearchChange(): void {
    this.filterBySearch();
  }

  // Changement de date
  onDateChange(): void {
    if (this.startDate) {
      this.loadAttendanceByDate();
    } else {
      this.filterByDate();
    }
  }

  // Réinitialiser les filtres
  resetFilters(): void {
    this.startDate = '';
    this.endDate = '';
    this.searchTerm = '';
    this.loadTodayAttendance();
    this.notificationService.showInfo('Filtres réinitialisés', 'Affichage des présences du jour');
  }

  // Rafraîchir les données
  refresh(): void {
    if (this.startDate) {
      this.loadAttendanceByDate();
    } else {
      this.loadTodayAttendance();
    }
    this.notificationService.showInfo('Actualisation', 'Les données ont été actualisées');
  }

  // Exporter en CSV
  exportToCSV(): void {
    if (this.filteredAttendances.length === 0) {
      this.notificationService.showWarning('Aucune donnée', 'Il n\'y a aucune présence à exporter');
      return;
    }

    const headers = ['ID Étudiant', 'Nom', 'Date', 'Heure', 'Statut'];
    const csvData = this.filteredAttendances.map((a: Attendance) => [
      a.student_id,
      a.name,
      a.date,
      a.time,
      a.status
    ]);
    
    const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `presences_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    this.notificationService.showSuccess('Export réussi', `${this.filteredAttendances.length} présences exportées en CSV`);
  }
}