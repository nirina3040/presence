import { Component } from '@angular/core';
import { AttendanceService } from '../../services/attendance.service';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent {
  startDate: string = '';
  endDate: string = '';
  selectedDate: string = new Date().toISOString().split('T')[0];
  reportType: 'daily' | 'monthly' = 'daily';
  isLoading: boolean = false;

  constructor(private attendanceService: AttendanceService) { }

  generateReport(): void {
    if (this.reportType === 'daily') {
      this.downloadDailyReport();
    } else {
      this.downloadMonthlyReport();
    }
  }

  downloadDailyReport(): void {
    if (!this.selectedDate) {
      alert('Veuillez sélectionner une date');
      return;
    }

    this.isLoading = true;
    this.attendanceService.downloadReport(this.selectedDate).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rapport_presence_${this.selectedDate}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur:', error);
        alert('Erreur lors du téléchargement du rapport');
        this.isLoading = false;
      }
    });
  }

  downloadMonthlyReport(): void {
    // Implémentation pour rapport mensuel
    alert('Fonctionnalité en cours de développement');
    this.isLoading = false;
  }

  setToday(): void {
    this.selectedDate = new Date().toISOString().split('T')[0];
  }

  setYesterday(): void {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    this.selectedDate = yesterday.toISOString().split('T')[0];
  }
}