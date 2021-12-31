---
categories:
- lastpass
- security
- password-managers
date: 2021-12-29T23:20:14+0100
description: LastPass accounts are under attack. I look into how user’s master passwords
  might have leaked.
lastmod: '2021-12-31 10:28:02'
title: How did LastPass master passwords get compromised?
---

A number of LastPass users recently received an email like the following, indicating that someone else attempted to log into their account:

{{< img src="email.png" alt="Email with the LastPass header: Login attempt blocked. Hello, Someone just used your master password to try to log in to your account from a device or location we didn't recognize. LastPass blocked this attempt, but you should take a closer look. Was this you?" width="525" />}}

The mail is legitimate and has been sent out by the LastPass service. The location however was typically very far away from the user’s actual location, e.g. in a country like Brazil or India. Yet this isn’t merely an attempt to guess the password, as LastPass will only send a mail like this one if the correct master password is provided in the login attempt.

One affected user created a [thread on Hacker News](https://news.ycombinator.com/item?id=29705957) and at least a dozen others chimed in with similar experiences. This indicates that a large-scale attack is underway, with the total number of affected users being quite significant.

As online password managers go, a user’s master password is the most critical piece of information. So the important question is: how do the attackers know the master passwords? There are some explanation being discussed: credential stuffing, phishing, malware, LastPass compromise. As I [know a thing or two about LastPass](/categories/lastpass/), I’ll write down how likely these are and why.

TL;DR: It appears that LastPass infrastructure has been compromised, all other explanations being rather unlikely. And, surprisingly, it isn’t given that the attackers actually know these master passwords.

{{< toc >}}

## Credential stuffing

The Hacker News thread prompted AppleInsider to [write about this issue](https://appleinsider.com/articles/21/12/28/lastpass-master-passwords-may-have-been-compromised). The article quotes a LastPass spokesperson with the following statement:

> LastPass investigated recent reports of blocked login attempts and we believe the activity is related to attempted 'credential stuffing' activity, in which a malicious or bad actor attempts to access user accounts (in this case, LastPass) using email addresses and passwords obtained from third-party breaches related to other unaffiliated services

Credential stuffing attacks are quite common and rely on password reuse: a password leaked by one service happens to be used for another service as well. But is password reuse likely when talking about a password manager whose entire goal is eliminating password reuse? With LastPass having a history of downplaying security issues, we should take their statement with a grain of salt.

Several affected Hacker News users claim (and I believe them) that their master password has not been reused anywhere. Worse yet, several users reported changing their master password in response to the notification, yet getting notified about another login attempt with the new master password shortly afterwards.

{{< img src="tweet.png" width="582" alt="A tweet by Valcrist @Valcristerra: Someone tried my @LastPass master password earlier yesterday and then someone just tried it again a few hours ago after I changed it. What the hell is going on?" />}}

If true (and I have little reason to doubt this statement), this completely rules out credential stuffing as the attack vector here.

**Update** (2021-12-30): LastPass published an [expanded statement](https://blog.lastpass.com/2021/12/unusual-attempted-login-activity-how-lastpass-protects-you/) that I was unaware of at the time of writing. It also claims that credential stuffing is the source of the issue but has an important addition (emphasis mine):

> Our investigation has since found that some of these security alerts, which were sent to a limited subset of LastPass users, were *likely* triggered in error.

This *seems* to indicate that the email messages were mistakenly triggered by login attempts with incorrect password. This would be good news and make the rest of this article obsolete. But note how they say “likely” here. If they found and fixed a bug in the email notification mechanism, why don’t they just state so? Unfortunately, this kind of statement sounds like they still don’t have a clue about what’s going on but want to calm the crowd nevertheless.

## Phishing

Phishing, mentioned as another possible explanation, is quite unlikely for the same reason. The suspicion here is that the users have been lured to a fake LastPass login page and entered their master password there. While this is also a common attack, it cannot explain repeated login attempts after a master password change.

Also, several affected LastPass accounts haven’t been in use for at least a year. This means that the phishing attack must have happened at least a year ago in this case. Yet anybody collecting passwords via phishing would have attempted to use them as soon as possible. The longer they wait, the more likely the user will recognize their mistake and change the password.

## Malware

As it seems that the attackers react to changes, some people concluded that they are indeed being watched. The options are a malicious (or severely vulnerable) browser extension or a standalone application compromising the entire system. This explains at least how the attackers would get the new master password after a change.

This theory is also unlikely however, for multiple reasons. First of all, malware provides a level of access that makes hacking LastPass accounts unnecessary. If it can intercept or extract the LastPass master password, it can do the same for all other passwords as well. Logging into LastPass accounts is simply an additional step, one that unnecessarily exposes the entire campaign.

It’s also notable that the attacks here are thwarted by rudimentary protection based on geographical location. Why would attackers who control user’s browser or their entire system run into this trap? They could log into LastPass from the user’s own browser instead. Better yet: they could hijack the existing LastPass session. Last time I checked these took two whole weeks to expire.

Finally, there is the question of timing. Malware can only steal a password when that password is used. Yet some affected accounts were abandoned, last used more than a year ago. Did the attackers collect credentials and thoroughly prepare over a lengthy period of time? It doesn’t look like that. These attacks aren’t sophisticated, or they wouldn’t attempt to log into accounts of US users from Brazil. With real preparation they wouldn’t repeatedly run against this geographical protection.

## LastPass compromise

As far as I can tell, this only leaves the option that LastPass itself has been compromised. But this option also raises questions: not even LastPass servers are supposed to know users’ master passwords. Master password is only ever transmitted as a hash, one that is difficult to reverse.

My initial suspicion was that someone abused the vulnerability I [described in this post from 2018](/2018/07/09/is-your-lastpass-data-really-safe-in-the-encrypted-online-vault/). The issue allowing `websiteBackgroundScript.php` to be loaded by any website was obvious enough that someone could have discovered it independently from me. And cracking the master password when hashed with merely 5,000 PBKDF2 iterations (LastPass default before 2018) is totally possible. However, this option is ruled out by the fact that users also reported brand new accounts being affected, as well as recently changed master passwords.

The new default (100,000 iterations) makes recovering master passwords from hashes require considerably more resources, too much for unsophisticated attackers to pull off such a large-scale attack even in case of another similar data leak. But that’s assuming that LastPass servers are in fact unaware of your master password.

LastPass users will often enter their master password into web pages hosted on `lastpass.com`, even when using the browser extension. This is a design flaw, as there is no real way of verifying that the password is never sent out unhashed. It is for example possible that some logging functionality inadvertently sent the plaintext password to a server. And with log4j vulnerabilities being actively exploited right now, someone might have compromised the very server receiving this data. **Update** (2021-12-31): LastPass reached out to me to state (among other things) that they aren’t using log4j anywhere.

I tried logging into LastPass via the web interface and couldn’t see any unexpected data being transmitted. This doesn’t prove anything of course, as some other form might be the culprit here. Or this functionality might only be enabled for US users for example. But there is also another explanation, one that doesn’t require LastPass to know the unhashed master password.

## Pass the hash

It is in fact not given that the attackers know the master password. That’s because LastPass authentication (unlike proper [PAKE protocols](https://en.wikipedia.org/wiki/Password-authenticated_key_agreement)) is vulnerable to [pass the hash attacks](https://en.wikipedia.org/wiki/Pass_the_hash). The same master password hash is used each time to log in, so the attackers might have used that hash rather than the master password itself. And lifting that hash from some LastPass server should be much easier than getting your hands on the unhashed master password.

So one can log in using only the master password hash, and what then? Once logged in, attackers can download `https://lastpass.com/getaccts.php` which holds all of account’s data. This gives them the addresses of websites but the corresponding user names and passwords cannot be decrypted without knowing the master password.

It doesn’t mean that this attack is worthless however. Once the attackers have the data, they can spend all eternity bruteforcing the master password locally. They can even prioritize the accounts holding passwords to more valuable websites. So this might very well be what happened here.
