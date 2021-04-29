const exec = require("child_process").exec;

module.exports = {
  // Encode a string to a number
  // Source: https://stackoverflow.com/questions/14346829/is-there-a-way-to-convert-a-string-to-a-base-10-number-for-encryption
  encode: function (string) {
    var number = "0x";
    var length = string.length;
    for (var i = 0; i < length; i++)
      number += string.charCodeAt(i).toString(16);
    return number;
  },

  createDirIfNotExists: function (dir) {
    var fs = require("fs");

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
  },

  // getting some file
  doCall: function (urlToCall, callback) {
    urllib.request(urlToCall, { wd: "nodejs" }, function (err, data, response) {
      return callback(data);
    });
  },

  // Function that runs some incoming shell command (not bash)
  execCommand: function (cmd) {
    return new Promise((resolve, reject) => {
      exec(cmd, (error, stdout, stderr) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(stdout);
      });
    });
  },
};
