import React from 'react';
import { Tag } from '@contentful/forma-36-react-components';
import { PropTypes } from 'prop-types';

const tagTypeMap = {
  published: 'positive',
  draft: 'warning',
  archived: 'negative',
  changed: 'primary'
};

export function EntityStatusTag({ statusLabel }) {
  return <Tag tagType={tagTypeMap[statusLabel]}>{statusLabel}</Tag>;
}

EntityStatusTag.propTypes = {
  statusLabel: PropTypes.string.isRequired
};
