import { BasePlan } from 'features/pricing-entities';
import { ProductRatePlan } from 'features/pricing-entities';
import { FreeSpaceResource, Space } from 'features/space-purchase';

export enum StepStatus {
  FAILED = 'failed',
  RUNNING = 'running',
  COMPLETED = 'completed',
}

export enum FlowType {
  CREATION = 'creation',
  ASSIGN = 'assign_plan_to_space',
}

export type PlansData = {
  freePlan: BasePlan;
  freeSpaceResource: FreeSpaceResource;
  space?: Space;
  plans: Array<BasePlan>;
  ratePlans: Array<ProductRatePlan>;
};

export type Resource = {
  limits: {
    included: number;
    maximum: number;
  };
  name: string;
  period: string;
  sys: {
    type: 'OrganizationResource' | 'SpaceResource';
    id: string;
  };
  unitOfMeasure: string;
  usage: number;
};
