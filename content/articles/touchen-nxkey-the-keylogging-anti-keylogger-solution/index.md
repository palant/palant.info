---
categories:
- korea
- security
- add-ons
date: 2023-01-09T06:36:20+0100
description: TouchEn nxKey is supposed to combat keyloggers. Instead, this application
  made writing a keylogger extremely simple, allowed attacking banking websites and
  more.
lastmod: '2023-01-09 21:02:46'
title: 'TouchEn nxKey: The keylogging anti-keylogger solution'
---

I wrote about [South Korea’s mandatory so-called security applications](/2023/01/02/south-koreas-online-security-dead-end/) a week ago. My journey here started with TouchEn nxKey by RaonSecure which got my attention because the corresponding browser extension has more than 10 million users – the highest number Chrome Web Store will display. The real number of users is likely considerably higher, the software being installed on pretty much any computer in South Korea.

That’s not because people like it so much: they outright hate it, resulting in an average rating of 1,3 out of 5 stars and lots of calls to abolish it. Yet using it is required if you want to do things like online banking in South Korea.

The banks pushing for the software to be installed claim that it improves security. People [call it “malware” and a “keylogger.”](https://www.reddit.com/r/korea/comments/9qwucv/comment/e8ch6yn/) I spent some time analyzing the inner workings of the product and determined the latter to be far closer to the truth. The application indeed contains key logging functionality by design, and it fails to sufficiently restrict access to it. In addition, various bugs range from simple denial of service to facilitating remote code execution. Altogether I reported seven security vulnerabilities in the product.

{{< toc >}}

## The backdrop

After I gave an [overview of South Korea’s situation](/2023/01/02/south-koreas-online-security-dead-end/), people started discussing my article on various Korean websites. [One comment in particular](https://www.clien.net/service/board/news/17827726?c=true#140131396) provided crucial information that I was missing: two news stories from 2005 on the Korea Exchange Bank hacking incident [\[1\]](https://news.kbs.co.kr/news/view.do?ncd=735696) [\[2\]](https://news.kbs.co.kr/news/view.do?ncd=735697). These are light on technical details but let me try to explain how I understand this.

This was apparently a big deal in Korea in 2005. A cybercrime gang managed to steal 50 million Won (around $50,000 at the time) from people’s banking accounts by means of a [Remote Access Trojan](https://www.malwarebytes.com/blog/threats/remote-access-trojan-rat). This way they not only got the user’s login credentials but also information from their security card. From what I can tell, this security card was similar to indexed TANs, a second factor authentication method banished in the European Union in 2012 for the exact reason of being easily compromised by banking trojans.

How did the users’ computers get infected with this malicious application? From the description this sounds like a [drive-by download](https://en.wikipedia.org/wiki/Drive-by_download) when visiting a malicious website with the browser, a browser vulnerability was likely exploited. It’s also possible however that the user was tricked into installing the application. The browser in question isn’t named, but it is certain to be Internet Explorer as South Korea didn’t use anything else at this point.

Now the news stress the point that the user didn’t lose or give away their online banking credentials, they’ve done nothing wrong. The integrity of online banking in general is being questioned, and the bank is criticized for not implementing sufficient security precautions.

In 2005 there have been plenty of stories like this one in other countries as well. While I cannot claim that the issue has been completely eliminated, today it is far less common. On the one hand, web browsers got way more secure. On the other hand, banks have improved their second factor. At least in Europe you usually need a second device to confirm a transaction. And you see the transaction details when confirming, so you won’t accidentally confirm a transfer to a malicious actor.

South Korea chose a different route, the public outrage demanded quick results. The second news story identifies the culprit: a security application could have stopped the attack, but its use wasn’t mandatory. And the bank complies. It promises to deliver an “anti-hacking” application and to make its use mandatory for all users.

So it’s likely not a coincidence that I can find the first mentions of TouchEn Key around 2006/2007. The application claims to protect your sensitive data when you enter data into a web page. Eventually, TouchEn nxKey was developed to support non-Microsoft browsers, and that’s the one I looked into.

## What does TouchEn nxKey actually do?

All the public sources on TouchEn nxKey tell that it is somehow meant to combat keyloggers by encrypting keyboard input. That’s all the technical information I could find. So I had to figure it out on my own.

Websites relying TouchEn nxKey run the nxKey SDK which consists of two parts: a bunch of JavaScript code running on the website and some server-side code. Here is how it works:

1. You enter a password field on a website that uses the nxKey SDK.
2. JavaScript code of the nxKey SDK detects it and notifies your local nxKey application.
3. nxKey application activates its device driver in the Windows kernel.
4. Device driver now intercepts all keyboard input. Instead of having it processed by the system, keyboard input is sent to the nxKey application.
5. The nxKey application encrypts the keyboard input and sends it to the JavaScript code of the nxKey SDK.
6. The JavaScript code puts the encrypted data into a hidden form field. The actual password field receives only dummy text.
7. You finish entering your login credentials and click “Login.”
8. The encrypted keyboard input is sent to the server along with other data.
9. The server-side part of the nxKey SDK decrypts it and retrieves the plain text password from it. Regular login procedure takes over.

So the theory is: a keylogger attempting to record data entered into this website will only see encrypted data. It can see the public key used by the website, but it won’t have the corresponding private key. So no way to decrypt, the password is safe.

Yes, it’s a really nice theory.

## How do websites communicate with TouchEn nxKey?

How does a website even know that a particular application is installed on the computer? And how does it communicate with it?

It appears that there is an ongoing paradigm shift here. Originally, TouchEn nxKey required its browser extension to be installed. That browser extension forwarded requests from the website to the application using [native messaging](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Native_messaging). And it delivered responses back to the webpage.

Yet using browser extensions as intermediate is no longer state of the art. The current approach is for the websites to use [WebSockets API](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) to communicate with the application directly. Browser extensions are no longer required.

{{< img src="website_communication.png" width="691" alt="Website busanbank.co.kr is shown communicating with TouchEn browser extension via touchenex_nativecall(). The extension in turn communicates with application CrossEXChrome via Native Messaging. Website citibank.co.kr on the other hand communicates directly with application CrossEXService via WebSocket on 127.0.0.1:34581." />}}

I’m not sure when exactly this paradigm shift started, but it is far from complete yet. While some websites like Citibank Korea use the new WebSocket approach exclusively, other websites like that of the Busan Bank still run older code which relies exclusively on the browser extensions.

This does not merely mean that users still need to have the browser extension installed. It also explains the frequent complains about the software not being recognized despite being installed. These users got the older version of the software installed, one that does not support WebSocket communication. There is no autoupdate. With some banks still offering these older versions for download, it’s a mistake I made myself originally.

## Abusing TouchEn extension to attack banking websites

The TouchEn browser extension is really tiny, its functionality being minimal. It should be hard to do much wrong here. Yet looking through its code, we see comments like this one:

```js
result = JSON.parse(result);
var cbfunction = result.callback;

var reply = JSON.stringify(result.reply);
var script_str = cbfunction + "(" + reply + ");";
//eval(script_str);
if(typeof window[cbfunction] == 'function')
{
  window[cbfunction](reply);
}
```

So somebody designed a horribly bad (meaning: actually dangerous) way of doing something. Then they either realized that it could be done without `eval()`, or somebody pointed it out to them. Yet rather than removing the bad code, they kept it around just in case. Quite frankly, to me this demonstrates a very bad grasp of JavaScript, security and version control. And maybe it’s just me, but I wouldn’t let this person write code for a security product unsupervised.

Either way, the dangerous `eval()` calls have already been purged from the browser extension. Not so much in the JavaScript part of the nxKey SDK used by banking websites, but these are no concern so far. Still, with the code quality so bad, there are bound to be more issues.

And I found such an issue in the callback mechanism. A website can send a `setcallback` request to the application in order to register for some events. When such events occurs, the application will instruct the extension to call the registered callback function on the page. Essentially, any global function on the page can be called, by name.

Could a malicious webpage register a callback for some other web page then? There are two hurdles:

1. The target webpage needs to have an element with `id="setcallback"`.
2. Callbacks are delivered to a specific tab.

The first hurdle means that primarily only websites using nxKey SDK can be attacked. When communicating via the browser extensions these will create the necessary element. Communication via WebSockets doesn’t create this element, meaning that websites using newer nxKey SDK aren’t affected.

The second hurdle seems to mean that only pages loaded in the current tab can be attacked, e.g. those loaded in a frame. Unless the nxKey application can be tricked into setting a wrong `tabid` value in its response.

And this turned out surprisingly easy. While the application uses a proper JSON parser to process incoming data, the responses are generated by means of calling [sprintf_s()](https://learn.microsoft.com/en-us/cpp/c-runtime-library/reference/sprintf-s-sprintf-s-l-swprintf-s-swprintf-s-l). No escaping is performed. So manipulating some response properties and adding quotation marks to it allows injecting arbitrary JSON properties.

```js
touchenex_nativecall({
  …
  id: 'something","x":"y'
  …
});
```

The `id` property will be copied into the application’s response, meaning that the response suddenly gets a new JSON property called `x`. This vulnerability allows injecting any value for `tabid` into the response.

How does a malicious page know the ID of a banking tab? It could use its own tab ID (which TouchEn extension helpfully exposes) and try guessing other tab IDs. Or it could simply leave this value empty. The extension is being helpful in this case:

```js
tabid = response.response.tabid;
if (tabid == "")
{
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, response, function(res) {});
  });
}
```

So if the `tabid` value is empty it will deliver the message to the currently active tab.

Meaning that one possible attack looks like this:

1. Open a banking website in a new tab, it becoming the active tab.
2. Wait for the page to load, so that the element with `id="setcallback"` is present.
3. Send a `setcallback` message via the TouchEn extension to set a callback to some function, while also overwriting JSON response properties with `"tabid":""` and `"reply":"malicious payload"`.

The first call to the callback occurs immediately. So the callback function will be called in the banking website, with the malicious payload from the `reply` property as parameter.

We are almost there. A possible callback function could be `eval` but there is a final hurdle: TouchEn passes the `reply` property through `JSON.stringify()` before giving it to the callback. So we actually get `eval("\"malicious payload\"")` and this doesn’t do anything.

On the other hand, maybe the target page has jQuery? And calling `$('"<img src=x onerror=alert(\'Hi,_this_is_JavaScript_code_running_on_\'+document.domain)>"')` will produce the expected result:

{{< img src="xss.png" width="458" alt="gbank.busanbank.co.kr says: Hi,_this_is_JavaScript_code_running_on_busanbank.co.kr" />}}

Is expecting jQuery for an attack to succeed cheating? Not quite, the websites using TouchEn nxKey will most likely also use TouchEn Transkey (an on-screen keyboard) as well, and this one relies on jQuery. Altogether, all South Korean banking sites seem heavily dependent on jQuery which is [a bad idea](/2020/03/02/psa-jquery-is-bad-for-the-security-of-your-project/).

But `update_callback`, the designated callback of the nxKey SDK, can also be abused to run arbitrary JavaScript code when passed JSON-stringified data. Calling `update_callback('{"FaqMove":"javascript:alert(\'Hi, this is JavaScript code running on \'+document.domain)"}')` will attempt to redirect to a `javascript:` link and run arbitrary code as a side-effect:

{{< img src="xss2.png" width="455" alt="gbank.busanbank.co.kr says: Hi, this is JavaScript code running on busanbank.co.kr" />}}

So this attack allows a malicious website to compromise any website relying on the TouchEn extension. And none of the “security” applications South Korean banks force users to install detect or prevent this attack.

### Side-note: Browser extensions similar to TouchEn

Back when I started my testing there were two TouchEn extensions in the Chrome Web Store. The less popular but largely identical extension has since been removed.

This isn’t the end of the story however. I found three more almost identical extensions: CrossWeb EX and Smart Manager EX by INISAFE as well as CrossWarpEX by iniLINE. CrossWeb EX is the most popular of those and currently listed with more than 4 million users. These extensions similarly expose websites to attacks.

My first thought was that RaonSecure and INISAFE belong to the same company group. That doesn’t appear to be the case.

But then I saw [this page](http://www.iniline.co.kr/about/about_04.jsp) by the iniLINE software development company:

{{< img src="partners.png" width="873" alt="A web page featuring Initech and RaonSecure logos among others." />}}

This lists Initech and RaonSecure as partners, so it would appear that iniLINE are the developers of these problematic browser extensions. Another interesting detail: the first entry in the “Major customers” line at the top is the Ministry of National Defense. I just hope that their defense work results in better code than what their other partners get…

## Using keylogging functionality from a website

Now let’s say that there is a malicious website. And let’s say that this website tells TouchEn nxKey: “Hi there, the user is on a password field right now, and I want the data they enter.” Will that website get all the keyboard input then?

Yes, it will! It will get whatever the user types, regardless of which browser tab is active right now or whether the browser itself is active at all. The nxKey application simply complies with the request, it won’t check whether it makes any sense at this point. In fact, it will even give websites the administrator password entered into a [User Access Control prompt](https://en.wikipedia.org/wiki/User_Account_Control).

But there certainly are hurdles? Yes, there are. First of all, such a website needs a valid license. It needs to communicate that license in the `get_versions` call prior to using any application functionality:

```js
socket.send(JSON.stringify({
  "tabid": "whatever",
  "init": "get_versions",
  "m": "nxkey",
  "origin": "https://www.example.com",
  "lic": "eyJ2ZXJzaW9uIjoiMS4wIiwiaXNzdWVfZGF0ZSI6IjIwMzAwMTAxMTIwMDAwIiwicHJvdG9jb2xfbmFtZSI6InRvdWNoZW5leCIsInV1aWQiOiIwMTIzNDU2Nzg5YWJjZGVmIiwibGljZW5zZSI6IldlMkVtUDZjajhOUVIvTk81L3VNQXRVd0EwQzB1RXFzRnRsTVQ1Y29FVkJpSTlYdXZCL1VCVVlHWlY2MVBGdnYvVUJlb1N6ZitSY285Q1d6UUZWSFlCcXhOcGxiZDI3Z2d0bFJNOUhETzdzPSJ9"
}));
```

This particular license is only valid for `www.example.com`. So it can only be used by the `www.example.com` website. Or by any other website claiming to be `www.example.com`.

See that `origin` property in the code above? Yes, TouchEn nxKey actually believes that rather than looking at the `Origin` HTTP header. So it is trivial to lift a license from some website using nxKey legitimately and claim to be that website. It’s not even necessary to create a fake license.

Another hurdle: won’t the data received by the malicious website be encrypted? How does one decrypt it? It should be possible to use a different public key, one where the private key is known. Then one would only need to know the algorithm, and then decrypting the data would work.

Except: none of that is necessary. If TouchEn nxKey doesn’t receive any public key at all, it will simply drop the encryption! The website will receive the keyboard input in clear text then.

Behold, my proof of concept page (less than 3 kB with all the HTML boilerplate):

{{< img src="typing_page.png" width="394" alt="Webpage screenshot: Hey, this page knows what you type into other applications! Type in any application and watch the text appear here: I AM TYPING THIS INTO A UAC PROMPT" />}}

There is still a third hurdle, one that considerably reduces the severity of this vulnerability: keyboard input intercepted by a malicious web page no longer reaches its destination. A user is bound to get suspicious when they start typing in a password, yet nothing appears in the text field. My analysis of the nxKey application suggests that it only works this way: the keyboard input reaches either the web page or its actual target, but never both.

## Attacking the application itself

We’ve already established that whoever wrote the JavaScript code of this product wasn’t very proficient at it. But maybe that’s because all their experts have a C++ background? We’ve already [seen this before](/2018/11/30/maximizing-password-manager-attack-surface-leaning-from-kaspersky/), developers trying to leave JavaScript and delegate all tasks to C++ code as soon as possible.

Sadly, this isn’t a suspicion I can confirm. I’m way more used to analyzing JavaScript than binary code, but it seems that the application itself is similarly riddled with issues. In fact, it mostly uses approaches typical to C rather than C++. There is lots of manual memory management here.

I already mentioned their use of `sprintf_s()`. An interesting fact about functions like `sprintf_s()` or `strcpy_s()`: while these are the “memory safe” versions of `sprintf()` or `strcpy()` functions which won’t overflow the buffer, these are still tricky to use. If you fail giving them a sufficiently large buffer, these will invoke the invalid parameter handler. And by default this makes the application crash.

Guess what: nxKey application almost never makes sure the buffer is sufficiently large. And it doesn’t change the default behavior either. So sending it an overly large value will in many cases crash the application. A crash is better than a buffer overflow, but a crashed application can no longer do its job. Typical result: your online banking login form appears to work correctly, but it receives your password as clear text now. You only notice something being wrong when submitting the form results in an error message. This vulnerability allows [Denial-of-Service attacks](https://owasp.org/www-community/attacks/Denial_of_Service).

Another example: out of all JSON parsers, the developers of the nxKey application picked out the one [written in C](https://github.com/json-parser/json-parser/). Not only that, they also took a random repository state from January 2014 and never bothered updating it. That [null pointer dereference fixed in June 2014](https://github.com/json-parser/json-parser/commit/dec8f04414d2b4a754b2309147665ef341c5f90b)? Yeah, still present. So sending `]` (a single closing square bracket) to the application instead of JSON data is sufficient to crash it. Another vulnerability allowing Denial-of-Service attacks.

And that WebSockets server websites connect to? It uses OpenSSL. Which OpenSSL? Actually, OpenSSL 1.0.2c. Yes, I can almost hear the collective sigh of all the security professionals here. OpenSSL 1.0.2c is seven years old. In fact, end of support for the 1.0.2 branch was three years ago: on January 1st, 2020. The last release here was OpenSSL 1.0.2u, meaning 18 more releases fixing bugs and security issues. None of the fixes made it into the nxKey application.

Let’s look at something more interesting than crashes. The application license mentioned above is base64-encoded data. The application needs to decode it. The decoder function looks like this:

```c
size_t base64_decode(char *input, size_t input_len, char **result)
{
  size_t result_len = input_len / 4 * 3;
  if (str[input_len - 1] == '=')
    result_len--;
  if (str[input_len - 2] == '=')
    result_len--;
  *result = malloc(result_len + 1);

  // Decoding input in series of 4 characters here
}
```

I’m not sure where this function comes from. It has clear similarities with the base64 decoder of the CycloneCRYPTO library. But CycloneCRYPTO writes the result into a pre-allocated buffer. So it might be that the buffer allocation logic was added by nxKey developers themselves.

And that logic is flawed. It clearly assumes that `input_len` is a multiple of four. But for input like `abcd==` its calculation will result in a 2 bytes buffer being allocated, despite the actual output being 3 bytes large.

Is a one byte heap overflow exploitable? Yes, it clearly is as this [Project Zero blog post](https://googleprojectzero.blogspot.com/2014/08/the-poisoned-nul-byte-2014-edition.html) or [this article by Javier Jimenez](https://sensepost.com/blog/2017/linux-heap-exploitation-intro-series-the-magicians-cape-1-byte-overflow/) explain. Writing such an exploit is beyond my skill level however.

Instead my proof of concept page merely sent the nxKey application randomly generated license strings. This was sufficient to crash the application in a matter of seconds. Connecting the debugger showed clear evidence of memory corruption: the application crashed because it attempted to read or write data using bogus memory locations. In some cases these memory locations came from the data supplied by my website. So clearly someone with sufficient skill and dedication could have abused that vulnerability for remote code execution.

Modern operating systems have mechanisms to make turning buffer overflows like this one into code execution vulnerabilities harder. But these mechanisms only help if they are actually being used. Yet nxKey developers turned [Address space layout randomization](https://en.wikipedia.org/wiki/Address_space_layout_randomization) off on two DLLs loaded by the application, [Data Execution Prevention](https://learn.microsoft.com/en-us/windows/win32/memory/data-execution-prevention) was turned off on four DLLs.

## Abusing the helper application

So far this was all about web-based attacks. But what about the scenario where a malware application managed it into the system already and is looking for ways to expand its privileges? For an application meant to help combat such malware, TouchEn nxKey does surprisingly badly at keeping its functionality to itself.

There is for example the `CKAgentNXE.exe` helper application starting up whenever nxKey is intercepting keyboard input. Its purpose: when nxKey doesn’t want to handle a key, make sure it is delivered to the right target application. The logic in `TKAppm.dll` library used by the main application looks roughly like this:

```c
if (IsAdmin())
  keybd_event(virtualKey, scanCode, flags, extraInfo);
else
{
  AgentConnector connector;

  // An attempt to open the helper’s IPC objects
  connector.connect();

  if (!connector.connected)
  {
    // Application isn’t running, start it now
    RunApplication("CKAgentNXE.exe");

    while (!connector.connected)
    {
      Sleep(10);
      connector.connect();
    }
  }

  // Some IPC dance involving a mutex, shared memory and events
  connector.sendData(2, virtualKey, scanCode, flags, extraInfo);
}
```

Since the nxKey application is running with user’s privileges, it will fall back to running `CKAgentNXE.exe` in every sensible setup. And that helper application, upon receiving command code 2, will call [SendInput()](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-sendinput).

It took me a while to get an idea of what the reason for this approach might be. After all, both nxKey application and `CKAgentNXE.exe` are running on the same privilege level. Why not just call `SendInput()`? Why is this indirection necessary?

I noticed however that `CKAgentNXE.exe` sets a security descriptor for its IPC objects to allow access from processes with integrity level Low. And I also noticed that the setup program creates registry entries under `HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Internet Explorer\Low Rights\ElevationPolicy` to allow automatic elevation of `CKAgentNXE.exe`. And that’s where it clicked: this is all because of the Internet Explorer sandbox.

So when TouchEn Key runs as ActiveX in Internet Explorer, its integrity level is Low. Being sandboxed in this way effectively makes it impossible to use `SendInput()`. This restriction is circumvented by allowing to run and automatically elevate `CKAgentNXE.exe` from the Internet Explorer sandbox. Once the helper application is running, the sandboxed ActiveX control can connect to it and ask it to do something. Like calling `SendInput()`.

Outside of Internet Explorer this approach makes no sense, yet TouchEn nxKey also delegates work to `CKAgentNXE.exe`. And this has consequences for security.

Let’s say we have a malware that is running on the integrity level Low. It likely got there by exploiting a browser vulnerability, but now it is stuck in that sandbox. What can it do now? Why, just wait for `CKAgentNXE.exe` to start up (bound to happen sooner or later) and use it to break out!

My proof of concept application asked `CKAgentNXE.exe` to generate fake keyboard input for it: Win key, then C, M, D and the Enter key. This resulted in a command line prompt being opened, this one running with the Middle integrity level (the default one). A truly malicious application could then type in an arbitrary command to run code outside the sandbox.

Not that a truly malicious application would do things in such a visible way. `CKAgentNXE.exe` also accepts command code 5 for example which will load an arbitrary DLL into any process. That’s a much nicer way to infect a system, don’t you think?

At least this time one of the mandatory security applications decided to make itself useful and flag the threat:

{{< img src="antivirus_warning.png" width="548" alt="AhnLab Safe Transaction application warning about C:\Temp\test.exe being infected with Malware/Win.RealProtect-LS.C5210489" />}}

A malware author could probably figure out what triggers this warning and get around it. Or they could initiate a web socket connection to make sure `CKAgentNXE.exe` starts up without also activating AhnLab application like a real banking website would. But why bother? It’s only a prompt, the attack isn’t being stopped proactively. By the time the user clicks to remove the malicious application, it will be too late – the attack already succeeded.

## Accessing the driver’s keylogging functionality directly

As mentioned above, TouchEn nxKey application (the one encrypting keyboard input it receives from the driver) is running with user’s privileges. It isn’t an elevated application, it has no special privileges. How is access to the driver’s functionality being restricted then?

The correct answer of course is: it isn’t. Any application on the system has access to this functionality. It only needs to know how nxKey communicates with its driver. And in case you are wondering: that communication protocol isn’t terribly complicated.

I am not sure what the idea here was. `TKAppm.dll`, the library doing the driver communication, is obfuscated using Themida. The vendor behind Themida promises:

> Themida® uses the SecureEngine® protection technology that, when running in the highest priority level, implements never seen before protection techniques to protect applications against advanced software cracking.

Maybe nxKey developers thought that this would offer sufficient protection against reverse engineering. Yet connecting a debugger at runtime allows saving already decrypted `TKAppm.dll` memory and load the result into Ghidra for analysis.

{{< img src="debugging.png" width="365" alt="Message box titled TouchEn nxKey. The text says: Debugging Program is detected. Please Close Debugging Program and try again. TouchEn nxKey will not work with subsequent key. (If system is virtual PC, try real PC.)" />}}

Sorry, too late. I’ve already got what I needed. And it was no use that your application refuses to work when booting in Safe Mode.

Either way, I could write a tiny (70 lines of code) application that would connect to the driver and use it to intercept all keyboard input on the system. It didn’t require elevation, running with user’s privileges was sufficient. And unlike with a web page this application could also make sure this keyboard input is delivered to its destination, so the user doesn’t notice anything. Creating a keylogger was never so easy!

The best part: this keylogger integrated with the nxKey application nicely. So nxKey would receive keyboard input, encrypt it and send encrypted data to the website. And my tiny keylogger would also receive the same keyboard input, as clear text.

### Side-note: Driver crashes

There is something you should know when developing kernel drivers: crashing the driver will crash the entire system. This is why you should make extra certain that your driver code never fails.

Can the driver used by nxKey fail? While I didn’t look at it too closely, I accidentally discovered that it can. See, the application will use [DeviceIoControl()](https://learn.microsoft.com/en-us/windows/win32/api/ioapiset/nf-ioapiset-deviceiocontrol) to ask the driver for a pointer to the input buffer. And the driver creates this pointer by calling [MmMapLockedPagesSpecifyCache()](https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-mmmaplockedpagesspecifycache).

Yes, this means that this input buffer is visible to every single application on the system. But that’s not the main issue. It’s rather: what happens if the application requests the pointer again? Well, the driver will simply do another `MmMapLockedPagesSpecifyCache()` call.

After around 20 seconds of doing this in a loop the entire virtual address space is exhausted and `MmMapLockedPagesSpecifyCache()` returns `NULL`. The driver doesn’t check the return value and crashes. Boom, the operating system reboots automatically.

This issue isn’t exploitable from what I can tell (note: I am no expert when it comes to binary exploitation), but it is still rather nasty.

## Will it be fixed?

Usually, when I disclose vulnerabilities they are already fixed. This time that’s unfortunately not the case. As far as I can tell, none of the issues have been addressed so far. I do not know when the vendors plan to fix these issues. I also do not know how they plan to push out the update to the users, particularly given that banks are already distributing builds that are at least three versions behind the current release. You remember: there is no autoupdate functionality.

Even reporting these issues was complicated. Despite specializing in security, RaonSecure doesn’t list any kind of security contact. In fact, RaonSecure doesn’t list any contact whatsoever, except for a phone number in Seoul. No, I’m not going to phone to Korea asking whether anyone speaks English there.

Luckily, KrCERT provides a [vulnerability report form](https://www.krcert.or.kr/krcert/contact/vulnerability.do) specifically for foreign citizens to use. This form will frequently error out and require you to re-enter everything, and some reports get caught up in a web firewall for no apparent reason, but at least the burden of locating the security contact is on someone else.

I reported all the vulnerabilities to KrCERT on October 4th, 2022. I still tried to contact some RaonSecure executives directly but received no response. At least KrCERT confirmed forwarding my reports to RaonSecure roughly two weeks later. They also noted that RaonSecure asked for my email address and wanted to contact me. They never did.

And that’s it. The 90 days disclosure deadline was a week ago. TouchEn nxKey 1.0.0.78 was apparently released on October 4th, 2022, the same day I reported these vulnerabilities. At the time of writing it remains the latest release, and all the vulnerabilities described here are still present in it. The latest version of the TouchEn browser extension used by millions of people is still five years old, released in January 2018.

### Side-note: The information leak

How do I even know that they are working on a fix? Well, thanks to something that never happened to me before: they leaked my proofs of concept (meaning: almost complete exploits for the vulnerabilities) prior to the deadline.

See, I used to attach files to my reports directly. However, these attachments would frequently end up being removed or otherwise destroyed by overzealous security software. So instead I now upload whatever files are needed to demonstrate the issue to my server. A link to my server always works. Additional benefit: even with companies that don’t communicate I can see in the logs whether the vendor accessed the proof of concept at all, meaning whether my report reached anyone.

A few days ago I checked the logs for accesses to the TouchEn nxKey files. And immediately saw Googlebot. Sure enough: these files ended up being listed in the Google index.

Now I use a random folder name, it cannot be guessed. And I only shared the links with the vendor. So the vendor must have posted a publicly visible link to the exploits somewhere.

And that’s in fact what they did. I found a development server, publicly visible and indexed by Google. It seems that this server was originally linking to my proof of concept pages. By the time I found it, it was instead hosting the vendor’s modified copies of them.

The first request by Googlebot was on October 17th, 2022. So I have to assume that these vulnerabilities could be found via a Google search more than two months prior to the disclosure deadline. They have been accessed many times, hard to tell whether it’s only been the product’s developers.

After reporting this issue the development server immediately disappeared from the public internet. Still, such careless handling of security-sensitive information isn’t something I’ve ever seen before.

## Can the nxKey concept even work?

We’ve seen a number of vulnerabilities in the TouchEn nxKey application. By attempting to combat keyloggers, nxKey developers built a perfect keylogging toolset and failed to restrict access to it. But the idea is nice, isn’t it? Maybe it would actually be a useful security tool if built properly?

Question is: the keylogger that is being protected against, what level does it run on? The way I see it, there are four options:

1. In the browser. So some malicious JavaScript code is running in the online banking page, attempting to capture passwords. That code can trivially stop the page from activating nxKey.
2. In the system, with user’s privileges. This privilege level is e.g. sufficient to kill the `CrossEXService.exe` process which is also running with user’s privileges. This achieves the same results as my denial-of-service attacks, protection is effectively disabled.
3. In the system, with administrator privileges. That’s actually sufficient privileges to unload the nxKey driver and replace it by a trojanized copy.
4. In the hardware. Game over, good luck trying any software-based solutions against that.

So whatever protection nxKey might provide, it relies on attackers who are unaware of nxKey and its functionality. Generic attacks may be thwarted, but it is unlikely to be effective against any attacks targeting specifically South Korean banks or government organizations.

Out of these four levels, number 2 *might* be possible to fix. The application `CrossEXService.exe` could be made to run with administrator’s privileges. This would prevent malware from messing with this process. Effectiveness of this protection would still rely on the malware being unable to get into the user’s browser however.

I cannot see how this concept could be made to work reliably against malware operating on other levels.