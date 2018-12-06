import React from 'react';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import { createIsolatedSystem } from 'test/helpers/system-js';

describe('BackNav', () => {
  const SLIDE_IN_EDITOR_FEATURE_FLAG_VALUE = 'feature-flag-val';

  beforeEach(async function() {
    module('contentful/test');

    this.sandbox = sinon.sandbox.create();
    this.goToPreviousSlideOrExitStub = this.sandbox.stub();
    this.closeState = this.sandbox.stub();

    this.system = createIsolatedSystem();
    this.system.set('navigation/SlideInNavigator', {
      goToPreviousSlideOrExit: this.goToPreviousSlideOrExitStub
    });
    this.system.set('navigation/closeState', { default: this.closeState });

    const { default: BackNav } = await this.system.import('app/entity_editor/Components/BackNav');
    const props = {
      slideInFeatureFlagValue: SLIDE_IN_EDITOR_FEATURE_FLAG_VALUE
    };
    this.wrapper = shallow(<BackNav {...props} />);
  });

  afterEach(function() {
    delete this.system;
    delete this.wrapper;
    this.sandbox.restore();
  });

  it('renders the back navigation button with the icon', function() {
    const icon = this.wrapper
      .find('div.breadcrumbs-widget')
      .find('div.breadcrumbs-container')
      .find('div.btn.btn__back')
      .find('Icon');
    expect(icon.prop('name')).toEqual('back');
  });

  it('navigates to the previous slide-in entity or list sref', function() {
    const backNavButton = this.wrapper.find('div.btn.btn__back');
    sinon.assert.notCalled(this.goToPreviousSlideOrExitStub);
    backNavButton.simulate('click');
    sinon.assert.calledOnce(this.goToPreviousSlideOrExitStub);
    sinon.assert.alwaysCalledWithMatch(
      this.goToPreviousSlideOrExitStub,
      SLIDE_IN_EDITOR_FEATURE_FLAG_VALUE,
      'arrow_back',
      sinon.match.func
    );
    sinon.assert.notCalled(this.closeState);
    const [[, , callback]] = this.goToPreviousSlideOrExitStub.args;
    callback();
    sinon.assert.calledOnce(this.closeState);
  });
});
