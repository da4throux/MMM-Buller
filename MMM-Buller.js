/* Magic Mirror
 * Module: MMM-Buller
 *
 * By da4throux
 * MIT Licensed.
 */

Module.register("MMM-Buller",{

  // Define module defaults
  defaults: {
    debug: true, //console.log more things to help debugging
    list_template: {
      type: "gTasks", // allow using other kind of data input later on
      updateInterval: 1 * 60 * 1000 * 60 * 6, // every 6 hours
      initialLoadDelay: 100, // start delay seconds
      metaData: false, //true: leveraging metaData from the task
      alwaysShowDueTask: true, //true: a due Task will always be shown on the mirror
    },
    maxNumberOfTasksDisplayed: 3,
    maxNumberOfUsualTasksDisplayed: 1,
    updateDomFrequence: 30 * 1000, //20 seconds
  },

  // Define required scripts.
  getStyles: function() {
    return ["MMM-Buller.css"];
  },

  // Define start sequence.
  start: function() {
    var l, i;
    Log.info("Starting module: " + this.name);
    this.config.infos = [];
    if (!this.config.lists) {
      this.config.lists = [];
    }
    if (this.config.debug) {
      console.log ('Buller - lists to be used: ');
      console.log (JSON.stringify(this.config.lists));
    }
    //all lists are based on the template (defined here), superseded by the default value (define in config), superseded by specific value
    for (i=0; i < this.config.lists.length; i++) {
      this.config.infos[i]={};
      l = Object.assign(JSON.parse(JSON.stringify(this.config.list_template)),
        JSON.parse(JSON.stringify(this.config.listDefault || {})),
        JSON.parse(JSON.stringify(this.config.lists[i])));
      l.id = i;
      this.config.lists[i] = l;
    }
    this.sendSocketNotification('SET_CONFIG', this.config);
    this.loaded = false;
    var self = this;
    setInterval(function () {
      self.caller = 'updateInterval';
      self.updateDom();
    }, this.config.updateDomFrequence);
  },

//  getHeader: function () {
//    var header = this.data.header;
//    return header;
//  },

  // Add Task to an element (to simplify getDom)
  getTaskRow: function (task, listColor) {
    var firstCell, row = document.createElement("tr");
    row = document.createElement("tr");
    firstCell = document.createElement("td");
    firstCell.className = "align-right bright";
    firstCell.innerHTML = task.title;
    if (listColor) {
        firstCell.setAttribute('style', listColor);
    }
    row.appendChild(firstCell);
    return row;
  },

  // Override dom generator.
  getDom: function() {
    if (this.config.debug) {
      console.log ('Buller DOM refresh');
    }
    var now = new Date();
    var wrapper = document.createElement("div");
    var lists = this.config.lists;
    var tasks, tasksLeft, i, j, t, d, n, listColor;
    var table = document.createElement("table");
    var firstCell, secondCell, row;
    var nbOfTasksDisplayed = 0;
    if (lists.length > 0) {
      if (!this.loaded) {
        wrapper.innerHTML = "Loading information ...";
        wrapper.className = "dimmed light small";
        return wrapper;
      } else {
        wrapper.className = "buller";
        wrapper.appendChild(table);
        table.className = "small";
        tasksLeft = [];
        for (i = 0; i < lists.length; i++) {
          l = lists[i];
          tasks = this.infos[i];
          listColor = l.color ? 'color:' + l.color + ' !important' : false;
          for (j=0; j < tasks.length; j++) {
            t = tasks[j];
            console.log (Date.parse(t.due));
            console.log (Date.parse(t.due) < new Date);
            console.log (nbOfTasksDisplayed);
            console.log (this.config.maxNumberOfTasksDisplayed);
            if (Date.parse(t.due) < new Date && nbOfTasksDisplayed < this.config.maxNumberOfTasksDisplayed) {
              console.log (t.title);
              nbOfTasksDisplayed++;
              table.appendChild(this.getTaskRow(t, listColor));
            } else {
              tasksLeft.push(t);
            }
          }
          while (tasksLeft.length > 0 && nbOfTasksDisplayed < this.config.maxNumberOfUsualTasksDisplayed && nbOfTasksDisplayed < this.config.maxNumberOfTasksDisplayed) {
            table.appendChild(tasksLeft.splice( Math.floor(Math.random() * Math.floor(tasksLeft.length - 1)), 1));
          }
        }
      }
    } else {
      wrapper.className = "small";
      wrapper.innerHTML = "Your configuration requires a 'lists' element.<br />Check github da4throux/MMM-Buller<br />for more information";
    }
/*
      for (i = 0; i < lists.length; i++) {
      l = lists[i]; // list config
      d = this.infos[i]; // data received for the list
      listColor = l.listColor ? 'color:' + l.listColor + ' !important' : false;
      switch (l.type) {
        case "gTasks":
          row = document.createElement("tr");
          row.id = 'list-' + i;
          firstCell = document.createElement("td");
          firstCell.className = "align-right bright";
          firstCell.innerHTML = l.label || l.name;
          if (listColor) {
              firstCell.setAttribute('style', listColor);
          }
          if (l.firstCellColor) {
              firstCell.setAttribute('style', 'color:' + l.firstCellColor + ' !important');
          }
          row.appendChild(firstCell);
          table.appendChild(row);
          break;
        default:
          if (this.config.debug) { console.log('Unknown list type: ' + l.type)}
      }
    } */
    return wrapper;
  },

  socketNotificationReceived: function(notification, payload) {
    var now = new Date();
    this.caller = notification;
    switch (notification) {
      case "DATA":
        this.infos = payload;
        if (!this.loaded) {
          this.loaded = true;
          this.updateDom();
        }
        if (this.config.debug) {
          console.log (this.infos);
        }
        break;
    }
  }
});
