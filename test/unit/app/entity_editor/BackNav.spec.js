import React from 'react';
import { shallow } from 'enzyme';
import sinon from 'npm:sinon';
import { createIsolatedSystem } from 'test/helpers/system-js';

xdescribe('BackNav', function () {
  beforeEach(async function () {
    module('contentful/test');

    this.sandbox = sinon.sandbox.create();
    this.$stateGoStub = this.sandbox.stub();
    this.getSlideInEntitiesStub = this.sandbox.stub();
    this.goToSlideInEntityStub = this.sandbox.stub();

    this.system = createIsolatedSystem();
    this.system.set('states/EntityNavigationHelpers', {
      getSlideInEntities: this.getSlideInEntitiesStub,
      goToSlideInEntity: this.goToSlideInEntityStub
    });
    this.system.set('$state', {
      default: {
        go: this.$stateGoStub
      }
    });

    const { default: BackNav } = await this.system.import(
      'app/entity_editor/Components/BackNav'
    );
    this.wrapper = shallow(<BackNav slideInFeatureFlagValue={2} />);
  });

  afterEach(function () {
    delete this.system;
    delete this.wrapper;
    this.sandbox.restore();
  });

  it('renders the back navigation button with the icon', function () {
    const icon = (
      this.wrapper
        .find('div.breadcrumbs-widget')
        .find('div.breadcrumbs-container')
        .find('div.btn.btn__back')
        .find('Icon')
    );
    expect(icon.prop('name')).toEqual('back');
  });

  describe('clicking the back button', function () {
    describe('when there are 2 or more slide-in entities', function () {
      it('navigates to the previous slide-in entity', function () {
        const backNavButton = this.wrapper.find('div.btn.btn__back');
        this.getSlideInEntitiesStub.returns([
          { id: 1 },
          { id: 2 }
        ]);
        backNavButton.simulate('click');
        sinon.assert.calledOnce(this.goToSlideInEntityStub);
        this.getSlideInEntitiesStub.returns([
          { id: 1 },
          { id: 2 },
          { id: 3 }
        ]);
        backNavButton.simulate('click');
        sinon.assert.calledTwice(this.goToSlideInEntityStub);
        expect(this.goToSlideInEntityStub.args).toEqual([
          [{ id: 1 }, 2],
          [{ id: 2 }, 2]
        ]);
        sinon.assert.notCalled(this.$stateGoStub);
      });
    });

    describe('when there are 1 or fewer slide-in entities', function () {
      it('navigates to the previous sref', function () {
        // fails for the time being because '$state' is undefined
        // -- but we can't $inject '$state' in the beforeEach above (or can we?)
        const backNavButton = this.wrapper.find('div.btn.btn__back');
        this.getSlideInEntitiesStub.returns([{ id: 1 }]);
        backNavButton.simulate('click');
        sinon.assert.calledOnce(this.$stateGoStub);
        this.getSlideInEntitiesStub.returns([]);
        backNavButton.simulate('click');
        sinon.assert.calledTwice(this.$stateGoStub);
        sinon.assert.notCalled(this.goToSlideInEntityStub);
      });
    });
  });
});
