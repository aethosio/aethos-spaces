import { ioChannel } from './esb/esb';

import { ObjectReference } from './object-reference';

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

  subscribeAll() {
    this.subscriptions = new Map();
    console.log('Re-subscribing to all');
    // Iterate through the object references and re-subscribe
    this.objectRefs.forEach(objRef => {
      this.subscribe(objRef);
    });
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

  createEvent(event) {
    this.api.emit('event', event, res => {
      // console.log('Got results from Zen Spaces createEvent');
      // console.log(res);
    });
  }
}
