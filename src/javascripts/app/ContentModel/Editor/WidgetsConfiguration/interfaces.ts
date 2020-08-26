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
  disabled?: boolean;
}

export interface ConfigurableConfigurationItem extends ConfigurationItem {
  settings: any;
}

export interface CustomWidget {
  name: string;
  namespace: WidgetNamespace;
  id: string;
  locations: WidgetLocation[];
}
export function isCustomWidget(widget: CustomWidget | DefaultWidget): widget is CustomWidget {
  return (
    (widget as CustomWidget).id !== undefined && (widget as CustomWidget).namespace !== undefined
  );
}

export interface DefaultWidget {
  widgetId: string;
  widgetNamespace: WidgetNamespace;
  name: string;
}

export interface SavedConfigItem {
  widgetId: string;
  widgetNamespace: WidgetNamespace;
  disabled?: boolean;
  settings: Record<string, any>;
}
