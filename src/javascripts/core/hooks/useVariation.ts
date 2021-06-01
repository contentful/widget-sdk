import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { FLAGS, getVariation } from 'LaunchDarkly';
import { useCallback } from 'react';
import { useAsync } from './useAsync';

/**
 * Evaluates a flag and returns its variation
 *
 * @param flag Flag to evaluate
 * @param fallback Value to return while the flag hasn't been evaluated yet
 * @returns [variation, loading]: The evaluated variation and `true` or the `fallback` value and `false`
 */
export function useVariation<Value>(flag: FLAGS, fallback?: Value): [Value | undefined, boolean] {
  const { currentEnvironmentId, currentSpaceId, currentOrganizationId } = useSpaceEnvContext();

  const getVariationWithOptions = useCallback(
    () =>
      getVariation(flag, {
        organizationId: currentOrganizationId,
        spaceId: currentSpaceId,
        environmentId: currentEnvironmentId,
      }),
    [flag, currentOrganizationId, currentSpaceId, currentEnvironmentId]
  );

  const state = useAsync<Value>(getVariationWithOptions);

  return [state.data ?? fallback, state.isLoading];
}
