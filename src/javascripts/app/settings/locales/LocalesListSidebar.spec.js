import React from 'react';
import '@testing-library/jest-dom/extend-expect';
import { render, cleanup, fireEvent } from '@testing-library/react';
import LocalesListSidebar from './LocalesListSidebar';
import * as $stateMocked from 'ng/$state';

describe('settings/locales/LocalesListSidebar', () => {
  afterEach(cleanup);

  const renderComponent = props => {
    const stubs = {
      upgradeSpace: jest.fn()
    };
    const { queryByTestId } = render(
      <LocalesListSidebar
        allowedToEnforceLimits={false}
        upgradeSpace={stubs.upgradeSpace}
        subscriptionState={{
          path: ['account', 'organizations', 'subscription_new'],
          params: { orgId: '34NUQUZd5pA4mKLzDKGBWy' },
          options: { replace: true }
        }}
        {...props}
      />
    );

    return {
      addLocaleButton: queryByTestId('add-locales-button'),
      documentationSection: queryByTestId('locales-documentation'),
      usagesSection: queryByTestId('locales-usage'),
      changeSpaceSection: queryByTestId('change-space-block'),
      upgradeSpaceButton: queryByTestId('locales-change'),
      stubs
    };
  };

  beforeEach(() => {
    $stateMocked.go.mockClear();
    $stateMocked.href.mockClear();
  });

  describe('if environment is not "master"', () => {
    describe('if environment usage enforcement is not enabled', () => {
      it('add button and documentation are shown', () => {
        expect.assertions(5);
        const {
          addLocaleButton,
          documentationSection,
          usagesSection,
          upgradeSpaceButton
        } = renderComponent({
          insideMasterEnv: false,
          canChangeSpace: false,
          localeResource: {
            usage: 1,
            limits: {
              maximum: 2
            }
          }
        });
        expect(addLocaleButton).toHaveTextContent('Add Locale');

        expect(documentationSection).toBeInTheDocument();
        expect(usagesSection).not.toBeInTheDocument();
        expect(upgradeSpaceButton).not.toBeInTheDocument();

        fireEvent.click(addLocaleButton);

        expect($stateMocked.go).toHaveBeenCalledWith('^.new', undefined, undefined);
      });
    });

    describe('if environment usage enforcement is enabled and limit is reached', () => {
      it('shows all sections and buttons correctly', () => {
        expect.assertions(5);

        const {
          documentationSection,
          addLocaleButton,
          upgradeSpaceButton,
          usagesSection
        } = renderComponent({
          allowedToEnforceLimits: true,
          insideMasterEnv: false,
          canChangeSpace: true,
          localeResource: {
            usage: 2,
            limits: {
              maximum: 2
            }
          }
        });

        expect(documentationSection).toBeInTheDocument();
        expect(addLocaleButton).not.toBeInTheDocument();
        expect(upgradeSpaceButton).toBeInTheDocument();
        expect(usagesSection).toHaveTextContent(
          'You are using 2 out of 2 locales available in this space.'
        );
        expect(usagesSection).toHaveTextContent(
          'Delete an existing locale or change the space to add more.'
        );
      });
    });
  });

  describe('if environment is "master"', () => {
    describe('if limit is not reached', () => {
      it('all sections and texts are shown correctly', () => {
        expect.assertions(7);
        const {
          addLocaleButton,
          documentationSection,
          usagesSection,
          upgradeSpaceButton,
          changeSpaceSection
        } = renderComponent({
          insideMasterEnv: true,
          canChangeSpace: false,
          localeResource: {
            usage: 1,
            limits: {
              maximum: 2
            }
          }
        });
        expect(documentationSection).toBeInTheDocument();
        expect(addLocaleButton).toHaveTextContent('Add Locale');
        expect(usagesSection).toHaveTextContent(
          'You are using 1 out of 2 locales available in this space.'
        );
        expect(changeSpaceSection).not.toBeInTheDocument();
        expect(upgradeSpaceButton).not.toBeInTheDocument();

        fireEvent.click(addLocaleButton);
        expect($stateMocked.go).toHaveBeenCalledTimes(1);
        expect($stateMocked.go).toHaveBeenCalledWith('^.new', undefined, undefined);
      });
    });

    describe('if limit is reached and user can change space', () => {
      it('all sections and texts are shown correctly if limit is more than 1', () => {
        expect.assertions(4);
        const { documentationSection, addLocaleButton, usagesSection } = renderComponent({
          insideMasterEnv: true,
          canChangeSpace: true,
          localeResource: {
            usage: 2,
            limits: {
              maximum: 2
            }
          }
        });
        expect(documentationSection).toBeInTheDocument();
        expect(addLocaleButton).not.toBeInTheDocument();
        expect(usagesSection).toHaveTextContent(
          'You are using 2 out of 2 locales available in this space.'
        );
        expect(usagesSection).toHaveTextContent(
          'Delete an existing locale or change the space to add more.'
        );
      });

      it('all sections and texts are shown correctly if limit is 1', () => {
        expect.assertions(4);

        const { documentationSection, addLocaleButton, usagesSection } = renderComponent({
          insideMasterEnv: true,
          canChangeSpace: true,
          localeResource: {
            usage: 1,
            limits: {
              maximum: 1
            }
          }
        });
        expect(documentationSection).toBeInTheDocument();
        expect(addLocaleButton).not.toBeInTheDocument();
        expect(usagesSection).toHaveTextContent(
          'You are using 1 out of 1 locale available in this space.'
        );
        expect(usagesSection).toHaveTextContent('Change the space to add more.');
      });
    });

    describe('if limit is reached and user cannot change space', () => {
      it('all sections and texts are shown correctly if limit is more than 1', () => {
        expect.assertions(5);
        const {
          documentationSection,
          addLocaleButton,
          upgradeSpaceButton,
          usagesSection
        } = renderComponent({
          insideMasterEnv: true,
          canChangeSpace: false,
          localeResource: {
            usage: 2,
            limits: {
              maximum: 2
            }
          }
        });
        expect(documentationSection).toBeInTheDocument();
        expect(addLocaleButton).not.toBeInTheDocument();
        expect(upgradeSpaceButton).not.toBeInTheDocument();
        expect(usagesSection).toHaveTextContent(
          'You are using 2 out of 2 locales available in this space.'
        );
        expect(usagesSection).toHaveTextContent(
          'Delete an existing locale or ask the administrator of your organization to change the space to add more.'
        );
      });

      it('all sections and texts are shown correctly if limit is 1', () => {
        expect.assertions(5);
        const {
          documentationSection,
          addLocaleButton,
          upgradeSpaceButton,
          usagesSection
        } = renderComponent({
          insideMasterEnv: true,
          canChangeSpace: false,
          localeResource: {
            usage: 1,
            limits: {
              maximum: 1
            }
          }
        });
        expect(documentationSection).toBeInTheDocument();
        expect(addLocaleButton).not.toBeInTheDocument();
        expect(upgradeSpaceButton).not.toBeInTheDocument();
        expect(usagesSection).toHaveTextContent(
          'You are using 1 out of 1 locale available in this space.'
        );
        expect(usagesSection).toHaveTextContent(
          'Ask the administrator of your organization to change the space to add more.'
        );
      });
    });
  });
});
