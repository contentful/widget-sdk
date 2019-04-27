import React from 'react';
import Enzyme from 'enzyme';
import { forEach, orderBy, random } from 'lodash';

import { withRichTextPublicationWarning as withPublicationWarning } from '../index.es6';
import { richTextDocument } from './helpers';

describe('withPublicationWarning', () => {
  it('renders wrapped component', () => {
    const [registerUnpublishedReferencesWarning, getValue] = registerMocks();
    const field = { registerUnpublishedReferencesWarning, getValue };

    const wrapper = mount(createWidgetAPI(field));

    expect(wrapper.text()).toBe('Hello');
  });

  it('registers publication warning', () => {
    const [registerUnpublishedReferencesWarning, getValue] = registerMocks();
    const field = { registerUnpublishedReferencesWarning, getValue };

    mount(createWidgetAPI(field));

    const callArg = registerUnpublishedReferencesWarning.mock.calls[0][0];
    expect(callArg).toContainEntry(['getData', expect.toBeFunction()]);
  });

  it('unregisters publication warning on unmount', () => {
    const [
      registerUnpublishedReferencesWarning,
      unRegisterUnpublishedReferencesWarning,
      getValue
    ] = registerMocks();
    const field = { registerUnpublishedReferencesWarning, getValue };

    const wrapper = mount(createWidgetAPI(field));
    wrapper.unmount();

    expect(unRegisterUnpublishedReferencesWarning).toBeCalled();
  });

  const testCases = {
    'no unpublished': {
      resolvedAssets: [newEntity('asset-1', true)],
      resolvedEntries: [newEntity('entry-2', true)],
      unpublishedRefs: []
    },
    'unpublished asset': {
      resolvedAssets: [newEntity('asset-1')],
      resolvedEntries: [newEntity('entry-2', true)],
      unpublishedRefs: [newEntity('asset-1')]
    },
    'unpublished entry': {
      resolvedAssets: [newEntity('asset-1', true)],
      resolvedEntries: [newEntity('entry-2')],
      unpublishedRefs: [newEntity('entry-2')]
    },
    'unpublished entries and assets': {
      resolvedAssets: [newEntity('asset-1')],
      resolvedEntries: [newEntity('entry-2')],
      unpublishedRefs: [newEntity('asset-1'), newEntity('entry-2')]
    }
  };
  forEach(testCases, ({ resolvedAssets, resolvedEntries, unpublishedRefs }, description) => {
    it(`returns ${description}`, async () => {
      const [registerUnpublishedReferencesWarning] = registerMocks();
      const field = {
        getValue() {
          return richTextDocument;
        },
        registerUnpublishedReferencesWarning
      };
      const widgetAPI = createWidgetAPI(field);

      widgetAPI.space.getAsset.mockImplementation(async id =>
        resolvedAssets.find(asset => asset.sys.id === id)
      );
      widgetAPI.space.getEntry.mockImplementation(async id =>
        resolvedEntries.find(entry => entry.sys.id === id)
      );

      mount(widgetAPI);

      const registerArg = registerUnpublishedReferencesWarning.mock.calls[0][0];
      const data = await registerArg.getData();

      expect(widgetAPI.space.getAsset).toBeCalledTimes(3);
      resolvedAssets
        .map(asset => asset.sys.id)
        .forEach(id => {
          expect(widgetAPI.space.getAsset).toBeCalledWith(id);
        });
      expect(widgetAPI.space.getEntry).toBeCalledTimes(3);
      resolvedEntries
        .map(entry => entry.sys.id)
        .forEach(id => {
          expect(widgetAPI.space.getEntry).toBeCalledWith(id);
        });
      expect(data.field).toEqual(field);
      expect(orderBy(data.references, 'sys.id')).toEqual(orderBy(unpublishedRefs, 'sys.id'));
    });
  });
});

function mount(widgetAPI) {
  const wrappedComponent = () => 'Hello';
  const WrappedWithPublicationWarning = withPublicationWarning(wrappedComponent);
  return Enzyme.mount(<WrappedWithPublicationWarning widgetAPI={widgetAPI} />);
}

function createWidgetAPI(field) {
  return {
    space: {
      getEntry: jest.fn(),
      getAsset: jest.fn()
    },
    field
  };
}

function registerMocks() {
  const unRegisterUnpublishedReferencesWarning = jest.fn();
  const getValue = jest.fn();
  const registerUnpublishedReferencesWarning = jest
    .fn()
    .mockReturnValue(unRegisterUnpublishedReferencesWarning);

  return [registerUnpublishedReferencesWarning, unRegisterUnpublishedReferencesWarning, getValue];
}

function newEntity(id, isPublished) {
  return {
    sys: {
      id,
      publishedVersion: isPublished ? random(1, 10) : undefined
    }
  };
}
