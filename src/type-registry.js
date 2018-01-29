/**
 * Type Registry
 *
 * Contains the type definitions / meta data of types in the Zen Spaces database.
 *
 */
export class TypeRegistry {
  /**
   * Use `ZenSpaces#typeRegistry` to get the singleton instance of this registry.
   * @private
   */
  constructor(spaces, actionFactory) {
    this.spaces = spaces;
    this.typeRefs = new Map();
  }

  get actionFactory() {
    return this.spaces.actionFactory;
  }

  resolve(typeName) {
    if (!this.typeRefs.has(typeName)) {
      let query = `
      {
        types {
          children(name:"${typeName}") {
            name
            elements { name defaultValue type }
            properties { name value }
            actions {
              name
              operator
              preConditions
              eventType
            }
          }
        }
      }`;
      let typeRef = this.spaces.resolve({ query });
      this.typeRefs.set(typeName, typeRef);
      return typeRef;
    }
    return this.typeRefs.get(typeName);
  }

  /**
   * @return Promise resolves to the type specified by `typeName`.
   */
  get(typeName) {
    return this.resolve(typeName).get();
  }

  /**
   * Bind a viewModel to the specified type.
   *
   * @param {object} viewModel target of the bind
   * @param {string} typeName name of the type being bound
   */
  bind(viewModel, typeName) {
    let objRef = this.resolve(typeName);
    let binding = objRef.bind(viewModel, {
      translate: (newValue, model, binding) => {
        if (newValue.errors) {
          // TODO This should be done upstream
          console.error(newValue.errors);
        }
        else {
          model.type = newValue.data.types.children[0];
          if (!model.type) {
            console.log(`Cannot find type ${typeName}`);
          }
          model.create = (newModel) => {
            // Create a new object based on this type
            newModel = newModel || {};
            let newObject = { _type: model.type };
            model.type.elements.forEach((element) => {
              if (newModel.hasOwnProperty(element.name)) {
                newObject[element.name] = newModel[element.name];
              }
              else {
                newObject[element.name] = element.defaultValue;
              }
            });
            return newObject;
          };
          model.actions = new Map();
          if (model.type && model.type.actions) {
            model.type.actions.forEach((actionData) => {
              let action = this.actionFactory.create(actionData, viewModel);
              model.actions.set(action.operatorName, action);
            });
          }
        }
      }
    });
    objRef.push();
    return binding;
  }
}
