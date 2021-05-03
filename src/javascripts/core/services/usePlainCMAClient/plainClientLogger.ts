import type { ClientParams } from 'contentful-management';
import { getEndpoint, getCurrentState } from 'data/Request/Utils';
import * as Telemetry from 'i13n/Telemetry';

export const requestLogger: ClientParams['requestLogger'] = (request) => {
  if (request instanceof Error) {
    return;
  }
  if (!request.url) {
    return;
  }
  Telemetry.count('cma-req', {
    endpoint: getEndpoint(request.url),
    state: getCurrentState(),
    version: 4,
    source: undefined,
  });
};

type Response = Exclude<Parameters<Exclude<ClientParams['responseLogger'], undefined>>[0], Error>;

export const responseLogger: ClientParams['responseLogger'] = (result) => {
  if (!(result instanceof Error)) {
    return;
  }

  //@ts-expect-error mute missing result.response on Error
  const response = result.response as Response;

  if (response.status === 429 && response.request?.responseURL) {
    Telemetry.count('cma-rate-limit-exceeded', {
      endpoint: getEndpoint(response.request?.responseURL),
      state: getCurrentState(),
      version: 4,
    });
  }
};
