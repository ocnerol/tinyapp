const express = require('express');
const app = express();
const port = 8080; // default port is 8080
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

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

const users = {
  "1234": {
    id: "1234",
    email: "u@u.com",
    password: "abcd"
  },
  "fBa9Jk": {
    id: "fBa9Jk",
    email: "j@j.com",
    password: "123abc"
  }
};

// Functions

function generateRandomString() {
  const letters = [
    'A', 'a', 'B', 'b', 'C', 'c', 'D', 'd', 'E', 'e', 'F', 'f', 'G', 'g', 'H', 'h',
    'I', 'i', 'J', 'j', 'K', 'k', 'L', 'l', 'M', 'm', 'N', 'n', 'O', 'o', 'P', 'p',
    'Q', 'q', 'R', 'r', 'S', 's', 'T', 't', 'U', 'u', 'V', 'v', 'W', 'w', 'X', 'x',
    'Y', 'y', 'Z', 'z'
  ];
  const resultMaxLength = 6;
  let result = "";
  let addNumber = true;
  for (let i = 0; i < resultMaxLength; i++) {
    if (addNumber) {
      const newNumber = Math.floor(Math.random() * 10); // random number (integer) from 0 to 9
      result += newNumber;
    } else {
      const randomIndex = Math.floor(Math.random() * letters.length); // random number (integer) from 0 to length of letters array - 1
      const newLetter = letters[randomIndex];
      result += newLetter;
    }
    addNumber = !addNumber;
  }
  return result;
}

function findUserByEmail(email) {
  for (const userID in users) {
    const user = users[userID];
    if (user.email === email) {
      return user;
    }
  }
  return null;
};

// Browse

app.get('/', (req, res) => {
  res.send('Hello!');
});

app.get('/urls', (req, res) => {
  const user = users[req.cookies.user_id];
  const templateVars = {
    urls: urlDatabase,
    user,
  };
  res.render('urls_index', templateVars);
});

// Read

app.get('/urls/new', (req, res) => {
  const user = users[req.cookies.user_id];
  console.log('user value when not signed in:', user);
  if (!user) {
    return res.redirect('/login');
  }

  const templateVars = {
    user,
  }
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
  const user = users[req.cookies.user_id];
  const templateVars = {
    user,
  };
  res.render('urls_register', templateVars);
});

// render page for given shortURL on tinyApp
app.get('/urls/:shortURL', (req, res) => {
  const user = users[req.cookies.user_id];
  const templateVars = {
    user,
    shortURL: req.params.shortURL,
    shortURLInfo: urlDatabase[req.params.shortURL],
  };
  const { shortURL } = templateVars;
  if (!shortURL || !urlDatabase[shortURL]) {
    res.sendStatus(404);
  }
  res.render('urls_show', templateVars);
});

// render login page
app.get('/login', (req, res) => {
  const id = req.cookies.user_id;
  const templateVars = {
    user: users[id]
  };
  res.render('user_login', templateVars);
});

// Edit


// Add

// add new URL or updating existing shortURL with new longURL
app.post('/urls', (req, res) => {
  const user = req.cookies.user_id;

  if (!user) {
    return res.status(401).send('You must be logged in to shorten URLs.');
  }

  const longURL = req.body.longURL;
  let shortURL = req.body.shortURL;
  if (shortURL) {                          // if we are updating destination of a shortURL
    delete urlDatabase[shortURL];
    urlDatabase[shortURL] = {
      longURL,
      userID: user
    };
    res.redirect(302, `/urls/${shortURL}`);
  } else {                                  // if we are storing a new shortURL
    shortURL = generateRandomString();
    urlDatabase[shortURL] = {
      longURL,
      userID: user
    };
    res.redirect(302, `/urls/${shortURL}`);
  }
});

// submit new user registration and redirect to /urls
app.post('/register', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    return res.status(400).send('You cannot leave either of the fields blank. Please try to register again.')
  }

  const user = findUserByEmail(email);

  if (user) {
    return res.status(400).send('A user with that email already exists. Please try logging in, or register with a different email address.');
  }

  const newUserID = generateRandomString();

  users[newUserID] = {
    id: newUserID,
    email: email,
    password: password
  }

  res.cookie('user_id', newUserID);
  console.log('users database object now:', users);
  res.redirect('/urls');
});


// Delete

// Delete a stored shortURL (and associated longURL)
app.post('/urls/:shortURL/delete', (req, res) => {
  console.log('request params when deleting a url', req.params);
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect('/urls')
});


app.get('/u/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  console.log(req.params);
  if (!shortURL || !urlDatabase[shortURL]) {
    res.sendStatus(404);
  } else {
    const longURL = urlDatabase[req.params.shortURL];
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

  const user = findUserByEmail(email);
  // if user is falsy, return 403 status with message that user with that email cannot be found
  if (!user) {
    return res.status(403).send('That email does not match a user in our records. Please try logging in again.');
  }

  // if password is NOT equal to existing user's password, return 403 error with message
  if (password !== user.password) {
    return res.status(403).send('The password you entered does not match our records. Please try logging in again.');
  }

  // otherwise, set user_id cookie with matching user's random ID
  // then redirect to /urls
  res.cookie('user_id', user.id);
  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

