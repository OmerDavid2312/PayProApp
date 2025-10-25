import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then(c => c.LoginComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.component').then(c => c.DashboardComponent),
    canActivate: [AuthGuard]
  },
  {
    path: '404',
    loadComponent: () => import('./not-found/not-found.component').then(c => c.NotFoundComponent)
  },
  {
    path: '**',
    loadComponent: () => import('./not-found/not-found.component').then(c => c.NotFoundComponent)
  }
];
