import React from 'react';
import sinon from 'sinon';
import { mount } from 'enzyme';
import { $initialize } from 'test/utils/ng';

describe('Enterprise Space Wizard', () => {
  beforeEach(async function() {
    this.stubs = {
      track: sinon.stub()
    };

    this.system.set('analytics/Analytics.es6', {
      track: this.stubs.track
    });

    this.organization = {
      name: 'Test Organization',
      sys: {
        id: '1234'
      }
    };

    this.space = {
      name: 'Best space ever',
      sys: {
        id: 'space_1234'
      }
    };

    this.ratePlanCharges = [
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

    this.freeSpaceRatePlan = {
      productPlanType: 'free_space',
      productRatePlanCharges: this.ratePlanCharges,
      roleSet: {
        name: 'lol',
        roles: ['Wizard']
      }
    };

    this.freeSpaceResource = {
      usage: 1,
      limits: {
        maximum: 5
      }
    };

    this.store = (await this.system.import('redux/store.es6')).default;
    this.PlanFeatures = (await this.system.import(
      'components/shared/space-wizard/PlanFeatures.es6'
    )).default;

    const EnterpriseSpaceWizard = (await this.system.import(
      'components/shared/enterprise-space-wizard/EnterpriseSpaceWizard.es6'
    )).default;

    await $initialize(this.system);

    this.createSpace = sinon.stub();

    this.component = mount(
      <EnterpriseSpaceWizard
        store={this.store}
        freeSpaceRatePlan={this.freeSpaceRatePlan}
        freeSpaceResource={this.freeSpaceResource}
        organization={this.organization}
        setNewSpaceName={sinon.stub()}
        createSpace={this.createSpace}
        reset={sinon.stub()}
        newSpaceMeta={{}}
        spaceCreation={{}}
        error={null}
        scope={null}
      />
    );
  });

  it('shows the POC plan', function() {
    expect(this.component.find('.space-plans-list__item').length).toBe(1);
  });

  it('shows the plans limits', function() {
    expect(this.component.find(this.PlanFeatures).length).toBe(1);
  });

  it('displays a disclaimer about POC spaces', function() {
    expect(this.component.find('.enterprise-space-wizard__info').length).toEqual(1);
  });
});
