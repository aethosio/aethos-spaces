/**
 * Collection Registry
 *
 * Use this singleton to bind a Zen Spaces collection to a view model.
 */
export class CollectionRegistry {
  /**
   * This singleton is accessed via `ZenSpaces#collectionRegistry`.
   *
   * @private
   */
  constructor(spaces) {
    this.spaces = spaces;
    this.objRefs = new Map();
  }

  get typeRegistry() {
    return this.spaces.typeRegistry;
  }

  resolve(collectionName, fields) {
    if (!this.objRefs.has(collectionName)) {
      fields = fields || 'name';
      let query = `{ ${collectionName} { type children { ${fields} } } }`;
      let objRef = this.spaces.resolve({ query });
      this.objRefs.set(collectionName, objRef);
      return objRef;
    }
    return this.objRefs.get(collectionName);
  }

  /**
   * Bind a collection to a view model.
   *
   * @param {object} viewModel target for the binding
   * @param {string} collectionName name of the collection to bind
   * @param {string} fields partial graphQL query identifying which fields within
   *  the children of this collection should be bound.
   *
   * TODO ObjectReference.bind also supports a params object; fields should probably
   * be incorporated with that so as to have a way to support translation, mapping,
   * etc instead of just support a list of field names.
   */
  bind(viewModel, collectionName, fields) {
    let objRef = this.resolve(collectionName, fields);
    let binding = objRef.bind(viewModel, {
      translate: (newValue, model, binding) => {
        if (newValue.errors) {
          // TODO This should be done upstream
          console.error(newValue.errors);
        }
        else {
          let collectionTypeName = newValue.data[collectionName].type;
          if (model.collectionTypeName != collectionTypeName) {
            if (binding.typeBinding) {
              binding.typeBinding.dispose();
            }
            binding.typeBinding = this.typeRegistry.bind(viewModel, collectionTypeName);
          }
          model.collectionTypeName = collectionTypeName;
          // TODO 'list' can be the default but there should be a way to override it
          model.list = newValue.data[collectionName].children;
        }
      },
      dispose: (binding) => {
        if (binding.typeBinding) {
          binding.typeBinding.dispose();
          binding.typeBinding = null;
        }
      },
      push: (model, binding) => {
        if (binding.typeBinding) {
          binding.typeBinding.objRef.push();
        }
        else {
          binding.typeBinding = this.typeRegistry.bind(viewModel, model.collectionTypeName);
        }
      }
    });
    objRef.push();
    return binding;
  }
}
