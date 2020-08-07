import React from 'react';
import PropTypes from 'prop-types';
import cn from 'classnames';
import { css } from 'emotion';

import { SectionHeading, List, ListItem, Icon } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  list: css({
    display: 'flex',
  }),
  listItem: css({
    display: 'flex',
    marginLeft: tokens.spacingM,
    '&:first-child': {
      marginLeft: 0,
    },
    '& svg': {
      marginLeft: tokens.spacingM,
    },
  }),
  isActive: css({
    color: tokens.colorGreenMid,
  }),
};

export const Breadcrumb = ({ items = [] }) => {
  return (
    <nav data-test-id="space-breadcrumb">
      <List className={styles.list} testId="space-breadcrumb-list">
        {items.map((item, idx) => (
          <BreadcrumbItem key={idx} isActive={item.isActive} hasIcon={idx < items.length - 1}>
            {item.text}
          </BreadcrumbItem>
        ))}
      </List>
    </nav>
  );
};
Breadcrumb.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({ text: PropTypes.string.isRequired, isActive: PropTypes.bool })
  ).isRequired,
};

function BreadcrumbItem({ children, isActive = false, hasIcon = false }) {
  return (
    <ListItem className={styles.listItem}>
      <SectionHeading className={cn({ [styles.isActive]: isActive })}>{children}</SectionHeading>
      {hasIcon && <Icon icon="ChevronRight" />}
    </ListItem>
  );
}
BreadcrumbItem.propTypes = {
  isActive: PropTypes.bool,
  hasIcon: PropTypes.bool,
};
