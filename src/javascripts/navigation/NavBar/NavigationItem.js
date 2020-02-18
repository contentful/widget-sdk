/* eslint-disable rulesdir/restrict-non-f36-components */

import React from 'react';
import cn from 'classnames';
import PropTypes from 'prop-types';
import { Tooltip } from '@contentful/forma-36-react-components';
import * as Navigator from 'states/Navigator';
import NavigationItemTag from './NavigationItemTag';
import Icon from 'ui/Components/Icon';
import IconPoc from 'ui/Components/IconPoc';

import keycodes from 'utils/keycodes';

function Label({ hasTooptip, children, ...rest }) {
  if (hasTooptip) {
    return (
      <Tooltip {...rest} targetWrapperClassName="nav-bar__list-label">
        {children}
      </Tooltip>
    );
  }
  return <span className="nav-bar__list-label">{children}</span>;
}

Label.propTypes = {
  hasTooptip: PropTypes.bool.isRequired
};

function getNavigationProps(item) {
  return {
    path: item.sref,
    params: item.srefParams || {},
    options: {
      inherit: true,
      ...(item.srefOptions || {})
    }
  };
}

export default function NavigationItem(props) {
  const { item } = props;

  const onClick = () => {
    if (item.disabled) {
      return;
    }

    Navigator.go(getNavigationProps(item));
  };

  return (
    <li
      key={item.title}
      className="app-top-bar__action nav-bar__list-item"
      {...{
        'data-ui-tour-step': item.dataViewType ? `nav-item-${item.dataViewType}` : undefined
      }}>
      <a
        data-view-type={item.dataViewType}
        href={Navigator.href(getNavigationProps(item))}
        className={cn('nav-bar__link', {
          'is-disabled': item.disabled,
          'is-active': item.disabled
            ? false
            : Navigator.includes({ path: item.rootSref || item.sref })
        })}
        role="button"
        onClick={e => {
          if (e.ctrlKey || e.metaKey) {
            return;
          }
          e.preventDefault();
          onClick();
        }}
        onKeyDown={e => {
          if (e.keyCode === keycodes.ENTER) {
            onClick();
          }
        }}
        {...{
          tabIndex: item.disabled ? undefined : '0'
        }}>
        <Label hasTooptip={Boolean(item.tooltip)} content={item.tooltip} placement="bottom">
          {item.iconPoc ? (
            <>
              <IconPoc name="settings" size="medium" mono color="white" />
              {item.tagLabel && <NavigationItemTag label={item.tagLabel} />}
            </>
          ) : (
            <>
              <Icon name={item.icon} />
              {item.tagLabel && <NavigationItemTag label={item.tagLabel} />}
            </>
          )}
          {item.title}
        </Label>
      </a>
    </li>
  );
}

NavigationItem.propTypes = {
  item: PropTypes.shape({
    title: PropTypes.string.isRequired,
    icon: PropTypes.string.isRequired,
    tagLabel: PropTypes.string,
    iconPoc: PropTypes.string,
    rootSref: PropTypes.string,
    sref: PropTypes.string,
    srefParams: PropTypes.object,
    srefOptions: PropTypes.object,
    dataViewType: PropTypes.string,
    disabled: PropTypes.boolean,
    tooltip: PropTypes.string
  }).isRequired
};
