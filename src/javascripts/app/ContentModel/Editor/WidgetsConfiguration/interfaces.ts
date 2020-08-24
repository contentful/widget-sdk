import { WidgetNamespace, WidgetLocation } from 'features/widget-renderer';
export type AvailabilityStatus = 'alpha' | 'beta';
export interface ConfigurationItem {
  widgetId: string;
  widgetNamespace: WidgetNamespace;
  name: string;
  description?: string;
  locations?: WidgetLocation[];
  parameters?: any;
  availabilityStatus?: AvailabilityStatus;
  settings?: any;
}
