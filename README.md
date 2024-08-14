# Gmail-BulkDelete
This project aims to allow a person to define a set of rules based on labels or rules to automatically delete emails that are older than a set amount of days.   It has ability to recursively clean out emails in child labels as well.


# Installation
*  Create a project at [script.google.com](https://script.google.com/home)
*  In the file that opens paste the contents of the https://github.com/DawtCom/Gmail-BulkDelete/blob/master/DeleteEmails.gs
*  Click on on the gear icon "Project Settings" and check the box next to: **Show "appsscript.json" manifest file in editor**.  This will unhide the appscript.json in the editor so that you can apply permission scopes for this to run properly
*  Copy the contents of https://github.com/DawtCom/Gmail-BulkDelete/blob/master/appscript.json into the appscript.json of the project.
*  Update the filterDefinitions section to match the criteria you want to use for bulk deletion of emails
*  Click the save button

**Note:  The actions below will most likely ask for permissions approval for google and gmail apis. This is normal so that it can apply the triggers and allow access to the email account this will be applied to.**

*  In the drop down above choose the InstallTriggers to install the triggers.   Click run.  This will create 2 time based triggers.  One which will start in 1 minute and the other is a daily trigger to run at least once a day.
*  In the drop down choose Initialize and then click run.

And there you have it, the rules defined in the filterDefinitions will be applied to your emails

```javascript
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

```
