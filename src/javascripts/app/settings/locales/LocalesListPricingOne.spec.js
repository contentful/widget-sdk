import React from 'react';
import '@testing-library/jest-dom/extend-expect';
import { render, cleanup, fireEvent } from '@testing-library/react';
import * as $stateMocked from 'ng/$state';
import { Notification } from '@contentful/forma-36-react-components';
import { AddLocaleButton, LocalesAdvice } from './LocalesListPricingOne';

describe('app/settings/locales/LocalesListPricingOne', () => {
  afterEach(cleanup);

  describe('AddLocaleButton', () => {
    it('if getComputeLocalesUsageForOrganization returns positive value than notification should be shown', () => {
      const notificationSpy = jest.spyOn(Notification, 'error').mockImplementation(() => {});
      const { container } = render(
        <AddLocaleButton getComputeLocalesUsageForOrganization={() => true} />
      );
      fireEvent.click(container.querySelector('button'));
      expect(Notification.error).toHaveBeenCalledWith(true);
      expect($stateMocked.go).not.toHaveBeenCalled();
      notificationSpy.mockRestore();
    });

    it('if getComputeLocalesUsageForOrganization returns negative value than $state.go should be called', () => {
      const notificationSpy = jest.spyOn(Notification, 'error').mockImplementation(() => {});
      const { container } = render(
        <AddLocaleButton getComputeLocalesUsageForOrganization={() => false} />
      );
      fireEvent.click(container.querySelector('button'));
      expect(Notification.error).not.toHaveBeenCalled();
      expect($stateMocked.go).toHaveBeenCalledWith('^.new', undefined, undefined);
      notificationSpy.mockRestore();
    });
  });

  describe('LocalesAdvice', () => {
    beforeEach(() => {
      $stateMocked.href.mockClear();
    });
    const renderComponent = props => {
      return render(
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
      const { getByTestId } = renderComponent({
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
        expect(getByTestId('locales-advice')).toHaveTextContent(text);
      });
    });
    it('should show correct message if status is LocalesUsageStatus.MORE_THAN_ONE_LOCALE_USED or environment is not equal to "master"', () => {
      const wrapper = renderComponent({
        localeResource: {
          usage: 3,
          limits: {
            maximum: 5
          }
        },
        locales: [{ id: 1 }, { id: 2 }, { id: 3 }]
      });

      [
        'Contentful enables publishing content in multiple languages',
        'To enable localization, go to the relevant content type, open field settings, and enable translation for each necessary field',
        'After that the content editor will display multiple input fields for each locale'
      ].map(text => {
        expect(wrapper.getByTestId('locales-advice')).toHaveTextContent(text);
      });
    });

    const renderComponentWithReachedLimit = ({ canChangeSpace }) => {
      return renderComponent({
        localeResource: {
          usage: 2,
          limits: null,
          parent: {
            limits: {
              maximum: 2
            }
          }
        },
        locales: [{ id: 1 }, { id: 2 }],
        subscriptionState: {
          path: ['account', 'organization', 'subscription']
        },
        canChangeSpace
      });
    };

    const renderComponentWithNoMultipleLocales = ({ canChangeSpace }) => {
      return renderComponent({
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

    describe('when canChangeSpace is true', () => {
      it('it should show correct message if status is LocalesUsageStatus.LOCALES_LIMIT_REACHED', () => {
        const { getByTestId } = renderComponentWithReachedLimit({ canChangeSpace: true });
        [
          'You have reached the organization locales limit',
          'Your current subscription plan (some subscription plan name) enables a maximum of 2 locales per organization'
        ].map(text => {
          expect(getByTestId('locales-advice')).toHaveTextContent(text);
        });
        expect(getByTestId('locales-advice')).toHaveTextContent(
          'Please upgrade if you need more locales or delete some of the existing ones'
        );
        expect($stateMocked.href).toHaveBeenCalledTimes(1);
        expect($stateMocked.href).toHaveBeenCalledWith(
          'account.organization.subscription',
          undefined
        );
      });

      it('should show correct message if status is LocalesUsageStatus.NO_MULTIPLE_LOCALES', () => {
        const { getByTestId } = renderComponentWithNoMultipleLocales({
          canChangeSpace: true
        });
        [
          'Your plan does not include multiple locales',
          'Your current subscription plan (some subscription plan name) does not support localizing content'
        ].map(text => {
          expect(getByTestId('locales-advice')).toHaveTextContent(text);
        });
        expect(getByTestId('locales-advice')).toHaveTextContent(
          'Please upgrade to a plan that includes locales to benefit from this feature'
        );

        expect($stateMocked.href).toHaveBeenCalledTimes(1);
        expect($stateMocked.href).toHaveBeenCalledWith(
          'account.organization.subscription',
          undefined
        );
      });
    });

    describe('when canChangeSpace is false', () => {
      it('it should show correct message if status is LocalesUsageStatus.LOCALES_LIMIT_REACHED', () => {
        const { getByTestId } = renderComponentWithReachedLimit({ canChangeSpace: false });
        [
          'You have reached the organization locales limit',
          'Your current subscription plan (some subscription plan name) enables a maximum of 2 locales per organization'
        ].map(text => {
          expect(getByTestId('locales-advice')).toHaveTextContent(text);
        });
        expect(getByTestId('locales-advice')).toHaveTextContent(
          'Please ask your organization owner to upgrade if you need more locales or delete some of the existing ones'
        );
        expect($stateMocked.href).toHaveBeenCalledTimes(0);
      });

      it('should show correct message if status is LocalesUsageStatus.NO_MULTIPLE_LOCALES', () => {
        const { getByTestId } = renderComponentWithNoMultipleLocales({ canChangeSpace: false });
        [
          'Your plan does not include multiple locales',
          'Your current subscription plan (some subscription plan name) does not support localizing content'
        ].map(text => {
          expect(getByTestId('locales-advice')).toHaveTextContent(text);
        });
        expect(getByTestId('locales-advice')).toHaveTextContent(
          'Please ask your organization owner to upgrade to a plan that includes locales to benefit from this feature'
        );
        expect($stateMocked.href).toHaveBeenCalledTimes(0);
      });
    });
  });
});
