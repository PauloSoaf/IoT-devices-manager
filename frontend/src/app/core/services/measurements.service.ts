import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Measurement, Paginated } from '../models';

@Injectable({ providedIn: 'root' })
export class MeasurementsService {
  private readonly base = `${environment.apiBaseUrl}/measurements/`;
  constructor(private http: HttpClient) { }

  list(params: any = {}): Observable<Paginated<Measurement>> {
    return this.http.get<Paginated<Measurement>>(this.base, { params });
  }

  aggregates(params: { metric?: string; device?: number; from?: string; to?: string }): Observable<any> {
    return this.http.get<any>(`${this.base}aggregate/`, { params });
  }

  aggregateByMetric(params: { device?: number; from?: string; to?: string } = {}): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}aggregate_by_metric/`, { params: params as any });
  }

  timeseries(params: { device: number; metric: string; from?: string; to?: string; bucket?: string }): Observable<any[]> {
    const mapped: any = { ...params };
    if (params.bucket) {
      mapped.group = params.bucket === '1m' ? 'minute' : params.bucket === '1h' ? 'hour' : 'day';
      delete mapped.bucket;
    }
    return this.http.get<any[]>(`${this.base}timeseries/`, { params: mapped });
  }
}