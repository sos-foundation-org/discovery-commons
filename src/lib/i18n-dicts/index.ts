// Per-area dictionaries, merged over the core dictionary in src/lib/i18n.ts.
// Split by feature area so each file stays reviewable.
import type { DictSet } from "./types";
import { shared } from "./shared";
import { site } from "./site";
import { legal } from "./legal";
import { thread } from "./thread";
import { contribution } from "./contribution";
import { account } from "./account";
import { errors } from "./errors";

export const AREA_DICTS: DictSet[] = [shared, site, legal, thread, contribution, account, errors];
