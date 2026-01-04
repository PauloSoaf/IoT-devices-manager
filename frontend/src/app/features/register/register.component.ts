import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
  <div style="height:100vh;display:flex;align-items:center;justify-content:center;">
    <mat-card style="width:400px;">
      <h2>Register</h2>
      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Username</mat-label>
          <input matInput formControlName="username" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Email</mat-label>
          <input matInput type="email" formControlName="email" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Password</mat-label>
          <input matInput type="password" formControlName="password" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Confirm password</mat-label>
          <input matInput type="password" formControlName="confirm" />
        </mat-form-field>
        <button mat-raised-button color="primary" class="full-width" type="submit" [disabled]="form.invalid || loading">Create account</button>
        <div *ngIf="message" style="color:#060;margin-top:8px;">{{message}}</div>
        <div *ngIf="error" style="color:#c00;margin-top:8px;">{{error}}</div>
      </form>
    </mat-card>
  </div>
  `,
  styles: [`.full-width{width:100%;}`]
})
export class RegisterComponent {
  form = this.fb.group({ username: ['', Validators.required], email: ['', [Validators.required, Validators.email]], password: ['', Validators.required], confirm: ['', Validators.required] });
  loading = false; error: string | null = null; message: string | null = null;
  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  onSubmit() {
    if (this.form.invalid) return;
    const { username, email, password, confirm } = this.form.value;
    if (password !== confirm) { this.error = 'Passwords do not match'; return; }
    this.loading = true; this.error = null; this.message = null;
    this.auth.register(username!, email!, password!).subscribe({
      next: () => { this.loading = false; this.message = 'Account created. You can now log in.'; setTimeout(()=> this.router.navigate(['/login']), 1200); },
      error: () => { this.loading = false; this.error = 'Registration failed'; }
    });
  }
}