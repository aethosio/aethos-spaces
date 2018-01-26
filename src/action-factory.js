/**
 * Action Factory
 *
 * Constructs Action objects that are bound to an Operator.
 *
 */
export class ActionFactory {
  /**
   * Use ZenSpaces#actionFactory
   *
   * @private
   */
  constructor(spaces) {
    this.spaces = spaces;
  }

  get ops() {
    return this.spaces.operatorRegistry;
  }

  get typeRegistry() {
    return this.spaces.typeRegistry;
  }

  create(actionData, container) {
    let operator = this.ops.create(actionData.operator, container);
    let action = new Action(actionData, operator, container);
    action.eventTypeBinding = this.typeRegistry.bind(action.eventType, actionData.eventType);
    operator.action = action;
    return action;
  }
}

/**
 * Actions are generally used as a model for GUI elements (action buttons) that when clicked will execute.
 *
 * The model is kept separate from the operator that does the execution because generally the operator is
 * shared while the action is not shared among multiple views.  (GC - right?  I'm not clear on this)
 */
export class Action {
  constructor(actionData, operator, container) {
    this.container = container;
    this.displayName = actionData.name;
    this.operatorName = actionData.operator;
    this.preConditions = actionData.preConditions;
    this.disabled = this.isActionDisabled.bind(this);
    this.operator = operator;
    if (operator && operator.execute) {
      this.execute = this.operator.execute.bind(this.operator);
    }
    else {
      this.execute = () => {
        // TODO Throw an error?
        console.error(`Action ${this.displayName} does not have a valid operator.`);
      }
    }
    this.eventType = {};
    this.eventTypeName = actionData.eventType;
  }

  isActionDisabled() {
    if (this.preConditions) {
      // TODO Implement possible pre-conditions
      return true;
    }
    else {
      // If an action does not have any pre-conditions, it's always enabled.
      return false;
    }
  }

  dispose() {
    if (this.eventTypeBinding) {
      this.eventTypeBinding.dispose();
    }
  }
}
