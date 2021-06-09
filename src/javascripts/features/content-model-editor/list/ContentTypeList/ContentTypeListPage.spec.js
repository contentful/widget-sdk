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

import { ContentTypeListPage as Page } from './ContentTypeListPage';

import { fetchContentTypes, filterContentTypes } from './ContentTypeListService';
import * as contentTypeFactory from 'test/helpers/contentTypeFactory';
import * as PricingService from 'services/PricingService';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';
import createResourceService from 'services/ResourceService';
import * as trackCTA from 'analytics/trackCTA';
import { CONTACT_SALES_URL_WITH_IN_APP_BANNER_UTM } from 'analytics/utmLinks';
import * as Fake from 'test/helpers/fakeFactory';
// eslint-disable-next-line no-restricted-imports
import { MemoryRouter } from 'react-router';

jest.mock('lodash/debounce', () => (fn) => fn);

jest.mock('detect-browser', () => ({
  detect: jest.fn().mockReturnValue({ name: 'not-ie' }),
}));

jest.mock('services/OrganizationRoles', () => ({
  isOwnerOrAdmin: jest.fn(),
}));

const trackTargetedCTAClick = jest.spyOn(trackCTA, 'trackTargetedCTAClick');

jest.mock('utils/ResourceUtils', () => ({
  getResourceLimits: jest.fn((r) => r.limits),
}));

jest.mock('services/ResourceService', () => {
  const resourceService = {
    get: jest.fn(),
  };

  return () => resourceService;
});

jest.mock('./ContentTypeList', () => {
  return { ContentTypeList: (props) => props.contentTypes.map((item) => item.sys.id).join(',') };
});

jest.mock('access_control/AccessChecker', () => ({
  shouldHide: jest.fn().mockReturnValue(false),
  shouldDisable: jest.fn().mockReturnValue(false),
  Action: { CREATE: 'Create' },
}));

const testIds = {
  contentLoader: 'content-loader',
  contentTypeList: 'content-type-list',
  emptyState: 'empty-state',
  noSearchResults: 'no-search-results',
  searchBox: 'search-box',
  statusFilter: 'status-filter',
};

jest.mock('./ContentTypeListService', () => ({
  fetchContentTypes: jest.fn(),
  filterContentTypes: jest.fn(),
}));

const mockContentTypeList = [
  contentTypeFactory.createPublished(),
  contentTypeFactory.createPublished(),
  contentTypeFactory.createPublished(),
];

function renderComponent({ props = {} }) {
  render(<Page {...props} />, { wrapper: MemoryRouter });
  return waitForElementToBeRemoved(() => screen.getByTestId(testIds.contentLoader));
}

describe('ContentTypeList Page', () => {
  beforeEach(() => {
    createResourceService().get.mockResolvedValue({ usage: 1, limits: { maximum: 1 } });

    jest.spyOn(PricingService, 'nextSpacePlanForResource').mockResolvedValue(null);
    fetchContentTypes.mockReturnValue(mockContentTypeList);
    filterContentTypes.mockReturnValue(mockContentTypeList);
  });

  afterEach(() => {
    PricingService.nextSpacePlanForResource.mockRestore();
  });

  it('renders results once loaded', async () => {
    await renderComponent({});

    await waitFor(() => expect(screen.getByTestId(testIds.contentTypeList)).toBeVisible());

    expect(screen.queryByTestId(testIds.contentLoader)).not.toBeInTheDocument();
    expect(screen.getByTestId(testIds.searchBox)).toBeInTheDocument();
    expect(screen.getByTestId(testIds.statusFilter)).toBeInTheDocument();
  });

  it('renders empty page if no content types loaded', async () => {
    fetchContentTypes.mockReturnValue([]);
    filterContentTypes.mockReturnValue([]);
    await renderComponent({});

    await waitFor(() => expect(screen.getByTestId(testIds.emptyState)).toBeVisible());

    expect(screen.queryByTestId(testIds.contentTypeList)).not.toBeInTheDocument();
  });

  describe('Search Box', () => {
    const contentTypes = [
      contentTypeFactory.createPublished({ name: 'aaa' }),
      contentTypeFactory.createPublished({ name: 'bbb' }),
    ];

    it('filters results by search box value', async () => {
      fetchContentTypes.mockReturnValue(contentTypes);
      filterContentTypes.mockReturnValue([contentTypeFactory.createPublished({ name: 'aaa' })]);

      await renderComponent({});
      await waitFor(() => expect(screen.getByTestId(testIds.searchBox)).toBeVisible());

      await fireEvent.change(screen.getByTestId(testIds.searchBox), {
        target: { value: 'a' },
      });

      expect(screen.queryByTestId(testIds.contentTypeList).textContent).toMatchInlineSnapshot(
        `"content-type-id28"`
      );
    });

    it('renders no results', async () => {
      fetchContentTypes.mockReturnValue(contentTypes);
      filterContentTypes.mockReturnValue([]);

      await renderComponent({});
      await waitFor(() => expect(screen.getByTestId(testIds.searchBox)).toBeVisible());

      await fireEvent.change(screen.getByTestId(testIds.searchBox), {
        target: { value: 'x' },
      });

      expect(screen.queryByTestId(testIds.contentTypeList)).not.toBeInTheDocument();
      expect(screen.getByTestId(testIds.noSearchResults)).toBeInTheDocument();
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

        await renderComponent({});

        expect(screen.queryByTestId('content-type-limit-banner')).toBeNull();
      });

      it('does not show up even if they are at above the 90% threshold', async () => {
        isOwnerOrAdmin.mockReturnValue(true);
        createResourceService().get.mockResolvedValue({ usage: 46, limits: { maximum: 48 } });
        await renderComponent({});

        expect(screen.queryByTestId('content-type-limit-banner')).toBeNull();
      });
    });

    describe('with no next available space plan', () => {
      // The default in the topmost `beforeEach` is no next space plan
      it('does not show up if they are not an owner or admin', async () => {
        createResourceService().get.mockResolvedValue({ usage: 44, limits: { maximum: 48 } });
        isOwnerOrAdmin.mockReturnValue(false);

        await renderComponent({});

        expect(screen.queryByTestId('content-type-limit-banner')).toBeNull();
      });

      it('shows up if they are at the 90% threshold', async () => {
        isOwnerOrAdmin.mockReturnValue(true);
        createResourceService().get.mockResolvedValue({ usage: 44, limits: { maximum: 48 } });

        await renderComponent({});

        expect(screen.queryByTestId('content-type-limit-banner')).toBeVisible();
      });

      it('shows up with a link to sales if they are an owner or admin', async () => {
        createResourceService().get.mockResolvedValue({ usage: 44, limits: { maximum: 48 } });
        isOwnerOrAdmin.mockReturnValue(true);

        await renderComponent({});

        expect(screen.queryByTestId('content-type-limit-banner')).toBeVisible();
        expect(screen.queryByTestId('link-to-sales')).toBeVisible();
      });

      it('tracks click on the link to sales', async () => {
        createResourceService().get.mockResolvedValue({ usage: 44, limits: { maximum: 48 } });
        isOwnerOrAdmin.mockReturnValue(true);
        const fakeSpaceId = 'fakeSpaceId';
        const fakeOrg = Fake.Organization();

        await renderComponent({
          props: { spaceId: fakeSpaceId, currentOrganizationId: fakeOrg.sys.id },
        });

        expect(screen.queryByTestId('content-type-limit-banner')).toBeVisible();

        const linkToSales = screen.getByTestId('link-to-sales');
        expect(linkToSales.href).toMatch(CONTACT_SALES_URL_WITH_IN_APP_BANNER_UTM);
        userEvent.click(linkToSales);

        expect(trackTargetedCTAClick).toBeCalledWith(trackCTA.CTA_EVENTS.UPGRADE_TO_ENTERPRISE, {
          organizationId: fakeOrg.sys.id,
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
      fetchContentTypes.mockReturnValue(contentTypes);
      filterContentTypes.mockReturnValue(contentTypes);

      await renderComponent({});

      await waitFor(() => {
        expect(screen.getByTestId(testIds.statusFilter)).toBeVisible();
      });

      expect(screen.getByTestId('status-undefined')).toBeInTheDocument();
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
        fetchContentTypes.mockReturnValue(contentTypes);
        filterContentTypes.mockReturnValue(expectedResult);

        await renderComponent({});

        expect(screen.queryByTestId(testIds.statusFilter)).toBeVisible();

        fireEvent.click(screen.getByTestId(`status-${status}`));
        expect(filterContentTypes).toHaveBeenCalled();

        expect(screen.getByTestId(testIds.contentTypeList)).toBeInTheDocument();
        expect(screen.getByTestId(testIds.contentTypeList).textContent).toEqual(
          expectedResult.map((item) => item.sys.id).join(',')
        );
      });
    });
  });
});
