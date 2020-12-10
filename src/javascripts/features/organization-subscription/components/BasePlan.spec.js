import React from 'react';
import { render, screen } from '@testing-library/react';
import { BasePlan } from './BasePlan';
import {
  ENTERPRISE,
  FREE,
  PARTNER_PLATFORM_BASE_PLAN_NAME,
  SELF_SERVICE,
} from 'account/pricing/PricingDataProvider';

import * as Fake from 'test/helpers/fakeFactory';

const mockPartnerBasePlan = Fake.Plan({ name: PARTNER_PLATFORM_BASE_PLAN_NAME });
const mockFreeBasePlan = Fake.Plan({ custormerType: FREE, name: 'Community Platform' });
const mockSelfServiceBasePlan = Fake.Plan({ custormerType: SELF_SERVICE, name: 'Team' });
const mockEnterpriseBasePlan = Fake.Plan({
  custormerType: ENTERPRISE,
  name: 'Professional',
  ratePlanCharges: [{ name: 'FakeFeature1', unitType: 'feature' }],
});

function build(props) {
  render(<BasePlan basePlan={mockFreeBasePlan} {...props} />);
}

describe('BasePlan', () => {
  it('should display correct message for free base plan', () => {
    build();
    expect(screen.getByTestId('subscription-page.base-plan-details')).toHaveTextContent(
      `${mockFreeBasePlan.name} - doesn’t include enterprise features. Platform features`
    );
  });

  it('should display correct message for Partner base plan', () => {
    build({ basePlan: mockPartnerBasePlan });
    expect(screen.getByTestId('subscription-page.base-plan-details')).toHaveTextContent(
      `${mockPartnerBasePlan.name} – includes enterprise features. Please reach out to your Partner Manager to find out what they are.`
    );
  });

  it('should display correct message for Self Service base plan', () => {
    build({ basePlan: mockSelfServiceBasePlan });
    expect(screen.getByTestId('subscription-page.base-plan-details')).toHaveTextContent(
      `${mockSelfServiceBasePlan.name} - doesn’t include enterprise features. Platform features`
    );
  });

  it('should display correct message for Enterprise base plan', () => {
    build({ basePlan: mockEnterpriseBasePlan });
    expect(screen.getByTestId('subscription-page.base-plan-details')).toHaveTextContent(
      `${mockEnterpriseBasePlan.name} – includes FakeFeature1. Platform features`
    );
  });
});
