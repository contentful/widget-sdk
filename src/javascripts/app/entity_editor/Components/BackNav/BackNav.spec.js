import React from 'react';
import { shallow } from 'enzyme';
import BackNav from './index.es6';
import { goToPreviousSlideOrExit } from 'navigation/SlideInNavigator/index.es6';

jest.mock(
  'navigation/SlideInNavigator/index.es6',
  () => ({
    goToPreviousSlideOrExit: jest.fn()
  }),
  { virtual: true }
);

describe('BackNav', () => {
  it('renders the back navigation button with the icon', () => {
    const wrapper = shallow(<BackNav />);

    const icon = wrapper
      .find('div.breadcrumbs-widget')
      .find('div.breadcrumbs-container')
      .find('div.btn.btn__back')
      .find('Icon');
    expect(icon.prop('name')).toEqual('back');
  });

  it('navigates to the previous slide-in entity or list sref', () => {
    const wrapper = shallow(<BackNav />);

    const backNavButton = wrapper.find('div.btn.btn__back');

    expect(goToPreviousSlideOrExit).not.toHaveBeenCalled();

    backNavButton.simulate('click');

    expect(goToPreviousSlideOrExit).toHaveBeenCalledTimes(1);
    expect(goToPreviousSlideOrExit).toHaveBeenCalledWith('arrow_back');
  });
});
