import React from 'react';
import CustomConfiguration from './CustomConfiguration';
import { screen, render, fireEvent } from '@testing-library/react';

describe('CustomConfiguration', () => {
  const props = {
    items: [],
    onChangePosition: jest.fn(),
    onRemoveItem: jest.fn(),
    onConfigureItem: jest.fn(),
    onResetClick: jest.fn(),
    title: 'Tabs',
    showResetButton: false,
  };

  describe('when showResetButton is false reset button is not shown', () => {
    render(<CustomConfiguration {...props} />);
    expect(screen.queryByText(/Reset to default/)).toBeNull();
  });

  describe('when showResetButton is true ', () => {
    beforeEach(() => {
      const localProps = { ...props, showResetButton: true };
      render(<CustomConfiguration {...localProps} />);
    });

    it('shows the reset button', () => {
      screen.getByText(/Reset to default/);
    });

    describe('and the button is clicked', () => {
      it('calls onResetClick', () => {
        fireEvent.click(screen.getByText(/Reset to default/));
        expect(props.onResetClick).toHaveBeenCalled();
      });
    });
  });
});
