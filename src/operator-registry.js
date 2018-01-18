export class OperatorRegistry {
  constructor() {
    // TODO These should be registered in index.js during configure()
    this.operators = new Map();
    // {
    //   newChild: NewChild,
    //   deleteChild: DeleteChild,
    //   newElement: NewElement,
    //   editElement: EditElement
    // };
  }
  
  register(operatorName, operatorType) {
    // TODO Verify that operatorType extends Operator
    this.operators.set(operatorName, operatorType);
  }

  /**
   *
   * This should not be called directly, but rather should be called via the `ActionFactory.create`
   *
   * All Operator assume `action` element has been set.
   */
  create(operator, viewModel) {
    return new this.operators.get(operator)(viewModel);
  }
}

