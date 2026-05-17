import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { StudentPresenceService } from '../../../services/student-presence.service';
import { NotificationService } from '../../../services/notification.service';
import { DialogService } from '../../../services/dialog.service';
import { StudentDialogComponent } from '../../student-dialog/student-dialog.component';

@Component({
  selector: 'app-student-presence',
  templateUrl: './student-presence.component.html',
  styleUrls: ['./student-presence.component.css']
})
export class StudentPresenceComponent implements OnInit, OnDestroy {
  @ViewChild('studentDialog') studentDialog!: StudentDialogComponent;
  
  studentName: string = '';
  studentId: string = '';
  isLoading: boolean = false;
  hasCheckedIn: boolean = false;
  checkInTime: string = '';
  currentTime: string = '';
  private clockInterval: any;

  constructor(
    private router: Router,
    private presenceService: StudentPresenceService,
    private notificationService: NotificationService,
    private dialogService: DialogService
  ) {}

  ngOnInit(): void {
    this.loadStudentFromStorage();
    this.updateClock();
    this.clockInterval = setInterval(() => this.updateClock(), 1000);
  }

  ngOnDestroy(): void {
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
    }
  }

  async loadStudentFromStorage(): Promise<void> {
    const savedStudent = localStorage.getItem('currentStudent');
    if (savedStudent) {
      const student = JSON.parse(savedStudent);
      this.studentName = student.name;
      this.studentId = student.id;
      this.checkTodayStatus();
    } else {
      await this.askForStudentIdentity();
    }
  }

  saveStudentToStorage(): void {
    localStorage.setItem('currentStudent', JSON.stringify({
      id: this.studentId,
      name: this.studentName
    }));
  }

  // 🔄 MODIFIÉ : Récupère automatiquement le nom depuis l'ID
  async askForStudentIdentity(): Promise<void> {
    const result = await this.studentDialog.open();
    
    if (result && result.id) {
      // Afficher un chargement
      this.notificationService.showInfo('Recherche', `Recherche de l'étudiant avec l'ID: ${result.id}...`);
      
      // Récupérer le nom depuis le backend
      const studentName = await this.getStudentNameById(result.id);
      
      if (studentName) {
        this.studentId = result.id;
        this.studentName = studentName;
        this.saveStudentToStorage();
        this.checkTodayStatus();
        this.notificationService.showSuccess('Bienvenue', `${studentName} connecté(e)`);
      } else {
        this.notificationService.showError('Erreur', `Aucun étudiant trouvé avec l'ID: ${result.id}`);
        // Redemander l'identité
        setTimeout(() => {
          if (!this.studentId || !this.studentName) {
            this.askForStudentIdentity();
          }
        }, 100);
      }
    } else {
      setTimeout(() => {
        if (!this.studentId || !this.studentName) {
          this.askForStudentIdentity();
        }
      }, 100);
    }
  }

  // 🆕 NOUVELLE MÉTHODE : Récupère le nom de l'étudiant depuis le backend
  async getStudentNameById(studentId: string): Promise<string | null> {
    return new Promise((resolve) => {
      this.presenceService.getStudents().subscribe({
        next: (data: any) => {
          const student = data.students.find(
            (s: any) => s.student_id === studentId
          );
          if (student) {
            resolve(student.name);
          } else {
            resolve(null);
          }
        },
        error: (error) => {
          console.error('Erreur lors de la recherche:', error);
          resolve(null);
        }
      });
    });
  }

  updateClock(): void {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString('fr-FR');
  }

  checkTodayStatus(): void {
    if (!this.studentId) return;
    
    this.presenceService.checkTodayPresence(this.studentId).subscribe({
      next: (data: any) => {
        const todayRecord = data.records.find(
          (r: any) => r.student_id === this.studentId
        );
        if (todayRecord) {
          this.hasCheckedIn = true;
          this.checkInTime = todayRecord.time;
        } else {
          this.hasCheckedIn = false;
        }
      },
      error: (error) => {
        console.error('Erreur:', error);
      }
    });
  }

  async startRecognition(): Promise<void> {
    if (!this.studentId || !this.studentName) {
      await this.askForStudentIdentity();
      if (!this.studentId || !this.studentName) return;
    }

    if (this.hasCheckedIn) {
      this.notificationService.showWarning(
        'Déjà pointé !',
        `Vous avez déjà enregistré votre présence à ${this.checkInTime}`
      );
      return;
    }

    const confirmed = await this.dialogService.confirm({
      title: 'Pointer ma présence',
      message: `Bonjour ${this.studentName},\n\nVoulez-vous enregistrer votre présence maintenant ?\n\nPlacez-vous devant la caméra.`,
      confirmText: 'Oui, pointer',
      cancelText: 'Annuler',
      type: 'info'
    });

    if (!confirmed) return;

    this.isLoading = true;
    this.notificationService.showInfo(
      'Reconnaissance démarrée',
      'Regardez la caméra pour valider votre présence...'
    );

    this.presenceService.startRecognition().subscribe({
      next: () => {
        setTimeout(() => {
          this.checkTodayStatus();
          this.isLoading = false;
          
          if (this.hasCheckedIn) {
            this.notificationService.showSuccess(
              'Présence enregistrée !',
              `Votre présence a été validée à ${this.checkInTime}`
            );
          } else {
            this.notificationService.showWarning(
              'Non reconnu',
              "Votre visage n'a pas été reconnu. Veuillez réessayer."
            );
          }
        }, 4000);
      },
      error: (error) => {
        console.error('Erreur:', error);
        this.notificationService.showError(
          'Erreur',
          'Impossible de démarrer la reconnaissance. Vérifiez que le backend est démarré.'
        );
        this.isLoading = false;
      }
    });
  }

  changeStudent(): void {
    this.askForStudentIdentity();
  }

  goToAdmin(): void {
    console.log('Navigation vers admin/login');
    this.router.navigate(['/admin/login']).then(
      (success) => {
        console.log('Navigation réussie:', success);
      },
      (error) => {
        console.error('Erreur de navigation:', error);
      }
    );
  }
}