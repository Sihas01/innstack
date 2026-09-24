import type {MetadataRoute} from 'next';
import {site} from '@/lib/site';
import {getGuides} from '@/lib/content';
import {software,propertyTypes,slugify} from '@/data/software';
import {pages} from '@/data/pages';
export const dynamic='force-static';
export default function sitemap():MetadataRoute.Sitemap {return ['','software','guides','comparisons','tools',...Object.keys(pages),...software.map(s=>`software/${s.slug}`),...getGuides().map(g=>`guides/${g.slug}`),'comparisons/lodgify-vs-hostaway',...propertyTypes.map(p=>`property-types/${slugify(p)}`),...['ota-commission','direct-booking-savings','occupancy','adr','revpar'].map(t=>`tools/${t}-calculator`)].map(p=>({url:`${site.url}/${p}${p?'/':''}`}));}
