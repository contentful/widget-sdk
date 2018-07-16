import React from 'react';
import { shallow } from 'enzyme';

describe('RecordsResourceUsage', function () {
  beforeEach(async function () {
    this.stubs = {
      showDialog: sinon.stub(),
      getIncentivizingFlag: sinon.stub(),
      getResource: sinon.stub()
    };

    this.space = {
      sys: {
        id: 'space_1234'
      }
    };

    this.resources = {
      space_1234: {
        record: {
          isPending: false,
          value: {
            limits: {
              maximum: 10
            },
            usage: 5
          }
        }
      }
    };

    module('contentful/test', $provide => {
      $provide.value('services/ChangeSpaceService', {
        showDialog: this.stubs.showDialog
      });
    });

    const RecordsResourceUsage = this.$inject('components/RecordsResourceUsage').RecordsResourceUsage;

    this.render = function (flagEnabled) {
      return shallow(<RecordsResourceUsage
        space={this.space}
        currentTotal={0}
        getIncentivizingFlag={this.stubs.getIncentivizingFlag}
        getResource={this.stubs.getResource}
        incentivizeUpgradeEnabled={flagEnabled}
        resources={this.resources}
      />);
    };
  });

  it('should not render if the flag is disabled', function () {
    const component = this.render(false);

    expect(component.getElement()).toBe(null);
  });

  it('should render if the flag is enabled', function () {
    const component = this.render(true);

    expect(component.getElement()).not.toBe(null);
  });

  it('should attempt to get the flag and resource when mounted', function () {
    this.render(true);

    expect(this.stubs.getIncentivizingFlag.called).toBe(true);
    expect(this.stubs.getResource.called).toBe(true);
  });

  it('should have the basic resource-usage class', function () {
    const component = this.render(true);

    expect(component.first().hasClass('resource-usage')).toBe(true);
  });

  it('should add the resource-usage--warn class if near the limit', function () {
    this.resources.space_1234.record.value.usage = 9;
    const component = this.render(true);

    expect(component.first().hasClass('resource-usage--warn')).toBe(true);
  });

  it('should add the resource-usage--danger class if at the limit', function () {
    this.resources.space_1234.record.value.usage = 10;
    const component = this.render(true);

    expect(component.first().hasClass('resource-usage--danger')).toBe(true);
  });
});
