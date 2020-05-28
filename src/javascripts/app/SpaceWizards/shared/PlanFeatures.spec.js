import React from 'react';
import { render, screen } from '@testing-library/react';
import PlanFeatures from './PlanFeatures';

import { getRolesTooltip, getTooltip } from './utils';

jest.mock('./utils', () => ({
  SpaceResourceTypes: {
    Roles: 'Role',
  },
  getRolesTooltip: jest.fn(),
  getTooltip: jest.fn(),
}));

describe('PlanFeatures', () => {
  it('should show a list of the given resources', () => {
    build({
      resources: [
        { type: 'Role', number: 10 },
        { type: 'Super resource', number: 999 },
      ],
    });

    expect(screen.getAllByTestId('resource')).toHaveLength(2);
  });

  it('should call getRolesTooltip if the resource type is Roles', () => {
    build({
      resources: [
        { type: 'Role', number: 10 },
        { type: 'Environment', number: 20 },
      ],
    });

    expect(getRolesTooltip).toBeCalledTimes(1);
  });

  it('should call getTooltip if the resource type is not Roles', () => {
    build({
      resources: [
        { type: 'Record', number: 10 },
        { type: 'Environment', number: 20 },
      ],
    });

    expect(getTooltip).toBeCalledTimes(2);
  });

  it('should not get tooltips if disabled is true', () => {
    build({
      resources: [
        { type: 'Role', number: 5 },
        { type: 'Record', number: 10 },
        { type: 'Environment', number: 20 },
      ],
      disabled: true,
    });

    expect(getTooltip).toBeCalledTimes(0);
    expect(getRolesTooltip).toBeCalledTimes(0);
  });
});

function build(custom = {}) {
  const props = Object.assign(
    {
      resources: [],
      roleSet: {},
      disabled: false,
    },
    custom
  );

  render(<PlanFeatures {...props} />);
}
