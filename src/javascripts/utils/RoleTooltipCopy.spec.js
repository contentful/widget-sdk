import { getRolesTooltip } from './RoleTooltipCopy';

describe('utils/getRolesTooltip', () => {
  it('should return text for a plan with the admin role only', () => {
    const tooltip = getRolesTooltip(1, { roles: [] });
    expect(tooltip).toBe(`This space type includes the Admin role only`);
  });

  it('should return text for a plan with various roles', () => {
    const tooltip = getRolesTooltip(3, { roles: ['Editor', 'Translator'] });
    expect(tooltip).toBe(`This space type includes the Admin, Editor, and Translator roles`);
  });

  it('should return text for a plan with multiple translator roles', () => {
    const tooltip = getRolesTooltip(5, {
      roles: ['Editor', 'Translator', 'Translator 2', 'Translator3'],
    });
    expect(tooltip).toBe(`This space type includes the Admin, Editor, and 3 Translator roles`);
  });

  it('should return text for a plan with custom roles', () => {
    const tooltip = getRolesTooltip(10, { roles: ['Editor', 'Translator'] });
    expect(tooltip).toBe(
      `This space type includes the Admin, Editor, and Translator roles and an additional 7 custom roles`
    );
  });
});
