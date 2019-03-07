import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { orderBy } from 'lodash';
import { Pill, TextLink } from '@contentful/forma-36-react-components';

export default class TranslationWidgetPills extends Component {
  static propTypes = {
    locales: PropTypes.arrayOf(
      PropTypes.shape({
        code: PropTypes.string.isRequired,
        default: PropTypes.bool.isRequired
      })
    ).isRequired,
    onChange: PropTypes.func.isRequired,
    onLocaleDeactivation: PropTypes.func.isRequired
  };
  render() {
    const { locales } = this.props;
    return (
      <div className="pill-list entity-sidebar__translation-pills">
        {orderBy(locales, ['default', 'code'], ['desc', 'asc']).map(locale => (
          <div
            key={locale.code}
            className={classNames('entity-sidebar__translation-pill', {
              'x--default': locale.default
            })}>
            <Pill
              testId="deactivate-translation"
              status="default"
              label={locale.code}
              onClose={
                locale.default
                  ? undefined
                  : () => {
                      this.props.onLocaleDeactivation(locale);
                    }
              }
            />
          </div>
        ))}
        <TextLink
          testId="change-translation"
          onClick={() => {
            this.props.onChange();
          }}>
          Change
        </TextLink>
      </div>
    );
  }
}
