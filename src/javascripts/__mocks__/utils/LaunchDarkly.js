export const init = jest.fn();

export const getCurrentVariation = jest.fn().mockResolvedValue(true);

export const onFeatureFlag = jest.fn();

export const onABTest = jest.fn();
