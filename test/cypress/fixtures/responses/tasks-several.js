import { Matchers } from '@pact-foundation/pact-web';
import { RESOURCE_ID_REGEXP } from '../../../../src/javascripts/data/utils';
import severalTasks from './tasks-several.json';

export const severalTasksDefinition = {
  ...severalTasks,
  items: severalTasks.items.map(task => ({
    ...task,
    sys: {
      ...task.sys,
      id: Matchers.term({
        generate: task.sys.id,
        matcher: RESOURCE_ID_REGEXP.source
      }),
      createdAt: Matchers.iso8601DateTimeWithMillis(task.sys.createdAt),
      updatedAt: Matchers.iso8601DateTimeWithMillis(task.sys.updatedAt)
    }
  }))
};

export const getTaskDefinitionById = taskId =>
  severalTasksDefinition.items.find(taskDefinition => taskDefinition.sys.id.getValue() === taskId);
