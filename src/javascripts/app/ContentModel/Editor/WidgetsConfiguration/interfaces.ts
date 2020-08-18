import { WidgetNamespace, Location } from 'features/widget-renderer';
export interface ConfigurationItem {
  widgetId: string;
  widgetNamespace: WidgetNamespace;
  name: string;
  description?: string;
  locations?: Location[];
  parameters?: any;
}
