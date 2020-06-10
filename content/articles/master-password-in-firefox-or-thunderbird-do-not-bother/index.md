---
categories:
- mozilla
- security
- password-managers
date: "2018-03-10 15:38:20"
lastmod: "2020-06-10T11:57:20+0200"
description: ""
slug: master-password-in-firefox-or-thunderbird-do-not-bother
title: Master password in Firefox or Thunderbird? Do not bother!
---

There is a weakness common to any software letting you protect a piece of data with a password: how does that password translate into an encryption key? If that conversion is a fast one, then you better don't expect the encryption to hold. Somebody who gets hold of that encrypted data will try to guess the password you used to protect it. And modern hardware is very good at validating guesses.

Case in question: Firefox and Thunderbird password manager. It is common knowledge that storing passwords there without defining a master password is equivalent to storing them in plain text. While they will still be encrypted in `logins.json` file, the encryption key is stored in `key3.db` file without any protection whatsoever. On the other hand, it is [commonly believed that with a master password your data is safe](https://security.stackexchange.com/a/413/4778). Quite remarkably, I haven't seen any articles stating the opposite.

However, when I looked into the source code, I eventually found the [sftkdb_passwordToKey() function](https://dxr.mozilla.org/mozilla-central/rev/415e9b18ca2a1532086d5e2d5d21343cd004b5fd/security/nss/lib/softoken/sftkpwd.c#54) that converts a password into an encryption key by means of applying SHA-1 hashing to a string consisting of a random salt and your actual master password. Anybody who ever designed a login function on a website will likely see the red flag here. [This article](http://cynosureprime.blogspot.de/2017/08/320-million-hashes-exposed.html) sums it up nicely:

> Out of the roughly 320 million hashes, we were able to recover all but **116** of the SHA-1 hashes, a roughly **99.9999%** success rate.

The problem here is: GPUs are extremely good at calculating SHA-1 hashes. Judging by the numbers from [this article](https://blog.codinghorror.com/hacker-hack-thyself/), a single Nvidia GTX 1080 graphics card can calculate 8.5 billion SHA-1 hashes per second. That means testing 8.5 billion password guesses per second. And humans are remarkably bad at choosing strong passwords. [This article](http://research.microsoft.com/pubs/74164/www2007.pdf) estimates that the average password is merely 40 bits strong, and that estimate is already higher than some of the others. In order to guess a 40 bit password you will need to test 2<sup>39</sup> guesses on average. If you do the math, cracking a password will take merely a minute on average then. Sure, you could choose a stronger password. But finding a considerably stronger password that you can still remember will be awfully hard.

Turns out that the [corresponding NSS bug](https://bugzilla.mozilla.org/show_bug.cgi?id=524403) has been sitting around for the past 9 (nine!) years. That's also at least how long software to crack password manager protection has been available to anybody interested. So, is this issue so hard to address? Not really. [NSS library](https://developer.mozilla.org/en-US/docs/Mozilla/Projects/NSS) implements [PBKDF2 algorithm](https://en.wikipedia.org/wiki/PBKDF2) which would slow down bruteforcing attacks considerably if used with at least 100,000 iterations. Of course, it would be nice to see NSS implement a more resilient algorithm like [Argon2](https://en.wikipedia.org/wiki/Argon2) but that's wishful thinking seeing a fundamental bug that didn't find an owner in nine years.

But before anybody says that I am unfair to Mozilla and NSS here, other products often don't do any better. For example, if you want to encrypt a file you might be inclined to use OpenSSL command line tools. However, the password-to-key conversion performed by the `openssl enc` command is even worse than what Firefox password manager does: it's [essentially a single MD5 hash operation](https://cryptosense.com/weak-key-derivation-in-openssl/). OpenSSL developers are [aware of this issue](http://openssl.6102.n7.nabble.com/Re-Accessing-PBKDF2-from-command-line-td25835.html) but:

> At the end of the day, OpenSSL is a **library**, not an end-user product, and enc(1) and friends are developer utilities and "demo" tools.

News flash: there are plenty of users out there not realizing that OpenSSL command line tools are insecure and not actually meant to be used.

**Update (2020-06-10)**: The NSS bug has been resolved and the change made it into Firefox 72. The default is now 10,000 iterations which isn't great but a lot better than where we came from. What I cannot figure out is what happens to existing key files. As I cannot find any migration code, it could be that these are stuck with one iteration and only new profiles get better security.
