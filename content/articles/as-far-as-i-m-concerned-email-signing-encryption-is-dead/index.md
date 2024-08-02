---
categories:
- security
- privacy
- email
date: '2018-11-12 13:08:27'
description: I'm giving up on email signing and encryption, waiting for further adoption
  is just naive.
lastmod: '2020-02-17 17:50:58'
slug: as-far-as-i-m-concerned-email-signing-encryption-is-dead
title: As far as I'm concerned, email signing/encryption is dead
---

It’s this time of year again, sending emails from Thunderbird fails with an error message:

{{< img "expired_cert.png" "Expired certificate message in Thunderbird" />}}

The certificates I use to sign my emails have expired. So I once again need to go through the process of getting replacements. Or I could just give up on email signing and encryption. Right now, I am leaning towards the latter.

{{< toc >}}

## Why did I do it in the first place?

A while back, I used to communicate a lot with users of my popular open source project. So it made sense to sign emails and let people verify – it’s really me writing. It also gave people a way to encrypt their communication with me.

The decision in favor of S/MIME rather than PGP wasn’t because of any technical advantage. The support for S/MIME is simply built into many email clients by default, so the chances that the other side would be able to recognize the signature were higher.

## How did this work out?

In reality, I had a number of confused users asking about that “attachment” I sent them. What were they supposed to do with this smime.p7s file?

Over the years, I received mails from more than 7000 email addresses. Only 72 signed their emails with S/MIME, 52 used PGP to sign. I only exchanged encrypted mails with one person.

## What’s the point of email signing?

The trouble is, signing mails is barely worth it. If somebody receives an unsigned mail, they won’t go out of their way to verify the sender. Most likely, they won’t even notice, because humans are notoriously bad at recognizing the *absence* of something. But even if they do, unsigned is what mails usually look like.

Add to this that the majority of mail users are using webmail now. So their email clients have no support for either S/MIME or PGP. Nor is it realistic to add this support without introducing a trusted component such as a browser extension. But with people who didn’t want to install a dedicated email client, how likely are they to install this browser extension even if a trustworthy solution existed?

Expecting end users to take care of sender verification just isn’t realistic. Instead, approaches like [SPF](https://en.wikipedia.org/wiki/Sender_Policy_Framework) or [DKIM](https://en.wikipedia.org/wiki/DomainKeys_Identified_Mail) emerged. While these aren’t perfect and expect you to trust your mail provider, fake sender addresses are largely a solved issue now.

## Wouldn’t end-to-end encryption be great?

Now we know of course about state-level actors spying on the internet traffic, at least [since 2013 there is no denying](https://en.wikipedia.org/wiki/Global_surveillance_disclosures_%282013%E2%80%93present%29). So there has been tremendous success in deprecating unencrypted HTTP traffic. Shouldn’t the same be done for emails?

Sure, but I just don’t see it happen by means of individual certificates. Even the tech crowd is struggling when it comes to mobile email usage. As to the rest of the world, good luck explaining them why they need to jump through so many hoops, starting with why webmail is a bad choice. In fact, we considered rolling out email encryption throughout a single company and had to give up. The setup was simply too complicated and limited the possible use cases too much.

So encrypting email traffic is now done by enabling SSL in all those mail relays. Not really end-to-end encryption, with the mail text visible on each of those relays. Not entirely safe either, as long as the unencrypted fallback still exists – an attacker listening in the middle can always force the mail servers to fall back to an unencrypted connection. But at least passive eavesdroppers will be dealt with.

## But what if S/MIME or PGP adoption increases to 90% of the population?

Good luck with that. As much as I would love to live in this perfect world, I just don’t see it happen. It’s all a symptom of the fact that security is bolted on top of email. I’m afraid, if we really want end-to-end encryption we’ll need an entirely different protocol. Most importantly, secure transmissions should be the default rather than an individual choice. And then we’ll only have to validate the approach and make sure it’s not a [complete failure](/2018/07/11/ftapi-secutransfer-the-secure-alternative-to-emails-not-quite).
