/**
 * Operator Registry
 *
 * Registers and constructs operators that construct a spaces event that manipulates a spaces object.
 *
 */
export class OperatorRegistry {
  /**
   * Use ZenSpaces#operatorRegistry
   *
   * @private
   */
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
   * This should not be called directly, but rather should be called via `ActionFactory.create`
   *
   * All Operator assume `action` element has been set.
   *
   * @param {string} operatorName - operator name
   * @param {object} viewModel - must have a public member `spaces` that returns the Zen Spaces connection instance.
   */
  create(operatorName, viewModel) {
    return new this.operators.get(operatorName)(viewModel);
  }
}
