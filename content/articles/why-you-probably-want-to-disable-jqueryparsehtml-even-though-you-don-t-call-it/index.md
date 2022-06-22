---
categories:
- security
- jquery
date: "2015-08-30 22:45:48"
description: ""
slug: why-you-probably-want-to-disable-jqueryparsehtml-even-though-you-don-t-call-it
title: Why you probably want to disable jQuery.parseHTML even though you don't call
  it
---

TL;DR: `jQuery.parseHTML` is a security hazard and will be called implicitly in a number of obvious and not so obvious situations.

{{< toc >}}

## Why should you care?

Hey, jQuery is great! It’s so great that Stack Overflow users will [recommend it no matter what your question is](https://meta.stackexchange.com/q/45176/163275). And now [they have two problems](https://programmers.stackexchange.com/q/223634/27148). Just kidding, they will have the incredible power of jQuery:

```js
$("#list").append('<li title="' + item.info + '">' + item.name + '</li>');
```

The above is locating a list in the document, creating a new list item with dynamic content and adding it to the list – all that in a single line that will still stay below the 80 columns limit. And we didn’t even lose readability in the process.

Life is great until some fool comes along and mumbles “security” (yeah, that’s me). Can you tell whether the code above is safe to be used in a web application? Right, it depends on the context. Passing HTML code to `jQuery.append` will use the [infamous innerHTML property](https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML#Security_considerations) implicitly. If you aren’t careful with the HTML code you are passing there, this line might easily turn into a [Cross-Site Scripting](https://en.wikipedia.org/wiki/Cross-site_scripting) (XSS) vulnerability.

Does `item.name` or `item.info` contain data from untrusted sources? Answering that question might be complicated. You need to trace the data back to its source, decide who should be trusted (admin user? localizer?) and make sure you didn’t forget any code paths. And even if you do all that, some other developer (or maybe even yourself a few months from now) might come along and add another code path where `item.name` is no longer trusted. Do you want to bet on this person realizing that they are making an entirely different piece of code insecure?

It’s generally better to give jQuery structured data and avoid taking any chances. The secure equivalent of the code above would be:

```js
$("#list").append($("<li>", {title: item.info}).text(item.name));
```

Not quite as elegant any more but now jQuery will take care of producing a correct HTML structure and you don’t need to worry about that.

## Wait, there is more!

There is one remarkable thing about jQuery APIs: each function can take all kinds of parameters. For example, the [.append() function](http://api.jquery.com/append/) we used above can take a DOM element, a CSS selector, HTML code or a function returning any of the above. This keeps function names short, and you only need to remember one function name instead of four.

The side effect is however: even if you are not giving jQuery any HTML code, you still have to keep in mind that the function could accept HTML code. Consider the following code for example:

```js
$(tagname + " > .temporary").remove();
```

This will look for elements of class `temporary` within a given tag and remove them, right? Except that the content of `tagname` better be trusted here. What will happen if an attacker manages to set the value of `tagname` to `"<img src='dummy' onerror='alert(/xss/)'>"`? You probably guessed it, the “selector” will be interpreted as HTML code and will execute arbitrary JavaScript code.

There is more than a dozen jQuery functions that will happily accept both selectors and HTML code. Starting with jQuery 1.9.0 security issues here got somewhat less likely, the string has to start with `<` in order to be interpreted as HTML code. Older versions will accept anything as HTML code as long as it doesn’t contain `#`, the versions before jQuery 1.6.1 [didn’t even have that restriction](http://bugs.jquery.com/ticket/9521).

To sum up: you better use jQuery 1.9.0 or above, otherwise your dynamically generated selector might easily end up being interpreted as an HTML string. And even with recent jQuery versions you should be careful with dynamic selectors, the first part of the selector should always be a static string to avoid security issues.

## Defusing jQuery

With almost all of the core jQuery functionality potentially problematic, evaluating security of jQuery-based code is tricky. Ideally, one would simply disable unsafe functionality so that parsing HTML code by accident would no longer be possible. Unfortunately, there doesn’t seem to be a supported way yet. The approach I describe here seems to work in the current jQuery versions (jQuery 1.11.3 and jQuery 2.1.4) but might not prevent all potential issues in older or future jQuery releases. Use at your own risk! Oh, and feel free to nag jQuery developers into providing supported functionality for this.

There is a comment in the source code indicating that `jQuery.parseHTML` function being missing is an expected situation. However, removing this function doesn’t resolve all the issues, and it disables safe functionality as well. Removing `jQuery.buildFragment` on the other hand doesn’t seem to have any downsides:

```js
delete jQuery.buildFragment;

// Safe element creation still works
$('<img>', {src: "dummy"});

// Explicitly assigning or loading HTML code for an element works
$(document.body).html('<img src="dummy">');
$(document.body).load(url);

// These will throw an exception however
$('<img src="dummy">');
$(document.body).append('<img src="dummy">');
$.parseHTML('<img src="dummy">');
```

Of course, you have to adjust all your code first before you disable this part of the jQuery functionality. And even then you might have jQuery plugins that will stop working with this change. There are some code paths in the jQuery UI library for example that rely on parsing non-trivial HTML code. So this approach might not work for you.

## But how do I create larger DOM structures?

The example creating a single list item is nice of course but what if you have to create some complicated structure? Doing this via dozens of nested function calls is impractical and will result in unreadable code.

One approach would be placing this structure in your HTML document, albeit hidden. Then you would need to merely clone it and fill in the data:

```html
<style type="text/css">
  template { display: none; }
</style>

<template id="entryTemplate">
  <div>
    <div class="title"></div>
    <div class="description"></div>
  </div>
</template>

<script>
  var template = $("#entryTemplate");
  var entry = template.contents().clone();
  entry.find(".title").text(item.title);
  entry.find(".description").text(item.description);
  $(document.body).append(entry);
</script>
```

**Edit** (2015-09-14): The code example above used a regular `<div>` tag instead of `<template>` originally. Thanks to Aristotle Pagaltzis for pointing out that [the latter](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template) is the proper solution, even though the code example above doesn’t require the browser to support this tag properly for backwards compatibility reasons.

Other templating approaches for JavaScript exist as well of course. It doesn’t matter which one you use as long as you don’t generate HTML code on the fly.
