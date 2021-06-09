import React from 'react';
import { Note, Paragraph } from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import KnowledgeBase from 'components/shared/knowledge_base_icon/KnowledgeBase';

import tokens from '@contentful/forma-36-tokens';

export function CustomRolesPlanNote() {
  return (
    <Note
      noteType="primary"
      title="Customize your roles"
      className={css({ marginBottom: tokens.spacingL })}>
      <React.Fragment>
        <Paragraph>
          With our more advanced spaces it{"'"}s possible to fully edit and customize the roles
          within your space.
        </Paragraph>
        <Paragraph>
          These Custom Roles can be defined to have granular permissions on entries, content types,
          fields, and more.
        </Paragraph>
        <Paragraph>
          To learn more about what{"'"}s possible, check out{' '}
          <KnowledgeBase target="roles" text="our guide to Roles and Permissions" />.
        </Paragraph>
      </React.Fragment>
    </Note>
  );
}
