import _ from 'lodash';

/**
 * @param {() => Promise<void>} run
 * @param {object} options
 * @param {() => boolean} options.available
 * @param {object} extension
 *
 * @returns {Command}
 */
export function createCommand(run, options, extension) {
  const command = new Command(run, options);
  return _.extend(command, extension);
}

/**
 * @ngdoc type
 * @module cf.ui
 * @name Command
 */
function Command(run, opts) {
  if (!_.isFunction(run)) {
    throw new Error('Expected a function');
  }
  this._run = run;

  opts = _.defaults(opts || {}, {
    available: _.constant(true),
    disabled: _.constant(false),
    restricted: _.constant(false)
  });

  this.isAvailable = opts.available;
  this._isDisabled = opts.disabled;
  this._isRestricted = opts.restricted;
}

/**
 * @ngdoc method
 * @module cf.ui
 * @name Command#execute
 * @returns {Promise<void>}
 */
Command.prototype.execute = function() {
  // TODO Reject if disabled

  if (this._inProgress) {
    return this._inProgress;
  }

  const self = this;
  const handleInProgress = () => {
    self._inProgress = null;
  };

  this._inProgress = (this._run() || Promise.reject()).then(handleInProgress, handleInProgress);

  return this._inProgress;
};

/**
 * @ngdoc method
 * @module cf.ui
 * @name Command#isDisabled
 * @description
 * Returns `true` if either the command was set to disabled, it is
 * currently in progress or it is not available.
 *
 * @returns {boolean}
 */

Command.prototype.inProgress = function() {
  return !!this._inProgress;
};

Command.prototype.isDisabled = function() {
  return !!(this._isDisabled() || this._inProgress || !this.isAvailable());
};

Command.prototype.isRestricted = function() {
  return this._isRestricted();
};
