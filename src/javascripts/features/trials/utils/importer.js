// eslint-disable-next-line import/no-default-export
export default async function importer() {
  return await import(
    /* webpackChunkName: "experience-provisioning" */ '@contentful/experience-provisioning'
  );
}
