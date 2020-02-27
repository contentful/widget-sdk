import React from 'react';
import PropTypes from 'prop-types';
import Advice from 'components/tabs/Advice';
import EmptyContentIcon from 'svg/illustrations/empty-content-model.svg';
import { Note, TextLink } from '@contentful/forma-36-react-components';
import CreateEntryButton from 'components/CreateEntryButton/CreateEntryButton';

export default function NoEntriesAdvice({
  onCreate,
  contentTypes,
  suggestedContentTypeId,
  hasArchivedEntries,
  loadArchived,
  disabled
}) {
  return (
    <Advice data-test-id="no-entries-advice">
      <Advice.Icon>
        <EmptyContentIcon />
      </Advice.Icon>
      <Advice.Title>Huzzah, let’s add some content!</Advice.Title>
      <Advice.Description>
        Your content is made up of entries. Get started by creating your first entry.
      </Advice.Description>

      <Advice.Action>
        <CreateEntryButton
          disabled={disabled}
          contentTypes={contentTypes}
          onSelect={onCreate}
          suggestedContentTypeId={suggestedContentTypeId}
        />
      </Advice.Action>
      {hasArchivedEntries && (
        <Advice.Notes>
          <Note>
            You can look up old entries in the{' '}
            <TextLink onClick={loadArchived} data-test-id="load-archived">
              archive
            </TextLink>
            .
          </Note>
        </Advice.Notes>
      )}
    </Advice>
  );
}

NoEntriesAdvice.propTypes = {
  onCreate: PropTypes.func.isRequired,
  contentTypes: PropTypes.array,
  suggestedContentTypeId: PropTypes.string,
  hasArchivedEntries: PropTypes.bool,
  loadArchived: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};
