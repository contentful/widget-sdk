export type EventSource = 'segment' | 'snowplow' | 'raw';

export interface Event {
  time: string;
  isValid: boolean;
  raw: {
    // Untransformed data.
    name: string;
    version: undefined;
    data: object;
    context: undefined;
  };
  snowplow?: {
    name: string;
    version: undefined;
    data: object;
    context: undefined;
  };
  segment: {
    name?: string;
    version: string;
    data?: object;
    context?: object;
  };
}

export interface FilteredEvent extends Event {
  index: number;
}

export type SessionData = {};
