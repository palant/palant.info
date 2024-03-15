---
categories:
- security
date: 2024-03-06T14:27:53+0100
description: Looking into Xunlei Accelerator, I discovered a number of flaws allowing
  remote code execution from websites or local network. It doesn’t look like security
  was considered when designing this application.
lastmod: '2024-03-15 17:37:21'
title: Numerous vulnerabilities in Xunlei Accelerator application
---

Xunlei Accelerator (迅雷客户端) a.k.a. Xunlei Thunder by the China-based Xunlei Ltd. is a wildly popular application. According to the [company’s annual report](https://ir.xunlei.com/static-files/3100b981-4a23-460b-8342-a0446ffff2c4) 51.1 million active users were counted in December 2022. The company’s Google Chrome extension 迅雷下载支持, while not mandatory for using the application, had 28 million users at the time of writing.

{{< img src="screenshot.png" alt="Screenshot of the application’s main window with Chinese text and two advertising blocks" width="577" />}}

I’ve found this application to expose a massive attack surface. This attack surface is largely accessible to arbitrary websites that an application user happens to be visiting. Some of it can also be accessed from other computers in the same network or by attackers with the ability to intercept user’s network connections ([Man-in-the-Middle attack](https://en.wikipedia.org/wiki/Man-in-the-middle_attack)).

It does not appear like security concerns were considered in the design of this application. Extensive internal interfaces were exposed without adequate protection. Some existing security mechanisms were disabled. The application also contains large amounts of third-party code which didn’t appear to receive any security updates whatsoever.

I’ve reported a number of vulnerabilities to Xunlei, most of which allowed remote code execution. Still, given the size of the attack surface it felt like I barely scratched the surface.

Last time Xunlei made security news, it was due to distributing a malicious software component. Back then [it was an inside job](https://news.softpedia.com/news/Company-Admits-Its-Employees-Bundled-Malware-with-Xunlei-Download-Manager-390840.shtml), some employees turned rouge. However, the application’s flaws allowed the same effect to be easily achieved from any website a user of the application happened to be visiting.

{{< toc >}}

## What is Xunlei Accelerator?

Wikipedia lists Xunlei Limited’s main product as a Bittorrent client, and maybe a decade ago it really was. Today however it’s rather difficult to describe what this application does. Is it a download manager? A web browser? A cloud storage service? A multimedia client? A gaming platform? It appears to be all of these things and more.

It’s probably easier to think of Xunlei as an advertising platform. It’s an application with the goal of maximizing profits through displaying advertising and selling subscriptions. As such, it needs to keep the users on the platform for as long as possible. That’s why it tries to implement every piece of functionality the user might need, while not being particularly good at any of it of course.

So there is a classic download manager that will hijack downloads initiated in the browser, with the promise of speeding them up. There is also a rudimentary web browser (two distinctly different web browsers in fact) so that you don’t need to go back to your regular web browser. You can play whatever you are downloading in the built-in media player, and you can upload it to the built-in storage. And did I mention games? Yes, there are games as well, just to keep you occupied.

Altogether this is a collection of numerous applications, built with a wide variety of different technologies, often implementing competing mechanisms for the same goal, yet trying hard to keep the outward appearance of a single application.

## The built-in web browser

### The trouble with custom Chromium-based browsers

Companies love bringing out their own web browsers. The reason is not that their browser is any better than the other 812 browsers already on the market. It’s rather that web browsers can monetize your searches (and, if you are less lucky, also your browsing history) which is a very profitable business.

Obviously, profits from that custom-made browser are higher if the company puts as little effort into maintenance as possible. So they take the open source Chromium, slap their branding on it, maybe also a few half-hearted features, and they call it a day.

Trouble is: a browser has a massive attack surface which is exposed to arbitrary web pages (and ad networks) by definition. Companies like Mozilla or Google invest enormous resources into quickly plugging vulnerabilities and bringing out updates every six weeks. And that custom Chromium-based browser also needs updates every six weeks, or it will expose users to known (and often widely exploited) vulnerabilities.

Even merely keeping up with Chromium development is tough, which is why it almost never happens. In fact, when I looked at the unnamed web browser built into the Xunlei application (internal name: TBC), it was based on Chromium 83.0.4103.106. Being released in May 2020, this particular browser version was already three and a half years old at that point. For reference: Google fixed eight actively exploited zero-day vulnerabilities in Chromium in the year 2023 alone.

Among others, the browser turned out to be vulnerable to CVE-2021-38003. There is [this article](https://medium.com/numen-cyber-labs/from-leaking-thehole-to-chrome-renderer-rce-183dcb6f3078) which explains how this vulnerability allows JavaScript code on any website to gain read/write access to raw memory. I could reproduce this issue in the Xunlei browser.

### Protections disabled

It is hard to tell whether not having a pop-up blocker in this browser was a deliberate choice or merely a consequence of the browser being so basic. Either way, websites are free to open as many tabs as they like. Adding `--autoplay-policy=no-user-gesture-required` command line flag definitely happened intentionally however, turning off video autoplay protections.

It’s also notable that Xunlei revives Flash Player in their browser. Flash Player support has been disabled in all browsers in December 2020, for various reasons including security. Xunlei didn’t merely decide to ignore this reasoning, they shipped Flash Player 29.0.0.140 (released in April 2018) with their browser. Adobe support website [lists numerous Flash Player security fixes](https://helpx.adobe.com/security/security-bulletin.html#flashplayer) published after April 2018 and before end of support.

### Censorship included

Interestingly, Xunlei browser won’t let users visit the `example.com` website (as opposed to `example.net`). When you try, the browser redirects you to a page on `static.xbase.cloud`. This is an asynchronous process, so chances are good that you will catch a glimpse of the original page first.

{{< img src="censorship.png" width="289" alt="Screenshot of a page showing a WiFi symbol with an overlaid question mark and some Chinese text." />}}

Automated translation of the text: “This webpage contains illegal or illegal content and access has been stopped.”

As it turns out, the application will send every website you visit to an endpoint on `api-shoulei-ssl.xunlei.com`. That endpoint will either accept your choice of navigation target or instruct to redirect you to a different address. So when to navigate to `example.com` the following request will be sent:

```
POST /xlppc.blacklist.api/v1/check HTTP/1.1
Content-Length: 29
Content-Type: application/json
Host: api-shoulei-ssl.xunlei.com

{"url":"http://example.com/"}
```

And the server responds with:

```json
{
  "code": 200,
  "msg": "ok",
  "data": {
    "host": "example.com",
    "redirect": "https://static.xbase.cloud/file/2rvk4e3gkdnl7u1kl0k/xappnotfound/#/unreach",
    "result": "reject"
  }
}
```

Interestingly, giving it the address `http://example.com./` (note the trailing dot) will result in the response `{"code":403,"msg":"params error","data":null}`. With the endpoint being unable to handle this address, the browser will allow you to visit it.

### Native API

In an interesting twist, the Xunlei browser exposed `window.native.CallNativeFunction()` method to all web pages. Calls would be forwarded to the main application where any plugin could register its native function handlers. When I checked, there were 179 such handlers registered, though that number might vary depending on the active plugins.

Among the functions exposed were `ShellOpen` (used Windows shell APIs to open a file), `QuerySqlite` (query database containing download tasks), `SetProxy` (configure a proxy server to be used for all downloads) or `GetRecentHistorys` (retrieve browsing history for the Xunlei browser).

My proof-of-concept exploit would run the following code:

```js
native.CallNativeFunction("ShellOpen", "c:\\windows\\system32\\calc.exe");
```

This would open the Windows Calculator, just as you’d expect.

Now this API was never meant to be exposed to all websites but only to a selected few very “trusted” ones. The allowlist here is:

```json
[
  ".xunlei.com",
  "h5-pccloud.onethingpcs.com",
  "h5-pccloud.test.onethingpcs.com",
  "h5-pciaas.onethingpcs.com",
  "h5-pccloud.onethingcloud.com",
  "h5-pccloud-test.onethingcloud.com",
  "h5-pcxl.hiveshared.com"
]
```

And here is how access was being validated:

```js
function isUrlInDomains(url, allowlist, frameUrl) {
  let result = false;
  for (let index = 0; index < allowlist.length; ++index) {
    if (url.includes(allowlist[index]) || frameUrl && frameUrl.includes(allowlist[index])) {
      result = true;
      break;
    }
  }
  return result;
}
```

As you might have noticed, this doesn’t actually validate the host name against the list but looks for substring matches in the entire address. So `https://malicious.com/?www.xunlei.com` is also considered a trusted address, allowing for a trivial circumvention of this “protection.”

### Getting into the Xunlei browser

Now most users hopefully won’t use Xunlei for their regular browsing. These should be safe, right?

Unfortunately not, as there is a number of ways for webpages to open the Xunlei browser. The simplest way is using a special `thunderx://` address. For example, `thunderx://eyJvcHQiOiJ3ZWI6b3BlbiIsInBhcmFtcyI6eyJ1cmwiOiJodHRwczovL2V4YW1wbGUuY29tLyJ9fQ==` will open the Xunlei browser and load `https://example.com/` into it. From the attacker’s point of view, this approach has a downside however: modern browsers ask the user for confirmation before letting external applications handle addresses.

{{< img src="confirmation.png" width="400" alt="Screenshot of a confirmation dialog titled “Open 迅雷?” The text says: “A website wants to open this application.” There are two buttons labeled “Open 迅雷” and “Cancel.”" />}}

There are alternatives however. For example, the Xunlei browser extension (28 million users according to Chrome Web Store) is meant to pass on downloads to the Xunlei application. It could be instrumented into passing on `thunderx://` links without any user interaction however, and these would immediately open arbitrary web pages in the Xunlei browser.

More ways to achieve this are exposed by the XLLite application’s API which is [introduced later](#achieving-code-execution-via-plugin-installation). And that’s likely not even the end of it.

### The fixes

While Xunlei never communicated any resolution of these issues to me, as of Xunlei Accelerator 12.0.8.2392 (built on February 2, 2024 judging by executable signatures) several changes have been implemented. First of all, the application no longer packages Flash Player. It still activates Flash Player if it is installed on the user’s system, so some users will still be exposed. But chances are good that this Flash Player installation will at least be current (as much as software can be “current” three years after being discontinued).

The `isUrlInDomains()` function has been rewritten, and the current logic appears reasonable. It will now only check the allowlist against the end of the hostname, matches elsewhere in the address won’t be accepted. So this now leaves “only” all of the xunlei.com domain with access to the application’s internal APIs. Any [cross-site scripting vulnerability](https://en.wikipedia.org/wiki/Cross-site_scripting) anywhere on this domain will again put users at risk.

The outdated Chromium base appears to remain unchanged. It still reports as Chromium 83.0.4103.106, and the exploit for CVE-2021-38003 still succeeds.

The browser extension 迅雷下载支持 also received an update, version 3.48 on January 3, 2024. According to automated translation, the changelog entry for this version reads: “Fixed some known issues.” The fix appears to be adding a bunch of checks for the [event.isTrusted property](https://developer.mozilla.org/en-US/docs/Web/API/Event/isTrusted), making sure that the extension can no longer be instrumented quite as easily. Given these restrictions, just opening the `thunderx://` address directly likely has higher chances of success now, especially when combined with social engineering.

## The main application

### Outdated Electron framework

The main Xunlei application is based on the [Electron framework](https://en.wikipedia.org/wiki/Electron_(software_framework)). This means that its user interface is written in HTML and displayed via the Chromium web browser (renderer process). And here again it’s somewhat of a concern that the Electron version used is 83.0.4103.122 (released in June 2020). It can be expected to share most of the security vulnerabilities with a similarly old Chromium browser.

Granted, an application like that should be less exposed than a web browser as it won’t just load any website. But it does work with remote websites, so vulnerabilities in the way it handles web content are an issue.

### Cross-site scripting vulnerabilities

Being HTML-based, the Xunlei application is potentially vulnerable to [cross-site scripting vulnerabilities](https://en.wikipedia.org/wiki/Cross-site_scripting). For most part, this is mitigrated by using the React framework. React doesn’t normally work with raw HTML code, so there is no potential for vulnerabilities here.

Well, normally. Unless `dangerouslySetInnerHTML` property is being used, which you should normally avoid. But it appears that Xunlei developers used this property in a few places, and now they have code displaying messages like this:

```js
$createElement("div", {
  staticClass: "xly-dialog-prompt__text",
  domProps: { innerHTML: this._s(this.options.content) }
})
```

If message content ever happens to be some malicious data, it could create HTML elements that will result in execution of arbitrary JavaScript code.

How would malicious data end up here? Easiest way would be [via the browser](#native-api). There is for example the `MessageBoxConfirm` native function that could be called like this:

```js
native.CallNativeFunction("MessageBoxConfirm", JSON.stringify({
  title: "Hi",
  content: `<img src="x" onerror="alert(location.href)">`,
  type: "info",
  okText: "Ok",
  cancelVisible: false
}));
```

When executed on a “trusted” website in the Xunlei browser, this would make the main application display a message and, as a side-effect, run the JavaScript code `alert(location.href)`.

### Impact of executing arbitrary code in the renderer process

Electron normally [sandboxes renderer processes](https://www.electronjs.org/docs/latest/tutorial/sandbox#renderer-processes), making certain that these have only limited privileges and vulnerabilities are harder to exploit. This security mechanism is active in the Xunlei application.

However, Xunlei developers at some point must have considered it rather limiting. After all, their user interface needed to perform lots of operations. And providing a restricted interface for each such operation was too much effort.

So they built a generic interface into the application. By means of messages like `AR_BROWSER_REQUIRE` or `AR_BROWSER_MEMBER_GET`, the renderer process can instruct the main (privileged) process of the application to do just about anything.

My proof-of-concept exploit successfully abused this interface by loading Electron’s [shell module](https://www.electronjs.org/docs/latest/api/shell) (not accessible to sandboxed renderers by regular means) and calling one of its methods. In other words, the Xunlei application managed to render this security boundary completely useless.

### The (lack of) fixes

Looking at Xunlei Accelerator 12.0.8.2392, I could not recognize any improvements in this area. The application is still based on Electron 83.0.4103.122. The number of potential XSS vulnerabilities in the message rendering code didn’t change either.

It appears that Xunlei called it a day after making certain that triggering messages with arbitrary content became more difficult. I doubt that it is impossible however.

## The XLLite application

### Overview of the application

The XLLite application is one of the plugins running within the Xunlei framework. Given that I never created a Xunlei account to see this application in action, my understanding of its intended functionality is limited. Its purpose however appears to be integrating the Xunlei cloud storage into the main application.

As it cannot modify the main application’s user interface directly, it exposes its own user interface as a local web server, on a randomly chosen port between 10500 and 10599. That server essentially provides static files embedded in the application, all functionality is implemented in client-side JavaScript.

Privileged operations are provided by a separate local server running on port 21603. Some of the API calls exposed here are handled by the application directly, others are forwarded to the main application via yet another local server.

I originally got confused about how the web interface accesses the API server, with the latter failing to implement [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) correctly – `OPTION` requests don’t get a correct response, so that only basic requests succeed. It appears that Xunlei developers didn’t manage to resolve this issue and instead resorted to proxying the API server on the user interface server. So any endpoints available on the API server are exposed by the user interface server as well, here correctly (but seemingly unnecessarily) using CORS to allow access from everywhere.

So the communication works like this: the Xunlei application loads `http://127.0.0.1:105xx/` in a frame. The page then requests some API on its own port, e.g. `http://127.0.0.1:105xx/device/now`. When handling the request, the XLLite application requests `http://127.0.0.1:21603/device/now` internally. And the API server handler within the same process responds with the current timestamp.

This approach appears to make little sense. However, it’s my understanding that Xunlei also produces storage appliances which can be installed on the local network. Presumably, these appliances run identical code to expose an API server. This would also explain why the API server is exposed to the network rather than being a localhost-only server.

### The “pan authentication”

With quite a few API calls having the potential to do serious damage or at the very least expose private information, these need to be protected somehow. As mentioned above, Xunlei developers chose not to use CORS to restrict access but rather decided to expose the API to all websites. Instead, they implemented their own “pan authentication” mechanism.

Their approach of generating authentication tokens was taking the current timestamp, concatenating it with a long static string (hardcoded in the application) and hashing the result with MD5. Such tokens would expire after 5 minutes, apparently an attempt to thwart replay attacks.

They even went as far as to perform time synchronization, making sure to correct for deviation between the current time as perceived by the web page (running on the user’s computer) and by the API server (running on the user’s computer). Again, this is something that probably makes sense if the API server can under some circumstances be running elsewhere on the network.

Needless to say that this “authentication” mechanism doesn’t provide any value beyond very basic obfuscation.

### Achieving code execution via plugin installation

There are quite a few interesting API calls exposed here. For example, the `device/v1/xllite/sign` endpoint would sign data with one out of three private RSA keys hardcoded in the application. I don’t know what this functionality is used for, but I sincerely hope that it’s as far away from security and privacy topics as somehow possible.

There is also the `device/v1/call` endpoint which is yet another way to open a page in the Xunlei browser. Both `OnThunderxOpt` and `OpenNewTab` calls allow that, the former taking a `thunderx://` address to be processed and the latter a raw page address to be opened in the browser.

It’s fairly obvious that the API exposes full access to the user’s cloud storage. I chose to focus my attention on the `drive/v1/app/install` endpoint however, which looked like it could do even more damage. This endpoint in fact turned out to be a way to install binary plugins.

I couldn’t find any security mechanisms preventing malicious software to be installed this way, apart from the already mentioned useless “pan authentication.” However, I couldn’t find any actual plugins to use as an example. In the end I figured out that a plugin had to be packaged in an archive containing a `manifest.yaml` file like the following:

```yaml
ID: Exploit
Title: My exploit
Description: This is an exploit
Version: 1.0.0
System:
  - OS: windows
    ARCH: 386
Service:
  ExecStart: Exploit.exe
  ExecStop: Exploit.exe
```

The plugin would install successfully under `Thunder\Profiles\XLLite\plugin\Exploit\1.0.1\Exploit` but the binary wouldn’t execute for some reason. Maybe there is a security mechanism that I missed, or maybe the plugin interface simply isn’t working yet.

Either way, I started thinking: what if instead of making XLLite run my “plugin” I would replace an existing binary? It’s easy enough to produce an archive with file paths like `..\..\..\oops.exe`. However, the [Go package archiver](https://pkg.go.dev/github.com/mholt/archiver) used here has protection against such path traversal attacks.

The XLLite code deciding which folder to put the plugin into didn’t have any such protections on the other hand. The folder is determined by the `ID` and `Version` values of the plugin’s manifest. Messing with the former is inconvenient, it being present twice in the path. But setting the “version” to something like `..\..\..` achieved the desired results.

Two complications:

1. The application to be replaced cannot be running or the Windows file locking mechanism will prevent it from being replaced.
2. The plugin installation will only replace entire folders.

In the end, I chose to replace Xunlei’s media player for my proof of concept. This one usually won’t be running and it’s contained in a folder of its own. It’s also fairly easy to make Xunlei run the media player by using a `thunderx://` link. Behold, installation and execution of a malicious application without any user interaction.

Remember that the API server is exposed to the local network, meaning that any devices on the network can also perform API calls. So this attack could not merely be executed from any website the user happened to be visiting, it could also be launched by someone on the same network, e.g. when the user is connected to a public WiFi.

### The fixes

As of version 3.19.4 of the XLLite plugin (built January 25, 2024 according to its digital signature), the “pan authentication” method changed to use [JSON Web Tokens](https://en.wikipedia.org/wiki/JSON_Web_Token). The authentication token is embedded within the main page of the user interface server. Without any CORS headers being produced for this page, the token cannot be extracted by other web pages.

It wasn’t immediately obvious what secret is being used to generate the token. However, authentication tokens aren’t invalidated if the Xunlei application is restarted. This indicates that the secret isn’t being randomly generated on application startup. The remaining possibilities are: a randomly generated secret stored somewhere on the system (okay) or an obfuscated hardcoded secret in the application (very bad).

While calls to other endpoints succeed after adjusting authentication, calls to the `drive/v1/app/install` endpoint result in a “permission denied” response now. I did not investigate whether the endpoint has been disabled or some additional security mechanism has been added.

## Plugin management

### The oddities

XLLite’s plugin system is actually only one out of at least five completely different plugin management systems in the Xunlei application. One other is the main application’s plugin system, the XLLite application is installed as one such plugin. There are more, and `XLLiveUpdateAgent.dll` is tasked with keeping them updated. It will download the list of plugins from an address like `http://upgrade.xl9.xunlei.com/plugin?os=10.0.22000&pid=21&v=12.0.3.2240&lng=0804` and make sure that the appropriate plugins are installed.

Note the lack of TLS encryption here which is quite typical. Part of the issue appears to be that Xunlei decided to implement their own HTTP client for their downloads. In fact, they’ve implemented a number of different HTTP clients instead of using any of the options available via the Windows API for example. Some of these HTTP clients are so limited that they cannot even parse uncommon server responses, much less support TLS. Others support TLS but use their own list of CA certificates which happens to be Mozilla’s list from 2016 (yes, that’s almost eight years old).

Another common issue is that almost all these various update mechanisms run as part of the regular application process, meaning that they only have user’s privileges. How do they manage to write to the application directory then? Well, Xunlei solved this issue: they made the application directory writable with user’s privileges! Another security mechanism successfully dismantled. And there is a bonus: they can store application data in the same directory rather than resorting to per-user nonsense like AppData.

Altogether, you better don’t run Xunlei Accelerator on untrusted networks (meaning: any of them?). Anyone on your network or anyone who manages to insert themselves into the path between you and the Xunlei update server will be able to manipulate the server response. As a result, the application will install a malicious plugin without you even noticing anything.

You also better don’t run Xunlei Accelerator on a computer that you share with other people. Anyone on a shared computer will be able to add malicious components to the Xunlei application, so next time you run it your user account will be compromised.

### Example scenario: XLServicePlatform

I decided to focus on XLServicePlatform because, unlike all the other plugin management systems, this one runs with system privileges. That’s because it’s a system service and any installed plugins will be loaded as dynamic libraries into this service process. Clearly, injecting a malicious plugin here would result in full system compromise.

The management service downloads the plugin configuration from `http://plugin.pc.xunlei.com/config/XLServicePlatform_12.0.3.xml`. Yes, no TLS encryption here because the “HTTP client” in question isn’t capable of TLS. So anyone on the same WiFi network as you for example could redirect this request and give you a malicious response.

In fact, that HTTP client was rather badly written, and I found multiple Out-of-Bounds Read vulnerabilities despite not actively looking for them. It was fairly easy to crash the service with an unexpected response.

But it wasn’t just that. The XML response was parsed using libexpat 2.1.0. With that version being released more than ten years ago, there are numerous known vulnerabilities, including a number of critical remote code execution vulnerabilities.

I generally leave binary exploitation to other people however. Continuing with the high-level issues, a malicious plugin configuration will result in a DLL or EXE file being downloaded, yet it won’t run. There is a working security mechanism here: these files need a valid code signature issued to Shenzhen Thunder Networking Technologies Ltd.

But it still downloads. And there is our old friend: a path traversal vulnerability. Choosing the file name `..\XLBugReport.exe` for that plugin will overwrite the legitimate bug reporter used by the Xunlei service. And crashing the service with a malicious server response will then run this trojanized bug reporter, with system privileges.

My proof of concept exploit merely created a file in the `C:\Windows` directory, just to demonstrate that it runs with sufficient privileges to do it. But we are talking about complete system compromise here.

### The (lack of?) fixes

At the time of writing, XLServicePlatform still uses its own HTTP client to download plugins which still doesn’t implement TLS support. Server responses are still parsed using libexpat 2.1.0. Presumably, the Out-of-Bounds Read and Path Traversal vulnerabilities have been resolved but verifying that would take more time than I am willing to invest.

The application will still render its directory writable for all users. It will also produce a number of unencrypted HTTP requests, including some that are related to downloading application components.

## Outdated components

I’ve already mentioned the browser being based on an outdated Chromium version, the main application being built on top of an outdated Electron platform and a ten years old XML library being widely used throughout the application. This isn’t by any means the end of it however. The application packages lots of third-party components, and the general approach appears to be that none of them are ever updated.

Take for example the media player XMP a.k.a. Thunder Video which is installed as part of the application and can be started via a `thunderx://` address from any website. This is also an Electron-based application, but it’s based on an even older Electron 59.0.3071.115 (released in June 2017). The playback functionality seems to be based on the APlayer SDK which Xunlei provides for free for other applications to use.

Now you might know that media codecs are extremely complicated pieces of software that are known for disastrous security issues. That’s why web browsers are very careful about which media codecs they include. Yet APlayer SDK features media codecs that have been discontinued more than a decade ago as well as some so ancient that I cannot even figure out who developed them originally. There is FFmpeg 2021-06-30 (likely a snapshot around version 4.4.4), which has [dozens of known vulnerabilities](https://ffmpeg.org/security.html). There is libpng 1.0.56, which was released in July 2011 and is [affected by seven known vulnerabilities](http://www.libpng.org/pub/png/libpng.html). Last but not least, there is zlib 1.2.8-4 which was released in 2015 and is affected by at least two critical vulnerabilities. These are only some examples.

So there is a very real threat that Xunlei users might get compromised via a malicious media file, either because they were tricked into opening it with Xunlei’s video player, or because a website used one of several possible ways to open it automatically.

As of Xunlei Accelerator 12.0.8.2392, I could not notice any updates to these components.

## Reporting the issues

Reporting security vulnerabilities is usually quite an adventure, and the language barrier doesn’t make it any better. So I was pleasantly surprised to discover [XunLei Security Response Center](https://security.xunlei.com/) that was even discoverable via an English-language search thanks to the site heading being translated.

Unfortunately, there was a roadblock: submitting a vulnerability is only possible after logging in via WeChat or QQ. While these social networks are immensely popular in China, creating an account from outside China proved close to impossible. I’ve spent way too much time on verifying that.

That’s when I took a closer look and discovered an email address listed on the page as fallback for people who are unable to log in. So I’ve sent altogether five vulnerability reports on 2023-12-06 and 2023-12-07. The number of reported vulnerabilities was actually higher because the reports typically combined multiple vulnerabilities. The reports mentioned 2024-03-06 as publication deadline.

I received a response a day later, on 2023-12-08:

> Thank you very much for your vulnerability submission. XunLei Security Response Center has received your report. Once we have successfully reproduced the vulnerability, we will be in contact with you.

Just like most companies, they did not actually contact me again. I saw my proof of concept pages being accessed, so I assumed that the issues are being worked on and did not inquire further. Still, on 2024-02-10 I sent a reminder that the publication deadline was only a month away. I do this because in my experience companies will often “forget” about the deadline otherwise (more likely: they assume that I’m not being serious about it).

I received another laconic reply a week later which read:

> XunLei Security Response Center has verified the vulnerabilities, but the vulnerabilities have not been fully repaired.

That was the end of the communication. I don’t really know what Xunlei considers fixed and what they still plan to do. Whatever I could tell about the fixes here has been pieced together from looking at the current software release and might not be entirely correct.

It does not appear that Xunlei released any further updates in the month after this communication. Given the nature of the application with its various plugin systems, I cannot be entirely certain however.