import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CategoriesService } from '../../core/services/categories.service';
import { Category } from '../../core/models';

@Component({
  selector: 'app-categories-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
  ],
  templateUrl: './categories-list.component.html',
  styleUrls: ['./categories-list.component.scss'],
})
export class CategoriesListComponent implements OnInit {
  categories: Category[] = [];
  displayedColumns = ['name', 'description', 'actions'];
  searchQuery = '';

  constructor(
    private categoriesService: CategoriesService,
    public dialog: MatDialog,
  ) { }

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    const params: any = {};
    if (this.searchQuery) params.search = this.searchQuery;

    this.categoriesService.list(params).subscribe(response => {
      this.categories = response.results;
    });
  }

  openCreateDialog(): void {
    import('./category-dialog.component').then(m => {
      const dialogRef = this.dialog.open(m.CategoryDialogComponent);
      dialogRef.afterClosed().subscribe((result: any) => {
        if (!result) return;
        this.categoriesService.create(result).subscribe(() => this.refresh());
      });
    });
  }

  editCategory(category: Category): void {
    import('./category-dialog.component').then(m => {
      const dialogRef = this.dialog.open(m.CategoryDialogComponent, {
        data: { category },
      });
      dialogRef.afterClosed().subscribe((result: any) => {
        if (!result) return;
        this.categoriesService.update(category.id, result).subscribe(() => this.refresh());
      });
    });
  }

  deleteCategory(id: number): void {
    this.categoriesService.delete(id).subscribe(() => this.refresh());
  }
}