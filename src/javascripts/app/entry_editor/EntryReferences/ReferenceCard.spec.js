import React from 'react';
import ReferenceCard from './ReferenceCard';
import { test } from '@contentful/types';
import { render, cleanup } from '@testing-library/react';
import { ReferencesProvider } from './ReferencesContext';

describe('ReferenceCard', () => {
  afterAll(cleanup);

  it('renders a card for Entry', () => {
    const entry = test.generator.entry();

    const { getByTestId } = render(
      <ReferencesProvider>
        <ReferenceCard entity={entry} />
      </ReferencesProvider>
    );

    expect(getByTestId('reference-card')).toBeInTheDocument();
  });

  it('renders a card for Asset', () => {
    const asset = test.generator.asset();
    const { getByTestId } = render(
      <ReferencesProvider>
        <ReferenceCard entity={asset} />
      </ReferencesProvider>
    );

    expect(getByTestId('reference-card')).toBeInTheDocument();
  });

  it("doesn't render a card for non editorial entity entity type", () => {
    const scheduledAction = test.generator.entity();
    scheduledAction.sys.type = 'ScheduledAction';

    const { queryByTestId } = render(
      <ReferencesProvider>
        <ReferenceCard entity={scheduledAction} />
      </ReferencesProvider>
    );

    expect(queryByTestId('reference-card')).toBeNull();
  });

  it('renders unresolved link', () => {
    const link = {
      sys: {
        type: 'Link',
        linkType: 'Entry',
        id: '1234',
      },
    };

    const { getByTestId } = render(
      <ReferencesProvider>
        <ReferenceCard entity={link} isUnresolved={true} />
      </ReferencesProvider>
    );

    expect(getByTestId('reference-card__unresolved')).toBeInTheDocument();
  });

  it('renders more card', () => {
    const entry = test.generator.entry();

    const { getByTestId } = render(
      <ReferencesProvider>
        <ReferenceCard entity={entry} isMoreCard={true} />
      </ReferencesProvider>
    );

    expect(getByTestId('reference-card__more')).toBeInTheDocument();
  });
});
