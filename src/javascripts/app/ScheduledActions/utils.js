/**
 * Takes an array of jobs and returns only those relevant for a certain entity (entry).
 *
 * @param {API.Job[]} jobs
 * @param {string} entityType
 * @param {string} entityId
 * @returns {API.Job[]} jobs
 */
export function filterRelevantJobsForEntity(jobs, entityType, entityId) {
  return jobs.filter(
    job => job.entity && job.entity.sys.linkType === entityType && job.entity.sys.id === entityId
  );
}

/**
 * Returns a copy of a given array of jobs sorted by relevance with the most relevant
 * one leading.
 *
 * @param jobs
 * @returns {API.Job[]}
 */
export function sortJobsByRelevance(jobs) {
  return jobs.slice().sort((a, b) => {
    const dateA = new Date(a.scheduledFor.datetime);
    const dateB = new Date(b.scheduledFor.datetime);
    return dateA < dateB ? -1 : dateA > dateB ? 1 : 0;
  });
}
