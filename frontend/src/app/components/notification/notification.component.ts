import { Component, OnInit, OnDestroy } from '@angular/core';
import { NotificationService, Notification } from '../../services/notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.css']
})
export class NotificationComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  private subscription: Subscription;
  private timeouts: Map<number, any> = new Map();

  constructor(private notificationService: NotificationService) {
    this.subscription = this.notificationService.getNotifications().subscribe(notification => {
      this.addNotification(notification);
    });
  }

  ngOnInit(): void {}

  addNotification(notification: Notification): void {
    this.notifications.push(notification);
    
    // Auto-suppression après la durée
    const timeout = setTimeout(() => {
      this.removeNotification(notification.id);
    }, notification.duration || 3000);
    
    this.timeouts.set(notification.id, timeout);
  }

  removeNotification(id: number): void {
    const timeout = this.timeouts.get(id);
    if (timeout) {
      clearTimeout(timeout);
      this.timeouts.delete(id);
    }
    this.notifications = this.notifications.filter(n => n.id !== id);
  }

  getIconClass(type: string): string {
    switch(type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '📢';
    }
  }

  getTitleClass(type: string): string {
    switch(type) {
      case 'success': return 'success-title';
      case 'error': return 'error-title';
      case 'warning': return 'warning-title';
      case 'info': return 'info-title';
      default: return '';
    }
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.timeouts.forEach(timeout => clearTimeout(timeout));
  }
}