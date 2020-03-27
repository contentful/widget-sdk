import React from 'react';
import sinon from 'sinon';

import { mount } from 'enzyme';
import { $initialize } from 'test/utils/ng';

describe('Space Wizard', () => {
  beforeEach(async function () {
    this.stubs = {
      track: sinon.stub(),
    };

    this.system.set('analytics/Analytics', {
      track: this.stubs.track,
    });

    this.organization = {
      name: 'Test Organization',
      sys: {
        id: '1234',
      },
    };

    this.space = {
      name: 'Best space ever',
      sys: {
        id: 'space_1234',
      },
    };

    this.store = (await this.system.import('redux/store')).default;

    this.Wizard = (await this.system.import('components/shared/space-wizard/Wizard')).default;

    await $initialize(this.system);

    this.create = (action) => {
      const props = {
        organization: this.organization,
        onCancel: sinon.stub(),
        onConfirm: sinon.stub(),
        onSpaceCreated: sinon.stub(),
        onTemplateCreated: sinon.stub(),
        onDimensionsChange: sinon.stub(),
        action: action,
        store: this.store,
      };

      if (action !== 'create') {
        props.space = this.space;
      }

      return React.createElement(this.Wizard, props);
    };

    this.mount = (action) => {
      return mount(this.create(action));
    };
  });

  describe('space creation', () => {
    beforeEach(function () {
      this.component = this.mount('create');
    });

    it('should have three steps', function () {
      expect(this.component.find('.create-space-wizard__navigation > li').length).toBe(3);
    });

    it('should have the later two steps disabled on loading', function () {
      expect(
        this.component.find('.create-space-wizard__navigation > li[aria-disabled=true]').length
      ).toBe(2);
    });
  });

  describe('space changing', () => {
    beforeEach(function () {
      this.component = this.mount('change');
    });

    it('should have two steps', function () {
      expect(this.component.find('.create-space-wizard__navigation > li').length).toBe(2);
    });

    it('should have the last step disabled on loading', function () {
      expect(
        this.component.find('.create-space-wizard__navigation > li[aria-disabled=true]').length
      ).toBe(1);
    });
  });

  describe('analytics', () => {
    it('should track modal open event', function () {
      this.mount('create');
      sinon.assert.calledOnce(this.stubs.track.withArgs('space_wizard:open'));
    });

    it('should track modal cancel event', function () {
      const component = this.mount('create');
      component.find('[data-test-id="modal-dialog-close"]').simulate('click');
      sinon.assert.calledOnce(this.stubs.track.withArgs('space_wizard:cancel'));
    });

    it('should track create space intended action', function () {
      this.mount('create');
      const data = this.stubs.track.lastCall.args[1];

      expect(data.intendedAction).toBe('create');
    });

    it('should track change space intended action', function () {
      this.mount('change');
      const data = this.stubs.track.lastCall.args[1];

      expect(data.intendedAction).toBe('change');
    });
  });
});
