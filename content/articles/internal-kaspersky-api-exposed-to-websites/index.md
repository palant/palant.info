---
title: "Internal Kaspersky API exposed to websites"
date: 2019-11-26T10:06:40+01:00
description: Kaspersky applications accept commands from arbitrary websites. Impact reduced by now but not really resolved.
categories:
  - kaspersky
  - security
  - privacy
image: doormat.png
---

In December 2018 I discovered a series of vulnerabilities in Kaspersky software such as Kaspersky Internet Security 2019. Due to the way its Web Protection feature is implemented, internal application functionality can used by any website. It doesn't matter whether you allowed Kaspersky Protect browser extension to be installed, Web Protection functionality is active regardless and exploitable.

{{< img src="doormat.png" alt="Kaspersky's communication with the browser protected by an easy to find key" width="600" />}}

*Note*: This is the high-level overview. If you want all the technical details you can find them [here](/2019/11/25/kaspersky-the-art-of-keeping-your-keys-under-the-door-mat/).

{{toc}}

## What does Web Protection do?

Indicating benign and malicious search results is a common antivirus feature by now, and so it is part of the Web Protection feature in Kaspersky applications. In addition, functionality like blocking advertising and tracking is included, as well as a virtual keyboard as a (questionable) measure to protect against keyloggers.

{{< img src="url_advisor.png" alt="URL Advisor pop-up on a link" width="286" />}}

## The issue

In order to do its job, Web Protection needs to communicate with the main Kaspersky application. In theory, this communication is protected by a "signature" value that isn't known to websites. In practice however, websites can find the "signature" value fairly easily. This allows them to establish a connection to the Kaspersky application and send commands just like Web Protection would do.

As of December 2018, websites could use this vulnerability for example to silently disable ad blocking and tracking protection functionality. They could also do quite a few things where the impact wasn't quite as obvious, I didn't bother investigating all of them.

## The fix that made things worse

Initially, Kaspersky declared the issue resolved in July 2019 when the 2020 family of their products was released. Unexpected to me, preventing websites from establishing a connection to the application wasn't even attempted here. Instead, parts of the functionality were rendered inaccessible to websites. Which parts? The ones I used to demonstrate the vulnerabilities: completely disabling ad blocking and tracking protection.

Other commands would still be accepted and I immediately pointed out that websites could still disable ad blocking on their own domain. They could also attempt to add ad blocking rules, something that the user still had to confirm however.

{{< img src="block_banner.png" alt="Confirmation pop-up showing when a blocking filter is added" width="433" />}}

Also, new issues showed up which weren't there before. Websites could now gather lots of information about the user's system, including a unique user identifier which could be used to recognize the user even across different browsers on the same system.

{{< img src="tracking_info.png" alt="Various pieces of information leaked by Kaspersky API" width="450" />}}

And last but not least, the fix introduced a bug that allowed websites to trigger a crash in the antivirus process! So websites could make the antivirus shut down and leave the system completely unprotected.

{{< img src="crash.png" alt="Message displayed by Kaspersky when restarted after a crash" width="614" />}}

## Further fix attempts

The next fix came out as Patch E for the 2020 family of Kaspersky products. It moved configuring ad blocking functionality into the "not for websites" section, and it would no longer leak data about the user's system. The crash was also mostly fixed. As in: under some circumstances, antivirus would still crash. At least it doesn't look like websites can still trigger it, only browser extensions or local applications.

So another patch will become available this week, and this time the crash will hopefully be a thing of the past. One thing won't change however: websites can still send commands to Kaspersky applications. Is all the functionality they can trigger there harmless? I wouldn't bet on it.
