import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { Subscription } from 'rxjs';
import { DevicesService } from '../../core/services/devices.service';
import { AlertsService } from '../../core/services/alerts.service';
import { MeasurementsService } from '../../core/services/measurements.service';
import { WebSocketService, WsEvent } from '../../core/services/websocket.service';
import { Device } from '../../core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, NgChartsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  totalDevices = signal(0);
  activeDevices = signal(0);
  unresolvedAlerts = signal(0);
  latestSeen = signal('—');

  recentAlerts: any[] = [];

  chartOptions: ChartConfiguration['options'] = { responsive: true };

  aggregateChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [
      { label: 'avg', data: [] },
      { label: 'min', data: [] },
      { label: 'max', data: [] },
    ],
  };

  liveChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [{ label: 'live metric', data: [] }],
  };

  private webSocketSubscription?: Subscription;
  private liveDevice?: Device;

  constructor(
    private devicesService: DevicesService,
    private alertsService: AlertsService,
    private measurementsService: MeasurementsService,
    private webSocketService: WebSocketService,
  ) { }

  ngOnInit(): void {
    this.loadDeviceStats();
    this.loadAlerts();
    this.loadAggregateChart();
  }

  ngOnDestroy(): void {
    if (this.liveDevice) {
      this.webSocketService.disconnectDevice(this.liveDevice.public_id);
    }
    this.webSocketSubscription?.unsubscribe();
  }

  resolveAlert(id: number): void {
    this.alertsService.resolve(id).subscribe(() => {
      this.alertsService.list({ resolved: false }).subscribe(response => {
        this.recentAlerts = response.results.slice(0, 10);
      });
    });
  }

  private loadDeviceStats(): void {
    this.devicesService.list({ page_size: 100 }).subscribe(response => {
      this.totalDevices.set(response.count);

      const activeCount = response.results.filter(d => d.status === 'active').length;
      this.activeDevices.set(activeCount);

      const sorted = [...response.results].sort(
        (a, b) => (b.last_seen_at || '').localeCompare(a.last_seen_at || ''),
      );
      const latestDate = sorted[0]?.last_seen_at;
      this.latestSeen.set(latestDate ? this.formatDate(latestDate) : '—');

      const firstActiveDevice = response.results.find(d => d.status === 'active') || response.results[0];
      if (firstActiveDevice) {
        this.loadLiveChart(firstActiveDevice);
        this.connectWebSocket(firstActiveDevice);
      }
    });
  }

  private loadAlerts(): void {
    this.alertsService.list({ resolved: false }).subscribe(response => {
      this.unresolvedAlerts.set(response.count);
      this.recentAlerts = response.results.slice(0, 10);
    });
  }

  private loadAggregateChart(): void {
    this.measurementsService.aggregateByMetric().subscribe(rows => {
      const labels = rows.map((row: any) => row.metric);
      const avgValues = rows.map((row: any) => row.avg);
      const minValues = rows.map((row: any) => row.min);
      const maxValues = rows.map((row: any) => row.max);

      this.aggregateChartData = {
        labels,
        datasets: [
          { label: 'avg', data: avgValues },
          { label: 'min', data: minValues },
          { label: 'max', data: maxValues },
        ],
      };
    });
  }

  private loadLiveChart(device: Device): void {
    this.liveDevice = device;
    const now = new Date();
    const from = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
    const metric = this.guessMetric(device);

    this.measurementsService
      .timeseries({ device: device.id, metric, from, bucket: '1m' })
      .subscribe(points => {
        this.liveChartData = {
          labels: points.map(p => this.formatTime(p.timestamp)),
          datasets: [{ label: metric, data: points.map(p => p.avg) }],
        };
      });
  }

  private connectWebSocket(device: Device): void {
    const stream = this.webSocketService.connectDevice(device.public_id);

    this.webSocketSubscription = stream.subscribe((event: WsEvent) => {
      if (event.type === 'measurement' && event.device_public_id === device.public_id) {
        const labels = [...(this.liveChartData.labels || []), this.formatTime(event.timestamp)];
        const data = [...(this.liveChartData.datasets[0].data as number[]), event.value];

        const maxPoints = 120;
        if (labels.length > maxPoints) {
          labels.shift();
          data.shift();
        }

        this.liveChartData = {
          labels,
          datasets: [{ label: this.liveChartData.datasets[0].label || 'live', data }],
        };

        this.latestSeen.set(this.formatDate(event.timestamp));
      }
    });
  }

  private guessMetric(device: Device): string {
    const categoryName = ((device as any).category_name || '').toLowerCase();
    if (categoryName.includes('temperature')) return 'temperature';
    if (categoryName.includes('humidity')) return 'humidity';
    if (categoryName.includes('energy')) return 'energy';
    if (categoryName.includes('power')) return 'power';
    return 'temperature';
  }

  private formatDate(isoString: string): string {
    try {
      const date = new Date(isoString);
      return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
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