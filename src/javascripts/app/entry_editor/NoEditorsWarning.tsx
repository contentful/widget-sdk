import React from 'react';
import { css } from 'emotion';
import StateLink from 'app/common/StateLink';
import { TextLink, Note } from '@contentful/forma-36-react-components';
import * as accessChecker from 'access_control/AccessChecker';

const NoEditorsWarning = ({ contentTypeId }: { contentTypeId: string | undefined }) => {
  const canUpdateContentTypes = accessChecker.can('update', 'contentType');

  return (
    <Note className={css({ margin: '20px' })}>
      Editing is disabled for entries of this content type.{' '}
      {canUpdateContentTypes && contentTypeId !== undefined ? (
        <StateLink
          path="spaces.detail.content_types.detail.entry_editor_configuration"
          params={{ contentTypeId }}>
          <TextLink>Change entry editor settings</TextLink>
        </StateLink>
      ) : null}
    </Note>
  );
};

export default NoEditorsWarning;
