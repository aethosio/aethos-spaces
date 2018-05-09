import { ObjectEditorDialog } from 'editors/object-editor-dialog';
import { Operator } from './operator';

export class NewChild extends Operator {
  constructor() {
    super(...arguments);
  }

  execute() {
    return this.getEventType().then((eventFactory) => {
      console.log('Executing new child operator');

      this.newObject = eventFactory.create();

      this.viewModel.dialogService.open({ viewModel: ObjectEditorDialog, model: this.newObject, lock: false })
        .whenClosed(response => {
          if (!response.wasCancelled) {
            // Copy the response into an event
            const event = { eventType: this.action.eventTypeName, data: {} };
            eventFactory.type.elements.forEach((element) => {
              event.data[element.name] = response.output[element.name];
            });
            // Creating an event on an object.
            event.target = this.viewModel.model.name;
            console.log('Creating event', event, ' on ', event.target);
            this.spaces.createEvent(event);
          }
        });
    });
  }
}
