export interface Category { id: number; name: string; description: string; }

export interface Device {
  id: number;
  public_id: string;
  name: string;
  category: number | Category;
  status: 'active' | 'inactive' | 'offline' | 'maintenance' | 'error';
  last_seen_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Measurement {
  id: number;
  device: number;
  metric: string;
  value: number;
  unit: string;
  timestamp: string;
}

export interface Alert {
  id: number;
  device: number;
  type: 'info' | 'warning' | 'critical' | 'error';
  message: string;
  created_at: string;
  resolved: boolean;
  resolved_at?: string | null;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface Aggregate {
  metric: string;
  min: number;
  max: number;
  avg: number;
  count: number;
}