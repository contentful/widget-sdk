import React from 'react';
import { shallow } from 'enzyme';

describe('RecordsResourceUsage', function() {
  beforeEach(async function() {
    this.stubs = {
      showDialog: sinon.stub(),
      getResource: sinon.stub()
    };

    this.environmentId = 'env_1234';

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
      $provide.value('services/ChangeSpaceService.es6', {
        showDialog: this.stubs.showDialog
      });
    });

    const RecordsResourceUsage = this.$inject('components/RecordsResourceUsage')
      .RecordsResourceUsage;

    this.render = function() {
      return shallow(
        <RecordsResourceUsage
          space={this.space}
          environmentId={this.environmentId}
          currentTotal={0}
          getResource={this.stubs.getResource}
          resources={this.resources}
        />
      );
    };
  });

  it('should attempt to get the resource when mounted', function() {
    this.render();

    expect(this.stubs.getResource.called).toBe(true);
  });

  it('should have the basic resource-usage class', function() {
    const component = this.render();

    expect(component.first().hasClass('resource-usage')).toBe(true);
  });

  it('should add the resource-usage--warn class if near the limit', function() {
    this.resources.space_1234.record.value.usage = 9;
    const component = this.render();

    expect(component.first().hasClass('resource-usage--warn')).toBe(true);
  });

  it('should add the resource-usage--danger class if at the limit', function() {
    this.resources.space_1234.record.value.usage = 10;
    const component = this.render();

    expect(component.first().hasClass('resource-usage--danger')).toBe(true);
  });
});
