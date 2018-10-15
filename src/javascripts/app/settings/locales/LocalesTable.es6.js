import React from 'react';
import _ from 'lodash';
import PropTypes from 'prop-types';
import { Table, TableHead, TableRow, TableCell, TableBody } from '@contentful/ui-component-library';
import StateLink from 'app/common/StateLink.es6';

function groupLocaleNamesByCode(locales) {
  return _.transform(
    locales,
    (acc, locale) => {
      acc[locale.code] = locale.name + ' (' + locale.code + ')';
    },
    {}
  );
}

export default class LocalesTable extends React.Component {
  static propTypes = {
    locales: PropTypes.arrayOf(PropTypes.object).isRequired
  };

  static getDerivedStateFromProps(props) {
    return {
      localeNamesByCode: groupLocaleNamesByCode(props.locales)
    };
  }

  state = {};

  render() {
    return (
      <Table style={{ width: '100%' }}>
        <TableHead>
          <TableRow>
            <TableCell aria-label="cell-name">Locale</TableCell>
            <TableCell>Fallback</TableCell>
            <TableCell>Incl. in response</TableCell>
            <TableCell>Editing</TableCell>
            <TableCell>Required fields</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {this.props.locales.map(locale => (
            <StateLink to="^.detail" params={{ localeId: locale.sys.id }} key={locale.sys.id}>
              {({ onClick }) => (
                <TableRow onClick={onClick} style={{ cursor: 'pointer' }}>
                  <TableCell aria-label="cell-name">
                    {locale.name} ({locale.code})
                    {locale.default && <span className="entity-list-badge">Default</span>}
                  </TableCell>
                  <TableCell data-test-id="locale-list-fallback-column">
                    {locale.fallbackCode
                      ? this.state.localeNamesByCode[locale.fallbackCode]
                      : 'None'}
                  </TableCell>
                  <TableCell data-test-id="locale-list-cda-column">
                    {locale.contentDeliveryApi ? 'Enabled' : 'Disabled'}
                  </TableCell>
                  <TableCell data-test-id="locale-list-cma-column">
                    {locale.contentManagementApi ? 'Enabled' : 'Disabled'}
                  </TableCell>
                  <TableCell data-test-id="locale-list-optional-column">
                    {locale.optional ? 'Can be published empty' : 'Content is required'}
                  </TableCell>
                </TableRow>
              )}
            </StateLink>
          ))}
        </TableBody>
      </Table>
    );
  }
}
