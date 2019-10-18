import React from 'react';
import { css } from 'emotion';
import PropTypes from 'prop-types';
import { partialRight } from 'lodash';
import { TextLink, Note } from '@contentful/forma-36-react-components';
import * as tokens from '@contentful/forma-36-tokens';

import { shortenStorageUnit } from 'utils/NumberUtils.es6';

const classes = {
  section: css({
    margin: tokens.spacingXl,
    borderTop: `solid 1px ${tokens.colorElementMid}`,
    padding: `${tokens.spacing3Xl} 0`
  }),
  totalUsage: css({
    fontSize: tokens.fontSize3Xl,
    lineHeight: tokens.spacing3Xl,
    marginTop: tokens.spacingM
  }),
  limit: css({
    fontSize: tokens.fontSizeM
  }),
  includedLimit: css({
    color: tokens.colorTextLightest
  }),
  overage: css({
    color: tokens.colorOrangeMid
  }),
  learnMoreLink: css({
    marginLeft: tokens.spacingS
  }),
  note: css({
    width: '40%',
    marginTop: tokens.spacingS
  })
};

export default class AssetBandwidthSection extends React.Component {
  static propTypes = {
    limit: PropTypes.number,
    usage: PropTypes.number,
    uom: PropTypes.string
  };

  render() {
    const { limit, usage, uom } = this.props;

    if (usage == null) {
      return (
        <div className={classes.section}>
          <h2>Total asset bandwidth</h2>
          <div className={classes.totalUsage}>Not available</div>
          <Note className={classes.note}>
            Asset bandwidth usage information is only available in the most recent usage period
          </Note>
        </div>
      );
    }

    const withUnit = partialRight(shortenStorageUnit, uom);

    return (
      <div className={classes.section}>
        <h2>Total asset bandwidth</h2>
        <div className={classes.totalUsage}>{withUnit(usage)}</div>
        <div className={classes.limit}>
          <span className={classes.includedLimit}>{`${withUnit(limit)} included`}</span>
          {usage > limit && (
            <span className={classes.overage}>{` + ${withUnit(usage - limit)} overage`}</span>
          )}
          <TextLink
            href="https://www.contentful.com/r/knowledgebase/fair-use/"
            target="_blank"
            className={classes.learnMoreLink}>
            Learn more
          </TextLink>
        </div>
      </div>
    );
  }
}
