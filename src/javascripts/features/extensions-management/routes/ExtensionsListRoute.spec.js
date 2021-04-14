import React from 'react';
import { render, screen } from '@testing-library/react';
import * as spaceContextMocked from 'ng/spaceContext';
import * as $stateMocked from 'ng/$state';
import { ExtensionsListRoute } from './ExtensionsListRoute';
import * as AccessCheckerMocked from 'access_control/AccessChecker';
import { go } from 'states/Navigator';
import { useCurrentSpaceAPIClient } from 'core/services/APIClient/useCurrentSpaceAPIClient';

jest.mock('access_control/AccessChecker', () => ({
  getSectionVisibility: jest.fn(() => {}),
}));

jest.mock('states/Navigator');

jest.mock('core/services/APIClient/useCurrentSpaceAPIClient');

describe('ExtensionsListRoute', () => {
  beforeEach(() => {
    $stateMocked.go.mockClear();
    spaceContextMocked.getData.mockReset();
    AccessCheckerMocked.getSectionVisibility.mockReset();
  });

  const selectors = {
    forbiddenPage: 'extensions.forbidden',
  };

  it('should render Forbidden page when no access', () => {
    AccessCheckerMocked.getSectionVisibility.mockImplementation(() => ({ extensions: false }));
    useCurrentSpaceAPIClient.mockReturnValue({ client: { getExtensionsForListing: jest.fn() } });
    render(<ExtensionsListRoute />);
    expect(screen.queryByTestId(selectors.forbiddenPage)).toBeInTheDocument();
  });

  it('should show ExtensionsForbiddenPage if no access and reaches page via deeplink extensionUrl', () => {
    AccessCheckerMocked.getSectionVisibility.mockImplementation(() => ({ extensions: false }));
    expect.assertions(4);
    const getExtensionsForListing = jest.fn();
    useCurrentSpaceAPIClient.mockReturnValue({ client: { getExtensionsForListing } });
    render(
      <ExtensionsListRoute extensionUrl="https://github.com/contentful/extensions/blob/master/samples/build-netlify/extension.json" />
    );

    expect(go).not.toHaveBeenCalled();
    expect(getExtensionsForListing).not.toHaveBeenCalled();
    expect(screen.queryByTestId(selectors.forbiddenPage)).toBeInTheDocument();
    expect(screen.queryByTestId(selectors.forbiddenPage)).toHaveTextContent(
      'Share this URL with your admin so they can install it for you.https://app.contentful.com/deeplink?link=install-extension&url=https://github.com/contentful/extensions/blob/master/samples/build-netlify/extension.json'
    );
  });

  it('should fetch extensions if access and reaches page', () => {
    AccessCheckerMocked.getSectionVisibility.mockImplementation(() => ({ extensions: true }));
    expect.assertions(3);
    const getExtensionsForListing = jest.fn();
    useCurrentSpaceAPIClient.mockReturnValue({ client: { getExtensionsForListing } });
    render(<ExtensionsListRoute />);

    expect(go).not.toHaveBeenCalled();
    expect(getExtensionsForListing).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId(selectors.forbiddenPage)).not.toBeInTheDocument();
  });
});
