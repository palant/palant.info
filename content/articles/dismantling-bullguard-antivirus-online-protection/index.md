---
title: "Dismantling BullGuard Antivirus' online protection"
date: 2020-07-06T15:02:58+02:00
description: BullGuard Secure Browser contained multiple XSS vulnerabilities. Additionally, a vulnerability in BullGuard Antivirus rendered protection against malicious websites ineffective.
categories:
  - security
  - bullguard
  - antivirus
---

Just like so many other antivirus applications, BullGuard antivirus promises to protect you online. This protection consists of the three classic components: protection against malicious websites, marking of malicious search results and BullGuard Secure Browser for your special web surfing needs. As so often, this functionality comes with issues of its own, some being unusually obvious.

{{< img src="bullguard.png" width="600" alt="Chihuahua looking into a mirror and seeing a bulldog (BullGuard logo) there" >}}
<em>
  Image credits:
  <a href="https://www.bullguard.com/" rel="nofollow">BullGuard</a>,
  <a href="https://pixabay.com/illustrations/dog-doggy-puppy-animals-animal-3863670/" rel="nofollow">kasiagrafik</a>,
  <a href="https://openclipart.org/detail/316651/body-dysmorphia-by-conmongt" rel="nofollow">GDJ</a>,
  <a href="https://openclipart.org/detail/31807/three-legged-stool-outline-by-rygle" rel="nofollow">rygle</a>
</em>
{{< /img >}}

{{< toc >}}

## Summary of the findings

The first and very obvious issue was found in the protection against malicious websites. While this functionality [often cannot be relied upon](https://palant.info/2019/12/02/rendering-mcafee-web-protection-ineffective/), circumventing it typically requires some effort. Not so with BullGuard Antivirus: merely adding a hardcoded character sequence to the address would make BullGuard ignore a malicious domain.

Further issues affected BullGuard Secure Browsers: multiple [Cross-Site Scripting (XSS)](https://en.wikipedia.org/wiki/Cross-site_scripting) vulnerabilities in its user interface potentially allowed websites to spy on the user or crash the browser. The crash might be exploitable for [Remote Code Execution (RCE)](https://en.wikipedia.org/wiki/Arbitrary_code_execution). Proper [defense in depth](https://en.wikipedia.org/wiki/Defense_in_depth_%28computing%29) prevented worse here.

## Online protection approach

BullGuard Antivirus listens in on all connections made by your computer. For some of these connections it will get between the server and the browser in order to manipulate server responses. That's especially the case for malicious websites of course, but the server response for search pages will also be manipulated in order to indicate which search results are supposed to be trustworthy.

{{< img src="popup.png" width="592" alt="'Link safe' message showing next to Yahoo! link on Google Search" />}}

To implement this pop-up, the developers used an interesting trick: connections to port 3220 will always be redirected to the antivirus application, no matter which domain. So navigating to `http://www.yahoo.com:3220/html?eWFob28uY29t` will yield the following response:

{{< img src="popup-standalone.png" width="526" alt="'Link safe' message showing up under the address http://www.yahoo.com:3220/html?eWFob28uY29t" />}}

This approach is quite dangerous, a vulnerability in the content served up here will be exploitable in the context of any domain on the web. I've [seen such Universal XSS vulnerabilities before](/2019/08/19/kaspersky-in-the-middle-what-could-possibly-go-wrong/#using-injected-content-for-universal-xss). In case of BullGuard, none of the content served appears to be vulnerable however. It would still be a good idea to avoid the unnecessary risk: the server could respond to `http://localhost:3220/` only and use [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) appropriately.

## Unblocking malicious websites

To be honest, I couldn't find a malicious website that BullGuard Antivirus would block. So I cheated and added `malware.wicar.org` to the block list in application's settings. Navigating to the site now resulted in a redirect to bullguard.com:

{{< img src="warning.png" width="762" alt="Warning page originating at safebrowsing.bullguard.com indicating that malware.wicar.org is blocked" />}}

If you click "More details" you will see a link labeled "Continue to website. NOT RECOMMENDED" at the bottom. So far so good, making overriding the warning complicated and discouraged is sane user interface design. But how does that link work?

Each antivirus application came up with its own individual answer to this question. Some answers turned out more secure than others, but BullGuard's is still rather unique. The warning page will send you to `https://malware.wicar.org/?gid=13fd117f-bb07-436e-85bb-f8a3abbd6ad6` and this `gid` parameter will tell BullGuard Antivirus to unblock `malware.wicar.org` for the current session. Where does its value come from? It's hardcoded in `BullGuardFiltering.exe`. Yes, it's exactly the same value for any website and any BullGuard install.

So if someone were to run a malicious email campaign and they were concerned about BullGuard blocking the link to `https://malicious.example.com/` -- no problem, changing the link into `https://malicious.example.com/?gid=13fd117f-bb07-436e-85bb-f8a3abbd6ad6` would disable antivirus protection.

Current BullGuard Antivirus release uses a `hid` parameter with a value dependent on website and current session. So neither predicting its value nor reusing a value from one website to unblock another should work any more.

## XSSing the secure browser

Unlike some other antivirus solutions, BullGuard doesn't market their BullGuard Secure Browser as an online banking browser. Instead, they seem to suggest that it is good enough for everyday use -- if you can live with horrible user experience that is. It's a Chromium-based browser which "protects you from vulnerable and malicious browser extensions" by not supporting any browser extensions.

Unlike Chromium's, this browser's user interface is a collection of various web pages. For example, `secure://address_bar.html` is the location bar and `secure://find_in_page.html` the find bar. All pages rely heavily on [HTML manipulation via jQuery](/2020/03/02/psa-jquery-is-bad-for-the-security-of-your-project/), so you are probably not surprised that there are cross-site scripting vulnerabilities here.


### Vulnerability in the location bar

The code displaying search suggestions when you type something into the location bar went like this:

{{< highlight js >}}
else if (vecFields[i].type == 3) {
    var string_search = BG_TRANSLATE_String('secure_addressbar_search');
    // type is search with Google
    strHtml += '><img src="' + vecFields[i].icon +
        '" alt="favicon" class="address_drop_favicon"/> ' +
        '<p class="address_drop_text"><span class="address_search_terms">' +
        vecFields[i].title + '</span><span class="address_search_provider"> - ' +
        string_search + '</span></p>';
}
{{< /highlight >}}

No escaping performed here, so if you type something like `<img src=x onerror=alert(document.location)>` into the location bar, you will get JavaScript code executing in the context of `secure://address_bar.html`. Not only will the code stay there for the duration of the current browser session, it will be able to spy on location bar changes. Ironically, [BullGuard's announcement](https://www.bullguard.com/blog/2019/09/bullguard-new-secure-browser-stops-cyber-attacks-dead-and-keeps-you-safe-when-making-purchases-online) claims that their browser protects against man-in-the browser attacks which is exactly what this is.

You think that no user would be stupid enough to copy untrusted code into the location bar, right? But regular users have no reason to expect the world to explode simply because they typed in something. That's why no modern browser allows typing in `javascript:` addresses any more. And `javascript:` addresses are far less problematic than the attack depicted here.

### Vulnerability in the display of blocked popups

The address bar issue isn't the only or even the most problematic XSS vulnerability. The page `secure://blocked-popups.html` runs the following code:

{{< highlight js >}}
var li = $('<li/>')
    .addClass('bg_blocked_popups-item')
    .attr('onclick', 'jsOpenPopup(\''+ list[i] + '\', '+ i + ');')
    .appendTo(cList);
{{< /highlight >}}

No escaping performed here either, so a malicious website only needs to use single quotation marks in the pop-up address:

{{< highlight js >}}
window.open(`/document/download.pdf#'+alert(location.href)+'`, "_blank");
{{< /highlight >}}

That's it, the browser will now indicate a blocked pop-up.

{{< img src="blocked.png" width="279" alt="'Pop-ups blocked' message displayed in location bar" />}}

And if the user clicks this message, a message will appear indicating that arbitrary JavaScript code is running in the context of `secure://blocked-popups.html` now. That code can for example call `window.bgOpenPopup()` which allows it to open arbitrary URLs, even
`data:` URLs that normally cannot be opened by websites. It could even open an ad page every few minutes, and the only way to get rid of it would be restarting the browser.

But the purpose of `window.bgOpenPopup()` function isn't merely allowing the pop-up, it also removes a blocked pop-up from the list. By position, without any checks to ensure that the index is valid. So calling `window.bgOpenPopup("...", 100000)` will crash the browser -- this is an access violation. Use a smaller index and the operation will "succeed," corrupting memory and probably allowing remote code execution.

And finally, this vulnerability allows calling `window.bgOnElementRectMeasured()` function, setting the size of this pop-up to an arbitrary value. This allows displaying the pop-up on top of the legitimate browser user interface and display a fake user interface there. In theory, malicious code could conjure up a fake location bar and content area, messing with any website loaded and exfiltrating data. Normally, browsers have visual clues to clearly separate their user interface from the content area, but these would be useless here. Also, it would be comparably easy to make the fake user interface look convincing as this page can access the CSS styles used for the real interface.

### What about all the other API functions?

While the above is quite bad, BullGuard Secure Browser exposes a number of other functions to its user interface. However, it seems that these can only be used by the pages which actually need them. So the blocked pop-ups page cannot use anything other than `window.bgOpenPopup()` and `window.bgOnElementRectMeasured()`. That's proper defense in depth and it prevented worse here.

## Conclusions

BullGuard simply hardcoding security tokens isn't an issue I've seen before. It should be obvious that websites cannot be allowed to disable security features, and yet it seems that the developers somehow didn't consider this attack vector at all.

The other conclusion isn't new but worth repeating: if you build a "secure" product, you should use a foundation that eliminates the most common classes of vulnerabilities. There is no reason why a modern day application should have XSS vulnerabilities in its user interface, and yet it happens all the time.

## Timeline

* 2020-04-09: Started looking for a vulnerability disclosure process on BullGuard website, found none. Asked on Twitter, without success.
* 2020-04-10: Sent an email to `security@` address, bounced. Contacted `mail@` support address asking how vulnerabilities are supposed to be reported.
* 2020-04-10: Response asks for "clarification."
* 2020-04-11: Sent a slightly reformulated question.
* 2020-04-11: Response tells me to contact `feedback@` address with "application-related feedback."
* 2020-04-12: Sent the same inquiry to `feedback@` support address.
* 2020-04-15: Received apology for the "unsatisfactory response" and was told to report the issues via this support ticket.
* 2020-04-15: Sent report about circumventing protection against malicious websites.
* 2020-04-17: Sent report about XSS vulnerabilities in BullGuard Secure Browser (delay due to miscommunication).
* 2020-04-17: Protection circumvention vulnerability confirmed and considered critical.
* 2020-04-23: Told that the HTML attachment (proof of concept for the XSS vulnerability) was rejected by the email system, resent the email with a 7zip-packed attachment.
* 2020-05-04: XSS vulnerabilities confirmed and considered critical.
* 2020-05-18: XSS vulnerabilities fixed in 20.0.378 Hotfix 2.
* 2020-06-29: Protection circumvention vulnerability fixed in 20.0.380 Hotfix 2 (release announcement wrongly talks about "XSS vulnerabilities in Secure Browser" again).
* 2020-06-07: Got reply from the vendor that publishing the details one week before deadline is ok.
