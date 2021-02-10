import { ConditionalWrapper } from 'features/content-tags/core/components/ConditionalWrapper';
import { render, screen } from '@testing-library/react';
import React from 'react';

describe('A ConditionalWrapper component', () => {
  describe('with truthy condition', () => {
    it('renders the wrapper', () => {
      render(
        <ConditionalWrapper
          condition={true}
          wrapper={(children) => <h1 role={'heading'}>{children}</h1>}>
          Message
        </ConditionalWrapper>
      );
      expect(screen.queryByRole('heading')).toBeInTheDocument();
    });
  });
  describe('with falsy condition', () => {
    it('renders the wrapper', () => {
      render(
        <ConditionalWrapper
          condition={false}
          wrapper={(children) => <h1 role={'heading'}>{children}</h1>}>
          Message
        </ConditionalWrapper>
      );
      expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });
  });
});
