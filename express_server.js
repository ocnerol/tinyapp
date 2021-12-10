const express = require('express');
const app = express();
const port = 8080; // default port is 8080
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const bcrypt = require('bcryptjs');
const salt = bcrypt.genSaltSync(10);
const cookieSession = require('cookie-session');
const { findUserByEmail, generateRandomString, urlsForUser } = require('./helpers');


app.use(cookieSession({
  name: 'session',
  keys: ["polopinkglassSANDtwentyfour"]
}));

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

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


const startsWithURLPrefix = (url) => {
  if (url.startsWith('http://www.')) {
    return url;
  } else if (url.startsWith('www.')) {
    return 'http://' + url;
  } else {
    return 'http://www.' + url;
  }
};

// Browse

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

// Read

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

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/hello', (req, res) => {
  res.send('<html><body>Hello <b>World</b></body></html>\n');
});

// render registration page
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

  const allShortURLs = Object.keys(urlDatabase);
  if (!allShortURLs.includes(shortURL)) {
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
  if (!shortURL || !urlDatabase[shortURL]) {
    res.sendStatus(404);
  }
  res.render('urls_show', templateVars);
});

// render login page
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

// Edit
// updating a shortURL
app.post('/urls/:shortURL', (req, res) => {
  const user = users[req.session.userID];

  if (!user) {
    const templateVars = {
      user: user
    };
    return res.render('login_required', templateVars);
  }

  const longURL = startsWithURLPrefix(req.body.longURL);
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
    return res.redirect(302, `/urls`);
  }
});

// Add

// add new URL
app.post('/urls', (req, res) => {
  const user = users[req.session.userID];

  if (!user) {
    const templateVars = {
      user: user
    };
    return res.render('login_required', templateVars);
  }

  const longURL = startsWithURLPrefix(req.body.longURL);
  const shortURL = generateRandomString();

  urlDatabase[shortURL] = {
    longURL,
    userID: user.id
  };
  return res.redirect(302, `/urls/${shortURL}`);
});

// submit new user registration and redirect to /urls
app.post('/register', (req, res) => {
  const user = users[req.session.userID];
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    // return view that neither field can be blank
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


// Delete

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

app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  // if either email or passowrd are blank, return 401 status with error message
  if (!email || !password) {
    return res.status(401).send('Neither field can be blank. Please try logging in again.');
  }

  const user = findUserByEmail(email, users);
  // if user is falsy, return 403 status with message that user with that email cannot be found
  if (!user) {
    const templateVars = {
      user
    };
    return res.render('invalid_login', templateVars);
  }
  // if password is NOT equal to existing user's password, return 403 error with message
  const passwordsMatching = bcrypt.compareSync(password, user.password);
  if (!passwordsMatching) {
    const templateVars = {
      user
    };
    return res.render('invalid_login', templateVars);
  }

  // otherwise, set userID cookie with matching user's random ID
  // then redirect to /urls
  req.session.userID = user.id;
  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});