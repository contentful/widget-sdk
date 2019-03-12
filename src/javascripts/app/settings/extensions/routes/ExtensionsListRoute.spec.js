import React from 'react';
import Enzyme from 'enzyme';
import * as spaceContextMocked from 'ng/spaceContext';
import * as $stateMocked from 'ng/$state';
// import ExtensionsListRoute from './ExtensionsListRoute.es6';
// FIXME: mock 'global/window' somehow
const ExtensionsListRoute = undefined;

describe.skip('ExtensionsListRoute', () => {
  beforeEach(() => {
    $stateMocked.go.mockClear();
    spaceContextMocked.getData.mockReset();
  });

  const setAdmin = isAdmin => {
    spaceContextMocked.getData.mockImplementation(name => {
      if (name === 'spaceMembership.admin') {
        return isAdmin;
      }
    });
  };

  const selectors = {
    forbiddenPage: '[data-test-id="extensions.forbidden"]'
  };

  it('should be resticted for non-admins and redirect should be called', () => {
    expect.assertions(3);
    setAdmin(false);
    Enzyme.mount(<ExtensionsListRoute cma={{ getExtensions: () => {} }} />);
    expect($stateMocked.go).toHaveBeenCalledTimes(1);
    expect($stateMocked.go).toHaveBeenCalledWith(
      'spaces.detail.entries.list',
      undefined,
      undefined
    );
    expect(spaceContextMocked.cma.getExtensions).not.toHaveBeenCalled();
  });

  it('should show ExtensionsForbiddenPage if non-admin reaches page via deeplink extensionUrl', () => {
    expect.assertions(4);
    setAdmin(false);
    const getExtensions = jest.fn();
    const wrapper = Enzyme.mount(
      <ExtensionsListRoute
        cma={{ getExtensions }}
        extensionUrl="https://github.com/contentful/extensions/blob/master/samples/build-netlify/extension.json"
      />
    );
    expect($stateMocked.go).not.toHaveBeenCalled();
    expect(getExtensions).not.toHaveBeenCalled();
    expect(wrapper.find(selectors.forbiddenPage)).toExist();

    expect(
      wrapper
        .find('.workbench-forbidden__message')
        .last()
        .text()
    ).toEqual(
      'Share this URL with your admin so they can install it for you.https://app.contentful.com/deeplink?link=install-extension&url=https://github.com/contentful/extensions/blob/master/samples/build-netlify/extension.json'
    );
  });

  it('should fetch extensions if admin reaches that page', () => {
    expect.assertions(3);
    setAdmin(true);
    const getExtensions = jest.fn();
    const wrapper = Enzyme.mount(<ExtensionsListRoute cma={{ getExtensions }} />);
    expect($stateMocked.go).not.toHaveBeenCalled();
    expect(getExtensions).toHaveBeenCalledTimes(1);
    expect(wrapper.find(selectors.forbiddenPage)).not.toExist();
  });
});
