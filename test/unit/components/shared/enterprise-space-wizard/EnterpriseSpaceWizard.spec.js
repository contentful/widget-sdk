import React from 'react';
import * as sinon from 'test/helpers/sinon';

import { mount } from 'enzyme';

describe('Enterprise Space Wizard', () => {
  beforeEach(function() {
    this.stubs = {
      track: sinon.stub()
    };

    module('contentful/test', $provide => {
      $provide.value('analytics/Analytics.es6', {
        track: this.stubs.track
      });
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

    this.store = this.$inject('ReduxStore/store.es6').default;
    this.PlanFeatures = this.$inject('components/shared/space-wizard/PlanFeatures.es6').default;
    this.TextField = this.$inject('@contentful/forma-36-react-components').TextField;

    const EnterpriseSpaceWizard = this.$inject(
      'components/shared/enterprise-space-wizard/EnterpriseSpaceWizard.es6'
    ).default;

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
