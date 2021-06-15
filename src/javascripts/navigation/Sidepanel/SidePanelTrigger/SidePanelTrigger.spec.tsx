import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { SidePanelTrigger } from './SidePanelTrigger';

describe('SidePanelTrigger', () => {
  const renderComponent = () => {
    const props = {
      onClickOrganization: jest.fn(),
      openAppSwitcher: jest.fn(),
    };
    const component = render(<SidePanelTrigger {...props} />);
    return { ...component, props };
  };
  it('should render both buttons by default', () => {
    const { container } = renderComponent();
    expect(container.querySelectorAll('button')).toHaveLength(2);
  });

  it('button should call onClick prop', () => {
    const { getByTestId, props } = renderComponent();
    fireEvent.click(getByTestId('sidepanel-trigger'));
    expect(props.onClickOrganization).toBeCalledTimes(1);
  });

  it('should render experience switch with contentful apps enabled', () => {
    const { getByLabelText, props } = renderComponent();
    fireEvent.click(getByLabelText('Switch Contentful app'));
    expect(props.openAppSwitcher).toBeCalledTimes(1);
  });
});
