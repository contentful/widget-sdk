import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Icon,
  Dropdown,
  List,
  ListItem,
  TextLink,
  Paragraph
} from '@contentful/forma-36-react-components';
import * as slideInNavigator from 'navigation/SlideInNavigator';
import tokens from '@contentful/forma-36-tokens';
import { css, cx } from 'emotion';
import FetchLinksToEntity from './index';

const styles = {
  badge: css({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#8C53C2',
    fontSize: tokens.fontSizeL,
    padding: '0px 5px',
    borderRadius: '4px',
    color: tokens.colorWhite
  }),
  linksLength: css({
    color: tokens.colorWhite
  }),
  icon: css({
    marginRight: '2px'
  }),
  dropdown: css({
    lineHeight: 1
  }),
  linkList: css({
    padding: 0,
    maxHeight: '200px',
    overflow: 'scroll'
  }),
  linkListHeader: css({
    padding: `0 ${tokens.spacingXs}`,
    background: tokens.colorElementLight
  }),
  entryLinkWrapper: css({
    cursor: 'pointer',
    display: 'flex',
    padding: tokens.spacingXs,
    '&:hover': {
      background: tokens.colorElementLightest
    }
  }),
  entryLink: css({
    marginRight: tokens.spacingL,
    maxWidth: '400px',
    color: tokens.colorTextDark,
    textDecoration: 'none',
    span: {
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis'
    }
  }),
  contentType: css({
    marginLeft: 'auto'
  })
};

export default function LinkedEntitiesBadge({ entityInfo, className }) {
  const [isLinkListOpen, setLinkListOpen] = useState(false);
  const [dropdownContainer, setDropdownContainer] = useState(null);
  return (
    <FetchLinksToEntity
      {...entityInfo}
      render={({ links }) => {
        if (!links || links.length < 2) {
          return null;
        }
        return (
          <Dropdown
            isOpen={isLinkListOpen}
            className={styles.dropdown}
            getContainerRef={ref => {
              setDropdownContainer(ref);
            }}
            toggleElement={
              <div
                data-test-id="cf-linked-entities-icon"
                className={cx(styles.badge, className)}
                onMouseEnter={() => setLinkListOpen(true)}
                onMouseLeave={e => {
                  if (
                    e.relatedTarget === window ||
                    !dropdownContainer.contains(e.relatedTarget) ||
                    !dropdownContainer === e.relatedTarget
                  ) {
                    setLinkListOpen(false);
                  }
                }}>
                <Icon icon="Link" color="white" className={styles.icon} />
                <Paragraph className={styles.linksLength}>{links.length}</Paragraph>
              </div>
            }>
            <div
              onMouseEnter={() => setLinkListOpen(true)}
              onMouseLeave={() => setLinkListOpen(false)}>
              <div className={styles.linkListHeader} data-test-id="cf-linked-entities-header">
                <Paragraph>{`Reused by ${links.length} entries`}</Paragraph>
              </div>
              <List className={styles.linkList}>
                {links.map(link => (
                  <ListItem
                    key={link.id}
                    testId={`cf-linked-entry-${link.id}`}
                    className={styles.entryLinkWrapper}
                    onClick={e => {
                      e.stopPropagation();
                      setLinkListOpen(false);
                      slideInNavigator.goToSlideInEntity({
                        type: 'Entry',
                        id: link.id
                      });
                    }}>
                    <TextLink className={styles.entryLink}>{link.title || 'Untitled'}</TextLink>
                    <Paragraph className={styles.contentType}>{link.contentTypeName}</Paragraph>
                  </ListItem>
                ))}
              </List>
            </div>
          </Dropdown>
        );
      }}
    />
  );
}

LinkedEntitiesBadge.propTypes = {
  entityInfo: PropTypes.shape({
    id: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired
  }),
  className: PropTypes.string
};
