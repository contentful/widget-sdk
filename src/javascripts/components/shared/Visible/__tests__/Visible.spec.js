import React from 'react';
import Enzyme from 'enzyme';
import 'jest-enzyme';
import Visible from '..';

describe('Visible', () => {
  it('renders children if condition is truthy', () => {
    const component = Enzyme.mount(<Visible if={true}>Works</Visible>);
    expect(component).toMatchSnapshot();
  });

  it("doesn't render children if condition is falsy", () => {
    const component = Enzyme.mount(<Visible if={false}>Works</Visible>);
    expect(component).toMatchSnapshot();
  });
});