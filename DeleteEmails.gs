/*  Google Appscript to batch delete or archive emails using defined labels or rules.
    Recursive deletion is possible under a parent label is recursive is marked as true.
    */


  // Continue batch operations in X minutes if they did not complete during the last 
  // triggered event
  const RETRY_TRIGGER_INTERVAL = 10 
  const TRIGGER_ENTRYPOINT = "checkFiltersForEmails"
  
  /*  
  2 sets of object definitions which define deletion/archive rules:
    By label:
      string label(required) = label name
      boolean recursive (optional, default:false) = apply to all children and grandchildren
      int olderThanDays (optional, default:30) = execute against all content matching the label older than 'X' days
      boolean archive(optional, default:false) = archive instead of delete
    By rule:
      string rule(required) = rule to apply
      int olderThanDays(optional, default:30) = execute against all content matched by rule older than 'X' days
      boolean archive(optional, default:false) = archive instead of delete
  */
  const filterDefinitions = new Set([
    {
      label:'001-Filtered',
      recursive: true,
      olderThanDays: 35
    },
    {
      rule:'from:johndoe@gmail.com',
      olderThanDays: 32
    },
    {
      label:'30 Day Retention',
      recursive: true
    },
    {
      label:'GitHub',
      recursive: true
    },
    {
      rule: '(category:Social or category:Promotions)',
      olderThanDays: 7
    }
  ])

function Initialize() {
  return;
}

function InstallTriggers() {

  //Run first trigger in 1 minute
  ScriptApp.newTrigger(TRIGGER_ENTRYPOINT)
           .timeBased()
           .at(new Date((new Date()).getTime() + 1000*60*1))
           .create();
  
  // Daily
  ScriptApp.newTrigger(TRIGGER_ENTRYPOINT)
           .timeBased().everyDays(1).create();

}

function removeTriggers() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i=0; i<triggers.length; i++) {
    ScriptApp.deleteTrigger(triggers[i]);
  }
}

function removeDisabledTriggers() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i=0; i<triggers.length; i++) {
    if(triggers[i].isDisabled())
      ScriptApp.deleteTrigger(triggers[i]);
  }
}

function UninstallTriggers() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i=0; i<triggers.length; i++) {
    ScriptApp.deleteTrigger(triggers[i]);
  }
}

function checkFiltersForEmails() {
  removeDisabledTriggers();
  filterDefinitions.forEach( x => {
    if(x.rule == undefined && x.label == undefined) {
      Logger.log("You MUST define either a rule or label to apply the batch archive/delete operation to.  Check your filterDefinitions for accuracy.");
      return;
    }
    var cutOffDate = new Date();
    cutOffDate.setDate(cutOffDate.getDate() - (x.olderThanDays ? x.olderThanDays : 30));
    beforeDate = Utilities.formatDate(cutOffDate, "GMT", "yyyy-MM-dd")
    Logger.log(`cutOffDate: ${beforeDate}`);
    var search = "";
    if(x.label) {
      var searchLabels = [x.label];
      if(x.recursive === true) {
        var children = getChildren(GmailApp.getUserLabelByName(x.label));
        if(children)
          children.forEach(y => {
            searchLabels.push(y.getName())
          })
      }
      search = `(label:"${searchLabels.join("\" OR label:\"")}\") before:${beforeDate}`;
      
    }
    else if(x.rule) {
      if(x.rule.includes("before:") || x.rule.includes("older_than:"))
        search = x.rule;
      else
        search = `(${x.rule}) before:${beforeDate}`;
    }
    Logger.log(`Search filter definition: ${search}`);

    applyBulkAction(search, (x.archive ? "moveThreadsToArchive" : "moveThreadsToTrash"))
  })
}

function applyBulkAction(search, bulkAction) {
  var batchSize = 100; //
  var limitThreads = 400; // Limit search to only return 100 threads

  var threads = GmailApp.search(search, 0, limitThreads);
  Logger.log(`Result count: ${threads.length}`);
  var trigger = undefined;
  if(threads.length == limitThreads)
  {
    trigger =   ScriptApp.newTrigger(TRIGGER_ENTRYPOINT)
           .timeBased()
           .at(new Date((new Date()).getTime() + 1000*60*RETRY_TRIGGER_INTERVAL))
           .create();
  }
  var startJobTime = Date.now();
  Logger.log(`Applying bulk action[${bulkAction}] for ${threads.length} threads using batch sizes of ${batchSize} `);
  for (j = 0; j < threads.length; j += batchSize) {
    
    GmailApp[bulkAction](threads.slice(j, j + batchSize));
  }
  Logger.log(`Time take to execute batch: ${Date.now() - startJobTime}`);
  if(trigger)
  {
    ScriptApp.deleteTrigger(trigger);
    applyBulkAction(search, bulkAction);
  }
  
  
  return threads.length
}

function getChildren(parent) { 
  var name = parent.getName() + '/';
  Logger.log("Parent label: " + name)
  return GmailApp.getUserLabels().filter(function(label) {
    return label.getName().slice(0, name.length) == name;
  });
}
