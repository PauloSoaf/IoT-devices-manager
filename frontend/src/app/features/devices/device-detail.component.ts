import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { Subscription } from 'rxjs';
import { DevicesService } from '../../core/services/devices.service';
import { MeasurementsService } from '../../core/services/measurements.service';
import { WebSocketService, WsEvent } from '../../core/services/websocket.service';

@Component({
  selector: 'app-device-detail',
  standalone: true,
  imports: [CommonModule, MatCardModule, NgChartsModule],
  templateUrl: './device-detail.component.html',
  styleUrls: ['./device-detail.component.scss'],
})
export class DeviceDetailComponent implements OnInit, OnDestroy {
  device: any;

  chartOptions: ChartConfiguration['options'] = { responsive: true };
  chartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [{ label: 'value', data: [] }],
  };

  private webSocketSubscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private devicesService: DevicesService,
    private measurementsService: MeasurementsService,
    private webSocketService: WebSocketService,
  ) { }

  ngOnInit(): void {
    const deviceId = Number(this.route.snapshot.paramMap.get('id'));

    this.devicesService.get(deviceId).subscribe(device => {
      this.device = device;
      this.loadTimeseries(device);
      this.connectWebSocket(device);
    });
  }

  ngOnDestroy(): void {
    if (this.device) {
      this.webSocketService.disconnectDevice(this.device.public_id);
    }
    this.webSocketSubscription?.unsubscribe();
  }

  getCategoryLabel(category: any): string {
    return typeof category === 'number' ? String(category) : category?.name || '';
  }

  private loadTimeseries(device: any): void {
    const now = new Date();
    const from = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const metric = this.guessMetric(device);

    this.measurementsService
      .timeseries({ device: device.id, metric, from, bucket: '1m' })
      .subscribe(points => {
        this.chartData = {
          labels: points.map(p => this.formatTime(p.timestamp)),
          datasets: [{ label: metric, data: points.map(p => p.avg) }],
        };
      });
  }

  private connectWebSocket(device: any): void {
    const stream = this.webSocketService.connectDevice(device.public_id);

    this.webSocketSubscription = stream.subscribe((event: WsEvent) => {
      if (event.type === 'measurement' && event.device_public_id === device.public_id) {
        const labels = [...(this.chartData.labels || []), this.formatTime(event.timestamp)];
        const data = [...(this.chartData.datasets[0].data as number[]), event.value];

        this.chartData = {
          labels,
          datasets: [{ label: this.chartData.datasets[0].label || 'live', data }],
        };
      }
    });
  }

  private guessMetric(device: any): string {
    const categoryName = (device.category_name || '').toLowerCase();
    if (categoryName.includes('temperature')) return 'temperature';
    if (categoryName.includes('humidity')) return 'humidity';
    if (categoryName.includes('energy')) return 'energy';
    if (categoryName.includes('power')) return 'power';
    return 'temperature';
  }

  private formatTime(isoString: string): string {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoString;
    }
  }
}