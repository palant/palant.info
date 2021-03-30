---
categories:
- security
- password-managers
date: "2018-08-29 09:05:06"
description: Seven recommendations for developers of password managers who want to
  secure their AutoFill functionality instead of repeating the mistakes everybody
  is making.
slug: password-managers-please-make-sure-autofill-is-secure
title: 'Password managers: Please make sure AutoFill is secure!'
---

Dear developers of password managers, we communicate quite regularly, typically within the context of security bug bounty programs. Don’t get me wrong, I don’t mind being paid for finding vulnerabilities in your products. But shouldn’t you do your homework *before* setting up a bug bounty program? Why is it the same basic mistakes that I find in almost all password managers? Why is it that so few password managers get AutoFill functionality right?

Of course you want AutoFill to be part of your product, because from the user’s point of view it’s the single most important feature of a password manager. Take it away and users will consider your product unusable. But from the security point of view, filling in passwords on the wrong website is almost the worst thing that could happen. So why isn’t this part getting more scrutiny? There is a lot you can do, here are seven recommendations for you.

{{< toc >}}

## 1. Don’t use custom URL parsers

[Parsing URLs](https://tools.ietf.org/html/rfc3986) is surprisingly complicated. Did you know that the “userinfo” part of it can contain an `@` character? Did you think about [data: URLs](https://tools.ietf.org/html/rfc2397)? There are many subtle details here, and even well-established solutions might have corner cases where their parser produces a result that’s different from the browser’s. But you definitely don’t want to use a URL parser that will disagree with the browser’s -- if the browser thinks that you are on `malicious.com` then you shouldn’t fill in the password for `google.com` no matter what your URL parser says.

Luckily, there is an easy solution: just [use the browser’s URL parser](https://developer.mozilla.org/en-US/docs/Web/API/URL). If you worry about supporting very old browsers, the same effect can be achieved by creating an `<a>` element and assigning the URL to be parsed to its `href` property. You can then read out the link’s [hostname property](https://developer.mozilla.org/en-US/docs/Web/API/HTMLHyperlinkElementUtils/hostname) without even adding the element to the document.

## 2. Domain name is *not* “the last two parts of a host name”

Many password managers will store passwords for a domain rather than an individual host name. In order to do this, you have to deduce the domain name from the host name. Very often, I will see something like the old and busted “last two parts of a host name” heuristic. It works correctly for `foo.example.com` but for `foo.example.co.uk` it will consider `co.uk` to be the domain name. As a result, all British websites will share the same passwords.

No amount of messing with that heuristic will save you, things are just too complicated. What you need is the [Public Suffix List](https://publicsuffix.org/), it’s a big database of rules which can be applied to all top-level domains. You don’t need to process that list yourself, there is a number of existing solutions for that such as the [psl package](https://www.npmjs.com/package/psl).

## 3. Don’t forget about raw IP addresses

Wait, there is a catch! The Public Suffix List will only work correctly for actual host *names*, not for IP addresses. If you give it something like `192.168.0.1` you will get `0.1` back. What about `1.2.0.1`? Also `0.1`. If your code doesn’t deal with IP addresses separately, it will expose passwords for people’s home routers to random websites.

What you want is recognizing IP addresses up front and considering the entire IP address as the “domain name” -- passwords should never be shared between different IP addresses. Recognizing IP addresses is easier said that done however. Most solutions will use a regular expression like `/^\d{1-3}\.\d{1-3}\.\d{1-3}\.\d{1-3}$/`. In fact, this covers pretty much all IPv4 addresses you will usually see. But did you know that `0xC0.0xA8.0x00.0x01` is a valid IPv4 address? Or that `3232235521` is also an IPv4 address?

Things get even more complicated once you add IPv6 addresses to the mix. There are plenty of different notations to represent an IPv6 address as well, for example the last 32 bits of the address can be written like an IPv4 address. So you might want to use an elaborate solution that considers all these details, such as the [ip-address package](https://www.npmjs.com/package/ip-address).

## 4. Be careful with what host names you consider equivalent

It’s understandable that you want to spare your users disappointments like “I added a password on foo.example.com, so why isn’t it being filled in on bar.example.com?” Yet you cannot know that these two subdomains really share the same owner. To give you a real example, `foo.blogspot.com` and `bar.blogspot.com` are two blogs owned by different people, and you certainly don’t want to share passwords between them.

As a more extreme example, there are so many Amazon domains that it is tempting to just declare: `amazon.<TLD>` is always Amazon and should receive Amazon passwords. And then somebody goes there and registers `amazon.boots` to steal people’s Amazon passwords.

From what I’ve seen, the only safe assumption is that the host name with `www.` at the beginning and the one without are equivalent. Other than that, assumptions tend to backfire. It’s better to let the users determine which host names are equivalent, while maybe providing a default list populated with popular websites.

## 5. Require a user action for AutoFill

And while this might be a hard sell with your marketing department: please consider requiring a user action before AutoFill functionality kicks in. While this costs a bit of convenience, it largely defuses potential issues in the implementation of the points above. Think of it as defense in the depth. Even if you mess up and websites can trick your AutoFill functionality into thinking that they are some other website, requiring a user action will still prevent the attackers from automatically trying out a huge list of popular websites in order to steal user’s credentials for all of them.

There is also another aspect here that is discussed in a [paper from 2014](https://ben-stock.de/wp-content/uploads/asiacss2014.pdf). [Cross-Site Scripting (XSS) vulnerabilities](https://en.wikipedia.org/wiki/Cross-site_scripting) in websites are still common. And while such a vulnerability is bad enough on its own, a password manager that fills in passwords automatically allows it to be used to steal user’s credentials which is considerably worse.

What kind of user action should you require? Typically, it will be clicking on a piece of *trusted* user interface or pressing a specific key combination. Please don’t forget checking [event.isTrusted](https://developer.mozilla.org/en-US/docs/Web/API/Event/isTrusted), whatever event you process should come from the user rather than from the website.

## 6. Isolate your content from the webpage

Why did I have to stress that the user needs to click on a *trusted* user interface? That’s because browser extensions will commonly inject their user interface into web pages and at this point you can no longer trust it. Even if you are careful to accept only trusted events, a web page can manipulate elements and will always find a way to trick the user into clicking something.

Solution here: your user interface should always be isolated within an `<iframe>` element, so that the website cannot access it due to same-origin policy. This is only a partial solution unfortunately as it will not prevent [clickjacking attacks](https://en.wikipedia.org/wiki/Clickjacking). Also, the website can always remove your frame or replace it by its own. So asking users to enter their master password in this frame is a very bad idea: users won’t know whether the frame really belongs to your extension or has been faked by the website.

## 7. Ignore third-party frames

Finally, there is another defense in the depth measure that you can implement: only fill in passwords in the top-level window or first-party frames. Legitimate third-party frames with login forms are very uncommon. On the other hand, a malicious website seeking to exploit an XSS vulnerability in a website or a weakness in your extension’s AutoFill functionality will typically use a frame with a login form. Even if AutoFill requires a user action, it won’t be obvious to the user that the login form belongs to a different website, so they might still perform that action.
