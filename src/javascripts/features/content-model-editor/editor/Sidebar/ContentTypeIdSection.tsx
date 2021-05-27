import React from 'react';
import {
  Paragraph,
  Subheading,
  TextInput,
  Typography,
} from '@contentful/forma-36-react-components';

export function ContentTypeIdSection({ contentTypeId }: { contentTypeId: string }) {
  return (
    <React.Fragment>
      <Subheading className="entity-sidebar__heading">Content type ID</Subheading>
      <Typography>
        <Paragraph>
          Use this ID to retrieve everything related to this content type via the API.
        </Paragraph>
      </Typography>
      <TextInput
        value={contentTypeId}
        name="contentTypeIdInput"
        id="contentTypeIdInput"
        testId="contentTypeIdInput"
        withCopyButton
        disabled
      />
    </React.Fragment>
  );
}
