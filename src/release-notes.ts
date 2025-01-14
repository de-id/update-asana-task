import { getTaskDetailsFromPr } from './asana';
import { sendSlackMessage } from './slack';
import { getRepo, getPrLink } from './github';

export const handleReleaseNotes = async (
    descriptionAndPrNumberArray: any[],
    slackBotToken: string,
    slackBotChannelId: string,
    isMergeNotes: boolean
): Promise<void> => {
    try {
        const releaseNotes: string = await getReleaseNotesFromDescriptions(
            descriptionAndPrNumberArray,
            isMergeNotes
        );
        if (slackBotToken && slackBotChannelId) {
            await sendSlackMessage(
                releaseNotes,
                slackBotToken,
                slackBotChannelId
            );
        }
    } catch (e) {
        console.log('Failed to send release notes on pr to prod');
    }
};

const getReleaseNotesFromDescriptions = async (
    descriptionAndPrNumberArray: any[],
    isMergeNotes: boolean
): Promise<string> => {
    let taskDetailsFromAllDescriptions: { title: string; url: string }[] = [];
    console.log('descriptionAndPrNumberArray', descriptionAndPrNumberArray);
    await Promise.all(
        descriptionAndPrNumberArray.map(async ({ description }) => {
            try {
                const { taskUrls, taskTitleAndAssigneeArray } =
                    await getTaskDetailsFromPr(description);

                // Map titles and URLs into a structured format
                const taskDetails = taskUrls.map(
                    (url: string, index: number) => ({
                        title: taskTitleAndAssigneeArray[index]?.title,
                        url,
                    })
                );

                taskDetailsFromAllDescriptions = [
                    ...taskDetailsFromAllDescriptions,
                    ...taskDetails,
                ];
            } catch (error) {
                console.error(
                    'Failed to process description:',
                    description,
                    error
                );
            }
        })
    );

    if (taskDetailsFromAllDescriptions.length === 0) {
        return 'No Asana tickets were found in the provided descriptions.';
    }

    // Format task details for Slack (clickable titles with URLs)
    const formattedTaskDetails = taskDetailsFromAllDescriptions
        .map(
            ({ title, url }) => `<${url}|${title}>` // Slack format for clickable links
        )
        .join('\n');

    return `New release to ${getRepo()} is being ${
        isMergeNotes ? 'deployed right now 🚀' : 'cooked 👩‍🍳'
    }
    \n ${getPrLink()}
    \n those are the Asana tickets included:\n${formattedTaskDetails}\n<!subteam^S05SL1L1XE2>`;
};
