import { ZenSpaces } from './zen-spaces';
import { ActionFactory } from './action-factory';

import { inject } from 'aurelia-framework';

@inject(ZenSpaces, ActionFactory)
export class TypeRegistry {
  constructor(spaces, actionFactory) {
    this.spaces = spaces;
    this.actionFactory = actionFactory;
    this.typeRefs = new Map();
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

  // TODO This is actually binding to a factory and not the type, which sucks
  // if you need the type.
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
          model.create = () => {
            // Create a new object based on this type
            let newObject = { _type: model.type };
            model.type.elements.forEach((element) => {
              newObject[element.name] = element.defaultValue;
            });
            return newObject;
          };
          // TODO Could be handy if actions were indexed
          model.actions = [];
          model.collectionType.actions.forEach((actionData) => {
            let action = this.actionFactory.create(actionData, viewModel);
            model.actions.push(action);
          });
        }
      }
    });
    objRef.push();
    return binding;
  }
}
