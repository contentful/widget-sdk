import React from 'react';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import PropTypes from 'prop-types';

const styles = {
  constraints: css({
    fontStyle: 'italic',
    marginTop: tokens.spacingS,
    color: tokens.colorTextLight
  })
};

export default function TagEditorConstraints({ constraintsType, constraints }) {
  return (
    <div className={styles.constraints}>
      {constraintsType === 'min' && <span>Requires at least {constraints.min} tags</span>}
      {constraintsType === 'max' && <span>Requires no more than {constraints.max} tags</span>}
      {constraintsType === 'min-max' && (
        <span>
          Requires between {constraints.min} and {constraints.max} tags
        </span>
      )}
    </div>
  );
}

TagEditorConstraints.propTypes = {
  constraintsType: PropTypes.string,
  constraints: PropTypes.object
};
