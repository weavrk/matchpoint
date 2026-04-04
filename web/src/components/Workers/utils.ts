import type { RetailerQuote } from '../../types';

/**
 * Generate a unique AI-style summary from retailer quotes
 * Uses worker name as a seed to ensure variety across workers
 * Alternates between named and generic sentences to avoid repetition
 * @param firstName - Worker's first name
 * @param quotes - Array of retailer quotes
 * @param maxSentences - Maximum number of sentences (default 2 for teaser, use 5 for full)
 */
export function generateQuoteSummary(firstName: string, quotes: RetailerQuote[], maxSentences: number = 2): string {
  const quoteText = quotes.map(q => q.quote.toLowerCase()).join(' ');
  const brandCount = new Set(quotes.map(q => q.brand)).size;

  // Use name to create variety - simple hash based on char codes
  const nameHash = firstName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const variant = nameHash % 6;

  // Sentences WITH the name (used for first sentence)
  const namedSentences: string[] = [];
  // Sentences WITHOUT the name (used for follow-up to avoid repetition)
  const genericSentences: string[] = [];

  // Named opening sentences (triggers)
  if (quoteText.includes('five steps ahead') || quoteText.includes('initiative') || quoteText.includes('before i can ask')) {
    namedSentences.push(`${firstName} is the type of worker who anticipates what needs to be done before being asked.`);
  }
  if (quoteText.includes('energy') || quoteText.includes('spirit') || quoteText.includes('contagious')) {
    namedSentences.push(`${firstName} brings an energy to the floor that elevates the entire team.`);
  }
  if (quoteText.includes('professional') || quoteText.includes('polite') || quoteText.includes('brand ambassador')) {
    namedSentences.push(`${firstName} represents the brand with professionalism that stands out to retailers.`);
  }
  if (quoteText.includes('hustle') || quoteText.includes('never stops') || quoteText.includes('circles around')) {
    namedSentences.push(`${firstName} is known for a relentless work ethic that keeps the floor running smoothly.`);
  }
  if (quoteText.includes('customer') || quoteText.includes('client')) {
    namedSentences.push(`${firstName} has a natural ability to connect with customers that retailers notice immediately.`);
  }
  if (quoteText.includes('quick to learn') || quoteText.includes('eager')) {
    namedSentences.push(`${firstName} picks things up quickly and is always eager to contribute.`);
  }

  // Generic follow-up sentences (no name)
  if (quoteText.includes('greet') || quoteText.includes('welcome') || quoteText.includes('comfortable')) {
    genericSentences.push('Managers highlight how customers feel welcomed from the moment they walk in.');
  }
  if (quoteText.includes('busy') || quoteText.includes('finding') || quoteText.includes('restocking') || quoteText.includes('displays')) {
    genericSentences.push('When things slow down, productive work gets done without needing direction.');
  }
  if (quoteText.includes('direction') || quoteText.includes('coaching') || quoteText.includes('feedback')) {
    genericSentences.push('Feedback is taken professionally and applied immediately.');
  }
  if (quoteText.includes('team') || quoteText.includes('collaborate') || quoteText.includes('tone')) {
    genericSentences.push('Multiple managers note the positive impact on the whole team.');
  }
  if (quoteText.includes('sale') || quoteText.includes('conversion') || quoteText.includes('close')) {
    genericSentences.push('Strong sales instincts consistently deliver results.');
  }
  if (quoteText.includes('visual') || quoteText.includes('floor') || quoteText.includes('organization')) {
    genericSentences.push('A sharp eye for floor presentation and visual details stands out.');
  }
  if (quoteText.includes('fast') || quoteText.includes('quick') || quoteText.includes('efficient')) {
    genericSentences.push('Speed and efficiency are standout qualities that managers appreciate.');
  }
  if (quoteText.includes('management') || quoteText.includes('lead') || quoteText.includes('example')) {
    genericSentences.push('Several retailers see leadership potential and management readiness.');
  }
  if (quoteText.includes('pleasure') || quoteText.includes('joy') || quoteText.includes('love having')) {
    genericSentences.push('Store teams genuinely enjoy having this kind of energy on the floor.');
  }
  if (quoteText.includes('positive') || quoteText.includes('solution') || quoteText.includes('attitude')) {
    genericSentences.push('A positive attitude and solution-oriented mindset make for a standout worker.');
  }

  // Alternate named sentences (fallbacks)
  const alternateNamed = [
    `${firstName} consistently receives standout feedback from store managers.`,
    `Retailers describe ${firstName} as exactly the type of worker they want on their team.`,
    `${firstName}'s track record speaks for itself across ${brandCount} different brands.`,
    `Store managers are quick to highlight ${firstName}'s contributions to the floor.`,
    `${firstName} has earned a reputation for reliability and strong performance.`,
    `Across ${brandCount} brands, ${firstName} has made a lasting impression on retailers.`,
  ];

  // Alternate generic sentences (fallbacks)
  const alternateGeneric = [
    'Dedication and work ethic are consistently mentioned in feedback.',
    'The kind of reliability that retailers actively seek out.',
    'Feedback consistently mentions a positive impact on store operations.',
    'Quick adaptation to different store environments and expectations.',
    'Consistency and professionalism on the floor are highly valued.',
    'A level of engagement that customers and managers notice.',
  ];

  // Build result: first sentence with name, second without
  const result: string[] = [];

  // First sentence (with name)
  if (namedSentences.length > 0) {
    result.push(namedSentences[variant % namedSentences.length]);
  } else {
    result.push(alternateNamed[variant]);
  }

  // Second sentence (without name to avoid repetition)
  if (genericSentences.length > 0) {
    result.push(genericSentences[variant % genericSentences.length]);
  } else {
    result.push(alternateGeneric[variant]);
  }

  // Additional sentences if maxSentences > 2
  if (maxSentences > 2) {
    // Alternate: named, generic, named, generic...
    let useNamed = false; // Start with generic since we just did named
    for (let i = 2; i < maxSentences; i++) {
      if (useNamed && namedSentences.length > (i / 2)) {
        const idx = Math.floor(i / 2) % namedSentences.length;
        if (!result.includes(namedSentences[idx])) {
          result.push(namedSentences[idx]);
        }
      } else if (!useNamed && genericSentences.length > (i / 2)) {
        const idx = Math.floor(i / 2) % genericSentences.length;
        if (!result.includes(genericSentences[idx])) {
          result.push(genericSentences[idx]);
        }
      }
      useNamed = !useNamed;
    }
  }

  return result.slice(0, maxSentences).join(' ');
}
