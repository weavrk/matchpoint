/**
 * Brand logo mapping utility
 * Maps brand names to logo image paths
 */

// Import all brand logos
import logo7ForAllMankind from '../../../assets/brand-logos/7-for-all-mankind.png';
import logoAbercrombie from '../../../assets/brand-logos/abercrombie-and-fitch.png';
import logoAldo from '../../../assets/brand-logos/aldo.png';
import logoAllbirds from '../../../assets/brand-logos/allbirds.png';
import logoAllsaints from '../../../assets/brand-logos/allsaints.png';
import logoAloYoga from '../../../assets/brand-logos/alo-yoga.png';
import logoAnnTaylor from '../../../assets/brand-logos/ann-taylor.png';
import logoAnthropologie from '../../../assets/brand-logos/anthropologie.png';
import logoAriat from '../../../assets/brand-logos/ariat.png';
import logoArmaniExchange from '../../../assets/brand-logos/armani-exchange.png';
import logoBananaRepublic from '../../../assets/brand-logos/banana-republic.png';
import logoBurberry from '../../../assets/brand-logos/burberry.png';
import logoCalvinKlein from '../../../assets/brand-logos/calvin-klein.png';
import logoChanel from '../../../assets/brand-logos/chanel.png';
import logoCosmeticsCompanyStore from '../../../assets/brand-logos/cosmetics-company-store.png';
import logoDkny from '../../../assets/brand-logos/dkny.png';
import logoEberjey from '../../../assets/brand-logos/eberjey.png';
import logoElysewalker from '../../../assets/brand-logos/elysewalker.png';
import logoEsteeLauder from '../../../assets/brand-logos/estee-lauder.png';
import logoEverlane from '../../../assets/brand-logos/everlane.png';
import logoFaherty from '../../../assets/brand-logos/faherty.png';
import logoFilson from '../../../assets/brand-logos/filson.png';
import logoFollett from '../../../assets/brand-logos/follett.png';
import logoFossil from '../../../assets/brand-logos/fossil.png';
import logoFreePeople from '../../../assets/brand-logos/free-people.png';
import logoGap from '../../../assets/brand-logos/gap.png';
import logoGoldenGoose from '../../../assets/brand-logos/golden-goose.png';
import logoGuess from '../../../assets/brand-logos/guess.png';
import logoHoka from '../../../assets/brand-logos/hoka.png';
import logoHollister from '../../../assets/brand-logos/hollister.png';
import logoHuckberry from '../../../assets/brand-logos/huckberry.png';
import logoJCrew from '../../../assets/brand-logos/j-crew.png';
import logoJonnieO from '../../../assets/brand-logos/jonnie-o.png';
import logoKarlLagerfeld from '../../../assets/brand-logos/karl-lagerfeld.png';
import logoKateSpade from '../../../assets/brand-logos/kate-spade.png';
import logoKuhnRikon from '../../../assets/brand-logos/kuhn-rikon.png';
import logoLevis from '../../../assets/brand-logos/levis.png';
import logoLively from '../../../assets/brand-logos/lively.png';
import logoLongchamp from '../../../assets/brand-logos/longchamp.png';
import logoLuckyBrand from '../../../assets/brand-logos/lucky-brand.png';
import logoMac from '../../../assets/brand-logos/mac.png';
import logoMackage from '../../../assets/brand-logos/mackage.png';
import logoMadewell from '../../../assets/brand-logos/madewell.png';
import logoMarcJacobs from '../../../assets/brand-logos/marc-jacobs.png';
import logoMavi from '../../../assets/brand-logos/mavi.png';
import logoMcm from '../../../assets/brand-logos/mcm.png';
import logoOofos from '../../../assets/brand-logos/oofos.png';
import logoMichaelKors from '../../../assets/brand-logos/michael-kors.png';
import logoMizzenMain from '../../../assets/brand-logos/mizzenmain.png';
import logoNeimanMarcus from '../../../assets/brand-logos/neiman-marcus.png';
import logoNike from '../../../assets/brand-logos/nike.png';
import logoNordstrom from '../../../assets/brand-logos/nordstrom.png';
import logoNorthFace from '../../../assets/brand-logos/north-face.png';
import logoOldNavy from '../../../assets/brand-logos/old-navy.png';
import logoPacsun from '../../../assets/brand-logos/pacsun.png';
import logoPatagonia from '../../../assets/brand-logos/patagonia.png';
import logoPoloRalphLauren from '../../../assets/brand-logos/polo-ralph-lauren.png';
import logoPuma from '../../../assets/brand-logos/puma.png';
import logoRagAndBone from '../../../assets/brand-logos/rag-and-bone.png';
import logoReclectic from '../../../assets/brand-logos/reclectic.png';
import logoReiss from '../../../assets/brand-logos/reiss.png';
import logoRhone from '../../../assets/brand-logos/rhone.png';
import logoSabah from '../../../assets/brand-logos/sabah.png';
import logoSaks from '../../../assets/brand-logos/saks-fifth-avenue.png';
import logoSephora from '../../../assets/brand-logos/sephora.png';
import logoSezane from '../../../assets/brand-logos/sezane.png';
import logoSkechers from '../../../assets/brand-logos/skechers.png';
import logoSkims from '../../../assets/brand-logos/skims.png';
import logoShinola from '../../../assets/brand-logos/shinola.png';
import logoSplendid from '../../../assets/brand-logos/splendid.png';
import logoSteveMadden from '../../../assets/brand-logos/steve-madden.png';
import logoTecovas from '../../../assets/brand-logos/tecovas.png';
import logoTheory from '../../../assets/brand-logos/theory.png';
import logoTommyJohn from '../../../assets/brand-logos/tommy-john.png';
import logoTrueClassic from '../../../assets/brand-logos/true-classic.png';
import logoTrueReligion from '../../../assets/brand-logos/true-religion.png';
import logoUgg from '../../../assets/brand-logos/ugg.png';
import logoUltaBeauty from '../../../assets/brand-logos/ulta-beauty.png';
import logoUnderArmour from '../../../assets/brand-logos/under-armour.png';
import logoUniqlo from '../../../assets/brand-logos/uniqlo.png';
import logoUrbanOutfitters from '../../../assets/brand-logos/urban-outfitters.png';
import logoVans from '../../../assets/brand-logos/vans.png';
import logoVeraBradley from '../../../assets/brand-logos/vera-bradley.png';
import logoVeraWang from '../../../assets/brand-logos/vera-wang.png';
import logoVineyardVines from '../../../assets/brand-logos/vineyards-vines.png';
import logoVictoriasSecret from '../../../assets/brand-logos/victorias-secret.png';
import logoWarbyParker from '../../../assets/brand-logos/warby-parker.png';
import logoWolfAndShephard from '../../../assets/brand-logos/wolf-shepherd.png';
import logoZara from '../../../assets/brand-logos/zara.png';

// Map brand names to logos (case-insensitive matching)
const BRAND_LOGO_MAP: Record<string, string> = {
  '7 for all mankind': logo7ForAllMankind,
  'abercrombie': logoAbercrombie,
  'abercrombie & fitch': logoAbercrombie,
  'abercrombie and fitch': logoAbercrombie,
  'abercrombie-and-fitch': logoAbercrombie,
  'abercrombie fitch': logoAbercrombie,
  'aldo': logoAldo,
  'allbirds': logoAllbirds,
  'allsaints': logoAllsaints,
  'alo yoga': logoAloYoga,
  'alo': logoAloYoga,
  'ann taylor': logoAnnTaylor,
  'anthropologie': logoAnthropologie,
  'ariat': logoAriat,
  'armani exchange': logoArmaniExchange,
  'armani outlet': logoArmaniExchange,
  'banana republic': logoBananaRepublic,
  'burberry': logoBurberry,
  'calvin klein': logoCalvinKlein,
  'chanel': logoChanel,
  'cosmetics company store': logoCosmeticsCompanyStore,
  'dkny': logoDkny,
  'eberjey': logoEberjey,
  'elyse walker': logoElysewalker,
  'elysewalker': logoElysewalker,
  'estee lauder': logoEsteeLauder,
  'everlane': logoEverlane,
  'faherty': logoFaherty,
  'faherty secret shop': logoFaherty,
  'filson': logoFilson,
  'follett': logoFollett,
  'fossil': logoFossil,
  'free people': logoFreePeople,
  'gap': logoGap,
  'golden goose': logoGoldenGoose,
  'guess': logoGuess,
  'hoka': logoHoka,
  'hollister': logoHollister,
  'huckberry': logoHuckberry,
  'j. crew': logoJCrew,
  'j crew': logoJCrew,
  'jcrew': logoJCrew,
  'j. crew factory': logoJCrew,
  'j crew factory': logoJCrew,
  'jonnie-o': logoJonnieO,
  'jonnie o': logoJonnieO,
  'jonnieo': logoJonnieO,
  'karl lagerfeld': logoKarlLagerfeld,
  'kate spade': logoKateSpade,
  'kuhn rikon': logoKuhnRikon,
  'levis': logoLevis,
  "levi's": logoLevis,
  'lively': logoLively,
  'longchamp': logoLongchamp,
  'lucky brand': logoLuckyBrand,
  'mac': logoMac,
  'mac cosmetics': logoMac,
  'mackage': logoMackage,
  'madewell': logoMadewell,
  'marc jacobs': logoMarcJacobs,
  'mavi': logoMavi,
  'mavi jeans': logoMavi,
  'mcm': logoMcm,
  'mcm worldwide': logoMcm,
  'michael kors': logoMichaelKors,
  'michael kors outlet': logoMichaelKors,
  'mizzen+main': logoMizzenMain,
  'mizzen main': logoMizzenMain,
  'neiman marcus': logoNeimanMarcus,
  'nike': logoNike,
  'nordstrom': logoNordstrom,
  'north face': logoNorthFace,
  'the north face': logoNorthFace,
  'old navy': logoOldNavy,
  'oofos': logoOofos,
  'pacsun': logoPacsun,
  'patagonia': logoPatagonia,
  'polo ralph lauren': logoPoloRalphLauren,
  'ralph lauren': logoPoloRalphLauren,
  'ralph lauren factory store': logoPoloRalphLauren,
  'puma': logoPuma,
  'rag & bone': logoRagAndBone,
  'rag and bone': logoRagAndBone,
  'reclectic': logoReclectic,
  'reiss': logoReiss,
  'rhone': logoRhone,
  'sabah': logoSabah,
  'saks fifth avenue': logoSaks,
  'saks': logoSaks,
  'sephora': logoSephora,
  'sezane': logoSezane,
  'shinola': logoShinola,
  'skechers': logoSkechers,
  'skims': logoSkims,
  'splendid': logoSplendid,
  'steve madden': logoSteveMadden,
  'tecovas': logoTecovas,
  'theory': logoTheory,
  'tommy john': logoTommyJohn,
  'true classic': logoTrueClassic,
  'true religion': logoTrueReligion,
  'ugg': logoUgg,
  'ulta': logoUltaBeauty,
  'ulta beauty': logoUltaBeauty,
  'under armour': logoUnderArmour,
  'uniqlo': logoUniqlo,
  'urban outfitters': logoUrbanOutfitters,
  'vans': logoVans,
  'vera bradley': logoVeraBradley,
  'vera wang': logoVeraWang,
  'vineyard vines': logoVineyardVines,
  'vineyards vines': logoVineyardVines,
  "victoria's secret": logoVictoriasSecret,
  'victorias secret': logoVictoriasSecret,
  'victorias-secret': logoVictoriasSecret,
  'victoria secret': logoVictoriasSecret,
  'warby parker': logoWarbyParker,
  'wolf & shepherd': logoWolfAndShephard,
  'wolf and shepherd': logoWolfAndShephard,
  'wolf & shephard': logoWolfAndShephard,
  'wolf and shephard': logoWolfAndShephard,
  'zara': logoZara,
};

/**
 * Get brand logo path from brand name
 * Returns undefined if no matching logo found
 */
export function getBrandLogo(brandName: string): string | undefined {
  if (!brandName) return undefined;
  const normalizedName = brandName.toLowerCase().trim();
  return BRAND_LOGO_MAP[normalizedName];
}

/**
 * Check if brand has a logo available
 */
export function hasBrandLogo(brandName: string): boolean {
  return getBrandLogo(brandName) !== undefined;
}
