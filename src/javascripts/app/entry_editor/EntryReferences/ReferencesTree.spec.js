import React from 'react';
import { render, cleanup, wait } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import resolveResponse from 'contentful-resolve-response';
import { ReferencesContext } from './ReferencesContext';
import {
  SET_SELECTED_ENTITIES,
  SET_ACTIONS_DISABLED,
  SET_INITIAL_REFERENCES_AMOUNT,
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
} from './__fixtures__';

import ReferencesTree from './ReferencesTree';

const MockPovider = ({ children, references, dispatch }) => (
  <ReferencesContext.Provider value={{ state: { references }, dispatch }}>
    {children}
  </ReferencesContext.Provider>
);

MockPovider.defaultProps = {
  dispatch: () => {},
};

describe('ReferencesTree component', () => {
  afterEach(cleanup);

  it('should render simple references', async () => {
    const onCardClick = jest.fn();
    const response = resolveResponse(simpleReferences);
    const { getAllByTestId } = render(
      <MockPovider references={response}>
        <ReferencesTree defaultLocale="en-US" maxLevel={5} onReferenceCardClick={onCardClick} />
      </MockPovider>
    );

    await wait();

    expect(getAllByTestId('cf-ui-card')).toHaveLength(4);
  });

  it('should render an array of references', async () => {
    const onCardClick = jest.fn();
    const response = resolveResponse(arrayOfReferences);
    const { getAllByTestId } = render(
      <MockPovider references={response}>
        <ReferencesTree defaultLocale="en-US" maxLevel={5} onReferenceCardClick={onCardClick} />
      </MockPovider>
    );

    expect(getAllByTestId('cf-ui-card')).toHaveLength(4);

    await wait();
  });

  it('should render nested plain entry', async () => {
    const onCardClick = jest.fn();
    const response = resolveResponse(nestedSimpleReferences);
    const { getAllByTestId } = render(
      <MockPovider references={response}>
        <ReferencesTree defaultLocale="en-US" maxLevel={5} onReferenceCardClick={onCardClick} />
      </MockPovider>
    );

    expect(getAllByTestId('cf-ui-card')).toHaveLength(5);

    await wait();
  });

  it('should render nested array of references', async () => {
    const onCardClick = jest.fn();
    const response = resolveResponse(nestedArrayOfReferences);
    const { getAllByTestId } = render(
      <MockPovider references={response}>
        <ReferencesTree defaultLocale="en-US" maxLevel={5} onReferenceCardClick={onCardClick} />
      </MockPovider>
    );

    expect(getAllByTestId('cf-ui-card')).toHaveLength(5);

    await wait();
  });

  it('should render entity references (entries and assets) from the rich text', async () => {
    const onCardClick = jest.fn();
    const response = resolveResponse(richTextSimpleReferences);
    const { getAllByTestId } = render(
      <MockPovider references={response}>
        <ReferencesTree defaultLocale="en-US" maxLevel={5} onReferenceCardClick={onCardClick} />
      </MockPovider>
    );

    expect(getAllByTestId('cf-ui-card')).toHaveLength(5);

    await wait();
  });

  it('should render embedded inline entry links from the rich text', async () => {
    const onCardClick = jest.fn();
    const response = resolveResponse(richTextEmbeddedInlineEntryReferences);
    const { getAllByTestId } = render(
      <MockPovider references={response}>
        <ReferencesTree defaultLocale="en-US" maxLevel={5} onReferenceCardClick={onCardClick} />
      </MockPovider>
    );

    expect(getAllByTestId('cf-ui-card')).toHaveLength(2);

    await wait();
  });

  it('should render hyperlink entry refs inside the rich text', async () => {
    const onCardClick = jest.fn();
    const response = resolveResponse(richTextHyperlinkReference);
    const { getAllByTestId } = render(
      <MockPovider references={response}>
        <ReferencesTree defaultLocale="en-US" maxLevel={5} onReferenceCardClick={onCardClick} />
      </MockPovider>
    );

    expect(getAllByTestId('cf-ui-card')).toHaveLength(2);

    await wait();
  });

  it('should stop at circular references and mark them with an icon', async () => {
    const onCardClick = jest.fn();
    const response = resolveResponse(circularReferences);
    const { getByTestId, getAllByTestId } = render(
      <MockPovider references={response}>
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
    const { getByText, getAllByTestId } = render(
      <MockPovider references={response}>
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
    const { getAllByText, getAllByTestId } = render(
      <MockPovider references={response}>
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
    const dispatchSpy = jest.fn();
    const { queryAllByTestId } = render(
      <MockPovider references={response} dispatch={dispatchSpy}>
        <ReferencesTree
          defaultLocale="en-US"
          maxLevel={5}
          onReferenceCardClick={onReferenceCardClick}
          validations={simpleReferencesValidationErrorResponse}
        />
      </MockPovider>
    );
    expect(queryAllByTestId('validation-error')).toHaveLength(2);
    expect(dispatchSpy).toHaveBeenCalledTimes(3);
    expect(dispatchSpy).toHaveBeenCalledWith({ type: SET_SELECTED_ENTITIES, value: [] });
    expect(dispatchSpy).toHaveBeenCalledWith({ type: SET_ACTIONS_DISABLED, value: true });
    expect(dispatchSpy).toHaveBeenCalledWith({ type: SET_INITIAL_REFERENCES_AMOUNT, value: 4 });
  });

  it('should render root entry with validations error', async () => {
    const onReferenceCardClick = jest.fn();
    const response = resolveResponse(simpleReferences);
    const dispatchSpy = jest.fn();
    const { queryAllByTestId } = render(
      <MockPovider references={response} dispatch={dispatchSpy}>
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
});
