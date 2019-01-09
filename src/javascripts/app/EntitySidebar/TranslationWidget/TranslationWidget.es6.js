import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Pill, TextLink } from '@contentful/forma-36-react-components';

export default class TranslationSidebarWidget extends Component {
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
      <div data-test-id="sidebar-translation-widget">
        <h2 className="entity-sidebar__heading">Translation</h2>
        <div className="pill-list entity-sidebar__translation-pills">
          {locales.map(locale => (
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
      </div>
    );
  }
}
