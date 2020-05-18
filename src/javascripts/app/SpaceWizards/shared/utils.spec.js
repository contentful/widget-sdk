import { render } from 'enzyme';
import 'jest-enzyme';
import * as WizardUtils from './utils';

jest.mock('utils/ResourceUtils', () => ({
  resourceHumanNameMap: {
    asset: 'Assets',
    content_type: 'Content Types',
    entry: 'Entries',
    locale: 'Locales',
    environment: 'Environments',
    record: 'Records',
  },
  canCreate: jest.fn(),
}));

jest.mock('services/client', () => {
  const client = {
    createSpace: jest.fn(),
  };

  return function () {
    return client;
  };
});

describe('createSpace', () => {
  it('should attempt to create the space using the client and refresh the token', async () => {});

  it('should track the wizard space_create event', async () => {});

  it('should track the space:create event', async () => {});

  it('should create an example API key', async () => {});

  it('should navigate to the space', async () => {});

  it('should return the new space', async () => {});
});

describe('createSpaceWithTemplate', () => {
  it('should attempt to create the space using the client and refresh the token', async () => {});

  it('should track the wizard space_create event', async () => {});

  it('should çall the onTemplateCreationStarted callback', async () => {});

  it('should go to the new space', async () => {});

  it('should track the space:create event with template data', async () => {});

  it('should broadcast the spaceTemplateCreated event on $rootScope', async () => {});

  it('should return the new space', async () => {});

  describe('template creation', () => {
    it('should attempt to create a template with the templateCreator and fetched template data', async () => {});

    it('should ignore spaceSetup errors from the templateCreator', async () => {});

    it('should retry if the content was not successfully created', async () => {});

    it('should only retry once and then throw', async () => {});

    it('should refresh the space content types', async () => {});
  });
});

describe('changeSpacePlan', () => {
  it('should attempt to change the space plan via the API call', async () => {});

  it('should throw if the space plan change API call fails', async () => {});

  it('should track the wizard space_type_change event', async () => {});
});

describe('transformSpaceRatePlans', () => {
  it('should disable any spacePlan that has unavailabilityReasons', () => {});

  it('should disable any spacePlan if the plan is free and user cannot create any more free spaces', () => {});

  it('should disable any non-free space plan if the organization is not billable', () => {});

  it('should mark the spacePlan with an unavailabilityReason of "currentPlan" as current', () => {});

  it('should map over each plan and return the plan, plus isFree, disabled, current, and includedResources', () => {});
});

describe('goToBillingPage', () => {
  it('should navigate to the organization billing page', () => {});

  it('should track the link_click wizard event', () => {});

  it('should call onClose if provided', () => {});
});

describe('trackWizardEvent', () => {
  it('should track `space_wizard:eventName` with serialized given payload', () => {});
});

describe('getIncludedResources', () => {
  it('should map over roles, envs, content types, records, and locales and determine how much of each the charges have', () => {});
});

describe('getHighestPlan', () => {
  it('should return the plan with the highest price', () => {});
});

describe('unavailabilityTooltipNode', function () {
  const data = {};

  beforeEach(function () {
    data.planAvailable = {
      name: 'Small',
      unavailabilityReasons: null,
    };

    data.planUnavailableRoles = {
      name: 'Small 2',
      unavailabilityReasons: [
        {
          type: 'roleIncompatibility',
          additionalInfo: 'Editor',
        },
      ],
    };

    data.planUnavailableLimit = {
      name: 'Small 3',
      unavailabilityReasons: [
        {
          type: 'maximumLimitExceeded',
          usage: 5,
          maximumLimit: 3,
          additionalInfo: 'Locales',
        },
      ],
    };

    data.planUnavailableMultiple1 = {
      name: 'Small 4',
      unavailabilityReasons: [
        {
          type: 'maximumLimitExceeded',
          usage: 7,
          maximumLimit: 2,
          additionalInfo: 'Locales',
        },
        {
          type: 'roleIncompatibility',
          additionalInfo: 'Super Awesome Translator',
        },
      ],
    };

    data.planUnavailableMultiple2 = {
      name: 'Small 5',
      unavailabilityReasons: [
        {
          type: 'roleIncompatibility',
          additionalInfo: 'Super Awesome Translator',
        },
        {
          type: 'maximumLimitExceeded',
          usage: 8,
          maximumLimit: 4,
          additionalInfo: 'Locales',
        },
      ],
    };
  });

  it('should return null if there are no unavailabilityReasons', function () {
    expect(WizardUtils.unavailabilityTooltipNode(data.planAvailable)).toBeNull();
  });

  it('should have correct copy if unavailabilityReasons exists', function () {
    const rolesTooltip = render(WizardUtils.unavailabilityTooltipNode(data.planUnavailableRoles));
    const limitsTooltip = render(WizardUtils.unavailabilityTooltipNode(data.planUnavailableLimit));

    expect(rolesTooltip.text()).toBe(
      'Migrate users from the Editor role before changing to this space type.'
    );

    // Since these are in two paragraphs, these is no space between the text when rendered using .text()
    expect(limitsTooltip.text()).toBe(
      'You are currently using more than the Small 3 space allows by 2 locales.Delete resources before changing to this space type.'
    );
  });

  it('should handle multiple unavailabilityReasons, in order', function () {
    const tooltip1 = render(WizardUtils.unavailabilityTooltipNode(data.planUnavailableMultiple1));
    const tooltip2 = render(WizardUtils.unavailabilityTooltipNode(data.planUnavailableMultiple2));

    expect(tooltip1.text()).toBe(
      'You are currently using more than the Small 4 space allows by 5 locales.Delete resources and migrate users from the Super Awesome Translator role before changing to this space type.'
    );
    expect(tooltip2.text()).toBe(
      'You are currently using more than the Small 5 space allows by 4 locales.Migrate users from the Super Awesome Translator role and delete resources before changing to this space type.'
    );
  });
});

describe('getTooltip', () => {
  it('should return a toolip component if given Environment or Role as type', () => {});
});

describe('getRolesTooltip', function () {
  const intro = 'This space type includes the';
  const testRolesTooltip = function (number, roles, text) {
    const tooltip = WizardUtils.getRolesTooltip(number, { roles });
    return expect(tooltip).toBe(`${intro} ${text}`);
  };

  it('returns tooltip for a plan with the admin role only', function () {
    testRolesTooltip(1, [], 'Admin role only');
  });

  it('returns the tooltip text for a plan with various roles', function () {
    testRolesTooltip(3, ['Editor', 'Translator'], 'Admin, Editor, and Translator roles');
  });

  it('returns the tooltip text for a plan with multiple translator roles', function () {
    testRolesTooltip(
      5,
      ['Editor', 'Translator', 'Translator 2', 'Translator3'],
      'Admin, Editor, and 3 Translator roles'
    );
  });

  it('returns the tooltip text for a plan with custom roles', function () {
    testRolesTooltip(
      10,
      ['Editor', 'Translator'],
      'Admin, Editor, and Translator roles and an additional 7 custom roles'
    );
  });

  describe('getRecommendedPlan', () => {
    const spaceRatePlans = [
      {
        name: 'Free',
        includedResources: [
          { type: 'Environments', number: 2 },
          { type: 'Content types', number: 25 },
        ],
      },
      {
        name: 'Unavailable Micro',
        includedResources: [
          { type: 'Environments', number: 50 },
          { type: 'Content types', number: 500 },
        ],
        unavailabilityReasons: [{ type: 'arbitraryReason' }],
      },
      {
        name: 'Micro',
        includedResources: [
          { type: 'Environments', number: 10 },
          { type: 'Content types', number: 50 },
        ],
      },
      {
        name: 'Macro',
        includedResources: [
          { type: 'Environments', number: 20 },
          { type: 'Content types', number: 100 },
        ],
      },
      {
        name: 'Mega',
        includedResources: [
          { type: 'Environments', number: 30 },
          { type: 'Content types', number: 200 },
        ],
      },
    ];

    const ratePlansTooSmall = [
      {
        name: 'Free',
        includedResources: [
          { type: 'Environments', number: 2 },
          { type: 'Content types', number: 24 },
        ],
      },
      {
        name: 'Micro-ish',
        includedResources: [
          { type: 'Environments', number: 3 },
          { type: 'Content types', number: 25 },
        ],
      },
      {
        name: 'Less Micro-ish',
        includedResources: [
          { type: 'Environments', number: 5 },
          { type: 'Content types', number: 40 },
        ],
      },
    ];

    const allInvalidPlans = [
      {
        name: 'Free',
        unavailabilityReasons: [{ type: 'someIssue' }],
      },
      {
        name: 'Micro',
        unavailabilityReasons: [{ type: 'anotherIssue' }],
      },
    ];

    const resources = [
      {
        usage: 12,
        sys: {
          id: 'environment',
        },
      },
      {
        usage: 45,
        sys: {
          id: 'content_type',
        },
      },
    ];

    it('should return null if no resources or empty resources array is given are given', function () {
      expect(WizardUtils.getRecommendedPlan(spaceRatePlans)).toBeNull();
      expect(WizardUtils.getRecommendedPlan(spaceRatePlans, [])).toBeNull();
    });

    it('should return null if no plan is valid (all are unavailable)', function () {
      expect(WizardUtils.getRecommendedPlan(allInvalidPlans, resources)).toBeNull();
    });

    it('should return null if no plan can fulfill resource requirements', function () {
      expect(WizardUtils.getRecommendedPlan(ratePlansTooSmall, resources)).toBeNull();
    });

    it('should return the first available plan in the list that fulfills the resource requirements', function () {
      expect(WizardUtils.getRecommendedPlan(spaceRatePlans, resources)).toEqual(spaceRatePlans[3]);
    });
  });
});
