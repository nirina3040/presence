import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Composants Étudiant
import { StudentPresenceComponent } from './components/student/student-presence/student-presence.component';

// Composants Admin
import { AdminLoginComponent } from './components/admin-login/admin-login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { RegisterComponent } from './components/register/register.component';
import { AttendanceListComponent } from './components/attendance-list/attendance-list.component';
import { ReportsComponent } from './components/reports/reports.component';

// Guards
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  { path: '', component: StudentPresenceComponent },
  
  // Routes Admin
  { path: 'admin/login', component: AdminLoginComponent },
  { path: 'admin/dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'admin/register', component: RegisterComponent, canActivate: [AuthGuard] },
  { path: 'admin/attendance', component: AttendanceListComponent, canActivate: [AuthGuard] },
  { path: 'admin/reports', component: ReportsComponent, canActivate: [AuthGuard] },
  
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }