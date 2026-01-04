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

  constructor(private auth: AuthService) {}

  connectDevice(publicId: string): Subject<WsEvent> {
    const key = publicId;
    if (this.streams.has(key)) return this.streams.get(key)!;

    const stream = new Subject<WsEvent>();
    this.streams.set(key, stream);

    const token = this.auth.getAccessToken();
    const url = `${environment.wsBaseUrl}/ws/measurements/${publicId}/?token=${encodeURIComponent(token || '')}`;

    let backoff = 1000; // 1s initial, up to 30s
    const connect = () => {
      const ws = new WebSocket(url);
      this.sockets.set(key, ws);

      ws.onopen = () => { backoff = 1000; };
      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          if (msg?.type === 'measurement.created' && msg?.data) {
            const d = msg.data;
            const ev: WsEvent = {
              type: 'measurement',
              device_public_id: d.device_public_id,
              metric: d.metric,
              value: d.value,
              unit: d.unit,
              timestamp: d.recorded_at
            };
            stream.next(ev);
          } else {
            console.warn('Unknown WS event', msg);
          }
        } catch (e) {
          console.warn('Invalid WS payload', e);
        }
      };
      ws.onclose = () => {
        if (backoff < 30000) backoff *= 2;
        timer(backoff).subscribe(() => connect());
      };
      ws.onerror = () => {
        ws.close();
      };
    };

    connect();
    return stream;
  }

  disconnectDevice(publicId: string): void {
    const key = publicId;
    this.streams.get(key)?.complete();
    this.streams.delete(key);
    const ws = this.sockets.get(key);
    if (ws && ws.readyState === WebSocket.OPEN) ws.close();
    this.sockets.delete(key);
  }
}