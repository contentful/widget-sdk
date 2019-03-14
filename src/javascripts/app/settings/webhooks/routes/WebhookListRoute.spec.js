import React from 'react';
import Enzyme from 'enzyme';
import WebhookListRoute from './WebhookListRoute.es6';
import * as $stateMocked from 'ng/$state';
import * as spaceContextMocked from 'ng/spaceContext';
import * as AccessCheckerMocked from 'access_control/AccessChecker/index.es6';

jest.mock(
  'access_control/AccessChecker/index.es6',
  () => ({
    getSectionVisibility: jest.fn(() => {})
  }),
  { virtual: true }
);

jest.mock(
  'app/common/ReloadNotification.es6',
  () => ({
    basicErrorHandler: () => {}
  }),
  { virtual: true }
);

jest.mock('data/CMA/ProductCatalog.es6', () => ({ getOrgFeature: () => Promise.resolve(false) }));

describe('WebhookListRoute', () => {
  beforeEach(() => {
    $stateMocked.go.mockClear();
    spaceContextMocked.getData.mockReset();
    spaceContextMocked.webhookRepo.getAll.mockClear();
    spaceContextMocked.publishedCTs.getAllBare.mockClear();
    AccessCheckerMocked.getSectionVisibility.mockReset();
  });

  const setSectionVisibility = isVisible => {
    AccessCheckerMocked.getSectionVisibility.mockImplementation(() => ({ webhooks: isVisible }));
  };

  const selectors = {
    forbiddenPage: '[data-test-id="webhooks.forbidden"]'
  };

  it('should be resticted for non-admins and redirect should be called', () => {
    expect.assertions(3);
    setSectionVisibility(false);
    Enzyme.mount(<WebhookListRoute />);
    expect($stateMocked.go).toHaveBeenCalledTimes(1);
    expect($stateMocked.go).toHaveBeenCalledWith(
      'spaces.detail.entries.list',
      undefined,
      undefined
    );
    expect(spaceContextMocked.webhookRepo.getAll).not.toHaveBeenCalled();
  });

  it('should show WebhookForbiddenPage if non-admin reaches page via deeplink templateId', () => {
    expect.assertions(3);
    setSectionVisibility(false);

    const wrapper = Enzyme.mount(<WebhookListRoute templateId="algolia-index-entries" />);

    expect($stateMocked.go).not.toHaveBeenCalled();
    expect(spaceContextMocked.webhookRepo.getAll).not.toHaveBeenCalled();
    expect(wrapper.find(selectors.forbiddenPage)).toExist();
  });

  it('should fetch webhooks if admin reaches that page', () => {
    expect.assertions(3);
    setSectionVisibility(true);
    const wrapper = Enzyme.mount(<WebhookListRoute />);
    expect($stateMocked.go).not.toHaveBeenCalled();
    expect(spaceContextMocked.webhookRepo.getAll).toHaveBeenCalledTimes(1);
    expect(wrapper.find(selectors.forbiddenPage)).not.toExist();
  });
});
