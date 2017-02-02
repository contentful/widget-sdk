import {track} from 'analytics/Analytics';
import {stateName} from 'data/CMA/EntityState';
import * as K from 'utils/kefir';

export default function install (entityInfo, document, lifeline$) {
  K.onValueWhile(lifeline$, document.resourceState.stateChange$, (data) => {
    track('entry_editor:state_changed', {
      fromState: stateName(data.from),
      toState: stateName(data.to),
      entityType: entityInfo.type,
      entityId: entityInfo.id
    });
  });
}
