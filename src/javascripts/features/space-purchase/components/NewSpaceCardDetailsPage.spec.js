import React from 'react';
import { render, waitFor, screen, fireEvent } from '@testing-library/react';
import * as Fake from 'test/helpers/fakeFactory';

import * as LazyLoader from 'utils/LazyLoader';

import { NewSpaceCardDetailsPage } from './NewSpaceCardDetailsPage';

const mockOrganization = Fake.Organization();

jest.mock('utils/LazyLoader', () => {
  const results = {
    Zuora: {
      render: jest.fn(),
      runAfterRender: jest.fn((cb) => cb()),
    },
  };

  return {
    _results: results,
    get: jest.fn().mockImplementation((key) => results[key]),
  };
});

describe('NewSpaceCardDetailsPage', () => {
  it('should call navigateToPreviousStep if the back button is clicked', async () => {
    const navigateToPreviousStep = jest.fn();

    await build({ navigateToPreviousStep });

    fireEvent.click(screen.getByTestId('navigate-back'));

    expect(navigateToPreviousStep).toBeCalled();
  });

  it('should call onSuccess if the Zuora response callback is called', async () => {
    const onSuccess = jest.fn();

    const responseCb = await build({ onSuccess });

    expect(onSuccess).not.toBeCalled();

    responseCb();

    expect(onSuccess).toBeCalled();
  });

  it('should notify the user something went wrong if onSuccess fails', async () => {
    const onSuccess = jest.fn().mockRejectedValueOnce();

    const responseCb = await build({ onSuccess });

    expect(onSuccess).not.toBeCalled();

    responseCb();

    expect(onSuccess).toBeCalled();

    await waitFor(() => {
      expect(
        screen.getByText('Your credit card couldn’t be saved. Please try again.')
      ).toBeVisible();
    });
  });
});

async function build(customProps) {
  const { Zuora } = LazyLoader._results;

  let responseCb;

  Zuora.render.mockImplementationOnce(
    (_params, _prefilledFields, cb) => (responseCb = () => cb({ success: true, refId: 'ref_1234' }))
  );

  const props = Object.assign(
    {
      organizationId: mockOrganization.sys.id,
      billingCountryCode: 'CX',
      selectedPlan: {},
      navigateToPreviousStep: () => {},
      onSuccess: () => {},
    },
    customProps
  );

  render(<NewSpaceCardDetailsPage {...props} />);

  await waitFor(() => expect(Zuora.render).toBeCalled());

  return responseCb;
}
