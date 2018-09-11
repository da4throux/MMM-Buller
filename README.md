# MMM-Buller

[MagicMirror MichMich](https://magicmirror.builders/) module to display messages or tasks leveraging google Tasks.

# Presentation
This module helps you display elements from Google tasks lists. In particular:
* tasks that are open (done tasks are not shown)
* tasks that are due can be shown differently
The first use case is to provide a similar experience the default Compliments Module, but giving the possibility to use a phone app (Google Tasks) to update / change the message.
The second use case will be to be able to set visual reminder on the mirror of things to do at home, or just on arriving or leaving.
The third use case will be to offer an option to leverage meta-data in the task to display the tasks more appropriately (show more of what is relevant for that mirror at that time).
Name comes from the French word for 'Bubble', made into a verb, which refers to the activity of doing nothing (link to task), and to little bubble of text (link to compliments use case).

# Screenshot TBC
![screenshot]()

# Google Tasks setup TBC

0. Obviously a google account is required
1. follow this [instruction to Turn on the Google Tasks API](https://developers.google.com/tasks/quickstart/nodejs) and get your file `credentials.json` .

# Install

1. Clone repository into `../modules/` inside your MagicMirror folder.
2. Run `npm install` inside `../modules/MMM-Buller/` folder
3. Add the module to the MagicMirror config
```
		{
	        module: 'MMM-Buller',
	        position: 'top_bar',
	        header: 'Buller',
	        config: {
	        }
    	},
```

# Configure TBC
The `lists` array contains information on the lists to monitor (it will give possibility to monitor several lists).
## lists array TBC
* `name`: mandatory: name of the list of tasks
* `metaData`: optional: boolean: Should the buller metadata be look for in the tasks, default: `false`
* `label`: optional: usual name to be displayed, default: the value defined in `name`
* `updateInterval`: optional: integer: number of ms to wait between two information request, default: `1 * 60 * 1000 * 60 * 6` 6 hours

## config example
```
{
  lists: [
    {
    },
  ],
}
```

#0.1
