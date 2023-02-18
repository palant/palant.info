---
categories:
- bitwarden
- security
- password-managers
- lastpass
date: 2023-01-23T11:57:15+0100
description: Bitwarden is a hot candidate for a LastPass replacement. Looking into
  how they encrypt data, it doesn’t do things that much better however.
lastmod: '2023-02-18 07:08:58'
title: 'Bitwarden design flaw: Server side iterations'
---

In the aftermath of the LastPass breach it became increasingly clear that LastPass didn’t protect their users as well as they should have. When people started looking for alternatives, two favorites emerged: 1Password and Bitwarden. But do these do a better job at protecting sensitive data?

For 1Password, this question could be answered fairly easily. The [secret key functionality](https://blog.1password.com/what-the-secret-key-does/) decreases usability, requiring the secret key to be moved to each new device used with the account. But the fact that this random value is required to decrypt the data means that the encrypted data on 1Password servers is almost useless to potential attackers. It cannot be decrypted even for weak master passwords.

As to Bitwarden, the media mostly repeated their claim that the data is protected with 200,001 PBKDF2 iterations: 100,001 iterations on the client side and another 100,000 on the server. This being twice the default protection offered by LastPass, it doesn’t sound too bad. Except: as it turns out, the server-side iterations are designed in such a way that they don’t offer any security benefit. What remains are 100,000 iterations performed on the client side, essentially the same protection level as for LastPass.

Mind you, LastPass isn’t only being criticized for using a default iterations count that is three time lower than the [current OWASP recommendation](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html#pbkdf2). LastPass also [failed to encrypt all data](/2022/12/24/what-data-does-lastpass-encrypt/), a flaw that Bitwarden doesn’t seem to share. LastPass also [kept the iterations count for older accounts dangerously low](/2022/12/28/lastpass-breach-the-significance-of-these-password-iterations/), something that Bitwarden hopefully didn’t do either (**Edit**: yes, they [did this](#c000002), some accounts have considerably lower iteration count). LastPass also [chose to downplay the breach instead of suggesting meaningful mitigation steps](/2022/12/26/whats-in-a-pr-statement-lastpass-breach-explained/), something that Bitwarden hopefully wouldn’t do in this situation. Still, the protection offered by Bitwarden isn’t exactly optimal either.

**Edit** (2023-01-23): Bitwarden increased the default client-side iterations to 350,000 a few days ago. So far this change only applies to new accounts, and it is unclear whether they plan to upgrade existing accounts automatically. And today OWASP changed their recommendation to 600,000 iterations, it has been adjusted to current hardware.

**Edit** (2023-01-24): I realized that some of my concerns were already voiced in Bitwarden’s [2018 Security Assessment](https://cure53.de/pentest-report_bitwarden.pdf). Linked to it in the respective sections.

{{< toc >}}

## How Bitwarden protects users’ data

Like most password managers, Bitwarden uses a single master password to protect users’ data. The Bitwarden server isn’t supposed to know this password. So two different values are being derived from it: a master password hash, used to verify that the user is allowed to log in, and a key used to encrypt/decrypt the data.

{{< img src="bitwarden-password-hashing-key-derivation-encryption.jpg" alt="A schema showing the master password being hashed with PBKDF2-SHA256 and 100,000 iterations into a master key. The master key is further hashed on the server side before being stored in the database. The same master key is turned into a stretched master key used to encrypt the encryption key, here no additional PBKDF2 is applied on the server side." width="850">}}
  <em>Bitwarden password hashing, key derivation, and encryption. Source: <a href="https://bitwarden.com/images/resources/security-white-paper-download.pdf">Bitwarden security whitepaper</a></em>
{{< /img >}}

If we look at how Bitwarden describes the process in their [security whitepaper](https://bitwarden.com/images/resources/security-white-paper-download.pdf), there is an obvious flaw: the 100,000 PBKDF2 iterations on the server side are only applied to the master password hash, not to the encryption key. This is pretty much the same flaw that I [discovered in LastPass in 2018](/2018/07/09/is-your-lastpass-data-really-safe-in-the-encrypted-online-vault/#cracking-the-encryption).

## What this means for decrypting the data

So what happens if some malicious actor happens to get a copy of the data, like it happened with LastPass? They will need to decrypt it. And for that, they will have to guess the master password. PBKDF2 is meant to slow down verifying whether a guess is correct.

Testing the guesses against the master password hash would be fairly slow: 200,001 PBKDF2 iterations here. But the attackers wouldn’t waste time doing that of course. Instead, for each guess they would derive an encryption key (100,000 PBKDF2 iterations) and check whether this one can decrypt the data.

This simple tweak removes all the protection granted by the server-side iterations and speeds up master password guessing considerably. Only the client-side iterations really matter as protection.

## What this means for you

The default protection level of LastPass and Bitwarden is identical. This means that you need a strong master password. And the only real way to get there is generating your password randomly. For example, you could generate a random passphrase using the [diceware approach](https://en.wikipedia.org/wiki/Diceware).

Using a dictionary for 5 dice (7776 dictionary words) and picking out four random words, you get a password with slightly over 50 bits of entropy. I’ve done the [calculations for guessing such passwords](/2022/12/28/lastpass-breach-the-significance-of-these-password-iterations/#what-is-this-setting-about): approximately 200 years on a single graphics card or $1,500,000.

This should be a security level sufficient for most regular users. If you are guarding valuable secrets or are someone of interest for state-level actors, you might want to consider a stronger password. Adding one more word to your passphrase increases the cost of guessing your password by factor 7776. So a passphrase with five words is already almost unrealistic to guess even for state-level actors.

All of this assumes that your [KDF iterations setting](https://bitwarden.com/help/what-encryption-is-used/#changing-kdf-iterations) is set to the default 100,000. Bitwarden will allow you to set this value as low as 5,000 without even warning you. This was mentioned as BWN-01-009 in Bitwarden’s [2018 Security Assessment](https://cure53.de/pentest-report_bitwarden.pdf), yet there we are five years later. Should your setting be too low, I recommend fixing it immediately. Reminder: [current OWASP recommendation](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html#pbkdf2) is 310,000.

## Is Bitwarden as bad as LastPass?

So as it turns out, with the default settings Bitwarden provides exactly the same protection level as LastPass. This is only part of the story however.

One question is how many accounts have a protection level below the default configured. It seems that before 2018 Bitwarden’s default used to be 5,000 iterations. Then the developers increased it to 100,000 in multiple successive steps. When LastPass did that, they failed upgrading existing accounts. I wonder whether Bitwarden also has older accounts stuck on suboptimal security settings.

The other aspect here is that Dmitry Chestnykh [wrote about Bitwarden’s server-side iterations being useless](https://dchest.com/2020/05/25/improving-storage-of-password-encrypted-secrets-in-end-to-end-encrypted-apps/) in 2020 already, and Bitwarden should have been aware of it even if they didn’t realize how my research applies to them as well. On the other hand, using PBKDF2 with only 100,000 iterations isn’t a great default today. Still, Bitwarden failed to increase it in the past years, apparently copying LastPass as “gold standard” – and they didn’t adjust [their PR claims either](https://bitwarden.com/help/what-encryption-is-used/#pbkdf2):

{{< img src="claims.png" width="805" alt="Screenshot of text from the Bitwarden website: The default iteration count used with PBKDF2 is 100,001 iterations on the client (client-side iteration count is configurable from your account settings), and then an additional 100,000 iterations when stored on our servers (for a total of 200,001 iterations by default). The organization key is shared via RSA-2048. The utilized hash functions are one-way hashes, meaning they cannot be reverse engineered by anyone at Bitwarden to reveal your master password. Even if Bitwarden were to be hacked, there would be no method by which your master password could be obtained." />}}

Users have been [complaining and asking for better key derivation functions](https://community.bitwarden.com/t/encryption-suggestions-including-argon2/350/76) since at least 2018. It was even mentioned as BWN-01-007 in Bitwarden’s [2018 Security Assessment](https://cure53.de/pentest-report_bitwarden.pdf). This change wasn’t considered a priority however. Only after the LastPass breach things started moving, and it wasn’t Bitwarden’s core developers driving the change. Someone contributed the changes required for [scrypt support](https://github.com/bitwarden/clients/pull/4428) and [Argon2 support](https://github.com/bitwarden/clients/pull/4468). The former was rejected in favor of the latter, and Argon2 will hopefully become the default (only?) choice at some point in future.

Adding a secret key like 1Password would have been another option to address this issue. This suggestion has also been around [since at least 2018](https://community.bitwarden.com/t/add-optional-secret-key-functionality-like-1password-or-keyfile-like-keepass/576) and accumulated a considerable amount of votes, but so far it hasn’t been implemented either.

On the bright side, Bitwarden [clearly states](https://bitwarden.com/help/vault-data/) that they encrypt all your vault data, including website addresses. So unlike with LastPass, any data lifted from Bitwarden servers will in fact be useless until the attackers manage to decrypt it.

## How server-side iterations could have been designed

In case you are wondering whether it is even possible to implement server-side iterations mechanism correctly: yes, it is. One example is the [onepw protocol](https://github.com/mozilla/fxa-auth-server/wiki/onepw-protocol) Mozilla introduced for Firefox Sync in 2014. While the description is fairly complicated, the important part is: the password hash received by the server is not used for anything before it passes through additional scrypt hashing.

Firefox Sync has a different flaw: its client-side password hashing [uses merely 1,000 PBKDF2 iterations](/2018/03/13/can-chrome-sync-or-firefox-sync-be-trusted-with-sensitive-data/#firefox-sync), a ridiculously low setting. So if someone compromises the production servers rather than merely the stored data, they will be able to intercept password hashes that are barely protected. The [corresponding bug report](https://bugzilla.mozilla.org/show_bug.cgi?id=1320222) has been open for the past six years and is still unresolved.

The same attack scenario is an issue for Bitwarden as well. Even if you configure your account with 1,000,000 iterations, a compromised Bitwarden server can always tell the client to apply merely 5,000 PBKDF2 iterations to the master password before sending it to the server. The client has to rely on the server to tell it the correct value, and as long as low settings like 5,000 iterations are supported this issue will remain.