import { WidgetNamespace, Location } from 'features/widget-renderer';
export type AvailabilityStatus = 'alpha' | 'beta';
export interface ConfigurationItem {
  widgetId: string;
  widgetNamespace: WidgetNamespace;
  name: string;
  description?: string;
  locations?: Location[];
  parameters?: any;
  availabilityStatus?: AvailabilityStatus;
}
