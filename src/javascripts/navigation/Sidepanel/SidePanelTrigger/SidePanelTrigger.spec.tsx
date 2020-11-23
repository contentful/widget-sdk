import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import SidePanelTrigger from './index';

const mockOnClick = jest.fn();

describe('SidePanelTrigger', () => {
  it('should render button by default', () => {
    const { container } = render(<SidePanelTrigger onClick={mockOnClick} />);
    expect(container.firstChild?.nodeName).toBe('BUTTON');
  });

  it('should call onClick prop', () => {
    const { getByTestId } = render(<SidePanelTrigger onClick={mockOnClick} />);
    fireEvent.click(getByTestId('sidepanel-trigger'));
    expect(mockOnClick).toBeCalledTimes(1);
  });
});
