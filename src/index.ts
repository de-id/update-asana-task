import * as core from '@actions/core';
import { QaStatus } from './asana';
import env from 'env-var';

import { getPrDescriptionsForProd } from './github';

async function run() {
    try {
        const baseBranch = env.get('GITHUB_BASE_REF').asString();
        const isProd = core.getInput('is-prod');

        console.log({ isProd, baseBranch });

        await getPrDescriptionsForProd();
    } catch (error: any) {
        core.setFailed(error.message);
    }
}

run();
