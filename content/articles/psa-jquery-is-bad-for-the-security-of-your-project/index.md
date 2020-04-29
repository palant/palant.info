---
title: "PSA: jQuery is bad for the security of your project"
date: 2020-03-02T15:19:30+01:00
description: jQuery makes it unnecessarily hard to avoid security vulnerabilities, not something that will be fixed any time soon. Better frameworks exist, just don't use it.
categories:
  - jquery
  - security
---

For some time I thought that jQuery was a thing of the past, only being used in old projects for legacy reasons. I mean, there are now so much better frameworks, why would anyone stick with jQuery and its numerous shortcomings? Then some colleagues told me that they weren't aware of jQuery's security downsides. And I recently discovered two big vulnerabilities in antivirus software [<sup>1</sup>](/2020/01/13/pwning-avast-secure-browser-for-fun-and-profit/) [<sup>2</sup>](/2020/02/25/mcafee-webadvisor-from-xss-in-a-sandboxed-browser-extension-to-administrator-privileges/) which existed partly due to excessive use of jQuery. So here is your official public service announcement: jQuery is bad for the security of your project.

By that I don't mean that jQuery is inherently insecure. You *can* build a secure project on top of jQuery, if you are sufficiently aware of the potential issues and take care. However, the framework doesn't make it easy. It's not [secure by default](https://en.wikipedia.org/wiki/Secure_by_default), it rather invites programming practices which are insecure. You have to constantly keep that in mind and correct for it. And if don't pay attention just once you will end up with a security vulnerability.

## Why is jQuery like that?

You have to remember that jQuery was conceived in 2006. Security of web applications was a far less understood topic, e.g. [autoescaping in Django templates](https://code.djangoproject.com/wiki/AutoEscaping) to prevent server-side [XSS vulnerabilities](https://en.wikipedia.org/wiki/Cross-site_scripting) only came up in 2007. Security of client-side JavaScript code was barely considered at all.

So it's not surprising that security wasn't a consideration for jQuery. Its initial goal was something entirely different: make writing JavaScript code easy despite different browsers behaving wildly differently. Internet Explorer 6 with its non-standard APIs was still prevalent, and Internet Explorer 7 with its very modest improvements wasn't even released yet. jQuery provided a level of abstraction on top of browser-specific APIs with the promise that it would work anywhere.

Today you can write `document.getElementById("my-element")` and call it done. Back then you might have to fall back to `document.all["my-element"]`. So jQuery provided you with `jQuery("#my-element")`, a standardized way to access elements by selector. Creating new elements was also different depending on the browser, so jQuery gave you `jQuery("<div>Some text</div>")`, a standardized way to turn HTML code into an element. And so on, lots of simplifications.

## The danger of simple

You might have noticed a pattern above which affects many jQuery functions: the same function will perform different operations depending on the parameters it receives. You give it *something* and the function will figure out what you meant it to do. The `jQuery()` function will accept among other things a selector of the element to be located and HTML code of an element to be created. How does it decide which one of these fundamentally different operations to perform, with the parameter being a string both times? The initial logic was: if there is something looking like an HTML tag in the contents it must be HTML code, otherwise it's a selector.

And there you have the issue: often websites want to find an element by selector but use untrusted data for parts of that selector. So attackers can inject HTML code into the selector and trick jQuery into substituting the safe "find element" operation by a dangerous "create a new element." A side-effect of the latter would be execution of malicious JavaScript code, a typical client-side [XSS vulnerability](https://en.wikipedia.org/wiki/Cross-site_scripting).

It took until jQuery 1.9 (released in 2013) for this issue to be addressed. In order to be interpreted as HTML code, a string has to start with `<` now. Given incompatible changes, it took websites years to migrate to safer jQuery versions. In particular, the Addons.Mozilla.Org website still had some vulnerabilities in 2015 going back to this [<sup>1</sub>](https://bugzilla.mozilla.org/show_bug.cgi?id=1198957) [<sup>2</sup>](https://bugzilla.mozilla.org/show_bug.cgi?id=1200007).

The root issue that the same function performs both safe and dangerous operations remains part of jQuery however, likely due to backwards compatibility constrains. It can still cause issues even now. Attackers would have to manipulate the start of a selector which is less likely, but it is still something that application developers have to keep in mind (and they almost never do). This danger prompted me to [advise disabling jQuery.parseHTML](/2015/08/30/why-you-probably-want-to-disable-jqueryparsehtml-even-though-you-don-t-call-it/) some years ago.

## Downloads, insecure by default

You may be familiar with [secure by default](https://en.wikipedia.org/wiki/Secure_by_default) as a concept. For an application framework this would mean that all framework functionality is safe by default and dangerous functionality has to be enabled in obvious ways. For example, React will not process HTML code at execution time unless you use a [property named `dangerouslySetInnerHTML`](https://reactjs.org/docs/dom-elements.html#dangerouslysetinnerhtml). As we've already seen, jQuery does not make it obvious that you might be handling HTML code in dangerous ways.

It doesn't stop there however. For example, jQuery provides the function `jQuery.ajax()` which is supposed to simplify sending web requests. At the time of writing, neither the documentation for [this function](https://api.jquery.com/jQuery.ajax/), nor documentation for the shorthands [jQuery.get()](https://api.jquery.com/jQuery.get/) and [jQuery.post()](https://api.jquery.com/jQuery.post/) showed any warning about the functionality being dangerous. And yet it is, as the developers of Avast Secure Browser [had to learn the hard way](/2020/01/13/pwning-avast-secure-browser-for-fun-and-profit/).

The issue is how `jQuery.ajax()` deals with server responses. If you don't set a value for `dataType`, the default behavior is to guess how the response should be treated. And jQuery goes beyond the usual safe options resulting in parsing XML or JSON data. It also offers parsing the response as HTML code (potentially running JavaScript code as a side-effect) or executing it as JavaScript code directly. The choice is made based on the MIME type provided by the server.

So if you use `jQuery.ajax()` or any of the functions building on it, the default behavior requires you to trust the download source to 100%. Downloading from an untrusted source is only safe if you set `dataType` parameter explicitly to `xml` or `json`. Are developers of jQuery-based applications aware of this? Hardly, given how the issue isn't even highlighted in the documentation.

## Harmful coding patterns

So maybe jQuery developers could change the APIs a bit, improve documentation and all will be good again? Unfortunately not, the problem goes deeper than that. Remember how jQuery makes it really simple to turn HTML code into elements? Quite unsurprisingly, jQuery-based code tends to make heavy use of that functionality. On the other hand, modern frameworks recognized that people messing with HTML code directly is bad for security. React hides this functionality under a [name that discourages usage](https://reactjs.org/docs/dom-elements.html#dangerouslysetinnerhtml), Vue.js at least [discourages usage in the documentation](https://vuejs.org/v2/guide/syntax.html#Raw-HTML).

Why is this core jQuery functionality problematic? Consider the following code which is quite typical for jQuery-based applications:

{{< highlight js >}}
var html = "<ul>";
for (var i = 0; i < options.length; i++)
  html += "<li>" + options[i] + "</li>";
html += "</ul>";
$(document.body).append(html);
{{< /highlight >}}

Is this code safe? Depends on whether the contents of the `options` array are trusted. If they are not, attackers could inject HTML code into it which will result in malicious JavaScript code being executed as a side-effect. So this is a potential XSS vulnerability.

What's the correct way of doing this? I don't think that the jQuery documentation ever mentions that. You would need an HTML escaping function, an essential piece of functionality that jQuery doesn't provide for some reason. And you should probably apply it to all dynamic parts of your HTML code, just in case:

{{< highlight js >}}
function escape(str)
{
  return str.replace(/</g, "&lt;").replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;").replace(/&/g, "&amp;");
}

var html = "<ul>";
for (var i = 0; i < options.length; i++)
  html += "<li>" + escape(options[i]) + "</li>";
html += "</ul>";
$(document.body).append(html);
{{< /highlight >}}

And you really have to do this consistently. If you forget a single `escape()` call you might introduce a vulnerability. If you omit a `escape()` code because the data is presumably safe you create a maintenance burden -- now anybody changing this code (including yourself) has to remember that this data is supposed to be safe. So they have to keep it safe, and if not they have to remember changing this piece of code. And that's already assuming that your initial evaluation of the data being safe was correct.

Any system which relies on imperfect human beings to always make perfect choices to stay secure is bound to fail at some point. [McAfee Webadvisor](/2020/02/25/mcafee-webadvisor-from-xss-in-a-sandboxed-browser-extension-to-administrator-privileges/) is merely the latest example where jQuery encouraged this problematic coding approach which failed spectacularly. That's not how it should work.

## What are the alternatives?

Luckily, we no longer need jQuery to paint over browser differences. We don't need jQuery to do downloads, regular [XMLHttpRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest) works just as well (actually better in some respects) and is secure. And if that's too verbose, browser support for the [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) is looking great.

So the question is mostly: what's an easy way to create dynamic user interfaces? We could use a templating engine like [Handlebars](https://handlebarsjs.com/) for example. While the result will be HTML code again, untrusted data will be escaped automatically. So things are inherently safe as long as you stay away from the "tripple-stash" syntax. In fact, a vulnerability I once found was due to the developer using tripple-stash consistently and unnecessarily -- don't do that.

But you could take one more step and switch to a fully-featured framework like [React](https://reactjs.org/) or [Vue.js](https://vuejs.org/). While these run on HTML templates as well, the template parsing happens when the application is compiled. No HTML code is being parsed at execution time, so it's impossible to create HTML elements which weren't supposed to be there.

There is an added security bonus here: event handlers are specified within the template and will always connect to the right elements. Even if attackers manage to create similar elements (like I did to [exploit McAfee Webadvisor vulnerability](/2020/02/25/mcafee-webadvisor-from-xss-in-a-sandboxed-browser-extension-to-administrator-privileges/#exploiting-xss-without-running-code)), it wouldn't trick the application into adding functionality to these.
