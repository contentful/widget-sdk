import { Flex, List, ListItem, Note } from '@contentful/forma-36-react-components';
import React from 'react';
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
  return (
    <Flex marginBottom="spacing2Xs" marginTop="spacing2Xs">
      <Note title="Heads up">
        Initial values are currently in <b>EAP phase</b>, please be aware of the following
        limitations:
        <List element="ul" className={styles.list}>
          <ListItem>
            Confirm and re-open the field settings modal in case you changed localisation,
            validations or appearance settings.
          </ListItem>
          <ListItem>
            Initial values are not validated and will prevent users from publishing entries if not
            applied correctly.
          </ListItem>
        </List>
      </Note>
    </Flex>
  );
}
