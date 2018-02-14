import {
  canPerformActionOnEntryOfType,
  Actions
} from 'access_control/AccessChecker';

export default function getAccessibleCTs (publishedCTs, selectedCtId) {
  return publishedCTs
    .getAllBare()
    .filter(ct => accessibleOrSelected(selectedCtId, ct));
}
function accessibleOrSelected (selectedCtId, ct) {
  // Get only accessible content types or one
  // in the query parameter. (e.g from saved search views)
  return isAccessible(ct) || isSelected(selectedCtId, ct);
}

function isAccessible (ct) {
  return canPerformActionOnEntryOfType(Actions.READ, ct.sys.id);
}

function isSelected (selectedCtId, ct) {
  return selectedCtId === ct.sys.id;
}
