import React from 'react';
import Enzyme from 'enzyme';
import $stateMocked from '$state';
import { Notification } from '@contentful/ui-component-library';
import LocalesListPricingOne, { AddLocaleButton, LocalesAdvice } from './LocalesListPricingOne.es6';

describe('app/settings/locales/LocalesListPricingOne', () => {
  it('should match snapshot', () => {
    const wrapper = Enzyme.shallow(
      <LocalesListPricingOne
        locales={[]}
        canCreateMultipleLocales={true}
        canChangeSpace={true}
        insideMasterEnv={true}
        localeResource={{
          usage: 0,
          limits: {
            maximum: 5
          }
        }}
        subscriptionState={{}}
        subscriptionPlanName="some subscription plan name"
        getComputeLocalesUsageForOrganization={() => false}
      />
    );
    expect(wrapper).toMatchSnapshot();
  });

  describe('AddLocaleButton', () => {
    it('if getComputeLocalesUsageForOrganization returns positive value than notification should be shown', () => {
      const notificationSpy = jest.spyOn(Notification, 'error').mockImplementation(() => {});
      const wrapper = Enzyme.mount(
        <AddLocaleButton getComputeLocalesUsageForOrganization={() => true} />
      );
      wrapper.find('button').simulate('click');
      expect(Notification.error).toHaveBeenCalledWith(true);
      expect($stateMocked.go).not.toHaveBeenCalled();
      notificationSpy.mockRestore();
    });

    it('if getComputeLocalesUsageForOrganization returns negative value than $state.go should be called', () => {
      const notificationSpy = jest.spyOn(Notification, 'error').mockImplementation(() => {});
      const wrapper = Enzyme.mount(
        <AddLocaleButton getComputeLocalesUsageForOrganization={() => false} />
      );
      wrapper.find('button').simulate('click');
      expect(Notification.error).not.toHaveBeenCalled();
      expect($stateMocked.go).toHaveBeenCalledWith('^.new', undefined, undefined);
      notificationSpy.mockRestore();
    });
  });

  describe('LocalesAdvice', () => {
    beforeEach(() => {
      $stateMocked.href.mockClear();
    });

    const mount = props => {
      return Enzyme.mount(
        <LocalesAdvice
          canCreateMultipleLocales={true}
          canChangeSpace={true}
          insideMasterEnv={true}
          subscriptionState={null}
          subscriptionPlanName="some subscription plan name"
          getComputeLocalesUsageForOrganization={() => false}
          {...props}
        />
      );
    };

    it('should show correct message if status is LocalesUsageStatus.ONE_LOCALE_USED', () => {
      const wrapper = mount({
        localeResource: {
          usage: 1,
          limits: {
            maximum: 5
          }
        },
        locales: [{ id: 1 }]
      });
      [
        'Contentful enables publishing content in multiple languages',
        'To begin translating your content, add a second locale – for example, French (fr-FR)',
        'Note that locale settings apply space-wide: the locales that you create will affect only the current space'
      ].map(text => {
        expect(wrapper.find('[data-test-id="locales-advice"]')).toIncludeText(text);
      });
    });

    it('should show correct message if status is LocalesUsageStatus.MORE_THAN_ONE_LOCALE_USED or environment is not equal to "master"', () => {
      const wrapper = mount({
        localeResource: {
          usage: 3,
          limits: {
            maximum: 5
          }
        },
        locales: [{ id: 1 }, { id: 2 }, { id: 3 }]
      });
      const wrapper2 = mount({
        localeResource: {
          usage: 1,
          limits: {
            maximum: 5
          }
        },
        locales: [{ id: 1 }],
        insideMasterEnv: false
      });

      [
        'Contentful enables publishing content in multiple languages',
        'To enable localization, go to the relevant content type, open field settings, and enable translation for each necessary field',
        'After that the content editor will display multiple input fields for each locale'
      ].map(text => {
        expect(wrapper.find('[data-test-id="locales-advice"]')).toIncludeText(text);
        expect(wrapper2.find('[data-test-id="locales-advice"]')).toIncludeText(text);
      });
    });

    it('should show correct message if status is LocalesUsageStatus.LOCALES_LIMIT_REACHED', () => {
      const mountReachedLimit = ({ canChangeSpace }) => {
        return mount({
          localeResource: {
            usage: 2,
            limits: {
              maximum: 2
            }
          },
          locales: [{ id: 1 }, { id: 2 }],
          subscriptionState: {
            path: ['account', 'organization', 'subscription']
          },
          canChangeSpace
        });
      };

      const canChangeSpaceWrapper = mountReachedLimit({ canChangeSpace: true });
      const cannotChangeSpaceWrapper = mountReachedLimit({ canChangeSpace: false });

      [
        'You have reached the organization locales limit',
        'Your current subscription plan (some subscription plan name) enables a maximum of 2 locales per organization'
      ].map(text => {
        expect(canChangeSpaceWrapper.find('[data-test-id="locales-advice"]')).toIncludeText(text);
        expect(cannotChangeSpaceWrapper.find('[data-test-id="locales-advice"]')).toIncludeText(
          text
        );
      });
      expect(canChangeSpaceWrapper.find('[data-test-id="locales-advice"]')).toIncludeText(
        'Please upgrade if you need more locales or delete some of the existing ones'
      );
      expect(cannotChangeSpaceWrapper.find('[data-test-id="locales-advice"]')).toIncludeText(
        'Please ask your organization owner to upgrade if you need more locales or delete some of the existing ones'
      );
      expect($stateMocked.href).toHaveBeenCalledTimes(1);
      expect($stateMocked.href).toHaveBeenCalledWith(
        'account.organization.subscription',
        undefined
      );
    });

    it('should show correct message if status is LocalesUsageStatus.NO_MULTIPLE_LOCALES', () => {
      const mountNoMultipleLocales = ({ canChangeSpace }) => {
        return mount({
          canCreateMultipleLocales: false,
          localeResource: {
            usage: 2,
            limits: {
              maximum: 2
            }
          },
          locales: [{ id: 1 }, { id: 2 }],
          subscriptionState: {
            path: ['account', 'organization', 'subscription']
          },
          canChangeSpace
        });
      };
      const canCreateSpaceWrapper = mountNoMultipleLocales({ canChangeSpace: true });
      const cannotChangeSpaceWrapper = mountNoMultipleLocales({ canChangeSpace: false });
      [
        'Your plan does not include multiple locales',
        'Your current subscription plan (some subscription plan name) does not support localizing content'
      ].map(text => {
        expect(canCreateSpaceWrapper.find('[data-test-id="locales-advice"]')).toIncludeText(text);
        expect(cannotChangeSpaceWrapper.find('[data-test-id="locales-advice"]')).toIncludeText(
          text
        );
      });
      expect(canCreateSpaceWrapper.find('[data-test-id="locales-advice"]')).toIncludeText(
        'Please upgrade to a plan that includes locales to benefit from this feature'
      );
      expect(cannotChangeSpaceWrapper.find('[data-test-id="locales-advice"]')).toIncludeText(
        'Please ask your organization owner to upgrade to a plan that includes locales to benefit from this feature'
      );
      expect($stateMocked.href).toHaveBeenCalledTimes(1);
      expect($stateMocked.href).toHaveBeenCalledWith(
        'account.organization.subscription',
        undefined
      );
    });
  });
});
