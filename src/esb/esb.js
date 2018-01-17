// TODO Eventually this should be extracted into it's own library
import io from 'socket.io-client';

export function ioChannel(namespace) {
  let path = window.location.pathname;
  let hash = path.indexOf('#');
  if (hash > 0) {
    path = path.slice(0, hash);
  }
  return io(path + `socket.io${namespace}`, {
    path: window.location.pathname + 'socket.io',
    transports: ['polling']
  });
}

export class ServiceBus {

}
