const { OpenAI } = require('openai');
require('dotenv').config();

const token = process.env.OPENAI_KEY;
const endpoint = "https://models.inference.ai.azure.com";
const modelName = "gpt-4o-mini";

async function main(context) {

    const client = new OpenAI({ baseURL: endpoint, apiKey: token });

    try {
        const response = await client.chat.completions.create({
            messages: [
                { role: "system", content: context },
                {
                    role: "user", content: `Generate API documentation for the given code in the following format:

Route: Specify the API endpoint (e.g., /example-route).
Method: Mention the HTTP method (e.g., GET, POST).
Description: Provide a concise explanation of the endpoint's purpose.
Body/Params: Use JSON format to list the expected request body or query parameters with descriptions.
Response Type and Sample Data: Specify the response type (e.g., application/json) and include a sample response in JSON format.
Ensure the format remains consistent across all endpoints. Give the whole response simple JSON format`
                }
            ],
            temperature: 1.0,
            top_p: 1.0,
            max_tokens: 1000,
            model: modelName
        });

        if (response && response.choices && response.choices.length > 0) {
            return response.choices[0].message.content
        } else {
            console.error("Error: No valid choices found in the response.");
        }

    } catch (error) {
        console.error("Error with the OpenAI API:", error);
    }
}

module.exports = { main };