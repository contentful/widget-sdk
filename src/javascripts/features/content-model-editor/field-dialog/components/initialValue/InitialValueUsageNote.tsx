import React, { useState } from 'react';
import { Flex, Note, Paragraph } from '@contentful/forma-36-react-components';

export function InitialValueUsageNote() {
  const [isShown, setIsShown] = useState(true);

  return isShown ? (
    <Flex marginBottom="spacingL" marginTop="spacing2Xs">
      <Note hasCloseButton onClose={() => setIsShown(false)}>
        <Flex marginBottom="spacingM">
          <Paragraph>
            This setting allows you to set an initial value for this field, which will be
            automatically inserted to new content entries. It can help editors avoid content entry
            altogether, or just give them a helpful prompt for how to structure their content.
          </Paragraph>
        </Flex>
        <Paragraph>
          This setting is part of an early access program, and at the moment the initial value you
          provide is not being validated against any validation rules for this field type. So if you
          use an initial value that wouldn’t pass validation, it may block publishing the content
          type altogether.
        </Paragraph>
      </Note>
    </Flex>
  ) : null;
}
