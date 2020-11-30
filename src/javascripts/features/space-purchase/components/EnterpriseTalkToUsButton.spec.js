import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { EnterpriseTalkToUsButton } from './EnterpriseTalkToUsButton';

const mockTestId = 'enterprise-cta';
const mockSelect = jest.fn();

describe('EnterpriseTalkToUsButton', () => {
  it('should render a button with an href to sales if it is an enterprise card', () => {
    build();

    const enterpriseButton = screen.getByTestId(mockTestId);

    expect(enterpriseButton).toHaveTextContent('Talk to us');
    expect(enterpriseButton.href).toEqual(
      'https://www.contentful.com/contact/sales/?utm_medium=webapp&utm_source=purchase-space-page&utm_campaign=cta-enterprise-space&utm_content=contact-us'
    );
  });

  it('should call onSelect function when clicked', () => {
    build({ onSelect: mockSelect });

    const enterpriseButton = screen.getByTestId(mockTestId);
    userEvent.click(enterpriseButton);

    expect(mockSelect).toHaveBeenCalled();
  });
});

function build(customProps) {
  const props = {
    organizationId: 'random_org_id',
    disabled: false,
    testId: mockTestId,
    ...customProps,
  };

  render(<EnterpriseTalkToUsButton {...props} />);
}
