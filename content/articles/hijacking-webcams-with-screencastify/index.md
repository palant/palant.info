---
title: "Hijacking webcams with Screencastify"
date: 2022-05-23T14:42:37+0200
description: Screencastify extension allows websites to access user’s webcam as well as their Google Drive account. The issue isn’t really resolved.
categories:
- security
- add-ons
---

Everyone has received the mails trying to extort money by claiming to have hacked a person’s webcam and recorded a video of them watching porn. These are a bluff of course, but the popular Screencastify browser extension actually provides all the infrastructure necessary for someone to pull this off. A website that a user visited could trick the extension into starting a webcam recording among other things, without any indications other than the webcam’s LED lighting up if present. The website could then steal the video from the user’s Google Drive account that it was uploaded to, along with anything else that account might hold.

Screencastify is a browser extension that aids you in creating a video recording of your entire screen or a single window, optionally along with your webcam stream where you explain what you are doing right now. Chrome Web Store shows “10,000,000+ users” for it which is the highest number it will display – same is shown for extensions with more than 100 million users. The extension is being marketed for educational purposes and gained significant traction in the current pandemic.

As of now, it appears that Screencastify only managed to address the Cross-site Scripting vulnerability which gave arbitrary websites access to the extension’s functionality, as opposed to “merely” Screencastify themselves and a dozen other vendors they work with. As this certainly won’t be their last Cross-site Scripting vulnerability, I sincerely recommend staying clear of this browser extension.

{{< toc >}}

## Website integration

Screencastify extension integrates with its website. That’s necessary for video editing functionality which isn’t part of the extension. It’s also being used for challenges: someone creates a challenge, and other people visit the corresponding link, solving it and submitting their video. To enable this integration the extension’s manifest contains the following:

```json
"externally_connectable": {
  "matches": [
    "https://*.screencastify.com/*"
  ]
},
```

So any page on the screencastify.com domain can send messages to the extension. What kind of messages? Lots of them actually. For example:

```js
case 'bg:getSignInToken':
  // sends token for success and false for failure
  asyncAction = this._castifyAuth.getAuthToken({ interactive: true });
  break;
```

Let’s see what happens if we open Developer Tools somewhere on screencastify.com and run the following:

```js
chrome.runtime.sendMessage("mmeijimgabbpbgpdklnllpncmdofkcpn", {
  type: "bg:getSignInToken"
}, response => console.log(response));
```

This indeed produces an authentication token, one that starts with `ya29.`. And a quick search shows that this is the format of Google’s OAuth access token. It indeed belongs to the account that the Screencastify extension has been configured with (extension isn’t usable without), granting full read/write privileges for Google Drive.

*Side note*: There is a reason why Screencastify has to request full access to Google Drive, and it is a design flaw on Google’s end. An app can request access to an app-specific folder which would be sufficient here. But unlike Dropbox for example, Google Drive hides app-specific folders from the user. And users not being able to see their own uploaded videos is quite a showstopper. So Screencastify has to request full access, create a user-visible folder and upload videos there.

Another piece of functionality allows websites to [establish a connection to the extension](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onConnectExternal). Once it has the connection port, the website can send e.g. the following message through it:

```js
port.postMessage({type: "start", data: {captureSource: "desktop"}});
```

This will bring up the following dialog window:

{{< img src="source_selection.png" width="597" alt="Chrome window titled: Choose what you want to share. Text inside the window says: Screencastify - Screen Video Recorder wants to share the contents of your screen. User can choose between sharing the entire screen and a specific window." />}}

That’s Chrome’s [desktopCapture API](https://developer.chrome.com/docs/extensions/reference/desktopCapture/) in action. If this dialog is accepted, recording will start. So the user needs to cooperate.

There are other possible values for `captureSource`, for example `"tab"`. It will attempt to use [tabCapture API](https://developer.chrome.com/docs/extensions/reference/tabCapture/) and fails because this API can only be used in response to a direct user action (no idea why Chrome is stricter here than with screen recordings).

And there is `"webcam"`. This uses the same [WebRTC API](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API) that is available to web pages as well. The difference when using it from a browser extension: the user only needs to grant the permission to access the webcam once. And Screencastify requests that permission as part of its onboarding. So starting a webcam recording session usually happens without requiring any user interaction and without any visual indicators. Later the recording can be stopped:

```js
port.postMessage({type: "stop", data: false});
```

And with the default settings, the recorded video will be automatically uploaded to Google Drive. As we remember, the website can get the access token necessary to download it from there.

## Who controls screencastify.com?

Let’s sum up: the extension grants screencastify.com enough privileges to record a video via user’s webcam and get the result. No user interaction is required, and there are only minimal visual indicators of what’s going on. It’s even possible to cover your tracks: remove the video from Google Drive and use another message to close the extension tab opened after the recording. That’s considerable power. Who could potentially abuse it?

Obviously, there is Screencastify itself, running app.screencastify.com and a bunch of related subdomains. So the company itself or a rogue employee could plant malicious code here. But that’s not the end of it. The entities controlling subdomains of screencastify.com (not counting hosting companies) are at the very least:

* Webflow, running www.screencastify.com
* Teachable, running course.screencastify.com
* Atlassian, running status.screencastify.com
* Netlify, running quote.screencastify.com
* Marketo, running go.screencastify.com
* ZenDesk, running learn.screencastify.com

That’s quite a few companies users are expected to trust.

## And who else?

So it’s a domain running quite a few web applications from different companies, all with very different approaches to security. One thing they have in common however: none of the subdomains seem to have meaningful protection in terms of [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP). With such a large attack surface, exploitable [Cross-site Scripting (XSS)](https://en.wikipedia.org/wiki/Cross-site_scripting) vulnerabilities are to be expected. And these would give anyone the power to attack Screencastify users.

In order to make a point I decided to locate an XSS vulnerability myself. The Screencastify web app is written with the Angular framework which is not up my alley. Angular isn’t usually prone to XSS vulnerabilities, and the Screencastify app doesn’t do anything out of the ordinary. Still, I managed to locate one issue.

The problem was located in the error page displayed if you already submitted a video to a challenge and were trying to submit another one. This error page is located under a fixed address, so it can be opened directly rather than triggering the error condition:

{{< img src="assignment_submitted.png" width="654" alt="Screencastify message with the title: 'Whoops! You already turned in a video.' The text says: 'It looks like you already turned in a video to this assignment on Classroom and cannot submit another video.' Below is a button titled: 'View on Classroom'" />}}

The interesting part here is the “View on Classroom” button meant to send you to Google Classroom. What does clicking this button do?

```js
window.open(this.courseworkLink);
```

Where does `this.courseworkLink` come from? It’s a query string parameter. Is there some link validation in between? Nope. So, if the query string parameter is something like `javascript:alert(document.domain)`, will clicking this button run JavaScript code in the context of the screencastify.com domain? It sure will!

The attackers would still need to trick the user into actually clicking this button of course. But without any framing protection, this page is susceptible to [Clickjacking attacks](https://en.wikipedia.org/wiki/Clickjacking). So my proof-of-concept page loaded the vulnerable page in an invisible frame and positioned it under the mouse cursor in such a way that any click would go to the “View on Classroom” button. Once the user clicked the page could message Screencastify, retrieve the Google access token from it and ask Google for user’s identity. Reading out Google Drive contents or starting a recording session would have been possible as well.

## The (lack of a) fix

I reported the issues to Screencastify on February 14, 2022. I received a response on the very same day, and a day later came the confirmation about the XSS vulnerability being resolved. The mail also mentioned that adding a Content Security Policy would be their long-term plan, but as of now this hasn’t happened on either `app.screencastify.com` or `www.screencastify.com` beyond framing protection.

Looking at the most current Screencastify 2.69.0.4425 release, the `externally_connectable` manifest entry still allows all of `screencastify.com` to connect to the extension. In fact, there is now even a second entry: with `app.pendo.io` one more vendor was added to the mix of those who could already potentially exploit this extension.

Was the API accessible this way restricted at least? Doesn’t look like it. This API will still readily produce the Google OAuth token that can be used to access your Google Drive. And the `onConnectExternal` handler allowing websites to start video recording is still there as well. Not much appears to have changed here and I could verify that it is still possible to start a webcam recording without any visual clues.

So, the question whether to keep using Screencastify at this point boils down to whether you trust Screencastify, Pendo, Webflow, Teachable, Atlassian, Netlify, Marketo and ZenDesk with access to your webcam and your Google Drive data. And whether you trust all of these parties to keep their web properties free of XSS vulnerabilities. If not, you should uninstall Screencastify ASAP.
