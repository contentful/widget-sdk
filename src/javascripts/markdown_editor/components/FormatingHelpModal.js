import React from 'react';
import PropTypes from 'prop-types';
import { css, cx } from 'emotion';
import { Modal, TextLink, Heading, List, ListItem } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  flexColumnContainer: css({
    display: 'flex',
    flexWrap: 'nowrap'
  }),
  flexColumn: css({
    flexGrow: 1
  }),
  verticalDivider: css({
    borderRight: `1px solid ${tokens.colorElementDarkest}`,
    paddingRight: tokens.spacing3Xl,
    marginRight: tokens.spacing2Xl
  }),
  preview: css({
    display: 'inline-block',
    paddingRight: tokens.spacingL,
    width: '50%'
  }),
  unOrderedListPreview: css({
    listStyleType: 'disc',
    marginLeft: tokens.spacingS
  }),
  orderedListPreview: css({
    listStyleType: 'decimal',
    marginLeft: tokens.spacingS
  }),
  markup: css({
    display: 'inline-block',
    color: tokens.colorTextLight,
    paddingLeft: tokens.spacingL,
    width: '50%'
  }),
  h1: css({
    fontSize: tokens.fontSize2Xl
  }),
  h2: css({
    fontSize: tokens.fontSizeXl
  }),
  h3: css({
    fontSize: tokens.fontSizeL
  }),
  helpItem: css({
    marginBottom: tokens.spacingS,
    display: 'flex',
    alignItems: 'flex-end',
    height: tokens.spacingXl
  }),
  helpLink: css({
    margin: 'auto'
  }),
  flexRowContainer: css({
    display: 'flex',
    width: '100%',
    justifyContent: 'center',
    marginTop: tokens.spacingXl
  })
};

const FormatingHelpModal = ({ isShown, onClose }) => {
  return (
    <Modal title="Markdown formatting help" isShown={isShown} onClose={onClose} size="large">
      <div className={styles.flexColumnContainer}>
        <div className={cx(styles.flexColumn, styles.verticalDivider)}>
          <div className={styles.helpItem}>
            <Heading element="h1" className={cx(styles.preview, styles.h1)}>
              H1
            </Heading>
            <div className={styles.markup}># heading</div>
          </div>
          <div className={styles.helpItem}>
            <Heading element="h2" className={cx(styles.preview, styles.h2)}>
              H2
            </Heading>
            <div className={styles.markup}>## heading</div>
          </div>
          <div className={styles.helpItem}>
            <Heading element="h3" className={cx(styles.preview, styles.h3)}>
              H3
            </Heading>
            <div className={styles.markup}>### heading</div>
          </div>
          <div className={styles.helpItem}>
            <strong className={styles.preview}>bold</strong>
            <div className={styles.markup}>__text__</div>
          </div>
          <div className={styles.helpItem}>
            <em className={styles.preview}>italic</em>
            <div className={styles.markup}>*text*</div>
          </div>
          <div className={styles.helpItem}>
            <strike className={styles.preview}>strikethrough</strike>
            <div className={styles.markup}>~~text~~</div>
          </div>
          <div className={styles.helpItem}>
            <TextLink className={styles.preview}>Link</TextLink>
            <div className={styles.markup}>[text](url)</div>
          </div>
        </div>
        <div className={styles.flexColumn}>
          <div className={styles.helpItem}>
            <div className={styles.preview}>Image</div>
            <div className={styles.markup}>![alt-text](url)</div>
          </div>
          <div className={styles.helpItem}>
            <div className={styles.preview}>
              <List>
                <ListItem className={styles.unOrderedListPreview}>Unordered list</ListItem>
              </List>
            </div>
            <div className={styles.markup}>* list item</div>
          </div>
          <div className={styles.helpItem}>
            <div className={styles.preview}>
              <ol>
                <li className={styles.orderedListPreview}>Ordered list</li>
              </ol>
            </div>
            <div className={styles.markup}>1. list item</div>
          </div>
          <div className={styles.helpItem}>
            <div className={styles.preview}>
              <blockquote>Blockquote</blockquote>
            </div>
            <div className={styles.markup}>&gt; quote</div>
          </div>
          <div className={styles.helpItem}>
            <code className={styles.preview}>code span</code>
            <div className={styles.markup}>`code here`</div>
          </div>
          <div className={styles.helpItem}>
            <code className={styles.preview}>code block</code>
            <div className={styles.markup}>```code here```</div>
          </div>
        </div>
      </div>
      <div className={styles.flexRowContainer}>
        <TextLink
          className={styles.helpLink}
          href="https://help.github.com/articles/markdown-basics/"
          target="_blank"
          rel="noopener noreferrer">
          View the full GitHub-flavored Markdown syntax help (opens in a new window)
        </TextLink>
      </div>
    </Modal>
  );
};

FormatingHelpModal.propTypes = {
  isShown: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

export default FormatingHelpModal;
