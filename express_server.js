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
      const randomIndex = Math.floor(Math.random() * 53); // random number (integer) from 0 to 52 inclusive
      const newLetter = letters[randomIndex];
      result += newLetter;
    }
    addNumber = !addNumber;
  }
  return result;
}

// 'Database'

const urlDatabase = {
  'b2xVn2': 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com'
};

const users = {
  "user0RandomID": {
    id: "user0RandomID",
    email: "user0@example.com",
    password: "purple-monkey-dinosaur"
  }
};

// Browse

app.get('/', (req, res) => {
  res.send('Hello!');
});

app.get('/urls', (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    username: req.cookies["username"]
  };
  res.render('urls_index', templateVars);
});

// Read

app.get('/urls/new', (req, res) => {
  const templateVars = {
    username: req.cookies["username"]
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
  const templateVars = {
    username: req.cookies["username"]
  };
  res.render('urls_register', templateVars);
});

// render page for given shortURL on tinyApp
app.get('/urls/:shortURL', (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    username: req.cookies["username"]
  };
  const { shortURL } = templateVars;
  if (!shortURL || !urlDatabase[shortURL]) {
    res.sendStatus(404);
  }
  res.render('urls_show', templateVars);
});

// Edit


// Add

// add new URL or updating existing shortURL with new longURL
app.post('/urls', (req, res) => {
  const longURL = req.body.longURL;
  let shortURL = req.body.shortURL;
  if (shortURL) {                          // if we are updating destination of a shortURL
    delete urlDatabase[shortURL];
    urlDatabase[shortURL] = longURL;
    res.redirect(302, `/urls/${shortURL}`);
  } else {                                  // if we are storing a new shortURL
    shortURL = generateRandomString();
    urlDatabase[shortURL] = req.body.longURL;
    res.redirect(302, `/urls/${shortURL}`);
  }
});

// submit new user registration and redirect to /urls
app.post('/register', (req, res) => {
  const username = req.body.email;
  const password = req.body.password;

  if (!username || !password) {
    return res.status(400).send('You cannot leave either of the fields blank. Please try to register again.')
  }
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
  const username = req.body.username;
  res.cookie('username', username);
  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  res.clearCookie('username');
  res.redirect('/urls');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

