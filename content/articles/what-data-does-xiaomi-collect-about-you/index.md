---
title: "What data does Xiaomi collect about you?"
date: 2020-05-08T13:43:47+02:00
lastmod: 2020-05-08T14:48:47+02:00
description: A high-level overview of the various events making Xiaomi browsers send your private data to Xiaomi servers - by default, unless you discover an obscure settings combination.
categories:
- xiaomi
- security
- privacy
---

A few days ago I published a very technical article [confirming that Xiaomi browsers collect a massive amount of private data](/2020/05/04/are-xiaomi-browsers-spyware-yes-they-are.../). This fact was initially publicized in a [Forbes article](https://www.forbes.com/sites/thomasbrewster/2020/04/30/exclusive-warning-over-chinese-mobile-giant-xiaomi-recording-millions-of-peoples-private-web-and-phone-use/) based on the research by Gabriel Cîrlig and Andrew Tierney. After initially dismissing the report as incorrect, Xiaomi has since updated their Mint and Mi Pro browsers to include an option to disable this tracking in incognito mode.

{{< img src="xiaomi-privacy.png" width="600" alt="Xiaomi demonstrating a privacy fig leaf" >}}
<em>
  Image credits:
  <a href="https://commons.wikimedia.org/wiki/File:Xiaomi_Corporation.svg" rel="nofollow">1mran IN</a>,
  <a href="https://publicdomainvectors.org/en/free-clipart/Cartoon-Adam-and-Eve/53416.html" rel="nofollow">Openclipart</a>
</em>
{{< /img >}}

Is the problem solved now? Not really. There is now exactly one non-obvious setting combination where you can have your privacy with these browsers: "Incognito Mode" setting on, "Enhanced Incognito Mode" setting off. With these not being the default and the users not informed about the consequences, very few people will change to this configuration. So the browsers will continue spying on the majority of their user base.

In this article I want to provide a high-level overview of the data being exfiltrated here. TL;DR: Lots and lots of it.

{{< toc >}}

*Disclaimer*: This article is based entirely on reverse engineering Xiaomi Mint Browser 3.4.3. I haven't seen the browser in action, so some details might be wrong. **Update** (2020-05-08): From a quick glance at Xiaomi Mint Browser 3.4.4 which has been released in the meantime, no further changes to this functionality appear to have been implemented.

## Event data

When allowed, Xiaomi browsers will send information about a multitude of different events, sometimes with specific data attached. For example, an event will typically be generated when some piece of the user interface shows up or is clicked, an error occurs or the current page's address is copied to clipboard. There are more interesting events as well however, for example:

* A page started or finished loading, with the page address attached
* Change of default search engine, with old and new search engines attached
* Search via the navigation bar, with the search query attached
* Reader mode switched on, with the page address attached
* A tab clicked, with the tab name attached
* A page being shared, with the page address attached
* Reminder shown to switch on Incognito Mode, with the porn site that triggered the reminder attached
* YouTube searches, with the search query attached
* Video details for a YouTube video opened or closed, with video ID attached
* YouTube video played, with video ID attached
* Page or file downloaded, with the address attached
* Speed dial on the homepage clicked, added or modified, with the target address attached

## Generic annotations

Some pieces of data will be attached to every event. These are meant to provide the context, and to group related events of course. This data includes among other things:

* A randomly generated identifier that is unique to your browser instance. While this identifier is supposed to change every 90 days, this won't actually happen due to a bug. In most cases, it should be [fairly easy to recognize the person behind the identifier](/2020/02/18/insights-from-avast/jumpshot-data-pitfalls-of-data-anonymization/).
* An additional [device identifier](https://developer.android.com/reference/android/provider/Settings.Secure#ANDROID_ID) (this one will stay unchanged even if app data is cleared)
* If you are logged into your Mi Account: the identifier of this account
* The exact time of the event
* Device manufacturer and model
* Browser version
* Operating system version
* Language setting of your Android system
* Default search engine
* Mobile network operator
* Network type (wifi, mobile)
* Screen size

## Conclusions

Even with the recent changes, Xiaomi browsers are massively invading users' privacy. The amount of data collected by default goes far beyond what's necessary for application improvement. Instead, Xiaomi appears to be interested in where users go, what they search for and which videos they watch. Even with a fairly obscure setting to disable this tracking, the default behavior isn't acceptable. If you happen to be using a Xiaomi device, you should install a different browser ASAP.
