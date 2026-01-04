import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { DevicesService } from '../../core/services/devices.service';
import { MeasurementsService } from '../../core/services/measurements.service';
import { WebSocketService, WsEvent } from '../../core/services/websocket.service';

@Component({
  selector: 'app-device-detail',
  standalone: true,
  imports: [CommonModule, MatCardModule, NgChartsModule],
  template: `
    <mat-card *ngIf="device">
      <h2>{{device.name}}</h2>
      <div>Status: {{device.status}} | Category: {{getCategory(device.category)}} | UUID: {{device.public_id}}</div>
    </mat-card>

    <mat-card>
      <h3>Timeseries</h3>
      <canvas baseChart [data]="chartData" [options]="chartOptions" [type]="'line'"></canvas>
    </mat-card>
  `
})
export class DeviceDetailComponent implements OnInit, OnDestroy {
  device: any;
  chartOptions: ChartConfiguration['options'] = { responsive: true };
  chartData: ChartConfiguration['data'] = { labels: [], datasets: [{ label:'value', data: [] }] };
  sub: any;

  constructor(private route: ActivatedRoute, private devices: DevicesService, private measurements: MeasurementsService, private ws: WebSocketService) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.devices.get(id).subscribe(d => {
      this.device = d;
      const now = new Date(); const from = new Date(now.getTime() - 24*60*60*1000).toISOString();
      this.measurements.timeseries({ device: d.id, metric: 'temperature', from, bucket:'1m' }).subscribe(points => {
        this.chartData = { labels: points.map(p=>p.timestamp), datasets: [{ label:'temperature', data: points.map(p=>p.avg) }] };
      });
      const stream = this.ws.connectDevice(d.public_id);
      this.sub = stream.subscribe((ev: WsEvent) => {
        if (ev.type === 'measurement' && ev.device_public_id === d.public_id) {
          this.chartData.labels = [...(this.chartData.labels||[]), ev.timestamp];
          (this.chartData.datasets[0].data as number[]).push(ev.value);
          this.chartData = { ...this.chartData }; // trigger change
        }
      });
    });
  }

  ngOnDestroy(): void { if (this.device) this.ws.disconnectDevice(this.device.public_id); if (this.sub) this.sub.unsubscribe(); }
  getCategory(cat: any): string { return typeof cat === 'number' ? String(cat) : cat?.name || ''; }
}