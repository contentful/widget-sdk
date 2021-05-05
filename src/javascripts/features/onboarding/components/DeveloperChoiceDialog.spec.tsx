import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { DeveloperChoiceDialog } from './DeveloperChoiceDialog';
jest.mock('analytics/Analytics', () => ({
  track: jest.fn(),
}));

const onContinueMock = jest.fn();

describe('DeveloperChoiceDialog', () => {
  beforeEach(() => {
    render(<DeveloperChoiceDialog onContinue={onContinueMock} />);
  });

  it('renders three cards with tags and continue btn', async () => {
    expect(screen.getAllByTestId('cf-ui-tag')).toHaveLength(3);
  });

  it('renders disabled continue btn', async () => {
    expect(screen.getByTestId('continue-btn')).toBeVisible();
    expect(screen.getByTestId('continue-btn')).toBeDisabled();
  });

  it('onContinue should be called with the correct choice', async () => {
    fireEvent.click(screen.getByTestId('gatsby-blog'));
    expect(screen.getByTestId('continue-btn')).not.toBeDisabled();
    fireEvent.click(screen.getByTestId('continue-btn'));
    expect(onContinueMock).toHaveBeenCalledWith('gatsby-blog');
  });

  it('renders resource links', async () => {
    expect(screen.getByTestId('developer-docs-link')).toBeVisible();
    expect(screen.getByTestId('training-center-link')).toBeVisible();
  });
});
