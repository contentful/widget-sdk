import { WidgetNamespace, WidgetLocation } from '@contentful/widget-renderer';
import { Editor } from 'contentful-management/types';
export type AvailabilityStatus = 'alpha' | 'beta';
export interface ConfigurationItem {
  widgetId: string;
  widgetNamespace: WidgetNamespace;
  name?: string;
  description?: string;
  locations?: WidgetLocation[];
  parameters?: any;
  availabilityStatus?: AvailabilityStatus;
  settings?: any;
  disabled?: boolean;
  problem?: boolean;
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

export interface DefaultWidget {
  widgetId: string;
  widgetNamespace: WidgetNamespace;
  name: string;
}

export type SavedConfigItem = Editor & {
  widgetNamespace: WidgetNamespace;
};
