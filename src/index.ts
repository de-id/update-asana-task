import * as core from '@actions/core';
import { QaStatus, updatePrTaskStatus } from './asana';
import env from 'env-var';

import {
    getPrDescription,
    getPrDescriptionsForProd,
    getPrNumber,
} from './github';

async function handleSinglePr(status: QaStatus) {
    try {
        const description = getPrDescription();
        await updatePrTaskStatus(description, status);
    } catch (err: any) {
        console.log(`PR number ${getPrNumber()} failed. ${err.message}`);
    }
}

async function handleInProd() {
    const descriptions = await getPrDescriptionsForProd();
    await Promise.all(
        descriptions.map(async description => {
            try {
                await updatePrTaskStatus(description, QaStatus.Prod);
            } catch (err: any) {
                console.log(
                    `PR number ${getPrNumber()} failed. ${err.message}`
                );
            }
        })
    );
}

async function run() {
    try {
        const isReview = core.getInput('is-review') !== 'false';
        const baseBranch = env.get('GITHUB_BASE_REF').required().asString();
        const isPrToStaging = ['master', 'main', 'staging'].includes(
            baseBranch
        );
        const isPrToProd = baseBranch === 'prod';

        if (isPrToStaging) {
            if (isReview) {
                await handleSinglePr(QaStatus.Review);
            } else {
                await handleSinglePr(QaStatus.Staging);
            }
        } else if (isPrToProd) {
            await handleInProd();
        }
    } catch (error: any) {
        core.setFailed(error.message);
    }
}

run();
