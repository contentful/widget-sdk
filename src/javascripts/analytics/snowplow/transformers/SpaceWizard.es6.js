import { addUserOrgSpace } from './Decorators';

const SpaceWizardTransformer = addUserOrgSpace((eventName, data) => {
  const action = eventName.split(':')[1];
  const wizardData = getSpaceWizardData(data, action);

  return {
    data: wizardData
  };
});

export default SpaceWizardTransformer;

export function getSpaceWizardData (data, action) {
  const wizardData = {
    intended_action: data.action === 'change' ? 'change_space_type' : 'create',
    current_space_type: data.currentSpaceType || null,
    action: action,
    payment_details_exist: data.paymentDetailsExist,
    current_step: data.currentStep
  };

  if (data.spaceType) {
    wizardData.target_space_type = data.spaceType;
  }
  if (data.spaceName) {
    wizardData.space_name = data.spaceName;
  }
  if (data.template) {
    wizardData.space_template_id = data.template;
  }
  if (action === 'navigate') {
    wizardData.target_step = data.targetStep;
  }
  if (data.action === 'change') {
    wizardData.current_space_type = data.currentSpaceType;
  }

  return wizardData;
}
