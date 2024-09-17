---
categories:
- avast
- security
- antivirus
date: 2024-07-15T14:25:04+0200
description: Another look into Avast Secure Browser shows a massive attack surface,
  with some issues mentioned five years ago only partially addressed, all while new
  ways to attack the browser have been added.
lastmod: '2024-09-17 13:59:12'
title: How insecure is Avast Secure Browser?
---

A while ago I already looked into Avast Secure Browser. Back then it didn’t end well for Avast: I [found critical vulnerabilities allowing arbitrary websites to infect user’s computer](/2020/01/13/pwning-avast-secure-browser-for-fun-and-profit/). Worse yet: much of it was due to neglect of secure coding practices, existing security mechanisms were disabled for no good reason. I didn’t finish that investigation because I discovered that [the browser was essentially spyware](/2019/10/28/avast-online-security-and-avast-secure-browser-are-spying-on-you/), collecting your browsing history and selling it via Avast’s Jumpshot subsidiary.

But that was almost five years ago. After an initial phase of denial, Avast decided to [apologize and to wind down Jumpshot](https://blog.avast.com/a-message-from-avast). It was certainly a mere coincidence that Avast was subsequently sold to NortonLifeLock, called Gen Digital today. Yes, Avast is truly reformed and paying for their crimes [in Europe](https://www.edpb.europa.eu/news/news/2024/czech-sa-imposed-fine-139-million-eur-infringement-art-6-and-art-13-gdpr_en) and [the US](https://www.ftc.gov/system/files/ftc_gov/pdf/202_3033_-_avast_final_consent_package.pdf). According to the European decision, Avast is still arguing [despite better knowledge](/2020/02/18/insights-from-avast/jumpshot-data-pitfalls-of-data-anonymization/) that their data collection was fully anonymized and completely privacy-conformant but… well, old habits are hard to get rid of.

Either way, it’s time to take a look at Avast Secure Browser again. Because… all right, because of the name. That was a truly ingenious idea to name their browser like that, nerd sniping security professionals into giving them free security audits. By now they certainly would have addressed the issues raised in my original article and made everything much more secure, right?

{{< img src="avast.png" alt="Malicious actors coming through Avast software" width="600" />}}

*Note*: This article does not present any actual security vulnerabilities. Instead, this is a high-level overview of design decisions that put users at risk, artificially inflating the attack surface and putting lots of trust into the many, many companies involved with the Avast webspaces. TL;DR: I wouldn’t run Avast Secure Browser on any real operating system, only inside a virtual machine containing no data whatsoever.

{{< toc >}}

## Summary of the findings

The issues raised in my original article about the pre-installed browser extensions are still partially present. Two extensions are relaxing the default protection provided by [Content-Security-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy) even though it could have been easily avoided. One extension is requesting massive privileges, even though it doesn’t actually need them. At least they switched from jQuery to React, but they still somehow managed to end up with HTML injection vulnerabilities.

In addition, two extensions will accept messages from any Avast website – or servers pretending to be Avast websites, since HTTPS-encrypted connections aren’t being enforced. In the case of the Privacy Guard (sic!) extension, this messaging exposes users’ entire browsing information to websites willing to listen. Yes, Avast used to collect and sell that information in the past, and this issue could in principle allow them to do it again, this time in a less detectable way.

The Messaging extension is responsible for the rather invasive “onboarding” functionality of the browser, allowing an Avast web server to determine almost arbitrary rules to nag the user – or to redirect visited websites. Worse yet, access to internal browser APIs has been exposed to a     number of Avast domains. Even if Avast (and all the other numerous companies involved in running these domains) are to be trusted, there is little reason to believe that such a huge attack surface can possibly be secure. So it has to be expected that other websites will also be able to abuse access to these APIs.

## What is Avast Secure Browser?

Avast Secure Browser is something you get automatically if you don’t take care while installing your Avast antivirus product. Or AVG antivirus. Or Avira. Or Norton. Or CCleaner. All these brands belong to Gen Digital now, and all of them will push Avast Secure Browser under different names.

According to their web page, there are good reasons to promote this browser:

{{< img src="website.png" width="630" alt="Website screenshot showing Avast Secure Browser name and logo above the title “Download a secure, private browser that’s 100% free.” The text below says: “Our free private browser helps you surf the web, message, and shop more safely online. Plus, block ads and boost your online privacy.”" />}}

So one of the reasons is: this browser is 100% free. And it really is, as in: “you are the product.” I took the liberty of making a screenshot of the browser and marking the advertising space:

{{< img src="browser_advertising.png" width="720" alt="Screenshot of a browser showing a new tab, most of it marked with half-transparent red. The marked areas are: VPN button next to the location bar, bookmarks bar (six out of seven bookmarks), the space above the search bar (German-language ad for a tourism company) and the space below it (more sponsored bookmarks)." />}}

Yes, maybe this isn’t entirely fair. I’m still indecisive as to whether the search bar should also be marked. The default search engine is Bing and the browser will nudge you towards keeping it selected. Not because Microsoft’s search engine is so secure and private of course but because they are paying for it.

But these are quality ads and actually useful! Like that ad for a shop selling food supplements, so that you can lead a healthy life. A quick search reveals that one of the three food supplements shown in the ad is likely useless with the suspicion of being harmful. Another brings up lots of articles by interested parties claiming great scientifically proven benefits but no actual scientific research on the topic. Finally the third one could probably help a lot – if there were any way of getting it into your body in sufficient concentration, which seems completely impossible with oral intake.

Now that we got “free” covered, we can focus on the security and privacy aspects in the subsequent sections.

## The pre-installed extensions

There are various reasons for browser vendors to pre-package extensions with their browser. Mozilla Firefox uses extensions to distribute experimental features before they become an integral part of the browser. As I learned back in 2011, Google Chrome [uses such extensions to promote their web applications and give them an advantage over competition](/2011/11/15/google-chrome-and-pre-installed-web-apps/). And as Simon Willison discovered only a few days ago, the Google Hangouts extension built into Google Chrome [gives Google domains access to internal browser APIs](https://simonwillison.net/2024/Jul/9/hangout_servicesthunkjs/) – quite nifty if one wants better user tracking capabilities.

My previous article mentioned Avast Secure Browser adding eleven extensions to the ones already built into Google Chrome. This number hasn’t changed: I still count eleven extensions, even though their purposes might have changed. At least that’s eleven extensions for me, differently branded versions of this browser seem to have a different combination of extensions. Only two of these extensions (Coupons and Video Downloader) are normally visible in the list of extensions and can be easily disabled. Three more extensions (Avast Bank Mode, Avast SecureLine VPN, Privacy Guard) become visible when Developer Mode is switched on.

{{< img src="browser_extensions.png" width="496" alt="Screenshot of the extension list with two extensions listed under “Pre-installed by Avast”: Coupons and Video Downloader" />}}

And then there are five extensions that aren’t visible at all and cannot be disabled by regular means: Anti-Fingerprinting, Messaging, Side Panel, AI Chat, Phishing Protection. Finally, at least the New Tab extension is hardwired into the browser and is impossible to disable.

Now none of this is a concern if these extensions are designed carefully with security and privacy in mind. Are they?

### Security mechanisms disabled

My previous article [described the Video Downloader extension as a huge “please hack me” sign](/2020/01/13/pwning-avast-secure-browser-for-fun-and-profit/#selecting-a-target). Its extension manifest requested every permission possible, and it also weakened [Content-Security-Policy (CSP) protection](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) by allowing execution of dynamic scripts. Both were completely unnecessary, my proof of concept exploit abused it to get a foothold in the Avast Secure Browser.

Looking at the current Video Downloader manifest, things are somewhat better today:

```json
{
  "content_security_policy": "script-src 'self' 'unsafe-eval'; object-src 'self'",
  "permissions": [
    "activeTab", "downloads", "management", "storage", "tabs", "webRequest",
    "webRequestBlocking", "<all_urls>"
  ],
}
```

The permissions requested by this extension still grant it almost arbitrary access to all websites. But at least the only unused privilege on this list is `management` which gives it the ability to disable or uninstall other extensions.

As to CSP, there is still `'unsafe-eval'` which allowed this extension to be compromised last time. But now it’s there for a reason: Video Downloader “needs” to run some JavaScript code it receives from YouTube in order to extract some video metadata.

I did not test what this code is or what it does, but this grants at the very least the YouTube website the ability to compromise this extension and, via it, the integrity of the entire browser. But that’s YouTube, it won’t possibly turn evil, right?

For reference: it is *not* necessary to use `'unsafe-eval'` to run some untrusted code. It’s always possible to create an `<iframe>` element and use the [sandbox attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#sandbox) to execute JavaScript code in it without affecting the rest of the extension.

But there are more extensions. There is the Avast Bank Mode extension for example, and its extension manifest says:

```json
{
  "content_security_policy": "script-src 'self' 'unsafe-eval'; object-src 'self'",
  "permissions": [
    "activeTab", "alarms", "bookmarks", "browsingData", "clipboardRead",
    "clipboardWrite", "contentSettings", "contextMenus", "cookies", "debugger",
    "declarativeContent", "downloads", "fontSettings", "geolocation", "history",
    "identity", "idle", "management", "nativeMessaging", "notifications",
    "pageCapture", "power", "privacy", "proxy", "sessions", "storage", "system.cpu",
    "system.display", "system.memory", "system.storage", "tabCapture", "tabs", "tts",
    "ttsEngine", "unlimitedStorage", "webNavigation", "webRequest",
    "webRequestBlocking", "http://*/*", "https://*/*", "<all_urls>"
  ],
}
```

Yes, requesting every possible permission *and* allowing execution of dynamic scripts at the same time, the exact combination that wreaked havoc last time. Why this needs `'unsafe-eval'`? Because it uses some ancient [webpack](https://webpack.js.org/) version that relies on calling `eval()` in order to “load” JavaScript modules dynamically. Clearly, relaxing security mechanisms was easier than using a better module bundler (like the one used by other Avast extensions).

### The (lack of) ad blocking privacy

The Privacy Guard extension is responsible for blocking ads and trackers. It is meant by the sentence “block ads and boost your online privacy” in the website screenshot above. It is also one of the two extensions containing the following entry in its manifest:

```json
{
  "externally_connectable": {
    "ids": [ "*" ],
    "matches": [
      "*://*.avastbrowser.com/*",
      "*://*.avgbrowser.com/*",
      "*://*.ccleanerbrowser.com/*",
      "*://*.avast.com/*",
      "*://*.securebrowser.com/*"
    ]
  },
}
```

What this means: any other extension installed is allowed to send messages to the Privacy Guard extension. That isn’t restricted to Avast extensions, any other extension you installed from Avast’s or Google’s add-on store is allowed to do this as well.

The same is true for any website under the domains `avast.com`, `securebrowser.com`, `avastbrowser.com`, `avgbrowser.com` or `ccleanerbrowser.com`. Note that the rules here don’t enforce `https://` scheme, unencrypted HTTP connections will be allowed as well. And while `avast.com` domain seems to be protected by [HTTP Strict Transport Security](https://en.wikipedia.org/wiki/HTTP_Strict_Transport_Security), the other domains are not.

Why this matters: when your browser requests `example.securebrowser.com` website over an unencrypted HTTP connection, it cannot be guaranteed that your browser is actually talking to an Avast web server. In fact, any response is *guaranteed* to come from a malicious web server because to such website exists.

One way you might get a response from such a malicious web server is connecting to a public WiFi. In principle, anyone connected to the same WiFi could redirect unencrypted web requests to their own malicious web server, inject an invisible request to `example.securebrowser.com` in a frame (which would also be handled by their malicious server) and gain the ability to message Privacy Guard extension. While not common, this kind of attack [did happen in the wild](https://www.bleepingcomputer.com/news/security/australian-charged-for-evil-twin-wifi-attack-on-plane/).

And what does someone get then? Let me show you:

```js
chrome.runtime.connect("onochehmbbbmkaffnheflmfpfjgppblm", {name: "PG_STORE"})
  .onMessage.addListener(x => console.log(x));
```

This establishes a connection to the extension and logs all incoming messages. One message is received immediately:

```json
{
  "type": "chromex.state",
  "payload": {
    "main": {
      "settings": {
        "paused": false,
        "off": false,
        "blockingMode": "strict",
        "showIconBadge": true,
        "fingerprintEnabled": true,
        "previousBlockingModeIsOff": false
      },
      "pausedDomains": [],
      "whitelist": [],
      "afpWhitelist": [],
      "installationInfo": {
        "hostPrefix": "",
        "noProBrand": false,
        "urls": {
          "faqUrl": "https://extension.securebrowser.com/privacy-guard/learn-more/",
          "proUrl": "https://extension.securebrowser.com/privacy-guard/offer/"
        },
        "whitelists": {
          "whitelist": "https://update.avastbrowser.com/adblock/assets/v3/document_whitelist.txt",
          "filterWhitelist": "https://update.avastbrowser.com/adblock/assets/v3/filter_whitelist.txt",
          "searchWhitelist": "https://update.avastbrowser.com/adblock/assets/v3/search_document_whitelist.txt"
        }
      },
      "isProUser": false,
      "blockedAdsCount": 12
    },
    "tabs": {
      "391731034": {
        "adsBlocked": 0,
        "fingerprintAttempts": 0,
        "adsAllowed": 0,
        "listAdsBlocked": [],
        "listAdsAllowed": [],
        "pageAllowed": false,
        "isInternal": false,
        "domainIsPaused": false,
        "isInUserWhitelist": false,
        "isInUserAfpWhitelist": false,
        "netFilteringSwitch": true,
        "active": true,
        "audible": false,
        "autoDiscardable": true,
        "discarded": false,
        "groupId": -1,
        "height": 514,
        "highlighted": true,
        "id": 391731034,
        "incognito": false,
        "index": 2,
        "lastAccessed": 1720641256405.484,
        "mutedInfo": {
          "muted": false
        },
        "openerTabId": 391731032,
        "pendingUrl": "secure://newtab/",
        "pinned": false,
        "selected": true,
        "status": "complete",
        "title": "Example Domain",
        "url": "https://example.com/",
        "width": 299,
        "windowId": 391730998,
        "favIconUrl": "https://example.com/favicon.ico"
      },
      "-1": {
        "adsBlocked": 0,
        "fingerprintAttempts": 0,
        "adsAllowed": 0,
        "listAdsBlocked": [],
         "listAdsAllowed": [],
        "isInternal": true
      },
      "active": 391731034
    }
  }
}
```

The first part are the Privacy Guard settings, your whitelisted domains, everything. There are also the three hardcoded lists containing blocking exceptions – funny how Avast doesn’t seem to mention these anywhere in the user interface or documentation. I mean, it looks like in the default “Balanced Mode” their ad blocker won’t block any ads on Amazon or eBay among other things. Maybe Avast should be more transparent  about that, or people might get the impression that this has something to do with those sponsored bookmarks.

And then there is information about all your browsing tabs which I shortened to only one tab here. It’s pretty much [all information produced by the tabs API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs), enriched with some information on blocked ads. Privacy Guard will not merely send out the current state of your browsing session, it will also send out updates whenever something changes. To any browser extension, to any Avast website and to any web server posing as an Avast website.

Does Avast abuse this access to collect users’ browsing data again? It’s certainly possible. As long as they only do it for a selected subset of users, this would be very hard to detect however. It doesn’t help that Avast Secure Browser tracks virtual machine usage among other things, so it’s perfectly plausible that this kind of behavior won’t be enabled for people running one. It may also only be enabled for people who opened the browser a given number of times after installing it, since this is being tracked as well.

Can other browser extensions abuse this to collect users’ browsing data? Absolutely. An extension can declare minimal privileges, yet it will still be able to collect the entire browsing history thanks to Privacy Guard.

Can a malicious web server abuse this to collect users’ browsing data beyond a single snapshot of currently open tabs? That’s more complicated since this malicious web server would need its web page to stay open permanently somehow. While Avast has the capabilities to do that (more on that below), an arbitrary web server normally doesn’t and has to resort to social engineering.

The messaging interface doesn’t merely allow reading data, the data can also be modified almost arbitrarily as well. For example, it’s possible to enable ad blocking without any user interaction. Not that it changes much, the data collection is running whether ad blocking is enabled or not.

This messaging interface can also be used to add exceptions for arbitrary domains. And while Privacy Guard options page is built using React.js which is normally safe against HTML injections, in one component they chose to use a feature with the apt name [dangerouslySetInnerHTML](https://react.dev/reference/react-dom/components/common#dangerously-setting-the-inner-html). And that component is used among other things for displaying, you guessed it: domain exceptions.

This is not a [Cross-Site Scripting vulnerability](https://en.wikipedia.org/wiki/Cross-site_scripting), thanks to CSP protection not being relaxed here. But it allows injecting HTML content, for example CSS code to mess with Privacy Guard’s options page. This way an attacker could ensure that exceptions added cannot be removed any more. Or they could just make Privacy Guard options unusable altogether.

### The onboarding experience

The other extension that can be messaged by any extension or Avast web server is called Messaging. Interestingly, Avast went as far as disabling Developer Tools for it, making it much harder to inspect its functionality. I don’t know why they did it, maybe they were afraid people would freak out when they saw the output it produces while they are browsing?

{{< img src="messaging_extension.png" width="566" alt="Developer Tools screenshot showing console messages citing some trigger evaluation, checking values like url_in_tab, installed_extensions against some given parameters." />}}

You wonder what is going on? This extension processes some rules that it downloaded from `https://config.avast.securebrowser.com/engagement?content_type=messaging,messaging_prefs&browser_version=126.0.25496.127` (with some more tracking parameters added). Yes, there is a lot of info  here, so let me pick out one entry and explain it:

```json
{
  "post_id": 108341,
  "post_title": "[190] Switch to Bing provider &#8211; PROD; google",
  "engagement_trigger_all": [
    {
      "parameters": [
        {
          "operator": "s_regex",
          "value": "^secure:\\/\\/newtab",
          "parameter": {
            "post_id": 11974,
            "name": "url_in_tab",
            "post_title": "url_in_tab",
            "type": "string"
          }
        }
      ]
    },
    {
      "parameters": [
        {
          "operator": "s_regex",
          "value": "google\\.com",
          "parameter": {
            "post_id": 25654,
            "name": "setting_search_default",
            "post_title": "setting_search_default (search provider)",
            "type": "string"
          }
        }
      ]
    }
  ],
  "engagement_trigger_any": [
    {
      "parameters": [
        {
          "operator": "equals",
          "value": "0",
          "parameter": {
            "post_id": 19236,
            "name": "internal.triggerCount",
            "post_title": "internal.triggerCount",
            "type": "number"
          }
        }
      ]
    },
    {
      "parameters": [
        {
          "operator": "n_gte",
          "value": "2592000",
          "parameter": {
            "post_id": 31317,
            "name": "functions.interval.internal.triggered_timestamp",
            "post_title": "interval.internal.triggered_timestamp",
            "type": "number"
          }
        }
      ]
    }
  ],
  "engagement_trigger_none": [],
  …
}
 ```

The `engagement_trigger_all` entry lists conditions that have all be true: you have to be on the New Tab page, and your search provider has to be Google. The `engagement_trigger_any` entry lists conditions where any one is sufficient: this particular rule should not have been triggered before, or it should have been triggered more than 2592000 seconds (30 days) ago. Finally, `engagement_trigger_none` lists conditions that should prevent this rule from applying. And if these conditions are met, the Messaging extension will inject a frame into the current tab to nag you about switching from Google to Bing:

{{< img src="nag_screen.png" width="432" alt="Screenshot of a message titled “Update your browser settings” and text: “Some settings could be adjusted for better security and performance. We can update you with just one click: Privacy Guard → Balanced, Search by → Bing, Browsing speed → Enhanced.” The big blue button says “Update now,” there is a small gray link next to it saying “Later.”" />}}

Another rule will nag you every 30 days about enabling the Coupons extension, also a cash cow for Avast. There will be a nag to buy the PRO version for users opening a Private Browsing window. And there is more, depending on the parameters sent when downloading these rules probably much more.

An interesting aspect here is that these rules don’t need to limit themselves to information provided to them. They can also call any function of private Avast APIs under the `chrome.avast`, `chrome.avast.licensing` and `chrome.avast.onboarding` namespaces. Some API functions which seem to be called in this way are pretty basic like `isPrivateWindow()` or `isConnectedToUnsafeWifi()`, while `gatherInfo()` for example will produce a whole lot of information on bookmarks, other browsers and Windows shortcuts.

Also, displaying the message in a frame is only one possible “placement” here. The Messaging extension currently provides eight different user interface choices, including straight out redirecting the current page to an address provided in the rule. But don’t worry: Avast is unlikely to start redirecting your Google searches to Bing, this would raise too many suspicions.

## Super-powered websites

Why is the Messaging extension allowing some Avast server to run browser APIs merely a side-note in my article? Thing is: this extension doesn’t really give this server anything that it couldn’t do all by itself. When it comes to Avast Secure Browser, Avast websites have massive privileges out of the box.

The browser grants these privileges to any web page under the `avast.com`, `avg.com`, `avastbrowser.com`, `avgbrowser.com`, `ccleanerbrowser.com` and `securebrowser.com` domains. At least here HTTPS connections are enforced, so that posing as an Avast website won’t be possible. But these websites automatically get access to:

* [chrome.bookmarks API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/bookmarks): full read/write access to bookmarks
* [chrome.management API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/management): complete access to extensions except for the ability to install them
* `chrome.webstorePrivate` API: a private browser API that allows installing extensions.
* A selection of private Avast APIs:
  * `chrome.avast`
  * `chrome.avast.licensing`
  * `chrome.avast.ntp`
  * `chrome.avast.onboarding`
  * `chrome.avast.ribbon`
  * `chrome.avast.safebrowsing`
  * `chrome.avast.safesearch`
  * `chrome.avast.stats`
  * `chrome.avast.themes`

Now figuring out what all these private Avast APIs do in detail, what their abuse potential is and whether any of their crashes are exploitable requires more time than I had to spend on this project. I can see that `chrome.avast.ntp` API allows manipulating the tiles displayed on the new tab page in arbitrary ways, including reverting all your changes so that you only see those sponsored links. `chrome.avast.onboarding` API seems to allow manipulating the “engagement” data mentioned above, so that arbitrary content will be injected into tabs matching any given criteria. Various UI elements can be triggered at will. I’ll leave figuring out what else these can do to the readers. If you do this, please let me know whether `chrome.avast.browserCall()` can merely be used to communicate with Avast’s Security & Privacy Center or exposes Chromium’s internal messaging.

But wait, this is Avast we are talking about! We all know that Avast is trustworthy. After all, they [promised to the Federal Trade Commission](https://www.ftc.gov/system/files/ftc_gov/pdf/202_3033_-_avast_final_consent_package.pdf) that they won’t do anything bad any more. And as I said above, impersonating an Avast server won’t be possible thanks to HTTPS being enforced. Case closed, no issue here?

Not quite, there are far more parties involved here. Looking only at `www.avast.com`, there is for example OneTrust who are responsible for the cookie banners. Google, Adobe, hotjar, qualtrics and mpulse are doing analytics (a.k.a. user tracking). A Trustpilot widget is also present. There is some number of web hosting providers involved (definitely Amazon, likely others as well) and at least two content delivery networks (Akamai and Cloudflare).

And that’s only one host. Looking further, there is a number of different websites hosted under these domains. Some are used in production, others are experiments, yet more appear to be abandoned in various states of brokenness. Some of these web services seem to be run by Avast while others are clearly run by third parties. There is for some reason a broken web shop run by a German e-commerce company, same that used to   power Avira’s web shop before Gen Digital bought them.

If one were to count it all together, I would expect that a high two digit number of companies can put content on the domains mentioned above. I wouldn’t be surprised however if that number even went into three digits. Every single one of these companies can potentially abuse internal APIs of the Avast Secure Browser, either because they decide to make some quick buck, are coerced into cooperation by their government or their networks simply get compromised.

And not just that. It isn’t necessary to permanently compromise one of these web services. A simple and very common [Cross-Site Scripting vulnerability](https://en.wikipedia.org/wiki/Cross-site_scripting) in any one of these web services would grant any website on the internet access to these APIs. Did Avast verify the security and integrity of each third-party service they decided to put under these domains? I very much doubt so.

It would appear that the official reason for providing these privileges to so many websites was aiding the onboarding experience mentioned above. Now one might wonder whether such a flexible and extensive onboarding process is really necessary. But regardless of that, the reasonable way of doing this is limiting the attack surface. If you need to grant privileges to web pages, you grant them to a single host name. You make sure that this single host name doesn’t run any more web services than it absolutely needs, and that these web services get a proper security review. And you add as many protection layers as possible, e.g. the [Content-Security-Policy mechanism](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy) which is severely underused on Avast websites.

I’ll conclude by quoting the [decision to penalize Avast for their GDPR violations](https://uoou.gov.cz/media/rozhodnuti/rozhodnuti-predsedy/2024/uoou-0102520-121-aj.pdf):

> At this point, the Appellate Authority considers it necessary to recall that the Charged Company provides software designed to protect the privacy of its users. As a professional in the information and cyber field, the Charged Company is thereby also expected to be extremely knowledgeable in the field of data protection.

Yeah, well…