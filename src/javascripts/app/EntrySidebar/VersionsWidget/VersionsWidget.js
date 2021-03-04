/* eslint "rulesdir/restrict-inline-styles": "warn" */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import StateLink from 'app/common/StateLink';
import { css, cx } from 'emotion';
import { Button, Tooltip, RadioButton, Flex } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import RelativeDateTime from 'components/shared/RelativeDateTime';
import SnapshotStatus from 'app/snapshots/helpers/SnapshotStatus';
import EntrySidebarWidget from '../EntrySidebarWidget';
import { ActionPerformerName } from 'core/components/ActionPerformerName';

const styles = {
  list: css({
    listStyleType: 'none',
    marginBottom: tokens.spacingM,
  }),
  radio: css({
    marginRight: tokens.spacingXs,
  }),
};

export const noSnapshotsText =
  "There are no previous versions because you haven't made changes to this entry yet. As soon as you publish changes, you'll be able to compare different versions.";
export const compareHelpText =
  'Select a previous version to compare it with the current version of this entry.';

const CompareButton = (props) => (
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
  selectedId: PropTypes.string,
};

const ToolTipContent = ({ version }) =>
  version?.sys.createdBy && (
    <React.Fragment>
      Edited by{' '}
      <ActionPerformerName
        link={version?.sys.createdBy}
        formatName={(name) => `${name === 'Me' ? name?.toLowerCase() : name}`}
      />
    </React.Fragment>
  );

ToolTipContent.propTypes = {
  version: PropTypes.object,
};

export default class VersionsWidget extends Component {
  static propTypes = {
    versions: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
    entryId: PropTypes.string,
    error: PropTypes.any,
    isLoaded: PropTypes.bool.isRequired,
  };

  state = {
    selectedId: null,
  };

  renderList(versions) {
    return versions.map((version) => (
      <Tooltip
        containerElement="li"
        place="auto-start"
        key={version.sys.id}
        content={<ToolTipContent version={version} />}>
        <Flex justifyContent="space-between" alignItems="center">
          <Flex
            htmlTag="label"
            paddingTop="spacingXs"
            paddingBottom="spacingXs"
            alignItems="center">
            <RadioButton
              type="radio"
              id={`selected-${version.sys.id}`}
              className={styles.radio}
              disabled={version.sys.isCurrent}
              value={version.sys.id}
              name="selected"
              aria-disabled={version.sys.isCurrent}
              role="option"
              onChange={(e) => {
                this.setState({ selectedId: e.currentTarget.value });
              }}
            />
            <RelativeDateTime value={version.sys.createdAt} className="radio-editor__label" />
          </Flex>
          <div>
            <SnapshotStatus {...version.sys} />
          </div>
        </Flex>
      </Tooltip>
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
              <ul className={cx('entity-sidebar__help-text', styles.list)}>
                {this.renderList(versions)}
              </ul>
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
