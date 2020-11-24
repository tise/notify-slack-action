import * as core from '@actions/core'
import {IncomingWebhook} from '@slack/webhook'

async function run(): Promise<void> {
    const webhook = new IncomingWebhook(
        core.getInput('webhook', {required: true})
    )
    const actor = core.getInput('actor') || process.env.GITHUB_ACTOR

    const subject = core.getInput('subject')
    const event = core.getInput('event')
    const mention = core.getInput('mention')

    const repoUrl = `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}`
    const runUrl = `${repoUrl}/actions/runs/${process.env.GITHUB_RUN_ID}`
    const commitUrl = `${repoUrl}/commit/${process.env.GITHUB_SHA}`

    const ref = process.env.GITHUB_REF?.replace('refs/heads/', '')

    const title =
        subject && event
            ? [
                  `<${runUrl}|${subject}>`,
                  `${event}`,
                  ...(core.getInput('include_ref') === 'true'
                      ? [`on`, `\`<${commitUrl}|${ref}>\``]
                      : []),
                  ...(mention ? [`<!${mention}>`] : [])
              ].join(' ')
            : core.getInput('title')
    const message = core.getInput('message')
    const footer = core.getInput('footer')

    const text = [
        ...(title ? [`*${title}*`] : []),
        ...(message ? [message] : [])
    ].join('\n')

    await webhook.send({
        username: core.getInput('username'),
        icon_emoji: core.getInput('icon_emoji') || undefined,
        channel: core.getInput('channel') || undefined,
        unfurl_links: false,
        attachments: [
            {
                // fallback: '', TODO
                color: core.getInput('color'),
                author_name: actor,
                author_link: `${process.env.GITHUB_SERVER_URL}/${actor}`,
                author_icon: `${process.env.GITHUB_SERVER_URL}/${actor}.png?size=32`,
                footer:
                    footer || `<${repoUrl}|${process.env.GITHUB_REPOSITORY}>`,
                footer_icon: footer
                    ? undefined
                    : 'https://github.githubassets.com/favicon.ico',
                fields: [
                    {
                        title: undefined as any, // This isn't required according to API spec
                        value: text,
                        short: false
                    }
                ]
            }
        ]
    })
}

;(async () => {
    try {
        run()
    } catch (error) {
        core.setFailed(error.message)
    }
})()
