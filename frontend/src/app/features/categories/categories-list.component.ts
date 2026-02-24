import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { CategoriesService } from '../../core/services/categories.service';
import { Category } from '../../core/models';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';

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
    MatPaginatorModule,
  ],
  templateUrl: './categories-list.component.html',
  styleUrls: ['./categories-list.component.scss'],
})
export class CategoriesListComponent implements OnInit {
  categories: Category[] = [];
  displayedColumns = ['name', 'description', 'actions'];
  searchQuery = '';

  totalCount = 0;
  pageSize = 20;
  currentPage = 0;

  constructor(
    private categoriesService: CategoriesService,
    public dialog: MatDialog,
  ) { }

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    const params: any = {
      page: this.currentPage + 1,
      page_size: this.pageSize,
    };
    if (this.searchQuery) params.search = this.searchQuery;

    this.categoriesService.list(params).subscribe(response => {
      this.categories = response.results;
      this.totalCount = response.count;
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.refresh();
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

  confirmDelete(category: Category): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      autoFocus: false,
      data: {
        title: 'Delete Category',
        message: `Are you sure you want to delete "${category.name}"? Devices in this category won't be deleted but may become orphaned.`,
        confirmText: 'Delete',
        color: 'warn',
      },
    });
    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.categoriesService.delete(category.id).subscribe(() => this.refresh());
      }
    });
  }
}