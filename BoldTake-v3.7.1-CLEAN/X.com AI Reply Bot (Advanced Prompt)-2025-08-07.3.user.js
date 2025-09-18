// ==UserScript==
// @name         X.com AI Reply Bot (Advanced Prompt)
// @namespace    http://tampermonkey.net/
// @version      2025-08-07.3
// @description  Slowly finds tweets and uses an advanced OpenAI prompt to generate replies. USE WITH CAUTION.
// @author       You
// @match        https://x.com/*
// @match        https://twitter.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=x.com
// @connect      api.openai.com
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function() {
    'use strict';

    // --- CONFIGURATION ---
    // IMPORTANT: To set your key, open the browser console on any page and type:
    // GM_setValue('OPENAI_API_KEY', 'sk-YourSecretKeyHere');
    // Then reload the X.com page.
    const OPENAI_API_KEY = GM_getValue('OPENAI_API_KEY', '');

    // An array of keywords to look for in tweets. Use lowercase.
    const KEYWORDS_TO_FIND = ['productivity', 'business', 'marketing', 'systems'];

    // --- NEW PROMPT SETTINGS ---
    // Customize these parameters for the AI prompt.
    const TARGET_LANGUAGE = "English";
    const WRITING_STYLE = "Direct"; // e.g., "Direct", "Casual", "Formal"
    const TONE_SETTING = "Opinionated"; // e.g., "Opinionated", "Neutral", "Friendly"

    // --- TIMING AND SAFETY SETTINGS ---
    const CHECK_INTERVAL_MS = 60000; // 1 minute
    const MIN_POST_DELAY_MS = 300000; // 5 minutes
    const MAX_POST_DELAY_MS = 600000; // 10 minutes

    // --- END CONFIGURATION ---


    // --- SCRIPT LOGIC ---

    if (!OPENAI_API_KEY) {
        alert('OpenAI API Key is not set! Please set it using GM_setValue in the browser console.');
        return;
    }

    // Function to generate a random delay to seem more human
    function getRandomDelay() {
        return Math.floor(Math.random() * (MAX_POST_DELAY_MS - MIN_POST_DELAY_MS + 1)) + MIN_POST_DELAY_MS;
    }

    // Function to call OpenAI API with the new advanced prompt
    async function getAIReply(tweetText) {
        // Your new advanced prompt is now a template literal
        const fullPrompt = `Generate a direct and opinionated reply to the given context. The process is a sequence of sub-tasks. The final output must be only the generated reply text, with no other commentary.

Conversation Context:

${tweetText}

Parameters:

Target Language: ${TARGET_LANGUAGE}
Writing Style: ${WRITING_STYLE}
Tone Setting: ${TONE_SETTING}

Instructions:

Example of FORBIDDEN format:
""You're wrong—the only thing that matters is revenue.""

Example of CORRECT format:
""You're wrong.
The only thing that matters is revenue.""

CRITICAL FORMATTING: This rule is more important than anything else.

FORBIDDEN: You must not use any dashes (— or -), colons (:), or semicolons (;).

Confirm zero dashes, colons, or semicolons are used.

[Sub-Task 1: Data Extraction & Analysis]

Action: Analyze the [Selected Text].

Output: Populate the following variable.

var core_topic = (Identify the central topic or problem being discussed in the [Selected Text])

[Sub-Task 2: Strategy & Content Definition]

Action: Define the core content and format for the reply.

Output: Populate the following variables.

var line_count = (Choose one option: 3 or 4). This determines the exact number of lines in the final output.

var practical_hack = (Based on the core_topic, formulate a direct, opinionated, and actionable statement. This statement must reveal a simple system or a practical hack, reflecting a ""focus on what works"" mindset).

[Sub-Task 3: Content Generation]

Action: Generate the final reply text by executing the defined strategy.

Rules for Execution:

Goal: The reply must be a short, sharp, and strong statement that reveals a practical system or hack. It must be confident and free of corporate jargon.

Voice: The reply must be written in the first person (""I"").

Structure: The entire reply must consist only of the practical_hack, formatted to fit the exact number of lines specified in the line_count variable.

Formatting: The reply is FORBIDDEN from using any dashes (— or -), colons (:), or semicolons (;). Use hard line breaks (Enter) to separate ideas.

Language: The entire reply must be in the [Target Language].

Provide only the final reply text as output.`;

        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: "POST",
                url: "https://api.openai.com/v1/chat/completions",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${OPENAI_API_KEY}` },
                data: JSON.stringify({
                    "model": "gpt-4", // A complex prompt like this works best with GPT-4
                    "messages": [{ "role": "user", "content": fullPrompt }],
                    "temperature": 0.8
                }),
                onload: function(response) {
                    if (response.status >= 200 && response.status < 300) {
                        const result = JSON.parse(response.responseText);
                        resolve(result.choices[0].message.content);
                    } else {
                        console.error("OpenAI API Error:", response.statusText, response.responseText);
                        reject(response.statusText);
                    }
                },
                onerror: function(error) { console.error("OpenAI Request Error:", error); reject(error); }
            });
        });
    }

    // Function to simulate typing into a textbox
    function simulateTyping(element, text) {
        element.focus();
        element.innerHTML = text.replace(/\n/g, '<br>'); // Convert newlines to HTML breaks for the editor
        element.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // The main function that finds and processes tweets
    async function processTweets() {
        console.log("Checking for new tweets...");

        const tweets = document.querySelectorAll('article[data-testid="tweet"]');
        for (const tweet of tweets) {
            if (tweet.dataset.processed) continue;
            tweet.dataset.processed = 'true'; // Mark as processed immediately

            const tweetTextElement = tweet.querySelector('[data-testid="tweetText"]');
            if (!tweetTextElement) continue;

            const tweetText = tweetTextElement.innerText.toLowerCase();
            const hasKeyword = KEYWORDS_TO_FIND.some(keyword => tweetText.includes(keyword));

            if (hasKeyword) {
                console.log("Found a target tweet:", tweetTextElement.innerText);

                try {
                    const replyText = await getAIReply(tweetTextElement.innerText);
                    console.log("Generated Reply:", replyText);

                    // --- SELECTOR 3: REPLY BUTTON --- (UPDATED based on your screenshot!)
                    const replyButton = tweet.querySelector('div[data-testid="reply"]');
                    if (!replyButton) {
                        console.error("Could not find reply button. UPDATE THE SELECTOR.");
                        continue;
                    }
                    replyButton.click();

                    await new Promise(resolve => setTimeout(resolve, 2000));

                    const replyTextBox = document.querySelector('div.public-DraftStyleDefault-block');
                    const postButton = document.querySelector('button[data-testid="tweetButton"]');

                    if (replyTextBox && postButton && !postButton.disabled) {
                        simulateTyping(replyTextBox, replyText);
                        await new Promise(resolve => setTimeout(resolve, 500));

                        // UNCOMMENT THE LINE BELOW TO ENABLE AUTO-POSTING
                        // postButton.click();
                        console.log(`(Simulated Post) Wrote reply. Script will now pause.`);

                        alert(`SCRIPT PAUSED. It just replied to a tweet. It will resume in ${Math.round(getRandomDelay() / 60000)} minutes.`);
                        await new Promise(resolve => setTimeout(resolve, getRandomDelay()));
                        return;
                    } else {
                        console.error("Could not find reply textbox or post button. UPDATE SELECTORS.");
                    }
                } catch (error) { console.error("An error occurred during the reply process:", error); }
                return; // Stop after processing one tweet to be safe and slow
            }
        }
    }

    // Start the main loop
    console.log("X.com AI Reply Bot (Advanced) script loaded. Starting main loop...");
    setInterval(processTweets, CHECK_INTERVAL_MS);

})();