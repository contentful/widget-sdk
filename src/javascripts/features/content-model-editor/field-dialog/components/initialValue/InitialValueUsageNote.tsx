import { Flex, List, ListItem, Note } from '@contentful/forma-36-react-components';
import React, { useState } from 'react';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  list: css({
    paddingLeft: tokens.spacingL,
    paddingTop: tokens.spacing2Xs,
    li: {
      listStyle: 'disc',
    },
  }),
};

export function InitialValueUsageNote() {
  const [isShown, setIsShown] = useState(true);

  return isShown ? (
    <Flex marginBottom="spacingL" marginTop="spacing2Xs">
      <Note hasCloseButton onClose={() => setIsShown(false)} title="Initial value">
        The new feature gives you the possibility to have a specific value for the field so that the
        editors don&apos;t have to think about it. The feature is currently in EAP phase, so please
        be aware of the following:
        <List element="ul" className={styles.list}>
          <ListItem>
            Initial values are not validated and will prevent users from publishing entries if not
            applied correctly.
          </ListItem>
        </List>
      </Note>
    </Flex>
  ) : null;
}
