import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { css, cx } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { Subheading, IconButton } from '@contentful/forma-36-react-components';

const styles = {
  accordion: css({
    width: '100%',
    border: `1px solid ${tokens.colorElementMid}`,
    borderBottom: 'none',
    backgroundColor: tokens.colorWhite
  }),
  drawerHeader: css({
    display: 'flex',
    justifyContent: 'space-between',
    flexWrap: 'nowrap',
    fontSize: tokens.fontSizeL,
    borderBottom: `1px solid ${tokens.colorElementMid}`,
    padding: tokens.spacingL,
    margin: 0
  }),
  headingFont: css({ fontWeight: tokens.fontWeightNormal }),
  clickableHeader: css({
    cursor: 'pointer'
  }),
  openedDrawerHeader: css({ boxShadow: `0px 2px 4px -1px ${tokens.colorElementMid}` }),
  drawerContent: css({
    borderBottom: `1px solid ${tokens.colorElementMid}`,
    padding: tokens.spacingL
  })
};

const Drawer = ({ headerText, content, index, shouldRenderChevron: isHeaderClickable }) => {
  const [isOpen, setOpen] = useState(index === 0 ? true : false);
  return (
    <div>
      <div
        className={cx(
          styles.drawerHeader,
          isOpen && styles.openedDrawerHeader,
          isHeaderClickable && styles.clickableHeader
        )}
        onClick={() => (isHeaderClickable ? setOpen(!isOpen) : null)}>
        <Subheading className={styles.headingFont}>{headerText}</Subheading>
        {isHeaderClickable &&
          (isOpen ? (
            <IconButton
              iconProps={{
                icon: 'ChevronUp'
              }}
              label={`Close "${headerText}" drawer`}
              buttonType="secondary"
              onClick={() => setOpen(false)}
            />
          ) : (
            <IconButton
              iconProps={{
                icon: 'ChevronDown'
              }}
              label={`Open "${headerText}" drawer`}
              buttonType="secondary"
              onClick={() => setOpen(true)}
            />
          ))}
      </div>
      {isOpen && <div className={styles.drawerContent}>{content}</div>}
    </div>
  );
};

Drawer.propTypes = {
  headerText: PropTypes.node.isRequired,
  content: PropTypes.node.isRequired,
  index: PropTypes.number.isRequired,
  shouldRenderChevron: PropTypes.bool.isRequired
};

const AccordionComponent = ({ drawersContent }) => (
  <div className={styles.accordion}>
    {drawersContent.map((item, index) => (
      <Drawer
        key={index}
        headerText={item.headerText}
        content={item.content}
        index={index}
        shouldRenderChevron={drawersContent.length > 1}
      />
    ))}{' '}
  </div>
);

AccordionComponent.propTypes = {
  drawersContent: PropTypes.arrayOf(
    PropTypes.shape({
      headerText: PropTypes.node,
      content: PropTypes.node
    })
  ).isRequired
};

export default AccordionComponent;
