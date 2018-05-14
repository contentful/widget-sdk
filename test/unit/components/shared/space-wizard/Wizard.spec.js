import React from 'react';

import { mount } from 'enzyme';

describe('Space Wizard', function () {
  beforeEach(function () {
    module('contentful/test');

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
});
