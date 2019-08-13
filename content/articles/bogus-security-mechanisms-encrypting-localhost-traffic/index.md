---
categories:
- security
- remembear
- password-managers
date: '2019-04-11T13:07:14+02:00'
description: RememBear invested much effort into securing communication between browser
  extensions and application. I think that most of this work could have been spared.
lastmod: '2019-04-24 09:38:16'
title: 'Bogus security mechanisms: Encrypting localhost traffic'
---

Nowadays it is common for locally installed applications to also offer installing browser extensions that will take care of browser integration. Securing the communication between extensions and the application is not entirely trivial, something that [Logitech had to discover recently](https://bugs.chromium.org/p/project-zero/issues/detail?id=1663) for example. I've also found a bunch of applications with security issues in this area. In this context, one has to appreciate RememBear password manager [going to great lengths](https://www.remembear.com/blog/securing-the-remembear-browser-extensions/) to secure this communication channel. Unfortunately, while their approach isn't strictly wrong, it seems to be based on a wrong threat assessment and ends up investing far more effort into this than necessary.

## The approach

It is pretty typical for browser extensions and applications to communicate via [WebSockets](https://en.wikipedia.org/wiki/WebSocket). In case of RememBear the application listens on port 8734, so the extension creates a connection to `ws://localhost:8734`. After that, messages can be exchanged in both directions. So far it's all pretty typical. The untypical part is RememBear using TLS to communicate on top of an unencrypted connection.

So the browser extension contains a complete TLS client implemented in JavaScript. It generates a client key, and on first connection the user has to confirm that this client key is allowed to connect to the application. It also remembers the server's public key and will reject connecting to another server.

Why use an own TLS implementation instead of letting the browser establish an encrypted connection? The browser would verify TLS certificates, whereas the scheme here is based on self-signed certificates. Also, browsers never managed to solve authentication via client keys without degrading user experience.

## The supposed threat

Now I could maybe find flaws in the [forge TLS client](https://github.com/digitalbazaar/forge) they are using. Or criticize them for using 1024 bit RSA keys which are [deprecated](https://knowledge.digicert.com/generalinformation/INFO1684.html). But that would be pointless, because the whole construct addresses the wrong threat.

According to RememBear, the threat here is a malicious application disguising as RememBear app towards the extension. So they encrypt the communication in order to protect the extension, making sure that it only talks to the real application.

Now the sad reality of password managers is: once there is a malicious application on the computer, you've lost already. Malware does things like logging keyboard input and should be able to steal your master password this way. Even if malware is "merely" running with user's privileges, it can go as far as letting a trojanized version of RememBear run instead of the original.

But hey, isn't all this setting the bar higher? Like, messing with local communication would have been easier than installing a modified application? One could accept this line argumentation of course. The trouble is: messing with that WebSocket connection is still trivial. If you check your Firefox profile directory, there will be a file called `browser-extension-data/ff@remembear.com/storage.js`. Part of this file: the extension's client key and RememBear application's public key, in plain text. A malware can easily read out (if it wants to connect to the application) or modify these (if to wants to fake the application towards the extension). With Chrome the data format is somewhat more complicated but equally unprotected.

{{< img src="lock.jpg" alt="Rusty lock not attached to anything" width="320" >}}
<em>Image by <a href="https://www.flickr.com/photos/joybot/" rel="nofollow">Joybot</a></em>
{{< /img >}}

## The actual threat

It's weird how the focus is on protecting the browser extension. Yet the browser extension has no data that a malicious application could steal. If anything, malware might be able to trick the extension into compromising websites. Usually however, malware applications manage to do this on their own, without help.

In fact, the by far more interesting target is the RememBear application, the one with the passwords data. Yet protecting it against malware is a lost cause, whatever a browser extension running in the browser sandbox can do -- malware can easily do the same.

The realistic threat here are actually regular websites. You see, [same-origin policy](https://en.wikipedia.org/wiki/Same-origin_policy) isn't enforced for WebSockets. Any website can establish a connection to any WebSocket server. It's up to the WebSocket server to check the [Origin HTTP header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Origin) and reject connections from untrusted origins. If the connection is being established by a browser extension however, the different browsers are very inconsistent about setting the `Origin` header, so that recognizing legitimate connections is difficult.

In the worst case, the WebSocket server doesn't do any checks and accepts any connection. That was the case with the Logitech application mentioned earlier, it could be reconfigured by any website.

## Properly protecting applications

If the usual mechanisms to ensure connection integrity don't work, what do you do? You can establish a shared secret between the extension and the application. I've seen extensions requiring you to copy a secret key from the application into the extension. Another option would be the extension generating a secret and requiring users to approve it in the application, much like RememBear does it right now with the extension's client key. Add that shared secret to every request made by the extension and the application will be able to identify it as legitimate.

Wait, no encryption? After all, somebody [called out 1Password for sending passwords in cleartext on a localhost connection](http://web.archive.org/web/20180314203755/https://medium.com/@rosshosman/1password-sends-your-password-across-the-loopback-interface-in-clear-text-307cefca6389) (article has been removed since). That's your typical bogus vulnerability report however. Data sent to `localhost` never leaves your computer. It can only be seen on your computer and only with administrator privileges. So we would again be either protecting against malware or a user with administrator privileges. Both could easily log your master password when you enter it and decrypt your password database, "protecting" localhost traffic wouldn't achieve anything.

But there is actually an even easier solution. Using WebSockets is unnecessary, browsers implement [native messaging API](https://developer.chrome.com/extensions/nativeMessaging) which is meant specifically to let extensions and their applications communicate. Unlike WebSockets, this API cannot be used by websites, so the application can be certain: any request coming in originates from the browser extension.

## Conclusion and outlook

There is no reasonable way to protect a password manager against malware. With some luck, the malware functionality will be too generic to compromise your application. Once you expect it to have code targeting your specific application, there is really nothing you can do any more. Any protective measures on your end are easily circumvented.

Security design needs to be guided by a realistic threat assessment. Here, by far the most important threat is communication channels being taken over by a malicious website. This threat is easily addressed by authenticating the client via a shared secret, or simply using native messaging which doesn't require additional authentication. Everything else is merely security theater that doesn't add any value.

This isn't the only scenario where bogus vulnerability reports prompted an overreaction however. Eventually, I want to deconstruct research scolding password managers for leaving passwords in memory when locked. Here as well, a threat scenario has been blown out of proportion.
