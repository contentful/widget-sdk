import React from 'react';
import { mount } from 'enzyme';
import sinon from 'sinon';
import { merge } from 'lodash';

import CreateEntity, { entityTypes } from '../index.es6';
import { MockedProvider } from '../../../../reactServiceContext';

import flushPromises from '../../../../../../test/helpers/flushPromises';

const getFakeServices = args =>
  merge(
    {
      'access_control/AccessChecker': {
        can: sinon.stub(),
        canPerformActionOnEntryOfType: sinon.stub(),
        Action: { CREATE: 'Create' }
      },
      entityCreator: {
        newEntry: sinon.stub().returns(Promise.resolve({})),
        newAsset: sinon.stub().returns(Promise.resolve({}))
      },
      logger: {
        logError: sinon.stub()
      },
      'navigation/SlideInNavigator': {
        goToSlideInEntity: sinon.stub()
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
      'access_control/AccessChecker': { canPerformActionOnEntryOfType: sinon.stub().returns(true) }
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
      'access_control/AccessChecker': { can: sinon.stub().returns(true) }
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
      onSelect: sinon.stub()
    };
    const entry = { data: { sys: { id: '1', type: entityTypes.Entry } } };
    const newEntrySpy = sinon.stub().returns(Promise.resolve(entry));
    const goToSlideInEntity = sinon.stub();
    const wrapper = mountComponent(props, {
      'access_control/AccessChecker': {
        canPerformActionOnEntryOfType: sinon.stub().returns(true)
      },
      entityCreator: { newEntry: newEntrySpy },
      'navigation/SlideInNavigator': {
        goToSlideInEntity
      }
    });

    wrapper.find('[data-test-id="cta"]').simulate('click');

    await flushPromises();
    expect(newEntrySpy.calledOnceWith('abs')).toBe(true);
    expect(props.onSelect.calledOnceWith(entry.data)).toBe(true);
    expect(goToSlideInEntity.calledWith({ id: '1', type: entityTypes.Entry }, true)).toBe(true);
  });

  it('creates an asset when "create asset" link is clicked and opens slide in editor', async () => {
    const props = {
      type: entityTypes.Asset,
      onSelect: sinon.stub()
    };
    const asset = { data: { sys: { id: '1', type: entityTypes.Asset } } };
    const newAssetSpy = sinon.stub().returns(Promise.resolve(asset));
    const goToSlideInEntity = sinon.stub();
    const wrapper = mountComponent(props, {
      'access_control/AccessChecker': { can: sinon.stub().returns(true) },
      entityCreator: { newAsset: newAssetSpy },
      'navigation/SlideInNavigator': {
        goToSlideInEntity
      }
    });

    wrapper.find('[data-test-id="create-asset"]').simulate('click');

    await flushPromises();
    expect(newAssetSpy.calledOnce).toBe(true);
    expect(props.onSelect.calledOnceWith(asset.data)).toBe(true);
    expect(goToSlideInEntity.calledOnceWith({ id: '1', type: entityTypes.Asset }, true)).toBe(true);
  });
});
