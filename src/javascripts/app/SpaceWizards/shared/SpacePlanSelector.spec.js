import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

  it('should call onSelectPlan when selecting a plan', () => {
    const plan = createPlan();
    const onSelectPlan = jest.fn();

    build({ spaceRatePlans: [plan], onSelectPlan });

    userEvent.click(screen.getAllByTestId('space-plan-item')[0]);

    expect(onSelectPlan).toBeCalledWith(plan);
  });

  it('should show the micro and small CTA if shouldShowMicroSmallCTA is true', () => {
    build({ shouldShowMicroSmallCTA: true });

    expect(screen.getByTestId('small-micro-cta')).toBeVisible();
  });

  describe('with recommended plan', () => {
    const space = Fake.Space();

    const spaceResources = [
      Fake.SpaceResource(10, 10, 'record'),
      Fake.SpaceResource(1, 10, 'locale'),
    ];

    const currentPlan = createPlan({
      price: 0,
      unavailabilityReasons: [{ type: 'currentPlan' }],
      includedResources: [
        { type: 'Records', number: 10 },
        { type: 'Locales', number: 10 },
      ],
    });

    const recommendedPlan = createPlan({
      price: 20,
      includedResources: [
        { type: 'Records', number: 20 },
        { type: 'Locales', number: 20 },
      ],
    });

    it('should show the ExplainRecommendation note if the space plan is changing and a plan is recommendable', () => {
      build({
        space,
        isChanging: true,
        currentPlan,
        recommendedPlan,
        spaceRatePlans: [currentPlan, recommendedPlan],
        spaceResources,
      });

      expect(screen.getByTestId('explain-recommendation')).toBeVisible();
    });

    it('should not show the ExplainRecommendation note if space plan is not changing, even if a plan is recommendable', () => {
      build({
        space,
        isChanging: false,
        currentPlan,
        recommendedPlan,
        spaceRatePlans: [currentPlan, recommendedPlan],
        spaceResources,
      });

      expect(screen.queryByTestId('explain-recommendation')).toBeNull();
    });
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
  return Fake.Plan(
    Object.assign(
      {
        name: 'Space plan',
        roleSet: {
          name: 'Role set',
          roles: [],
        },
        includedResources: [],
      },
      custom
    )
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
