---
title: "Rendering McAfee web protection ineffective"
date: 2019-12-02T09:28:18+01:00
description: Until recently, McAfee WebAdvisor "blocking" malicious content was easily tricked, even whitelisting websites without the user noticing.
image: rusty_shield.jpg
categories:
  - security
  - mcafee
  - antivirus
---

Now that I'm done with Kaspersky, it's time to look at some other antivirus software. Our guest today is McAfee Total Protection 16.0. Let's say this up front: it's nowhere near the mess we've seen with Kaspersky. It doesn't break up your encrypted connections, and the web protection component is limited to the McAfee WebAdvisor browser extension. So the attack surface is quite manageable here. The extension also uses [native messaging](https://developer.chrome.com/extensions/nativeMessaging) to communicate with the application, so we won't see websites taking over this communication channel.

Of course, browser extensions claiming to protect you from online threats have some rather big shoes to fill. They have to be better than the browser's built-in malware and phishing protection, not an easy task. In fact, McAfee WebAdvisor "blocks" malicious websites after they already started loading, this being not quite optimal but rather typical for this kind of extension. I also found three issues in the way McAfee WebAdvisor 6.0 was implemented which made its protection far less reliable than it should be.

{{< img src="rusty_shield.jpg" width="600" alt="Rusty WebAdvisor shield" />}}

{{toc}}

## Summary of the findings

A bug in the way McAfee WebAdvisor deals with malicious frames made it trivial for websites to avoid blocking. Also, I found ways for websites to unblock content programmatically, both for top-level and frame-level blocking.

In fact, the way unblocking top-level content was implemented, it allowed arbitrary websites to open special pages. Browsers normally prevent websites from opening these pages to avoid phishing attacks or exploitation of potential security vulnerabilities in browser extensions. McAfee WebAdvisor allowed websites to circumvent this security mechanism.

## Breaking frame blocking

Let's say that somebody hacked a benign website. However, they don't want this website with a good reputation to be blacklisted, so instead of putting malicious code onto this website directly they add a frame pointing to a less valuable website, one that is already known to be malicious. Let's go with `malware.wicar.org` here which is a test site meant to trigger warnings.

McAfee WebAdvisor won't allow this of course:

{{< img src="frame_blocking.png" alt="Frame blocked by McAfee Web Advisor along with a message allowing it to be unblocked" width="762" />}}

The frame will be blocked and the user will be informed about it. Nice feature? It is, at least until you look at the Network tab of the Inspector Tools.

{{< img src="network_downloads.png" alt="Network tab of the Inspector Tools showing that malicious frame loaded before being replaced" width="766" />}}

So the malicious document actually managed to load fully and was only replaced by `restricted.html` after that. So there was a window of opportunity for it to do its malicious thing. But that's not actually the worst issue with this approach.

Replacing frame document is being done by the extension's content script. In order to make a decision, that content script sends the message `isframeblocked` to the background page. If the frame should be blocked, the response will contain a redirect URL. Not quite trusting the whole thing, the content script will perform an additional check:

{{< highlight js >}}
processFrameBlocking(redirectURI) {
  const domain = URI.getParam(redirectURI, "domain");
  if (null !== domain) {
    const documentURI = document.documentURI || document.URL || document.baseURI;
    if (unescape(domain) === documentURI)
      window.location.replace(redirectURI);
  }
}
{{< /highlight >}}

So the redirect is only performed if the document URL matches the `domain` parameter of the redirect URL. I guess that this is supposed to protect against the scenario where the message exchange was too slow and a benign page loaded into the frame in the meantime. Not that this could actually happen, as this would have replaced the content script by a new instance.

Whatever the reasoning, there are obvious drawbacks: while `domain` parameter is a URL rather than actually being a domain, it won't always match the frame URL exactly. In particular, it is missing the query part of the URL. So all one has to do is using a URL with a query for the frame:

{{< highlight html >}}
<iframe src="http://malware.wicar.org/?whatever"></iframe>
{{< /highlight >}}

That's it. There will still be a warning at the top of the page but the frame will no longer be "blocked."

McAfee WebAdvisor 8.0 fixes this issue. While it didn't remove the check, the full URL is being compared now. A downside remains: due to the messaging delay here, a page changing its URL regularly (easily done without reloading the content) will never be blocked.

## Messing with the warning message

Of course, there is no reason why anybody needs to allow this message on their website. It's being injected directly into the page, and so the page can hide it trivially:

{{< highlight html >}}
<style>
  #warning_banner
  {
    display: none;
  }
</style>
{{< /highlight >}}

That's not something that the extension can really prevent however. Even if hiding the message via CSS weren't possible, a web page can always detect this element being added and simply remove it.

That "View all blocked content" button being injected into the web page is more interesting. What will happen if the page "clicks" it programmatically?

{{< highlight js >}}
function clickButton()
{
  var element = document.getElementById("show_all_content");
  if (element)
    element.click();
  else
    window.setTimeout(clickButton, 0);
}

window.addEventListener("load", clickButton, false);
{{< /highlight >}}

Oh, that actually unblocks the frame without requiring any user interaction. And it will add it to the whitelist permanently as well. So the extension doesn't even check for [event.isTrusted](https://developer.mozilla.org/en-US/docs/Web/API/Event/isTrusted) to ignore generated events.

As of McAfee WebAdvisor 8.0, this part of the user interface is isolated inside a frame and cannot be manipulated by websites directly. It's still susceptible to [clickjacking attacks](https://en.wikipedia.org/wiki/Clickjacking) however, something that's hard to avoid.

## Exploiting siteadvisor.com integration

We previously talked about frame blocking functionality redirecting frames to `restricted.html`. If you assumed that this page is part of the extension, then I'm sorry to tell you that you assumed incorrectly. For whatever reason, this is a page hosted on `siteadvisor.com`. It's also the same page you will see when you try to visit `malware.wicar.org` yourself, it will merely look somewhat differently:

{{< img src="restricted_page.png" alt="McAfee replacement page for a malicious website" width="694" />}}

The button "Accept the Risk" it worth noticing. Implementing this functionality requires modifying extension settings, something that the website cannot do by itself. How does it work? This is the button's HTML code:

{{< highlight html >}}
<a id="DontWarn" class="button" href="javascript:acceptrisk()">Accept the Risk</a>
{{< /highlight >}}

So it calls the JavaScript function `acceptrisk()` which is being injected into its scope by the extension. What does the function look like?

{{< highlight js >}}
function acceptrisk()
{
  window.postMessage({type: 'acceptrisk'}, '*');
}
{{< /highlight >}}

The website sends a message to itself. That message is then processed by the extension's content script. And it doesn't bother checking message origin of course, meaning that the same message could be sent by another website just as well.

Usually, a website would exploit an issue like this by loading `siteadvisor.com` in a frame and sending a message to it. The HTTP header `X-Frame-Options: sameorigin` doesn't prevent the attack here because `siteadvisor.com` doesn't apply it consistently. While it is being sent with some responses, images from this domain for example are allowed to load in frames. There is another issue however: the relevant content script only applies to top-level documents, not frames.

Fallback approach: pop-up window. Open a pop-up with the right parameters, then send it a message (or rather lots of messages, so that you don't have to guess the timing).

{{< highlight js >}}
let wnd = window.open("https://www.siteadvisor.com/img/wa-logo.png?originalURL=12345678&domain=http://malware.wicar.org/", "_blank");
for (let i = 0; i < 10000; i += 100)
{
  window.setTimeout(() =>
  {
    wnd.postMessage({type: "acceptrisk"}, "*");
  }, i);
}
{{< /highlight >}}

Done, this will add `malware.wicar.org` to the WebAdvisor whitelist and redirect to it.

There is an additional twist here: the redirect is being performed by the browser extension via [chrome.tabs.update()](https://developer.chrome.com/extensions/tabs#method-update) call. The URL isn't checked at all, anything goes -- even URLs that websites normally cannot navigate to. Well, almost anything, Chrome doesn't allow using `javascript:` will this API.

Chrome [disallowed top-level `data:` URLs to combat phishing](https://www.chromestatus.com/feature/5669602927312896)? No problem, websites can still do it with the help from the McAfee WebAdvisor extension. `file:///` URLs out of reach for websites? Extensions are still allowed to load them. Extension pages are not web accessible to prevent exploitation of potential security issues? But other extensions can load them regardless.

So this vulnerability has quite some potential to facilitate further attacks. And while checking message origin is the obvious solution here, this attack surface is completely unnecessary. An extension can attach a `click` event listener to that button, no need to inject functions or pass messages around. An even better solution would be making that page part of the extension and dropping special handling of any web pages.

As of McAfee WebAdvisor 8.0, the pages displayed when some content is blocked belong to the extension. The problematic integration with `siteadvisor.com` is gone, it is no longer necessary.

## Timeline

* 2019-09-02: Tried following the [official process to report McAfee security vulnerabilities](https://www.mcafee.com/enterprise/en-us/threat-center/product-security-bulletins.html), mail didn't trigger the expected automatic response.
* 2019-09-02: Sent three vulnerability reports to `security@mcafee.com`. The mails bounced with "Invalid Recipient" response.
* 2019-09-02: Attempted to access https://mcafee.com/security.txt which redirected to a 404 Not Found error.
* 2019-09-02: Asked for help reporting these vulnerabilities on [Twitter](https://twitter.com/WPalant/status/1168511716034056195).
* 2019-09-02: Got contacted by a McAfee employee via direct message on Twitter, he notified somebody within the company.
* 2019-09-03: Got an email from the right contact at McAfee, sent them the three vulnerability reports.
* 2019-09-03: Received confirmation from McAfee that the reports have been received and are being investigated.
* 2019-09-06: McAfee confirmed all reports as security vulnerabilities.
* 2019-11-20: McAfee notified me about the issues being resolved.
