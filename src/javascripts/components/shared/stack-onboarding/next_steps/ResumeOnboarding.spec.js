import React from 'react';
import { render, screen, wait } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResumeOnboarding from './ResumeOnboarding';
import * as FakeFactory from 'test/helpers/fakeFactory';
import { trackClickCTA } from 'features/space-home';
import { getBrowserStorage } from 'core/services/BrowserStorage';
import { router } from 'core/react-routing';
import { openDeleteSpaceDialog } from 'features/space-settings';
import * as TokenStore from 'services/TokenStore';

const mockSpace = FakeFactory.Space();

jest.mock('features/space-home', () => ({
  trackClickCTA: jest.fn(),
}));

jest.mock('core/services/BrowserStorage', () => {
  const store = {
    get: jest.fn(),
  };

  return {
    getBrowserStorage: jest.fn().mockReturnValue(store),
  };
});

jest.mock('core/react-routing', () => ({
  ...jest.requireActual('core/react-routing'),
  router: {
    navigate: jest.fn(),
  },
}));

jest.mock('components/shared/auto_create_new_space/CreateModernOnboardingUtils', () => ({
  getStoragePrefix: jest.fn().mockReturnValue('prefix'),
}));

jest.mock('features/space-settings', () => ({
  openDeleteSpaceDialog: jest.fn(),
}));

jest.mock('services/TokenStore', () => ({
  getSpace: jest.fn(),
}));

describe('ResumeOnboarding', () => {
  beforeEach(() => {
    TokenStore.getSpace.mockResolvedValueOnce(mockSpace);
  });

  it('should go to the page saved in localStorage', () => {
    const storeData = {
      path: 'some.onboarding.path',
      params: {
        paramKey: 'paramValue',
      },
      someOtherKey: 'someOtherValue',
    };

    const store = getBrowserStorage();
    store.get.mockReturnValueOnce(storeData);

    build();

    userEvent.click(screen.getByTestId('resume-onboarding-cta'));

    expect(router.navigate).toBeCalledWith({
      path: storeData.path,
      ...storeData.params,
    });
  });

  it('should go to the onboarding.copy path if there is no data in localStorage', () => {
    build();

    userEvent.click(screen.getByTestId('resume-onboarding-cta'));

    expect(router.navigate).toBeCalledWith({
      path: 'spaces.detail.onboarding.copy',
      spaceId: mockSpace.sys.id,
    });
  });

  it('should track the resume onboarding CTA click event', () => {
    build();

    userEvent.click(screen.getByTestId('resume-onboarding-cta'));

    expect(trackClickCTA).toBeCalledWith('resume_onboarding:resume_deploy_button');
  });

  it('should open the delete modal when clicking on the delete space CTA', async () => {
    build();

    userEvent.click(screen.getByTestId('delete-space-cta'));

    await wait();

    expect(openDeleteSpaceDialog).toBeCalledWith({
      space: mockSpace,
      onSuccess: expect.any(Function),
    });
  });

  it('should track the delete space CTA click event', async () => {
    build();

    userEvent.click(screen.getByTestId('delete-space-cta'));

    await wait();

    expect(trackClickCTA).toBeCalledWith('resume_onboarding:delete_space');
  });
});

function build() {
  render(<ResumeOnboarding spaceId={mockSpace.sys.id} />);
}
