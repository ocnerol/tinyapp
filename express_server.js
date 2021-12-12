const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const salt = bcrypt.genSaltSync(10);
const cookieSession = require('cookie-session');
const { findUserByEmail,
  generateRandomString,
  urlsForUser,
  ensureWithScheme
} = require('./helpers');
const port = 8080; // default port is 8080

app.set('view engine', 'ejs');
app.use(cookieSession({
  name: 'session',
  keys: ["polopinkglassSANDtwentyfour"]
}));
app.use(bodyParser.urlencoded({ extended: true }));

// 'Database'

const urlDatabase = {
  'b2xVn2': {
    longURL: 'http://www.lighthouselabs.ca',
    userID: "1234"
  },
  '9sm5xK': {
    longURL: 'http://www.google.com',
    userID: "fBa9Jk"
  }
};

const user1234Password = bcrypt.hashSync("abcd", 10);
const userfba9JkPassword = bcrypt.hashSync("123abc", 10);

const users = {
  "1234": {
    id: "1234",
    email: "u@u.com",
    password: user1234Password
  },
  "fBa9Jk": {
    id: "fBa9Jk",
    email: "j@j.com",
    password: userfba9JkPassword
  }
};

//
// ----------- Endpoints -----------
//

//
// ----------- Browse --------------
//

app.get('/', (req, res) => {
  const user = users[req.session.userID];
  if (!user) {
    return res.redirect('/login');
  } else {
    return res.redirect('/urls');
  }
});

app.get('/urls', (req, res) => {
  const user = users[req.session.userID];
  if (!user) {
    const templateVars = {
      user: user
    };
    return res.render('login_required', templateVars);
  }

  const currentUserURLs = urlsForUser(user.id, urlDatabase);
  const templateVars = {
    urls: currentUserURLs,
    user,
  };
  res.render('urls_index', templateVars);

});


//
// ----------- Read ----------------
//

app.get('/urls/new', (req, res) => {
  const user = users[req.session.userID];
  if (!user) {
    return res.redirect('/login');
  }

  const templateVars = {
    user,
  };
  res.render('urls_new', templateVars);
});

app.get('/register', (req, res) => {
  const user = users[req.session.userID];
  if (!user) {
    const templateVars = {
      user,
    };
    res.render('urls_register', templateVars);
  } else {
    return res.redirect('/urls');
  }
});

// render page for given shortURL on tinyApp
app.get('/urls/:shortURL', (req, res) => {

  const user = users[req.session.userID];
  const shortURL = req.params.shortURL;

  if (!user) {
    const templateVars = {
      user
    };
    return res.render('login_required', templateVars);
  }

  if (!urlDatabase[shortURL]) {
    const templateVars = {
      user
    };
    return res.render('non_existent', templateVars);
  }

  const urlsObjectsForUser = urlsForUser(user.id, urlDatabase);
  const currentUserURLs = Object.keys(urlsObjectsForUser);

  if (!currentUserURLs.includes(shortURL)) {
    const templateVars = {
      user
    };
    return res.render('unauthorized', templateVars);
  }

  const templateVars = {
    user,
    shortURL: shortURL,
    shortURLInfo: urlDatabase[req.params.shortURL],
  };

  res.render('urls_show', templateVars);

});

app.get('/login', (req, res) => {
  const user = users[req.session.userID];
  if (!user) {
    const templateVars = {
      user
    };
    return res.render('urls_login', templateVars);
  } else {
    return res.redirect('/urls');
  }
});

// redirect to longURL address of given shortURL, if valid
app.get('/u/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  const user = users[req.session.userID];

  if (!shortURL || !urlDatabase[shortURL]) {
    const templateVars = {
      user
    };
    return res.render('non_existent', templateVars);
  } else {
    const longURL = urlDatabase[shortURL].longURL;
    res.redirect(longURL);
  }
});

//
// ----------- Edit ----------------
//

// updating a shortURL
app.post('/urls/:shortURL', (req, res) => {
  const user = users[req.session.userID];

  if (!user) {
    const templateVars = {
      user: user
    };
    return res.render('login_required', templateVars);
  }

  const longURL = ensureWithScheme(req.body.longURL);
  const shortURL = req.body.shortURL;
  const shortURLsOfUser = Object.keys(urlsForUser(user.id, urlDatabase));

  // if the shortURL being updated does not belong to the current user
  if (!shortURLsOfUser.includes(shortURL)) {
    const templateVars = {
      user
    };
    return res.render('unauthorized', templateVars);
  } else {
    urlDatabase[shortURL] = {
      longURL,
      userID: user.id
    };
    return res.redirect(302, '/urls');
  }
});


//
// ----------- Add -----------------
//

// add new URL
app.post('/urls', (req, res) => {
  const user = users[req.session.userID];

  if (!user) {
    const templateVars = {
      user: user
    };
    return res.render('login_required', templateVars);
  }

  const longURL = ensureWithScheme(req.body.longURL);
  const shortURL = generateRandomString();

  urlDatabase[shortURL] = {
    longURL,
    userID: user.id
  };
  return res.redirect(302, `/urls/${shortURL}`);
});

// submit new user registration
app.post('/register', (req, res) => {
  const user = users[req.session.userID];
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    const templateVars = {
      user
    };
    return res.render('empty_fields', templateVars);
  }

  const emailAlreadyExists = findUserByEmail(email, users);

  if (emailAlreadyExists) {
    const templateVars = {
      user
    };
    return res.render('email_exists', templateVars);
  }

  const newUserID = generateRandomString();

  users[newUserID] = {
    id: newUserID,
    email: email,
    password: bcrypt.hashSync(password, salt)
  };

  req.session.userID = newUserID;
  res.redirect('/urls');
});

app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    const user = users[req.session.userID];
    const templateVars = {
      user
    };
    return res.render('empty_fields', templateVars);
  }

  const user = findUserByEmail(email, users);

  // render invalid login error message when given email is non-existent
  if (!user) {
    const templateVars = {
      user
    };
    return res.render('invalid_login', templateVars);
  }

  const passwordsMatching = bcrypt.compareSync(password, user.password);
  if (!passwordsMatching) {
    const templateVars = {
      user
    };
    return res.render('invalid_login', templateVars);
  }

  req.session.userID = user.id;
  res.redirect('/urls');
});

//
// ----------- Delete --------------
//

// Delete a stored shortURL (and associated longURL)
app.post('/urls/:shortURL/delete', (req, res) => {
  const user = users[req.session.userID];
  const shortURL = req.params.shortURL;

  if (!user) {
    const templateVars = {
      user
    };
    return res.render('login_required', templateVars);
  }

  const userURLs = Object.keys(urlsForUser(user.id, urlDatabase));

  if (!userURLs.includes(shortURL)) {
    const templateVars = {
      user
    };
    return res.render('unauthorized', templateVars);
  }

  delete urlDatabase[shortURL];
  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});


//
// -------- Server-specific --------
//
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});