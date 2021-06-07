import { Paragraph, Subheading, TextLink, Typography } from '@contentful/forma-36-react-components';
import React from 'react';
import { useRouteNavigate } from 'core/react-routing';
import { TABS } from '../EditorFieldTabs';

export function EntryEditorSection({ contentTypeId }: { contentTypeId: string }) {
  const navigate = useRouteNavigate();

  return (
    <>
      <Subheading className="entity-sidebar__heading">Entry Editor Appearance</Subheading>
      <Typography>
        <Paragraph>
          Change the entry editor’s appearance for this content type in the{' '}
          <TextLink
            onClick={() =>
              navigate({
                path: 'content_types.detail',
                contentTypeId,
                tab: TABS.entryEditorConfiguration,
              })
            }>
            Entry editor settings
          </TextLink>
        </Paragraph>
      </Typography>
    </>
  );
}
