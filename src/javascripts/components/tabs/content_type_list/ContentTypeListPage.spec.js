import React from 'react';

import {
  screen,
  render,
  waitFor,
  fireEvent,
  waitForElementToBeRemoved,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { flatten, concat } from 'lodash';

import { ContentTypesPage as Page } from './ContentTypeListPage';

import * as spaceContextMocked from 'ng/spaceContext';
import * as contentTypeFactory from 'test/helpers/contentTypeFactory';
import * as PricingService from 'services/PricingService';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';
import createResourceService from 'services/ResourceService';
import { isLegacyOrganization } from 'utils/ResourceUtils';
import * as fake from 'test/helpers/fakeFactory';
import * as trackCTA from 'analytics/trackCTA';
import { CONTACT_SALES_URL_WITH_IN_APP_BANNER_UTM } from 'analytics/utmLinks';

jest.mock('lodash/debounce', () => (fn) => fn);

jest.mock('detect-browser', () => ({
  detect: jest.fn().mockReturnValue({ name: 'not-ie' }),
}));

jest.mock('services/OrganizationRoles', () => ({
  isOwnerOrAdmin: jest.fn(),
}));

const trackTargetedCTAClick = jest.spyOn(trackCTA, 'trackTargetedCTAClick');

jest.mock('utils/ResourceUtils', () => ({
  isLegacyOrganization: jest.fn().mockReturnValue(false),
  getResourceLimits: jest.fn((r) => r.limits),
}));

jest.mock('services/ResourceService', () => {
  const resourceService = {
    get: jest.fn(),
  };

  return () => resourceService;
});

jest.mock('./ContentTypeList', () => {
  return (props) => props.contentTypes.map((item) => item.sys.id).join(',');
});

jest.mock('access_control/AccessChecker', () => ({
  shouldHide: jest.fn().mockReturnValue(false),
  shouldDisable: jest.fn().mockReturnValue(false),
  Action: { CREATE: 'Create' },
}));

const selectors = {
  contentLoader: '[data-test-id="content-loader"]',
  contentTypeList: '[data-test-id="content-type-list"]',
  emptyState: '[data-test-id="empty-state"]',
  noSearchResults: '[data-test-id="no-search-results"]',
  searchBox: '[data-test-id="search-box"]',
  statusFilter: '[data-test-id="status-filter"]',
};

const mockContentTypeList = [
  contentTypeFactory.createPublished(),
  contentTypeFactory.createPublished(),
  contentTypeFactory.createPublished(),
];
const mockOrganization = fake.Organization();

function renderComponent({ props = {}, items = [] }) {
  const getStub = jest.fn().mockResolvedValue({ items });
  const getEnvironmentId = jest.fn();
  spaceContextMocked.endpoint = getStub;
  spaceContextMocked.organization = mockOrganization;
  spaceContextMocked.getEnvironmentId = getEnvironmentId;

  const wrapper = render(<Page {...props} />);

  return [wrapper, getStub];
}

describe('ContentTypeList Page', () => {
  beforeEach(() => {
    createResourceService().get.mockResolvedValue({ usage: 1, limits: { maximum: 1 } });

    jest.spyOn(PricingService, 'nextSpacePlanForResource').mockResolvedValue(null);
  });

  afterEach(() => {
    PricingService.nextSpacePlanForResource.mockRestore();
  });

  it('renders loader', () => {
    const [{ container }, getStub] = renderComponent({ items: mockContentTypeList });

    expect(getStub).toHaveBeenCalledTimes(1);
    expect(container.querySelector(selectors.contentLoader)).toBeInTheDocument();
  });

  it('renders results once loaded', async () => {
    const [{ container }] = renderComponent({ items: mockContentTypeList });

    await waitFor(() => {
      return container.querySelector(selectors.contentTypeList);
    });

    expect(container.querySelector(selectors.contentLoader)).not.toBeInTheDocument();
    expect(container.querySelector(selectors.searchBox)).toBeInTheDocument();
    expect(container.querySelector(selectors.statusFilter)).toBeInTheDocument();
  });

  it('renders empty page if no content types loaded', async () => {
    const [{ container }] = renderComponent({ items: [] });

    await waitFor(() => {
      return container.querySelector(selectors.emptyState);
    });

    expect(container.querySelector(selectors.contentTypeList)).not.toBeInTheDocument();
  });

  it('renders predefined search text', async () => {
    const searchText = 'initial search text 42';
    const [{ container }] = renderComponent({
      props: { searchText },
      items: mockContentTypeList,
    });

    await waitFor(() => {
      return container.querySelector(selectors.searchBox);
    });

    expect(container.querySelector(selectors.searchBox).value).toEqual(searchText);
  });

  describe('Search Box', () => {
    const contentTypes = [
      contentTypeFactory.createPublished({ name: 'aaa' }),
      contentTypeFactory.createPublished({ name: 'bbb' }),
    ];

    it('filters results by search box value', async () => {
      const [{ container }] = renderComponent({
        items: contentTypes,
      });

      await waitFor(() => {
        return container.querySelector(selectors.searchBox);
      });

      fireEvent.change(container.querySelector(selectors.searchBox), {
        target: { value: 'a' },
      });

      expect(container.querySelector(selectors.contentTypeList).textContent).toMatchInlineSnapshot(
        `"content-type-id14"`
      );
    });

    it('renders no results', async () => {
      const [{ container }] = renderComponent({
        items: contentTypes,
      });

      await waitFor(() => {
        return container.querySelector(selectors.searchBox);
      });

      fireEvent.change(container.querySelector(selectors.searchBox), {
        target: { value: 'x' },
      });

      expect(container.querySelector(selectors.contentTypeList)).not.toBeInTheDocument();
      expect(container.querySelector(selectors.noSearchResults)).toBeInTheDocument();
    });
  });

  describe('Limit banner', () => {
    describe('with next available space plan', () => {
      beforeEach(() => {
        PricingService.nextSpacePlanForResource.mockResolvedValueOnce({
          name: 'Some space plan',
        });
      });

      it('does not show up if they are not at the 90% threshold', async () => {
        createResourceService().get.mockResolvedValue({ usage: 43, limits: { maximum: 48 } });
        isOwnerOrAdmin.mockReturnValue(true);

        renderComponent({ props: {}, items: [] });
        await waitForElementToBeRemoved(screen.getByTestId('content-loader'));

        expect(screen.queryByTestId('content-type-limit-banner')).toBeNull();
      });

      it('does not show up even if they are at above the 90% threshold', async () => {
        isOwnerOrAdmin.mockReturnValue(true);
        createResourceService().get.mockResolvedValue({ usage: 46, limits: { maximum: 48 } });
        renderComponent({ props: {}, items: [] });
        await waitForElementToBeRemoved(screen.getByTestId('content-loader'));

        expect(screen.queryByTestId('content-type-limit-banner')).toBeNull();
      });
    });

    describe('with no next available space plan', () => {
      // The default in the topmost `beforeEach` is no next space plan
      it('does not show up if they are not an owner or admin', async () => {
        createResourceService().get.mockResolvedValue({ usage: 44, limits: { maximum: 48 } });
        isOwnerOrAdmin.mockReturnValue(false);

        renderComponent({ props: {}, items: [] });
        await waitForElementToBeRemoved(screen.getByTestId('content-loader'));

        expect(screen.queryByTestId('content-type-limit-banner')).toBeNull();
      });

      it('does not show up if the org is legacy', async () => {
        createResourceService().get.mockResolvedValue({ usage: 48, limits: { maximum: 48 } });
        isOwnerOrAdmin.mockReturnValue(true);
        isLegacyOrganization.mockReturnValueOnce(true);

        renderComponent({ props: {}, items: [] });
        await waitForElementToBeRemoved(screen.getByTestId('content-loader'));

        expect(screen.queryByTestId('content-type-limit-banner')).toBeNull();
      });

      it('shows up if they are at the 90% threshold', async () => {
        isOwnerOrAdmin.mockReturnValue(true);
        createResourceService().get.mockResolvedValue({ usage: 44, limits: { maximum: 48 } });

        renderComponent({ props: {}, items: [] });
        await waitForElementToBeRemoved(screen.getByTestId('content-loader'));

        expect(screen.queryByTestId('content-type-limit-banner')).toBeVisible();
      });

      it('shows up with a link to sales if they are an owner or admin', async () => {
        createResourceService().get.mockResolvedValue({ usage: 44, limits: { maximum: 48 } });
        isOwnerOrAdmin.mockReturnValue(true);

        renderComponent({ props: {}, items: [] });
        await waitForElementToBeRemoved(screen.getByTestId('content-loader'));

        expect(screen.queryByTestId('content-type-limit-banner')).toBeVisible();
        expect(screen.queryByTestId('link-to-sales')).toBeVisible();
      });

      it('tracks click on the link to sales', async () => {
        createResourceService().get.mockResolvedValue({ usage: 44, limits: { maximum: 48 } });
        isOwnerOrAdmin.mockReturnValue(true);
        const fakeSpaceId = 'fakeSpaceId';

        renderComponent({ props: { spaceId: fakeSpaceId }, items: [] });
        await waitForElementToBeRemoved(screen.getByTestId('content-loader'));

        expect(screen.queryByTestId('content-type-limit-banner')).toBeVisible();

        const linkToSales = screen.getByTestId('link-to-sales');
        expect(linkToSales.href).toMatch(CONTACT_SALES_URL_WITH_IN_APP_BANNER_UTM);
        userEvent.click(linkToSales);

        expect(trackTargetedCTAClick).toBeCalledWith(trackCTA.CTA_EVENTS.UPGRADE_TO_ENTERPRISE, {
          organizationId: mockOrganization.sys.id,
          spaceId: fakeSpaceId,
        });
      });
    });
  });

  describe('Status filter', () => {
    const contentTypesByStatus = {
      draft: [contentTypeFactory.createDraft(), contentTypeFactory.createDraft()],
      published: [contentTypeFactory.createPublished(), contentTypeFactory.createPublished()],
      updated: [contentTypeFactory.createUpdated()],
    };

    const contentTypes = flatten(Object.values(contentTypesByStatus));

    it('highlights default status (All) after page load', async () => {
      const [{ container, getByTestId }] = renderComponent({
        items: contentTypes,
      });

      await waitFor(() => {
        return container.querySelector(selectors.statusFilter);
      });

      expect(getByTestId('status-undefined')).toBeInTheDocument();
    });

    /* eslint-disable-next-line no-restricted-syntax */
    describe.each`
      status       | expectedResult
      ${'draft'}   | ${contentTypesByStatus.draft}
      ${'active'}  | ${concat(contentTypesByStatus.published, contentTypesByStatus.updated)}
      ${'changed'} | ${contentTypesByStatus.updated}
      ${undefined} | ${contentTypes}
    `('filters list', ({ status, expectedResult }) => {
      it(`by status: ${status || 'All'}`, async () => {
        const [{ container, getByTestId }] = renderComponent({
          items: contentTypes,
        });

        await waitFor(() => {
          return container.querySelector(selectors.statusFilter);
        });

        fireEvent.click(getByTestId(`status-${status}`));

        expect(container.querySelector(selectors.contentTypeList)).toBeInTheDocument();
        expect(container.querySelector(selectors.contentTypeList).textContent).toEqual(
          expectedResult.map((item) => item.sys.id).join(',')
        );
      });
    });
  });
});
