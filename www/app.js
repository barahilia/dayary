import angular from 'angular';
import '@uirouter/angularjs';

import { configApp } from './configApp.js';
import { runApp } from './runApp.js';
import { encryptionService } from './encryptionService.js';
import { lockService } from './lockService.js';
import { lockCtrl } from './lockCtrl.js';
import { bannerCtrl } from './bannerCtrl.js';
import { errorService } from './errorService.js';
import { settingsService } from './settingsService.js';
import { settingsCtrl } from './settingsCtrl.js';
import { dropboxService } from './dropboxService.js';
import { dropboxCtrl } from './dropboxCtrl.js';
import { syncService } from './syncService.js';
import { dbService } from './dbService.js';
import { yearsCtrl } from './yearsCtrl.js';
import { recordsCtrl } from './recordsCtrl.js';
import { viewerCtrl } from './viewerCtrl.js';
import { editorCtrl } from './editorCtrl.js';
import { scrollIfClass } from './scrollIfClass.js';

angular.module("app", ['ui.router'])
    .config(configApp)
    .run(runApp)
    .factory("encryptionService", encryptionService)
    .factory("lockService", lockService)
    .controller("lockCtrl", lockCtrl)
    .controller("bannerCtrl", bannerCtrl)
    .factory("errorService", errorService)
    .factory("settingsService", settingsService)
    .controller("settingsCtrl", settingsCtrl)
    .factory("dropboxService", dropboxService)
    .controller("dropboxCtrl", dropboxCtrl)
    .factory("syncService", syncService)
    .factory("dbService", dbService)
    .controller("yearsCtrl", yearsCtrl)
    .controller("recordsCtrl", recordsCtrl)
    .controller("viewerCtrl", viewerCtrl)
    .controller("editorCtrl", editorCtrl)
    .directive("scrollIfClass", scrollIfClass)
    ;
