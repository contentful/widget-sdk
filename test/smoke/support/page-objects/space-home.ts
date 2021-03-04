import type { MatcherOptions } from '@testing-library/cypress';

export const spaceHome = {
  container: (options?: MatcherOptions) => cy.findByTestId('admin-space-home', options),
};
