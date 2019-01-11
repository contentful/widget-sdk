import React, { Component } from 'react';
import PropTypes from 'prop-types';
import StateLink from 'app/common/StateLink.es6';
import { Button, Tag } from '@contentful/forma-36-react-components';
import RelativeDateTime from 'components/shared/RelativeDateTime/index.es6';
import * as SnapshotStatus from 'app/snapshots/helpers/SnapshotStatus.es6';

const styles = {
  table: {
    width: '100%',
    lineHeight: '1.5',
    // @todo get rhythm helpers from [stylesheets/mixins/typography.styl] for inline styles
    margin: ' 0 0 1.28em'
  },
  cell: {
    padding: '0.375em 0'
  },
  radio: {
    verticalAlign: 'baseline'
  }
};

export const noSnapshotsText =
  "There are no previous versions because you haven't made changes to this entry yet. As soon as you publish changes, you'll be able to compare different versions.";
export const compareHelpText =
  'Select a previous version to compare it with the current version of this entry.';

const CompareButton = props => (
  <StateLink
    to="spaces.detail.entries.detail.compare.withCurrent"
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
          <input
            className="radio-editor__input"
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
        <td
          style={{
            width: '100%',
            ...styles.cell
          }}>
          <RelativeDateTime value={version.sys.createdAt} extraClassNames="radio-editor__label" />
        </td>
        <td style={styles.cell}>
          <Tag {...SnapshotStatus.getProps(version)} />
        </td>
      </tr>
    ));
  }

  render() {
    const { versions, error, isLoaded } = this.props;
    return (
      <div>
        <h2 className="entity-sidebar__heading">Versions</h2>
        <div className="snapshot-sidebar">
          {error && <div className="snapshot-sidebar__warning">{error}</div>}
          {isLoaded && versions.length === 0 && (
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
              <p className="entity-sidebar__help-text" role="note" aria-multiselectable="false">
                {compareHelpText}
              </p>
            </React.Fragment>
          )}
        </div>
      </div>
    );
  }
}
