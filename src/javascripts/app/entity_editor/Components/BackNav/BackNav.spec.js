import React from 'react';
import { shallow } from 'enzyme';
import BackNav from '.';
import { goToPreviousSlideOrExit } from 'navigation/SlideInNavigator';

jest.mock('navigation/SlideInNavigator', () => ({
  goToPreviousSlideOrExit: jest.fn(),
}));

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
