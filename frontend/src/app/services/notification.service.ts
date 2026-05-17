import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export interface Notification {
  id: number;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notifications: Subject<Notification> = new Subject<Notification>();
  private notificationId = 0;
  private maxNotifications: number = 5; // Limite de notifications affichées simultanément

  constructor() { }

  getNotifications(): Observable<Notification> {
    return this.notifications.asObservable();
  }

  // Succès
  success(title: string, message: string, duration: number = 3000): void {
    this.show({ type: 'success', title, message, duration });
  }

  showSuccess(title: string, message: string, duration: number = 3000): void {
    this.show({ type: 'success', title, message, duration });
  }

  // Erreur
  error(title: string, message: string, duration: number = 4000): void {
    this.show({ type: 'error', title, message, duration });
  }

  showError(title: string, message: string, duration: number = 4000): void {
    this.show({ type: 'error', title, message, duration });
  }

  // Avertissement
  warning(title: string, message: string, duration: number = 3500): void {
    this.show({ type: 'warning', title, message, duration });
  }

  showWarning(title: string, message: string, duration: number = 3500): void {
    this.show({ type: 'warning', title, message, duration });
  }

  // Information
  info(title: string, message: string, duration: number = 3000): void {
    this.show({ type: 'info', title, message, duration });
  }

  showInfo(title: string, message: string, duration: number = 3000): void {
    this.show({ type: 'info', title, message, duration });
  }

  // Méthode générique
  private show(notification: Omit<Notification, 'id'>): void {
    const fullNotification: Notification = {
      ...notification,
      id: this.notificationId++
    };
    this.notifications.next(fullNotification);
  }

  // Méthode pour effacer toutes les notifications
  clearAll(): void {
    this.notifications.complete();
    this.notifications = new Subject<Notification>();
    this.notificationId = 0;
  }
}