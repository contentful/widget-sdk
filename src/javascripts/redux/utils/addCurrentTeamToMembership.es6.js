import { set } from 'lodash/fp';
import { getCurrentTeam } from '../selectors/teams.es6';

export default (state, membership) => set('sys.team', { sys: { type: 'Link', linkType: 'Team', id: getCurrentTeam(state) } }, membership)
