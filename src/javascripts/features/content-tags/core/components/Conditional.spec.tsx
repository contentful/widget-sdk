import React from 'react';
import { Conditional } from 'features/content-tags/core/components/Conditional';
import { render, screen } from '@testing-library/react';

describe('A Conditional component', () => {
  describe('with truthy condition', () => {
    it('renders children', () => {
      render(
        <Conditional condition={true}>
          <h1 role={'heading'}>rendered</h1>
        </Conditional>
      );
      expect(screen.queryByRole('heading')).toBeInTheDocument();
    });
  });
  describe('with false condition', () => {
    it("doesn't render children", () => {
      render(
        <Conditional condition={false}>
          <h1 role={'heading'}>rendered</h1>
        </Conditional>
      );
      expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });
  });
});
