import React from 'react';
import PropTypes from 'prop-types';

import EnvironmentIcon from 'svg/environment.es6';
import AliasIcon from 'svg/alias.es6';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';

const EnvOrAlias = ({
  className,
  environmentId,
  alias,
  showAliasedTo,
  isSelected,
  isMaster,
  colorizeFont,
  testId
}) => {
  let fill = tokens.colorTextLight;
  if (isSelected) {
    testId = `${testId}-active`;
    fill = isMaster ? tokens.colorGreenLight : tokens.colorOrangeLight;
  }

  const iconStyle = css({
    display: 'block',
    marginRight: tokens.spacingS,
    minWidth: '16px',
    minHeight: '16px',
    fill
  });

  const wrapperStyle = css({
    display: 'flex',
    alignItems: 'center',
    color: colorizeFont ? fill : undefined,
    fontSize: tokens.fontSizeS,
    fontFamily: tokens.fontStackMonospace,
    fontStyle: isMaster && alias ? 'italic' : 'normal',
    '& > span': {
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      overflow: 'hidden'
    }
  });

  if (alias) {
    const content = showAliasedTo ? `${alias} > ${environmentId}` : environmentId;
    return (
      <div className={`${wrapperStyle} ${className}`} data-test-id={testId} title={content}>
        <AliasIcon className={iconStyle} data-test-id="envoralias.aliasicon"></AliasIcon>
        <span data-test-id="envoralias.label">{content}</span>
      </div>
    );
  }

  return (
    <div className={`${wrapperStyle} ${className}`} data-test-id={testId} title={environmentId}>
      <EnvironmentIcon className={iconStyle} data-test-id="envoralias.environmenticon" />
      <span data-test-id="envoralias.label">{environmentId}</span>
    </div>
  );
};

EnvOrAlias.propTypes = {
  environmentId: PropTypes.string.isRequired,
  className: PropTypes.string,
  alias: PropTypes.string,
  showAliasedTo: PropTypes.bool,
  isMaster: PropTypes.bool,
  isSelected: PropTypes.bool,
  colorizeFont: PropTypes.bool,
  testId: PropTypes.string
};

EnvOrAlias.defaultProps = {
  className: '',
  showAliasedTo: true,
  testId: 'envoralias.wrapper'
};

export default EnvOrAlias;
