---
title: "Setup for testing Android app vulnerabilities"
date: 2021-02-22T22:17:28+01:00
description: "Documenting my setup: Android emulator, minimal Android app and instrumenting the target app via Soot to get debugging info."
categories:
- android
- soot
---

In the [previous article](/2021/02/18/reverse-engineering-a-unity-based-android-game/) I documented my approach for reverse engineering an Android game. But getting my hands on the code is only one part of security research. Once a potential issue is identified, I need to verify that it is actually exploitable. So there is no way around messing with an actual live app. Ideally that has to happen in a controlled environment with emulated hardware. As before, this is mostly me writing things down for my future self, but it might come useful for other people as well.

{{< toc >}}

## Choosing a virtualization approach

Historically, the official Android emulator has been barely usable, which is why I’ve been using [Androix x86](https://www.android-x86.org/) images in VirtualBox for a long time. This solution doesn’t work here however: the Android game in question contains binary code compiled for the ARM platform, it cannot be executed directly on x86 hardware.

But don’t despair, Android 11 comes with a built-in ARM emulator! So when this game is run on x86 hardware, the OS should automatically translate ARM processor instructions and things will magically work. Sounds great, except for the fact that at the time of writing the Android x86 project only provides Android 9 images and nothing above that.

Further searching brought me to Bliss OS 14, based on Android 11 and available as an Alpha release. I tried it in VirtualBox, and it failed installing. Trying to run it directly from the CD image failed as well. Some investigation on my part revealed wrong paths in the install script as well as a broken Grub build. And that’s not even the parts changing on OS upgrades, the OS would get stuck on boot despite my workarounds. Supposedly, things would work on non-virtualized hardware but I have strong doubts about that. I rather suspect that this “release” is only usable for people installing everything manually and having really deep understanding of the operating system. So either the developers have a different understanding of the phrase “alpha release” than me (mine implies something that’s at least somewhat usable) or the whole thing is a pure publicity stunt: “We are first to bring Android 11 to the desktop!”

I then circled back to the Android emulator. And who would have thought, it worked flawlessly! All the issues making it unusable for me in the past were gone. So the next section is about getting this emulator to your machine.

## Setting up Android SDK

The Android SDK is going to be a hefty download no matter what. So you are probably well-advised to go to [the download page](https://developer.android.com/studio#downloads) and download Android Studio. It is easier to set up and better documented.

Personally however, I don’t need this IDE. I prefer working with command line tools where it’s easier to get reproducible results which is particularly important for automation. So for me it’s the “Command line tools only” download further down on the same page.

Android SDK requires Java, but Java doesn’t have to be installed globally on the system. You can [download Java JDK](https://www.oracle.com/java/technologies/javase-downloads.html) and unpack it anywhere on your system. As long as you expose its path in the `JAVA_HOME` environment variable, all the command line tools will work correctly.

The command line tools expect to be unpacked to the `cmdline-tools/latest` directory of the Android SDK, even if your Android SDK install is initially nothing but the command line tools. So you better put them there unless you want to specify the Android SDK path explicitly every time. Add `/path/to/sdk/cmdline-tools/latest/bin` to your `PATH` environment variable to use the commands. This allows running `sdkmanager` to install further components:

    sdkmanager 'system-images;android-30;google_apis_playstore;x86_64' \
               'build-tools;30.0.3' 'platforms;android-30' 'platform-tools'

Here `system-images;android-30;google_apis_playstore;x86_64` is the Android 11 image (corresponding to API version 30) with the Play Store app. The emulator will be installed automatically and you’ll need to add `/path/to/sdk/emulator` to `PATH` for the `emulator` command.

`build-tools;30.0.3` and `platforms;android-30` are needed in order to build apps for the Android 11 platform, `/path/to/sdk/build-tools/30.0.3` needs to be added to `PATH` for the APK signing commands. And `platform-tools` contain the `adb` binary, so `/path/to/sdk/platform-tools` should be added to `PATH` as well.

You can now create a device image for the emulator. I named the image `Android11` and used a tablet as a usable initial hardware configuration. While this command will suggest creating a custom hardware profile, it’s hardly advisable to do so. That is, unless you fancy answering a hundred irrelevant questions of course where each mistake will make you repeat the process.

    avdmanager create avd -n Android11 -d '10.1in WXGA (Tablet)' \
               -k 'system-images;android-30;google_apis_playstore;x86_64'

You can still change the hardware configuration by editing `~/.android/avd/Android11.avd/config.ini` manually. For me, the following values needed adjusting or adding:

* `hw.ramSize`: the default 2048 MB weren’t sufficient for the game app to run, I changed this to 10240 MB
* `hw.keyboard`: this should be set to `yes` if you prefer your computer’s keyboard over the on-screen variant
* `hw.keyboard.charmap`: the default `qwerty2` should be ok for US keyboards, but German keyboard layout is `qwertz`

Now you should be able to run the emulator:

    emulator -avd Android 11

You can install the app to be tested via Play Store. But then again, you probably have the APK package anyway, in my case named `game.apk`. So you can install it directly:

    adb install game.apk

## Minimal proof of concept Android app

The [previous article](/2021/02/18/reverse-engineering-a-unity-based-android-game/) mentioned an exposed service. In order to attempt accessing it, one needs to run some code via another Android app. Obviously, I’d rather avoid complicating matters, so how does one build a minimal Android app?

As [this](https://czak.pl/2016/01/13/minimal-android-project.html) or [this](https://developer.okta.com/blog/2018/08/10/basic-android-without-an-ide) blog articles explain, the answer is surprisingly complicated. In the end, it’s probably easiest to use Gradle. So I [downloaded the latest package](https://services.gradle.org/distributions/) which at the time of writing was `gradle-6.8.3-all.zip`. After unpacking you have one more value to be added to the `PATH` environment variable: `/path/to/gradle/bin`. Now the `gradle` command can be used.

The project root needs a `build.gradle` configuration file:

    buildscript {
        repositories {
            google()
            jcenter()
        }
        dependencies {
            classpath 'com.android.tools.build:gradle:4.1.0+'
        }
    }

    allprojects {
        repositories {
            google()
            jcenter()
        }
    }

    apply plugin: 'com.android.application'

    android {
        compileSdkVersion 30
        buildToolsVersion '30.0.3'
    }

Most of this is generic, only the version of the Android plugin for Gradle is worth mentioning. The [documentation](https://developer.android.com/studio/releases/gradle-plugin#updating-gradle) says that `4.1.0+` is the correct plugin version for current Gradle releases. Future Gradle versions might require a different value here.

Gradle expects a complex directory structure, so `AndroidManifest.xml` has to be located under `src/main` in the project. Mine is very basic:

{{< highlight xml >}}
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.example.test">
    <application android:label="Test app">
        <activity android:name="MainActivity">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
{{< /highlight >}}

If you keep the package ID as `com.example.test`, then your `MainActivity.java` file has to be placed into the `src/main/java/com/example/test` subdirectory of the project. Something like this will do:

{{< highlight java >}}
package com.example.test;

import android.content.ComponentName;
import android.content.Intent;
import android.content.ServiceConnection;
import android.os.Bundle;
import android.os.IBinder;

public class MainActivity extends Activity
{
    @Override
    public void onCreate(Bundle savedInstanceState)
    {
        super.onCreate(savedInstanceState);

        Intent intent = new Intent();
        intent.setComponent(new ComponentName(
          "com.example.funnygame",
          "com.example.funnygame.MyFirebaseMessagingService"
        ));
        intent.setAction("com.google.firebase.MESSAGING_EVENT");
        this.bindService(intent, new ServiceConnection()
        {
          @Override
          public void onServiceConnected(ComponentName name, IBinder service)
          {
            System.out.println("Service connected: " + name);
          }
          @Override
          public void onServiceDisconnected(ComponentName name) {}
        }, BIND_AUTO_CREATE );
    }
}
{{< /highlight >}}

Now you can run `gradle installDebug` (expects `ANDROID_HOME` environment variable to be set to the Android SDK path). This command will build the app and install it to the emulator automatically. When you run it, it will immediately attempt to connect to a particular service from another app. And maybe it can then do something interesting with it.

## Adding debugging output to the target application

Now my first attempt didn’t go anywhere. Nothing happened and from the source code I couldn’t quite tell why. So there is no way around debugging the target application to see what’s going on there. Except: all the documentation says that debugging only works with debug builds. And I cannot exactly ask the vendor to provide me a debug build of their app.

Luckily, there is still a way. If an Android app can be decompiled, it can also be modified. It seems that the most up-to-date framework to do this is [Soot](https://soot-oss.github.io/soot/) and there is a [detailed article](https://medium.com/swlh/instrumenting-android-apps-with-soot-dd6f146ff4d2) on how it can be used. It also provides a [repository with working code](https://github.com/noidsirius/SootTutorial) which is really helpful because you don’t have to start from scratch with your Java code.

What I ended up doing is very similar to the `AndroidLogger.java` example. It adds a `System.out.println()` call at the beginning of each method and will log both the method and the parameters it receives. You have to keep in mind that Jimple is a low-level representation of Java code that doesn’t support nested expressions. So the result of each intermediate expression has to be saved into a local variable which complicates things somewhat. The resulting body transformer looks like this:

{{< highlight java >}}
@Override
protected void internalTransform(Body b, String phaseName, Map<String, String> options)
{
  JimpleBody body = (JimpleBody)b;

  // Only add logging to com.example.funnygame package
  String className = body.getMethod().getDeclaringClass().getName();
  if (!className.startsWith("com.example.funnygame."))
    return;

  // Instructions to be added
  List<Unit> units = new ArrayList<>();

  // StringBuilder message = new StringBuilder("Entered method with parameters: ");
  Local message = generateNewLocal(body, RefType.v("java.lang.StringBuilder"));
  units.add(
    Jimple.v().newAssignStmt(
      message,
      Jimple.v().newNewExpr(RefType.v("java.lang.StringBuilder"))
    )
  );
  units.add(
    Jimple.v().newInvokeStmt(
      Jimple.v().newSpecialInvokeExpr(
        message,
        Scene.v().getMethod(
          "<java.lang.StringBuilder: void <init>(java.lang.String)>"
        ).makeRef(),
        StringConstant.v(
          "Entered method " + body.getMethod().getSignature() +
          " with parameters: "
        )
      )
    )
  );

  List<Local> parameters = body.getParameterLocals();
  boolean first = true;
  for (Local parameter: parameters)
  {
    if (first)
      first = false;
    else
    {
      // message.append(", ");
      units.add(
        Jimple.v().newInvokeStmt(
          Jimple.v().newVirtualInvokeExpr(
            message,
            Scene.v().getMethod(
              "<java.lang.StringBuilder: java.lang.StringBuilder append(java.lang.String)>"
            ).makeRef(),
            StringConstant.v(", ")
          )
        )
      );
    }

    // message.append(String.valueOf(parameter));
    Local stringified = generateNewLocal(body, RefType.v("java.lang.String"));
    units.add(stringify(parameter, stringified));
    units.add(
      Jimple.v().newInvokeStmt(
        Jimple.v().newVirtualInvokeExpr(
          message,
          Scene.v().getMethod(
            "<java.lang.StringBuilder: java.lang.StringBuilder append(java.lang.String)>"
          ).makeRef(),
          stringified
        )
      )
    );
  }

  // System.out.println(message.toString());
  Local messageStringified = generateNewLocal(body, RefType.v("java.lang.String"));
  units.add(
    Jimple.v().newAssignStmt(
      messageStringified,
      Jimple.v().newVirtualInvokeExpr(
        message,
        Scene.v().getMethod(
          "<java.lang.Object: java.lang.String toString()>"
        ).makeRef()
      )
    )
  );

  Local printStream = generateNewLocal(body, RefType.v("java.io.PrintStream"));
  units.add(
    Jimple.v().newAssignStmt(
      printStream,
      Jimple.v().newStaticFieldRef(
        Scene.v().getField("<java.lang.System: java.io.PrintStream out>").makeRef()
      )
    )
  );
  units.add(
    Jimple.v().newInvokeStmt(
      Jimple.v().newVirtualInvokeExpr(
        printStream,
        Scene.v().getMethod(
          "<java.io.PrintStream: void println(java.lang.String)>"
        ).makeRef(),
        messageStringified
      )
    )
  );

  // Insert new code at the beginning of the method and validate
  body.getUnits().insertBefore(units, body.getFirstNonIdentityStmt());
  body.validate();
}
{{< /highlight >}}

This uses two helper functions:

{{< highlight java >}}
private static Local generateNewLocal(Body body, Type type)
{
  LocalGenerator lg = new LocalGenerator(body);
  return lg.generateLocal(type);
}

private static Unit stringify(Local value, Local result)
{
  Type type = value.getType();
  String typeSignature = (
    type instanceof PrimType ? type.toString() : "java.lang.Object"
  );
  if (typeSignature == "byte" || typeSignature == "short")
    typeSignature = "int";
  return Jimple.v().newAssignStmt(
    result,
    Jimple.v().newStaticInvokeExpr(
      Scene.v().getMethod(
        "<java.lang.String: java.lang.String valueOf(" + typeSignature + ")>"
      ).makeRef(),
      value
    )
  );
}
{{< /highlight >}}

Using the setup from the [original article](https://medium.com/swlh/instrumenting-android-apps-with-soot-dd6f146ff4d2) I’ve hit two issues. First one was that the APK file generated by Soot was subtly broken. I decided that it would be best to let Soot process only the `.dex` files. As it turned out, `process_dir` option doesn’t have to be set to the location of the APK file, it can also be an individual `.dex` file. Soot will then write a `classes.dex` file to the output directory. So I generate the modified APK using the following quick and dirty Python script:

{{< highlight python >}}
import os
import shutil
import subprocess
import zipfile

env = dict(os.environ)
env['CLASSPATH'] = '.:/path/to/soot-4.2.1-jar-with-dependencies.jar'
env['ANDROID_HOME'] = '/path/to/sdk/'

with zipfile.ZipFile('game.apk', 'r') as archive_in:
  with zipfile.ZipFile('game-instrumented.apk', 'w') as archive_out:
    for entry in archive_in.infolist():
      if entry.filename.startswith('classes') and entry.filename.endswith('.dex'):
        archive_in.extract(entry)
        subprocess.check_call([
          'java', 'APKConverter', entry.filename, 'instrumented'
        ], env=env)
        os.unlink(entry.filename)
        archive_out.write(os.path.join('instrumented', 'classes.dex'), entry.filename)
        shutil.rmtree('instrumented')
      else:
        archive_out.writestr(entry, archive_in.read(entry))
{{< /highlight >}}

The second issue is rather weird: a particular class in a Google API would error out due to an invalid cast. The problematic code was in a static class initializer and the decompiled line looked like this:

{{< highlight java >}}
zzao = (zzl)new zzt();
{{< /highlight >}}

This is indeed an invalid cast, the `zzt` type doesn’t implement the (empty) `zzl` interface. How did this ever work? I can only imagine that this particular construct used invalid bytecode, meant to turn into an error upon recompilation. The `zzao` variable initialized here is never used.

But since we are rewriting code, we can simply remove this assignment! Adding the following code to the body transformer did the job:

{{< highlight java >}}
if (className.equals("com.google.android.gms.games.Games") &&
    body.getMethod().getName().equals("<clinit>"))
{
  body.getUnits().removeIf(unit -> {
    if (unit instanceof AssignStmt)
    {
      String typeName = ((AssignStmt)unit).getLeftOp().getType().toString();
      if (typeName.equals("com.google.android.gms.games.appcontent.zzl"))
        return true;
    }
    return false;
  });
}
{{< /highlight >}}

The final touch is signing the modified APK. A test certificate is good enough to install the app in the emulator, but you’ll have to uninstall the original app first. I used the following command to generate a certificate (`keytool` is part of the Java install):

    keytool -genkey -v -keystore test.jks -alias test -keyalg RSA \
            -keysize 2048 -keypass 123456 -validity 10000

Now signing is a matter of running the following two commands from the Android SDK:

    zipalign -f 4 game-instrumented.apk game-signed.apk
    apksigner sign --ks test.jks --ks-pass 'pass:123456' game-signed.apk

Running `adb install game-signed.apk` can install the modified app now, and it should produce nice debugging messages visible in `adb logcat` output.
