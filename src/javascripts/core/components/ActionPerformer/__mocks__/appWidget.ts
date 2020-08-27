import { Widget, WidgetNamespace, HostingType, WidgetLocation } from '@contentful/widget-renderer';

export const appWidgetMock: Widget = {
  namespace: WidgetNamespace.APP,
  id: '1SZgLiOT63ijEzPJZQ4QWT',
  name: 'Typeform',
  hosting: {
    type: HostingType.SRC,
    value: 'https://typeform.ctfapps.net/frontend',
  },
  slug: 'typeform',
  iconUrl:
    '//images.ctfassets.net/lpjm8d10rkpy/6TFC6qGkkxgMe0QlQ72Lid/45bd015f693a58c71a5642c2280596a4/typeform-logo-symbol-1585307156_1.svg',
  locations: [
    { location: WidgetLocation.APP_CONFIG },
    { location: WidgetLocation.ENTRY_FIELD, fieldTypes: [{ type: 'Symbol' }] },
    { location: WidgetLocation.DIALOG },
  ],
  parameters: {
    definitions: {
      instance: [],
      installation: [],
    },
    values: {
      installation: {},
    },
  },
};
