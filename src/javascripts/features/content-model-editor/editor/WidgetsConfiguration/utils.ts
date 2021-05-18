export const isSameWidget = (
  widgetOne: { widgetId: string; widgetNamespace: string },
  widgetTwo: { widgetId: string; widgetNamespace: string }
) =>
  widgetOne.widgetId === widgetTwo.widgetId &&
  widgetOne.widgetNamespace === widgetTwo.widgetNamespace;
