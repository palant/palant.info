---
title: "Writing my own build system: Coupling gulp concepts with modern JavaScript"
date: 2022-02-08T20:45:16+0100
description: "Gulp’s reliance on streams makes extending it quite complicated. Async generators are much simpler to write and maintain."
categories:
- build
- pfp
---

I’ve been using [gulp.js](https://gulpjs.com/) as the build system of choice for my browser extensions for a while. Last week I suddenly felt an urge to develop something better, and now I have PfP being built by my very own build system. Did I suddenly succumb to the [NIH syndrome](https://en.wikipedia.org/wiki/Not_invented_here)?

Well, I *believe* that I have good reasons to develop something better than gulp. And the time investment is quite moderate given the time already sunk into maintaining build configurations. At least I *hope* that this won’t go the way of [this xkcd comic](https://xkcd.com/1319/).

While I still like gulp a lot, its reliance on [Node streams](https://nodejs.org/api/stream.html) turned into a significant downside. It’s a nice concept in theory: something generates a stream of files, and one can add various processors to manipulate the stream and bring it into the shape you want. Yet stream manipulation is just complicated enough to be a hurdle. So you rely on gulp plugins to do it.

And gulp plugins are a very considerable chunk of my dependency hell. Unlike the actual tools I use which are usually popular enough to be well-maintained, the plugins to integrate them with gulp are typically developed by a single person. Even if that person keeps updating their plugin, the updates often enough don’t keep up with the development of the tool and/or introduce subtle breakage. Worse yet, some tools cannot be used because no well-maintained gulp plugins exist for them.

This is the main issue being addressed here. While at it, I realized that some additional improvements can be made. In particular, tasks can easily be made more powerful. And gulp lacks two important helpers that in my opinion need to be integrated properly: removing and renaming files.

{{< toc >}}

## What’s there beyond streams?

Streams are a concept introduced to Node.js long before promises were a thing. They are an object with a number of methods and various events. And you’d pipe one stream into another, so the objects produced by one stream are read out by another. The complication: if you want to modify stream contents, you need to subclass a stream. A `Transform` class exists to make this simpler, but even that is still fairly complicated. So your typical solution is using the [through2 package](https://www.npmjs.com/package/through2).

How would one use `through2` to write a simple handler to concatenate all files? It would be something like this:

```js
import through2 from "through2";

function concat(targetFileName)
{
  let lastFile;
  let result = [];
  return through2(function(file, enc, callback)
  {
    // When would this happen? No idea…
    if (!file.isBuffer())
      throw new Error("Unexpected file type");

    // Creating new files requires another dependency, so let’s keep one around
    lastFile = file;

    // file.contents is a Buffer, convert to string explicitly
    result.push(file.contents.toString());
    callback();
  }, function(callback)
  {
    // Stream ended, now overwrite the last file we’ve seen with the result
    if (lastFile)
    {
      lastFile.path = targetFileName;
      lastFile.contents = Buffer.from(result.join("\n"));
      this.push(lastFile);
    }
    callback();
  });
}
```

This would have been simpler if the stream didn’t have to do something with all the files. But even then, this is a lot of boilerplate code even for the simplest operations. And it isn’t very readable either.

How would one implement this kind of processing in modern JavaScript? That’s actually what [generators](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Iterators_and_Generators) are for: they could receive some iterable as parameter, then process it and yield as many resulting files as needed. Something like this:

```js
import {MemoryFile} from "builder";

function* concat(files, targetFileName)
{
  let result = [];

  // Retrieve contents of incoming files
  for (let file of files)
    result.push(file.contents);

  // Produce resulting file
  yield new MemoryFile(targetFileName, result.join("\n"));
}
```

Except that this isn’t quite as easy: what about asynchronous operations? What if we need to read in files first? Luckily, nowadays [asynchronous iteration](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/asyncIterator) is supported as well:

```js
import {MemoryFile} from "builder";

async function* concat(files, targetFileName)
{
  let result = [];

  // Retrieve contents of incoming files
  for await (let file of files)
  {
    // Make sure the file is read into memory
    file = await file.read();
    result.push(file.contents);
  }

  // Produce resulting file
  yield new MemoryFile(targetFileName, result.join("\n"));
}
```

So this is an async generator function now. It uses `for await…of` loop instead of the usual `for…of`. And it needs to wait for the `file.read()` call. And that’s in fact all the changes needed, this is a working processor function for my build system already.

## Improving tasks

The tasks API of gulp is pretty straightforward. Tasks are exports of your build file. You call [gulp.src()](https://gulpjs.com/docs/en/api/src) and then pipe whatever files you get into other handlers. Last handler is usually [gulp.dest()](https://gulpjs.com/docs/en/api/dest) that will write the results to disk. Something like this:

```js
function eslintTask()
{
  return gulp.src("scripts/**/*.js")
             .pipe(eslint());
}
export {eslintTask as eslint};

export function scripts()
{
  return gulp.src("scripts/**/*.js")
             .pipe(concat("main.js"))
             .pipe(gulp.dest("assets"));
}

export default series(eslintTask, scripts);
```

This has three exported tasks: `eslint` will check the scripts. `scripts` will actually process them by concatting and writing the results into the `assets` directory. And `default` is the default task, first running `eslint` and then `scripts` task. Seems simple enough, what’s there to improve beyond simplifying the handlers?

I’ve changed some minor details of the API. But the major change is that tasks don’t have to return just one result. They can return an array with multiple results, something that with gulp requires using [merge-stream package](https://www.npmjs.com/package/merge-stream). Or tasks could even be JavaScript generators themselves, asynchronously yielding files. They could even be generators yielding arrays. The build system doesn’t care because it uses the following function on the task result to flatten it into a single generator:

```js
async function* flatten(input)
{
  // Resolve promises if input is one
  input = await input;

  if (input)
  {
    if (isIterable(input))
    {
      // Iterate asynchronously and process all values recursively
      for await (let entry of input)
        yield* flatten(entry);
    }
    else
    {
      // Plain value, yield directly
      yield input;
    }
  }
}
```

There is in fact one more big change: the task result is no longer wasted. When `series()` is used to run tasks consecutively, the result of the previous task will be passed as parameter to the next one. And this means that calling `dest()` to write out results to disk at the end of a task isn’t always necessary. You could rather continue processing the same files in the next task. So my version of the build file above looks as follows:

```js
function eslintTask()
{
  return this.src("scripts/**/*.js")
             .pipe(eslint);
}
export {eslintTask as eslint};

export let scripts = series(eslintTask, function(files)
{
  return files.pipe(concat, "main.js")
              .dest("assets");
});

export default scripts;
```

Note how there is only one call to `src()` here. The `eslint` task already collects all the JavaScript files, so the `scripts` task running after it merely reuses this collection. This looks like no big deal here, but it actually simplifies my build logic considerably. All the sudden one task can generate the files that would go either into a task writing them out to disk or another creating a ZIP archive from them. Not only is this often faster, not generating release ZIP files from the development environment means no accidental packing up temporary files that happen to be there.

## Adding some helpers

When it comes to built-in functionality, gulp is a very minimalist library: other than task management, you’ve only got `src()` to collect files, `dest()` to write them to disk and `watch()` to detect changes to your sources. Everything else relies on third-party tools. I’d say that this has some awkward side-effects on the way build files are written.

Look at cleaning up for example. Gulp documentation recommends using [del package](https://www.npmjs.com/package/del) to remove files which is weird because this package isn’t based on streams at all and rather uses promises instead. So while efficient, this approach feels quite alien. The `rm()` helper I added instead integrates nicely into the overall concept:

```js
export function clean()
{
  return this.src("assets/**")
             .rm();
}
```

There is twist here: `src()` only returns files, no directories. So `rm()` makes sure to check parent directories of removed files and removes these if empty.

Another gap in gulp APIs is file renaming. I have the suspicion that renaming being complicated is the reason behind gulp’s counterintuitive glob handling. This isn’t really documented but `src("scripts/**/*.js")` will remove the common parent directory (here `scripts/`) from the file paths. So you have to call `dest("assets/scripts")` later if you still want this directory to be part of the path. Presumably, this is just in case you want these files in `assets/js/` instead.

I have a built-in `rename()` helper that solves this issue explicitly. If I want `lib/reloader.js` to be named `reloader.js` in the build, this is how I do it:

```js
export function reloader()
{
  // Writes assets/reloader.js, not assets/lib/reloader.js
  return this.src("lib/reloader.js")
             .rename("reloader.js")
             .dest("assets");
}
```

And if the `scripts` directory has to be called `js` in the build, this is easy as well:

```js
export function reloader()
{
  // Copies scripts/ui/main.js into assets/js/ui/main.js, not assets/scripts/ui/main.js
  return this.src("scripts/**/*.js")
             .rename(path => path.replace(/^scripts/, "js"))
             .dest("assets");
}
```

## Where to get this?

A disclaimer first: this is merely a concept. It has been tailored towards my use case and works great for it, but your use case is probably different. Yet I have no plans to maintain this solution beyond my own needs.

Sounds acceptable to you? Or would you even be interested in forking and maintaining this project? You find it [here](https://github.com/palant/builder/), have fun!

If you want to see a less trivial build config, my [PfP project](https://github.com/palant/pfp/) uses it. With a larger `build.js` file and a number of helpers to integrate third-party tools in the `build/` directory.
