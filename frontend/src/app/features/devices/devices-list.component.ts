import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DevicesService } from '../../core/services/devices.service';
import { CategoriesService } from '../../core/services/categories.service';
import { Device, Category } from '../../core/models';

@Component({
  selector: 'app-devices-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MatTableModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatSelectModule, MatInputModule, MatDialogModule, RouterLink],
  template: `
    <div class="actions">
      <button mat-raised-button color="primary" (click)="openCreate()">Create Device</button>
      <mat-form-field appearance="outline">
        <mat-label>Search</mat-label>
        <input matInput [(ngModel)]="search" (keyup)="refresh()" />
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Category</mat-label>
        <mat-select [(ngModel)]="categoryFilter" (selectionChange)="refresh()">
          <mat-option [value]="null">All</mat-option>
          <mat-option *ngFor="let c of categories" [value]="c.id">{{c.name}}</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Status</mat-label>
        <mat-select [(ngModel)]="statusFilter" (selectionChange)="refresh()">
          <mat-option [value]="null">All</mat-option>
          <mat-option value="active">Active</mat-option>
          <mat-option value="inactive">Inactive</mat-option>
          <mat-option value="offline">Offline</mat-option>
        </mat-select>
      </mat-form-field>
    </div>
    <table mat-table [dataSource]="devices" class="mat-elevation-z1">
      <ng-container matColumnDef="name">
        <th mat-header-cell *matHeaderCellDef>Name</th>
        <td mat-cell *matCellDef="let d">{{d.name}}</td>
      </ng-container>
      <ng-container matColumnDef="category">
        <th mat-header-cell *matHeaderCellDef>Category</th>
        <td mat-cell *matCellDef="let d">{{getCategoryName(d.category)}}</td>
      </ng-container>
      <ng-container matColumnDef="status">
        <th mat-header-cell *matHeaderCellDef>Status</th>
        <td mat-cell *matCellDef="let d">{{d.status}}</td>
      </ng-container>
      <ng-container matColumnDef="last_seen_at">
        <th mat-header-cell *matHeaderCellDef>Last seen</th>
        <td mat-cell *matCellDef="let d">{{d.last_seen_at || '—'}}</td>
      </ng-container>
      <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef>Actions</th>
        <td mat-cell *matCellDef="let d">
          <a mat-icon-button [routerLink]="['/devices', d.id]" title="View"><mat-icon>visibility</mat-icon></a>
          <button mat-icon-button (click)="setStatus(d,'active')" title="Activate"><mat-icon>play_arrow</mat-icon></button>
          <button mat-icon-button (click)="setStatus(d,'inactive')" title="Deactivate"><mat-icon>pause</mat-icon></button>
          <button mat-icon-button color="warn" (click)="delete(d.id)" title="Delete"><mat-icon>delete</mat-icon></button>
        </td>
      </ng-container>
      <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
      <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
    </table>
  `,
  styles: [`.actions{display:flex;gap:8px;align-items:center;margin-bottom:12px}`]
})
export class DevicesListComponent implements OnInit {
  devices: Device[] = [];
  categories: Category[] = [];
  displayedColumns = ['name','category','status','last_seen_at','actions'];
  search = ''; categoryFilter: number | null = null; statusFilter: string | null = null;

  constructor(private devicesSvc: DevicesService, private categoriesSvc: CategoriesService, public dialog: MatDialog) {}

  ngOnInit(): void { this.categoriesSvc.list().subscribe(r=> this.categories = r.results); this.refresh(); }

  refresh() {
    const params: any = {};
    if (this.search) params.search = this.search;
    if (this.categoryFilter != null) params.category = this.categoryFilter;
    if (this.statusFilter) params.status = this.statusFilter;
    this.devicesSvc.list(params).subscribe(r=> this.devices = r.results);
  }

  getCategoryName(cat: number | Category): string { return typeof cat === 'number' ? (this.categories.find(c=>c.id===cat)?.name || String(cat)) : cat.name; }

  setStatus(d: Device, status: string) { this.devicesSvc.setStatus(d.id, { status }).subscribe(()=> this.refresh()); }
  delete(id: number) { this.devicesSvc.delete(id).subscribe(()=> this.refresh()); }
  openCreate() {
    import('./device-dialog.component').then(m => {
      const ref = (this as any).dialog.open(m.DeviceDialogComponent, { data: { categories: this.categories } });
      ref.afterClosed().subscribe((val: any) => { if (!val) return; this.devicesSvc.create(val).subscribe(()=> this.refresh()); });
    });
  }
}