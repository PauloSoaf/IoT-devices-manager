import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-device-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{data?.device ? 'Edit Device' : 'Create Device'}}</h2>
    <form [formGroup]="form" (ngSubmit)="save()" style="padding:16px;display:grid;gap:12px;">
      <mat-form-field appearance="outline"><mat-label>Name</mat-label><input matInput formControlName="name" /></mat-form-field>
      <mat-form-field appearance="outline"><mat-label>Category</mat-label>
        <mat-select formControlName="category">
          <mat-option *ngFor="let c of data.categories" [value]="c.id">{{c.name}}</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline"><mat-label>Status</mat-label>
        <mat-select formControlName="status">
          <mat-option value="active">Active</mat-option>
          <mat-option value="inactive">Inactive</mat-option>
          <mat-option value="offline">Offline</mat-option>
        </mat-select>
      </mat-form-field>
      <div style="display:flex;gap:8px;justify-content:flex-end;">
        <button mat-button type="button" (click)="close()">Cancel</button>
        <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid">Save</button>
      </div>
    </form>
  `
})
export class DeviceDialogComponent {
  form = this.fb.group({ name: ['', Validators.required], category: [null, Validators.required], status: ['inactive', Validators.required] });
  constructor(private fb: FormBuilder, private ref: MatDialogRef<DeviceDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: any) {
    if (data?.device) this.form.patchValue({ name: data.device.name, category: typeof data.device.category === 'number' ? data.device.category : data.device.category.id, status: data.device.status });
  }
  save() { if (this.form.invalid) return; this.ref.close(this.form.value); }
  close() { this.ref.close(); }
}