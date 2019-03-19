const responses = require('./responses');
const utils = require('./utils');

const { requireOrgId, requireProjectId, validate, generateId } = utils;

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
  const { body } = req;

  if (!body) {
    return responses.badRequest();
  }

  const project = body;
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

const put = requireProjectId(async function put({
  req,
  kv,
  dependencies: { lodash: _ },
  meta: { orgId, projectId }
}) {
  const allowedKeys = [
    'name',
    'description',
    'spaceIds',
    'memberIds',
    'links',
    'platforms',
    'sections'
  ];

  const { body } = req;

  if (!body) {
    return responses.badRequest();
  }

  const projects = await kv.get(orgId);

  if (!projects) {
    return responses.badRequest();
  }

  const project = projects.find(p => p.sys.id === projectId);

  if (!project) {
    return responses.badRequest();
  }

  // Validate each key
  for (const key of allowedKeys) {
    if (!body[key]) {
      continue;
    }

    const validationMessage = validate(key, body[key]);

    if (validationMessage) {
      return responses.unprocessable(`${key} is invalid: ${validationMessage}`);
    }

    project[key] = body[key];
  }

  const updatedProjects = projects.map(p => {
    if (p.sys.id === projectId) {
      return project;
    } else {
      return p;
    }
  });

  await kv.set(orgId, updatedProjects);

  return responses.ok(project);
});

const del = requireProjectId(async function del({ kv, meta: { orgId, projectId } }) {
  const projects = await kv.get(orgId);

  if (!projects) {
    return responses.badRequest();
  }

  const project = projects.find(p => p.sys.id === projectId);

  if (!project) {
    return responses.badRequest();
  }

  const updatedProjects = projects.filter(p => p.sys.id !== projectId);

  await kv.set(orgId, updatedProjects);

  return responses.ok();
});

module.exports = {
  getAll,
  get,
  post,
  put,
  delete: del
};
