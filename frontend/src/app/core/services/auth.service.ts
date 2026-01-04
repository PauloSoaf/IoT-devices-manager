import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

interface TokenResponse { access: string; refresh?: string; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = environment.apiBaseUrl;
  private readonly ACCESS_KEY = 'access_token';
  private readonly REFRESH_KEY = 'refresh_token';

  private isAuth$ = new BehaviorSubject<boolean>(this.hasAccessToken());

  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<void> {
    return this.http.post<TokenResponse>(`${this.api}/auth/token/`, { username, password }).pipe(
      tap(res => {
        localStorage.setItem(this.ACCESS_KEY, res.access);
        if (res.refresh) localStorage.setItem(this.REFRESH_KEY, res.refresh);
        this.isAuth$.next(true);
      }),
      map(() => void 0)
    );
  }

  register(username: string, email: string, password: string): Observable<void> {
    return this.http.post(`${this.api}/auth/register`, { username, email, password }).pipe(map(() => void 0));
  }

  refresh(): Observable<string> {
    const refresh = localStorage.getItem(this.REFRESH_KEY);
    if (!refresh) return throwError(() => new Error('No refresh token'));
    return this.http.post<TokenResponse>(`${this.api}/auth/refresh/`, { refresh }).pipe(
      tap(res => localStorage.setItem(this.ACCESS_KEY, res.access)),
      map(res => res.access)
    );
  }

  logout(): void {
    localStorage.removeItem(this.ACCESS_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
    this.isAuth$.next(false);
  }

  isAuthenticated(): Observable<boolean> {
    return this.isAuth$.asObservable();
  }

  hasAccessToken(): boolean {
    return !!localStorage.getItem(this.ACCESS_KEY);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_KEY);
  }
}