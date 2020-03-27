import React from 'react';
import Enzyme from 'enzyme';
import 'jest-enzyme';
import BooleanSpaceFeature from './BooleanSpaceFeature';
import flushPromises from 'test/helpers/flushPromises';
import * as spaceContextMocked from 'ng/spaceContext';
import ProductCatalog from 'data/CMA/ProductCatalog';

const spaceId = 'space-id';

jest.mock('data/CMA/ProductCatalog', () => ({ getCurrentSpaceFeature: jest.fn() }));

describe('BooleanSpaceFeature Component', () => {
  beforeEach(() => {
    ProductCatalog.getCurrentSpaceFeature.mockClear();
    spaceContextMocked.getId.mockReturnValue(spaceId);
  });
  it('renders children if feature is enabled', async () => {
    ProductCatalog.getCurrentSpaceFeature.mockResolvedValue(true);
    const wrapper = Enzyme.mount(<BooleanSpaceFeature spaceFeatureKey="ff">1</BooleanSpaceFeature>);

    await flushPromises();
    wrapper.update();

    expect(ProductCatalog.getCurrentSpaceFeature).toHaveBeenCalledWith('ff', false);
    expect(wrapper).toMatchSnapshot();
  });

  it('renders null if feature is disabled', async () => {
    ProductCatalog.getCurrentSpaceFeature.mockResolvedValue(false);
    const wrapper = Enzyme.mount(<BooleanSpaceFeature spaceFeatureKey="ff">1</BooleanSpaceFeature>);

    await flushPromises();
    wrapper.update();

    expect(ProductCatalog.getCurrentSpaceFeature).toHaveBeenCalledWith('ff', false);
    expect(wrapper).toMatchSnapshot();
  });

  describe('render prop', () => {
    it('invokes child function with current variation', async () => {
      ProductCatalog.getCurrentSpaceFeature.mockResolvedValue(true);

      const renderProp = jest.fn().mockImplementation(() => 1);
      const wrapper = Enzyme.mount(
        <BooleanSpaceFeature spaceFeatureKey="ff">{renderProp}</BooleanSpaceFeature>
      );

      await flushPromises();
      wrapper.update();

      expect(renderProp).toHaveBeenCalledWith({ currentVariation: true });
    });
  });
});
