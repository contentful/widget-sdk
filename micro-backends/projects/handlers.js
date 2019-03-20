const responses = require('./responses');
const utils = require('./utils');

const { requireOrgId, requireProjectId, generateId } = utils;

const getAll = requireOrgId(async function getAll({ kv, meta: { orgId } }) {
  const projects = (await kv.get(orgId)) || {};

  return responses.ok(Object.values(projects));
});

const get = requireProjectId(async function get({ kv, meta: { orgId, projectId } }) {
  const projects = await kv.get(orgId);

  if (!projects) {
    return responses.notFound();
  }

  const project = projects[projectId];

  if (!project) {
    return responses.notFound();
  }

  return responses.ok(project);
});

const post = requireOrgId(async function post({ req, kv, meta: { orgId } }) {
  const { body: project } = req;

  if (!project) {
    return responses.badRequest();
  }

  if (!project.sys) {
    project.sys = { id: generateId() };
  }

  if (!project.name) {
    return responses.unprocessable('name is required');
  }

  const projects = (await kv.get(orgId)) || {};

  projects[project.sys.id] = project;

  await kv.set(orgId, projects);

  return responses.ok(project);
});

const del = requireProjectId(async function del({ kv, meta: { orgId, projectId } }) {
  const projects = await kv.get(orgId);

  if (!projects) {
    return responses.badRequest();
  }

  delete projects[projectId];

  await kv.set(orgId, projects);

  return responses.ok();
});

module.exports = {
  getAll,
  get,
  post,
  delete: del
};
