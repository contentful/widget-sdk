import React, { Component } from 'react';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';

import { Heading, Paragraph, List, ListItem } from '@contentful/forma-36-react-components';

const styles = {
  featuresListItem: css({
    listStyleType: 'disc',
    marginLeft: tokens.spacingM
  })
};

export default class Features extends Component {
  render() {
    return (
      <div className="f36-margin-top--l">
        <Heading>Features</Heading>
        <Paragraph className="f36-margin-top--m">
          Optimizely integration enables:
          <List className="f36-margin-top--m">
            <ListItem className={styles.featuresListItem}>
              Loading experiments from Optimizely
            </ListItem>
            <ListItem className={styles.featuresListItem}>Adding content to variations</ListItem>
            <ListItem className={styles.featuresListItem}>
              Seeing all experiments connected with Contentful (drafts, running, ended)
            </ListItem>
          </List>
        </Paragraph>
      </div>
    );
  }
}
