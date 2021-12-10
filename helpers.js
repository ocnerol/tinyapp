
function findUserByEmail(email, database) {
  for (const userID in database) {
    const user = database[userID];
    if (user.email === email) {
      return user;
    }
  }
  return undefined;
};

const generateRandomString = function() {
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
};

const urlsForUser = function(id, database) {
  const urls = {};
  for (const shortURL in database) {
    if (database[shortURL].userID === id) {
      urls[shortURL] = database[shortURL];
    }
  }
  return urls;
};

const ensureWithScheme = (url) => {
  if (url.startsWith('http://www.')) {
    return url;
  } else if (url.startsWith('www.')) {
    return 'http://' + url;
  } else {
    return 'http://www.' + url;
  }
};

module.exports = { 
  findUserByEmail,
  generateRandomString,
  urlsForUser,
  ensureWithScheme
}