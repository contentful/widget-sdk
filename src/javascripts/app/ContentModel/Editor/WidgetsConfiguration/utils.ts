import { ConfigurationItem } from './interfaces';

export const isSameWidget = (widgetOne: ConfigurationItem, widgetTwo: ConfigurationItem) =>
  widgetOne.widgetId === widgetTwo.widgetId &&
  widgetOne.widgetNamespace === widgetTwo.widgetNamespace;
