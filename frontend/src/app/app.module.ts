import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// Composants
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { RegisterComponent } from './components/register/register.component';
import { AttendanceListComponent } from './components/attendance-list/attendance-list.component';
import { ReportsComponent } from './components/reports/reports.component';
import { NotificationComponent } from './components/notification/notification.component';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
import { StudentPresenceComponent } from './components/student/student-presence/student-presence.component';
import { AdminLoginComponent } from './components/admin-login/admin-login.component';
import { StudentDialogComponent } from './components/student-dialog/student-dialog.component';

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    RegisterComponent,
    AttendanceListComponent,
    ReportsComponent,
    NotificationComponent,
    ConfirmDialogComponent,
    StudentPresenceComponent,
    AdminLoginComponent,
    StudentDialogComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    AppRoutingModule 
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }