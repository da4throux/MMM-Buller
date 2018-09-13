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

module.exports = NodeHelper.create({
  start: function() {
    var self = this;
    this.googleAuthReady = false;
    this.started = false;
    this.path = 'modules/MMM-Buller/';
    this.TOKEN_PATH = this.path + 'token.json';
  },

  /**
   * Lists the user's first 10 task lists.
   *
   * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
   */
  listTaskLists: function(auth) {
    var self = this;
    this.service = google.tasks({version: 'v1', auth});
    this.service.tasklists.list({
      maxResults: 10,
    }, (err, res) => {
      if (err) return console.error('The API returned an error: ' + err);
      self.googleAuthReady = true;
      const taskLists = res.data.items;
      if (taskLists) {
        self.gTasksLists = [];
        console.log('Task lists:');
        taskLists.forEach((taskList) => {
          self.gTasks[taskList.title] = taskList.id;
          console.log(`${taskList.title} (${taskList.id})`);
        });
        self.getTasksFromList();
      } else {
        console.log('No task lists found.');
      }
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

  getTasksFromList: function () {
    var self = this;
    this.service.tasklists.get({
      tasklist: self.gTasks['MMM'],
      maxResults: 10,
    }, (err, res) => {
      if (err) return console.error('When Buller called gTasks for ' + self.gTasks['MMM'] + ' list, it returned an error: ' + err);
      self.googleAuthReady = true;
      const taskLists = res.data.items;
      if (taskLists) {
        if (self.config.debug) {
          console.log ('received list');
          console.log (JSON.stringify(res.data.items));
        }
      } else {
        console.log('No task lists found.');
      }
    });
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
      this.CREDENTIALS_PATH = this.path + 'credentials.json';
      fs.readFile(this.CREDENTIALS_PATH, (err, content) => {
        if (err) return console.log('Error loading client secret file:', err);
        // Authorize a client with credentials, then call the Google Tasks API.
        self.authorization = JSON.parse(content);
        self.authorize(self.authorization, self.listTaskLists);
      });
      //init serverSide if necessary
      this.config.lists.forEach(function(l){
        serverSide[l.id] = {};
        if (l.type === 'gTasks') {
          //TBC update the tasks
        }
        setTimeout(function(){
          if (self.config.debug) {
            console.log (' *** line ' + l.label + ' intial update in ' + l.initialLoadDelay);
          }
          self.fetchHandleAPI(l);
        }, l.initialLoadDelay);
      });
      this.started = true;
    }
  },

  fetchHandleAPI: function(_l) {
    var retry = true;
    if (this.config.debug) { console.log (' *** MMM-Buller fetchHandleAPI for: ' + _l.label);}
    switch (_l.type) {
      case'gTasks':
        //TBC
        break;
      default:
        if (this.config.debug) {
          console.log(' *** unknown request: ' + l.type);
        }
    }
    if (retry) {
      if (this.config.debug) {
        console.log (' *** list ' + _l.label + ' retries update in ' + _l.updateInterval);
      }
      setTimeout(function() {
        self.fetchHandleAPI(_l);
      }, _l.updateInterval);
    }
  },

});
