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
const TOKEN_PATH = 'token.json';

const NodeHelper = require("node_helper");
var serverSide = [];

module.exports = NodeHelper.create({
  const self = this;
  start: function () {
    this.googleAuthReady = false;
    //G Load client secrets from a local file.
    fs.readFile('credentials.json', (err, content) => {
      if (err) return console.log('Error loading client secret file:', err);
      // Authorize a client with credentials, then call the Google Tasks API.
      self.authorize(JSON.parse(content), self.listTaskLists);
    });
    this.started = false;
  },

  /**
   * Lists the user's first 10 task lists.
   *
   * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
   */
  function listTaskLists(auth) {
    const self = this;
    const service = google.tasks({version: 'v1', auth});
    service.tasklists.list({
      maxResults: 10,
    }, (err, res) => {
      if (err) return console.error('The API returned an error: ' + err);
      self.googleAuthReady = true;
      const taskLists = res.data.items;
      if (taskLists) {
        console.log('Task lists:');
        taskLists.forEach((taskList) => {
          console.log(`${taskList.title} (${taskList.id})`);
        });
      } else {
        console.log('No task lists found.');
      }
    });
  }
  /**
   * Create an OAuth2 client with the given credentials, and then execute the
   * given callback function.
   * @param {Object} credentials The authorization client credentials.
   * @param {function} callback The callback to call with the authorized client.
   */
  function authorize(credentials, callback) {
    const self = this;
    const {client_secret, client_id, redirect_uris} = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
      if (err) return self.getNewToken(oAuth2Client, callback);
      oAuth2Client.setCredentials(JSON.parse(token));
      callback(oAuth2Client);
    });
  }
  /**
   * Get and store new token after prompting for user authorization, and then
   * execute the given callback with the authorized OAuth2 client.
   * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
   * @param {getEventsCallback} callback The callback for the authorized client.
   */
  function getNewToken(oAuth2Client, callback) {
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
        fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
          if (err) console.error(err);
          console.log('Token stored to', TOKEN_PATH);
        });
        callback(oAuth2Client);
      });
    });
  }

  socketNotificationReceived: function(notification, payload) {
    const self = this;
    if (notification === 'SET_CONFIG' && this.started == false) {
      this.config = payload;
      if (this.config.debug) {
        console.log (' *** config received from MMM.js & set in node_helper: ');
        console.log ( payload );
      }
      this.started = true;
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
    }
  },

  fetchHandleAPI: function(_l) {
    var self = this, retry = true;
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