---
categories:
- security
- mozilla
- password-managers
date: '2018-03-13 10:45:49'
description: When using Chrome Sync or Firefox Sync, you should always choose a long
  randomly generated passpharse. Otherwise, your passwords won't be sufficiently protected.
lastmod: '2020-06-10T12:20:59+0200'
slug: can-chrome-sync-or-firefox-sync-be-trusted-with-sensitive-data
title: Can Chrome Sync or Firefox Sync be trusted with sensitive data?
---

A few days ago I wrote about [insufficient protection of locally saved passwords in Firefox](/2018/03/10/master-password-in-firefox-or-thunderbird-do-not-bother). As some readers correctly noted however, somebody gaining physical access to your device isn't the biggest risk out there. All the more reason to take a look at how browser vendors protect your passwords when they upload them to the cloud. Both Chrome and Firefox provide a sync service that can upload not just all the stored passwords, but also your cookies and browsing history which are almost as sensitive. Is it a good idea to use that service?

TL;DR: The answer is currently "no," both services have weaknesses in their protection. Some of these weaknesses are worse than others however.

## Chrome Sync

I'll start with Chrome Sync first, where the answer is less surprising. After all, there are several signs that this service is built for convenience rather than privacy. For example, the passphrase meant to protect your data from Google's eyes is [optional](https://support.google.com/chrome/answer/165139#passphrase). There is no setup step where it asks you “Hey, do you mind if we can peek into your data? Then choose a passphrase.” Instead, you have to become active on your own. Another sign is that Google lets you [access your passwords via a web page](https://passwords.google.com/). The idea is probably that you could open up that webpage on a computer that doesn't belong to you, e.g. in an internet café. Is it a good idea? Hardly.

Either way, what happens if you set a passphrase? That passphrase will be used to derive (among other things) an encryption key and your data will be encrypted with it. And the big question of course is: if somebody gets hold of your encrypted data on Google's servers, is translating the passphrase into an encryption key slow enough to prevent somebody from guessing your passphrase? Turned out, Chrome is using PBKDF2-HMAC-SHA1 with 1003 iterations.

To give you an idea of what that means, I'll again use the numbers from [this article](https://blog.codinghorror.com/hacker-hack-thyself/) as a reference: with that iterations count, a single Nvidia GTX 1080 graphics card could turn out 3.2 million PBKDF2-HMAC-SHA1 hashes per second. That's 3.2 million password guesses tested per second. 1.5 billion passwords known from various website leaks? Less than 8 minutes. A 40 bits strong password that [this article](http://research.microsoft.com/pubs/74164/www2007.pdf) considers to be the average chosen by humans? That article probably overestimates humans’ capabilities for choosing good passwords, but on average within two days that password will be guessed as well.

It's actually worse than that. The salt that Chrome uses for key derivation here is a constant. It means that the same password will result in the same encryption key for any Chrome user. That in turn means that an attacker who got the data for a multitude of users could test a password guess against all accounts. So they would only spend four days and the data for any account using up to 40 bits strong password would be decrypted. Mind you, Google themselves has enough hardware to do the job within minutes if not seconds. I am talking about somebody not willing to invest more than $1000 into hardware.

I reported this as [issue 820976](https://bugs.chromium.org/p/chromium/issues/detail?id=820976), stay tuned.

_Site-note_: Style points to Chrome for creative waste of CPU time. The function in question manages to run PBKDF2 four times where one run would have been sufficient. First run derives the salt from host name and username (both happen to be constants in case of Chrome Sync). This is pretty pointless: a salt doesn't have to be a secret, it merely needs to be unique. So concatenating the values or running SHA-256 on them would do just as well. The next three runs derive three different keys from identical input, using different iteration counts. A single PBKDF2 call producing the data for all three keys clearly would have been a better idea.

**Update** (2020-06-10): The issue has been resolved in Chrome 80. The key derivation algorithm used now is [scrypt](https://en.wikipedia.org/wiki/Scrypt) with N=8192, r=8, p=11. These values are sane and should make attacks against most passwords unrealistic.

## Firefox Sync

Firefox Sync relies on the [well-documented Firefox Accounts protocol](https://github.com/mozilla/fxa-auth-server/wiki/onepw-protocol) to establish encryption keys. While all the various parameters and operations performed there can be quite confusing, it appears to be a well-designed approach. If somebody gets hold of the data stored on the server they will have to deal with password derivation based on [scrypt](https://en.wikipedia.org/wiki/Scrypt). Speeding up scrypt with specialized hardware is a whole lot harder than PBKDF2, already because each scrypt call requires 64 MB of memory given the parameters used by Mozilla.

There is an important weakness here nevertheless: scrypt runs on the Firefox Accounts server, not on the client side. On the client side this protocol uses PBKDF2-HMAC-SHA256 with merely 1000 iterations. And while the resulting password hash isn't stored on the server, if somebody can read it out when it is being transmitted to the server they will be able to guess the corresponding password comparably easily. Here, a single Nvidia GTX 1080 graphics card could validate 1.2 million guesses per second. While the effort would have to be repeated for each user account, testing 1.5 billion known passwords would be done within twenty minutes. And a 40 bits strong password would fall within five days on average. Depending on what's in the account, spending this time (or adding more hardware) might be worth it.

The remarkable part of this story: Mozilla paid a security audit of Firefox Accounts, and that audit [pointed out the client-side key derivation as a key weakness](https://blog.mozilla.org/security/2017/07/18/web-service-audits-firefox-accounts/). So Mozilla has been aware of this issue for at least 18 months, and 8 months ago they even published this information. What happened? Nothing so far, the issue didn't receive the necessary priority it seems. This might have been partly due to the auditor misjudging the risk:

> Further, this attack assumes a very strong malicious adversary who is capable of bypassing TLS

Sure, somebody getting a valid certificate for api.accounts.firefox.com and rerouting traffic destined for api.accounts.firefox.com to their own server would be one possible way to exploit this issue. It's more likely however that the integrity of the real api.accounts.firefox.com server is compromised. Even if the server isn't hacked, there is always a chance that a Mozilla or Amazon (it is hosted on AWS) employee decides to take a look at somebody's data. Or what if the U.S. authorities knock at Mozilla's door?

I originally reported this as [bug 1444866](https://bugzilla.mozilla.org/show_bug.cgi?id=1444866). It has now been marked as a duplicate of [bug 1320222](https://bugzilla.mozilla.org/show_bug.cgi?id=1320222) – I couldn't find it because it was marked as security sensitive despite not containing any information that wasn't public already.
