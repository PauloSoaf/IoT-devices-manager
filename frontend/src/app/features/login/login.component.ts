import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
  <div style="height:100vh;display:flex;align-items:center;justify-content:center;">
    <mat-card style="width:360px;">
      <h2>Login</h2>
      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Username</mat-label>
          <input matInput formControlName="username" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Password</mat-label>
          <input matInput type="password" formControlName="password" />
        </mat-form-field>
        <button mat-raised-button color="primary" class="full-width" type="submit" [disabled]="form.invalid || loading">Login</button>
        <div *ngIf="error" style="color:#c00;margin-top:8px;">{{error}}</div>
      </form>
    </mat-card>
  </div>
  `,
  styles: [`.full-width{width:100%;}`]
})
export class LoginComponent {
  form = this.fb.group({ username: ['', Validators.required], password: ['', Validators.required] });
  loading = false; error: string | null = null;
  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  onSubmit() {
    if (this.form.invalid) return;
    this.loading = true; this.error = null;
    const { username, password } = this.form.value;
    this.auth.login(username!, password!).subscribe({
      next: () => { this.loading = false; this.router.navigate(['/dashboard']); },
      error: (e) => { this.loading = false; this.error = 'Invalid credentials'; }
    });
  }
}