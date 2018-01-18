import { ZenSpaces } from './zen-spaces';
import { TypeRegistry } from './type-registry';

import { inject } from 'aurelia-framework';


@inject(ZenSpaces, TypeRegistry)
export class CollectionRegistry {
  constructor(spaces, typeRegistry) {
    this.spaces = spaces;
    this.typeRegistry = typeRegistry;
    this.objRefs = new Map();
  }

  resolve(collectionName) {
    if (!this.objRefs.has(collectionName)) {
      let query = `{ ${collectionName} { type children { name } } }`;
      let objRef = this.spaces.resolve({ query });
      this.objRefs.set(collectionName, objRef);
      return objRef;
    }
    return this.objRefs.get(collectionName);
  }

  bind(viewModel, collectionName) {
    let objRef = this.resolve(collectionName);
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
