import React from 'react';
import Enzyme from 'enzyme';
import 'jest-enzyme';
import BooleanSpaceFeature from './BooleanSpaceFeature';
import * as spaceContextMocked from 'ng/spaceContext';
import * as ProductCatalog from 'data/CMA/ProductCatalog';
import { SpaceEnvContextProvider } from 'core/services/SpaceEnvContext/SpaceEnvContext';
import { waitFor } from '@testing-library/dom';

const spaceId = 'space-id';

jest.mock('data/CMA/ProductCatalog', () => ({ getSpaceFeature: jest.fn() }));

const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

describe('BooleanSpaceFeature Component', () => {
  beforeEach(() => {
    ProductCatalog.getSpaceFeature.mockClear();
    spaceContextMocked.getId.mockReturnValue(spaceId);
  });
  it('renders children if feature is enabled', async () => {
    ProductCatalog.getSpaceFeature.mockResolvedValue(true);
    const wrapper = Enzyme.mount(
      <SpaceEnvContextProvider>
        <BooleanSpaceFeature spaceFeatureKey="ff">1</BooleanSpaceFeature>
      </SpaceEnvContextProvider>
    );

    await flushPromises();
    wrapper.update();

    expect(ProductCatalog.getSpaceFeature).toHaveBeenCalledWith(`fg5eidi9k2qp`, 'ff', false);
    expect(wrapper).toMatchSnapshot();
  });

  it('renders null if feature is disabled', async () => {
    ProductCatalog.getSpaceFeature.mockResolvedValue(false);
    const wrapper = Enzyme.mount(
      <SpaceEnvContextProvider>
        <BooleanSpaceFeature spaceFeatureKey="ff">1</BooleanSpaceFeature>
      </SpaceEnvContextProvider>
    );

    await flushPromises();
    wrapper.update();

    expect(ProductCatalog.getSpaceFeature).toHaveBeenCalledWith(`fg5eidi9k2qp`, 'ff', false);
    expect(wrapper).toMatchSnapshot();
  });

  describe('render prop', () => {
    it('invokes child function with current variation', async () => {
      ProductCatalog.getSpaceFeature.mockResolvedValue(true);

      const renderProp = jest.fn().mockImplementation(() => 1);
      const wrapper = Enzyme.mount(
        <SpaceEnvContextProvider>
          <BooleanSpaceFeature spaceFeatureKey="ff">{renderProp}</BooleanSpaceFeature>
        </SpaceEnvContextProvider>
      );

      wrapper.update();

      await waitFor(() => expect(renderProp).toHaveBeenCalledWith({ currentVariation: true }));
    });
  });
});
