import React from 'react';
import PropTypes from 'prop-types';
import { Paragraph, Subheading } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import * as fieldFactory from 'services/fieldFactory';
import Icon from 'ui/Components/Icon';
import { css } from 'emotion';

const fieldGroupSelectorStyles = {
  container: css({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
  }),
  button: css({
    marginLeft: tokens.spacingXs,
    marginRight: tokens.spacingXs,
    padding: tokens.spacingS,
    width: '110px',
    outline: 'none',
    minHeight: '240px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    ':hover, :focus': {
      backgroundColor: tokens.colorElementLightest,
    },
  }),
  iconContainer: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: `1px solid ${tokens.colorElementMid}`,
    boxShadow: tokens.boxShadowDefault,
    width: '80px',
    height: '80px',
  }),
  name: css({
    marginTop: tokens.spacingM,
    marginBottom: tokens.spacingXs,
    fontSize: tokens.fontSizeM,
  }),
  description: css({
    color: tokens.colorTextLight,
    fontSize: tokens.fontSizeS,
  }),
};

export const FieldGroupSelector = (props) => {
  const fieldButtons = fieldFactory.groups.map((x) => {
    return (
      <button
        className={fieldGroupSelectorStyles.button}
        key={x.name}
        type="button"
        data-test-id="select-field"
        data-field-type={`select-field-${x.name}`}
        aria-label={x.label}
        onClick={() => props.onSelect(x)}>
        <div className={fieldGroupSelectorStyles.iconContainer}>
          <Icon testId="select-field-icon" name={`field-${x.icon}`} />
        </div>
        <Subheading className={fieldGroupSelectorStyles.name} testId="select-field-name">
          {x.label}
        </Subheading>
        <Paragraph
          className={fieldGroupSelectorStyles.description}
          testId="select-field-description">
          {x.description}
        </Paragraph>
      </button>
    );
  });
  return (
    <div>
      <div className={fieldGroupSelectorStyles.container}>{fieldButtons.slice(0, 5)}</div>
      <div className={fieldGroupSelectorStyles.container}>{fieldButtons.slice(5)}</div>
    </div>
  );
};

FieldGroupSelector.propTypes = {
  onSelect: PropTypes.func.isRequired,
};
