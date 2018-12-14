import React from 'react';
import Enzyme from 'enzyme';
import _ from 'lodash';

import withPublicationWarning from '../index.es6';
import { richTextDocument } from './helpers';

describe('withPublicationWarning', () => {
  it('renders wrapped component', () => {
    const [registerUnpublishedReferencesWarning] = registerMocks();
    const field = { registerUnpublishedReferencesWarning };

    const wrapper = mount({ field });

    expect(wrapper.text()).toBe('Hello');
  });

  it('registers publication warning', () => {
    const [registerUnpublishedReferencesWarning] = registerMocks();
    const field = { registerUnpublishedReferencesWarning };

    mount({ field });

    const callArg = registerUnpublishedReferencesWarning.mock.calls[0][0];
    expect(callArg).toContainEntry(['getData', expect.toBeFunction()]);
  });

  it('unregisters publication warning on unmount', () => {
    const [
      registerUnpublishedReferencesWarning,
      unRegisterUnpublishedReferencesWarning
    ] = registerMocks();
    const field = { registerUnpublishedReferencesWarning };

    const wrapper = mount({ field });
    wrapper.unmount();

    expect(unRegisterUnpublishedReferencesWarning).toBeCalled();
  });

  // eslint-disable-next-line no-restricted-syntax
  describe.each`
    title                               | resolvedAssets                 | resolvedEntries              | unpublishedRefs
    ${'no unpublished'}                 | ${[createMockEntity(1, true)]} | ${createMockEntity(2, true)} | ${[]}
    ${'unpublished entries and assets'} | ${createMockEntity(1)}         | ${createMockEntity(2)}       | ${[createMockEntity(1), createMockEntity(2)]}
  `('on document with $title', ({ resolvedAssets, resolvedEntries, unpublishedRefs }) => {
    it('provides a list of unpublished entities', async () => {
      const [registerUnpublishedReferencesWarning] = registerMocks();
      const field = {
        getValue() {
          return richTextDocument;
        },
        registerUnpublishedReferencesWarning
      };
      const widgetAPI = createWidgetAPI();

      widgetAPI.space.getAssets.mockResolvedValue({ items: resolvedAssets });
      widgetAPI.space.getEntries.mockResolvedValue({ items: resolvedEntries });

      mount({ field, widgetAPI });

      const registerArg = registerUnpublishedReferencesWarning.mock.calls[0][0];
      const data = await registerArg.getData();

      expect(widgetAPI.space.getEntries).toBeCalledWith({
        'sys.id[in]': 'entry-1,entry-3,entry-2'
      });
      expect(widgetAPI.space.getAssets).toBeCalledWith({ 'sys.id[in]': 'asset-1,asset-3,asset-2' });
      expect(data.field).toEqual(field);
      expect(_.orderBy(data.references, 'sys.id')).toEqual(_.orderBy(unpublishedRefs, 'sys.id'));
    });
  });
});

function mount({ field, widgetAPI = createWidgetAPI() }) {
  const wrappedComponent = () => 'Hello';
  const WrappedWithPublicationWarning = withPublicationWarning(wrappedComponent);
  return Enzyme.mount(<WrappedWithPublicationWarning widgetAPI={widgetAPI} field={field} />);
}

function createWidgetAPI() {
  return {
    space: {
      getEntries: jest.fn(),
      getAssets: jest.fn()
    }
  };
}

function registerMocks() {
  const unRegisterUnpublishedReferencesWarning = jest.fn();
  const registerUnpublishedReferencesWarning = jest
    .fn()
    .mockReturnValue(unRegisterUnpublishedReferencesWarning);

  return [registerUnpublishedReferencesWarning, unRegisterUnpublishedReferencesWarning];
}

function createMockEntity(id, isPublished) {
  const entity = {
    sys: {
      id
    }
  };

  if (isPublished) {
    entity.sys.publishedVersion = _.random(1, 10);
  }

  return entity;
}
