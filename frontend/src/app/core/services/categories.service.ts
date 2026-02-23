import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Category, Paginated } from '../models';

@Injectable({ providedIn: 'root' })
export class CategoriesService {
  private readonly base = `${environment.apiBaseUrl}/categories/`;
  constructor(private http: HttpClient) {}

  list(params: any = {}): Observable<Paginated<Category>> {
    return this.http.get<Paginated<Category>>(this.base, { params });
  }
  get(id: number): Observable<Category> { return this.http.get<Category>(`${this.base}${id}/`); }
  create(data: Partial<Category>): Observable<Category> { return this.http.post<Category>(this.base, data); }
  update(id: number, data: Partial<Category>): Observable<Category> { return this.http.patch<Category>(`${this.base}${id}/`, data); }
  delete(id: number): Observable<void> { return this.http.delete<void>(`${this.base}${id}/`); }
}