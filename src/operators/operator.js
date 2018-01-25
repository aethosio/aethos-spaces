/**
 * Operator base class.  Derive from this to implement your own operators.
 */
export class Operator {
  /**
   * Normally this is created indirectly through `ActionFactory#create()` after registering actions and operators.
   */
  constructor(viewModel) {
    this.viewModel = viewModel;
    this.spaces = viewModel.spaces;
  }

  execute() {
    // derived classes must implement this
  }

  /**
   * @return Promise resovles to an event type.
   */
  getEventType() {
    // This is a little brittle and requires the owning action to be set by
    // `ActionFactory.create`.  If action is null here, probably this object was created
    // improperly.
    return this.action.eventTypeBinding.objRef.get().then(() => {
      return this.action.eventType;
    });
  }
}

// TODO Move these classes to their own files

class DeleteChild extends Operator {
  constructor() {
    super(...arguments);
  }
}


class NewElement extends Operator {
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
            let event = { eventType: this.action.eventTypeName, data: {} };
            eventFactory.type.elements.forEach((element) => {
              event.data[element.name] = response.output[element.name];
            });
            // Creating an event on an object.
            event.target = this.viewModel.model.name;
            console.log(this.viewModel);
            console.log('Creating event', event, ' on ', event.target);
            this.spaces.createEvent(event);
          }
        });
    });
  }
}


class EditElement extends Operator {
  constructor() {
    super(...arguments);
  }

  execute() {
    console.log('Edit Element');
  }
}
