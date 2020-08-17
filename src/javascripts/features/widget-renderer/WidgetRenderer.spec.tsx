import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { WidgetRenderer } from './WidgetRenderer';
import { WidgetLocation, Widget, WidgetNamespace, HostingType } from './interfaces';
import { KnownSDK } from 'contentful-ui-extensions-sdk';
import { ChannelEvent } from './channelTypes';

const widget: Widget = {
  id: 'something',
  namespace: WidgetNamespace.APP,
  name: 'Something',
  slug: 'something',
  iconUrl: 'https://icon',
  locations: [{ location: WidgetLocation.ENTRY_FIELD, fieldTypes: [{ type: 'Symbol' }] }],
  hosting: {
    type: HostingType.SRCDOC,
    value: '<!DOCTYPE html><h1>test</h1>',
  },
  parameters: {
    definitions: {
      installation: [],
      instance: [],
    },
    values: {
      installation: { test: 'installation' },
    },
  },
};

const mockMethod = jest.fn().mockReturnValue(jest.fn());
const sdk = ({
  field: {
    getValue: () => 'test',
    onIsDisabledChanged: mockMethod,
    onSchemaErrorsChanged: mockMethod,
  },
  contentType: { fields: [] },
  entry: {
    getSys: () => ({ id: 'test' }),
    onSysChanged: mockMethod,
    fields: {
      hello: {
        id: 'hello',
        locales: ['en'],
        getForLocale: () => ({
          onValueChanged: mockMethod,
          onIsDisabledChanged: mockMethod,
          onSchemaErrorsChanged: mockMethod,
        }),
      },
    },
  },
  editor: {
    onLocaleSettingsChanged: mockMethod,
    onShowDisabledFieldsChanged: mockMethod,
  },
  navigator: {
    onSlideInNavigation: mockMethod,
  },
  space: {
    getCachedContentTypes: () => [],
  },
  access: {
    can: mockMethod,
  },
  parameters: {
    installation: { test: 'installation' },
    instance: { test: 'instance' },
  },
} as unknown) as KnownSDK;

function renderRenderer(widget: Widget) {
  const { container } = render(
    <WidgetRenderer widget={widget} sdk={sdk} location={WidgetLocation.ENTRY_FIELD} />
  );

  return container.firstChild as HTMLIFrameElement;
}

describe('WidgetRenderer', () => {
  it('renders srcdoc-based widget', () => {
    const renderer = renderRenderer(widget);

    expect(renderer.getAttribute('srcdoc')).toEqual('<!DOCTYPE html><h1>test</h1>');
    expect(renderer.getAttribute('src')).toBe(null);
    expect(renderer.getAttribute('sandbox')).toEqual(
      'allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms allow-downloads'
    );
  });

  it('renders src-based widget', () => {
    const renderer = renderRenderer({
      ...widget,
      hosting: {
        type: HostingType.SRC,
        value: 'https://some-source',
      },
    });

    expect(renderer.getAttribute('src')).toEqual('https://some-source');
    expect(renderer.getAttribute('srcdoc')).toBe(null);
    expect(renderer.getAttribute('sandbox')).toEqual(
      'allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms allow-downloads allow-same-origin'
    );
  });

  it('connect with a widget', () => {
    const postMessage = jest.fn();
    const renderer = renderRenderer(widget);

    renderer.contentWindow!.postMessage = postMessage;

    fireEvent.load(renderer, {});

    expect(postMessage).toHaveBeenCalledTimes(1);
    expect(postMessage.mock.calls[0][0]).toMatchObject({
      method: ChannelEvent.Connect,
      params: [
        {
          entry: {
            sys: {
              id: 'test',
            },
          },
          parameters: {
            installation: { test: 'installation' },
            instance: { test: 'instance' },
          },
        },
        [],
      ],
    });
  });
});
