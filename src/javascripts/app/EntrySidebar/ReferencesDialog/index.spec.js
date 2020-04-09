import React from 'react';
import { render, cleanup, wait, fireEvent } from '@testing-library/react';
import cfResolveResponse from 'contentful-resolve-response';

import '@testing-library/jest-dom/extend-expect';

import ReferencesTreeDialog from './index';

import {
  validateEntities,
  publishEntities,
  getDefaultLocale,
  getReferencesForEntryId,
  getEntityTitle,
} from './referencesDialogService';

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

jest.mock('./referencesDialogService', function () {
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

  beforeEach(() => {
    getDefaultLocale.mockReturnValue('en-US');
    getReferencesForEntryId.mockResolvedValue(cfResolveResponse(simpleReferences));
    getCurrentVariation.mockResolvedValue(true);
    getEntityTitle.mockResolvedValue('Title');
  });

  it('should not render the references button if there are no references', async () => {
    validateEntities.mockResolvedValue(simpleReferencesValidationErrorResponse);
    const renderResult = render(<ReferencesTreeDialog entity={entityWithNoRefs} />);
    await wait();
    expect(renderResult).not.toBeNull();
  });

  it('should render the error toast with valiation error', async () => {
    validateEntities.mockResolvedValue(simpleReferencesValidationErrorResponse);
    const { queryAllByTestId, getByTestId } = render(<ReferencesTreeDialog entity={entity} />);

    await wait();

    fireEvent.click(getByTestId('referencesBtn'));
    await wait();

    fireEvent.click(getByTestId('validateReferencesBtn'));
    await wait();

    expect(queryAllByTestId('cf-ui-note-validation-failed')).toHaveLength(1);
  });

  it('should render the success toast without valiation error', async () => {
    validateEntities.mockResolvedValue(simpleReferencesValidationSuccessResponse);
    const { queryAllByTestId, getByTestId } = render(<ReferencesTreeDialog entity={entity} />);

    await wait();

    fireEvent.click(getByTestId('referencesBtn'));
    await wait();

    fireEvent.click(getByTestId('validateReferencesBtn'));
    await wait();

    expect(queryAllByTestId('cf-ui-note-validation-success')).toHaveLength(1);
  });

  it('should render the success toast after publication', async () => {
    publishEntities.mockResolvedValue(simpleReferencesPublicationSuccessResponse);

    const { queryAllByTestId, getByTestId } = render(<ReferencesTreeDialog entity={entity} />);

    await wait();

    fireEvent.click(getByTestId('referencesBtn'));
    await wait();

    fireEvent.click(getByTestId('publishReferencesBtn'));
    await wait();

    expect(queryAllByTestId('cf-ui-note-publication-success')).toHaveLength(1);
  });

  it('should render the failed toast after failed publication', async () => {
    publishEntities.mockRejectedValue({ statusCode: 400 });

    const { queryAllByTestId, getByTestId } = render(<ReferencesTreeDialog entity={entity} />);

    await wait();

    fireEvent.click(getByTestId('referencesBtn'));
    await wait();

    fireEvent.click(getByTestId('publishReferencesBtn'));
    await wait();

    expect(queryAllByTestId('cf-ui-note-publication-failed')).toHaveLength(1);
  });

  it('should render the validation toast after pubshing invalid state', async () => {
    publishEntities.mockRejectedValue({
      statusCode: 422,
      data: simpleReferencesPublicationInvalidErrorResponse,
    });

    const { queryAllByTestId, getByTestId } = render(<ReferencesTreeDialog entity={entity} />);

    await wait();

    fireEvent.click(getByTestId('referencesBtn'));
    await wait();

    fireEvent.click(getByTestId('publishReferencesBtn'));
    await wait();

    expect(queryAllByTestId('cf-ui-note-validation-failed')).toHaveLength(1);
  });
});
