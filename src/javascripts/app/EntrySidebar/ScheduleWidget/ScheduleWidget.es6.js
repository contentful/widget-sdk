import React from 'react';
import { css } from 'emotion';

import tokens from '@contentful/forma-36-tokens';

import { SkeletonContainer, SkeletonBodyText } from '@contentful/forma-36-react-components';

import ScheduleTimeline from './ScheduleTimeline/index.es6';
import ScheduleFetcher from './ScheduleFetcher.es6';

const styles = {
  root: css({
    paddingTop: tokens.spacingM
  }),
  skeleton: css({}),
  heading: css({
    fontSize: tokens.fontSizeS,
    fontWeight: tokens.fontWeightNormal,
    textTransform: 'uppercase',
    color: tokens.colorTextLight,
    borderBottom: `1px solid ${tokens.colorElementDark}`,
    marginBottom: tokens.spacingM,
    marginTop: tokens.spacingM,
    lineHeight: tokens.lineHeightDefault,
    letterSpacing: tokens.letterSpacingWide
  })
};

export default () => {
  return (
    <div className={styles.root}>
      <ScheduleFetcher entryId={1}>
        {({ isLoading, isError, data }) => {
          if (isLoading) {
            return (
              <SkeletonContainer>
                <SkeletonBodyText numberOfLines={2} />
              </SkeletonContainer>
            );
          }
          if (isError) {
            // Implement proper error handling
            return null;
          }

          return (
            <React.Fragment>
              <div className={styles.heading}>Scheduled Publication</div>
              <ScheduleTimeline schedules={data.scheduleCollection.items} />
            </React.Fragment>
          );
        }}
      </ScheduleFetcher>
    </div>
  );
};
