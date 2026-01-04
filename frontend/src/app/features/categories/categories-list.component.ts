import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CategoriesService } from '../../core/services/categories.service';
import { Category } from '../../core/models';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-categories-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MatTableModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatDialogModule],
  template: `
    <div class="actions">
      <button mat-raised-button color="primary" (click)="openCreate()">Create Category</button>
      <mat-form-field appearance="outline">
        <mat-label>Search</mat-label>
        <input matInput [(ngModel)]="search" (keyup)="refresh()" />
      </mat-form-field>
    </div>
    <table mat-table [dataSource]="categories" class="mat-elevation-z1">
      <ng-container matColumnDef="name">
        <th mat-header-cell *matHeaderCellDef>Name</th>
        <td mat-cell *matCellDef="let c">{{c.name}}</td>
      </ng-container>
      <ng-container matColumnDef="description">
        <th mat-header-cell *matHeaderCellDef>Description</th>
        <td mat-cell *matCellDef="let c">{{c.description}}</td>
      </ng-container>
      <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef>Actions</th>
        <td mat-cell *matCellDef="let c">
          <button mat-button (click)="edit(c)">Edit</button>
          <button mat-button color="warn" (click)="delete(c.id)">Delete</button>
        </td>
      </ng-container>
      <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
      <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
    </table>
  `,
  styles: [`.actions{display:flex;gap:8px;align-items:center;margin-bottom:12px}`]
})
export class CategoriesListComponent implements OnInit {
  categories: Category[] = [];
  displayedColumns = ['name','description','actions'];
  search = '';

  constructor(private categoriesSvc: CategoriesService, public dialog: MatDialog) {}

  ngOnInit(): void { this.refresh(); }
  refresh() { const params: any = {}; if (this.search) params.search = this.search; this.categoriesSvc.list(params).subscribe(r=> this.categories = r.results); }

  openCreate() {
    import('./category-dialog.component').then(m => {
      const ref = (this as any).dialog.open(m.CategoryDialogComponent);
      ref.afterClosed().subscribe((val: any) => { if (!val) return; this.categoriesSvc.create(val).subscribe(()=> this.refresh()); });
    });
  }
  edit(c: Category) {
    import('./category-dialog.component').then(m => {
      const ref = (this as any).dialog.open(m.CategoryDialogComponent, { data: { category: c } });
      ref.afterClosed().subscribe((val: any) => { if (!val) return; this.categoriesSvc.update(c.id, val).subscribe(()=> this.refresh()); });
    });
  }
  delete(id: number) { this.categoriesSvc.delete(id).subscribe(()=> this.refresh()); }
}