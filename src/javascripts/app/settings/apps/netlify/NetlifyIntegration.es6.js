import { cloneDeep, get } from 'lodash';

import * as NetlifyClient from './NetlifyClient.es6';

export async function install(config, appsClient, accessToken) {
  config = cloneDeep(config);
  validateSiteConfigs(config.sites);

  // Create build hooks for all sites.
  const buildHookPromises = config.sites.map(siteConfig => {
    return NetlifyClient.createBuildHook(siteConfig.netlifySiteId, accessToken);
  });

  const buildHooks = await Promise.all(buildHookPromises);

  // Merge build hook details to configurations.
  config.sites = config.sites.map((siteConfig, i) => {
    const hook = buildHooks[i];
    return { ...siteConfig, buildHookUrl: hook.url, buildHookId: hook.id };
  });

  // Save configuration and return updated config.
  await appsClient.save('netlify', config);

  return config;
}

export async function update(config, appsClient, accessToken) {
  config = cloneDeep(config);
  validateSiteConfigs(config.sites);

  // Remove existing build hooks
  config.sites = config.sites.map(siteConfig => {
    siteConfig = { ...siteConfig };
    delete siteConfig.buildHookUrl;
    delete siteConfig.buildHookId;
    return siteConfig;
  });

  await removeExistingBuildHooks(appsClient, accessToken);

  // Proceed as in the installation step.
  return install(config, appsClient, accessToken);
}

export async function uninstall(appsClient, accessToken) {
  await removeExistingBuildHooks(appsClient, accessToken);

  return appsClient.remove('netlify');
}

function validateSiteConfigs(siteConfigs) {
  // Find all site configurations with incomplete information.
  const incomplete = siteConfigs.filter(siteConfig => {
    return !siteConfig.netlifySiteId || !siteConfig.name;
  });

  if (incomplete.length > 0) {
    const err = new Error('Pick a Netlify site and provide a name for all configurations.');
    err.useMessage = true;
    throw err;
  }
}

async function removeExistingBuildHooks(appsClient, accessToken) {
  // Fetch the current remote version of configuration and...
  const remote = await appsClient.get('netlify');
  const siteConfigs = get(remote, ['config', 'sites'], []);

  // ...remove build hooks for it.
  const buildHookRemovalPromises = siteConfigs.map(siteConfig => {
    const { netlifySiteId, buildHookId } = siteConfig;
    if (netlifySiteId && buildHookId) {
      return NetlifyClient.deleteBuildHook(netlifySiteId, buildHookId, accessToken);
    } else {
      return Promise.resolve();
    }
  });

  try {
    await Promise.all(buildHookRemovalPromises);
  } catch (err) {
    // Failed removing some build hooks.
    // We can live with that.
  }
}
