/* eslint "rulesdir/restrict-inline-styles": "warn" */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import StateLink from 'app/common/StateLink';
import { Button, Tag, Tooltip, RadioButton } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import RelativeDateTime from 'components/shared/RelativeDateTime';
import * as SnapshotStatus from 'app/snapshots/helpers/SnapshotStatus';
import EntrySidebarWidget from '../EntrySidebarWidget';
import FetchAndFormatUserName from 'components/shared/UserNameFormatter/FetchAndFormatUserName';

const styles = {
  table: {
    width: '100%',
    lineHeight: '1.5',
    margin: `0 0 ${tokens.spacingM}`
  },
  cell: {
    padding: `${tokens.spacingXs} 0`
  },
  dateCell: {
    padding: `${tokens.spacingXs} 0`,
    width: '100%'
  },
  radio: {
    verticalAlign: 'baseline',
    marginRight: tokens.spacingXs
  }
};

export const noSnapshotsText =
  "There are no previous versions because you haven't made changes to this entry yet. As soon as you publish changes, you'll be able to compare different versions.";
export const compareHelpText =
  'Select a previous version to compare it with the current version of this entry.';

const CompareButton = props => (
  <StateLink
    path="spaces.detail.entries.detail.compare.withCurrent"
    params={{ entryId: props.entryId, snapshotId: props.selectedId }}>
    {({ onClick }) => (
      <Button
        buttonType="muted"
        isFullWidth
        testId="compare-versions"
        disabled={!props.selectedId}
        onClick={onClick}>
        Compare with current version
      </Button>
    )}
  </StateLink>
);
CompareButton.propTypes = {
  entryId: PropTypes.string,
  selectedId: PropTypes.string
};

export default class VersionsWidget extends Component {
  static propTypes = {
    versions: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
    entryId: PropTypes.string,
    error: PropTypes.any,
    isLoaded: PropTypes.bool.isRequired
  };

  state = {
    selectedId: null
  };

  renderList(versions) {
    return versions.map(version => (
      <tr key={version.sys.id}>
        <td style={styles.cell}>
          <RadioButton
            labelText="Select version"
            type="radio"
            id={`selected-${version.sys.id}`}
            style={styles.radio}
            disabled={version.sys.isCurrent}
            value={version.sys.id}
            name="selected"
            aria-disabled={version.sys.isCurrent}
            role="option"
            onChange={e => {
              this.setState({ selectedId: e.currentTarget.value });
            }}
          />
        </td>
        <td style={styles.dateCell}>
          <Tooltip
            content={
              version.sys.createdBy && (
                <React.Fragment>
                  Edited by <FetchAndFormatUserName userId={version.sys.createdBy.sys.id} />
                </React.Fragment>
              )
            }>
            <RelativeDateTime value={version.sys.createdAt} className="radio-editor__label" />
          </Tooltip>
        </td>
        <td style={styles.cell}>
          <Tooltip
            content={
              version.sys.createdBy && (
                <React.Fragment>
                  Edited by <FetchAndFormatUserName userId={version.sys.createdBy.sys.id} />
                </React.Fragment>
              )
            }>
            <Tag {...SnapshotStatus.getProps(version)} />
          </Tooltip>
        </td>
      </tr>
    ));
  }

  render() {
    const { versions, error, isLoaded } = this.props;
    return (
      <EntrySidebarWidget title="Versions">
        <div className="snapshot-sidebar">
          {error && <div className="snapshot-sidebar__warning">{error}</div>}
          {isLoaded && !error && versions.length === 0 && (
            /* eslint-disable-next-line rulesdir/restrict-non-f36-components */
            <p className="entity-sidebar__help-text" role="note">
              {noSnapshotsText}
            </p>
          )}
          {isLoaded && versions.length > 0 && (
            <React.Fragment>
              <table className="entity-sidebar__help-text" role="listbox" style={styles.table}>
                <tbody>{this.renderList(versions)}</tbody>
              </table>
              <CompareButton selectedId={this.state.selectedId} entryId={this.props.entryId} />
              {/* eslint-disable-next-line rulesdir/restrict-non-f36-components */}
              <p className="entity-sidebar__help-text" role="note" aria-multiselectable="false">
                {compareHelpText}
              </p>
            </React.Fragment>
          )}
        </div>
      </EntrySidebarWidget>
    );
  }
}
