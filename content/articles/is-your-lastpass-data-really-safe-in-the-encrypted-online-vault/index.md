---
categories:
- security
- lastpass
- password-managers
date: "2018-07-09 10:00:00"
description: LastPass fanboys often claim that a breach of the LastPass server isn't
  a big deal because all data is encrypted. In reality, somebody able to compromise
  the LastPass server will likely gain access to the decrypted data as well.
slug: is-your-lastpass-data-really-safe-in-the-encrypted-online-vault
title: Is your LastPass data really safe in the encrypted online vault?
---

*Disclaimer*: I created [PfP: Pain-free Passwords](https://pfp.works/) as a hobby, it could be considered a LastPass competitor in the widest sense. I am genuinely interested in the security of password managers which is the reason both for my own password manager and for this blog post on LastPass shortcomings.

TL;DR: LastPass fanboys often claim that a breach of the LastPass server isn’t a big deal because all data is encrypted. As I show below, that’s not actually the case and somebody able to compromise the LastPass server will likely gain access to the decrypted data as well.

A while back I stated in an [analysis of the LastPass security architecture](https://security.stackexchange.com/a/137307/4778):

> So much for the general architecture, it has its weak spots but all in all it is pretty solid and your passwords are unlikely to be compromised at this level.

That was really stupid of me, I couldn’t have been more wrong. Turned out, I relied too much on the wishful thinking dominating LastPass documentation. January this year I took a closer look at the LastPass client/server interaction and found a number of unpleasant surprises. Some of the issues went very deep and it took LastPass a while to get them fixed, which is why I am writing about this only now. A bunch of less critical issues remain unresolved as of this writing, so that I cannot disclose their details yet.

 {{< toc >}}

## Cracking the encryption

In 2015, LastPass suffered a security breach. The attackers were able to extract some data from the server yet [LastPass was confident](https://blog.lastpass.com/2015/06/lastpass-security-notice.html/):

>	We are confident that our encryption measures are sufficient to protect the vast majority of users. LastPass strengthens the authentication hash with a random salt and 100,000 rounds of server-side PBKDF2-SHA256, in addition to the rounds performed client-side. This additional strengthening makes it difficult to attack the stolen hashes with any significant speed.

What this means: anybody who gets access to your LastPass data on the server will have to guess your master password. The master password isn’t merely necessary to authenticate against your LastPass account, it also allows encrypting your data locally before sending it to the server. The encryption key here is derived from the master password, and neither is known to the LastPass server. So attackers who managed to compromise this server will have to guess your master password. And LastPass uses PBKDF2 algorithm with a high number of iterations (LastPass prefers calling them “rounds”) to slow down verifying guesses. For each guess one has to derive the local encryption key with 5,000 PBKDF2 iterations, hash it, then apply another 100,000 PBKDF2 iterations which are normally added by the LastPass server. Only then can the result be compared to the authentication hash stored on the server.

So far all good: 100,000 PBKDF2 iterations should be ok, and it is in fact the number used by the competitor 1Password. But that protection only works if the attackers are stupid enough to verify their master password guesses via the authentication hash. As mentioned above, the local encryption key is derived from your master password with merely 5,000 PBKDF2 iterations. And it is used to encrypt various pieces of data: passwords, private RSA keys, OTPs etc. The LastPass server stores these encrypted pieces of data without any additional protection. So a clever attacker would guess your master password by deriving the local encryption key from a guess and trying to decrypt some data. Worked? Great, the guess is correct. Didn’t work? Try another guess. This approach speeds up guessing master passwords by factor 21.

So, what kind of protection do 5,000 PBKDF2 iterations offer? Judging by [these numbers](https://discourse.codinghorror.com/t/hacker-hack-thyself/5290/22), a single GeForce GTX 1080 Ti graphics card (cost factor: less than $1000) can be used to test 346,000 guesses per second. That’s enough to go through the [database with over a billion passwords known from various website leaks](https://crackstation.net/buy-crackstation-wordlist-password-cracking-dictionary.htm) in barely more than one hour. And even if you don’t use any of the common passwords, it is estimated that [the average password strength is around 40 bits](http://research.microsoft.com/pubs/74164/www2007.pdf). So on average an attacker would need to try out half of 2<sup>40</sup> passwords before hitting the right one, this can be achieved in roughly 18 days. Depending on who you are, spending that much time (or adding more graphics cards) might be worth it. Of course, more typical approach would be for the attackers to test guesses on all accounts in parallel, so that the accounts with weaker passwords would be compromised first.

*Statement from LastPass:*

> We have increased the number of PBKDF2 iterations we use to generate the vault encryption key to 100,100. The default for new users was changed in February 2018 and we are in the process of automatically migrating all existing LastPass users to the new default. We continue to recommend that users do not reuse their master password anywhere and follow our guidance to use a strong master password that is going to be difficult to brute-force.

## Extracting data from the LastPass server

Somebody extracting data from the LastPass server sounds too far fetched? This turned out easier than I expected. When I tried to understand the LastPas login sequence, I noticed the script `https://lastpass.com/newvault/websiteBackgroundScript.php` being loaded. That script contained some data on the logged in user’s account, in particular the user name and a piece of encrypted data (private RSA key). Any website could load that script, only protection in place was based on the `Referer` header which was trivial to circumvent. So when you visited any website, that website could get enough data on your LastPass account to start guessing your master password (only weak client-side protection applied here of course). And as if that wasn’t enough, the script also contained a valid [CSRF token](https://en.wikipedia.org/wiki/Cross-site_request_forgery), which allowed this website to change your account settings for example. Ouch…

To me, the most surprising thing about this vulnerability is that no security researcher found it so far. Maybe nobody expected that a script request receiving a CSRF token doesn’t actually validate this token? Or have they been confused by the inept protection used here? Beats me. Either way, I’d consider the likeliness of some blackhat having discovered this vulnerability independently rather high. It’s up to LastPass to check whether it was being exploited already, this is an attack that would leave traces in their logs.

*Statement from LastPass:*

> The script can now only be loaded when supplying a valid CSRF token, so 3rd-parties cannot gain access to the data. We also removed the RSA sharing keys from the scripts generated output.

## The “encrypted vault” myth

LastPass consistently calls its data storage the “encrypted vault.” Most people assume, like I did originally myself, that the server stores your data as an AES-encrypted blob. A look at [https://lastpass.com/getaccts.php](https://lastpass.com/getaccts.php) output (you have to be logged in to see it) quickly proves this assumption to be incorrect however. While some data pieces like account names or passwords are indeed encrypted, others like the corresponding URL are merely hex encoded. [This 2015 presentation](https://www.blackhat.com/docs/eu-15/materials/eu-15-Vigo-Even-The-Lastpass-Will-Be-Stolen-deal-with-it.pdf) already pointed out that the incomplete encryption is a weakness (page 66 and the following ones). While LastPass decided to encrypt more data since then, they still don’t encrypt everything.

The same presentation points out that using ECB as block cipher mode for encryption is a bad idea. One issue in particular is that while passwords are encrypted, with ECB it is still possible to tell which of them are identical. LastPass *mostly* migrated to CBC since that publication and a look at `getaccts.php` shouldn’t show more than a few pieces of ECB-encrypted data (you can tell them apart because ECB is encoded as a single base64 blob like `dGVzdHRlc3R0ZXN0dGVzdA==` whereas CBC is two base64 blobs starting with an exclamation mark like `!dGVzdHRlc3R0ZXN0dGVzdA==|dGVzdHRlc3R0ZXN0dGVzdA==`). It’s remarkable that ECB is still used for some (albeit less critical) data however. Also, encryption of older credentials isn’t being “upgraded” it seems, if they were encrypted with AES-ECB originally they stay this way.

I wonder whether the authors of this presentation got their security bug bounty retroactively now that LastPass has a bug bounty program. They uncovered some important flaws there, many of which still exist to some degree. This work deserves to be rewarded.

*Statement from LastPass:*

>	The fix for this issue is being deployed as part of the migration to the higher iteration count in the earlier mentioned report.

## A few words on backdoors

People losing access to their accounts is apparently an issue with LastPass, which is why they have been adding backdoors. These backdoors go under the name “One-Time Passwords” (OTPs) and can be created on demand. Good news: LastPass doesn’t know your OTPs, they are encrypted on the server side. So far all fine, as long as you keep the OTPs you created in a safe place.

There is a catch however: one OTP is being created implicitly by the LastPass extension to aid account recovery. This OTP is stored on your computer and retrieved by the LastPass website when you ask for account recovery. This means however that whenever LastPass needs to access your data (e.g. because US authorities requested it), they can always instruct their website to silently ask LastPass extension for that OTP and you won’t even notice.

Another consequence here: anybody with access to both your device and your email can gain access to your LastPass account. This is a [known issue](https://helpdesk.lastpass.com/extension-preferences/#h5):

>	It is important to note that if an attacker is able to obtain your locally stored OTP (and decrypt it while on your pc) and gain access to your email account, they can compromise your data if this option is turned on. We feel this threat is low enough that we recommend the average user not to disable this setting.

I disagree on the assessment that the threat here is low. Many people had their co-workers play a prank on them because they left their computer unlocked. Next time one these co-workers might not send a mail in your name but rather use account recovery to gain access to your LastPass account and change your master password.

*Statement from LastPass:*

>	This is an optional feature that enables account recovery in case of a forgotten master password. After reviewing the bug report, we’ve added further security checks to prevent silent scripted attacks.

## Conclusion

As this high-level overview demonstrates: if the LastPass server is compromised, you cannot expect your data to stay safe. While in theory you shouldn’t have to worry about the integrity of the LastPass server, in practice I found a number of architectural flaws that allow a compromised server to gain access to your data. Some of these flaws have been fixed but more exist. One of the more obvious flaws is the Account Settings dialog that belongs to the lastpass.com website even if you are using the extension. That’s something to keep in mind whenever that dialog asks you for your master password: there is no way to know that your master password won’t be sent to the server without applying PBKDF2 protection to it first. In the end, the LastPass extension depends on the server in many non-obvious ways, too many for it to stay secure in case of a server compromise.

*Statement from LastPass:*

>	We greatly appreciate Wladimir’s responsible disclosure and for working with our team to ensure the right fixes are put in place, making LastPass stronger for our users. As stated in our [blog post](https://blog.lastpass.com/2018/07/lastpass-bugcrowd-update.html/), we’re in the process of addressing each report, and are rolling out fixes to all LastPass users. We’re in the business of password management; security is always our top priority. We welcome and incentivize contributions from the security research community through our [bug bounty program](https://bugcrowd.com/lastpass) because we value their cyber security knowledge. With their help, we’ve put LastPass to the test and made it more resilient in the process.
