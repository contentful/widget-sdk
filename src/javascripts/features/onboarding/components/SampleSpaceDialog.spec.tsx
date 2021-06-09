import React from 'react';
import { render, screen, waitForElementToBeRemoved } from '@testing-library/react';
import { SampleSpaceDialog } from './SampleSpaceDialog';
import userEvent from '@testing-library/user-event';
import { track } from 'analytics/Analytics';
import * as fake from 'test/helpers/fakeFactory';
import { applyTemplateToSpace } from 'features/space-purchase';
import { getTemplatesList } from 'services/SpaceTemplateLoader';
import { getSpace } from 'services/TokenStore';

const mockFn = jest.fn();
const mockSpace = fake.Space();

const mockTemplate = {
  name: 'Awesome template',
  sys: {
    id: 'template_1234',
  },
};

jest.mock('features/space-purchase', () => ({
  applyTemplateToSpace: jest.fn(),
}));

jest.mock('features/onboarding', () => ({
  markExploreOnboardingSeen: jest.fn(),
  getStoragePrefix: jest.fn(),
}));

jest.mock('analytics/Analytics', () => ({
  track: jest.fn(),
}));

jest.mock('services/TokenStore', () => ({
  getUser: jest.fn().mockReturnValue({
    sys: { id: 'mockUser' },
  }),
  getSpace: jest.fn(),
  refresh: () => jest.fn(),
}));

jest.mock('services/SpaceTemplateLoader', () => ({
  getTemplatesList: jest.fn().mockReturnValue([]),
}));

describe('SampleSpaceDialog', () => {
  beforeEach(() => {
    (getTemplatesList as jest.Mock).mockReturnValue([mockTemplate]);
    (getSpace as jest.Mock).mockReturnValue(mockSpace);
  });

  const build = (props?: any) => {
    render(
      <SampleSpaceDialog
        isShown={true}
        onClose={mockFn}
        onBack={mockFn}
        spaceId={mockSpace.sys.id}
        {...props}
      />
    );
    return waitForElementToBeRemoved(() => screen.getAllByTestId('cf-ui-skeleton-form'));
  };

  it('render templates choice dialog', async () => {
    await build();
    expect(screen.getByTestId('template-list-wrapper')).toBeVisible();
  });

  it('should apply template on continue click', async () => {
    await build();
    await userEvent.click(screen.getByTestId('continue-btn'));
    expect(track).toHaveBeenCalledWith('onboarding_sample_space:continue', {
      templateName: `${mockTemplate.name}`,
    });
    expect(applyTemplateToSpace).toHaveBeenCalledWith(mockSpace, mockTemplate);
  });

  it('should show replace screen warning on continue click if replaceScreen arg is true', async () => {
    await build({ replaceSpace: true });
    await userEvent.click(screen.getByTestId('continue-btn'));
    expect(track).toHaveBeenCalledWith('onboarding_sample_space:continue', {
      templateName: `${mockTemplate.name}`,
    });
    expect(screen.getByTestId('replace-space-dialog')).toBeVisible();
  });
});
