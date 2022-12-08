---
title: "Common pitfalls of breaking up HTTPS connections"
date: 2022-12-08T15:18:23+0100
description: "HTTPS proxies (antivirus, company network proxies) breaking up end-to-end-encrypted connections typically introduce a number of privacy and/or security issues. This article explains some common ones."
categories:
- security
- privacy
- antivirus
---

Let me say it up front: breaking up end-to-end-encrypted HTTPS connections is bad. No matter why you think that you need to inspect and/or modify the contents of an HTTPS connection, please consider not doing it. And if you still think that you absolutely need it, please sit down and consider again just *not* doing it.

Unfortunately, I know that way too often this advice won’t be followed. And I don’t mean tools like the Burp Suite which only break up end-to-end-encryption of HTTPS connections temporarily to aid developers or security researchers. No, it’s rather the antivirus applications which do it because they want to scan all your traffic for potential threats. Or companies which do it because they want to see everything happening on their network.

{{< img src="wiretap.png" alt="Client laptop on the left, web server on the right. Between them a line with arrows on both sides labeled “encrypted communication.” A red server is pictured in the middle with a stethoscope, listening into the encrypted communication." width="600">}}
<em>
  Image credits:
  <a href="https://pixabay.com/vectors/stethoscope-medical-medicine-1712175/" rel="nofollow">LJNovaScotia</a>
</em>
{{< /img >}}

Usually this results in privacy and/or security issues of varying severity. A while ago I already discussed the [shortcomings of Kaspersky’s approach](/2019/08/19/kaspersky-in-the-middle--what-could-possibly-go-wrong/). I later found [a catastrophic issue with Bitdefender’s approach](/2020/06/22/exploiting-bitdefender-antivirus-rce-from-any-website/). And altogether I’ve seen a fair share of typical issues in this area which are really hard to avoid. Let me explain.

{{< toc >}}

## How breaking up HTTPS connections works

HTTPS connections are end-to-end-encrypted. This means that only the client and the legitimate server are supposed to see the contents of their communication but no party inserting themselves into the connection. Here is how is normally works:

1. The server presents an SSL certificate.
2. The client verifies that the SSL certificate is valid for this server and signed by a trusted authority.
3. Server and client do some magic that makes them agree on a common encryption key.
4. Connection contents are now encrypted with that key.

{{< img src="regular.png" alt="Client laptop on the left, web server on the right. First arrow goes from server to client and is labeled “presents certificate.” Second arrow goes both ways and is labeled “common encryption key.” Third arrow goes both ways and is labeled “encrypted communication.”" width="600" />}}

An essential part of step 3 is that the server needs to know the private key belonging to the certificate. Only then will both sides arrive on the same encryption key.

Under usual circumstances, this is sufficient to make the connection completely opaque to any third parties getting in between. Even if a malicious actor passes along the certificate of the legitimate server, they won’t know the corresponding private key and consequently won’t get the connection’s encryption key. So even if the data is technically passing through them, they won’t be able to decrypt communication contents.

{{< img src="pitm.png" alt="Client laptop on the left, web server on the right, red server (proxy) in the middle. First arrow goes from server to proxy and is labeled “presents certificate.” The arrow then continues from the proxy to client with the label “passes along certificate.” Second arrow goes from client to server and back bypassing proxy, it is labeled “common encryption key.” Third arrow also goes from client to server and back bypassing proxy, it is labeled “encrypted communication.”" width="600" />}}

As long as the private key of the legitimate server isn’t compromised, the attacker won’t be able to make its certificate useful. Which means that they need to create their own certificate. And that one should normally be rejected in step 2 because it isn’t signed by a trusted authority.

But we aren’t talking about your regular malicious actor. We are talking about a legitimate application on the user’s computer or about one’s employer. And these solve the issue by adding their own trusted authority to user’s computer.

Now they can use that trusted authority to create their own valid SSL certificate for any connection. So rather than establishing an encrypted communication channel with the legitimate server, the client will establish one with an HTTPS proxy that is either running on their machine or on the employer’s network. And that HTTPS proxy can watch and modify the transmitted data before it is passed along.

{{< img src="intercepted.png" alt="Client laptop on the left, web server on the right, red server (proxy) in the middle. First arrow goes from server to proxy and is labeled “presents certificate.” The arrow then continues from the proxy to client with the label presents own certificate.” Second arrow between client and proxy goes both ways, it is labeled “common encryption key.” There is an identical arrow between proxy and server. Third arrow between client and proxy also goes both ways, it is labeled “encrypted communication.” Here as well there is an identical arrow between proxy and server." width="600" />}}

While this approach works in principle, it is way more complicated to implement correctly than people usually realize. Some potential issues are largely obvious, others are not.

## The trouble with that certificate authority

The very first and most obvious issue: there is now one more trusted authority. And that isn’t a small deal. Each and every certificate authority has, in case of a compromise, the potential of completely undermining end-to-end-encryption of HTTPS connections.

That’s why Mozilla for example created a [long list of rules](https://www.mozilla.org/en-US/about/governance/policies/security-group/certs/policy/) that certificate authorities have to follow in order to be considered trusted. These rules mandate how the private key of the certificate authority is to be kept secure, who and how should have access to it, how often external audits have to be performed and so on.

{{< img src="mozilla_rules.png" alt="Screenshot of the Mozilla website. Text: 3.1 Audits. Before being included and at least annually thereafter, CA operators MUST obtain certain audits for their root certificates and all intermediate certificates that are technically capable of issuing working server or email certificates. This section describes the requirements for those audits. 3.1.1 Audit Criteria. We consider the criteria for CA operations published in the following documents to be acceptable:" width="696" />}}

You’ve decided to add your own certificate authority to all computers of a network? Congratulations, now you have to worry about keeping the corresponding private key in a secured place, ideally on a hardware security module with restricted physical access. And you have to worry about making sure that the system can only be used to issue SSL certificates for the legitimate use case. Good luck with that.

Things are less gloomy with local HTTPS proxies like antivirus applications. These can keep the private key on the user’s machine and merely have to make sure that it isn’t accessible without administrator privileges.

Oh, and they also have to make sure that each application instance generates its own unique certificate authority. Sharing the private key between multiple or even all installations of the application is a huge no-go, the private key can no longer be considered a secret then.

## TLS is a moving target

The communication protocol underlying HTTPS is Transport Layer Security (TLS). And it isn’t something set in stone but rather under continuous development. Current version is TLS 1.3.

For anybody implementing an HTTPS proxy this presents two issues. On the one hand, your proxy needs to properly support the most recent TLS version. Otherwise users won’t get the usability and privacy improvements of that version.

On the other hand, browsers disable outdated TLS versions regularly. Chances are that an HTTPS proxy still supports TLS 1.0 and 1.1 which [browsers already disabled](https://hacks.mozilla.org/2020/02/its-the-boot-for-tls-1-0-and-tls-1-1/). And that’s a bad idea. It could open users to attacks that are only viable against these outdated protocol versions.

{{< img src="mozilla_tls.png" alt="Screenshot of the Mozilla website. Text: The need for a new version of the protocol was born out of a desire to improve efficiency and to remedy the flaws and weaknesses present in earlier versions, specifically in TLS 1.0 and TLS 1.1. See the BEAST, CRIME and POODLE attacks, for example. With limited support for newer, more robust cryptographic primitives and cipher suites, it doesn’t look good for TLS 1.0 and TLS 1.1. With the safer TLS 1.2 and TLS 1.3 at our disposal to adequately project web traffic, it’s time to move the TLS ecosystem into a new era, namely one which doesn’t support weak versions of TLS by default. This has been the abiding sentiment of browser vendors – Mozilla, Google, Apple and Microsoft have committed to disabling TLS 1.0 and TLS 1.1 as default options for secure connections." width="602" />}}

But protocol versions are only part of the story. Even without any protocol changes, it is a bad idea to take a particular OpenSSL library version and keep using it for years. That’s because TLS is complicated, implementation issues are being found and fixed continuously.

To address this among other things, Mozilla and Google release new major versions of their browsers every six weeks. Sometimes there are unscheduled additional releases to address urgent security issues. Modern browsers also have very efficient update distribution mechanisms to help bring these updates to the users ASAP.

Is that HTTPS proxy vendor similarly dedicated to staying on top of these TLS implementation issues? They rarely are…

## Handling errors is tricky

With an HTTPS proxy in the middle, the client no longer has a connection to the server. The connection to the server is handled entirely by the proxy. So if anything goes wrong with that connection, it’s up to the proxy to recognize it and to inform the client.

As a first consequence, the proxy is now responsible for recognizing invalid server certificates. It will hopefully reject certificates issued for the wrong server name. What about outdated certificates? Or certificates signed by an authority that’s not trusted?

How does it even determine which authorities are trusted? There is no fixed list. Mozilla, Google, Apple, Microsoft all maintain their own lists. These also have the tendency to change over time. So if one of these lists is bundled with the application, does it receive regular updates?

Ok, there was an error and the client needs to be made aware of it. Typically, HTTPS proxies will produce an error page as a fake server response. Meaning: as far as other server pages are concerned, this error page is first-party content and can be accessed in the browser.

{{< img src="certwarning_kaspersky.png" alt="A Kaspersky error page titled “Connection not protected.” The location bar shows “https://93.184.216.34”." width="750" />}}

My Kaspersky and Bitdefender exploits involved a server that would first produce a valid response with a malicious page. Then this page triggered another request which would result in a certificate error. This allowed the malicious page to read the contents of the error page.

The security tokens within the error page included persistent user identifiers (Kaspersky), allowed overriding any SSL errors for any website (Kaspersky) or even facilitated executing arbitrary code on the user’s machine (Bitdefender). It’s generally a good idea that error pages aren’t served as first-party content but rather appear to come from another domain like `https://error.invalid/`.

The wording of the error page is also crucial for the user to decide on the right course of action. Browser vendors had decades to perfect it. Vendors implementing HTTPS proxies instead tend to confront users with technicalities that they usually won’t understand.

Yes, browsers intentionally make it hard to override the error and access the page nevertheless. But that’s not the only reason why they require two clicks to add an exception for an invalid certificate. The other reason are [clickjacking attacks](https://en.wikipedia.org/wiki/Clickjacking).

That “I understand the risks” link in Kaspersky’s error page above? Malicious pages can trick users into clicking it by loading the error page in a hidden frame and moving it around so that it is always placed right under the mouse cursor. When the user clicks [they will inadvertently override a certificate warning](/2019/08/19/kaspersky-in-the-middle--what-could-possibly-go-wrong/#using-clickjacking-to-override-certificate-warnings). This kind of attack won’t work if the user needs to click two different areas of the page.

## All the other “tiny” things implemented by browsers

But you know what? Browsers sometimes won’t even offer you a choice to override a certificate error. That’s because of a security mechanism called [HTTP Strict Transport Security (HSTS)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security). If a website uses HSTS, an invalid certificate always means: “something is badly wrong, get out of here ASAP.”

{{< img src="mozilla_certerror.png" alt="Error page titled “Do Not Connect: Potential Security Issue.” Explanation text contains the phrase “there is nothing you can do to resolve the issue.”" width="688" />}}

And browsers respect that. HTTPS proxies? Usually not so much. Recognizing HSTS headers, keeping around a list of HSTS sites, handling expiration correctly, it isn’t all that easy.

Browsers might also implement other security mechanisms on top of TLS. For a while, browsers used to support [HTTP Public Key Pinning](https://en.wikipedia.org/wiki/HTTP_Public_Key_Pinning) until this mechanism was deemed too complicated and too dangerous. Other mechanisms might come to replace it in future. Will HTTPS proxies implement them?

## Conclusion

For browser vendors providing the most secure HTTPS experience possible is a priority. So they invest significant resources into it, and that’s in fact necessary. Supporting HTTPS properly is far from being a simple task, and continuous changes are required.

Vendors implementing HTTPS proxies often have neither the know-how nor the incentives to ensure the same quality in their implementations. While their solutions appear to work, they tend to degrade the security and privacy level and to undermine the work done by browser vendors.