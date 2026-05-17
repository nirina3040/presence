import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export interface DialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'info' | 'warning' | 'danger' | 'success';
}

@Injectable({
  providedIn: 'root'
})
export class DialogService {
  private dialogSubject = new Subject<DialogOptions & { resolve: (value: boolean) => void }>();

  constructor() { }

  confirm(options: DialogOptions): Promise<boolean> {
    return new Promise((resolve) => {
      this.dialogSubject.next({ 
        ...options,
        confirmText: options.confirmText || 'Confirmer',
        cancelText: options.cancelText || 'Annuler',
        type: options.type || 'info',
        resolve 
      });
    });
  }

  // Méthode utilitaire pour les alertes simples
  alert(message: string, title: string = 'Information'): Promise<void> {
    return new Promise((resolve) => {
      this.dialogSubject.next({
        title,
        message,
        confirmText: 'OK',
        cancelText: '',
        type: 'info',
        resolve: (value: boolean) => {
          resolve();
          return value;
        }
      });
    });
  }

  getDialogRequests(): Observable<DialogOptions & { resolve: (value: boolean) => void }> {
    return this.dialogSubject.asObservable();
  }
}