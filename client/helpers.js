import moment from 'moment';

Template.registerHelper('formatTime', function(context) {
  if (context) {
    return moment( context ).format( 'MM/DD/YYYY, hh:mma' );
  }
});
Template.registerHelper('showTools', function() {
  const routeName = FlowRouter.getRouteName();
  if(routeName) return routeName.includes("admin");
});

Template.registerHelper('submitFormText', function() {
  return {
    "data-loading-text": "Processing... <i class='fa fa-spinner fa-spin'></i>",
    "data-error-text":   "Hmm...that didn't work. Please look over your form and try again <i class='fa fa-exclamation-triangle'></i>",
    "data-success-text": "Got it! <i class='fa fa-check'></i>"
  }
});

Template.registerHelper('agreed', function(e) {
  let thisForm = Forms.findOne({formName: e});
  if(thisForm && thisForm.agreed){
    Meteor.setTimeout(()=>{
      $("#" + e).button('success');
      $("#" + e).tooltip();
  }, 200);
    return {
      "title" : "Agreed to on: " + moment(thisForm.agreedDate).format("MM/DD/YYYY"),
      "disabled": "disabled"
    }
  }
  if(Roles.userIsInRole(Meteor.userId(), 'admin')) {
    // Admins can't agree to terms for another user, only the user can do this
    return {"disabled": "disabled"};
  }

});

Template.registerHelper('passportPhotoThumbnail', function() {
  if(this.versions && this.versions.thumbnail){
    console.log(this.versions.thumbnail.meta.signedURL);
    return this.versions.thumbnail.meta.signedURL;
  }
});
Template.registerHelper('passportPhotoOriginal', function() {
  if(this.versions && this.versions.original) {
    return this.versions.original.meta.signedURL;
  }
});

Template.registerHelper('tripId', function() {
  let tripForm = Forms.findOne({formName: 'tripRegistration'});
  return tripForm && tripForm.tripId;
});

Template.registerHelper('noTripRegistration', function() {
  let tripForm = Forms.findOne({formName: 'tripRegistration'});
  if(tripForm && tripForm.tripId){
    return;
  } else{
    return {
      style: 'background-color: #eee'
    }
  }
});

Template.registerHelper('noTripRegistrationExpand', function() {
  let tripForm = Forms.findOne({formName: 'tripRegistration'});
  if(tripForm && tripForm.tripId){
    return;
  } else{
    return {
      style: 'display: none;'
    }
  }
});

Template.registerHelper('oddEven', function(index) {
  if((index % 2) === 0) return 'even';
  else return 'odd';
});
