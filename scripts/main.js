const FOAF = $rdf.Namespace('http://xmlns.com/foaf/0.1/');
const VCARD = new $rdf.Namespace('http://www.w3.org/2006/vcard/ns#')
// const VCARD = new $rdf.Namespace('http://www.w3.org/2018/vcard-new/1#');

// Log the user in and out on click
const popupUri = 'popup.html';
$('#login  button').click(() => solid.auth.popupLogin({ popupUri }));
$('#logout button').click(() => solid.auth.logout());

// Update components to match the user's login status
solid.auth.trackSession(session => {
  const loggedIn = !!session;
  $('#login').toggle(!loggedIn);
  $('#logout').toggle(loggedIn);
  if (loggedIn) {
    $('#user').text(session.webId);
    // Use the user's WebID as default profile
    if (!$('#profile').val())
      $('#profile').val(session.webId);
  }
});

$('#update').click(async => {
  const store = $rdf.graph();
  const newname = $('#modname').val();
  const person = $('#profile').val();
  const me = store.sym(person);
  const profile = me.doc();
  store.add(me, VCARD('wow'), newname, profile);
  let name = store.any(me, VCARD('wow'), null, profile);
  console.log(name);

  const updater = new $rdf.UpdateManager(store)

  function setName(person, name, doc) {
      let ins = $rdf.st(person, VCARD('wow'), name, doc)
      let del = []
      updater.update(del, ins, (uri, ok, message) => {
        if (ok) console.log('Name changed to '+ name)
        else alert(message)
      })
    }
  setName(me, newname, profile);

});

//fetch data on user
$('#view').click(async function loadProfile() {
  // Set up a local data store and associated data fetcher
  const store = $rdf.graph();
  const fetcher = new $rdf.Fetcher(store);

  // Load the person's data into the store
  const person = $('#profile').val();
  await fetcher.load(person);
  const me = store.sym(person);
  const profile = me.doc();

  // Display their details
  let fullName = store.any(me, VCARD('wow'), null, profile);
  console.log(fullName);
  $('#fullName').text(fullName && fullName.value);

  // Display their friends
  const friends = store.each($rdf.sym(person), FOAF('knows'));
  $('#friends').empty();
  friends.forEach(async (friend) => {
    await fetcher.load(friend);
    const fullName = store.any(friend, FOAF('name'));
    $('#friends').append(
      $('<li>').append(
        $('<a>').text(fullName && fullName.value || friend.value)
                .click(() => $('#profile').val(friend.value))
                .click(loadProfile)));
  });
});
