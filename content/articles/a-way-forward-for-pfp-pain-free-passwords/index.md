---
title: "A way forward for PfP: Pain-free Passwords"
date: 2023-05-02T15:49:11+0200
description: "PfP: Pain-free Passwords development continues after all. However, it’s a very different browser extension now, working with KeePass databases with the help of an external application."
categories:
- pfp
- password-managers
---

A month ago I [announced the end of PfP: Pain-free Passwords](/2023/03/20/the-end-of-pfp-pain-free-passwords/). But I’m allowed to change my mind, right? Yes, PfP will be developed further after all. However, it’s so different that I’m publishing it as a new browser extension, not an update to the existing extension.

Rather than using its own data format, PfP 3.x reads and writes KeePass database files. In order for the extension to access these files, users have to [install a PfP Native Host application](https://pfp.works/documentation/installing-native-host/). This application provides access to the configured database files only.

Also, PfP 3.x no longer generates passwords on the fly. All passwords are stored inside the database, and generating passwords randomly happens when passwords are added. While this makes recovery more complicated, elsewhere it simplifies things a lot.

{{< toc >}}

## Why the change of mind?

My original plan was to use KeePassXC, contributing wherever I could see things to improve. However, I noticed that the KeePassXC browser integration is both too dangerous for my taste (exposes too much attack surface to websites) and too limited in its functionality. These issues stem from basic design decisions and cannot be fixed by contributors.

First I decided to ignore the KeePassXC browser extension, instead making a trimmed down version of the PfP user interface to communicate with KeePassXC. This worked, but it was fairly complicated and still very limited. This is a fundamental issue: KeePassXC developers are very worried about malware abusing the browser extension to extract KeePassXC data, so they intentionally limit the functionality available here. Personally, I think that they should be more worried about websites abusing the browser extension – malware will always find other ways.

At this point I realized that I don’t need KeePassXC. A minimal native messaging host application could do the job of providing access to a KeePass database file without making things overly complicated. Thus, PfP Native Host was born.

## How is this better than PfP 2.x?

So, I’ve already given up on PfP 2.x development. Why am I publishing PfP 3.x for the wider public then?

The effort of maintaining this solution is smaller. For once, I don’t need to support everything. I don’t need to support Android, there is for example Keepass2Android for that. I don’t need to support binary attachments either, one can use KeePassXC for that. Yes, this is possible the same database, while still using PfP for the basic functionality.

Sync, being a particularly complicated and fragile piece of functionality, is no longer handled by PfP. Instead, it’s delegated to external synchronization clients as usual with KeePass and similar solutions. Yes, no more merging of changes. But way simpler.

And let’s not forget that this release addresses some fundamental design flaws. PfP is no longer a password generator but a conventional password manager. It takes the Argon2 key derivation approach of KeePass databases with strong defaults. And it generates strong random passphrases for new databases by default.

## The state of affairs

Last week I pushed out two releases. PfP 3.0 focused primarily on feature parity with PfP 2.x. The few visible improvements like the more flexible import of CSV files, displaying the password list before actually importing it, were largely side-effects of the changed extension base.

A few days later PfP 3.1 came out. This release focused on new functionality: password tags, text size configuration, moving passwords to a different site, warning when filling in passwords on plain HTTP sites. These are largely low-hanging fruit: features that used to be complicated with the old setup but became much simpler with the update.

Now that this is out of the way, pace of development will slow down again of course. As far as I’m concerned, PfP 3.x has left little to be desired. I might look into password sharing again, but with the new concept this feature got even more complicated that it already was. On the other hand, allowing PfP Native Host to run on a web server, providing multiple devices with access to the same database would be fairly trivial – assuming that anyone actually needs this feature.

## Trying it out

The download locations for PfP changed, it’s a new browser extension. So it’s now [here](https://addons.mozilla.org/addon/pfp-pain-free-passwords/) for Firefox and [here](https://chrome.google.com/webstore/detail/pfp-pain-free-passwords/dkmnfejkonkiccilfpackimaflcijhbj) for Chromium-based browsers. I want to publish it on Opera Add-ons as well, but their store doesn’t make that easy.

Note that you will also need the PfP Native Host application. While it is self-contained and doesn’t require any privileges, it being unsigned complicates things. I [published some installation instructions](https://pfp.works/documentation/installing-native-host/).

The configuration process of the application should hopefully be self-explaining. You choose an existing database or create a new one, and you choose the browsers which should connect to the application via the [native messaging protocol](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Native_messaging).
