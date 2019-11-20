import { Matchers } from '@pact-foundation/pact-web';
import { RESOURCE_ID_REGEXP } from '../../../../src/javascripts/data/utils';
import severalTasks from './tasks-several.json';
// TODO: Remove severalTasksDeprecated once server side is updated
import severalTasksDeprecated from './tasks-several-deprecated.json';

const definition = tasks => ({
  ...tasks,
  items: tasks.items.map(task => ({
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
});

export const severalTasksDefinition = (deprecated = false) =>
  definition(deprecated ? severalTasksDeprecated : severalTasks);
// TODO: Remove deprecated param once server side is updated
export function getTaskDefinitionById(taskId, deprecated = false) {
  return severalTasksDefinition(deprecated).items.find(
    taskDefinition => taskDefinition.sys.id.getValue() === taskId
  );
}
