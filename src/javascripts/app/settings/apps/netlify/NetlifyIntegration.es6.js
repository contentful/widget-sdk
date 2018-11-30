import { cloneDeep, get, uniqBy } from 'lodash';

import * as NetlifyClient from './NetlifyClient.es6';

export async function install(config, appsClient, accessToken) {
  config = prepareConfig(config);

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
  config = prepareConfig(config);

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

function prepareConfig(config) {
  config = cloneDeep(config);
  config.sites = config.sites.map(siteConfig => {
    return { ...siteConfig, name: (siteConfig.name || '').trim() };
  });

  validateSiteConfigs(config.sites);

  return config;
}

function validateSiteConfigs(siteConfigs) {
  // At least one site needs to be configured.
  if (siteConfigs.length < 1) {
    throw makeError('Provide at least one site configuration.');
  }

  // Find all site configurations with incomplete information.
  const incomplete = siteConfigs.filter(siteConfig => {
    return !siteConfig.netlifySiteId || siteConfig.name.length < 1;
  });

  if (incomplete.length > 0) {
    throw makeError('Pick a Netlify site and provide a name for all configurations.');
  }

  // Display names must be unique.
  const uniqueNames = uniqBy(siteConfigs, config => config.name);

  if (uniqueNames.length !== siteConfigs.length) {
    throw makeError('Display names must be unique.');
  }
}

function makeError(message) {
  const err = new Error(message);
  err.useMessage = true;
  return err;
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
