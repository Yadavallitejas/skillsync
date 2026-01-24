import { User } from '../types';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

export interface MatchResult {
    score: number;
    isAi: boolean;
}

/**
 * Calculate AI-enhanced compatibility score between two users using Gemini
 */
export async function calculateAIMatchScore(user1: User, user2: User): Promise<MatchResult> {
    if (!GEMINI_API_KEY) {
        console.warn('Gemini API key not configured, falling back to basic matching');
        return { score: calculateBasicMatchScore(user1, user2), isAi: false };
    }

    try {
        const prompt = `You are an expert at matching students based on their skills and learning goals.

User 1:
- Name: ${user1.name}
- Major: ${user1.major}
- Skills they can teach: ${user1.skillsOffered.join(', ')}
- Skills they want to learn: ${user1.skillsNeeded.join(', ')}

User 2:
- Name: ${user2.name}
- Major: ${user2.major}
- Skills they can teach: ${user2.skillsOffered.join(', ')}
- Skills they want to learn: ${user2.skillsNeeded.join(', ')}

Analyze how well these two students would match for peer learning. Consider:
1. Direct skill exchange (User 1 can teach what User 2 wants to learn and vice versa)
2. Complementary skills that could lead to collaborative learning
3. Similar majors or fields that might indicate shared interests
4. Overall potential for mutual benefit

Provide ONLY a numerical score from 0 to 100, where:
- 0-20: Poor match, minimal overlap
- 21-40: Weak match, some potential
- 41-60: Moderate match, decent compatibility
- 61-80: Good match, strong compatibility
- 81-100: Excellent match, highly compatible

Return only the number, nothing else.`;

        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.3,
                    maxOutputTokens: 10,
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.statusText}`);
        }

        const data = await response.json();
        const scoreText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

        if (!scoreText) {
            throw new Error('Invalid response from Gemini API');
        }

        const score = parseInt(scoreText);

        if (isNaN(score) || score < 0 || score > 100) {
            console.warn('Invalid score from Gemini, using basic matching');
            return { score: calculateBasicMatchScore(user1, user2), isAi: false };
        }

        return { score, isAi: true };
    } catch (error) {
        console.error('Error calculating AI match score:', error);
        return { score: calculateBasicMatchScore(user1, user2), isAi: false };
    }
}

/**
 * Basic fallback matching algorithm
 */
function calculateBasicMatchScore(user1: User, user2: User): number {
    let score = 0;

    // Direct skill exchange (highest weight)
    const user1CanTeachUser2 = user1.skillsOffered.filter(skill =>
        user2.skillsNeeded.some(need => need.toLowerCase().includes(skill.toLowerCase()))
    ).length;

    const user2CanTeachUser1 = user2.skillsOffered.filter(skill =>
        user1.skillsNeeded.some(need => need.toLowerCase().includes(skill.toLowerCase()))
    ).length;

    score += (user1CanTeachUser2 + user2CanTeachUser1) * 15;

    // Complementary skills
    const sharedOfferedSkills = user1.skillsOffered.filter(skill =>
        user2.skillsOffered.some(s => s.toLowerCase() === skill.toLowerCase())
    ).length;

    score += sharedOfferedSkills * 8;

    // Similar learning goals
    const sharedNeededSkills = user1.skillsNeeded.filter(skill =>
        user2.skillsNeeded.some(s => s.toLowerCase() === skill.toLowerCase())
    ).length;

    score += sharedNeededSkills * 10;

    // Same major bonus
    if (user1.major.toLowerCase() === user2.major.toLowerCase()) {
        score += 15;
    }

    // Normalize to 0-100
    return Math.min(100, score);
}

/**
 * Get AI-generated match explanation
 */
export async function getMatchExplanation(user1: User, user2: User, score: number): Promise<string> {
    if (!GEMINI_API_KEY) {
        return generateBasicExplanation(user1, user2, score);
    }

    try {
        const prompt = `Generate a brief, friendly explanation (2-3 sentences) of why these two students are a ${score >= 60 ? 'good' : 'potential'} match for peer learning:

User 1: ${user1.name} (${user1.major})
- Can teach: ${user1.skillsOffered.join(', ')}
- Wants to learn: ${user1.skillsNeeded.join(', ')}

User 2: ${user2.name} (${user2.major})
- Can teach: ${user2.skillsOffered.join(', ')}
- Wants to learn: ${user2.skillsNeeded.join(', ')}

Match Score: ${score}/100

Keep it concise and encouraging.`;

        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 100,
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.statusText}`);
        }

        const data = await response.json();
        const explanation = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

        return explanation || generateBasicExplanation(user1, user2, score);
    } catch (error) {
        console.error('Error getting match explanation:', error);
        return generateBasicExplanation(user1, user2, score);
    }
}

/**
 * Basic explanation generator
 */
function generateBasicExplanation(user1: User, user2: User, _score: number): string {
    const canTeach = user1.skillsOffered.filter(skill =>
        user2.skillsNeeded.some(need => need.toLowerCase().includes(skill.toLowerCase()))
    );

    if (canTeach.length > 0) {
        return `You can help ${user2.name} learn ${canTeach.join(', ')}, creating a great opportunity for peer learning!`;
    }

    if (user1.major === user2.major) {
        return `You both study ${user1.major}, which could lead to great collaboration opportunities!`;
    }

    return `You and ${user2.name} have complementary skills that could benefit both of you!`;
}
