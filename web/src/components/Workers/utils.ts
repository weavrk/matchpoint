import type { RetailerQuote } from '../../types';

/**
 * Generate a unique AI-style summary from retailer quotes
 * Uses worker name as a seed to ensure variety across workers
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

  // Define all possible opening sentences with their triggers
  const openings: { trigger: (text: string) => boolean; sentence: string }[] = [
    { trigger: (t) => t.includes('five steps ahead') || t.includes('initiative') || t.includes('before i can ask'),
      sentence: `${firstName} is the type of worker who anticipates what needs to be done before being asked.` },
    { trigger: (t) => t.includes('energy') || t.includes('spirit') || t.includes('contagious'),
      sentence: `${firstName} brings an energy to the floor that elevates the entire team.` },
    { trigger: (t) => t.includes('professional') || t.includes('polite') || t.includes('brand ambassador'),
      sentence: `${firstName} represents the brand with professionalism that stands out to retailers.` },
    { trigger: (t) => t.includes('hustle') || t.includes('never stops') || t.includes('circles around'),
      sentence: `${firstName} is known for relentless work ethic that keeps the floor running smoothly.` },
    { trigger: (t) => t.includes('customer') || t.includes('client') || t.includes('greet'),
      sentence: `${firstName} has a natural ability to connect with customers that retailers notice immediately.` },
    { trigger: (t) => t.includes('quick to learn') || t.includes('eager'),
      sentence: `${firstName} picks things up quickly and is always eager to contribute.` },
  ];

  // Define all possible middle sentences with their triggers
  const middles: { trigger: (text: string) => boolean; sentence: string }[] = [
    { trigger: (t) => t.includes('greet') || t.includes('welcome') || t.includes('comfortable'),
      sentence: `Managers highlight how ${firstName} makes customers feel welcomed from the moment they walk in.` },
    { trigger: (t) => t.includes('busy') || t.includes('finding') || t.includes('restocking') || t.includes('displays'),
      sentence: `When things slow down, ${firstName} finds productive work without needing direction.` },
    { trigger: (t) => t.includes('direction') || t.includes('coaching') || t.includes('feedback'),
      sentence: `${firstName} takes feedback professionally and applies it immediately.` },
    { trigger: (t) => t.includes('team') || t.includes('collaborate') || t.includes('tone'),
      sentence: `Multiple managers note that ${firstName} elevates the performance of the whole team.` },
    { trigger: (t) => t.includes('sale') || t.includes('conversion') || t.includes('close'),
      sentence: `${firstName} has strong sales instincts and consistently delivers results.` },
    { trigger: (t) => t.includes('bilingual') || t.includes('international'),
      sentence: `Language skills make ${firstName} especially valuable with diverse clientele.` },
    { trigger: (t) => t.includes('visual') || t.includes('floor') || t.includes('organization'),
      sentence: `${firstName} has a sharp eye for floor presentation and visual details.` },
    { trigger: (t) => t.includes('jump') || t.includes('right in') || t.includes('no problem'),
      sentence: `${firstName} hits the ground running and integrates seamlessly into any team.` },
    { trigger: (t) => t.includes('fast') || t.includes('quick') || t.includes('efficient'),
      sentence: `Speed and efficiency are standout qualities that managers appreciate.` },
    { trigger: (t) => t.includes('trust') || t.includes('recommend') || t.includes('knowledge'),
      sentence: `Customers trust ${firstName}'s product recommendations and expertise.` },
    { trigger: (t) => t.includes('management') || t.includes('lead') || t.includes('example'),
      sentence: `Several retailers see leadership potential and management readiness.` },
    { trigger: (t) => t.includes('pleasure') || t.includes('joy') || t.includes('love having'),
      sentence: `Store teams genuinely enjoy working alongside ${firstName}.` },
    { trigger: (t) => t.includes('hardest') || t.includes('working') || t.includes('improve'),
      sentence: `${firstName} consistently goes above and beyond what's expected.` },
    { trigger: (t) => t.includes('connection') || t.includes('rapport') || t.includes('fit right in'),
      sentence: `${firstName} builds genuine rapport with both customers and team members.` },
    { trigger: (t) => t.includes('positive') || t.includes('solution') || t.includes('attitude'),
      sentence: `A positive attitude and solution-oriented mindset make ${firstName} a standout.` },
  ];

  // Alternate sentence templates that don't rely on keyword matching
  const alternateOpenings = [
    `${firstName} consistently receives standout feedback from store managers.`,
    `Retailers describe ${firstName} as exactly the type of worker they want on their team.`,
    `${firstName}'s track record speaks for itself across ${brandCount} different brands.`,
    `Store managers are quick to highlight ${firstName}'s contributions to the floor.`,
    `${firstName} has earned a reputation for reliability and strong performance.`,
    `Across ${brandCount} brands, ${firstName} has made a lasting impression on retailers.`,
  ];

  const alternateMiddles = [
    `Managers appreciate how ${firstName} approaches each shift with dedication.`,
    `${firstName} demonstrates the kind of work ethic that retailers actively seek out.`,
    `Feedback consistently mentions ${firstName}'s positive impact on store operations.`,
    `${firstName} adapts quickly to different store environments and expectations.`,
    `Retailers value ${firstName}'s consistency and professionalism on the floor.`,
    `${firstName} brings a level of engagement that customers and managers notice.`,
  ];

  const sentences: string[] = [];

  // Find matching opening, or use alternate based on name hash
  const matchingOpening = openings.find(o => o.trigger(quoteText));
  if (matchingOpening && variant < 3) {
    sentences.push(matchingOpening.sentence);
  } else {
    // Use alternate opening based on name hash for variety
    sentences.push(alternateOpenings[variant]);
  }

  // Find matching middles
  const matchingMiddles = middles.filter(m => m.trigger(quoteText)).map(m => m.sentence);

  // Shuffle matching middles based on name hash for variety
  const shuffledMiddles = [...matchingMiddles].sort((a, b) => {
    const aHash = a.charCodeAt(0) + nameHash;
    const bHash = b.charCodeAt(0) + nameHash;
    return (aHash % 7) - (bHash % 7);
  });

  // Add middle sentences (prefer shuffled matches, fall back to alternates)
  if (shuffledMiddles.length > 0) {
    sentences.push(shuffledMiddles[0]);
  } else {
    sentences.push(alternateMiddles[variant]);
  }

  // Add more middles if needed for longer summaries
  if (maxSentences > 2) {
    for (let i = 1; i < shuffledMiddles.length && sentences.length < maxSentences - 1; i++) {
      sentences.push(shuffledMiddles[i]);
    }
    // Fill with alternates if needed
    for (let i = 0; sentences.length < maxSentences - 1 && i < alternateMiddles.length; i++) {
      const alt = alternateMiddles[(variant + i + 1) % alternateMiddles.length];
      if (!sentences.includes(alt)) {
        sentences.push(alt);
      }
    }
  }

  // Closing sentence based on sentiment or brand count
  if (quoteText.includes('would love') || quoteText.includes('back anytime') || quoteText.includes('would not mind having')) {
    sentences.push(`The consistent feedback: retailers want ${firstName} back.`);
  } else if (quoteText.includes('outstanding') || quoteText.includes('exceptional') || quoteText.includes('best')) {
    sentences.push(`${firstName} is regularly described as one of the strongest workers retailers have seen.`);
  } else if (brandCount >= 4 && maxSentences > 2) {
    sentences.push(`With positive feedback from ${brandCount} different retailers, ${firstName} has proven adaptable across brands.`);
  }

  // Limit to maxSentences
  return sentences.slice(0, maxSentences).join(' ');
}
