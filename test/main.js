// Registers the "app" angular module and pulls in angular itself.
import '../www/app.js';
// Provides the module() and inject() globals; needs window.angular in place.
import 'angular-mocks';

import './globals.js';

import './sync-db-spec.js';
import './lock-service-spec.js';
import './encryption-service-spec.js';
import './db-service-spec.js';
import './sync-service-spec.js';
