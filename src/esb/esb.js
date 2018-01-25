import io from 'socket.io-client';

export function ioChannel(namespace) {
  // let path = window.location.pathname;
  // let hash = path.indexOf('#');
  // if (hash > 0) {
  //   path = path.slice(0, hash);
  // }
  // When hosted by AethOS, the spaces socket is root, not relative to the current URL.
  // TODO Need to be able to detect this (or configure this)
  let path = '/';
  return io(path + `socket.io${namespace}`, {
    path: path + 'socket.io',
    transports: ['polling']
  });
}

export class ServiceBus {

}
