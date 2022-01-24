---
categories:
- security
date: '2018-05-18 20:17:07'
description: ''
lastmod: '2022-01-24 13:16:28+0100'
slug: ryzom-falling-remote-code-execution-via-the-in-game-browser
title: 'Ryzom falling: Remote code execution via the in-game browser'
---

{{< toc />}}

## The short version

Ryzom is an online role-playing game. If you happen to be playing it, using the in-game browser is a significant risk. When you do that, there is a chance that somebody will run their [Lua](https://en.wikipedia.org/wiki/Lua_%28programming_language%29) code in your client and bad things will happen.

## Explaining Ryzom’s in-game browser

Ryzom’s in-game browser is there so that you can open links sent to you without leaving the game. It is also used to display the game’s forum as well as various other web apps. The game even allows installing web apps that are created by third parties. This web browser is very rudimentary, it supports only a bunch of HTML tags and nothing fancy like JavaScript. But it compensates for that lack of functionality by running Lua code.

You have to consider that the Lua programming language is what powers the game’s user interface. So letting the browser download and run Lua code allows for perfect integration between websites and the user interface, in many cases users won’t even be able to tell the difference. The game even uses this functionality to hot-patch the user interface and add missing features to older clients.

## The flaws

The developers realize of course that letting arbitrary websites run Lua code in their game client is dangerous. So they created a whitelist of trusted websites that would be allowed to do it, currently that’s app.ryzom.com and api.ryzom.com. And that solution would have been mostly fine if these sites weren’t full of [Cross-Site Scripting](https://en.wikipedia.org/wiki/Cross-site_scripting) (XSS) vulnerabilities.

Having an XSS vulnerability in your website normally is bad enough on its own. In this case however, these vulnerabilities allow anybody to create a link to a trusted website that would contain malicious Lua code. No need to make things too obvious, that link can be hidden behind a URL shortener. Send this link to your target, add some text that will make them want to open it – you are done.

To add insult to injury, the game won’t use HTTPS when establishing connections to trusted websites because the developers [haven’t figured out SSL support yet](https://github.com/ryzom/ryzomcore/issues/314). So if somebody can manipulate your traffic, e.g. if you are connected to an open WiFi, then they will be able to inject malicious Lua code when your Ryzom client starts up.

## How bad is it?

What’s the worst thing that could happen? Given that Lua code controls the game’s user interface, some very competitive player could scramble the interface for an adversary to [achieve an advantage over them](https://xkcd.com/654/), clearly a rather extreme action. The more likely exploit would involve tricking a game admin into running an [admin command](https://github.com/ryzom/ryzomcore/wiki/shard_commands), e.g. one that gives you tons of skill points.

But the issue here extends far beyond the game itself. Lua code can read and write arbitrary files, and it can also run external applications. So the risk here is really getting your machine infested with malware, just by clicking a link in the game or by playing on an open WiFi network.

## The resolution

Notifying Ryzom developers turned out rather non-trivial, which is surprising for an open-source project. Initially, I asked a gamemaster who told me to write a support mail. Supposedly, my mail would be forwarded to the developers. Nine days later, I still haven’t got any response and decided to create a Bitbucket issue asking whether the developers got the info – they didn’t. The issue was deemed “resolved” on the same day, by means of fixing a bunch of server-side XSS vulnerabilities.

It’s impossible to tell how complete this resolution is, with the Ryzom server-side web apps not being open source. Given the obvious lack of good security practices, I wouldn’t rely too much on it. Also, the issue about adding SSL support is still just sitting there, last activity was six months ago. So if you are playing Ryzom, I’d recommend disabling execution of remote Lua code altogether by removing trusted domains from Ryzom’s configuration. For that, you need to edit `client.cfg` file while Ryzom isn’t running and add the following line:

     WebIgTrustedDomains  = {};

Some game features will no longer work then, such as the Info window. Also, using apps will be more complicated or even impossible. But at least you can enjoy the game without worrying about your computer getting p0wned.

**Update** (2022-01-24): Judging by the Ryzom source code, the work-around above no longer works. Ryzom will always consider the server host trusted, no matter the configuration. Otherwise the issue remains unchanged. So if you didn’t dump Ryzom yet, now is a very good time to do so.
