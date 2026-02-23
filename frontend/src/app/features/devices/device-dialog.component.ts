import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-device-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  templateUrl: './device-dialog.component.html',
  styleUrls: ['./device-dialog.component.scss'],
})
export class DeviceDialogComponent {
  form = this.formBuilder.group({
    name: ['', Validators.required],
    category: [null as number | null, Validators.required],
    status: ['inactive', Validators.required],
  });

  constructor(
    private formBuilder: FormBuilder,
    private dialogRef: MatDialogRef<DeviceDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    if (data?.device) {
      const categoryId = typeof data.device.category === 'number'
        ? data.device.category
        : data.device.category.id;

      this.form.patchValue({
        name: data.device.name,
        category: categoryId,
        status: data.device.status,
      });
    }
  }

  save(): void {
    if (this.form.invalid) return;
    this.dialogRef.close(this.form.value);
  }

  cancel(): void {
    this.dialogRef.close();
  }
}