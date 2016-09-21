Template.Home.helpers({
  title(){
    return "Home";
  },
  otherUser(){
    if (Session.get("showingOtherUser")) {
      return true;
    }
  },
  user(){
    if (!Session.get("showingOtherUser")) {
      return Meteor.user();
    } else {
      return this;
    }
  },
  userFullName(){
    return this.profile && this.profile.firstName + " " + this.profile.lastName;
  }
});
