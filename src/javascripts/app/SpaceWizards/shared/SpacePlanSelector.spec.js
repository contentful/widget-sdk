import React from 'react';
import { render, screen } from '@testing-library/react';
import * as Fake from 'test/helpers/fakeFactory';
import SpacePlanSelector from './SpacePlanSelector';

describe('SpacePlanSelector', () => {
  it('should show the BillingInfo note if the org is not billable', () => {
    build({ organization: Fake.Organization({ isBillable: false }) });

    expect(screen.getByTestId('billing-info-note')).toBeVisible();
  });

  it('should show the NoMorePlans note if the highest plan has `currentPlan` as one if its unavailabilityReasons', () => {
    const plans = [
      createPlan({ price: 0 }),
      createPlan({
        price: 20,
        unavailabilityReasons: [{ type: 'currentPlan' }],
        sys: { id: 'plan_2345' },
      }),
    ];

    build({ spaceRatePlans: plans });

    expect(screen.getByTestId('no-more-plans-note')).toBeVisible();
  });

  it('should show a SpacePlanItem for each given space plan', () => {
    const plans = [
      createPlan({ price: 0 }),
      createPlan({
        price: 20,
        sys: { id: 'plan_2345' },
      }),
    ];

    build({ spaceRatePlans: plans });

    expect(screen.queryAllByTestId('space-plan-item')).toHaveLength(2);
  });
});

function createPlan(custom) {
  return Object.assign(
    {
      name: 'Space plan',
      roleSet: {
        name: 'Role set',
        roles: [],
      },
      includedResources: [],
      sys: {
        id: 'plan_1234',
      },
    },
    custom
  );
}

function build(custom) {
  const props = Object.assign(
    {
      organization: Fake.Organization({ isBillable: true }),
      spaceRatePlans: [createPlan()],
      freeSpacesResource: { usage: 1, limits: { maximum: 1 } },
      onSelectPlan: () => {},
      selectedPlan: null,
      goToBillingPage: () => {},
    },
    custom
  );

  render(<SpacePlanSelector {...props} />);
}
