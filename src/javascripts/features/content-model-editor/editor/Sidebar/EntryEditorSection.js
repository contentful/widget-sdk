import { Paragraph, Subheading, TextLink, Typography } from '@contentful/forma-36-react-components';
import { go } from 'states/Navigator';
import React from 'react';

export function EntryEditorSection() {
  return (
    <>
      <Subheading className="entity-sidebar__heading">Entry Editor Appearance</Subheading>
      <Typography>
        <Paragraph>
          Change the entry editor’s appearance for this content type in the{' '}
          <TextLink onClick={() => go({ path: '^.entry_editor_configuration' })}>
            Entry editor settings
          </TextLink>
        </Paragraph>
      </Typography>
    </>
  );
}
