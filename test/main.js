// Registers the "app" angular module and pulls in angular itself.
import '../www/app.js';
// Provides the module() and inject() globals; needs window.angular in place.
import 'angular-mocks';

import './globals.js';

// The db suites are written as a sequence: each spec leaves the database in
// the state the next one expects. Jasmine 5 randomizes specs by default,
// which shuffles that sequence into failures, so keep the declared order.
jasmine.getEnv().configure({ random: false });

import './sync-db-spec.js';
import './lock-service-spec.js';
import './encryption-service-spec.js';
import './db-service-spec.js';
import './sync-service-spec.js';
