import React from 'react';
import { mount } from 'enzyme';

import CreateEntity, { entityTypes } from '../index.es6';
import accessChecker from 'ng/access_control/AccessChecker';
import slideInNavigator from 'ng/navigation/SlideInNavigator';
import entityCreator from 'ng/entityCreator';

import flushPromises from '../../../../../../test/helpers/flushPromises';

jest.mock(
  'ng/entityCreator',
  () => ({
    newEntry: jest.fn().mockResolvedValue({}),
    newAsset: jest.fn().mockResolvedValue({})
  }),
  { virtual: true }
);

jest.mock(
  'ng/access_control/AccessChecker',
  () => ({
    canCreateAsset: jest.fn(),
    canPerformActionOnEntryOfType: jest.fn(),
    Action: { CREATE: 'Create' }
  }),
  { virtual: true }
);

const mountComponent = props => {
  return mount(<CreateEntity {...props} />);
};

describe('CreateEntity', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders "create entry" link if entity type is "Entry"', () => {
    const props = {
      type: entityTypes.Entry,
      contentTypes: [{ sys: {} }],
      onSelect: () => {}
    };
    accessChecker.canPerformActionOnEntryOfType.mockReturnValueOnce(true);
    const wrapper = mountComponent(props);
    expect(wrapper.find('[data-test-id="create-entry"]')).toHaveLength(1);
  });

  it('renders "create asset" link if entity type is "Asset"', () => {
    const props = {
      type: entityTypes.Asset,
      contentTypes: [{ sys: {} }],
      onSelect: () => {}
    };
    accessChecker.canCreateAsset.mockReturnValueOnce(true);
    const wrapper = mountComponent(props);

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

    accessChecker.canPerformActionOnEntryOfType.mockResolvedValueOnce(true);
    entityCreator.newEntry.mockResolvedValueOnce(entry);

    const wrapper = mountComponent(props);

    wrapper.find('[data-test-id="cta"]').simulate('click');

    await flushPromises();
    expect(entityCreator.newEntry).toHaveBeenCalledWith('abs');
    expect(props.onSelect).toHaveBeenCalledTimes(1);
    expect(props.onSelect).toHaveBeenCalledWith(entry.data);
    expect(slideInNavigator.goToSlideInEntity).toHaveBeenCalledWith(
      { id: '1', type: entityTypes.Entry },
      true
    );
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

    wrapper.find('[data-test-id="create-asset"]').simulate('click');

    await flushPromises();
    expect(entityCreator.newAsset).toHaveBeenCalledTimes(1);
    expect(props.onSelect).toHaveBeenCalledTimes(1);
    expect(props.onSelect).toHaveBeenCalledWith(asset.data);
    expect(slideInNavigator.goToSlideInEntity).toHaveBeenLastCalledWith(
      { id: '1', type: entityTypes.Asset },
      true
    );
  });
});
