// TODO Eventually this should be extracted into it's own library
import { ioChannel } from 'esb/esb';

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
class ObjectReference {

  constructor(space, uri) {
    this.space = space;
    this.uri = uri;
    this.consumers = [];
    this.binds = [];
  }

  /**
   * Bind the object ref to a view model
   * 
   * @param params - Eventually should including mapping instructions, but the
   *          should be ok for now.
   * 
   * @return (Binding) disposable publisher, which should be used to dispose of the binding and used to 
   *  subscribe to 
   */
  bind(viewModel, params) {
    // TODO Create a Binding class
    let binding = new ObjRefBinding(viewModel, params, this);
    // let binding = {
    //   viewModel,
    //   params,
    //   objRef: this,
    //   consumer: []
    // };
    // params = params || {};
    this.binds.push(binding);
    // binding.dispose = () => {
    //   let idx = this.binds.indexOf(binding);
    //   if (idx > -1) {
    //     this.binds.splice(idx, 1);
    //   }
    //   if (binding.params.dispose) {
    //     binding.params.dispose(binding, viewModel);
    //   }
    // };
    // binding.subscribe = (func) => {
    //   binding.consumers.push(func);
    // };
    // binding.notify = (func) => {

    // }
    return binding;
  }

  /**
   * Dispose of a binding;  normally you should not call this directly.  Instead,
   * retain the binding object returned from bind() and call the dispose method on
   * that object.
   */
  disposeBinding(binding) {
    let idx = this.binds.indexOf(binding);
    if (idx > -1) {
      this.binds.splice(idx, 1);
    }
    if (binding.params.dispose) {
      binding.params.dispose(binding, binding.viewModel);
    }
  }

  /**
   * Push to bound items
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
      for (let property in this.object) {
        if (this.object.hasOwnProperty(property)) {
          binding.viewModel[property] = this.object[property];
        }
      }
      binding.notify();
    }));
  }

  publish(newValue) {
    this.value = newValue;
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
    return new Promise((resolve, reject) => {
      let func = (value) => {
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
    let index = this.consumers.indexOf(func);
    if (index > -1) {
      this.consumers.splice(index, 1);
    }
  }

  /**
   * @return boolean
   **/
  canDestroy() {
    return this.consumers.isEmpty();
  }
}

export class ZenSpaces {
  constructor() {
    console.log('Constructed ZenSpaces object (should be singleton!');
    this.connected = false;
    this.objectRefs = [];
    this.subscriptions = new Map();
    this.api = ioChannel('/api/spaces');
    this.api.on('connect', () => {
      console.log('Connected to Zen Spaces');
      this.handShake().then(() => {
        this.connected = true;
        this.subscribeAll();
      });
    });
    this.api.on('reconnect', () => {
        console.log('Reconnected to Zen Spaces');
        // TODO Need to clean up subscriptions
      })
      .on('disconnect', () => {
        this.connected = false;
        console.log('disconnected from Zen Spaces');
      });
    this.api.on('event', this.onEvent.bind(this));
    this.api.on('publish', this.publish.bind(this));
  }

  handShake() {
    return new Promise((resolve, reject) => {
      this.api.emit('hello', res => {
        console.log(res);
        resolve(res);
      });
    });
  }

  resolve(uri) {
    let objRef = new ObjectReference(this, uri);
    this.objectRefs.push(objRef);
    if (this.connected) {
      this.subscribe(objRef);
    }
    return objRef;
  }

  subscribe(objRef) {
    let path = this.getPath(objRef.uri);
    this.api.emit('subscribe', path, res => {
      // console.log('Got results from Zen Spaces subscription');
      // console.log(res);
      if (res.error) {
        console.error(res.error);
      }
      else {
        this.subscriptions.set(res.id, { objRef });
        objRef.publish(res);
      }
    });
  }

  subscribeAll() {
    this.subscriptions = new Map();
    console.log('Re-subscribing to all');
    // Iterate through the object references and re-subscribe
    this.objectRefs.forEach(objRef => {
      this.subscribe(objRef);
    });
  }

  onEvent(event) {
    //console.log(`got event from Zen Spaces: ${event}`);
  }

  publish(newValue) {
    console.log('got publish event from Zen Spaces: ', newValue);
    this.subscriptions.get(newValue.id).objRef.publish(newValue);
  }

  getPath(uri) {
    // TODO Implement; for now it's just a string
    return uri;
  }

  createEvent(event) {
    this.api.emit('event', event, res => {
      // console.log('Got results from Zen Spaces createEvent');
      // console.log(res);
    });
  }
}
