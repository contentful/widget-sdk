import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SpacePlanItem from './SpacePlanItem';

describe('SpacePlanItem', () => {
  it('should not show a price if the price is 0', () => {
    build();

    expect(screen.queryByTestId('space-plan-price')).toBeNull();
  });

  it('should show a price if the plan price is greater than 0', () => {
    build({ plan: createPlan({ price: 1 }) });

    expect(screen.getByTestId('space-plan-price')).toBeVisible();
  });

  it('should show the free space copy if the plan is free and there is a free space limit', () => {
    const freeSpacesResource = { usage: 1, limits: { maximum: 2 } };
    const plan = createPlan({ isFree: true });

    build({ plan, freeSpacesResource });

    expect(screen.getByTestId('contents').textContent).toBe(
      `${plan.name}${freeSpacesResource.usage}/${freeSpacesResource.limits.maximum} free spaces`
    );
  });

  it('should show the plan features', () => {
    build();

    expect(screen.getByTestId('plan-features')).toBeVisible();
  });

  it('should not show the chevron if the plan is disabled', () => {
    build({ plan: createPlan({ disabled: true }) });

    expect(screen.queryByTestId('plan-chevron')).toBeNull();
  });

  it('should show the chevron icon if the plan is not disabled', () => {
    build();

    expect(screen.getByTestId('plan-chevron')).toBeVisible();
  });

  it('should not show the chevron if the plan is not free and the org is not paying', () => {
    build({ isPayingOrg: false, plan: createPlan({ isFree: false }) });

    expect(screen.queryByTestId('plan-chevron')).toBeNull();
  });

  it('should show the chevron if the plan is free and the org is not paying', () => {
    build({ isPayingOrg: false, plan: createPlan({ isFree: true }) });

    expect(screen.getByTestId('plan-chevron')).toBeVisible();
  });

  it('should call onSelect with the plan if clicked, if not disabled', () => {
    const onSelect = jest.fn();
    const plan = createPlan({ name: 'My awesome plan' });

    build({ plan, onSelect });

    userEvent.click(screen.getByTestId('space-plan-item'));

    expect(onSelect).toBeCalledWith(plan);
  });

  it('should show the Current tag if plan.current is true', () => {
    build({ plan: createPlan({ current: true }) });

    expect(screen.getByTestId('space-plan-current-tag')).toBeVisible();
    expect(screen.getByTestId('space-plan-current-tag')).toHaveTextContent('Current');
  });

  it('should show the Recommended tag if isRecommended is true', () => {
    build({ isRecommended: true });

    expect(screen.getByTestId('space-plan-recommended-tag')).toBeVisible();
    expect(screen.getByTestId('space-plan-recommended-tag')).toHaveTextContent('Recommended');
  });

  it('should add the Forma --is-selected class if isSelected is true', () => {
    build({ isSelected: true });

    expect(screen.getByTestId('space-plan-item')).toHaveAttribute(
      'class',
      expect.stringMatching('--is-selected')
    );
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
      plan: createPlan(),
      isSelected: false,
      freeSpacesResource: { usage: 1, limits: { maximum: 1 } },
      onSelect: () => {},
      isPayingOrg: true,
    },
    custom
  );

  render(<SpacePlanItem {...props} />);
}
