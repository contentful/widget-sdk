declare global {
  interface Window {
    analytics: any;
    GlobalSnowplowNamespace: Array<string>;
  }
}

export type Payload = Record<string, unknown>;

export type EventPayload = {
  schema?: string;
  data: Record<string, unknown>;
  contexts?: Record<string, unknown>;
};
