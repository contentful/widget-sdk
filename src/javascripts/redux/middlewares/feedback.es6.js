import { get } from 'lodash';
import createMicroBackendsClient from 'MicroBackendsClient.es6';
import { Notification } from '@contentful/forma-36-react-components';
import getOrgId from '../selectors/getOrgId.es6';
import { getCurrentUser } from '../selectors/users.es6';
import { getCurrentTeam } from '../selectors/teams.es6';

export default ({ getState }) => next => async action => {
  switch (action.type) {
    case 'SEND_FEEDBACK': {
      const state = getState();
      const organizationId = getOrgId(state);
      const userId = get(getCurrentUser(state), 'sys.id');
      const teamId = getCurrentTeam(state);
      const {
        payload: { feedback, canBeContacted },
        meta: { about, target }
      } = action;
      const client = createMicroBackendsClient({ backendName: 'feedback' });

      const res = await client.call('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedback,
          about,
          target,
          canBeContacted,
          ...(canBeContacted ? { organizationId, userId, teamId } : {})
        })
      });

      if (res.ok) {
        Notification.success('Thank you for your feedback!');
      } else {
        Notification.error("We couldn't send your feedback. Please try again.");
      }
      break;
    }
  }
  return next(action);
};
