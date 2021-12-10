const { assert, expect } = require('chai');
const { findUserByEmail } = require('../helpers.js')


const testUsers = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

describe('findUserByEmail', () => {
  
  it('should return a user with a valid email', () => {
    const user = findUserByEmail("user@example.com", testUsers);
    const expectedUserID = "userRandomID";
    assert.strictEqual(user.id, expectedUserID)
  });

  it('should return undefined if a non-existing email is given', () => {
    const user = findUserByEmail("invalid@email.com", testUsers);
    const expectedResult = undefined;
    assert.strictEqual(user, expectedResult);
  });

});