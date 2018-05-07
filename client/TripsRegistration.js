import { statuses } from '/imports/api/miscFunctions';

Template.TripRegistration.onCreated(function() {
  const user = Meteor.users.findOne({ _id: Session.get('showingUserId') });
  this.autorun(() => {
    Meteor.subscribe('Trips', user && user.tripId);
  });
});

Template.TripRegistration.helpers({
  status() {
    const tripId =
      Meteor.users.findOne({ _id: this._id }) &&
      Meteor.users.findOne({ _id: this._id }).tripId;
    if (tripId) {
      return statuses.completed;
    }
    return statuses.notStarted;
  },
  tripName() {
    return (
      Trips.findOne({ tripId: this.tripId }) &&
      Trips.findOne({ tripId: this.tripId }).name
    );
  },
});

Template.TripRegistration.events({
  'click #tripRegistrationFormSubmit, submit #tripRegistrationForm'(e) {
    e.preventDefault();
    console.log('Got here');
    const tripId = $("[name='trip-id']")
      .val()
      .trim();
    const updateThisId = FlowRouter.getQueryParam('id');
    Meteor.call('form.tripRegistration', tripId, updateThisId, function(
      err,
      res,
    ) {
      if (err) {
        console.error(err);
        Bert.alert({
          title: 'Error',
          message: err.reason,
          type: 'danger',
          style: 'growl-bottom-right',
          icon: 'fa-thumbs-down',
        });
      } else {
        Bert.alert({
          title: 'Registered',
          message: 'Ok, you are registered for this trip.',
          type: 'success',
          style: 'growl-bottom-right',
          icon: 'fa-thumbs-up',
        });
        location.reload();
      }
    });
  },
  'click .change-trip'() {
    Meteor.call(
      'moveCurrentTripToOtherTrips',
      Session.get('showingUserId'),
      function(err, res) {
        if (err) console.error(err);
        else {
          Bert.alert({
            title: 'Old trip removed',
            message: 'Ok, you can now register for a new trip.',
            type: 'success',
            style: 'growl-bottom-right',
            icon: 'fa-thumbs-up',
          });
          location.reload();
        }
      },
    );
  },
});
