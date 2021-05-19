import React from 'react';
import { MemoryRouter } from 'core/react-routing';
import { render, screen } from '@testing-library/react';
import { LocalesListSidebar } from './LocalesListSidebar';
import * as spaceContextMocked from 'ng/spaceContext';
import userEvent from '@testing-library/user-event';
import { CONTACT_SALES_URL_WITH_IN_APP_BANNER_UTM } from 'analytics/utmLinks';
import * as trackCTA from 'analytics/trackCTA';
import { SpaceEnvContextProvider } from 'core/services/SpaceEnvContext/SpaceEnvContext';

const trackTargetedCTAClick = jest.spyOn(trackCTA, 'trackTargetedCTAClick');

describe('features/locales-management/LocalesListSidebar', () => {
  spaceContextMocked.getId.mockReturnValue(321);

  const renderComponent = (props) => {
    const stubs = {
      upgradeSpace: jest.fn(),
    };
    const { queryByTestId } = render(
      <MemoryRouter initialEntries={[{ pathname: '/' }]}>
        <SpaceEnvContextProvider>
          <LocalesListSidebar
            allowedToEnforceLimits={false}
            upgradeSpace={stubs.upgradeSpace}
            {...props}
          />
        </SpaceEnvContextProvider>
      </MemoryRouter>
    );

    return {
      addLocaleButton: queryByTestId('add-locales-button'),
      documentationSection: queryByTestId('locales-documentation'),
      documentationLink: queryByTestId('locales-documentation-link'),
      usagesSection: queryByTestId('locales-usage'),
      changeSpaceSection: queryByTestId('change-space-block'),
      upgradeSpaceButton: queryByTestId('locales-change'),
      stubs,
    };
  };

  describe('if environment is not "master"', () => {
    describe('if environment usage enforcement is not enabled', () => {
      it('add button and documentation are shown', () => {
        expect.assertions(4);
        const { addLocaleButton, documentationSection, usagesSection, upgradeSpaceButton } =
          renderComponent({
            insideMasterEnv: false,
            isOrgOwnerOrAdmin: false,
            localeResource: {
              usage: 1,
              limits: {
                maximum: 2,
              },
            },
          });
        expect(addLocaleButton).toHaveTextContent('Add Locale');

        expect(documentationSection).toBeInTheDocument();
        expect(usagesSection).not.toBeInTheDocument();
        expect(upgradeSpaceButton).not.toBeInTheDocument();
      });
    });

    describe('if environment usage enforcement is enabled and limit is reached', () => {
      it('shows all sections and buttons correctly', () => {
        expect.assertions(5);

        const { documentationSection, addLocaleButton, upgradeSpaceButton, usagesSection } =
          renderComponent({
            allowedToEnforceLimits: true,
            insideMasterEnv: false,
            isOrgOwnerOrAdmin: true,
            hasNextSpacePlan: true,
            localeResource: {
              usage: 2,
              limits: {
                maximum: 2,
              },
            },
          });

        expect(documentationSection).toBeInTheDocument();
        expect(addLocaleButton).not.toBeInTheDocument();
        expect(upgradeSpaceButton).toBeInTheDocument();
        expect(usagesSection).toHaveTextContent(
          'You are using 2 out of 2 locales available in this space.'
        );
        expect(usagesSection).toHaveTextContent('Upgrade the space to add more.');
      });

      it('shows CTA button to talk to support about upgrading to enterprise when there are no more space plans and limit is reached', () => {
        const { documentationSection, addLocaleButton, upgradeSpaceButton, usagesSection } =
          renderComponent({
            allowedToEnforceLimits: true,
            insideMasterEnv: false,
            isOrgOwnerOrAdmin: true,
            hasNextSpacePlan: false,
            localeResource: {
              usage: 2,
              limits: {
                maximum: 2,
              },
            },
          });
        const contactSalesButton = screen.getByTestId('link-to-sales-button');
        expect(contactSalesButton).toBeInTheDocument();
        expect(contactSalesButton.getAttribute('href')).toMatch(
          CONTACT_SALES_URL_WITH_IN_APP_BANNER_UTM
        );
        expect(documentationSection).toBeInTheDocument();
        expect(addLocaleButton).not.toBeInTheDocument();
        expect(upgradeSpaceButton).not.toBeInTheDocument();
        expect(usagesSection.textContent).toMatch(
          'You are using 2 out of 2 locales available in this space.'
        );

        userEvent.click(contactSalesButton);

        expect(trackTargetedCTAClick).toBeCalledWith(trackCTA.CTA_EVENTS.UPGRADE_TO_ENTERPRISE, {
          organizationId: 'org',
          spaceId: 'fg5eidi9k2qp',
        });
      });
    });
  });

  describe('if environment is "master"', () => {
    describe('if limit is not reached', () => {
      it('all sections and texts are shown correctly', () => {
        expect.assertions(5);
        const {
          addLocaleButton,
          documentationSection,
          usagesSection,
          upgradeSpaceButton,
          changeSpaceSection,
        } = renderComponent({
          insideMasterEnv: true,
          isOrgOwnerOrAdmin: false,
          localeResource: {
            usage: 1,
            limits: {
              maximum: 2,
            },
          },
        });
        expect(documentationSection).toBeInTheDocument();
        expect(addLocaleButton).toHaveTextContent('Add Locale');
        expect(usagesSection).toHaveTextContent(
          'You are using 1 out of 2 locales available in this space.'
        );
        expect(changeSpaceSection).not.toBeInTheDocument();
        expect(upgradeSpaceButton).not.toBeInTheDocument();
      });
    });

    describe('if limit is reached and user can change space', () => {
      it('all sections and texts are shown correctly if limit is more than 1', () => {
        expect.assertions(4);
        const { documentationSection, addLocaleButton, usagesSection } = renderComponent({
          insideMasterEnv: true,
          isOrgOwnerOrAdmin: true,
          hasNextSpacePlan: true,
          localeResource: {
            usage: 2,
            limits: {
              maximum: 2,
            },
          },
        });
        expect(documentationSection).toBeInTheDocument();
        expect(addLocaleButton).not.toBeInTheDocument();
        expect(usagesSection).toHaveTextContent(
          'You are using 2 out of 2 locales available in this space.'
        );
        expect(usagesSection).toHaveTextContent('Upgrade the space to add more.');
      });

      it('all sections and texts are shown correctly if limit is 1', () => {
        expect.assertions(4);

        const { documentationSection, addLocaleButton, usagesSection } = renderComponent({
          insideMasterEnv: true,
          isOrgOwnerOrAdmin: true,
          hasNextSpacePlan: true,
          localeResource: {
            usage: 1,
            limits: {
              maximum: 1,
            },
          },
        });
        expect(documentationSection).toBeInTheDocument();
        expect(addLocaleButton).not.toBeInTheDocument();
        expect(usagesSection).toHaveTextContent(
          'You are using 1 out of 1 locale available in this space.'
        );
        expect(usagesSection).toHaveTextContent('Upgrade the space to add more.');
      });
    });

    describe('if limit is reached and user cannot change space', () => {
      it('all sections and texts are shown correctly if limit is more than 1', () => {
        expect.assertions(5);
        const { documentationSection, addLocaleButton, upgradeSpaceButton, usagesSection } =
          renderComponent({
            insideMasterEnv: true,
            isOrgOwnerOrAdmin: false,
            localeResource: {
              usage: 2,
              limits: {
                maximum: 2,
              },
            },
          });
        expect(documentationSection).toBeInTheDocument();
        expect(addLocaleButton).not.toBeInTheDocument();
        expect(upgradeSpaceButton).not.toBeInTheDocument();
        expect(usagesSection).toHaveTextContent(
          'You are using 2 out of 2 locales available in this space.'
        );
        expect(usagesSection).toHaveTextContent(
          'Ask the administrator of your organization to upgrade the space to add more locales.'
        );
      });

      it('all sections and texts are shown correctly if limit is 1', () => {
        expect.assertions(5);
        const { documentationSection, addLocaleButton, upgradeSpaceButton, usagesSection } =
          renderComponent({
            insideMasterEnv: true,
            isOrgOwnerOrAdmin: false,
            localeResource: {
              usage: 1,
              limits: {
                maximum: 1,
              },
            },
          });
        expect(documentationSection).toBeInTheDocument();
        expect(addLocaleButton).not.toBeInTheDocument();
        expect(upgradeSpaceButton).not.toBeInTheDocument();
        expect(usagesSection).toHaveTextContent(
          'You are using 1 out of 1 locale available in this space.'
        );
        expect(usagesSection).toHaveTextContent(
          'Ask the administrator of your organization to upgrade the space to add more locales.'
        );
      });
    });
  });

  describe('documentation', () => {
    it('has the UTM paramters for the documentation link', () => {
      const { documentationLink } = renderComponent({
        insideMasterEnv: true,
        isOrgOwnerOrAdmin: false,
        localeResource: {
          usage: 1,
          limits: {
            maximum: 2,
          },
        },
      });

      expect(documentationLink.getAttribute('href')).toContain(
        '?utm_source=webapp&utm_medium=locales-sidebar&utm_campaign=in-app-help'
      );
    });
  });
});
