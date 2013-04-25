/**
 * FileStore for NanoDB
 *
 * Will Wen Gunn
 */
var fs = require('fs');

function FileStore(filename) {
  this.filename = filename;
  this.buffer = null;
  this.async = true;
}
FileStore.prototype.set = function(key, value, callback) {
  var self = this;

  if (!self.buffer) {
    fs.readFile(self.filename, function(err, data) {
      if (err) {
        fs.writeFile(self.filename, '{}', function(err) {
          if (err)
            return callback(err);

          self.set(key, value, callback);
        });
        return;
      }

      self.buffer = JSON.parse(data.toString());
      self.buffer[key] = value;
      fs.writeFile(self.filename, JSON.stringify(self.buffer), function(err) {
        if (err)
          return callback(err);

        callback();
      });
    });
  } else {
    self.buffer[key] = value;

    fs.writeFile(self.filename, JSON.stringify(self.buffer), function(err) {
      if (err)
        return callback(err);

      callback();
    });
  }
};
FileStore.prototype.get = function(key, callback) {
  var self = this;

  if (!self.buffer) {
    fs.readFile(self.filename, function(err, data) {
      if (err) {
        fs.writeFile(self.filename, '{}', function(err) {
          if (err)
            return callback(err);

          self.get(key, callback);
        });
        return;
      }

      self.buffer = JSON.parse(data.toString());

      if (self.buffer[key]) {
        return callback(null, self.buffer[key]);
      } else {
        return callback(new Error('This key is not exists'));
      }
    });
  } else {
    if (self.buffer[key]) {
      return callback(null, self.buffer[key]);
    } else {
      return callback(new Error('This key is not exists.'));
    }
  }
};
FileStore.prototype.remove = function(key, callback) {
  var self = this;

  if (!self.buffer) {
    fs.readFile(self.filename, function(err, data) {
      if (err)
        return callback(err);

      self.buffer = JSON.parse(data.toString());

      delete self.buffer[key];

      fs.writeFile(self.filename, JSON.stringify(self.buffer), callback);
    });
  } else {
    delete self.buffer[key];

    fs.writeFile(self.filename, JSON.stringify(self.buffer), callback);
  }
};

module.exports = FileStore;