import React from 'react';
import PropTypes from 'prop-types';
import { Note, Paragraph } from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import KnowledgeBase from 'components/shared/knowledge_base_icon/KnowledgeBase';

import tokens from '@contentful/forma-36-tokens';

export default function CustomRolesPlanNote(props) {
  return (
    <Note
      noteType="primary"
      title="Customize your roles"
      className={css({ marginBottom: tokens.spacingL })}>
      {props.isLegacyOrganization ? (
        <React.Fragment>
          <Paragraph>
            With our Enterprise Plans it is possible to fully customize the roles within your space.
            These custom roles can define granular permissions on entries, content types, and
            fields.
          </Paragraph>
          <Paragraph>
            {' '}
            To learn more about what’s possible check out{' '}
            <KnowledgeBase target="roles" inlineText icon={false} text="this guide" /> or{' '}
            <KnowledgeBase target="sales" inlineText icon={false} text="get in touch" /> with our
            Enterprise team.
          </Paragraph>
        </React.Fragment>
      ) : (
        <React.Fragment>
          <Paragraph>
            With our more advanced spaces it{"'"}s possible to fully edit and customize the roles
            within your space.
          </Paragraph>
          <Paragraph>
            These Custom Roles can be defined to have granular permissions on entries, content
            types, fields, and more.
          </Paragraph>
          <Paragraph>
            To learn more about what{"'"}s possible, check out{' '}
            <KnowledgeBase
              target="roles"
              inlineText
              icon={false}
              text="our guide to Roles and Permissions"
            />
            .
          </Paragraph>
        </React.Fragment>
      )}
    </Note>
  );
}

CustomRolesPlanNote.propTypes = {
  isLegacyOrganization: PropTypes.bool.isRequired
};
