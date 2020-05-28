import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Info from './Info';

describe('Info', () => {
  beforeEach(() => {
    window.open = jest.fn();
  });

  it('should show the additional info section if the "Show more" link is clicked', () => {
    build();

    expect(screen.queryByTestId('show-more-section')).toBeNull();

    userEvent.click(screen.getByTestId('show-more-link'));

    expect(screen.queryByTestId('show-more-section')).toBeVisible();
  });

  it('should hide the additional info section if it is shown and the "show less" link is clicked', () => {
    build();

    userEvent.click(screen.getByTestId('show-more-link'));

    expect(screen.queryByTestId('show-more-section')).toBeVisible();

    userEvent.click(screen.getByTestId('show-more-link'));

    expect(screen.queryByTestId('show-more-section')).toBeNull();
  });

  it('should open a link to the pricing FAQ page when clicking on the Learn More link', () => {
    build();

    userEvent.click(screen.getByTestId('show-more-link'));
    userEvent.click(screen.getByTestId('learn-more-link'));

    expect(window.open).toBeCalledWith(expect.stringContaining('pricing/?faq_category=payments'));
  });
});

function build() {
  render(<Info />);
}
