import React from 'react';
import PropTypes from 'prop-types';
import { Heading } from '@contentful/forma-36-react-components';
import styles from './styles';
import WidgetContainer from './widgets/WidgetContainer';
import { SpaceTrialWidget } from 'features/trials';

export const TrialSpaceHome = ({ spaceName, spaceId }) => {
  return (
    <WidgetContainer>
      <WidgetContainer.Row>
        <WidgetContainer.Col>
          <Heading className={styles.header}>
            Welcome to your <span className={styles.demiBold}>{spaceName}</span> space
          </Heading>
        </WidgetContainer.Col>
      </WidgetContainer.Row>

      {/* Placeholder to apply the top margin. 
      TODO: update the WidgetContainer styles and remove this placeholder */}
      <WidgetContainer.Row>
        <div />
      </WidgetContainer.Row>

      <WidgetContainer.Row>
        <SpaceTrialWidget spaceId={spaceId} />
      </WidgetContainer.Row>
    </WidgetContainer>
  );
};

TrialSpaceHome.propTypes = {
  spaceName: PropTypes.string,
  spaceId: PropTypes.string,
};
