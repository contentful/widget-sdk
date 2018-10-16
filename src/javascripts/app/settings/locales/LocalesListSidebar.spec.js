import React from 'react';
import Enzyme from 'enzyme';
import sinon from 'sinon';
import LocalesListSidebar from './LocalesListSidebar.es6';
import $state from '$state';
import * as LaunchDarkly from 'utils/LaunchDarkly';

describe('settings/locales/LocalesListSidebar', () => {
  beforeEach(() => {
    $state.go.resetHistory();
    LaunchDarkly.getCurrentVariation.resetHistory();
  });

  const setShowChangeSpaceIncentive = value => {
    LaunchDarkly.getCurrentVariation = sinon.stub().resolves(value);
  };

  const selectors = {
    addLocaleButton: '[data-test-id="add-locales-button"]',
    documentationSection: '[data-test-id="locales-documentation"]',
    usagesSection: '[data-test-id="locales-usage"]',
    changeSpaceSection: '[data-test-id="change-space-block"]',
    upgradeSpaceButton: '[data-test-id="locales-change"]'
  };

  const mount = props => {
    const stubs = {
      upgradeSpace: sinon.stub()
    };
    const wrapper = Enzyme.mount(
      <LocalesListSidebar
        upgradeSpace={stubs.upgradeSpace}
        subscriptionState={{
          path: ['account', 'organizations', 'subscription_new'],
          params: { orgId: '34NUQUZd5pA4mKLzDKGBWy' },
          options: { replace: true }
        }}
        {...props}
      />
    );
    return { wrapper, stubs };
  };

  beforeEach(() => {
    $state.go.resetHistory();
    $state.href.resetHistory();
  });

  describe('if environment is not "master"', () => {
    it('add button and documentation are shown', () => {
      expect.assertions(5);
      const { wrapper } = mount({
        insideMasterEnv: false,
        canChangeSpace: false,
        localeResource: {
          usage: 1,
          limits: {
            maximum: 2
          }
        }
      });
      expect(wrapper.find(selectors.addLocaleButton)).toHaveText('Add Locale');
      expect(wrapper.find(selectors.documentationSection)).toExist();
      expect(wrapper.find(selectors.usagesSection)).not.toExist();
      expect(wrapper.find(selectors.upgradeSpaceButton)).not.toExist();

      wrapper.find(selectors.addLocaleButton).simulate('click');
      expect($state.go.calledOnceWith('^.new')).toBeTruthy();
    });
  });

  describe('if environment is "master"', () => {
    describe('if limit is not reached', () => {
      it('all sections and texts are shown correctly', () => {
        expect.assertions(6);
        const { wrapper } = mount({
          insideMasterEnv: true,
          canChangeSpace: false,
          localeResource: {
            usage: 1,
            limits: {
              maximum: 2
            }
          }
        });
        expect(wrapper.find(selectors.documentationSection)).toExist();
        expect(wrapper.find(selectors.addLocaleButton)).toHaveText('Add Locale');
        expect(wrapper.find(selectors.usagesSection)).toIncludeText(
          'You are using 1 out of 2 locales available in this space.'
        );
        expect(wrapper.find(selectors.changeSpaceSection)).not.toExist();
        expect(wrapper.find(selectors.upgradeSpaceButton)).not.toExist();

        wrapper.find(selectors.addLocaleButton).simulate('click');
        expect($state.go.calledOnceWith('^.new')).toBeTruthy();
      });
    });

    describe('if limit is reached and user can change space', () => {
      it('all sections and texts are shown correctly if limit is more than 1', () => {
        expect.assertions(4);
        const { wrapper } = mount({
          insideMasterEnv: true,
          canChangeSpace: true,
          localeResource: {
            usage: 2,
            limits: {
              maximum: 2
            }
          }
        });
        expect(wrapper.find(selectors.documentationSection)).toExist();
        expect(wrapper.find(selectors.addLocaleButton)).not.toExist();
        expect(wrapper.find(selectors.usagesSection)).toIncludeText(
          'You are using 2 out of 2 locales available in this space.'
        );
        expect(wrapper.find(selectors.usagesSection)).toIncludeText(
          'Delete an existing locale or change the space to add more.'
        );
      });

      it('all sections and texts are shown correctly if limit is 1', () => {
        expect.assertions(4);

        const { wrapper } = mount({
          insideMasterEnv: true,
          canChangeSpace: true,
          localeResource: {
            usage: 1,
            limits: {
              maximum: 1
            }
          }
        });
        expect(wrapper.find(selectors.documentationSection)).toExist();
        expect(wrapper.find(selectors.addLocaleButton)).not.toExist();
        expect(wrapper.find(selectors.usagesSection)).toIncludeText(
          'You are using 1 out of 1 locale available in this space.'
        );
        expect(wrapper.find(selectors.usagesSection)).toIncludeText(
          'Change the space to add more.'
        );
      });

      it('if feature "feature-bv-06-2018-incentivize-upgrade" is on then upgrade button should be shown', done => {
        expect.assertions(4);
        setShowChangeSpaceIncentive(true);
        const { wrapper, stubs } = mount({
          showChangeSpaceIncentive: true,
          insideMasterEnv: true,
          canChangeSpace: true,
          localeResource: {
            usage: 1,
            limits: {
              maximum: 1
            }
          }
        });
        expect(
          LaunchDarkly.getCurrentVariation.calledWith('feature-bv-06-2018-incentivize-upgrade')
        ).toBeTruthy();
        // there was an async setState in the component
        // so we need to use process.nextTick to make sure
        // that all assertions are applied after async update
        process.nextTick(() => {
          wrapper.update();
          expect(wrapper.find(selectors.upgradeSpaceButton)).toHaveText('Upgrade space');
          expect(wrapper.find(selectors.changeSpaceSection)).not.toIncludeText(
            'Go to the subscription page to change'
          );
          wrapper.find(selectors.upgradeSpaceButton).simulate('click');
          expect(stubs.upgradeSpace.called).toBeTruthy();
          done();
        });
      });

      it('if feature "feature-bv-06-2018-incentivize-upgrade" is off then change subscription link is shown', done => {
        expect.assertions(4);
        setShowChangeSpaceIncentive(false);
        const { wrapper } = mount({
          showChangeSpaceIncentive: false,
          insideMasterEnv: true,
          canChangeSpace: true,
          localeResource: {
            usage: 1,
            limits: {
              maximum: 1
            }
          }
        });
        expect(
          LaunchDarkly.getCurrentVariation.calledWith('feature-bv-06-2018-incentivize-upgrade')
        ).toBeTruthy();
        // there was an async setState in the component
        // so we need to use process.nextTick to make sure
        // that all assertions are applied after async update
        process.nextTick(() => {
          wrapper.update();
          expect(wrapper.find(selectors.upgradeSpaceButton)).not.toExist();
          expect(wrapper.find(selectors.changeSpaceSection)).toIncludeText(
            'Go to the subscription page to change'
          );
          expect($state.href.called).toBeTruthy();
          done();
        });
      });
    });

    describe('if limit is reached and user cannot change space', () => {
      it('all sections and texts are shown correctly if limit is more than 1', () => {
        expect.assertions(5);
        const { wrapper } = mount({
          insideMasterEnv: true,
          canChangeSpace: false,
          localeResource: {
            usage: 2,
            limits: {
              maximum: 2
            }
          }
        });
        expect(wrapper.find(selectors.documentationSection)).toExist();
        expect(wrapper.find(selectors.addLocaleButton)).not.toExist();
        expect(wrapper.find(selectors.upgradeSpaceButton)).not.toExist();
        expect(wrapper.find(selectors.usagesSection)).toIncludeText(
          'You are using 2 out of 2 locales available in this space.'
        );
        expect(wrapper.find(selectors.usagesSection)).toIncludeText(
          'Delete an existing locale or ask the administrator of your organization to change the space to add more.'
        );
      });

      it('all sections and texts are shown correctly if limit is 1', () => {
        expect.assertions(5);
        const { wrapper } = mount({
          insideMasterEnv: true,
          canChangeSpace: false,
          localeResource: {
            usage: 1,
            limits: {
              maximum: 1
            }
          }
        });
        expect(wrapper.find(selectors.documentationSection)).toExist();
        expect(wrapper.find(selectors.addLocaleButton)).not.toExist();
        expect(wrapper.find(selectors.upgradeSpaceButton)).not.toExist();
        expect(wrapper.find(selectors.usagesSection)).toIncludeText(
          'You are using 1 out of 1 locale available in this space.'
        );
        expect(wrapper.find(selectors.usagesSection)).toIncludeText(
          'Ask the administrator of your organization to change the space to add more.'
        );
      });
    });
  });
});
