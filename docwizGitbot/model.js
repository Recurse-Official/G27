const { OpenAI } = require('openai');
require('dotenv').config();

const token = process.env.OPENAI_KEY;
const endpoint = "https://models.inference.ai.azure.com";
const modelName = "gpt-4o-mini";

async function extractDocs(context) {

    const client = new OpenAI({ baseURL: endpoint, apiKey: token });

    try {
        const response = await client.chat.completions.create({
            messages: [
                { role: "system", content: context },
                {
                    role: "user", content: `Identify the language and framework used and generate API documentation for the given code in the following format:

Route: Specify the API endpoint (e.g., /example-route).
Method: Mention the HTTP method (e.g., GET, POST).
Description: Provide a concise explanation of the endpoint's purpose.
Body/Params: Use JSON format to list the expected request body or query parameters with descriptions.
Response Type and Sample Data: Specify the response type (e.g., application/json) and include a sample response in JSON format.
Ensure the format remains consistent across all endpoints. Give the whole response in plain text format without Markdown or special characters.`
                }
            ],
            temperature: 1.0,
            top_p: 1.0,
            max_tokens: 1000,
            model: modelName
        });

        if (response && response.choices && response.choices.length > 0) {
            const output = response.choices[0].message.content;
            const plainText = output.replace(/[\*]/g, '').trim();
            return plainText;
        } else {
            console.error("Error: No valid choices found in the response.");
        }

    } catch (error) {
        console.error("Error with the OpenAI API:", error);
    }
}

module.exports = { extractDocs };