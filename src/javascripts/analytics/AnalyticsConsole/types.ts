export type Service = 'segment' | 'snowplow';

export interface Event {
  time: string;
  name: string;
  isValid: boolean;
  data?: object;
  snowplow: {
    name: string;
    version: string;
    data?: object;
    context?: object;
  };
  segment: {
    name: string;
    version: string;
    data?: object;
    context?: object;
  };
}

export interface FilteredEvent extends Event {
  index: number;
}

export type SessionData = {};
