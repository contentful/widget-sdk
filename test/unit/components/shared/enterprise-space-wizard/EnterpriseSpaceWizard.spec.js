import React from 'react';
import * as sinon from 'helpers/sinon';

import { mount } from 'enzyme';

describe('Enterprise Space Wizard', () => {
  beforeEach(function() {
    this.stubs = {
      track: sinon.stub()
    };

    module('contentful/test', $provide => {
      $provide.value('analytics/Analytics', {
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

    this.ratePlans = [
      {
        productPlanType: 'free_space',
        productRatePlanCharges: this.ratePlanCharges
      }
    ];

    this.store = this.$inject('ReduxStore/store').default;
    this.PlanFeatures = this.$inject('components/shared/space-wizard/PlanFeatures').default;
    this.TextField = this.$inject('@contentful/ui-component-library').TextField;

    const EnterpriseSpaceWizard = this.$inject(
      'components/shared/enterprise-space-wizard/EnterpriseSpaceWizard'
    ).default;

    this.createSpace = sinon.stub();

    this.component = mount(
      <EnterpriseSpaceWizard
        store={this.store}
        ratePlans={this.ratePlans}
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
