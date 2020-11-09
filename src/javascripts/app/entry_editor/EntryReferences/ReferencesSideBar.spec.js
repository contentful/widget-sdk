import React from 'react';
import { render, waitFor, fireEvent, act } from '@testing-library/react';
import cfResolveResponse from 'contentful-resolve-response';
import { Notification } from '@contentful/forma-36-react-components';

import '@testing-library/jest-dom/extend-expect';

import { ReferencesContext } from './ReferencesContext';
import ReferencesSideBar from './ReferencesSideBar';

import { validateEntities, publishEntities, getReferencesForEntryId } from './referencesService';

import { getReleases } from '../../Releases/releasesService';

import {
  entity,
  simpleReferences,
  arrayOfReferences,
  simpleReferencesValidationErrorResponse,
  simpleReferencesValidationSuccessResponse,
  simpleReferencesPublicationSuccessResponse,
  simpleReferencesPublicationInvalidErrorResponse,
} from './__fixtures__';

import { releases } from '../../Releases/__fixtures__';

jest.mock('access_control/EntityPermissions', () => ({
  create: () => ({
    can: jest.fn().mockReturnValue(true),
  }),
}));

jest.mock('./referencesService', function () {
  return {
    getReferencesForEntryId: jest.fn(),
    validateEntities: jest.fn(),
    publishEntities: jest.fn(),
  };
});

jest.mock('../../Releases/releasesService', function () {
  return {
    getReleases: jest.fn(),
  };
});

jest.mock('detect-browser', () => ({
  detect: jest.fn().mockReturnValue({ name: 'chrome' }),
}));

jest.mock('app/Releases/ReleasesFeatureFlag', () => ({
  getReleasesFeatureVariation: jest.fn().mockResolvedValue(true),
}));

const MockPovider = ({ children, references, selectedEntities, dispatch }) => (
  <ReferencesContext.Provider value={{ state: { references, selectedEntities }, dispatch }}>
    {children}
  </ReferencesContext.Provider>
);

MockPovider.defaultProps = {
  dispatch: () => {},
};

describe('ReferencesSideBar component', () => {
  beforeEach(async () => {
    jest.spyOn(Notification, 'success').mockImplementation(() => {});
    jest.spyOn(Notification, 'error').mockImplementation(() => {});

    getReleases.mockResolvedValue({ items: releases });
    getReferencesForEntryId.mockResolvedValue({
      resolved: cfResolveResponse(simpleReferences),
      response: simpleReferences,
    });
  });

  it('should render the error notification with validation error', async () => {
    validateEntities.mockResolvedValue(simpleReferencesValidationErrorResponse);
    const response = cfResolveResponse(simpleReferences);
    const selectedEntities = cfResolveResponse(arrayOfReferences);
    const { getByTestId } = render(
      <MockPovider references={response} selectedEntities={selectedEntities}>
        <ReferencesSideBar entityTitle="Title" entity={entity} />
      </MockPovider>
    );

    await waitFor(() => getByTestId);

    act(() => {
      fireEvent.click(getByTestId('validateReferencesBtn'));
    });

    await waitFor(() => {
      expect(Notification.error).toHaveBeenCalledWith('Some references did not pass validation');
    });
  });

  it('should render the success notification without validation error', async () => {
    validateEntities.mockResolvedValue(simpleReferencesValidationSuccessResponse);
    const response = cfResolveResponse(simpleReferences);
    const selectedEntities = cfResolveResponse(arrayOfReferences);
    const { getByTestId } = render(
      <MockPovider references={response} selectedEntities={selectedEntities}>
        <ReferencesSideBar entityTitle="Title" entity={entity} />
      </MockPovider>
    );

    await waitFor(() => getByTestId);

    act(() => {
      fireEvent.click(getByTestId('validateReferencesBtn'));
    });

    await waitFor(() => {
      expect(Notification.success).toHaveBeenCalledWith('All references passed validation');
    });
  });

  it('should render the success notification after publication', async () => {
    publishEntities.mockResolvedValue(simpleReferencesPublicationSuccessResponse);

    const response = cfResolveResponse(simpleReferences);
    const selectedEntities = cfResolveResponse(arrayOfReferences);
    const { getByTestId } = render(
      <MockPovider references={response} selectedEntities={selectedEntities}>
        <ReferencesSideBar entityTitle="Title" entity={entity} />
      </MockPovider>
    );

    await waitFor(() => getByTestId);

    act(() => {
      fireEvent.click(getByTestId('publishReferencesBtn'));
    });

    await waitFor(() => {
      expect(Notification.success).toHaveBeenCalledWith('Title was published successfully');
    });
  });

  it('should render the failed notification after failed publication', async () => {
    publishEntities.mockRejectedValue({ statusCode: 400 });

    const response = cfResolveResponse(simpleReferences);
    const selectedEntities = cfResolveResponse(arrayOfReferences);
    const { getByTestId } = render(
      <MockPovider references={response} selectedEntities={selectedEntities}>
        <ReferencesSideBar entityTitle="Title" entity={entity} />
      </MockPovider>
    );

    await waitFor(() => getByTestId);

    act(() => {
      fireEvent.click(getByTestId('publishReferencesBtn'));
    });

    await waitFor(() => {
      expect(Notification.error).toHaveBeenCalledWith('We were unable to publish Title');
    });
  });

  it('should render the validation toast after publishing invalid state', async () => {
    publishEntities.mockRejectedValue({
      statusCode: 422,
      data: simpleReferencesPublicationInvalidErrorResponse,
    });

    const response = cfResolveResponse(simpleReferences);
    const selectedEntities = cfResolveResponse(arrayOfReferences);
    const { getByTestId } = render(
      <MockPovider references={response} selectedEntities={selectedEntities}>
        <ReferencesSideBar entityTitle="Title" entity={entity} />
      </MockPovider>
    );

    await waitFor(() => getByTestId);

    act(() => {
      fireEvent.click(getByTestId('publishReferencesBtn'));
    });

    await waitFor(() => {
      expect(Notification.error).toHaveBeenCalledWith('Some references did not pass validation');
    });
  });

  it('should disable the buttons when there are no references', async () => {
    const { getByTestId } = render(
      <MockPovider references={[]} selectedEntities={[]}>
        <ReferencesSideBar entityTitle="Title" entity={entity} />
      </MockPovider>
    );

    await waitFor(() => getByTestId);

    await waitFor(() => {
      expect(getByTestId('publishReferencesBtn')).toBeDisabled();
      expect(getByTestId('validateReferencesBtn')).toBeDisabled();
      expect(getByTestId('addReferencesToReleaseBtn')).toBeDisabled();
    });
  });

  it('should disable the buttons when there are no selected entities', async () => {
    const response = cfResolveResponse(simpleReferences);
    const { getByTestId } = render(
      <MockPovider references={response} selectedEntities={[]}>
        <ReferencesSideBar entityTitle="Title" entity={entity} />
      </MockPovider>
    );

    await waitFor(() => getByTestId);

    await waitFor(() => {
      expect(getByTestId('publishReferencesBtn')).toBeDisabled();
      expect(getByTestId('validateReferencesBtn')).toBeDisabled();
      expect(getByTestId('addReferencesToReleaseBtn')).toBeDisabled();
    });
  });

  it('should render the release dialog when add to release button is clicked', async () => {
    const response = cfResolveResponse(simpleReferences);
    const selectedEntities = cfResolveResponse(arrayOfReferences);

    const { getByTestId } = render(
      <MockPovider references={response} selectedEntities={selectedEntities}>
        <ReferencesSideBar entityTitle="Title" entity={entity} />
      </MockPovider>
    );

    await waitFor(() => getByTestId);

    act(() => {
      fireEvent.click(getByTestId('addReferencesToReleaseBtn'));
    });

    await waitFor(() => {
      expect(getByTestId('content-release-modal')).toBeInTheDocument();
    });
  });

  it('should disable the buttons when selected entities are more than 200', async () => {
    const response = cfResolveResponse(simpleReferences);
    const selectedEntitiesArray = [...Array(201).fill(simpleReferences.items[0])];
    const { getByTestId } = render(
      <MockPovider references={response} selectedEntities={selectedEntitiesArray}>
        <ReferencesSideBar entityTitle="Title" entity={entity} />
      </MockPovider>
    );

    await waitFor(() => getByTestId);

    await waitFor(() => {
      expect(getByTestId('publishReferencesBtn')).toBeDisabled();
      expect(getByTestId('validateReferencesBtn')).toBeDisabled();
      expect(getByTestId('addReferencesToReleaseBtn')).toBeDisabled();
      expect(getByTestId('cf-ui-note-reference-limit')).toBeInTheDocument();
    });
  });
});
