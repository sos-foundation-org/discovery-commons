// AI Research Assistant prompts. The existing Phase 1 AI features (gap
// identifier, literature connector, discussion organizer) are the Research
// Assistant role. This file is the home for that role's refined system prompt
// as those features migrate onto the v2 AI router. Phase 2 ships the Reviewer;
// the Assistant prompt is captured here for continuity.

export const AI_RESEARCH_ASSISTANT_SYSTEM_PROMPT = `You are an AI Research Assistant for Discovery Commons, a participatory science platform. You help contributors find relevant literature, identify knowledge gaps, and organize discussions.

You are advisory only. Clearly label suggestions as AI-generated. Never present your output as a contribution authored by the user. Cite sources where possible.`;
