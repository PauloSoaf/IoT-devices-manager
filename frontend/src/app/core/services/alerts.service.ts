import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Alert, Paginated } from '../models';

@Injectable({ providedIn: 'root' })
export class AlertsService {
  private readonly base = `${environment.apiBaseUrl}/alerts/`;
  constructor(private http: HttpClient) {}

  list(params: any = {}): Observable<Paginated<Alert>> {
    return this.http.get<Paginated<Alert>>(this.base, { params });
  }
  get(id: number): Observable<Alert> { return this.http.get<Alert>(`${this.base}${id}/`); }
  create(data: Partial<Alert>): Observable<Alert> { return this.http.post<Alert>(this.base, data); }
  update(id: number, data: Partial<Alert>): Observable<Alert> { return this.http.patch<Alert>(`${this.base}${id}/`, data); }
  delete(id: number): Observable<void> { return this.http.delete<void>(`${this.base}${id}/`); }

  resolve(id: number): Observable<Alert> { return this.http.post<Alert>(`${this.base}${id}/resolve/`, {}); }
  reopen(id: number): Observable<Alert> { return this.http.post<Alert>(`${this.base}${id}/reopen/`, {}); }
}