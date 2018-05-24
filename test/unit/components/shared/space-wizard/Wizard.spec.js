import React from 'react';
import * as sinon from 'helpers/sinon';

import { mount } from 'enzyme';

describe('Space Wizard', function () {
  beforeEach(function () {
    this.stubs = {
      track: sinon.stub()
    };

    module('contentful/test', ($provide) => {
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

    this.Wizard = this.$inject('components/shared/space-wizard/Wizard').default;
    this.create = (action) => {
      return <this.Wizard
        organization={this.organization}
        onCancel={sinon.stub()}
        onConfirm={sinon.stub()}
        onSpaceCreated={sinon.stub()}
        onTemplateCreated={sinon.stub()}
        onDimensionsChange={sinon.stub()}
        action={action}
      />;
    };

    this.React = React;

    this.mount = (action) => {
      return mount(this.create(action));
    };
  });

  describe('space creation', function () {
    beforeEach(function () {
      this.component = this.mount('create');
    });

    it('should have three steps', function () {
      expect(this.component.find('.create-space-wizard__navigation > li').length).toBe(3);
    });

    it('should have the latter two steps disabled', function () {
      expect(this.component.find('.create-space-wizard__navigation > li[aria-disabled=true]').length).toBe(2);
    });
  });

  describe('space changing (upgrading/downgrading)', function () {
    beforeEach(function () {
      this.component = this.mount('change');
    });

    it('should have two steps', function () {
      expect(this.component.find('.create-space-wizard__navigation > li').length).toBe(2);
    });

    it('should have the last step disabled', function () {
      expect(this.component.find('.create-space-wizard__navigation > li[aria-disabled=true]').length).toBe(1);
    });
  });

  describe('analytics', function () {
    it('should track modal open event', function () {
      this.mount('create');
      sinon.assert.calledOnce(this.stubs.track.withArgs('space_wizard:open'));
    });

    it('should track modal cancel event', function () {
      const component = this.mount('create');
      component.find('.modal-dialog__close').simulate('click');
      sinon.assert.calledOnce(this.stubs.track.withArgs('space_wizard:cancel'));
    });

    it('should track create space intended action', function () {
      this.mount('create');
      const data = this.stubs.track.firstCall.args[1];

      expect(data.action).toBe('create');
    });

    it('should not track change space intended action', function () {
      this.mount('change');

      sinon.assert.notCalled(this.stubs.track);
    });
  });
});
