import React from 'react';
import PropTypes from 'prop-types';
import { CheckboxField, Paragraph } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';
import { WebhookSegmentationTable } from './WebhookSegmentationTable';
import { WILDCARD, createMap } from './WebhookSegmentationState';

const styles = {
  checkboxWrapper: css({
    marginBottom: tokens.spacingM,
  }),
  checkbox: css({
    marginTop: tokens.spacingXs,
  }),
};

export class WebhookSegmentation extends React.Component {
  static propTypes = {
    values: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired,
  };

  renderOption(caption, checked, onChange) {
    return (
      <div>
        <CheckboxField
          id={`wildcard-${checked}`}
          className={styles.checkbox}
          labelIsLight={true}
          checked={checked}
          labelText={` ${caption}`}
          onChange={onChange}
        />
      </div>
    );
  }

  render() {
    const { values, onChange } = this.props;
    const isWildcarded = values === WILDCARD;

    return (
      <div className={styles.checkboxWrapper} id="webhook-segmentation">
        <Paragraph>Specify for what kind of events this webhook should be triggered.</Paragraph>
        {this.renderOption('Trigger for all events', isWildcarded, () => onChange(WILDCARD))}
        {this.renderOption('Select specific triggering events', !isWildcarded, () =>
          onChange(createMap(false))
        )}
        {!isWildcarded && <WebhookSegmentationTable values={values} onChange={onChange} />}
      </div>
    );
  }
}
