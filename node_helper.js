/* Magic Mirror
 * Module: MMM-Buller
 * https://github.com/MichMich/MagicMirror/blob/master/modules/README.md module development doc
 *
 * script from da4throux
 * MIT Licensed.
 *
 */


//G: from Google Developer example: https://developers.google.com/tasks/quickstart/nodejs
const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const SCOPES = ['https://www.googleapis.com/auth/tasks.readonly'];

const NodeHelper = require("node_helper");
var serverSide = [];

process.on('unhandledRejection', (reason, p) => {
  console.log('Logging unhandled Rejection at: Promise', p, 'reason:', reason);
  // application specific logging, throwing an error, or other logic here
})

module.exports = NodeHelper.create({
  start: function() {
    var self = this;
    this.googleAuthReady = false;
    this.started = false;
    //this.path = 'modules/MMM-Buller/'; //already defined in MM modules
    this.TOKEN_PATH = this.path + '/token.json';
  },

  /**
   * Lists the user's first 10 task lists.
   *
   * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
   */
  getTaskLists: function(auth) {
    var self = this;
    if (self.config.debug) {
      console.log ('** Starting getTaskLists ');
    }
    this.gTasksAPI = google.tasks({version: 'v1', auth});
    this.gTasksAPI.tasklists.list({
      maxResults: 10,
    })
      .then (res => {
        self.googleAuthReady = true;
        const taskLists = res.data.items;
        if (taskLists) {
          self.gTasksLists = [];
          self.gTasks=[];
          console.log('Task lists:');
          taskLists.forEach((taskList) => {
            self.gTasks[taskList.title] = taskList.id;
            console.log(`${taskList.title} (${taskList.id})`);
          });
        } else {
          console.log('No task lists found.');
        }
      })
      .catch(err => {
        console.error('The API returned an error: ' + err);
      });
  },
  /**
   * Create an OAuth2 client with the given credentials, and then execute the
   * given callback function.
   * @param {Object} credentials The authorization client credentials.
   * @param {function} callback The callback to call with the authorized client.
   */
  authorize: function(credentials, callback) {
    var self = this;
    const {client_secret, client_id, redirect_uris} = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);

    // Check if we have previously stored a token.
    fs.readFile(self.TOKEN_PATH, (err, token) => {
      if (err) return self.getNewToken(oAuth2Client, callback);
      oAuth2Client.setCredentials(JSON.parse(token));
      self.oAuth2Client = oAuth2Client;
      callback(oAuth2Client);
    });
  },
  /**
   * Get and store new token after prompting for user authorization, and then
   * execute the given callback with the authorized OAuth2 client.
   * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
   * @param {getEventsCallback} callback The callback for the authorized client.
   */
  getNewToken: function(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
      rl.close();
      oAuth2Client.getToken(code, (err, token) => {
        if (err) return console.error('Error retrieving access token', err);
        oAuth2Client.setCredentials(token);
        // Store the token to disk for later program executions
        fs.writeFile(self.TOKEN_PATH, JSON.stringify(token), (err) => {
          if (err) console.error(err);
          console.log('Token stored to', self.TOKEN_PATH);
        });
        callback(oAuth2Client);
      });
    });
  },

  getTasksFromList: function (listDescription) {
    var self = this;
//    this.gTasksAPI.tasks.list.get({
    if (self.config.debug) {
      console.log ('** getTasksFromList on : ' + JSON.stringify(listDescription));
      console.log ('Auth ready ? ' +  self.googleAuthReady);
    }
    self.gTasksAPI.tasks.list({
      tasklist: self.gTasks[listDescription.name],
      maxResults: 10,
    })
      .then(res => {
        const tasks = res.data.items;
        self.config.tasksFetched = [];
        if (tasks) {
          if (self.config.debug) {
            console.log ('received list');
            console.log (JSON.stringify(res.data.items));
          }
          tasks.forEach((task) => {
            self.config.tasksFetched.push(task);
          })
          self.config.infos[listDescription.id] = self.config.tasksFetched;
          self.sendSocketNotification("DATA", self.config.infos);
        } else {
          console.log('No tasks found in list.');
        }
      })
      .catch(err => {
        console.error('When Buller called gTasks for ' + self.gTasks[listDescription.name] + ' list, it returned an error: ' + err);
      })
  },

  socketNotificationReceived: function(notification, payload) {
    var self = this;
    if (notification === 'SET_CONFIG' && this.started == false) {
      this.config = payload;
      if (this.config.debug) {
        console.log (' *** config received from MMM.js & set in node_helper: ');
        console.log ( payload );
      }
      //G Load client secrets from a local file.
      this.CREDENTIALS_PATH = this.path + '/credentials.json';
      fs.readFile(this.CREDENTIALS_PATH, (err, content) => {
        if (err) return console.log('Error loading client secret file:', err);
        // Authorize a client with credentials, then call the Google Tasks API.
        self.authorization = JSON.parse(content);
        self.authorize(self.authorization, self.getTaskLists.bind(self));
      });
      //init serverSide if necessary
      this.config.lists.forEach(function(l){
        this.config.infos[l.id] = {};
        if (l.type === 'gTasks') {
          //TBC update the tasks
          self.fetchHandleAPI(l);
        }
      });
      this.started = true;
    }
  },

  fetchHandleAPI: function(_l) {
    var retry = true;
    var self = this;
    if (this.config.debug) { console.log ('*** MMM-Buller fetchHandleAPI for: ' + _l.name + ' task list.');}
    switch (_l.type) {
      case'gTasks':
        if (self.googleAuthReady) {
          self.getTasksFromList(_l);
        } else {
          if (this.config.debug) { console.log (' not ready yet');}
        }
        break;
      default:
        if (this.config.debug) {
          console.log(' *** unknown request: ' + _l.type);
        }
    }
    if (retry) {
      if (this.config.debug) {
        console.log (' *** list ' + _l.name + ' retries update in ' + (self.googleAuthReady ? _l.updateInterval : (_l.initialLoadDelay + 10)));
      }
      setTimeout(function() {
        self.fetchHandleAPI(_l);
      }, self.googleAuthReady ? _l.updateInterval : (_l.initialLoadDelay + 10));
    }
  },

});
