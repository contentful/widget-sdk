import React from 'react';

import { render, screen } from '@testing-library/react';
import { TagVisibility } from './TagVisibility';

describe('The TagVisibility component', () => {
  it('renders null when visibility is private', () => {
    renderComponent({ visibility: 'private' });
    const visibility = screen.queryByTestId('visibility-indicator');
    expect(visibility).not.toBeInTheDocument();
  });
  it('renders a visibility indicator when visibility is public', () => {
    renderComponent({ visibility: 'public' });
    const visibility = screen.queryByTestId('visibility-indicator');
    const tooltip = screen.queryByTestId('visibility-indicator-tooltip');

    expect(visibility).toBeInTheDocument();
    expect(tooltip).not.toBeInTheDocument();
  });
  it('renders a tooltip when showTooltip is true', () => {
    renderComponent({ visibility: 'public', showTooltip: true });
    const visibility = screen.queryByTestId('visibility-indicator');
    const tooltip = screen.queryByTestId('visibility-indicator-tooltip');

    expect(visibility).toBeInTheDocument();
    expect(tooltip).toBeInTheDocument();
  });
});

function renderComponent(props) {
  render(<TagVisibility {...props} />);
}
