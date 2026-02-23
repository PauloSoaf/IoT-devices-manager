import { Component } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, NavbarComponent],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent {
  pageTitle = 'Dashboard';

  private readonly titleMap: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/devices': 'Devices',
    '/categories': 'Categories',
  };

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        map((event: any) => event.urlAfterRedirects || event.url),
      )
      .subscribe((url: string) => {
        const match = Object.keys(this.titleMap).find(key => url.startsWith(key));
        this.pageTitle = match ? this.titleMap[match] : 'IoT Manager';

        if (url.match(/\/devices\/\d+/)) {
          this.pageTitle = 'Device Detail';
        }
      });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}