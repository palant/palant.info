---
categories:
- mozilla
- security
date: "2016-07-02 12:38:39"
description: ""
slug: why-mozilla-shouldn-t-copy-chrome-s-permission-prompt-for-extensions
title: Why Mozilla shouldn't copy Chrome's permission prompt for extensions
---

As Mozilla’s Web Extensions project is getting closer towards being usable, quite a few people seem to expect some variant of Chrome’s permission prompt to be implemented in Firefox. So instead of just asking you whether you want to trust an add-on Firefox should list exactly what kind of permissions an add-on needs. So users will be able to make an informed decision and Mozilla will be able to skip the review for add-ons that don’t request any “dangerous” permissions. What could possibly be wrong with that?

{{< img "permissions_prompt.png" "Chrome permissions prompt" />}}

In fact, lots of things. People seem to think that Chrome’s permission prompt is working well, because… well, it’s Google and they tend to do things right? However, having dealt with the effects of this prompt for several years I’m fairly certain that it doesn’t have the desired effect. In fact, the issues are so severe that I consider it security theater. Here is why.

{{< toc >}}

## Informed decisions?

The permission prompt shown above says: “Read and change all your data on the websites you visit.” Can a regular user tell whether that’s a bad thing? In fact, lots of confused users asked why Adblock Plus needed this permission and whether it was spying on them. And we explained that the process of blocking ads is in fact what Chrome describes as changing data on all websites. Also, Adblock Plus *could* also read data as a side-effect, but it doesn’t do anything like that of course. The latter isn’t because the permission system stops Adblock Plus from doing it, but simply because we are good people (and we also formulated this very restrictive <a href="https://adblockplus.org/privacy#abp">privacy policy</a>).

The problem is: useful extensions will usually request this kind of “give me the keys to the kingdom” permission. Password managers? Sure, these need to fill in passwords on any website – and if they are allowed to access these websites they could theoretically also extract data from them. Context search extensions? Sure, these need to know what word you selected on any website – they could extract additional data. In fact, there are few extensions in Chrome Web Store that don’t produce the scary “read and change all your data” warning, mostly it’s very specialized ones.

How do users deal with that? A large number of users <a href="http://arstechnica.com/security/2009/07/benign-security-warnings-have-trained-users-to-ignore-them/">learned to ignore the warnings</a>. I mean, there is always a scary warning and it always means absolutely nothing, why care about it at all? But there is also another group, people who got scared enough that they stopped using extensions altogether. In between, there are those who only install extensions associated with known brands – other extension developers have told me that users distrusting the extension author is very noticeable for extensions outside the “Most popular” list.

## No reviews?

It’s a well-known fact that many extension developers love Chrome Web Store (CWS) and dislike Addons.Mozilla.Org (AMO). From developer’s point of view, publishing to CWS is a very simple process and updates go online after merely 60 minutes. AMO on the other hand takes an arbitrary time for a manual review, and review times used to be rather bad in the past – assuming that you get a positive review at all rather than a request to improve various aspects of your extension.

There is another angle to that however, namely the user’s. If your mom wants to install an extension, is that safe? For AMO I’d say: mostly yes, as long as she stays clear of unreviewed add-ons. And CWS? Well, not really. Even many of the most popular extensions have functionality which violates user’s privacy. As you go to the more obscure extensions you will also find more intrusive behavior, all the way to outright malicious.

Wait, doesn’t the permissions system take care of malicious behavior? In a way, it does – an extension cannot format your hard drive, it cannot hide itself in the list of extensions and it cannot prevent users from uninstalling it. But reading out your passwords as you enter them on webpages? Track what pages you visit and send them to a third party service? Add advertisements to webpages as they load? Redirect you to “alternative” search engines as you enter your search term? Not a big deal, all covered by the usual all-encompassing “read and change all your data” permission.

## So, what’s the point?

Chrome’s permissions system doesn’t really make the decision process easier for users, usually they still have to trust the extension author. It also does a very poor job when it comes to keeping malicious actors out of CWS. So, does it solve any issue at all? But of course it does! It allows Google to shift blame: if a user installs a malicious extension then it’s the user’s fault and not Google’s. After all, the user has been warned and accepted the permission prompt. Privacy violations and various kinds of malicious behavior are perfectly legitimate given CWS policies because… well, there is no issue as long as users are being warned! Developers are happy and Google can save lots of money on reviews – a win-win situation.

## Can this be done better?

At Mozilla All Hands in London we briefly discussed whether there are any alternatives. One of the suggestions was combining that permission prompt with code review. For example, a reviewer could determine whether the extension is merely modifying webpage behavior or actually extracting data from it. Depending on the outcome the permission prompt should display a different message. This compromise would keep the review task relatively simple while providing users with useful information.

Thinking more about it, I’m not entirely convinced however that this is going into the right direction. Even if the website is extracting data from the webpage, the real question for the user is always: is that in line with the stated goal of the extension or tracking functionality that isn’t really advertised? And reviewers are currently trying to answer that exact question, the latter being a reason for extensions to be rejected due to violations of the “No surprises” policy. Wouldn’t it be a better idea to keep doing that so that the installation prompt can simply say: “Hey, we made sure that this extension is doing what it says, want to install it?”

## And what about updates?

One aspect that people usually don’t seem to recognize is extension updates. As an extension evolves, the permissions that it requires might change. For example, my <a href="https://addons.mozilla.org/addon/google-search-link-fix/">Google search link fix extension</a> was originally meant for Google only, later it turned out that it could address the same issue on other search engines in a similar way. How does Chrome deal with extension updates that require new permissions? Well, it disables the extension until the user approves the permissions again. As you might imagine, a significant percentage of users never do that. This puts extension developers in a dilemma, they have to choose between losing users and limiting extension functionality to the available permissions.

This might be one contributing factor to the prevalence of extensions requesting very broad privileges: it’s much easier to request too many privileges from the start than add permissions later. This only works with permissions that already exist however, if Chrome adds new functionality which is useful for your extensions you cannot get around requesting an additional privilege for it.

The Chrome developers seem to address this issue from two angles. On the one hand, permissions for new functionality being developed tend to be subsumed by already existing permissions. So adding this permission on an update won’t trigger a new permission prompt due to the permissions you already have. Also, Chrome added support for optional permissions which the extension can request in context, when responding to a particular user action. This works well to show the user why a particular permission is needed but doesn’t work for actions performed in background.

Altogether, I could hopefully show that Chrome’s permission prompt has a number of issues that haven’t been sufficiently addressed yet. If Mozilla is going to implement something similar, they better think about these issues first. I’d hate seeing Mozilla also using it as a mechanism to shift the responsibility.
