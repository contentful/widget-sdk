import React, { Fragment } from 'react';
import PropTypes from 'prop-types';

import EnvironmentIcon from 'svg/environment.svg';
import AliasIcon from 'svg/alias.svg';
import tokens from '@contentful/forma-36-tokens';
import { Icon } from '@contentful/forma-36-react-components';
import { css } from 'emotion';

const ellipsis = {
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
};

const EnvOrAliasLabel = ({
  className,
  environmentId,
  aliasId,
  showAliasedTo,
  isSelected,
  isMaster,
  colorizeFont,
  darkBackground,
  overrideColor,
  testId,
}) => {
  if (!environmentId) return null;

  let fill = tokens.colorTextLight;
  if (isSelected) {
    testId = `${testId}-active`;
    fill = isMaster
      ? darkBackground
        ? tokens.colorGreenLight
        : tokens.colorPositive
      : tokens.colorWarning;
  }

  const iconStyle = css({
    display: 'block',
    marginRight: tokens.spacingS,
    minWidth: '16px',
    minHeight: '16px',
    fill: overrideColor || fill,
  });

  const wrapperStyle = css({
    ...ellipsis,
    display: 'flex',
    alignItems: 'center',
    color: overrideColor || (colorizeFont ? fill : undefined),
    fontFamily: tokens.fontStackMonospace,
    fontStyle: isMaster && aliasId ? 'italic' : 'normal',
  });

  const aliasedToStyle = css({
    ...ellipsis,
    display: 'flex',
    alignItems: 'center',
    '& > svg': {
      flexShrink: 0,
      fill: overrideColor || tokens.colorTextLightest,
    },
  });

  return (
    <span
      className={`${wrapperStyle} ${className}`}
      data-test-id={testId}
      title={showAliasedTo && aliasId ? `${aliasId} > ${environmentId}` : environmentId}>
      {aliasId ? (
        <Fragment>
          <AliasIcon className={iconStyle} data-test-id="envoralias.aliasicon" />
          <span className={aliasedToStyle} data-test-id="envoralias.label">
            {showAliasedTo ? (
              <Fragment>
                <span>{aliasId}</span>
                <Icon icon="ChevronRight" color="muted" />
                <span className={css(ellipsis)}>{environmentId}</span>
              </Fragment>
            ) : (
              environmentId
            )}
          </span>
        </Fragment>
      ) : (
        <Fragment>
          <EnvironmentIcon className={iconStyle} data-test-id="envoralias.environmenticon" />
          <span className={css(ellipsis)} data-test-id="envoralias.label">
            {environmentId}
          </span>
        </Fragment>
      )}
    </span>
  );
};

EnvOrAliasLabel.propTypes = {
  environmentId: PropTypes.string.isRequired,
  className: PropTypes.string,
  aliasId: PropTypes.string,
  showAliasedTo: PropTypes.bool,
  isMaster: PropTypes.bool,
  isSelected: PropTypes.bool,
  // TODO: Refactor, abstract colors to icon components
  colorizeFont: PropTypes.bool,
  darkBackground: PropTypes.bool,
  overrideColor: PropTypes.string,
  testId: PropTypes.string,
};

EnvOrAliasLabel.defaultProps = {
  className: '',
  showAliasedTo: true,
  testId: 'envoralias.wrapper',
};

export default EnvOrAliasLabel;
