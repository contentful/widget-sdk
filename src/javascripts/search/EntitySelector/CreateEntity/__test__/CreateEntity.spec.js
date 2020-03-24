import React from 'react';
import { mount } from 'enzyme';
import 'jest-enzyme';
import * as slideInNavigator from 'navigation/SlideInNavigator';

import CreateEntity, { entityTypes } from '..';
import * as accessChecker from 'access_control/AccessChecker';
import * as entityCreator from 'components/app_container/entityCreator';

import flushPromises from 'testHelpers/flushPromises';
import { act } from 'react-dom/test-utils';

jest.mock('navigation/SlideInNavigator', () => ({
  goToSlideInEntity: jest.fn()
}));

jest.mock('components/app_container/entityCreator', () => ({
  newEntry: jest.fn().mockResolvedValue({}),
  newAsset: jest.fn().mockResolvedValue({})
}));

jest.mock('access_control/AccessChecker', () => ({
  canCreateAsset: jest.fn(),
  canPerformActionOnEntryOfType: jest.fn(),
  Action: { CREATE: 'Create' }
}));

const mountComponent = props => {
  return mount(<CreateEntity {...props} />);
};

describe('CreateEntity', () => {
  it('renders "create entry" link if entity type is "Entry"', () => {
    const props = {
      type: entityTypes.Entry,
      contentTypes: [{ sys: {}, name: 'First content type' }],
      onSelect: () => {}
    };
    accessChecker.canPerformActionOnEntryOfType.mockReturnValueOnce(true);
    const wrapper = mountComponent(props);
    expect(wrapper.find('[data-test-id="create-entry-link-button"]')).toHaveLength(1);
  });

  it('renders "create asset" link if entity type is "Asset"', () => {
    const props = {
      type: entityTypes.Asset,
      contentTypes: [{ sys: {}, name: 'First content type' }],
      onSelect: () => {}
    };
    accessChecker.canCreateAsset.mockReturnValueOnce(true);
    const wrapper = mountComponent(props);

    expect(wrapper.find('[data-test-id="create-asset"]')).toHaveLength(1);
  });

  it('does not render "create entry" link if user has no "CREATE" access on the passed content types', () => {
    const props = {
      type: entityTypes.Entry,
      contentTypes: [{ sys: {}, name: 'First content type' }],
      onSelect: () => {}
    };
    const wrapper = mountComponent(props);

    expect(wrapper.find('[data-test-id="create-entry-link-button"]')).toHaveLength(0);
  });

  it('does not render "create asset" link if user has no "CREATE" access on assets', () => {
    const props = {
      type: entityTypes.Asset,
      contentTypes: [{ sys: {}, name: 'First content type' }],
      onSelect: () => {}
    };
    const wrapper = mountComponent(props);

    expect(wrapper.find('[data-test-id="create-asset"]')).toHaveLength(0);
  });

  it('creates an entry when a content type is clicked and opens slide in editor', async () => {
    const props = {
      type: entityTypes.Entry,
      contentTypes: [{ sys: { id: 'abs' }, name: 'First content type' }],
      onSelect: jest.fn()
    };
    const entry = { data: { sys: { id: '1', type: entityTypes.Entry } } };

    accessChecker.canPerformActionOnEntryOfType.mockResolvedValueOnce(true);
    entityCreator.newEntry.mockResolvedValueOnce(entry);

    const wrapper = mountComponent(props);

    act(() => {
      wrapper.find('[data-test-id="create-entry-link-button"]').simulate('click');
    });

    await flushPromises();
    wrapper.update();

    expect(entityCreator.newEntry).toHaveBeenCalledWith('abs');
    expect(props.onSelect).toHaveBeenCalledTimes(1);
    expect(props.onSelect).toHaveBeenCalledWith(entry.data);
    expect(slideInNavigator.goToSlideInEntity).toHaveBeenCalledWith({
      id: '1',
      type: entityTypes.Entry
    });
  });

  it('creates an asset when "create asset" link is clicked and opens slide in editor', async () => {
    const props = {
      type: entityTypes.Asset,
      onSelect: jest.fn()
    };
    const asset = { data: { sys: { id: '1', type: entityTypes.Asset } } };

    accessChecker.canCreateAsset.mockReturnValueOnce(true);
    entityCreator.newAsset.mockResolvedValueOnce(asset);

    const wrapper = mountComponent(props);

    act(() => {
      wrapper.find('[data-test-id="create-asset"]').simulate('click');
    });

    await flushPromises();
    wrapper.update();

    expect(entityCreator.newAsset).toHaveBeenCalledTimes(1);
    expect(props.onSelect).toHaveBeenCalledTimes(1);
    expect(props.onSelect).toHaveBeenCalledWith(asset.data);
    expect(slideInNavigator.goToSlideInEntity).toHaveBeenLastCalledWith({
      id: '1',
      type: entityTypes.Asset
    });
  });
});
