import createTaskPermissionChecker, {
  createProhibitive as createProhibitiveTaskPermissionChecker,
  MissingCurrentUserError
} from './TaskPermissionChecker.es6';

describe('TaskPermissionChecker', () => {
  describe('create()', () => {
    describe('when the current user is not defined', () => {
      it('throws an error', () => {
        expect(createTaskPermissionChecker).toThrow(MissingCurrentUserError);
      });
    });

    describe('when the current user is not a valid user object', () => {
      it('throws an error', () => {
        expect(() => createTaskPermissionChecker({})).toThrow(MissingCurrentUserError);
      });
    });

    describe('when the current user is defined', () => {
      let currentUser;
      let isSpaceAdmin;
      let task;

      beforeEach(() => {
        currentUser = {
          sys: {
            type: 'Link',
            linkType: 'User',
            id: 'user-id'
          }
        };

        task = {
          sys: {},
          assignment: {}
        };

        isSpaceAdmin = jest.fn();
      });

      describe('when the current user is a space admin', () => {
        beforeEach(() => {
          isSpaceAdmin.mockReturnValue(true);
        });

        describe('canEdit()', () => {
          it('returns true', () => {
            const { canEdit } = createTaskPermissionChecker(currentUser, isSpaceAdmin);
            expect(canEdit(task)).toBe(true);
          });
        });

        describe('canUpdateStatus()', () => {
          it('returns true', () => {
            const { canUpdateStatus } = createTaskPermissionChecker(currentUser, isSpaceAdmin);
            expect(canUpdateStatus(task)).toBe(true);
          });
        });
      });

      describe('when the current user is not a space admin', () => {
        beforeEach(() => {
          isSpaceAdmin.mockReturnValue(false);
        });

        describe('canEdit()', () => {
          describe('when the current user is the task creator', () => {
            beforeEach(() => {
              task.sys.createdBy = { sys: { id: currentUser.sys.id } };
            });

            it('returns true', () => {
              const { canEdit } = createTaskPermissionChecker(currentUser, isSpaceAdmin);
              expect(canEdit(task)).toBe(true);
            });
          });

          describe('when the current user is not the task creator', () => {
            beforeEach(() => {
              task.sys.createdBy = { sys: { id: 'another-user-id' } };
            });

            it('returns false', () => {
              const { canEdit } = createTaskPermissionChecker(currentUser, isSpaceAdmin);
              expect(canEdit(task)).toBe(false);
            });
          });
        });

        describe('canUpdateStatus()', () => {
          describe('when the current user is the task creator', () => {
            beforeEach(() => {
              task.sys.createdBy = { sys: { id: currentUser.sys.id } };
            });

            it('returns false', () => {
              const { canUpdateStatus } = createTaskPermissionChecker(currentUser, isSpaceAdmin);
              expect(canUpdateStatus(task)).toBe(false);
            });

            describe('when the current user is the task assignee', () => {
              beforeEach(() => {
                task.assignment.assignedTo = { sys: { id: currentUser.sys.id } };
              });

              it('returns true', () => {
                const { canUpdateStatus } = createTaskPermissionChecker(currentUser, isSpaceAdmin);
                expect(canUpdateStatus(task)).toBe(true);
              });
            });
          });

          describe('when the current user is not the task creator', () => {
            beforeEach(() => {
              task.sys.createdBy = { sys: { id: 'another-user-id' } };
            });

            describe('when the current user is the task assignee', () => {
              beforeEach(() => {
                task.assignment.assignedTo = { sys: { id: currentUser.sys.id } };
              });

              it('returns true', () => {
                const { canUpdateStatus } = createTaskPermissionChecker(currentUser, isSpaceAdmin);
                expect(canUpdateStatus(task)).toBe(true);
              });
            });

            describe('when the current user is not the task assignee', () => {
              beforeEach(() => {
                task.assignment.assignedTo = { sys: { id: 'another-user-id' } };
              });

              it('returns false', () => {
                const { canUpdateStatus } = createTaskPermissionChecker(currentUser, isSpaceAdmin);
                expect(canUpdateStatus(task)).toBe(false);
              });
            });
          });
        });
      });
    });
  });

  describe('createProhibitive()', () => {
    const currentUser = {
      sys: {
        type: 'Link',
        linkType: 'User',
        id: 'user-id'
      }
    };

    const task = {
      sys: {
        createdBy: { sys: { id: currentUser.sys.id } }
      },
      assignment: {
        assignedTo: { sys: { id: currentUser.sys.id } }
      }
    };

    const isSpaceAdmin = () => true;

    describe('canEdit', () => {
      it('returns false', () => {
        const { canEdit } = createProhibitiveTaskPermissionChecker(currentUser, isSpaceAdmin);
        expect(canEdit(task)).toBe(false);
      });
    });

    describe('canUpdateStatus', () => {
      it('returns false', () => {
        const { canUpdateStatus } = createProhibitiveTaskPermissionChecker(
          currentUser,
          isSpaceAdmin
        );
        expect(canUpdateStatus(task)).toBe(false);
      });
    });
  });
});
