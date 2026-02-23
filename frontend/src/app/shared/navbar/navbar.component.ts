import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertsService } from '../../core/services/alerts.service';

@Component({
    selector: 'app-navbar',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit {
    @Input() title = 'Dashboard';

    alerts: any[] = [];
    unresolvedCount = 0;
    isDropdownOpen = false;

    constructor(private alertsService: AlertsService) { }

    ngOnInit(): void {
        this.loadAlerts();
    }

    toggleDropdown(): void {
        this.isDropdownOpen = !this.isDropdownOpen;
        if (this.isDropdownOpen) {
            this.loadAlerts();
        }
    }

    closeDropdown(): void {
        this.isDropdownOpen = false;
    }

    resolveAlert(id: number): void {
        this.alertsService.resolve(id).subscribe(() => {
            this.loadAlerts();
        });
    }

    private loadAlerts(): void {
        this.alertsService.list({ resolved: false, page_size: 10 }).subscribe(response => {
            this.alerts = response.results;
            this.unresolvedCount = response.count;
        });
    }
}
