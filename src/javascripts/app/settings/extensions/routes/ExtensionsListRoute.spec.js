import React from 'react';
import Enzyme from 'enzyme';
import 'jest-enzyme';
import * as spaceContextMocked from 'ng/spaceContext';
import * as $stateMocked from 'ng/$state';
import ExtensionsListRoute from './ExtensionsListRoute';
import ForbiddenPage from 'ui/Pages/Forbidden/ForbiddenPage';
import * as AccessCheckerMocked from 'access_control/AccessChecker';

jest.mock('access_control/AccessChecker', () => ({
  getSectionVisibility: jest.fn(() => {}),
}));

describe('ExtensionsListRoute', () => {
  beforeEach(() => {
    $stateMocked.go.mockClear();
    spaceContextMocked.getData.mockReset();
    AccessCheckerMocked.getSectionVisibility.mockReset();
  });

  const selectors = {
    forbiddenPage: '[data-test-id="extensions.forbidden"]',
  };

  it('should render Forbidden page when no access', () => {
    AccessCheckerMocked.getSectionVisibility.mockImplementation(() => ({ extensions: false }));
    const wrapper = Enzyme.mount(
      <ExtensionsListRoute cma={{ getExtensionsForListing: () => {} }} />
    );
    expect(wrapper.find(ForbiddenPage)).toExist();
  });

  it('should show ExtensionsForbiddenPage if no access and reaches page via deeplink extensionUrl', () => {
    AccessCheckerMocked.getSectionVisibility.mockImplementation(() => ({ extensions: false }));
    expect.assertions(4);
    const getExtensionsForListing = jest.fn();
    const wrapper = Enzyme.mount(
      <ExtensionsListRoute
        cma={{ getExtensionsForListing }}
        extensionUrl="https://github.com/contentful/extensions/blob/master/samples/build-netlify/extension.json"
      />
    );

    expect($stateMocked.go).not.toHaveBeenCalled();
    expect(getExtensionsForListing).not.toHaveBeenCalled();
    expect(wrapper.find(selectors.forbiddenPage)).toExist();

    expect(wrapper.find('.workbench-forbidden__message').last().text()).toEqual(
      'Share this URL with your admin so they can install it for you.https://app.contentful.com/deeplink?link=install-extension&url=https://github.com/contentful/extensions/blob/master/samples/build-netlify/extension.json'
    );
  });

  it('should fetch extensions if access and  reaches page', () => {
    AccessCheckerMocked.getSectionVisibility.mockImplementation(() => ({ extensions: true }));
    expect.assertions(3);
    const getExtensionsForListing = jest.fn();
    const wrapper = Enzyme.mount(<ExtensionsListRoute cma={{ getExtensionsForListing }} />);

    expect($stateMocked.go).not.toHaveBeenCalled();
    expect(getExtensionsForListing).toHaveBeenCalledTimes(1);
    expect(wrapper.find(selectors.forbiddenPage)).not.toExist();
  });
});
