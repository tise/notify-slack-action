"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const web_api_1 = require("@slack/web-api");
async function run() {
    const client = new web_api_1.WebClient(core.getInput('token', { required: true }));
    const actor = core.getInput('actor') || process.env.GITHUB_ACTOR;
    const subject = core.getInput('subject');
    const event = core.getInput('event');
    const mention = core.getInput('mention');
    const threaded_message = core.getInput('threaded_message');
    const repoUrl = `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}`;
    const runUrl = `${repoUrl}/actions/runs/${process.env.GITHUB_RUN_ID}`;
    const commitUrl = `${repoUrl}/commit/${process.env.GITHUB_SHA}`;
    const ref = process.env.GITHUB_REF?.replace('refs/heads/', '');
    const title = subject && event
        ? [
            `<${runUrl}|${subject}>`,
            `${event}`,
            ...(core.getInput('include_ref') === 'true' ? [`on`, `\`<${commitUrl}|${ref}>\``] : []),
            ...(mention ? [`<!${mention}>`] : []),
        ].join(' ')
        : core.getInput('title');
    const message = core.getInput('message');
    const footer = core.getInput('footer');
    const messageText = [...(title ? [`*${title}*`] : []), ...(message ? [message] : [])].join('\n');
    const inputText = core.getInput('plain_text_message');
    const response = await client.chat.postMessage({
        username: core.getInput('username'),
        icon_emoji: core.getInput('icon_emoji') || undefined,
        channel: core.getInput('channel'),
        unfurl_links: false,
        text: inputText || '',
        attachments: !inputText
            ? [
                {
                    color: core.getInput('color'),
                    author_name: actor,
                    author_link: `${process.env.GITHUB_SERVER_URL}/${actor}`,
                    author_icon: `${process.env.GITHUB_SERVER_URL}/${actor}.png?size=32`,
                    footer: footer || `<${repoUrl}|${process.env.GITHUB_REPOSITORY}>`,
                    footer_icon: footer ? undefined : 'https://github.githubassets.com/favicon.ico',
                    fields: [
                        {
                            title: undefined, // Slack weirdness
                            value: messageText,
                            short: false,
                        },
                    ],
                },
            ]
            : undefined,
    });
    if (threaded_message && response.ts) {
        await client.chat.postMessage({
            channel: core.getInput('channel'),
            text: threaded_message,
            thread_ts: response.ts,
        });
    }
}
(async () => {
    try {
        await run();
    }
    catch (error) {
        core.setFailed(JSON.stringify(error));
    }
})();
