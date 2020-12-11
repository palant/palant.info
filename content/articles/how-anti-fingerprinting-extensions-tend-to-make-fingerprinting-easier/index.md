---
categories:
- security
- privacy
date: 2020-12-10 14:57:43+01:00
description: Browser extensions claiming to protect against fingerprinting will typically
  result in more data available for fingerprinting.
lastmod: '2020-12-11 18:03:27'
title: How anti-fingerprinting extensions tend to make fingerprinting easier
---

Do you have a privacy protection extension installed in your browser? There are so many around, and every security vendor is promoting their own. Typically, these will provide a feature called “anti-fingerprinting” or “fingerprint protection” which is supposed to make you less identifiable on the web. What you won’t notice: this feature is almost universally flawed, potentially allowing even better fingerprinting.

{{< img src="piglet.png" width="600" alt="Pig disguised as a bird but still clearly recognizable">}}
<em>
  Image credits:
  <a href="https://pixabay.com/vectors/pig-disguised-bird-wings-piglet-575844/" rel="nofollow">OpenClipart</a>
</em>
{{< /img >}}

I’ve seen a number of extensions misimplement this functionality, yet I rarely bother to write a report. The effort to fully explain the problem is considerable. On the other hand, it is obvious that for most vendors privacy protection is merely a check that they can put on their feature list. Quality does not matter because no user will be able to tell whether their solution actually worked. With minimal resources available, my issue report is unlikely to cause a meaningful action.

That’s why I decided to explain the issues in a blog post, a typical extension will have at least three out of four. Next time I run across a browser extension suffering from all the same flaws I can send them a link to this post. And maybe some vendors will resolve the issues then. Or, even better, not even make these mistakes in the first place.

{{< toc >}}

## How fingerprinting works

When you browse the web, you aren’t merely interacting with the website you are visiting but also with numerous third parties. Many of these have a huge interest in recognizing you reliably across different websites, advertisers for example want to “personalize” your ads. The traditional approach is storing a cookie in your browser which contains your unique identifier. However, modern browsers have a highly recommendable setting to clear cookies at the end of the browsing session. There is private browsing mode where no cookies are stored permanently. Further technical restrictions for third-party cookies are expected to be implemented soon, and EU data protection rules also make storing cookies complicated to say the least.

So cookies are becoming increasingly unreliable. Fingerprinting is supposed to solve this issue by recognizing individual users without storing any data on their end. The idea is to look at data about user’s system that browsers make available anyway, for example display resolution. It doesn’t matter what the data is, it should be:

* sufficiently stable, ideally stay unchanged for months
* unique to a sufficiently small group of people

Note that no data point needs to identify a single person by itself. If each of them refer to a different group of people, with enough data points the intersection of all these groups will always be a single person.

## How anti-fingerprinting is supposed to work

The goal of anti-fingerprinting is reducing the amount and quality of data that can be used for fingerprinting. For example, CSS used to allow recognizing websites that the user visited before – a design flaw that could be used for fingerprinting among other things. It took quite some time and effort, but eventually the browsers [found a fix that wouldn’t break the web](https://blog.mozilla.org/security/2010/03/31/plugging-the-css-history-leak/). Today this data point is no longer available to websites.

Other data points remain but have been defused considerably. For example, browsers provide websites with a user agent string so that these know e.g. which browser brand and version they are dealing with. Applications installed by the users used to extend this user agent string with their own identifiers. Eventually, browser vendors recognized how this could be misused for fingerprinting and decided to [remove any third-party additions](https://docs.microsoft.com/en-us/archive/blogs/ie/introducing-ie9s-user-agent-string). Much of the other information originally available here has been removed as well, so that today any user agent string is usually common to a large group of people.

## Barking the wrong tree

Browser vendors have already invested a considerable amount of work into anti-fingerprinting. However, they usually limited themselves to measures which wouldn’t break existing websites. And while things like display resolution (unlike window size) aren’t considered by too many websites, these were apparently numerous enough that browsers still give them user’s display resolution and the available space (typically display resolution without the taskbar).

Privacy protection extensions on the other hand aren’t showing as much concern. So they will typically do something like:

{{< highlight js >}}
screen.width = 1280;
screen.height = 1024;
{{< /highlight >}}

There you go, the website will now see the same display resolution for everybody, right? Well, that’s unless the website does this:

{{< highlight js >}}
delete screen.width;
delete screen.height;
{{< /highlight >}}

And suddenly `screen.width` and `screen.height` are restored to their original values. Fingerprinting can now use two data points instead of one: not merely the real display resolution but also the fake one. Even if that fake display resolution were extremely common, it would still make the fingerprint slightly more precise.

Is this magic? No, just how JavaScript prototypes work. See, these properties are not defined on the `screen` object itself, they are part of the object’s prototype. So that privacy extension added an override for prototype’s properties. With the override removed the original properties became visible again.

So is this the correct way to do it?

{{< highlight js >}}
Object.defineProperty(Screen.prototype, "width", {value: 1280});
Object.defineProperty(Screen.prototype, "height", {value: 1024});
{{< /highlight >}}

Much better. The website can no longer retrieve the original value easily. However, it can detect that the value has been manipulated by calling `Object.getOwnPropertyDescriptor(Screen.prototype, "width")`. Normally the resulting property descriptor would contain a getter, this one has a static value however. And the fact that a privacy extension is messing with the values is again a usable data point.

Let’s try it without changing the property descriptor:

{{< highlight js >}}
Object.defineProperty(Screen.prototype, "width", {get: () => 1280});
Object.defineProperty(Screen.prototype, "height", {get: () => 1024});
{{< /highlight >}}

Almost there. But now the website can call `Object.getOwnPropertyDescriptor(Screen.prototype, "width").get.toString()` to see the source code of our getter. Again a data point which could be used for fingerprinting. The source code needs to be hidden:

{{< highlight js >}}
Object.defineProperty(Screen.prototype, "width", {get: (() => 1280).bind(null)});
Object.defineProperty(Screen.prototype, "height", {get: (() => 1024).bind(null)});
{{< /highlight >}}

This `bind()` call makes sure the getter looks like a native function. Exactly what we needed.

## Catching all those pesky frames

There is a complication here: a website doesn’t merely have one JavaScript execution context, it has one for each frame. So you have to make sure your content script runs in all these frames. And so browser extensions will typically specify [`"all_frames": true`](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/content_scripts#all_frames) in their manifest. And that’s correct. But then the website does something like this:

{{< highlight js >}}
var frame = document.createElement("iframe");
document.body.appendChild(frame);
console.log(screen.width, frame.contentWindow.screen.width);
{{< /highlight >}}

Why is this newly created frame still reporting the original display width? We are back at square one: the website again has two data points to work with instead of one.

The problem here: if frame location isn’t set, the default is to load the special page `about:blank`. When Chrome developers created their extension APIs originally they didn’t give extensions any way to run content scripts here. Luckily, this loophole has been closed by now, but the extension manifest has to set [`"match_about_blank": true`](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/content_scripts#match_about_blank) as well.

## Timing woes

As anti-fingerprinting functionality in browser extensions is rather invasive, it is prone to breaking websites. So it is important to let users disable this functionality on specific websites. This is why you will often see code like this in extension content scripts:

{{< highlight js >}}
chrome.runtime.sendMessage("AmIEnabled", function(enabled)
{
  if (enabled)
    init();
});
{{< /highlight >}}

So rather than initializing all the anti-fingerprinting measures immediately, this content script first waits for the extension’s background page to tell it whether it is actually supposed to do anything. This gives the website the necessary time to store all the relevant values before these are changed. It could even come back later and check out the modified values as well – once again, two data points are better than one.

This is an important limitation of Chrome’s extension architecture which is sadly shared by all browsers today. It is possible to run a content script before any webpage scripts can run ([`"run_at": "document_start"`](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/content_scripts#run_at)). This will only be a static script however, not knowing any of the extension state. And requesting extension state takes time.

This might eventually get solved by [dynamic content script support](https://bugs.chromium.org/p/chromium/issues/detail?id=1054624), a request originally created ten years ago. In the meantime however, it seems that the only viable solution is to initialize anti-fingerprinting immediately. If the extension later says “no, you are disabled” – well, then the content script will just have to undo all manipulations. But this approach makes sure that in the common scenario (functionality is enabled) websites won’t see two variants of the same data.

## The art of faking

Let’s say that all the technical issues are solved. The mechanism for installing fake values works flawlessly. This still leaves a question: how does one choose the “right” fake value?

How about choosing a random value? My display resolution is 1661×3351, now fingerprint that! As funny as this is, fingerprinting doesn’t rely on data that makes sense. All it needs is data that is stable and sufficiently unique. And that display resolution is certainly extremely unique. Now one could come up with schemes to change this value regularly, but fact is: making users stand out isn’t the right way.

What you’d rather want is finding the largest group out there and joining it. My display resolution is 1920×1080 – just the [common Full HD](https://gs.statcounter.com/screen-resolution-stats), nothing to see here! Want to know my available display space? I have my Windows taskbar at the bottom, just like everyone else. No, I didn’t resize it either. I’m just your average Joe.

The only trouble with this approach: the values have to be re-evaluated regularly. Two decades ago, 1024×768 was the most common display resolution and a good choice for anti-fingerprinting. Today, someone claiming to have this screen size would certainly stick out. Similarly, in my website logs visitors claiming to use Firefox 48 are noticeable: it might have been a common browser version some years ago, but today it’s usually bots merely pretending to be website visitors.