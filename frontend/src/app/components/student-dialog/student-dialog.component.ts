import { Component } from '@angular/core';

@Component({
  selector: 'app-student-dialog',
  templateUrl: './student-dialog.component.html',
  styleUrls: ['./student-dialog.component.css']
})
export class StudentDialogComponent {
  visible = false;
  studentId = '';
  private resolve: ((value: { id: string } | null) => void) | null = null;

  open(): Promise<{ id: string } | null> {
    this.studentId = '';
    this.visible = true;
    
    return new Promise((resolve) => {
      this.resolve = resolve;
      
      setTimeout(() => {
        const input = document.querySelector('.student-id-input') as HTMLInputElement;
        if (input) input.focus();
      }, 100);
    });
  }

  confirm(): void {
    const id = this.studentId.trim();
    
    if (id) {
      if (this.resolve) {
        this.resolve({ id });
      }
      this.visible = false;
    } else {
      const input = document.querySelector('.student-id-input') as HTMLInputElement;
      if (input) {
        input.style.borderColor = '#f44336';
        setTimeout(() => {
          input.style.borderColor = '#e0e0e0';
        }, 2000);
      }
    }
  }

  close(): void {
    if (this.resolve) {
      this.resolve(null);
    }
    this.visible = false;
  }
}