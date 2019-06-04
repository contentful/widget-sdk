import React from 'react';
import Enzyme from 'enzyme';
import DeveloperResourcesComponent from './DeveloperResourcesComponent.es6.js';

jest.mock('./DeveloperResources.es6');

describe('DeveloperResourcesComponent', () => {
  const wrapper = Enzyme.mount(<DeveloperResourcesComponent />);

  it('shows JavaScript resources by default', function() {
    expect(wrapper.find('TabPanel#JavaScript-developer-resources')).toHaveLength(1);
  });

  it('shows PHP resources when PHP tab is selected', function() {
    wrapper.find('Tab#php').simulate('click');
    expect(wrapper.find('TabPanel#PHP-developer-resources')).toHaveLength(1);
    expect(wrapper.find('TabPanel#JavaScript-developer-resources')).toHaveLength(0);
  });
});
