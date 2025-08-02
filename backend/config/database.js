const Datastore = require('@seald-io/nedb');
const path = require('path');

class Database {
  constructor() {
    this.resources = new Datastore({
      filename: path.join(__dirname, '../data/resources.db'),
      autoload: true
    });

    this.users = new Datastore({
      filename: path.join(__dirname, '../data/users.db'),
      autoload: true
    });

    this.bookings = new Datastore({
      filename: path.join(__dirname, '../data/bookings.db'),
      autoload: true
    });

    this.nblList = new Datastore({
      filename: path.join(__dirname, '../data/nbllist.db'),
      autoload: true
    });

    // Create indexes
    this.users.ensureIndex({ fieldName: 'email', unique: true });
    this.resources.ensureIndex({ fieldName: 'name' });
    this.bookings.ensureIndex({ fieldName: 'resourceId' });
    this.bookings.ensureIndex({ fieldName: 'userId' });
    this.nblList.ensureIndex({ fieldName: 'uploadTimestamp' });
  }

  getResourcesDB() {
    return this.resources;
  }

  getUsersDB() {
    return this.users;
  }

  getBookingsDB() {
    return this.bookings;
  }

  getNBLListDB() {
    return this.nblList;
  }
}

module.exports = new Database();
