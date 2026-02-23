import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

interface TokenResponse {
  access: string;
  refresh?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = environment.apiBaseUrl;
  private readonly ACCESS_KEY = 'access_token';
  private readonly REFRESH_KEY = 'refresh_token';

  private authenticated$ = new BehaviorSubject<boolean>(this.hasAccessToken());

  constructor(private http: HttpClient) { }

  login(username: string, password: string): Observable<void> {
    return this.http
      .post<TokenResponse>(`${this.apiUrl}/auth/token/`, { username, password })
      .pipe(
        tap(response => {
          localStorage.setItem(this.ACCESS_KEY, response.access);
          if (response.refresh) {
            localStorage.setItem(this.REFRESH_KEY, response.refresh);
          }
          this.authenticated$.next(true);
        }),
        map(() => void 0),
      );
  }

  register(username: string, email: string, password: string): Observable<void> {
    return this.http
      .post(`${this.apiUrl}/auth/register`, { username, email, password })
      .pipe(map(() => void 0));
  }

  refresh(): Observable<string> {
    const refreshToken = localStorage.getItem(this.REFRESH_KEY);
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token'));
    }

    return this.http
      .post<TokenResponse>(`${this.apiUrl}/auth/refresh/`, { refresh: refreshToken })
      .pipe(
        tap(response => localStorage.setItem(this.ACCESS_KEY, response.access)),
        map(response => response.access),
      );
  }

  logout(): void {
    localStorage.removeItem(this.ACCESS_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
    this.authenticated$.next(false);
  }

  isAuthenticated(): Observable<boolean> {
    return this.authenticated$.asObservable();
  }

  hasAccessToken(): boolean {
    return !!localStorage.getItem(this.ACCESS_KEY);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_KEY);
  }
}