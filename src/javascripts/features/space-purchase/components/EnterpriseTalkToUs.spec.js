import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { EnterpriseTalkToUs } from './EnterpriseTalkToUs';

const mockTestId = 'enterprise-cta';
const mockSelect = jest.fn();

describe('EnterpriseTalkToUs', () => {
  it('should render a button with an href to sales if it is an enterprise card', () => {
    build();

    const enterpriseButton = screen.getByTestId(mockTestId);

    expect(enterpriseButton).toHaveTextContent('Talk to us');
    expect(enterpriseButton.href).toEqual(
      'https://www.contentful.com/contact/sales/?utm_medium=webapp&utm_source=purchase-space-page&utm_campaign=cta-enterprise-space&utm_content=contact-us'
    );
  });

  it('should call handleSelect function when clicked', () => {
    build();

    const enterpriseButton = screen.getByTestId(mockTestId);
    userEvent.click(enterpriseButton);

    expect(mockSelect).toHaveBeenCalled();
  });
});

function build(customProps) {
  const props = {
    organizationId: 'random_org_id',
    handleSelect: mockSelect,
    disabled: false,
    testId: mockTestId,
    ...customProps,
  };

  render(<EnterpriseTalkToUs {...props} />);
}
