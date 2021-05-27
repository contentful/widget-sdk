import React from 'react';
import { css } from 'emotion';
import { Note, TextLink } from '@contentful/forma-36-react-components';
import * as accessChecker from 'access_control/AccessChecker';
import { ReactRouterLink } from 'core/react-routing';

const NoEditorsWarning = ({ contentTypeId }: { contentTypeId: string | undefined }) => {
  const canUpdateContentTypes = accessChecker.can('update', 'contentType');

  return (
    <Note className={css({ margin: '20px' })}>
      Editing is disabled for entries of this content type.{' '}
      {canUpdateContentTypes && contentTypeId !== undefined ? (
        <ReactRouterLink
          route={{
            path: 'content_types.detail',
            tab: 'entry_editor_configuration',
            contentTypeId,
          }}>
          <TextLink>Change entry editor settings</TextLink>
        </ReactRouterLink>
      ) : null}
    </Note>
  );
};

export default NoEditorsWarning;
