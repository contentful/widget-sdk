import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import { ExpandablePanel } from './ExpandablePanel';
import { TextLink } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  toggleDetailsLink: css({ marginLeft: `calc(${tokens.spacingXl} + ${tokens.spacingXs})` }),
};

export function ExpandableElement({ children, id }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleOnClick = () => setIsExpanded(!isExpanded);

  return (
    <div data-test-id={`cf-ui-expandable-element--${id}`} data-active={isExpanded}>
      <TextLink
        onClick={handleOnClick}
        className={styles.toggleDetailsLink}
        aria-controls={`expandable-panel--${id}`}
        id={`expandable--${id}`}
        testId="cf-ui-expandable-panel-link">
        {isExpanded ? 'Hide details' : 'Compare with current space type'}
      </TextLink>
      <ExpandablePanel isExpanded={isExpanded} id={id}>
        {children}
      </ExpandablePanel>
    </div>
  );
}

ExpandableElement.propTypes = {
  children: PropTypes.node.isRequired,
  id: PropTypes.number.isRequired,
};
