import React from 'react';
import ErrorPage from './ErrorPage';
import { screen, render, fireEvent } from '@testing-library/react';
import { go } from 'states/Navigator';

jest.mock('states/Navigator', () => ({
  go: jest.fn(),
}));

describe('ErrorPage', () => {
  it('should match the snapshot', () => {
    expect(build().baseElement).toMatchSnapshot();
  });

  it('should go to the home path when the "home" button is clicked', () => {
    build();

    fireEvent.click(screen.getByTestId('home-button'));

    expect(go).toBeCalledWith({
      path: ['home'],
    });
  });
});

function build() {
  return render(<ErrorPage />);
}
