import React from 'react';
import { render, screen } from '@testing-library/react';
import { init as initService } from './RolesForWalkMe';
import * as spaceContext from 'ng/spaceContext';
import * as $rootScope from 'ng/$rootScope';
import * as fake from 'test/helpers/fakeFactory';
import { getVariation } from 'LaunchDarkly';
import { WALK_FOR_ME as WALK_FOR_ME_FLAG } from 'featureFlags';
import * as LazyLoader from 'utils/LazyLoader';

const mockSpace = fake.Space({
  spaceMember: {
    admin: false,
    roles: [
      {
        name: 'Editor',
      },
      {
        name: 'Translator 1',
      },
    ],
  },
});

const wait = () => new Promise((resolve) => process.nextTick(resolve));

jest.mock(
  'ng/$rootScope',
  () => {
    const mock = {
      __callbacks: {},

      $on(eventName, cb) {
        if (!mock.__callbacks[eventName]) {
          mock.__callbacks[eventName] = [];
        }

        mock.__callbacks[eventName].push(cb);
      },
      __trigger$on(eventName, data) {
        if (!mock.__callbacks[eventName]) {
          return;
        }

        mock.__callbacks[eventName].forEach((cb) => cb(data));
      },
      __reset() {
        mock.__callbacks = {};
      },
    };

    return mock;
  },
  { virtual: true }
);

jest.mock(
  'ng/spaceContext',
  () => {
    const mock = {
      space: null,
      getData(path) {
        return mock.space.data[path];
      },
      __setSpace(space) {
        mock.space = space;
      },
    };

    return mock;
  },
  { virtual: true }
);

jest.mock('LaunchDarkly', () => ({
  getVariation: jest.fn().mockResolvedValue(null),
}));

jest.mock('utils/LazyLoader', () => ({
  get: jest.fn(),
}));

describe('RolesForWalkMe handler', () => {
  const mockWalkMeConfigSetter = jest.fn();

  const renderAppContainer = () => {
    render(<cf-app-container data-test-id="app-container" />);
  };

  // Setup or reset various mocks
  beforeEach(() => {
    $rootScope.__reset();

    spaceContext.__setSpace({
      data: mockSpace,
    });

    delete window.location;
    window.location = {
      reload: jest.fn(),
    };

    Object.defineProperty(window, '_walkmeConfig', {
      set: mockWalkMeConfigSetter,
    });
  });

  beforeEach(renderAppContainer);

  it('should not call LaunchDarkly if spaceContext does not have space', () => {
    spaceContext.__setSpace(null);

    initService();

    $rootScope.__trigger$on('$stateChangeSuccess');

    expect(getVariation).not.toBeCalled();
  });

  it('should attempt to get the current variation of the RolesForWalkMe feature flag', () => {
    initService();

    $rootScope.__trigger$on('$stateChangeSuccess');

    expect(getVariation).toBeCalledWith(WALK_FOR_ME_FLAG, { spaceId: mockSpace.sys.id });
  });

  it('should add various attributes on the app container and window, and get from LazyLoader if the variation is not null', async () => {
    getVariation.mockResolvedValueOnce('abcd');

    initService();

    $rootScope.__trigger$on('$stateChangeSuccess');

    await wait();

    expect(screen.getByTestId('app-container')).toHaveAttribute(
      'data-space-role-is-admin',
      JSON.stringify(false)
    );
    expect(screen.getByTestId('app-container')).toHaveAttribute(
      'data-space-role-names',
      JSON.stringify(mockSpace.spaceMember.roles.map(({ name }) => name).join(','))
    );

    expect(mockWalkMeConfigSetter).toBeCalledWith({ smartLoad: true });
    expect(LazyLoader.get).toBeCalledWith('abcd');
  });

  it('should attempt to reload if a different variation than the current one is given', async () => {
    getVariation.mockResolvedValueOnce('abcd');

    initService();

    $rootScope.__trigger$on('$stateChangeSuccess');

    await wait();

    expect(window.location.reload).not.toBeCalled();

    getVariation.mockResolvedValueOnce('xyz');

    $rootScope.__trigger$on('$stateChangeSuccess');

    await wait();

    expect(window.location.reload).toBeCalled();
  });

  it('should not do anything if both variation and lastVariation are null', async () => {
    initService();

    $rootScope.__trigger$on('$stateChangeSuccess');

    await wait();

    expect(window.location.reload).not.toBeCalled();
    expect(screen.getByTestId('app-container')).not.toHaveAttribute('data-space-role-is-admin');
    expect(screen.getByTestId('app-container')).not.toHaveAttribute('data-space-role-names');
    expect(mockWalkMeConfigSetter).not.toBeCalled();
    expect(LazyLoader.get).not.toBeCalled();
  });
});
