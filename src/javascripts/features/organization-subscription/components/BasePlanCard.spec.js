import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockWebappContent } from './__mocks__/webappContent';
import { BasePlanCard } from './BasePlanCard';

describe('BasePlanCard', () => {
  it('shows the correct base plan content', () => {
    build();

    const title = screen.getByTestId('base-plan-title');
    const description = screen.getByTestId('base-plan-description');

    expect(title.textContent).toContain(mockWebappContent.title);
    expect(description.textContent).toContain(
      mockWebappContent.description.content[0].content[0].value
    );
    expect(screen.getByRole('img')).toBeVisible();
  });
});

function build(customProps) {
  const props = {
    content: mockWebappContent,
    organizationId: 'random_org_id',
    upgradableSpaceId: 'random_space_id',
    users: { count: 2, limit: 5 },
    ...customProps,
  };

  render(<BasePlanCard {...props} />);
}
