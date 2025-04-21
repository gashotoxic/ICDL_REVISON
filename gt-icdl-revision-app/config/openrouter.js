const OpenAI = require('openai');
require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1'
});

async function getHint(question) {
  try {
    const response = await openai.chat.completions.create({
      model: 'openai/gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that provides hints for ICDL exam questions.'
        },
        {
          role: 'user',
          content: `Provide a hint for this question: ${question}`
        }
      ],
      temperature: 0.7,
      max_tokens: 100
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error getting hint:', error);
    return null;
  }
}

module.exports = {
  getHint
};