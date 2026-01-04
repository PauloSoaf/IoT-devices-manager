import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, MatToolbarModule, MatSidenavModule, MatListModule, MatIconModule, MatButtonModule],
  template: `
  <mat-sidenav-container style="height:100vh;">
    <mat-sidenav mode="side" opened>
      <mat-toolbar color="primary">IoT Manager</mat-toolbar>
      <mat-nav-list>
        <a mat-list-item routerLink="/dashboard">Dashboard</a>
        <a mat-list-item routerLink="/devices">Devices</a>
        <a mat-list-item routerLink="/categories">Categories</a>
        <a mat-list-item (click)="logout()">Logout</a>
      </mat-nav-list>
    </mat-sidenav>
    <mat-sidenav-content>
      <mat-toolbar color="primary">IoT Devices Manager</mat-toolbar>
      <div style="padding:16px;">
        <router-outlet></router-outlet>
      </div>
    </mat-sidenav-content>
  </mat-sidenav-container>
  `
})
export class LayoutComponent {
  constructor(private auth: AuthService) {}
  logout() { this.auth.logout(); location.href = '/login'; }
}