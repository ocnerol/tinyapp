
function findUserByEmail(email, database) {
  for (const userID in database) {
    const user = database[userID];
    if (user.email === email) {
      return user;
    }
  }
  return null;
};

module.exports = { 
  findUserByEmail
}