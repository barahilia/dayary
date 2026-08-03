// The specs still reach for these as globals, the way they did when every
// file was its own script tag. Kept as a shim until the specs move to a
// module-aware runner.
import Q from 'q';

import { dbService } from '../www/dbService.js';
import { syncService } from '../www/syncService.js';

window.Q = Q;
window.dbService = dbService;
window.syncService = syncService;
