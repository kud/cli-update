// Entry of the process notify() spawns. React picks its development or
// production build from NODE_ENV the moment it is first imported, and static
// imports are hoisted, so the default has to be set here, before the app (and
// with it React and Ink) is loaded dynamically. The development build roughly
// doubles Ink's CPU per frame; an explicit NODE_ENV is still honoured, so
// `NODE_ENV=development` keeps dev mode available locally.
process.env.NODE_ENV ??= "production"

// A computed specifier keeps the bundler from inlining banner-app, which would
// hoist its React and Ink imports above the line that sets NODE_ENV.
await import(new URL("./banner-app.js", import.meta.url).href)
