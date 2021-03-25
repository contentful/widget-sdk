import React from 'react';
import { render, screen } from '@testing-library/react';
import { DisabledFeature } from './DisabledFeature';

describe('if no props are passed (aka disabled mode)', () => {
  it('renders only the get in touch button', async () => {
    render(<DisabledFeature />);
    expect(screen.queryByTestId('get-started')).not.toBeInTheDocument();
    expect(await screen.findByTestId('get-in-touch')).toBeVisible();
  });
});

describe('if setCurrentLevel prop is passed', () => {
  it('renders get started button', async () => {
    const noop = () => Promise.resolve();
    render(<DisabledFeature setCurrentLevel={noop} />);
    expect(screen.queryByTestId('get-in-touch')).not.toBeInTheDocument();
    expect(await screen.findByTestId('get-started')).toBeVisible();
  });
});
