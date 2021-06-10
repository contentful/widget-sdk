import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { FlexibleOnboardingDialog } from './FlexibleOnboardingDialog';
import userEvent from '@testing-library/user-event';
import { track } from 'analytics/Analytics';
import { Choices } from './DeveloperChoiceDialog';
import {
  BLANK_SPACE_NAME,
  renameSpace,
  markExploreOnboardingSeen,
} from 'features/onboarding/utils/util';
import { getSpace } from 'services/TokenStore';
import * as fake from 'test/helpers/fakeFactory';
import {
  markSpace,
  unmarkSpace,
} from 'components/shared/auto_create_new_space/CreateModernOnboardingUtils';

const mockOnClose = jest.fn();
const mockSpace = fake.Space();

jest.mock('analytics/Analytics', () => ({
  track: jest.fn(),
}));

jest.mock('components/shared/auto_create_new_space/CreateModernOnboardingUtils', () => ({
  markSpace: jest.fn(),
  unmarkSpace: jest.fn(),
}));

jest.mock('features/onboarding/utils/util', () => ({
  markExploreOnboardingSeen: jest.fn(),
  getStoragePrefix: jest.fn(),
  renameSpace: jest.fn(),
}));

jest.mock('services/TokenStore', () => ({
  getUser: jest.fn().mockReturnValue({
    sys: { id: 'mockUser' },
  }),
  getSpace: jest.fn(),
  refresh: () => jest.fn(),
}));

jest.mock('features/space-purchase', () => ({
  applyTemplateToSpace: jest.fn(),
}));

describe('FlexibleOnboardingDialog', () => {
  const build = (props?: any) => {
    render(
      <FlexibleOnboardingDialog
        isShown={true}
        onClose={mockOnClose}
        spaceId={mockSpace.sys.id}
        {...props}
      />
    );
    return waitFor(() => expect(screen.getByTestId('flexible-onboarding-modal')).toBeVisible());
  };

  beforeEach(() => {
    (getSpace as jest.Mock).mockReturnValue(mockSpace);
    (renameSpace as jest.Mock).mockReturnValue(mockSpace);
  });

  it('render developer choice dialog as first screen', async () => {
    await build();
    expect(screen.getByTestId('developer-choice-modal')).toBeVisible();
  });

  it('should close and rename space on blank space option', async () => {
    await build();
    userEvent.click(screen.getByTestId(Choices.EMPTY_SPACE_OPTION));
    await userEvent.click(screen.getByTestId('continue-btn'));
    expect(track).toHaveBeenCalledWith('onboarding_explore:continue', {
      flow: Choices.EMPTY_SPACE_OPTION,
    });
    expect(mockOnClose).toHaveBeenCalled();
    expect(markExploreOnboardingSeen).toHaveBeenCalled();
    expect(unmarkSpace).toHaveBeenCalled();
    expect(renameSpace).toHaveBeenCalledWith(BLANK_SPACE_NAME, mockSpace.sys.id);
  });

  it('should show template choice screen on prebuild space option', async () => {
    await build();
    userEvent.click(screen.getByTestId(Choices.SAMPLE_SPACE_OPTION));
    await userEvent.click(screen.getByTestId('continue-btn'));
    expect(track).toHaveBeenCalledWith('onboarding_explore:continue', {
      flow: Choices.SAMPLE_SPACE_OPTION,
    });
    expect(screen.getByTestId('sample-space-dialog')).toBeVisible();
  });

  it('should show start blog onboarding flow on code option', async () => {
    await build();
    userEvent.click(screen.getByTestId(Choices.GATSBY_BLOG_OPTION));
    await userEvent.click(screen.getByTestId('continue-btn'));
    expect(track).toHaveBeenCalledWith('onboarding_explore:continue', {
      flow: Choices.GATSBY_BLOG_OPTION,
    });
    expect(mockOnClose).toHaveBeenCalled();
    expect(markSpace).toHaveBeenCalledWith(mockSpace.sys.id);
  });

  it('should show replace space warning if replaceSpace is true', async () => {
    await build({ replaceSpace: true });
    userEvent.click(screen.getByTestId(Choices.EMPTY_SPACE_OPTION));
    await userEvent.click(screen.getByTestId('continue-btn'));
    expect(track).toHaveBeenCalledWith('onboarding_explore:continue', {
      flow: Choices.EMPTY_SPACE_OPTION,
    });
    expect(screen.getByTestId('replace-space-dialog')).toBeVisible();
  });
});
