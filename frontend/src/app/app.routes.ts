import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { LayoutComponent } from './shared/layout/layout.component';
import { LoginComponent } from './features/login/login.component';
import { RegisterComponent } from './features/register/register.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'devices', loadComponent: () => import('./features/devices/devices-list.component').then(m => m.DevicesListComponent) },
      { path: 'devices/:id', loadComponent: () => import('./features/devices/device-detail.component').then(m => m.DeviceDetailComponent) },
      { path: 'categories', loadComponent: () => import('./features/categories/categories-list.component').then(m => m.CategoriesListComponent) },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' }
    ]
  }
];
