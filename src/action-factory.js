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

export class Action {
  constructor(actionData, operator, container) {
    this.container = container;
    this.displayName = actionData.name;
    this.preConditions = actionData.preConditions;
    this.disabled = this.isActionDisabled.bind(this);
    this.operator = operator;
    this.action = this.operator.execute.bind(this.operator);
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
