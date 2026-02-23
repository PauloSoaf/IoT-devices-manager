import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DevicesService } from '../../core/services/devices.service';
import { CategoriesService } from '../../core/services/categories.service';
import { Device, Category } from '../../core/models';

@Component({
  selector: 'app-devices-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDialogModule,
  ],
  templateUrl: './devices-list.component.html',
  styleUrls: ['./devices-list.component.scss'],
})
export class DevicesListComponent implements OnInit {
  devices: Device[] = [];
  categories: Category[] = [];
  displayedColumns = ['name', 'category', 'status', 'last_seen_at', 'actions'];

  searchQuery = '';
  categoryFilter: number | null = null;
  statusFilter: string | null = null;

  constructor(
    private devicesService: DevicesService,
    private categoriesService: CategoriesService,
    public dialog: MatDialog,
  ) { }

  ngOnInit(): void {
    this.categoriesService.list().subscribe(response => {
      this.categories = response.results;
    });
    this.refresh();
  }

  refresh(): void {
    const params: any = {};
    if (this.searchQuery) params.search = this.searchQuery;
    if (this.categoryFilter != null) params.category = this.categoryFilter;
    if (this.statusFilter) params.status = this.statusFilter;

    this.devicesService.list(params).subscribe(response => {
      this.devices = response.results;
    });
  }

  getCategoryName(category: number | Category): string {
    if (typeof category === 'number') {
      return this.categories.find(c => c.id === category)?.name || String(category);
    }
    return category.name;
  }

  setStatus(device: Device, status: string): void {
    this.devicesService.setStatus(device.id, { status }).subscribe(() => this.refresh());
  }

  deleteDevice(id: number): void {
    this.devicesService.delete(id).subscribe(() => this.refresh());
  }

  openCreateDialog(): void {
    import('./device-dialog.component').then(m => {
      const dialogRef = this.dialog.open(m.DeviceDialogComponent, {
        data: { categories: this.categories },
      });
      dialogRef.afterClosed().subscribe((result: any) => {
        if (!result) return;
        this.devicesService.create(result).subscribe(() => this.refresh());
      });
    });
  }

  formatDate(isoString?: string): string {
    if (!isoString) return '—';
    try {
      const date = new Date(isoString);
      return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  }
}