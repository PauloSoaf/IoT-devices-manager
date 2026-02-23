import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Subject, timer } from 'rxjs';
import { AuthService } from './auth.service';

export type WsEvent =
  | { type: 'measurement'; device_public_id: string; metric: string; value: number; unit: string; timestamp: string }
  | { type: 'alert'; device_public_id: string; alert: any };

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private sockets = new Map<string, WebSocket>();
  private streams = new Map<string, Subject<WsEvent>>();

  constructor(private authService: AuthService) { }

  connectDevice(publicId: string): Subject<WsEvent> {
    if (this.streams.has(publicId)) {
      return this.streams.get(publicId)!;
    }

    const stream = new Subject<WsEvent>();
    this.streams.set(publicId, stream);

    const token = this.authService.getAccessToken();

    let wsBase = environment.wsBaseUrl;
    if (!wsBase || wsBase === 'auto') {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      wsBase = `${protocol}//${window.location.host}`;
    }

    const url = `${wsBase}/ws/measurements/${publicId}/?token=${encodeURIComponent(token || '')}`;
    let reconnectDelay = 1000;

    const connect = () => {
      const socket = new WebSocket(url);
      this.sockets.set(publicId, socket);

      socket.onopen = () => {
        reconnectDelay = 1000;
      };

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message?.type === 'measurement.created' && message?.data) {
            const payload = message.data;
            stream.next({
              type: 'measurement',
              device_public_id: payload.device_public_id,
              metric: payload.metric,
              value: payload.value,
              unit: payload.unit,
              timestamp: payload.recorded_at,
            });
          }
        } catch {
          // skip malformed payloads
        }
      };

      socket.onclose = () => {
        if (reconnectDelay < 30000) reconnectDelay *= 2;
        timer(reconnectDelay).subscribe(() => connect());
      };

      socket.onerror = () => {
        socket.close();
      };
    };

    connect();
    return stream;
  }

  disconnectDevice(publicId: string): void {
    this.streams.get(publicId)?.complete();
    this.streams.delete(publicId);

    const socket = this.sockets.get(publicId);
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.close();
    }
    this.sockets.delete(publicId);
  }
}