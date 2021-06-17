import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { getVariation } from './LaunchDarkly';
import { FLAGS } from './flags';
import { useCallback } from 'react';
import { useAsync } from 'core/hooks/useAsync';

/**
 * Evaluates a flag and returns its variation
 *
 * @param flag Flag to evaluate
 * @param fallback Value to return while the flag hasn't been evaluated yet
 * @returns [variation, loading]: The evaluated variation and `true` or the `fallback` value and `false`
 */
export function useFeatureFlag<Value>(flag: FLAGS, fallback?: Value): [Value | undefined, boolean] {
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
