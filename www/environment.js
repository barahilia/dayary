// The development page is the one the Vite dev server puts up, and that is a
// fixed address: `strictPort` in vite.config.js holds it on 3000, because
// Dropbox redirects back to that exact port. Anything else - the production
// site, a preview build, a copy on another host - is not it.
export var developmentHost = "localhost:3000";

export var isDevelopment = window.location.host === developmentHost;

// Written by hand in package.json alone; `define` in vite.config.js
// substitutes it here, for the dev server as much as for a build.
export var version = __APP_VERSION__;
