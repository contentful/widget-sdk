import React from 'react';
import PropTypes from 'prop-types';
import Advice from 'components/tabs/Advice/index.es6';
import EmptyContentIcon from 'svg/empty-content-model.es6';
import { Note, TextLink } from '@contentful/forma-36-react-components';
import CreateEntryButton from 'components/CreateEntryButton/index.es6';

export default function NoEntriesAdvice({
  onCreate,
  contentTypes,
  suggestedContentTypeId,
  hasArchivedEntries,
  loadArchived
}) {
  return (
    <Advice>
      <Advice.Icon>
        <EmptyContentIcon />
      </Advice.Icon>
      <Advice.Title>Huzzah, let’s add some content!</Advice.Title>
      <Advice.Description>
        Your content is made up of entries. Get started by creating your first entry.
      </Advice.Description>

      <Advice.Action>
        <CreateEntryButton
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
  hasArchivedEntries: PropTypes.bool.isRequired,
  loadArchived: PropTypes.func.isRequired
};
