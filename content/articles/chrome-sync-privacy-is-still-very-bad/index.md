---
categories:
- privacy
- google
date: 2023-08-29T14:28:44+0200
description: Unlike five years ago, today Chrome Sync is merely bad for your privacy.
  There is a way to use it without sacrificing your privacy, but Google doesn’t want
  you to find it.
lastmod: '2023-08-29 18:40:06'
title: Chrome Sync privacy is still very bad
---

Five years ago I wrote [an article about the shortcomings of Chrome Sync](/2018/03/13/can-chrome-sync-or-firefox-sync-be-trusted-with-sensitive-data/) (as well as a minor issue with Firefox Sync). Now Chrome Sync has seen many improvements since then. So time seems right for me to revisit it and to see whether it respects your privacy now.

Spoiler: No, it doesn’t. It improved, but that’s an improvement from outright horrible to merely very bad. The good news: today you can use Chrome Sync in a way that preserves your privacy. Google however isn’t interested in helping you figure out how to do it.

{{< toc >}}

## The default flow

Chrome Sync isn’t some obscure feature of Google Chrome. In fact, as of Chrome 116 setting up sync is part of the suggested setup when you first install the browser:

{{< img src="welcome.png" width="823" alt="Screenshot of Chrome’s welcome screen with the text “Sign in and turn on sync to get your bookmarks, passwords and more on all devices. Your Chrome, Everywhere” and the highlighted button saying “Continue.”" />}}

Clicking “Continue” will ask you to log into your Google account after which you are suggested to turn on sync:

{{< img src="sync_setup.png" width="488" alt="A prompt titled “Turn on sync.” The text below says: “You can always choose what to sync in settings. Google may personalize Search and other services based on your history.” The prompt has the buttons Settings, Cancel and (highlighted) Yes, I’m in." />}}

Did you click the suggested “Yes, I’m in” button here? Then you’ve already lost. You just allowed Chrome to upload your data to Google servers, without any encryption. Your passwords, browsing history, bookmarks, open tabs? They are no longer yours only, you allowed Google to access them. Didn’t you notice the “Google may personalize Search and other services based on your history” text in the prompt?

In case you have any doubts, this setting (which is off by default) gets turned on when you click “Yes, I’m in”:

{{< img src="url_upload.png" width="636" alt="Screenshot of Chrome’s setting titled “Make searches and browsing better” with the explanation text “Sends URLs of pages you visit to Google.” The setting is turned on." />}}

Yes, Google is definitely watching over your shoulder now.

## The privacy-preserving flow

Now there is a way for you to use Chrome Sync and keep your privacy. In the prompt above, you should have clicked “Settings.” Which would have given you this page:

{{< img src="settings.png" width="671" alt="A message saying “Setup in progress” along with buttons “Cancel” and “Confirm.” Below it Chrome settings, featuring “Sync” and “Other services” sections." />}}

Do you see what you need to do here before confirming? Anyone? Right, “Make searches and browsing better” option has already been turned on and needs to be switched off. But that isn’t the main issue.

“Encryption options” is what you need to look into. Don’t trust the claim that Chrome is encrypting your data, expand this section.

{{< img src="encryption_settings.png" width="609" alt="The selected option says “Encrypt synced passwords with your Google Account.” The other option is “Encrypt synced data with your own sync passphrase. This doesn't include payment methods and addresses from Google Pay.”" />}}

That default option sounds sorta nice, right? What it means however is: “Whatever encryption there might be, we get to see your data whenever we want it. But you trust us not to peek, right?” The correct answer is “No” by the way, as Google is certain to monetize your browsing history at the very least. And even if you trust Google to do no evil, do you also trust your government? Because often enough Google will hand over your data to local authorities.

The right way to use Chrome Sync is to set up a passphrase here. This will make sure that most of your data is safely encrypted (payment data being a notable exception), so that neither Google nor anyone else with access to Google servers can read it.

## What does Google do with your data?

Deep in Chrome’s privacy policy is a section called [How Chrome handles your synced information](https://www.google.com/chrome/privacy/#how-chrome-handles-your-signed-in-information). That’s where you get some hints towards how your data is being used. In particular:

> If you don't use your Chrome data to personalize your Google experience outside of Chrome, Google will only use your Chrome data after it's anonymized and aggregated with data from other users.

So Google will use the data for personalization. But even if you opt out of this personalization, they will still use your “anonymized and aggregated” data. As seen before, promises to anonymize and aggregate data [cannot necessarily be trusted](/2020/02/18/insights-from-avast/jumpshot-data-pitfalls-of-data-anonymization/). Even if Google is serious about this, proper anonymization is difficult to achieve.

So how do you make sure that Google doesn’t use your data at all?

> If you would like to use Google's cloud to store and sync your Chrome data but you don't want Google to access the data, you can encrypt your synced Chrome data with your own sync passphrase.

Yes, sync passphrase it is. This phrase is the closest thing I could find towards endorsing sync passphrases, hidden in a document that almost nobody reads.

This makes perfect sense of course. Google has no interest in helping you protect your data. They rather want you to share your data with them, so that Google can profit off it.

## It could have been worse

Yes, it could have been worse. In fact, it *was* worse.

Chrome Sync used to enable immediately when you signed into Chrome, without any further action from you. It also used to upload your data unencrypted before you had a chance to change the settings. Besides, the sync passphrase would only result in passwords being encrypted and none of the other data. And there used to be a warning scaring people away from setting a sync passphrase because it wouldn’t allow Google to display your passwords online. And the encryption was [horribly misimplemented](/2018/03/13/can-chrome-sync-or-firefox-sync-be-trusted-with-sensitive-data/#chrome-sync).

If you look at it this way, there have been considerable improvements to Chrome Sync over the past five years. But it still isn’t resembling a service meant to respect users’ privacy. That’s by design of course: Google really doesn’t want you to use effective protection for your data. That data is their profits.

## Comparison to Firefox Sync

I suspect that people skimming my [previous article on the topic](/2018/03/13/can-chrome-sync-or-firefox-sync-be-trusted-with-sensitive-data/) took away from it something like “both Chrome Sync and Firefox Sync have issues, but Chrome fixed theirs.” Nothing could be further from the truth.

While Chrome did improve, they are still nowhere close to where Firefox Sync started off. Thing is: Firefox Sync was built with privacy in mind. It was encrypting all data from the very start, by default. Mozilla’s goal was never monetizing this data.

Google on the other hand built a sync service that allowed them to collect all of users’ data, with a tiny encryption shim on top of it. Outside pressure seems to have forced them to make Chrome Sync encryption actually usable. But they really don’t want you to use this, and their user interface design makes that very clear.

Given that, the Firefox Sync issue I pointed out is comparably minor. It isn’t great that five years weren’t enough to address it. This isn’t a reason to discourage people from using Firefox Sync however.