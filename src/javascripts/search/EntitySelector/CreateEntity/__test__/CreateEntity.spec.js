import React from 'react';
import { mount } from 'enzyme';
import { merge } from 'lodash';

import CreateEntity, { entityTypes } from '../index.es6';
import { MockedProvider } from '../../../../reactServiceContext';

import flushPromises from '../../../../../../test/helpers/flushPromises';

const getFakeServices = args =>
  merge(
    {
      'access_control/AccessChecker': {
        canCreateAsset: jest.fn(),
        canPerformActionOnEntryOfType: jest.fn(),
        Action: { CREATE: 'Create' }
      },
      entityCreator: {
        newEntry: jest.fn().mockResolvedValue({}),
        newAsset: jest.fn().mockResolvedValue({})
      },
      logger: {
        logError: jest.fn()
      },
      'navigation/SlideInNavigator': {
        goToSlideInEntity: jest.fn()
      }
    },
    args
  );
const mountComponent = (props, services = {}) => {
  return mount(
    <MockedProvider services={getFakeServices(services)}>
      <CreateEntity {...props} />
    </MockedProvider>
  );
};

describe('CreateEntity', () => {
  it('renders "create entry" link if entity type is "Entry"', () => {
    const props = {
      type: entityTypes.Entry,
      contentTypes: [{ sys: {} }],
      onSelect: () => {}
    };
    const wrapper = mountComponent(props, {
      'access_control/AccessChecker': {
        canPerformActionOnEntryOfType: jest.fn().mockReturnValue(true)
      }
    });

    expect(wrapper.find('[data-test-id="create-entry"]')).toHaveLength(1);
  });

  it('renders "create asset" link if entity type is "Asset"', () => {
    const props = {
      type: entityTypes.Asset,
      contentTypes: [{ sys: {} }],
      onSelect: () => {}
    };
    const wrapper = mountComponent(props, {
      'access_control/AccessChecker': { canCreateAsset: jest.fn().mockReturnValue(true) }
    });

    expect(wrapper.find('[data-test-id="create-asset"]')).toHaveLength(1);
  });

  it('does not render "create entry" link if user has no "CREATE" access on the passed content types', () => {
    const props = {
      type: entityTypes.Entry,
      contentTypes: [{ sys: {} }],
      onSelect: () => {}
    };
    const wrapper = mountComponent(props);

    expect(wrapper.find('[data-test-id="create-entry"]')).toHaveLength(0);
  });

  it('does not render "create asset" link if user has no "CREATE" access on assets', () => {
    const props = {
      type: entityTypes.Asset,
      contentTypes: [{ sys: {} }],
      onSelect: () => {}
    };
    const wrapper = mountComponent(props);

    expect(wrapper.find('[data-test-id="create-asset"]')).toHaveLength(0);
  });

  it('creates an entry when a content type is clicked and opens slide in editor', async () => {
    const props = {
      type: entityTypes.Entry,
      contentTypes: [{ sys: { id: 'abs' } }],
      onSelect: jest.fn()
    };
    const entry = { data: { sys: { id: '1', type: entityTypes.Entry } } };
    const newEntrySpy = jest.fn().mockResolvedValue(entry);
    const goToSlideInEntity = jest.fn();
    const wrapper = mountComponent(props, {
      'access_control/AccessChecker': {
        canPerformActionOnEntryOfType: jest.fn().mockResolvedValue(true)
      },
      entityCreator: { newEntry: newEntrySpy },
      'navigation/SlideInNavigator': {
        goToSlideInEntity
      }
    });

    wrapper.find('[data-test-id="cta"]').simulate('click');

    await flushPromises();
    expect(newEntrySpy).toHaveBeenCalledWith('abs');
    expect(props.onSelect).toHaveBeenCalledTimes(1);
    expect(props.onSelect).toHaveBeenCalledWith(entry.data);
    expect(goToSlideInEntity).toHaveBeenCalledWith({ id: '1', type: entityTypes.Entry }, true);
  });

  it('creates an asset when "create asset" link is clicked and opens slide in editor', async () => {
    const props = {
      type: entityTypes.Asset,
      onSelect: jest.fn()
    };
    const asset = { data: { sys: { id: '1', type: entityTypes.Asset } } };
    const newAssetSpy = jest.fn().mockResolvedValue(asset);
    const goToSlideInEntity = jest.fn();
    const wrapper = mountComponent(props, {
      'access_control/AccessChecker': { canCreateAsset: jest.fn().mockReturnValue(true) },
      entityCreator: { newAsset: newAssetSpy },
      'navigation/SlideInNavigator': {
        goToSlideInEntity
      }
    });

    wrapper.find('[data-test-id="create-asset"]').simulate('click');

    await flushPromises();
    expect(newAssetSpy).toHaveBeenCalledTimes(1);
    expect(props.onSelect).toHaveBeenCalledTimes(1);
    expect(props.onSelect).toHaveBeenCalledWith(asset.data);
    expect(goToSlideInEntity).toHaveBeenLastCalledWith({ id: '1', type: entityTypes.Asset }, true);
  });
});
