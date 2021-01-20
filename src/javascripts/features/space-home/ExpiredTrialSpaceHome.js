import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { Heading, Paragraph, Typography } from '@contentful/forma-36-react-components';
import EmptyStateContainer, {
  defaultSVGStyle,
} from 'components/EmptyStateContainer/EmptyStateContainer';
import Illustration from 'svg/illustrations/expired-trial-space-home-ill.svg';
import { getSpace } from 'services/TokenStore';
import { useAsync } from 'core/hooks';
import { isExpiredTrialSpace } from 'features/trials';

export const ExpiredTrialSpaceHome = ({ spaceId }) => {
  const [space, setSpace] = useState();

  const fetchSpace = useCallback(async () => {
    getSpace(spaceId).then((space) => setSpace(space));
  }, [spaceId]);

  useAsync(fetchSpace);

  if (!space || space.readOnlyAt || !isExpiredTrialSpace(space)) {
    return null;
  }

  return (
    <EmptyStateContainer data-test-id="expired-trial-space-home">
      <Illustration className={defaultSVGStyle} />
      <Typography>
        <Heading>
          Your trial space expired on {moment(space.trialPeriodEndsAt).format('D MMMM YYYY')}
        </Heading>
        <Paragraph>
          All of your content is saved, but you can’t create or edit anything.
          <br />
          Contact us to upgrade and unlock this space again.
        </Paragraph>
      </Typography>
    </EmptyStateContainer>
  );
};

ExpiredTrialSpaceHome.propTypes = {
  spaceId: PropTypes.string.isRequired,
};
