---
title: "The end of PfP: Pain-free Passwords"
date: 2023-03-20T13:28:03+0100
description: "My password manager PfP: Pain-free Passwords will no longer be developed. I write on the lessons learned developing it, disadvantages of password generators and where to go from here."
categories:
- pfp
- password-managers
---

Seven years ago I [created a password manager](/2016/04/19/introducing-easy-passwords-the-new-best-way-to-juggle-all-those-passwords/). And a few days ago I pushed out the last release for it, notifying users that nothing else will come now. Yes, with the previous release being from 2019, this might have been obvious. Now it’s official however, PfP: Pain-free Passwords is no longer being developed.

{{< img src="discontinued.png" width="598" alt="Screenshot of a message titled “PfP: Pain-free Passwords is being discontinued.” The text says: “All good things must come to an end. It has been seven years since PfP was first introduced, back then under the name EasyPasswords. It has features that no other password manager can match, and I still like it. Unfortunately, developing a good password manager is lots of effort. I notice that I’ve been neglecting PfP, and this won’t change any more. So I’m now making official what has been somewhat obvious already: PfP is no longer being developed. Does this mean that you can no longer use it? You can. But whatever breaks now stays broken. Sync to Google Drive in particular is already broken and non-trivial to fix unfortunately. What can you use instead? Not LastPass please. Maybe Bitwarden or 1Password. Definitely KeePass or a clone if you don’t mind it being less intuitive. Personally, I’ll be using KeePassXC. How to get your passwords over? On the “All Passwords” page, there is a new button for CSV export. It should be possible to import the resulting file into any password manager. In KeePassXC you’ll need to check “First line has field names,” otherwise the default import settings will do.”" />}}

I certainly learned a lot from this adventure, and I really like the product which came out of this. Unfortunately, a password manager is a rather time-consuming hobby, and my focus has been elsewhere for a while already.

This doesn’t mean that PfP is going away. In fact, it will probably work well for quite a while until a browser change or something like that makes it unusable. Sync functionality in particular depends on third parties however, and this one already started falling apart.

{{< toc >}}

## Lessons learned

Back when I started this project, originally called EasyPasswords, I was still a cryptography newbie. So it’s not surprising that I made a bunch of questionable choices.

The first mistake was the choice of key derivation algorithm. PBKDF2 had the advantage of being supported natively by the browsers via the [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API), but otherwise it’s not a recommended choice.

The second mistake was focusing on password generation as protection mechanism and neglecting encryption. Encryption would only be used for the occasional stored password, while all the metadata stayed unencrypted.

As I said, I was new to cryptography. Not that there aren’t “industry leaders” who made the exact same mistakes.

By 2018 I’ve [addressed both issues with PfP 2.0](/2018/02/07/easy-passwords-is-now-pfp-pain-free-passwords/) however. Encrypting all the data allowed [implementing secure sync functionality without relying on trusted storage](/2018/03/08/implementing-safe-sync-functionality-in-a-server-less-extension/). No, this isn’t merely uploading an encrypted blob to some cloud storage, PfP sync is rather capable of merging concurrent changes from different PfP instances. Solving this was quite challenging, given that passwords can be locked during sync, in which case PfP won’t be able to decrypt its data.

At the current point I am still aware of two issues with the PfP design. One is the scrypt key derivation parameters being not quite optimal. The reason here is that I wanted for it to be usable on mobile devices, even though a mobile version of PfP never materialized.

As I pointed out myself not too long ago, you [compensate suboptimal key derivation by choosing a stronger password](/2023/01/30/password-strength-explained/). PfP doesn’t offer sufficient guidance here however, and that’s the second issue. There is a password strength indicator based on zxcvbn-ts, but it won’t necessarily flag weak passwords.

## The crux with password generators

PfP has been conceived as a password generator, a choice that looked very clever to me back in the day but seems rather questionable today. Yes, if passwords are being generated deterministically from website and user name, storing the password in the database is no longer necessary. But what difference does it make if all data is encrypted anyway?

In the end, the advantage of password generators is mostly password recovery. PfP allows creating secure paper backups which can be used to recover any password trivially as long as you still remember your master password. But even without the paper, remembering the generation parameters of a password (website and user name, optionally also a revision number and character sets used) is usually possible.

This advantage melted away partially when I designed a (somewhat less convenient) way for paper backups of stored passwords. And a paper backup for hundreds of passwords turned out simply impractical. In the end, what you need is a backup for a few most important passwords. And the rest of them will hopefully be recoverable via sync.

For the meager advantages, password generators have very clear disadvantages. The obvious one is complexity. While storing a password in the database is an intuitively understandable concept, setting up password generation parameters requires some explaining. And you cannot go away with stored passwords completely, so there will always be this “which one to choose?”

More importantly however, there is an attack scenario affecting only password generators but not conventional password managers. If you register at a website which is later compromised, your password for that website could be used to try guessing your master password. In case of success, this attack would compromise your passwords for other websites.

I’ve [recognized this threat early on](/2016/04/20/security-considerations-for-password-generators/) and mitigated it with a slow key derivation algorithm. Yet mitigating this attack scenario will always be worse than not having it at all.

## The reason for giving up

None of the issues are unsurmountable, and the security concerns don’t even matter for a small niche solution like PfP. They are not the reason I am giving up on the project.

In fact, I had plenty of ideas for it. I created an [almost complete command-line version](https://github.com/palant/pfp-cli/) of PfP, written in Rust. The idea was that in future this well-tested library would be compiled into WebAssembly and used in the browser extensions as well.

There were also well thought-out ideas for user interface improvements, an Android app, password sharing. I merely lacked the time and the focus to finish any of it.

And thinking about it, I had to admit that things won’t change any more. As much as I like this product, I wouldn’t be able to maintain it any more. There is always something that’s more important.

## Where to go from here

Obviously, anyone is free to continue using PfP as they like. The fact that the extension isn’t being developed doesn’t mean that it won’t work. It already did pretty well without any changes in the past three years.

Unless Chrome decides to enforce Manifest V3 at some point. They’ve moved the deadline for that a few times already, and I can see why: the move from background pages to background workers was a very non-trivial one, and there are still [critical implementation issues](https://bugs.chromium.org/p/chromium/issues/detail?id=1337294). But at some point Manifest V3 will likely become mandatory for extensions.

Well, I’ve done the work migrating PfP to Manifest V3. It [lives on a branch](https://github.com/palant/pfp/tree/manifest-v3), and I decided against releasing it at this point given the sad state of Chrome’s implementation. Hopefully, I’ll find time to release it once Chrome developers have done their homework. This should make sure that everyone can continue using PfP for quite some time.

For anyone looking to migrate to a different password manager, I’ve added a way to save passwords as a generic CSV file. It should be possible to import this file into any password manager.

Personally, I will try to make KeePassXC work for me. While it does not meet some of my design goals for PfP, its open nature should make it possible to add whatever functionality I need. Maybe some of it can make it into the KeePassXC product, but external tools can work with the passwords database just as well.