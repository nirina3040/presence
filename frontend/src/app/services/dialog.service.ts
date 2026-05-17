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
      this.dialogSubject.next({ ...options, resolve });
    });
  }

  getDialogRequests(): Observable<DialogOptions & { resolve: (value: boolean) => void }> {
    return this.dialogSubject.asObservable();
  }
}