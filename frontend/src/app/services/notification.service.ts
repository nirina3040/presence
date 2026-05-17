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

  constructor() { }

  getNotifications(): Observable<Notification> {
    return this.notifications.asObservable();
  }

  showSuccess(title: string, message: string, duration: number = 3000): void {
    this.show({ type: 'success', title, message, duration });
  }

  showError(title: string, message: string, duration: number = 3000): void {
    this.show({ type: 'error', title, message, duration });
  }

  showWarning(title: string, message: string, duration: number = 3000): void {
    this.show({ type: 'warning', title, message, duration });
  }

  showInfo(title: string, message: string, duration: number = 3000): void {
    this.show({ type: 'info', title, message, duration });
  }

  private show(notification: Omit<Notification, 'id'>): void {
    const fullNotification: Notification = {
      ...notification,
      id: this.notificationId++
    };
    this.notifications.next(fullNotification);
  }
}