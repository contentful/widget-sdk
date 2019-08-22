import React from 'react';
import Enzyme from 'enzyme';
import BooleanFeatureFlag from './BooleanFeatureFlag.es6';
import flushPromises from 'testHelpers/flushPromises';
import * as spaceContextMocked from 'ng/spaceContext';

import { getVariation } from 'LaunchDarkly.es6';

const organizationId = 'aaaa-dddd';

describe('BooleanFeatureFlag Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    spaceContextMocked.getData.mockReturnValue(organizationId);
  });
  it('renders children if feature is enabled', async () => {
    getVariation.mockResolvedValue(true);
    const wrapper = Enzyme.mount(<BooleanFeatureFlag featureFlagKey="ff">1</BooleanFeatureFlag>);

    await flushPromises();
    wrapper.update();

    expect(getVariation).toHaveBeenCalledWith('ff', { organizationId });
    expect(wrapper).toMatchSnapshot();
  });

  it('renders null if feature is disabled', async () => {
    getVariation.mockResolvedValue(false);
    const wrapper = Enzyme.mount(<BooleanFeatureFlag featureFlagKey="ff">1</BooleanFeatureFlag>);

    await flushPromises();
    wrapper.update();

    expect(getVariation).toHaveBeenCalledWith('ff', { organizationId });
    expect(wrapper).toMatchSnapshot();
  });

  describe('render prop', () => {
    it('invokes child function with current variation', async () => {
      getVariation.mockResolvedValue(true);

      const renderProp = jest.fn().mockImplementation(() => 1);
      const wrapper = Enzyme.mount(
        <BooleanFeatureFlag featureFlagKey="ff">{renderProp}</BooleanFeatureFlag>
      );

      await flushPromises();
      wrapper.update();

      expect(renderProp).toHaveBeenCalledWith({ currentVariation: true });
    });
  });
});
