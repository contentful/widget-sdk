import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import SidePanelTrigger from './index';

const mockOnClick = jest.fn();

describe('SidePanelTrigger', () => {
  it('should render single button by default', () => {
    const { container } = render(<SidePanelTrigger onClickOrganization={mockOnClick} />);
    expect(container.querySelectorAll('button')).toHaveLength(1);
  });

  it('button should call onClick prop', () => {
    const { getByTestId } = render(<SidePanelTrigger onClickOrganization={mockOnClick} />);
    fireEvent.click(getByTestId('sidepanel-trigger'));
    expect(mockOnClick).toBeCalledTimes(1);
  });

  it('should render experience switcher with contentful apps enabled', () => {
    const { getByTestId } = render(
      <SidePanelTrigger onClickOrganization={mockOnClick} openAppSwitcher={mockOnClick} />
    );

    fireEvent.click(getByTestId('sidepanel-trigger'));
    fireEvent.click(getByTestId('sidepanel-trigger-apps'));
    expect(mockOnClick).toBeCalledTimes(2);
  });
});
