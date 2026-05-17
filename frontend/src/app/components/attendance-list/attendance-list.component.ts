import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { AttendanceService } from '../../services/attendance.service';
import { NotificationService } from '../../services/notification.service';
import { DialogService } from '../../services/dialog.service';
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
    private router: Router,
    private attendanceService: AttendanceService,
    private notificationService: NotificationService,
    private dialogService: DialogService
  ) {}

  ngOnInit(): void {
    this.loadTodayAttendance();
  }

  // Charger les présences du jour par défaut
  loadTodayAttendance(): void {
    this.isLoading = true;
    this.attendanceService.getTodayAttendance().subscribe({
      next: (data: any) => {
        this.attendances = data.records || [];
        this.filteredAttendances = [...this.attendances];
        this.isLoading = false;
        
        if (this.attendances.length === 0) {
          this.notificationService.showInfo(
            'Aucune donnée',
            'Aucune présence enregistrée pour le moment'
          );
        }
      },
      error: (error: any) => {
        console.error('Erreur:', error);
        this.notificationService.showError('Erreur', 'Impossible de charger les présences');
        this.isLoading = false;
      }
    });
  }

  // Charger les présences par date sélectionnée
  loadAttendanceByDate(date: string): void {
    this.isLoading = true;
    this.attendanceService.getAttendanceByDate(date).subscribe({
      next: (data: any) => {
        this.attendances = data.records || [];
        this.filteredAttendances = [...this.attendances];
        this.isLoading = false;
        
        if (this.attendances.length === 0) {
          this.notificationService.showInfo('Aucune présence', `Aucune présence pour le ${date}`);
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
    const dateFiltered = [...this.attendances];
    
    this.filteredAttendances = dateFiltered.filter((attendance: Attendance) => 
      attendance.name.toLowerCase().includes(term) ||
      attendance.student_id.toLowerCase().includes(term)
    );
    
    this.filterByDate();
  }

  onSearchChange(): void {
    this.filterBySearch();
  }

  onDateChange(): void {
    if (this.startDate) {
      this.loadAttendanceByDate(this.startDate);
    } else {
      this.filterByDate();
    }
  }

  resetFilters(): void {
    this.startDate = '';
    this.endDate = '';
    this.searchTerm = '';
    this.loadTodayAttendance();
    this.notificationService.showInfo('Filtres réinitialisés', 'Affichage des présences du jour');
  }

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
    
    this.notificationService.showSuccess(
      'Export réussi', 
      `${this.filteredAttendances.length} présences exportées en CSV`
    );
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