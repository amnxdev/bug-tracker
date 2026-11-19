import { GoogleGenAI } from '@google/genai';

// Initialize Gemini client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * AI Triage: Suggests priority, generates tags, and enhances description
 * This addresses the paper's core gap: lack of AI-assisted bug triage
 * in modern bug tracking systems.
 */
export const triageBug = async (title, description) => {
  try {
    const prompt = `You are an expert software engineering bug triage assistant.
Analyze this bug report and return a JSON object with:
- "suggestedPriority": one of "low", "medium", or "high"
- "tags": an array of 2-4 short category tags (e.g., "ui", "auth", "performance", "data-loss", "crash", "security")
- "enhancedDescription": a clearer, more structured version of the description (keep it concise, max 2 sentences). If no description was provided, generate a brief one based on the title.
- "reasoning": one sentence explaining why you chose that priority

Bug Title: ${title}
Bug Description: ${description || '(no description provided)'}

Respond ONLY with valid JSON, no markdown, no extra text.`;

    const interaction = await ai.interactions.create({
      model: 'gemini-4-hydrogen',
      input: prompt,
      store: false,
    });

    const rawText = interaction.output_text?.trim() || '';
    // Strip any accidental markdown code fences
    const jsonText = rawText.replace(/^```json?\s*/i, '').replace(/```\s*$/i, '').trim();
    const result = JSON.parse(jsonText);

    return {
      suggestedPriority: result.suggestedPriority || null,
      tags: Array.isArray(result.tags) ? result.tags : [],
      enhancedDescription: result.enhancedDescription || null,
      reasoning: result.reasoning || null,
    };
  } catch (err) {
    console.error('[AI Triage Error]', err.message);
    // Graceful degradation — never block bug creation if AI fails
    return {
      suggestedPriority: null,
      tags: [],
      enhancedDescription: null,
      reasoning: null,
    };
  }
};

/**
 * AI Duplicate Detection: Checks if a new bug is likely a duplicate
 * of existing open bugs in the same project.
 * Paper gap: manual duplicate detection is a known pain point.
 */
export const detectDuplicates = async (newTitle, newDescription, existingBugs) => {
  if (!existingBugs || existingBugs.length === 0) return [];

  try {
    const bugList = existingBugs
      .slice(0, 20) // Limit to 20 for token efficiency
      .map((b, i) => `[${i}] ID:${b._id} | Title: ${b.title} | Desc: ${b.description || 'none'}`)
      .join('\n');

    const prompt = `You are a bug deduplication expert. Given a NEW bug report and a list of EXISTING bugs in the same project, identify which existing bugs are likely duplicates of the new one.

NEW BUG:
Title: ${newTitle}
Description: ${newDescription || '(none)'}

EXISTING BUGS:
${bugList}

Return a JSON array of objects for bugs that are likely duplicates (similarity > 70%). Each object: {"index": <number>, "id": "<bug id>", "title": "<bug title>", "similarity": "<percentage>", "reason": "<one sentence>"}

If no duplicates found, return an empty array [].
Respond ONLY with valid JSON.`;

    const interaction = await ai.interactions.create({
      model: 'gemini-4-hydrogen',
      input: prompt,
      store: false,
    });

    const rawText = interaction.output_text?.trim() || '[]';
    const jsonText = rawText.replace(/^```json?\s*/i, '').replace(/```\s*$/i, '').trim();
    const result = JSON.parse(jsonText);
    return Array.isArray(result) ? result : [];
  } catch (err) {
    console.error('[AI Duplicate Detection Error]', err.message);
    return [];
  }
};
