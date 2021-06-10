import React from 'react';
import { render, wait } from '@testing-library/react';
import cfResolveResponse from 'contentful-resolve-response';

import '@testing-library/jest-dom/extend-expect';

import { ReferencesContext } from './ReferencesContext';
import ReferencesTree, { hasLinks } from './index';

import { getDefaultLocale, getReferencesForEntryId, getEntityTitle } from './referencesService';

import { entityWithNoRefs, simpleReferences } from './__fixtures__';

jest.mock('access_control/EntityPermissions', () => ({
  create: () => ({
    can: jest.fn().mockReturnValue(true),
  }),
}));

jest.mock('./referencesService', function () {
  return {
    getDefaultLocale: jest.fn(),
    getReferencesForEntryId: jest.fn(),
    publishEntities: jest.fn(),
    getEntityTitle: jest.fn(),
  };
});

jest.mock('../../Releases/releasesService', function () {
  return {
    getReleases: jest.fn(),
  };
});

const MockPovider = ({ children, dispatch }) => (
  <ReferencesContext.Provider value={{ state: {}, dispatch }}>
    {children}
  </ReferencesContext.Provider>
);

MockPovider.defaultProps = {
  dispatch: () => {},
};

describe('ReferencesTree component', () => {
  beforeEach(async () => {
    getDefaultLocale.mockReturnValue('en-US');
    getReferencesForEntryId.mockResolvedValue({
      resolved: cfResolveResponse(simpleReferences),
      response: simpleReferences,
    });
    getEntityTitle.mockResolvedValue('Title');
  });

  it('should not render the references tree if there are no references', async () => {
    const renderResult = render(
      <MockPovider>
        <ReferencesTree entity={entityWithNoRefs} />
      </MockPovider>
    );
    await wait();
    expect(renderResult).not.toBeNull();
  });
});

describe('validating hasLinks', () => {
  it('should avoid null locales', () => {
    expect(hasLinks({ cpeq: { 'en-US': null } })).toBeFalsy();
  });
});
