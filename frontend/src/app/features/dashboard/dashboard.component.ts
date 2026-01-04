import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { DevicesService } from '../../core/services/devices.service';
import { AlertsService } from '../../core/services/alerts.service';
import { MeasurementsService } from '../../core/services/measurements.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, NgChartsModule],
  template: `
  <div class="grid">
    <mat-card><h3>Total devices</h3><div class="kpi">{{totalDevices()}}</div></mat-card>
    <mat-card><h3>Active</h3><div class="kpi">{{activeDevices()}}</div></mat-card>
    <mat-card><h3>Unresolved alerts</h3><div class="kpi">{{unresolvedAlerts()}}</div></mat-card>
    <mat-card><h3>Latest seen</h3><div class="kpi">{{latestSeen()}}</div></mat-card>
  </div>

  <mat-card>
    <h3>Aggregated metrics (avg/min/max)</h3>
    <canvas baseChart [data]="aggData" [options]="chartOptions" [type]="'bar'"></canvas>
  </mat-card>

  <mat-card>
    <h3>Live mini chart (last 60m)</h3>
    <canvas baseChart [data]="liveData" [options]="chartOptions" [type]="'line'"></canvas>
  </mat-card>

  <mat-card>
    <h3>Recent alerts</h3>
    <div *ngFor="let a of recentAlerts">{{a.type}} - {{a.message}}
      <button mat-button color="primary" (click)="resolve(a.id)">Resolve</button>
    </div>
  </mat-card>
  `,
  styles: [`.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px}.kpi{font-size:24px;font-weight:600}`]
})
export class DashboardComponent implements OnInit {
  totalDevices = signal(0);
  activeDevices = signal(0);
  unresolvedAlerts = signal(0);
  latestSeen = signal('—');

  recentAlerts: any[] = [];

  chartOptions: ChartConfiguration['options'] = { responsive: true };
  aggData: ChartConfiguration['data'] = { labels: ['temperature','humidity','power'], datasets: [{ label: 'avg', data: [] }, { label: 'min', data: [] }, { label: 'max', data: [] }] };
  liveData: ChartConfiguration['data'] = { labels: [], datasets: [{ label: 'live metric', data: [] }] };

  constructor(private devices: DevicesService, private alerts: AlertsService, private measurements: MeasurementsService) {}

  ngOnInit(): void {
    this.devices.list().subscribe(r => {
      this.totalDevices.set(r.count);
      const active = r.results.filter(d => d.status === 'active').length;
      this.activeDevices.set(active);
      const latest = r.results.sort((a,b)=> (b.last_seen_at||'').localeCompare(a.last_seen_at||''))[0]?.last_seen_at;
      this.latestSeen.set(latest || '—');
    });
    this.alerts.list({ resolved: false }).subscribe(r => { this.unresolvedAlerts.set(r.count); this.recentAlerts = r.results.slice(0,10); });

    this.measurements.aggregates({}).subscribe(rows => {
      const labels = rows.map((x:any)=>x.metric);
      const avg = rows.map((x:any)=>x.avg_value || x.avg);
      const min = rows.map((x:any)=>x.min_value || x.min);
      const max = rows.map((x:any)=>x.max_value || x.max);
      this.aggData = { labels, datasets: [{ label:'avg', data: avg }, { label:'min', data: min }, { label:'max', data: max }] };
    });

    const now = new Date(); const from = new Date(now.getTime() - 60*60*1000).toISOString();
    this.measurements.timeseries({ device: 1, metric: 'temperature', from, bucket: '1m' }).subscribe(points => {
      this.liveData = { labels: points.map(p=>p.timestamp), datasets: [{ label:'temperature', data: points.map(p=>p.avg) }] };
    });
  }

  resolve(id: number) { this.alerts.resolve(id).subscribe(()=> this.alerts.list({ resolved:false }).subscribe(r=> this.recentAlerts = r.results.slice(0,10))); }
}