import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import EnterpriseSpaceWizard from './EnterpriseSpaceWizard';
import store from 'redux/store';

jest.mock('analytics/Analytics', () => ({
  track: jest.fn()
}));

const organization = {
  name: 'Test Organization',
  sys: {
    id: '1234'
  }
};

const ratePlanCharges = [
  {
    name: 'Environments',
    tiers: [{ endingUnit: 10 }]
  },
  {
    name: 'Roles',
    tiers: [{ endingUnit: 10 }]
  },
  {
    name: 'Locales',
    tiers: [{ endingUnit: 10 }]
  },
  {
    name: 'Content types',
    tiers: [{ endingUnit: 10 }]
  },
  {
    name: 'Records',
    tiers: [{ endingUnit: 10 }]
  }
];

const freeSpaceRatePlan = {
  productPlanType: 'free_space',
  productRatePlanCharges: ratePlanCharges,
  name: 'Enterprise Space',
  roleSet: {
    name: 'lol',
    roles: ['Wizard']
  }
};

const freeSpaceResource = {
  usage: 1,
  limits: {
    maximum: 5
  }
};

describe('Enterprise Space Wizard', () => {
  it('shows the POC plan', function() {
    const component = build();
    expect(component.queryByTestId('space-plans-list.item')).toBeVisible();
  });

  it('shows the plans limits', function() {
    const component = build();
    expect(component.queryByTestId('plan-features')).toBeVisible();
  });

  it('displays a disclaimer about POC spaces', function() {
    const component = build();
    expect(component.queryByTestId('enterprise-space-wizard.info')).toBeVisible();
  });

  it('does not display the disclaimer about POC spaces for Enterprise High Demand', function() {
    const component = build(true);
    expect(component.queryByTestId('enterprise-space-wizard.info')).toBeNull();
  });
});

function build(isHighDemand = false) {
  return render(
    <EnterpriseSpaceWizard
      store={store}
      freeSpaceRatePlan={freeSpaceRatePlan}
      freeSpaceResource={freeSpaceResource}
      isHighDemand={isHighDemand}
      organization={organization}
      setNewSpaceName={jest.fn()}
      createSpace={jest.fn()}
      reset={jest.fn()}
      newSpaceMeta={{}}
      spaceCreation={{}}
      error={null}
      scope={null}
    />
  );
}
