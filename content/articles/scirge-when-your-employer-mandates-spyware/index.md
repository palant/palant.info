---
title: "Scirge: When your employer mandates spyware"
date: 2022-10-06T13:57:43+0200
description: Scirge browser extension allows employers to spy on their employees. To make matters worse, it obfuscates data transmissions.
lastmod: 2022-12-07T11:09:00+0100
categories:
- add-ons
- privacy
---

I recently noticed Scirge advertising itself to corporations, promising to “solve” data leaks. Reason enough to take a look into how they do it. Turns out: by pushing a browser extension to all company employees which could be misused as spyware. Worse yet, it obfuscates data streams, making sure that employees cannot see what data is being collected. But of course we know that no employer would ever abuse functionality like that, right?

**Edit** (2022-12-07): Turns out, Scirge always logs all the relevant decisions. So opening Developer Console on the extension’s background page is sufficient to see what is being collected and sent to the server, despite the transmitted data being obfuscated.

{{< img src="scirge.png" width="600" alt="A pair of daemonic eyes on top of the Scirge logo" >}}
<em>
  Image credits:
  Scirge,
  <a href="https://openclipart.org/detail/84697/eyes-by-netalloy" rel="nofollow">netalloy</a>
</em>
{{< /img >}}

{{< toc >}}

## How it works

There is no point searching for Scirge in any of the extension stores, you won’t find it there. Each company is provided with their individual build of the Scirge extension, configured with the company’s individual Scirge backend. The extension is then supposed to be deployed “automatically using central management tools such as Active Directory Group Policy” (see [documentation](https://docs.scirge.com/user-guide/#/?id=deployment)).

This means that there are no independent user counts available, impossible to tell how widely this extension is deployed. But given any Scirge server, inspecting extension source code is still possible: documentation indicates that the Firefox extension is accessible under `/extension/firefox/scirge.xpi` and the Chrome one under `/extension/chrome/scirge.crx`.

The stated goal of the browser extension is to look over your shoulder, recording where you log in and what credentials you use. The idea is recognizing “Shadow IT,” essential parts of the company infrastructure which the management isn’t aware of. And you would never use your work computer for private stuff anyway, right?

## What it can do

The browser extension downloads its policy rules from the (company-managed) Scirge server. One part of this policy are awareness messages. These are triggered by conditions like weak or autofilled passwords. Possible actions are an alert message, an HTML message injected into the page or a redirect to some address. This part of the functionality is mostly unproblematic: only few possible trigger conditions, HTML code is passed through DOMPurify, redirects can only go to HTTP or HTTPS addresses.

The website policies are more of an issue. These policies can match single pages, entire domains or use regular expressions to cover the entire internet. And on matching websites all your login credentials can be sent to the Scirge server along with the full address of the page and additional metadata.

If server admins activate the “Collect password hashes for password hygiene checks (only secure hash is stored)” setting, the password itself and not merely password complexity data will be sent to the server. To quote [Scirge documentation](https://docs.scirge.com/user-guide/#/?id=policies):

> If enabled, passwords will be hashed on the endpoints and sent back to the Central Server (in double encrypted channel).
> …
> This is useful for private password reuse monitoring.

And the main product page chimes in:

{{< img src="hashing.png" width="557" alt="only industry standard secure hashes are stored at the Central Server database, so password reuse, password sharing, or the use of already breached passwords can become visible to your security departments." />}}

## SHA-1 as “industry standard secure hash”

Yes, passwords are indeed hashed before being sent to the server. Yet what Scirge describes as “industry standard secure hashes” is actually the SHA-1 hashing algorithm. Let that sink in.

First of all, SHA-1 is [considered cryptographically broken](https://www.schneier.com/blog/archives/2005/08/new_cryptanalyt.html). But that doesn’t matter here, already because the SHA hashing algorithms were never meant to be used with passwords in the first place. They are way too easy to reverse, see for example [this article](https://blog.cynosureprime.com/2017/08/320-million-hashes-exposed.html):

> Out of the roughly 320 million hashes, we were able to recover all but 116 of the SHA-1 hashes, a roughly 99.9999% success rate.

That was five years ago, today’s hardware is again more capable. It can be assumed that the security level of storing SHA-1 hashes is barely above storing passwords as plain text.

For storing passwords on a server securely, the baseline are the [PBKDF2](https://en.wikipedia.org/wiki/PBKDF2) and [bcrypt](https://en.wikipedia.org/wiki/Bcrypt) hashing algorithms. These also offer too little protection given modern hardware, which is why new applications should use memory-intensive algorithms like [scrypt](https://en.wikipedia.org/wiki/Scrypt) or [Argon2](https://en.wikipedia.org/wiki/Argon2). But any of these algorithms offers orders of magnitude more protection than SHA-1.

Never mind the fact that each password needs to be hashed with a unique salt. Otherwise the computational effort of reversing all passwords stored in the database will be the same as the effort of reversing merely one of them. But unique salts are incompatible with the goal of checking for password reuse. So at the very least Scirge could introduce per-user salts.

****Edit** (2022-12-07): Scirge explained that they do not actually store SHA-1 hashes on the server but apply bcrypt additionally. In order to compare the newly received SHA-1 hash to the existing hashed passwords, they currently apply bcrypt repeatedly. So unless there is additional logging of SHA-1 hashes when these are received by the server, this setup is reasonably safe. Proper client-side hashing would still provide better privacy.

## “Double encrypted channel” as obfuscation

All of this would be less problematic if employees could inspect the policies or the data being sent to the server. But the system doesn’t allow for such transparency. To quote [Scirge documentation](https://docs.scirge.com/user-guide/#/?id=encryption) once again:

> The Endpoint Browser Extensions communicates via secure HTTPS protocol ensuring that the communication is encrypted.
> 
> To make this even more secure, Scirge uses authenticated encryption for the Endpoint Browser Extension and the Central Server communication. Using public-key authenticated encryption, the Central Server encrypts its message specifically for the endpoint, using the given endpoint's public key.

So the communication with the Scirge server uses TLS *and* a second encryption system based on the same principles. This sounds pretty pointless. An attacker capable of breaking up TLS connections will be able to do the same with Scirge’s custom encryption scheme.

What this does achieve: looking at the extension communication with the browser’s built-in Developer Tools won’t give you anything. You will be able to see beyond the TLS encryption, getting the data before/after the custom encryption scheme is applied requires considerably more skill however. Most employees won’t be able to do it.

And so most people who got this browser extension forced onto them by their employer are out of luck: they won’t be able to verify what it is being used for and what data it actually collects. I’m certain many employers approve.

**Edit** (2022-12-07): As mentioned above, this statement turned out to be wrong. The data collected is logged to the Developer Console prior to encryption and can be viewed there.