import React from 'react';
import { render } from '@testing-library/react';

import { WebhookListRoute } from './WebhookListRoute';
import * as AccessCheckerMocked from 'access_control/AccessChecker';
import { SpaceEnvContext } from 'core/services/SpaceEnvContext/SpaceEnvContext';
import { MemoryRouter } from 'core/react-routing';

const mockWebhookRepo = {
  getAll: jest.fn().mockResolvedValue([]),
};

jest.mock('../services/WebhookRepoInstance', () => ({
  getWebhookRepo: () => mockWebhookRepo,
}));

jest.mock('access_control/AccessChecker', () => ({
  getSectionVisibility: jest.fn(() => {}),
}));

jest.mock('app/common/ReloadNotification', () => ({
  basicErrorHandler: () => {},
}));

jest.mock('data/CMA/ProductCatalog', () => ({ getOrgFeature: () => Promise.resolve(false) }));

jest.mock('services/TokenStore', () => ({
  getUserSync: jest.fn().mockReturnValue({
    email: 'test@contentful.com',
  }),
}));

const build = (props = {}) => {
  return render(
    <SpaceEnvContext.Provider
      value={{
        currentSpace: {},
        currentSpaceId: 'space-id',
        currentOrganizationId: 'organization-id',
      }}>
      <MemoryRouter initialEntries={[{ pathname: '/', state: props }]}>
        <WebhookListRoute {...props} />
      </MemoryRouter>
    </SpaceEnvContext.Provider>
  );
};

describe('WebhookListRoute', () => {
  beforeEach(() => {
    mockWebhookRepo.getAll.mockClear();
    AccessCheckerMocked.getSectionVisibility.mockReset();
  });

  const setSectionVisibility = (isVisible) => {
    AccessCheckerMocked.getSectionVisibility.mockImplementation(() => ({ webhooks: isVisible }));
  };

  it('should show WebhookForbiddenPage if non-admin reaches page via deeplink templateId', () => {
    expect.assertions(2);
    setSectionVisibility(false);

    const { getByTestId } = build({ templateId: 'algolia-index-entries' });

    expect(mockWebhookRepo.getAll).not.toHaveBeenCalled();
    expect(getByTestId('webhooks.forbidden')).toBeInTheDocument();
  });

  it('should fetch webhooks if admin reaches that page', () => {
    expect.assertions(2);
    setSectionVisibility(true);
    const { queryByTestId } = build();
    expect(mockWebhookRepo.getAll).toHaveBeenCalledTimes(1);
    expect(queryByTestId('webhooks.forbidden')).toBeNull();
  });
});
