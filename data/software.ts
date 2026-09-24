export const categories = [
 ['pms','Property Management Systems','Reservations, rooms and everyday operations.','▦'],
 ['channel-managers','Channel Managers','Keep your availability in sync, everywhere.','⇄'],
 ['booking-engines','Booking Engines','Turn website visitors into direct guests.','⌘'],
 ['guest-messaging','Guest Messaging','Better conversations. Less repetition.','☏'],
 ['revenue-management','Revenue Management','Bring more clarity to your room rates.','↗'],
 ['housekeeping','Housekeeping','Keep rooms and teams ready for arrival.','✧'],
 ['direct-booking','Direct Booking','Build a guest relationship of your own.','⌂'],
 ['payments','Payments','Make getting paid part of a smooth stay.','▤'],
 ['crm','CRM','Keep useful guest context in one place.','◎'],
 ['website-builders','Website Builders','Give your property a welcoming home online.','▧'],
 ['marketing','Marketing Tools','Help the right guests discover your property.','◈'],
] as const;
export const propertyTypes = ['Small Hotel','Boutique Hotel','Guesthouse','Villa','Vacation Rental','Property Manager'];
export interface Software { slug: string; name: string; logo: string | null; description: string; website: string; startingPrice: string; freeTrial: string; bestFor: string; propertySize: string[]; propertyTypes: string[]; categories: string[]; affiliateLink: string | null; reviewUrl: string; comparisonUrls: string[]; tested: boolean; sample: boolean; }
export const software: Software[] = [
 { slug:'lodgify',name:'Lodgify',logo:null,description:'A sample research profile for operators exploring their reservation and direct-booking setup.',website:'https://www.lodgify.com',startingPrice:'Verify with vendor',freeTrial:'Check current availability',bestFor:'Researching a direct-booking-led workflow',propertySize:['1 Property','2–5 Properties'],propertyTypes:['Villa','Vacation Rental','Guesthouse'],categories:['pms','channel-managers','booking-engines','direct-booking','website-builders'],affiliateLink:null,reviewUrl:'/software/lodgify',comparisonUrls:['/comparisons/lodgify-vs-hostaway'],tested:false,sample:true },
 { slug:'hostaway',name:'Hostaway',logo:null,description:'A sample research profile for operators assessing the coordination of multiple properties.',website:'https://www.hostaway.com',startingPrice:'Request current quote',freeTrial:'Check current availability',bestFor:'Researching a multi-property workflow',propertySize:['6–20 Properties','20+ Properties'],propertyTypes:['Vacation Rental','Property Manager','Boutique Hotel','Small Hotel'],categories:['pms','channel-managers','guest-messaging','direct-booking'],affiliateLink:null,reviewUrl:'/software/hostaway',comparisonUrls:['/comparisons/lodgify-vs-hostaway'],tested:false,sample:true },
];
export const researchEntries = ['Reservation workspace','Availability sync','Website booking flow'];
export const comparisonSections = ['Pricing','PMS','Channel Management','Booking Engine','Direct Booking Website','Automation','Guest Messaging','Payments','Reporting','Mobile Experience','Support','Integrations','Best By Property Size','Final Considerations','Alternatives'];
export const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
