import React from 'react';
import PropTypes from 'prop-types';
import isHotKey from 'is-hotkey';
import cn from 'classnames';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { SkeletonContainer, SkeletonBodyText } from '@contentful/forma-36-react-components';
import _ from 'lodash';

const styles = {
  commandPanel: css({
    display: 'block',
    background: tokens.colorWhite,
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1), 0 5px 10px -5px rgba(0, 0, 0, 0.3)',
    border: `1px solid ${tokens.colorElementDark}`,
    borderRadius: '3px',
    listStyle: 'none',
    margin: 0,
    padding: 0,
    fontFamily: tokens.fontStackPrimary,
    width: '320px',
    maxHeight: '207px',
    overflowY: 'auto'
  }),
  item: css({
    fontSize: tokens.fontSizeM,
    lineHeight: tokens.lineHeightDefault,
    padding: `${tokens.spacingS} ${tokens.spacingXs}`,
    borderBottom: `1px solid ${tokens.colorElementMid}`,
    margin: 0,
    color: tokens.colorTextDark
  }),
  divider: css({
    fontWeight: tokens.fontWeightDemiBold,
    padding: `${tokens.spacingS} ${tokens.spacingXs}`,
    letterSpacing: tokens.letterSpacingWide,
    fontSize: tokens.fontSizeS,
    textTransform: 'uppercase',
    borderBottom: `1px solid ${tokens.colorElementDark}`,
    margin: 0,
    lineHeight: tokens.lineHeightDefault,
    color: tokens.colorTextDark
  }),
  isSelected: css({
    background: tokens.colorElementLight
  }),
  skeletonContainer: css({
    padding: tokens.spacingM
  })
};

const itemPropType = PropTypes.shape({
  label: PropTypes.string,
  callback: PropTypes.func
});

class CommandPanelItem extends React.Component {
  static propTypes = {
    isSelected: PropTypes.bool,
    index: PropTypes.number,
    classNames: PropTypes.string,
    item: itemPropType
  };
  listItemRef = null;

  componentDidUpdate() {
    if (this.props.isSelected) {
      this.listItemRef.scrollIntoView({
        block: 'nearest',
        inline: 'start'
      });
    }
  }

  render() {
    const { index, classNames, item } = this.props;

    return (
      <li
        key={index}
        className={classNames}
        ref={ref => {
          this.listItemRef = ref;
        }}>
        <button type="button" onClick={item.callback && item.callback}>
          {item.label}
        </button>
      </li>
    );
  }
}

export class CommandPanel extends React.Component {
  static propTypes = {
    items: PropTypes.arrayOf(itemPropType),
    searchString: PropTypes.string,
    extraClassNames: PropTypes.string,
    children: PropTypes.node,
    testId: PropTypes.string,
    isLoading: PropTypes.bool
  };
  static defaultProps = {
    extraClassNames: undefined,
    searchString: '',
    items: [],
    testId: 'cf-ui-command-panel',
    isLoading: true
  };

  state = {
    selectedKey: 0,
    items: []
  };

  static getDerivedStateFromProps(props, state) {
    const itemsHasUpdated = props.items !== state.originalItems;
    const searchStringHasUpdated = props.searchString !== state.originalSearchString;

    const items = props.items.filter(item =>
      item.label.toLowerCase().includes(props.searchString ? props.searchString.toLowerCase() : '')
    );

    return {
      originalItems: props.items,
      originalSearchString: props.searchString,
      items,
      selectedKey: itemsHasUpdated || searchStringHasUpdated ? 0 : state.selectedKey
    };
  }

  componentDidMount() {
    document.addEventListener('keydown', this.handleKeyboard, true);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyboard, true);
  }

  handleKeyboard = e => {
    if (isHotKey('up', e)) {
      if (this.state.selectedKey === 0) return;
      this.setState(state => ({
        selectedKey: state.selectedKey - 1
      }));
    }

    if (isHotKey('down', e)) {
      if (this.state.selectedKey === this.state.items.length - 1) return;
      this.setState(state => ({
        selectedKey: state.selectedKey + 1
      }));
    }

    if (isHotKey('enter', e)) {
      const selectedItem = this.state.items[this.state.selectedKey];
      if (selectedItem.callback) selectedItem.callback();
    }
  };

  renderGroups() {
    const groups = _.uniqBy(this.state.items.map(item => item.group), value => value);

    if (!groups.length) {
      return <li className={styles.item}>No results</li>;
    }

    return groups.map((groupName, index) => {
      return (
        <React.Fragment key={index}>
          {groupName && (
            <li key={groupName} className={styles.divider}>
              {groupName}
            </li>
          )}
          {this.renderItems(groupName)}
        </React.Fragment>
      );
    });
  }

  renderItems(groupName) {
    return this.state.items
      .filter(item => item.group === groupName)
      .map(item => {
        const index = this.state.items.indexOf(item);
        const isSelected = index === this.state.selectedKey;

        const classNames = cn(styles.item, {
          [styles.isSelected]: isSelected
        });

        return (
          <CommandPanelItem
            item={item}
            classNames={classNames}
            key={index}
            isSelected={isSelected}
          />
        );
      });
  }

  renderSkeleton = () => (
    <div className={styles.skeletonContainer}>
      <SkeletonContainer>
        <SkeletonBodyText numberOfLines={6} />
      </SkeletonContainer>
    </div>
  );

  render() {
    const { extraClassNames, testId, isLoading } = this.props;

    const classNames = cn(styles.commandPanel, extraClassNames);

    return (
      <ul className={classNames} data-test-id={testId}>
        {isLoading ? this.renderSkeleton() : this.renderGroups()}
      </ul>
    );
  }
}

export default CommandPanel;
