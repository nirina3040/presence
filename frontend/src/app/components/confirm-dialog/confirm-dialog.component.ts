import { Component, OnDestroy } from '@angular/core';
import { DialogService, DialogOptions } from '../../services/dialog.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.css']
})
export class ConfirmDialogComponent implements OnDestroy {
  isVisible = false;
  options: DialogOptions = {
    title: '',
    message: '',
    confirmText: 'Confirmer',
    cancelText: 'Annuler',
    type: 'info'
  };
  
  private resolve: (value: boolean) => void = () => {};
  private subscription: Subscription;

  constructor(private dialogService: DialogService) {
    this.subscription = this.dialogService.getDialogRequests().subscribe(request => {
      this.options = {
        title: request.title,
        message: request.message,
        confirmText: request.confirmText || 'Confirmer',
        cancelText: request.cancelText || 'Annuler',
        type: request.type || 'info'
      };
      this.resolve = request.resolve;
      this.isVisible = true;
    });
  }

  confirm(): void {
    this.resolve(true);
    this.close();
  }

  cancel(): void {
    this.resolve(false);
    this.close();
  }

  close(): void {
    this.isVisible = false;
  }

  // Fermer avec la touche Echap
  onEscape(): void {
    this.cancel();
  }

  getIcon(): string {
    switch(this.options.type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'danger': return '🔴';
      default: return 'ℹ️';
    }
  }

  getIconColor(): string {
    switch(this.options.type) {
      case 'success': return '#4CAF50';
      case 'warning': return '#ff9800';
      case 'danger': return '#f44336';
      default: return '#2196F3';
    }
  }

  // Ajout pour le style de la classe CSS
  getDialogClass(): string {
    switch(this.options.type) {
      case 'success': return 'dialog-success';
      case 'warning': return 'dialog-warning';
      case 'danger': return 'dialog-danger';
      default: return 'dialog-info';
    }
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}