import React from 'react';
import Enzyme from 'enzyme';
import LocalesListPricingTwo from '../LocalesListPricingTwo.es6';

describe('app/settings/locales/LocalesListPricingTwo', () => {
  it('should match snapshot', () => {
    const wrapper = Enzyme.shallow(
      <LocalesListPricingTwo
        locales={[]}
        canChangeSpace={true}
        insideMasterEnv={true}
        localeResource={{
          usage: 0,
          limits: {
            maximum: 5
          }
        }}
        subscriptionState={{}}
        upgradeSpace={() => {}}
      />
    );
    expect(wrapper).toMatchSnapshot();
  });
});
