import React from 'react';
import { render, cleanup, wait, fireEvent } from '@testing-library/react';
import cfResolveResponse from 'contentful-resolve-response';

import '@testing-library/jest-dom/extend-expect';

import ReferencesTreeDialog from './index';

import {
  validateEntities,
  getDefaultLocale,
  getReferencesForEntryId,
  getEntityTitle
} from './referencesDialogService';

import { getCurrentVariation } from 'utils/LaunchDarkly';

import {
  entity,
  simpleReferencesValidationErrorResponse,
  simpleReferencesValidationSuccessResponse,
  simpleReferences
} from './__fixtures__';

jest.mock('./referencesDialogService', function() {
  return {
    getDefaultLocale: jest.fn(),
    getReferencesForEntryId: jest.fn(),
    validateEntities: jest.fn(),
    getEntityTitle: jest.fn()
  };
});

jest.mock('utils/LaunchDarkly', function() {
  return {
    getCurrentVariation: jest.fn()
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

  it('should render the toast success toast without valiation error', async () => {
    validateEntities.mockResolvedValue(simpleReferencesValidationSuccessResponse);
    const { queryAllByTestId, getByTestId } = render(<ReferencesTreeDialog entity={entity} />);

    await wait();

    fireEvent.click(getByTestId('referencesBtn'));
    await wait();

    fireEvent.click(getByTestId('validateReferencesBtn'));
    await wait();

    expect(queryAllByTestId('cf-ui-note-validation-success')).toHaveLength(1);
  });
});
