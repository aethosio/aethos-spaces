import { ioChannel } from './esb/esb';
import { TypeRegistry } from './type-registry';
import { OperatorRegistry } from './operator-registry';
import { ActionFactory } from './action-factory';
import { ObjectReference } from './object-reference';
import { CollectionRegistry } from './collection-registry';

let $zenSpacesInstance = null;

export class ZenSpaces {
  constructor(api) {
    if ($zenSpacesInstance) {
      throw new Error('Attempting to construct another ZenSpaces (should be a singleton!');
    }
    $zenSpacesInstance = this;
    this.connected = false;
    this.objectRefs = [];
    this.subscriptions = new Map();
    this.api = api || ioChannel('/api/spaces');
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

    this.operatorRegistry = new OperatorRegistry();
    this.typeRegistry = new TypeRegistry(this);
    this.actionFactory = new ActionFactory(this);
    this.collectionRegistry = new CollectionRegistry(this);
  }

  handShake() {
    return new Promise((resolve) => {
      this.api.emit('hello', res => {
        console.log(res);
        resolve(res);
      });
    });
  }

  resolve(uri) {
    const objRef = new ObjectReference(this, uri);
    this.objectRefs.push(objRef);
    if (this.connected) {
      this.subscribe(objRef);
    }
    return objRef;
  }

  subscribe(objRef) {
    const path = this.getPath(objRef.uri);
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

  /**
   * (re) subscribe to all known objects.
   *
   * Probably this should be a private method; it's generally only performed
   * after having been disconnected from Zen Spaces and reconnecting.
   */
  subscribeAll() {
    this.subscriptions = new Map();
    console.log('Re-subscribing to all');
    // Iterate through the object references and re-subscribe
    this.objectRefs.forEach(objRef => {
      this.subscribe(objRef);
    });
  }

  /**
   * Bind a Zen Spaces object to a view model
   *
   * @param {Object} viewModel
   * @param {Object} params
   * @param {string} params.oid Object Id to bind
   * @param {string} params.type Type of object to bind; the binding will fail
   *  if this type is specified and the resulting object is not of the specified
   *  type.
   */
  bind(viewModel, params) {
    let objRef = this.resolve({ oid: params.oid, type: params.type });
    let binding = objRef.bind(viewModel, {
      translate: (newValue, model, binding) => {
        if (newValue.errors) {
          // TODO This should be done upstream
          console.error(newValue.errors);
        }
        else {
          for (const key in newValue) {
            // Strip out the private members (probably should be stripped on the server)
            if (key.findIndex('_') !== 0) {
              viewModel[key] = newValue[key];
            }
          }
        }
      }
    });
    return binding;
  }

  onEvent(event) {
    // TODO Finish implementation
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

  createEvent(eventData) {
    let event = {
      eventType: eventData._type.name,
      data: eventData
    };
    delete event.data._type;
    // TODO support target
    this.api.emit('event', event, res => {
      // console.log('Got results from Zen Spaces createEvent');
      // console.log(res);
    });
  }
}
