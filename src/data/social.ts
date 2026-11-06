// Trekking Partners Nepal's own social profiles.
// These go into the Organization schema ("sameAs") so Google links the name
// "Trekking Partners Nepal" to this website rather than to other groups or forums.
// Fill in the page and Instagram links; empty ones are left out automatically.
export const social = {
  facebookGroup: 'https://www.facebook.com/groups/887606059135821',
  facebookPage: '', // e.g. https://www.facebook.com/trekkingpartnersnepal
  instagram: '',    // e.g. https://www.instagram.com/trekkingpartnersnepal
};

export const sameAs = Object.values(social).filter(Boolean);

const SITE = 'https://trekkingpartnersnepal.com';

// One shared Organization record, referenced from other pages by its @id.
export const organization = {
  '@type': 'Organization',
  '@id': `${SITE}/#organization`,
  name: 'Trekking Partners Nepal',
  alternateName: ['TPN', 'Trekking Partners'],
  url: `${SITE}/`,
  logo: `${SITE}/logo.jpg`,
  email: 'hello@trekkingpartnersnepal.com',
  description: 'A free platform for solo trekkers to find trekking partners in Nepal, run by the local team behind Discover Parbat.',
  areaServed: 'Nepal',
  sameAs,
  parentOrganization: { '@type': 'TravelAgency', name: 'Discover Parbat', url: 'https://discoverparbat.com' },
};
