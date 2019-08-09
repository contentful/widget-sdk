import React from 'react';
import { render, cleanup } from '@testing-library/react';
import StaticDropdown from './StaticDropdown.es6';
import 'jest-dom/extend-expect';
import { spacingM } from '@contentful/forma-36-tokens';

const getAttribute = (el, property) => window.getComputedStyle(el, null).getPropertyValue(property);

const getComponent = (props = {}) => {
  return (
    <StaticDropdown title="titlestring" body="bodyelement" align="left" {...props}>
      <div>children</div>
    </StaticDropdown>
  );
};

describe('StaticDropdown', () => {
  afterEach(cleanup);

  const build = props => render(getComponent(props));

  it('displays with offset', () => {
    const { getByTestId } = build({ isVisible: true });
    const wrapper = getByTestId('staticdropdown.wrapper');
    expect(wrapper).toBeInTheDocument();
    expect(getAttribute(getByTestId('staticdropdown.dropdown'), 'top')).toBe('5px');
    expect(getAttribute(getByTestId('staticdropdown.dropdown'), 'left')).toBe(`-${spacingM}`);
    expect(wrapper.innerHTML).toContain('children');
    expect(wrapper.innerHTML).toContain('bodyelement');
    expect(wrapper.innerHTML).toContain('titlestring');
  });

  it('hides dropdown', () => {
    const { getByTestId } = build({ isVisible: false });
    expect(getByTestId('staticdropdown.wrapper')).toBeInTheDocument();
    expect(() => getByTestId('staticdropdown.dropdown')).toThrow();
  });

  it('shows right arrow', () => {
    const { getByTestId } = build({ isVisible: true, align: 'right' });
    expect(getByTestId('staticdropdown.wrapper')).toBeInTheDocument();
    expect(getAttribute(getByTestId('staticdropdown.dropdown'), 'right')).toBe(`-${spacingM}`);
    expect(getAttribute(getByTestId('staticdropdown.arrow'), 'margin-left')).toBe('auto');
  });

  it('shows left arrow', () => {
    const { getByTestId } = build({ isVisible: true });
    expect(getByTestId('staticdropdown.wrapper')).toBeInTheDocument();
    expect(getAttribute(getByTestId('staticdropdown.arrow'), 'margin-left')).not.toBe('auto');
  });
});
