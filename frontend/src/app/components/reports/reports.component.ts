import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AttendanceService } from '../../services/attendance.service';
import { NotificationService } from '../../services/notification.service';
import { DialogService } from '../../services/dialog.service';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent {
  reportType: 'daily' | 'monthly' = 'daily';
  selectedDate: string = new Date().toISOString().split('T')[0];
  selectedMonth: string = new Date().toISOString().slice(0, 7);
  isLoading: boolean = false;
  lastGeneratedReport: string = '';

  constructor(
    private router: Router,
    private attendanceService: AttendanceService,
    private notificationService: NotificationService,
    private dialogService: DialogService
  ) {}

  generateReport(): void {
    if (this.reportType === 'daily') {
      this.downloadDailyReport();
    } else {
      this.downloadMonthlyReport();
    }
  }

  downloadDailyReport(): void {
    if (!this.selectedDate) {
      this.notificationService.showWarning('Date manquante', 'Veuillez sélectionner une date');
      return;
    }

    this.isLoading = true;
    this.notificationService.showInfo('Génération', `Génération du rapport pour le ${this.selectedDate}...`);

    this.attendanceService.downloadReport(this.selectedDate).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rapport_presence_${this.selectedDate}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        this.lastGeneratedReport = `rapport_presence_${this.selectedDate}.pdf`;
        this.notificationService.showSuccess(
          'Rapport généré !',
          `Le rapport du ${this.selectedDate} a été téléchargé`
        );
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Erreur:', error);
        this.notificationService.showError(
          'Erreur',
          'Impossible de générer le rapport. Vérifiez que le backend est démarré.'
        );
        this.isLoading = false;
      }
    });
  }

  downloadMonthlyReport(): void {
    if (!this.selectedMonth) {
      this.notificationService.showWarning('Mois manquant', 'Veuillez sélectionner un mois');
      return;
    }

    const [year, month] = this.selectedMonth.split('-');
    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    const monthName = monthNames[parseInt(month) - 1];

    this.isLoading = true;
    this.notificationService.showInfo('Génération', `Génération du rapport pour ${monthName} ${year}...`);

    // Pour le rapport mensuel, on récupère les présences du mois
    // En attendant l'implémentation backend, on peut télécharger le rapport quotidien du premier jour
    const firstDayOfMonth = `${year}-${month}-01`;
    
    this.attendanceService.downloadReport(firstDayOfMonth).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rapport_mensuel_${monthName}_${year}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        this.lastGeneratedReport = `rapport_mensuel_${monthName}_${year}.pdf`;
        this.notificationService.showSuccess(
          'Rapport généré !',
          `Le rapport de ${monthName} ${year} a été généré`
        );
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Erreur:', error);
        this.notificationService.showError(
          'Erreur',
          'Impossible de générer le rapport mensuel'
        );
        this.isLoading = false;
      }
    });
  }

  // Méthode alternative pour exporter les données en CSV
  exportToCSV(records: any[], filename: string): void {
    if (!records || records.length === 0) {
      this.notificationService.showWarning('Aucune donnée', 'Aucune présence pour cette période');
      return;
    }

    const headers = ['ID Étudiant', 'Nom', 'Date', 'Heure', 'Statut'];
    const csvData = records.map((record: any) => [
      record.student_id,
      record.name,
      record.date,
      record.time,
      record.status
    ]);
    
    const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport_${filename}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  downloadLastReport(): void {
    if (this.lastGeneratedReport) {
      this.downloadDailyReport();
    }
  }

  setToday(): void {
    this.selectedDate = new Date().toISOString().split('T')[0];
  }

  setYesterday(): void {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    this.selectedDate = yesterday.toISOString().split('T')[0];
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