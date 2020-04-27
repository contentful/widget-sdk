import React from 'react';
import { render, within, cleanup, wait, fireEvent } from '@testing-library/react';
import cfResolveResponse from 'contentful-resolve-response';
import { Notification } from '@contentful/forma-36-react-components';

import '@testing-library/jest-dom/extend-expect';

import ReferencesTree from './index';

import {
  validateEntities,
  publishEntities,
  getDefaultLocale,
  getReferencesForEntryId,
  getEntityTitle,
} from './referencesService';

import { getCurrentVariation } from 'utils/LaunchDarkly';

import {
  entity,
  entityWithNoRefs,
  simpleReferencesValidationErrorResponse,
  simpleReferencesValidationSuccessResponse,
  simpleReferencesPublicationSuccessResponse,
  simpleReferencesPublicationInvalidErrorResponse,
  simpleReferences,
} from './__fixtures__';

jest.mock('access_control/EntityPermissions', () => ({
  create: () => ({
    can: jest.fn().mockReturnValue(true),
  }),
}));

jest.mock('./referencesService', function () {
  return {
    getDefaultLocale: jest.fn(),
    getReferencesForEntryId: jest.fn(),
    validateEntities: jest.fn(),
    publishEntities: jest.fn(),
    getEntityTitle: jest.fn(),
  };
});

jest.mock('utils/LaunchDarkly', function () {
  return {
    getCurrentVariation: jest.fn(),
  };
});

describe('ReferencesTree component', () => {
  afterEach(cleanup);

  beforeEach(async () => {
    jest.spyOn(Notification, 'success').mockImplementation(() => {});
    jest.spyOn(Notification, 'error').mockImplementation(() => {});

    getDefaultLocale.mockReturnValue('en-US');
    getReferencesForEntryId.mockResolvedValue({
      resolved: cfResolveResponse(simpleReferences),
      response: simpleReferences,
    });
    getCurrentVariation.mockResolvedValue(true);
    getEntityTitle.mockResolvedValue('Title');
  });

  it('should not render the references button if there are no references', async () => {
    validateEntities.mockResolvedValue(simpleReferencesValidationErrorResponse);
    const renderResult = render(<ReferencesTree entity={entityWithNoRefs} />);
    await wait();
    expect(renderResult).not.toBeNull();
  });

  it('should render the error notification with valiation error', async () => {
    validateEntities.mockResolvedValue(simpleReferencesValidationErrorResponse);
    const { getByTestId } = render(<ReferencesTree entity={entity} />);
    await wait();

    fireEvent.click(getByTestId('referencesActionDropdown'));
    await wait();

    fireEvent.click(
      within(getByTestId('validateReferencesBtn')).getByTestId('cf-ui-dropdown-list-item-button')
    );
    await wait();

    expect(Notification.error).toHaveBeenCalledWith('Some references did not pass validation');
  });

  it('should render the success notification without valiation error', async () => {
    validateEntities.mockResolvedValue(simpleReferencesValidationSuccessResponse);
    const { getByTestId } = render(<ReferencesTree entity={entity} />);

    await wait();

    fireEvent.click(getByTestId('referencesActionDropdown'));
    await wait();

    fireEvent.click(
      within(getByTestId('validateReferencesBtn')).getByTestId('cf-ui-dropdown-list-item-button')
    );
    await wait();

    expect(Notification.success).toHaveBeenCalledWith('All references passed validation');
  });

  it('should render the success notification after publication', async () => {
    publishEntities.mockResolvedValue(simpleReferencesPublicationSuccessResponse);

    const { getByTestId } = render(<ReferencesTree entity={entity} />);
    await wait();

    fireEvent.click(getByTestId('referencesActionDropdown'));
    await wait();

    fireEvent.click(
      within(getByTestId('publishReferencesBtn')).getByTestId('cf-ui-dropdown-list-item-button')
    );
    await wait();

    expect(Notification.success).toHaveBeenCalledWith('Title was published successfully');
  });

  it('should render the failed notification after failed publication', async () => {
    publishEntities.mockRejectedValue({ statusCode: 400 });

    const { getByTestId } = render(<ReferencesTree entity={entity} />);

    await wait();

    fireEvent.click(getByTestId('referencesActionDropdown'));
    await wait();

    fireEvent.click(
      within(getByTestId('publishReferencesBtn')).getByTestId('cf-ui-dropdown-list-item-button')
    );
    await wait();

    expect(Notification.error).toHaveBeenCalledWith('We were unable to publish Title');
  });

  it('should render the validation toast after pubshing invalid state', async () => {
    publishEntities.mockRejectedValue({
      statusCode: 422,
      data: simpleReferencesPublicationInvalidErrorResponse,
    });

    const { getByTestId } = render(<ReferencesTree entity={entity} />);

    await wait();

    fireEvent.click(getByTestId('referencesActionDropdown'));
    await wait();

    fireEvent.click(
      within(getByTestId('publishReferencesBtn')).getByTestId('cf-ui-dropdown-list-item-button')
    );
    await wait();

    expect(Notification.error).toHaveBeenCalledWith('Some references did not pass validation');
  });

  it('should unselect all references and disable the actions', async () => {
    publishEntities.mockResolvedValue(simpleReferencesPublicationSuccessResponse);
    const { getByTestId } = render(<ReferencesTree entity={entity} />);
    await wait();

    fireEvent.click(getByTestId('selectAllReferences'));
    await wait();

    expect(getByTestId('referencesActionDropdown')).toBeDisabled();
  });

  it('should unselect all then select the first entry and publish it', async () => {
    publishEntities.mockResolvedValue(simpleReferencesPublicationSuccessResponse);
    const { getByTestId } = render(<ReferencesTree entity={entity} />);
    await wait();

    fireEvent.click(getByTestId('selectAllReferences'));
    await wait();

    fireEvent.click(within(getByTestId('referenceTreeList')).getByTestId('ctf-ui-checkbox'));
    await wait();

    expect(getByTestId('referencesActionDropdown')).toBeEnabled();

    fireEvent.click(getByTestId('referencesActionDropdown'));
    await wait();

    fireEvent.click(
      within(getByTestId('publishReferencesBtn')).getByTestId('cf-ui-dropdown-list-item-button')
    );
    await wait();

    expect(Notification.success).toHaveBeenCalledWith('Title was published successfully');
  });
});
