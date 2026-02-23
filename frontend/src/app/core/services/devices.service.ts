import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Device, Paginated } from '../models';

@Injectable({ providedIn: 'root' })
export class DevicesService {
  private readonly base = `${environment.apiBaseUrl}/devices/`;
  constructor(private http: HttpClient) {}

  list(params: any = {}): Observable<Paginated<Device>> {
    return this.http.get<Paginated<Device>>(this.base, { params });
  }
  get(id: number): Observable<Device> { return this.http.get<Device>(`${this.base}${id}/`); }
  create(data: Partial<Device>): Observable<Device> { return this.http.post<Device>(this.base, data); }
  update(id: number, data: Partial<Device>): Observable<Device> { return this.http.patch<Device>(`${this.base}${id}/`, data); }
  delete(id: number): Observable<void> { return this.http.delete<void>(`${this.base}${id}/`); }

  setStatus(id: number, body: { status: string }): Observable<Device> {
    return this.http.post<Device>(`${this.base}${id}/set_status/`, body);
  }
}