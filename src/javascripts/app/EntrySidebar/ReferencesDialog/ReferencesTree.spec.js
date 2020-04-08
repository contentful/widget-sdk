import React from 'react';
import { render, cleanup, wait } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import resolveResponse from 'contentful-resolve-response';

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
  noReferences,
  simpleReferencesValidationErrorResponse,
} from './__fixtures__';

import ReferencesTree from './ReferencesTree';

describe('ReferencesTree component', () => {
  afterEach(cleanup);

  it('should render simple references', async () => {
    const onCardClick = jest.fn();
    const response = resolveResponse(simpleReferences);
    const root = response[0];
    const { getAllByTestId } = render(
      <ReferencesTree
        root={root}
        defaultLocale="en-US"
        maxLevel={5}
        onReferenceCardClick={onCardClick}
      />
    );

    await wait();

    expect(getAllByTestId('cf-ui-card')).toHaveLength(4);
  });

  it('should render an array of references', async () => {
    const onCardClick = jest.fn();
    const response = resolveResponse(arrayOfReferences);
    const root = response[0];
    const { getAllByTestId } = render(
      <ReferencesTree
        root={root}
        defaultLocale="en-US"
        maxLevel={5}
        onReferenceCardClick={onCardClick}
      />
    );

    expect(getAllByTestId('cf-ui-card')).toHaveLength(4);

    await wait();
  });

  it('should render nested plain entry', async () => {
    const onCardClick = jest.fn();
    const response = resolveResponse(nestedSimpleReferences);
    const root = response[0];
    const { getAllByTestId } = render(
      <ReferencesTree
        root={root}
        defaultLocale="en-US"
        maxLevel={5}
        onReferenceCardClick={onCardClick}
      />
    );

    expect(getAllByTestId('cf-ui-card')).toHaveLength(5);

    await wait();
  });

  it('should render nested array of references', async () => {
    const onCardClick = jest.fn();
    const response = resolveResponse(nestedArrayOfReferences);
    const root = response[0];
    const { getAllByTestId } = render(
      <ReferencesTree
        root={root}
        defaultLocale="en-US"
        maxLevel={5}
        onReferenceCardClick={onCardClick}
      />
    );

    expect(getAllByTestId('cf-ui-card')).toHaveLength(5);

    await wait();
  });

  it('should render entity references (entries and assets) from the rich text', async () => {
    const onCardClick = jest.fn();
    const response = resolveResponse(richTextSimpleReferences);
    const root = response[0];
    const { getAllByTestId } = render(
      <ReferencesTree
        root={root}
        defaultLocale="en-US"
        maxLevel={5}
        onReferenceCardClick={onCardClick}
      />
    );

    expect(getAllByTestId('cf-ui-card')).toHaveLength(5);

    await wait();
  });

  it('should render embedded inline entry links from the rich text', async () => {
    const onCardClick = jest.fn();
    const response = resolveResponse(richTextEmbeddedInlineEntryReferences);
    const root = response[0];
    const { getAllByTestId } = render(
      <ReferencesTree
        root={root}
        defaultLocale="en-US"
        maxLevel={5}
        onReferenceCardClick={onCardClick}
      />
    );

    expect(getAllByTestId('cf-ui-card')).toHaveLength(2);

    await wait();
  });

  it('should render hyperlink entry refs inside the rich text', async () => {
    const onCardClick = jest.fn();
    const response = resolveResponse(richTextHyperlinkReference);
    const root = response[0];
    const { getAllByTestId } = render(
      <ReferencesTree
        root={root}
        defaultLocale="en-US"
        maxLevel={5}
        onReferenceCardClick={onCardClick}
      />
    );

    expect(getAllByTestId('cf-ui-card')).toHaveLength(2);

    await wait();
  });

  it('should stop at circular references and mark them with an icon', async () => {
    const onCardClick = jest.fn();
    const response = resolveResponse(circularReferences);
    const root = response[0];
    const { getByTestId, getAllByTestId } = render(
      <ReferencesTree
        root={root}
        defaultLocale="en-US"
        maxLevel={5}
        onReferenceCardClick={onCardClick}
      />
    );

    expect(getAllByTestId('cf-ui-card')).toHaveLength(4);
    expect(getByTestId('circular-icon')).toBeInTheDocument();

    await wait();
  });

  it('stop at maxLevel of depth', async () => {
    const onCardClick = jest.fn();
    const response = resolveResponse(depthLimit);
    const root = response[0];
    const { getByText, getAllByTestId } = render(
      <ReferencesTree
        root={root}
        defaultLocale="en-US"
        maxLevel={1}
        onReferenceCardClick={onCardClick}
      />
    );

    expect(getAllByTestId('cf-ui-card')).toHaveLength(3);
    expect(getByText('+ more')).toBeInTheDocument();

    await wait();
  });

  it('should display unresolved references', async () => {
    const onCardClick = jest.fn();
    const response = resolveResponse(unresolvedReferences);
    const root = response[0];
    const { getAllByText, getAllByTestId } = render(
      <ReferencesTree
        root={root}
        defaultLocale="en-US"
        maxLevel={1}
        onReferenceCardClick={onCardClick}
      />
    );

    expect(getAllByTestId('cf-ui-card')).toHaveLength(4);
    expect(getAllByText('Entry is missing or inaccessible')).toHaveLength(2);
    expect(getAllByText('Asset is missing or inaccessible')).toHaveLength(1);

    await wait();
  });

  it('should render a message saying that there are no references', async () => {
    const onCardClick = jest.fn();
    const response = resolveResponse(noReferences);
    const root = response[0];
    const { getByText, queryAllByTestId } = render(
      <ReferencesTree
        root={root}
        defaultLocale="en-US"
        maxLevel={5}
        onReferenceCardClick={onCardClick}
      />
    );

    expect(getByText('This entry has no references')).toBeInTheDocument();
    expect(queryAllByTestId('cf-ui-card')).toHaveLength(0);

    await wait();
  });

  it('should render entries with validations errors', async () => {
    const onSelectEntities = jest.fn();
    const onReferenceCardClick = jest.fn();
    const response = resolveResponse(simpleReferences);
    const root = response[0];
    const { queryAllByTestId } = render(
      <ReferencesTree
        root={root}
        defaultLocale="en-US"
        maxLevel={5}
        onReferenceCardClick={onReferenceCardClick}
        validations={simpleReferencesValidationErrorResponse}
        onSelectEntities={onSelectEntities}
      />
    );
    expect(queryAllByTestId('validation-error')).toHaveLength(2);
    expect(onSelectEntities).toHaveBeenCalledTimes(1);
  });
});
