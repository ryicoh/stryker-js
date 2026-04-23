import { fileURLToPath, URL } from 'url';
import fs from 'fs';

import { deepFreeze } from '@ryicoh/util';

const pkg = deepFreeze(
  JSON.parse(
    fs.readFileSync(
      fileURLToPath(new URL('../../package.json', import.meta.url)),
      'utf-8',
    ),
  ) as {
    version: string;
    engines: { node: string };
  },
);

export const strykerVersion = pkg.version;
export const strykerEngines = pkg.engines;
