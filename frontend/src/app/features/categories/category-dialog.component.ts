import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-category-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{data?.category ? 'Edit Category' : 'Create Category'}}</h2>
    <form [formGroup]="form" (ngSubmit)="save()" style="padding:16px;display:grid;gap:12px;">
      <mat-form-field appearance="outline"><mat-label>Name</mat-label><input matInput formControlName="name" /></mat-form-field>
      <mat-form-field appearance="outline"><mat-label>Description</mat-label><input matInput formControlName="description" /></mat-form-field>
      <div style="display:flex;gap:8px;justify-content:flex-end;">
        <button mat-button type="button" (click)="close()">Cancel</button>
        <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid">Save</button>
      </div>
    </form>
  `
})
export class CategoryDialogComponent {
  form = this.fb.group({ name: ['', Validators.required], description: [''] });
  constructor(private fb: FormBuilder, private ref: MatDialogRef<CategoryDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: any) {
    if (data?.category) this.form.patchValue({ name: data.category.name, description: data.category.description });
  }
  save() { if (this.form.invalid) return; this.ref.close(this.form.value); }
  close() { this.ref.close(); }
}