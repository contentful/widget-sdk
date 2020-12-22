import React from 'react';
import { render, wait, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import resolveResponse from 'contentful-resolve-response';
import { ReferencesContext } from './ReferencesContext';
import {
  SET_SELECTED_ENTITIES,
  SET_SELECTED_ENTITIES_MAP,
  SET_ACTIONS_DISABLED,
  SET_INITIAL_REFERENCES_AMOUNT,
  SET_INITIAL_UNIQUE_REFERENCES_AMOUNT,
  SET_IS_SLICED,
} from './state/actions';

import {
  simpleReferences,
  arrayOfReferences,
  nestedSimpleReferences,
  nestedArrayOfReferences,
  richTextSimpleReferences,
  richTextEmbeddedInlineEntryReferences,
  richTextHyperlinkReference,
  circularReferences,
  depthLimit,
  unresolvedReferences,
  simpleReferencesValidationErrorResponse,
  rootReferencesValidationErrorResponse,
  mixedLocalizedReferencesToEntities,
} from './__fixtures__';

import * as entityHelpers from 'app/entity_editor/entityHelpers';

import ReferencesTree from './ReferencesTree';

const MockPovider = ({ children, references, dispatch, selectedEntitiesMap }) => (
  <ReferencesContext.Provider value={{ state: { references, selectedEntitiesMap }, dispatch }}>
    {children}
  </ReferencesContext.Provider>
);

MockPovider.defaultProps = {
  dispatch: () => {},
};

const responseMap = (references) =>
  new Map(
    references.map((reference) => {
      const {
        sys: { id, type },
      } = reference;
      return [`${id}-${type}`, reference];
    })
  );

describe('ReferencesTree component', () => {
  it('should render simple references', async () => {
    const onCardClick = jest.fn();
    const response = resolveResponse(simpleReferences);
    const selectedEntitiesMap = responseMap(response);
    const { getAllByTestId } = render(
      <MockPovider references={response} selectedEntitiesMap={selectedEntitiesMap}>
        <ReferencesTree defaultLocale="en-US" maxLevel={5} onReferenceCardClick={onCardClick} />
      </MockPovider>
    );

    await wait();

    expect(getAllByTestId('cf-ui-card')).toHaveLength(4);
  });

  it('should render an array of references', async () => {
    const onCardClick = jest.fn();
    const response = resolveResponse(arrayOfReferences);
    const selectedEntitiesMap = responseMap(response);
    const { getAllByTestId } = render(
      <MockPovider references={response} selectedEntitiesMap={selectedEntitiesMap}>
        <ReferencesTree defaultLocale="en-US" maxLevel={5} onReferenceCardClick={onCardClick} />
      </MockPovider>
    );

    expect(getAllByTestId('cf-ui-card')).toHaveLength(4);

    await wait();
  });

  it('should render nested plain entry', async () => {
    const onCardClick = jest.fn();
    const response = resolveResponse(nestedSimpleReferences);
    const selectedEntitiesMap = responseMap(response);
    const { getAllByTestId } = render(
      <MockPovider references={response} selectedEntitiesMap={selectedEntitiesMap}>
        <ReferencesTree defaultLocale="en-US" maxLevel={5} onReferenceCardClick={onCardClick} />
      </MockPovider>
    );

    expect(getAllByTestId('cf-ui-card')).toHaveLength(5);

    await wait();
  });

  it('should render nested array of references', async () => {
    const onCardClick = jest.fn();
    const response = resolveResponse(nestedArrayOfReferences);
    const selectedEntitiesMap = responseMap(response);
    const { getAllByTestId } = render(
      <MockPovider references={response} selectedEntitiesMap={selectedEntitiesMap}>
        <ReferencesTree defaultLocale="en-US" maxLevel={5} onReferenceCardClick={onCardClick} />
      </MockPovider>
    );

    expect(getAllByTestId('cf-ui-card')).toHaveLength(5);

    await wait();
  });

  it('should render entity references (entries and assets) from the rich text', async () => {
    const onCardClick = jest.fn();
    const response = resolveResponse(richTextSimpleReferences);
    const selectedEntitiesMap = responseMap(response);
    const { getAllByTestId } = render(
      <MockPovider references={response} selectedEntitiesMap={selectedEntitiesMap}>
        <ReferencesTree defaultLocale="en-US" maxLevel={5} onReferenceCardClick={onCardClick} />
      </MockPovider>
    );

    expect(getAllByTestId('cf-ui-card')).toHaveLength(5);

    await wait();
  });

  it('should render embedded inline entry links from the rich text', async () => {
    const onCardClick = jest.fn();
    const response = resolveResponse(richTextEmbeddedInlineEntryReferences);
    const selectedEntitiesMap = responseMap(response);
    const { getAllByTestId } = render(
      <MockPovider references={response} selectedEntitiesMap={selectedEntitiesMap}>
        <ReferencesTree defaultLocale="en-US" maxLevel={5} onReferenceCardClick={onCardClick} />
      </MockPovider>
    );

    expect(getAllByTestId('cf-ui-card')).toHaveLength(2);

    await wait();
  });

  it('should render hyperlink entry refs inside the rich text', async () => {
    const onCardClick = jest.fn();
    const response = resolveResponse(richTextHyperlinkReference);
    const selectedEntitiesMap = responseMap(response);
    const { getAllByTestId } = render(
      <MockPovider references={response} selectedEntitiesMap={selectedEntitiesMap}>
        <ReferencesTree defaultLocale="en-US" maxLevel={5} onReferenceCardClick={onCardClick} />
      </MockPovider>
    );

    expect(getAllByTestId('cf-ui-card')).toHaveLength(2);

    await wait();
  });

  it('should stop at circular references and mark them with an icon', async () => {
    const onCardClick = jest.fn();
    const response = resolveResponse(circularReferences);
    const selectedEntitiesMap = responseMap(response);
    const { getByTestId, getAllByTestId } = render(
      <MockPovider references={response} selectedEntitiesMap={selectedEntitiesMap}>
        <ReferencesTree defaultLocale="en-US" maxLevel={5} onReferenceCardClick={onCardClick} />
      </MockPovider>
    );

    expect(getAllByTestId('cf-ui-card')).toHaveLength(4);
    expect(getByTestId('circular-icon')).toBeInTheDocument();

    await wait();
  });

  it('stop at maxLevel of depth', async () => {
    const onCardClick = jest.fn();
    const response = resolveResponse(depthLimit);
    const selectedEntitiesMap = responseMap(response);
    const { getByText, getAllByTestId } = render(
      <MockPovider references={response} selectedEntitiesMap={selectedEntitiesMap}>
        <ReferencesTree defaultLocale="en-US" maxLevel={1} onReferenceCardClick={onCardClick} />
      </MockPovider>
    );

    expect(getAllByTestId('cf-ui-card')).toHaveLength(3);
    expect(getByText('+ more')).toBeInTheDocument();

    await wait();
  });

  it('should display unresolved references', async () => {
    const onCardClick = jest.fn();
    const response = resolveResponse(unresolvedReferences);
    const selectedEntitiesMap = responseMap(response);
    const { getAllByText, getAllByTestId } = render(
      <MockPovider references={response} selectedEntitiesMap={selectedEntitiesMap}>
        <ReferencesTree defaultLocale="en-US" maxLevel={1} onReferenceCardClick={onCardClick} />
      </MockPovider>
    );

    expect(getAllByTestId('cf-ui-card')).toHaveLength(4);
    expect(getAllByText('Entry is missing or inaccessible')).toHaveLength(2);
    expect(getAllByText('Asset is missing or inaccessible')).toHaveLength(1);

    await wait();
  });

  it('should render entries with validations errors', async () => {
    const onReferenceCardClick = jest.fn();
    const response = resolveResponse(simpleReferences);
    const selectedEntitiesMap = responseMap(response);
    const dispatchSpy = jest.fn();
    const { queryAllByTestId } = render(
      <MockPovider
        references={response}
        dispatch={dispatchSpy}
        selectedEntitiesMap={selectedEntitiesMap}>
        <ReferencesTree
          defaultLocale="en-US"
          maxLevel={5}
          onReferenceCardClick={onReferenceCardClick}
          validations={simpleReferencesValidationErrorResponse}
        />
      </MockPovider>
    );
    expect(queryAllByTestId('validation-error')).toHaveLength(2);
    expect(dispatchSpy).toHaveBeenCalledTimes(6);
    expect(dispatchSpy).toHaveBeenCalledWith({ type: SET_SELECTED_ENTITIES_MAP, value: new Map() });
    expect(dispatchSpy).toHaveBeenCalledWith({ type: SET_SELECTED_ENTITIES, value: [] });
    expect(dispatchSpy).toHaveBeenCalledWith({ type: SET_ACTIONS_DISABLED, value: true });
    expect(dispatchSpy).toHaveBeenCalledWith({ type: SET_INITIAL_REFERENCES_AMOUNT, value: 3 });
    expect(dispatchSpy).toHaveBeenCalledWith({ type: SET_IS_SLICED, value: false });
    expect(dispatchSpy).toHaveBeenCalledWith({
      type: SET_INITIAL_UNIQUE_REFERENCES_AMOUNT,
      value: 0,
    });
  });

  it('should render root entry with validations error', async () => {
    const onReferenceCardClick = jest.fn();
    const response = resolveResponse(simpleReferences);
    const selectedEntitiesMap = responseMap(response);
    const dispatchSpy = jest.fn();
    const { queryAllByTestId } = render(
      <MockPovider
        references={response}
        dispatch={dispatchSpy}
        selectedEntitiesMap={selectedEntitiesMap}>
        <ReferencesTree
          defaultLocale="en-US"
          maxLevel={5}
          onReferenceCardClick={onReferenceCardClick}
          validations={rootReferencesValidationErrorResponse}
        />
      </MockPovider>
    );
    expect(queryAllByTestId('validation-error')).toHaveLength(1);
  });

  it('should render only unique references on the same level of the tree disregarding the locale', async () => {
    jest.spyOn(entityHelpers, 'newForLocale').mockImplementation(() => ({
      entityTitle: jest.fn((entity) => Promise.resolve(entity.fields.name['en-US'])),
    }));

    const onReferenceCardClick = jest.fn();
    const response = resolveResponse(mixedLocalizedReferencesToEntities);
    const selectedEntitiesMap = responseMap(response);
    const dispatchSpy = jest.fn();
    const { queryAllByText, queryAllByTestId } = render(
      <MockPovider
        references={response}
        dispatch={dispatchSpy}
        selectedEntitiesMap={selectedEntitiesMap}>
        <ReferencesTree
          defaultLocale="en-US"
          maxLevel={5}
          onReferenceCardClick={onReferenceCardClick}
        />
      </MockPovider>
    );

    await waitFor(() =>
      queryAllByText(mixedLocalizedReferencesToEntities.includes.Entry[0].fields.name['en-US'])
    );
    expect(queryAllByTestId('cf-ui-card')).toHaveLength(
      // +2, because 1 extra card is the root entity card
      // and another one is for an entry, that is referenced twice on different levels and hence is expected to be rendered twice
      mixedLocalizedReferencesToEntities.includes.Entry.length + 2
    );
    mixedLocalizedReferencesToEntities.includes.Entry.forEach((entry, index) => {
      if (index === 1) {
        // this entity is referenced on 2 different levels in mocks. Please check the mock file for more info
        expect(queryAllByText(entry.fields.name['en-US'])).toHaveLength(2);
      } else {
        expect(queryAllByText(entry.fields.name['en-US'])).toHaveLength(1);
      }
    });
  });
});
