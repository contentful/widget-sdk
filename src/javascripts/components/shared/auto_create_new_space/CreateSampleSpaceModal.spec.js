import React from 'react';
import {
  render,
  screen,
  waitForElementToBeRemoved,
  waitFor,
  fireEvent,
} from '@testing-library/react';
import { CreateSampleSpaceModal } from './CreateSampleSpaceModal';
import { getTemplatesList } from 'services/SpaceTemplateLoader';
import { createSpaceWithTemplate } from 'app/SpaceWizards/shared/utils';
import { getSpaceProductRatePlans } from 'features/pricing-entities';
import * as logger from 'services/logger';

jest.mock('app/SpaceWizards/shared/utils', () => ({
  FREE_SPACE_IDENTIFIER: 'free_space',
  createSpaceWithTemplate: jest.fn(),
}));

jest.mock('features/pricing-entities', () => ({
  getSpaceProductRatePlans: jest.fn(),
}));

jest.mock('services/SpaceTemplateLoader', () => ({
  getTemplatesList: jest.fn(),
}));

jest.mock('services/logger', () => ({
  logException: jest.fn(),
}));

const mockPlans = [
  {
    productPlanType: 'free_space',
    name: 'Community',
  },
  {
    productPlanType: 'space',
    name: 'Medium',
  },
];

const mockTemplates = [
  {
    sys: {
      space: {
        sys: {
          type: 'Link',
          linkType: 'Space',
          id: 'l1ay9bp8gv68',
        },
      },
      type: 'Entry',
      id: '4XJoIXjr72OKKIoMKeEO8M',
      contentType: {
        sys: {
          type: 'Link',
          linkType: 'ContentType',
          id: '17WjnjeALEOeSyuiMI4QOW',
        },
      },
      revision: 1,
      createdAt: '2018-01-24T14:23:41.992Z',
      updatedAt: '2018-02-05T09:06:20.704Z',
      environment: {
        sys: {
          id: 'master',
          type: 'Link',
          linkType: 'Environment',
        },
      },
      locale: 'en-US',
    },
    name: 'The Example App',
    description:
      'This example shows best practices on how to structure your content and integrate your digital product with Contentful.\nIt comes with example apps for different platforms and content in various languages.',
    descriptionV2:
      '<p>This example shows best practices on how to structure your content and integrate your digital product with Contentful.</p>\n<p>It comes with example apps for different platforms and content in various languages.</p>',
    icon: {
      sys: {
        type: 'Link',
        linkType: 'Asset',
        id: '5m7Q31TruEAgY2Qmwcs4qa',
      },
    },
    order: 1,
    spaceId: 'qz0n5cdakyl9',
    spaceApiKey: '580d5944194846b690dd89b630a1cb98a0eef6a19b860ef71efc37ee8076ddb8',
    previewSpaceApiKey: 'e8fc39d9661c7468d0285a7ff949f7a23539dd2e686fcb7bd84dc01b392d698b',
    templateDeliveryApiKeys: [
      {
        sys: {
          type: 'Link',
          linkType: 'Entry',
          id: '3aPdX41OggAMGqMWMmqoQC',
        },
      },
    ],
    blank: false,
    image: {
      sys: {
        type: 'Link',
        linkType: 'Asset',
        id: 'iKlbjTBHs4qQWqeAE0MyC',
      },
    },
    svgName: 'spacetemplate-tea',
  },
];

const mockOrganization = {
  sys: {
    id: '123',
  },
};

const mockNewSpace = {
  name: 'The example project',
  sys: {
    id: '123',
    type: 'Space',
  },
};

function Test({
  organization = {},
  onClose = jest.fn(),
  isShown,
  onFail = jest.fn(),
  onSuccess = jest.fn(),
}) {
  return (
    <CreateSampleSpaceModal
      organization={organization}
      onClose={onClose}
      isShown={isShown}
      onFail={onFail}
      onSuccess={onSuccess}
    />
  );
}

describe('<CreateSampleSpaceModal />', () => {
  beforeEach(() => {
    getSpaceProductRatePlans.mockResolvedValue(mockPlans);
    getTemplatesList.mockResolvedValue(mockTemplates);
    createSpaceWithTemplate.mockResolvedValue(mockNewSpace);
  });

  it('should open/close the modal correctly', async () => {
    const { rerender } = render(<Test isShown={true} organization={mockOrganization} />);

    // It's opened when called
    expect(screen.queryByTestId('create-sample-space-modal')).toBeInTheDocument();

    // Close, passing a different value for isShown
    // This could come from a parent component after clicking on a button, for example
    await rerender(<Test isShown={false} />);
    await waitForElementToBeRemoved(() => screen.queryByTestId('create-sample-space-modal'));
    expect(screen.queryByTestId('create-sample-space-modal')).not.toBeInTheDocument();
  });

  it('should fail if space creation fails', async () => {
    createSpaceWithTemplate.mockImplementationOnce(() => {
      throw new Error('Failed space creation');
    });

    const onFail = jest.fn();
    render(<Test isShown={true} onFail={onFail} organization={mockOrganization} />);

    await waitFor(() => screen.queryByTestId('create-sample-space-modal'));

    expect(onFail).toHaveBeenCalled();
    expect(logger.logException).toHaveBeenCalled();
    expect(screen.queryByTestId('get-started-button')).not.toBeDisabled();
  });

  it('should call onSuccess if sample space is created', async () => {
    const onSuccess = jest.fn();
    render(<Test isShown={true} onSuccess={onSuccess} organization={mockOrganization} />);

    await waitFor(() => screen.queryByTestId('create-sample-space-modal'));

    expect(onSuccess).toHaveBeenCalledWith(mockNewSpace);
  });

  it('should be able to close the modal only when space creation is done', async () => {
    const onClose = jest.fn();
    const { container } = render(
      <Test isShown={true} organization={mockOrganization} onClose={onClose} />
    );

    expect(screen.queryByTestId('get-started-button')).toBeDisabled();

    fireEvent.keyDown(container, { key: 'Escape', code: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();

    container.click();
    expect(onClose).not.toHaveBeenCalled();

    await waitFor(() => screen.queryByTestId('create-sample-space-modal'));

    expect(screen.queryByTestId('get-started-button')).not.toBeDisabled();
    screen.queryByTestId('get-started-button').click();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
