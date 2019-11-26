import React from 'react';
import PropTypes from 'prop-types';
import { Button, Tooltip } from '@contentful/forma-36-react-components';

const descriptors = {
  bold: ['Bold', 'fa-bold'],
  italic: ['Italic', 'fa-italic'],
  quote: ['Quote', 'fa-quote-left'],
  ul: ['Unordered list', 'fa-list'],
  ol: ['Ordered list', 'fa-list-ol'],
  link: ['Link', 'fa-link'],
  strike: ['Strike out', 'fa-strikethrough'],
  code: ['Code block', 'fa-code'],
  hr: ['Horizontal rule', 'fa-arrows-h'],
  indent: ['Increase indentation', 'fa-indent'],
  dedent: ['Decrease indentation', 'fa-dedent'],
  embed: ['Embed external content', 'fa-cubes'],
  table: ['Insert table', 'fa-table'],
  special: ['Insert special character', 'fa-eur'],
  organizeLinks: ['Organize links', 'fa-sitemap'],
  undo: ['Undo', 'fa-undo'],
  redo: ['Redo', 'fa-repeat']
};

const ActionComponent = ({ name, isZenMode, actions, isDisabled }) => {
  if (!actions) {
    return null;
  }
  return (
    <Tooltip place={isZenMode ? 'bottom' : 'top'} content={descriptors[name][0]}>
      <Button
        testId={`markdown-action-button-${name}`}
        size="small"
        buttonType="naked"
        onClick={actions[name]}
        disabled={isDisabled}>
        <i className={`fa ${descriptors[name][1]}`}></i>
      </Button>
    </Tooltip>
  );
};

ActionComponent.propTypes = {
  name: PropTypes.string.isRequired,
  isZenMode: PropTypes.bool.isRequired,
  isDisabled: PropTypes.bool.isRequired,
  actions: PropTypes.object
};

export default ActionComponent;
