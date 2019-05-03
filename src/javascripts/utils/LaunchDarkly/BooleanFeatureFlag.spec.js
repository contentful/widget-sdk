import React from 'react';
import Enzyme from 'enzyme';
import BooleanFeatureFlag from './BooleanFeatureFlag.es6';
import flushPromises from 'testHelpers/flushPromises';

import { getCurrentVariation } from 'utils/LaunchDarkly/index.es6';

describe('BooleanFeatureFlag Component', () => {
  it('renders children if feature is enabled', async () => {
    getCurrentVariation.mockResolvedValue(true);
    const wrapper = Enzyme.mount(<BooleanFeatureFlag featureFlagKey="ff">1</BooleanFeatureFlag>);

    await flushPromises();
    wrapper.update();

    expect(getCurrentVariation).toHaveBeenCalledWith('ff');
    expect(wrapper).toMatchSnapshot();
  });

  it('renders null if feature is disabled', async () => {
    getCurrentVariation.mockResolvedValue(false);
    const wrapper = Enzyme.mount(<BooleanFeatureFlag featureFlagKey="ff">1</BooleanFeatureFlag>);

    await flushPromises();
    wrapper.update();

    expect(getCurrentVariation).toHaveBeenCalledWith('ff');
    expect(wrapper).toMatchSnapshot();
  });

  describe('render prop', () => {
    it('invokes child function with current variation', async () => {
      getCurrentVariation.mockResolvedValue(true);

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
