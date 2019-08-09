import React from 'react';
import PropTypes from 'prop-types';

import moment from 'moment';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { Tag, CopyButton } from '@contentful/forma-36-react-components';
import EnvOrAlias from 'app/common/EnvOrAlias.es6';

const environmentDetailsStyles = {
  copy: css({
    button: {
      backgroundColor: 'transparent',
      border: 'none',
      height: '1.7em',
      width: '2em',
      '&:hover': {
        backgroundColor: 'transparent'
      }
    }
  }),
  envOrAlias: css({
    fontSize: tokens.fontSizeM
  }),
  tag: css({
    marginLeft: 'auto',
    paddingLeft: tokens.spacingM
  }),
  wrapper: css({
    display: 'flex',
    alignItems: 'center',
    '& > span': {
      marginRight: tokens.spacingXs
    }
  })
};

export default function EnvironmentDetails({
  environmentId,
  isMaster,
  isDefault,
  alias,
  showAliasedTo,
  hasCopy,
  createdAt,
  isSelected,
  testId
}) {
  return (
    <div className={environmentDetailsStyles.wrapper} data-test-id={testId}>
      <EnvOrAlias
        className={environmentDetailsStyles.envOrAlias}
        alias={alias}
        showAliasedTo={showAliasedTo}
        environmentId={environmentId}
        isMaster={isMaster}
        isSelected={isSelected}
      />
      {hasCopy && (
        <CopyButton
          className={environmentDetailsStyles.copy}
          copyValue={environmentId}
          testId="environmentdetails.copy"
        />
      )}
      {isDefault && !alias && (
        <Tag tagType="muted" testId="environmentdetails.default">
          Default environment
        </Tag>
      )}
      {createdAt && (
        <Tag
          className={environmentDetailsStyles.tag}
          tagType="muted"
          testId="environmentdetails.createdAt">
          Created {moment(createdAt).fromNow()}
        </Tag>
      )}
    </div>
  );
}

EnvironmentDetails.propTypes = {
  environmentId: PropTypes.string.isRequired,
  createdAt: PropTypes.any,
  isMaster: PropTypes.bool,
  isSelected: PropTypes.bool,
  showAliasedTo: PropTypes.bool,
  alias: PropTypes.string,
  isDefault: PropTypes.bool,
  hasCopy: PropTypes.bool,
  testId: PropTypes.string
};

EnvironmentDetails.defaultProps = {
  hasCopy: true,
  testId: 'environmentdetails.wrapper'
};
