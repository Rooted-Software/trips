function redirectIfNotAdmin (ctx, redirect) {
  if (!Meteor.userId() || !Roles.userIsInRole(Meteor.userId(), 'admin')) {
    redirect('/')
  }
}

function redirectIfAdmin (ctx, redirect) {
  if (Roles.userIsInRole(Meteor.userId(), 'admin')) {
    redirect('/admin')
  }
}

FlowRouter.route( '/', {
  name: 'home',
  triggersEnter: [redirectIfAdmin],
  action() {
    BlazeLayout.render('main', { top: "Header", main: "Home", footer: "Footer" });
  }
});

FlowRouter.route( '/login', {
  name: 'login',
  action() {
    BlazeLayout.render( 'login', { login: 'LoginContent', footer: "Footer" } );
  }
});

FlowRouter.route( '/fundraising', {
  name: 'fundraising',
  action() {
    BlazeLayout.render('main', { top: "Header", main: "Fundraising", footer: "Footer" });
  }
});

FlowRouter.route( '/profile', {
  name: 'profile',
  action() {
    BlazeLayout.render('main', { top: "Header", main: "UserRegistration", footer: "Footer" });
  }
});

FlowRouter.route( '/forms', {
  name: 'forms',
  action() {
    BlazeLayout.render('main', { top: "Header", main: "Forms", footer: "Footer" });
  }
});


// Admin routes

FlowRouter.route( '/admin', {
  name: 'admin',
  triggersEnter: [redirectIfNotAdmin],
  action() {
    BlazeLayout.render('main', { top: "Header", main: "Admin", footer: "Footer" });
  }
});

FlowRouter.route( '/admin/showuserhome', {
  name: 'adminShowUserHome',
  triggersEnter: function( context, redirect ) {
    Session.set("showingOtherUser", true);
    Session.set( 'showingUserId', context && context.queryParams.id);
    redirectIfNotAdmin(context, redirect);
  },
  action() {
    BlazeLayout.render('main', { top: "Header", main: "ShowUserHome", footer: "Footer" });
  }
});

FlowRouter.route( '/admin/print-all', {
  name: 'print-all',
  triggersEnter: function ( context, redirect ) {
    Session.set("showingOtherUser", true);
  },
  action() {
    BlazeLayout.render('main', { top: "Header", main: "PrintAll", footer: "Footer" });
  }
});
