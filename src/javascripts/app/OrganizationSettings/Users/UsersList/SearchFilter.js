/* eslint "rulesdir/restrict-inline-styles": "warn" */
import React from 'react';
import PropTypes from 'prop-types';
import { cx, css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { Icon } from '@contentful/forma-36-react-components';

const styles = {
  filterPill: css({
    transition: `margin ${tokens.transitionDurationShort} ease-in-out`,
    display: 'flex',
    lineHeight: '30px',
    height: '30px',
    borderRadius: '3px',
    backgroundColor: tokens.colorElementMid,
    margin: `0 0 ${tokens.spacingS} ${tokens.spacingS}`,

    '&:hover': css({
      boxShadow: 'none',
    }),
    '&:active': css({
      boxShadow: `0 0 0 1px ${tokens.colorTextLightest}`,
    }),
    '&:focus': css({
      boxShadow: `0 0 0 1px ${tokens.colorContrastLight}`,
    }),
    ':first-child': {
      margin: '0',
    },
  }),
  filterPillLabel: css({
    backgroundColor: tokens.colorElementLight,
    color: tokens.colorTextMid,
    padding: `0 ${tokens.spacingS}`,
    borderRadius: '3px 0 0 3px',
  }),
  filterSelectContainer: css({
    display: 'inline-block',
    position: 'relative',
    borderRadius: '0 3px 3px 0',
  }),
  filterSelectContainerActive: css({
    backgroundColor: tokens.colorBlueMid,
    color: tokens.colorWhite,
  }),
  filterSelect: css({
    height: '100%',
    borderRadius: '0 3px 3px 0',
    backgroundImage: 'none',
    color: tokens.colorTextMid,
    backgroundColor: tokens.colorElementMid,
    border: 'none',
    transition: `width ${tokens.transitionDurationShort} ease-in-out`,
    padding: `0 28px 0 ${tokens.spacingS}`,
    minWidth: '80px',
    maxWidth: '200px',
    zIndex: '10',
    fontSize: 'inherit',
    textOverflow: 'ellipsis', // not working everywhere https://bugs.chromium.org/p/chromium/issues/detail?id=436654
    appearance: 'none',
    lineHeight: '16px',
    display: 'flex',
    alignItems: 'center',

    '&:hover': {
      cursor: 'pointer',
      backgroundColor: tokens.colorElementDark,
    },
  }),
  filterSelectActive: css({
    backgroundColor: tokens.colorBlueMid,
    color: tokens.colorWhite,

    '&:hover': {
      backgroundColor: tokens.colorBlueBase,
      color: tokens.colorWhite,
    },
  }),
  filterChevronIcon: css({
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    right: '6px',
    pointerEvents: 'none',
    zIndex: 1,
    display: 'flex',
  }),
};
export default class SearchFilter extends React.Component {
  static propTypes = {
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    filter: PropTypes.shape({
      key: PropTypes.string.isRequired,
      value: PropTypes.any,
      operator: PropTypes.function,
    }).isRequired,
    options: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string.isRequired,
        value: PropTypes.any,
      })
    ).isRequired,
    onChange: PropTypes.func.isRequired,
  };

  handleChange = ({ target: { value } }) => {
    const { onChange, filter, id } = this.props;

    onChange({ ...filter, id, value });
  };

  getSelectWidth() {
    const { filter, options } = this.props;
    const selected = options.find((option) => option.value === filter.value);
    return `calc(${selected.label.length}ch + 40px)`;
  }

  render() {
    const { label, filter, options } = this.props;
    return (
      <div className={styles.filterPill} data-test-id="search-filter">
        <div className={cx(styles.filterPillLabel)} data-test-id="search-filter.label">
          {label}
        </div>
        <div
          className={cx(
            styles.filterSelectContainer,
            filter.value ? styles.filterSelectContainerActive : ''
          )}>
          <select
            className={cx(styles.filterSelect, filter.value ? styles.filterSelectActive : '')}
            value={filter.value}
            onChange={this.handleChange}
            data-test-id="search-filter.options"
            style={{ width: this.getSelectWidth() }}>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <Icon
            icon="ChevronDown"
            color={filter.value ? 'white' : 'secondary'}
            className={cx(
              styles.filterChevronIcon,
              filter.value ? styles.filterChevronIconActive : ''
            )}
          />
        </div>
      </div>
    );
  }
}
