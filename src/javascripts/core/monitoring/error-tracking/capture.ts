import { getCurrentStateName } from 'states/Navigator';
import {
  CaptureContext,
  captureException,
  Scope,
  Severity,
  withScope,
} from '@contentful/experience-error-tracking';

const getTags = () => ({
  route: getCurrentStateName(),
});

const withLevel = (level: Severity) => (error: Error, captureContext?: CaptureContext) => {
  // @ts-expect-error mute Scope type is incompatible
  withScope((scope: Scope) => {
    scope.setLevel(level);
    scope.setTags(getTags());
    scope.setExtras(error as Record<string, any>);

    // @ts-expect-error mute captureContext
    captureException(error, captureContext);
  });
};

export const captureError = withLevel(Severity.Error);

export const captureWarning = withLevel(Severity.Warning);
