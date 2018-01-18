class ObjRefBinding {
  constructor(viewModel, params, objRef) {
    this.viewModel = viewModel;
    this.params = params || {};
    this.objRef = objRef;
    this.consumers = [];
  }

  dispose() {
    this.objRef.disposeBinding(this);
  }

  subsribe(func) {
    this.consumers.push(func);
  }

  notify() {
    this.consumers.forEach((func) => {
      func();
    });
  }
}

/**
 * Reference to an object
 *
 * Resolve an object by using a space.resolve(uri);
 *
 **/
export class ObjectReference {

  constructor(space, uri) {
    this.space = space;
    this.uri = uri;
    this.consumers = [];
    this.binds = [];
  }

  /**
   * Bind this object reference to a view model
   *
   * @param {Object} viewModel - bind target
   * @param {Object} [params] - Eventually should including mapping instructions, but the
   *          should be ok for now.
   *
   * @return {ObjRefBinding} disposable publisher, which should be used to dispose of the binding and used to
   *  subscribe to
   */
  bind(viewModel, params) {
    // TODO Create a Binding class
    const binding = new ObjRefBinding(viewModel, params, this);
    this.binds.push(binding);
    return binding;
  }

  /**
   * Dispose of a binding;  normally you should not call this directly.  Instead,
   * retain the binding object returned from bind() and call the dispose method on
   * that object.
   *
   * @param {ObjRefBinding} binding to dispose
   * @returns {undefined}
   *
   */
  disposeBinding(binding) {
    const idx = this.binds.indexOf(binding);
    if (idx > -1) {
      this.binds.splice(idx, 1);
    }
    if (binding.params.dispose) {
      binding.params.dispose(binding, binding.viewModel);
    }
  }

  /**
   * Push notification to bound items
   *
   * @returns {Promise} resolves when bound items have been notified.
   */
  push() {
    return Promise.all(this.binds.map((binding) => {
      if (!this.value) {
        return;
      }
      if (binding.params.translate) {
        this.object = this.object || {};
        binding.params.translate(this.value, this.object, binding);
      }
      else {
        this.object = this.value;
      }
      if (binding.params.push) {
        binding.params.push(this.object, binding);
      }
      // Copy all of the elements (shallow copy; should it be deep?)
      for (const property in this.object) {
        if (this.object.hasOwnProperty(property)) {
          binding.viewModel[property] = this.object[property];
        }
      }
      binding.notify();
    }));
  }

  publish(newValue) {
    this.value = newValue;
    // TODO possibly shhould handle errors here?  Or handle upstream?
    // TODO log errors if newValue.errors
    return Promise.all(this.consumers.map(consumer => {
      // TODO Possibly the return value of the consumer can indicate if the
      // subscription should be cancelled?
      return consumer(newValue);
    })).then(() => {
      // Publish bound view models
      return this.push();
    });
  }

  subscribe(func) {
    // TODO This must return a disposable in order to clean up the subscriptions
    this.consumers.push(func);
    if (this.value) {
      func(this.value);
    }
  }

  /**
   * One time getter to get the value of the object this references.
   *
   * @return {Promise} resolves to the object
   **/
  get() {
    return new Promise((resolve) => {
      const func = (value) => {
        this.unsubscribe(func);
        resolve(value);
      };

      this.subscribe(func);
    });
  }

  unsubscribeAll() {
    this.consumers = [];
  }

  unsubscribe(func) {
    const index = this.consumers.indexOf(func);
    if (index > -1) {
      this.consumers.splice(index, 1);
    }
  }

  /**
   * @returns {boolean}
   **/
  canDestroy() {
    return this.consumers.isEmpty();
  }
}
