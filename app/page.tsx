import {Hero,CategorySection,LatestGuides,PropertySection,ToolsSection} from '@/components/home-sections';
import {Newsletter} from '@/components/forms';
import {metadata as makeMetadata} from '@/lib/site';
export const metadata=makeMetadata('Better software for better hospitality','Independent software guides, comparisons and calculators for small hotels, villas, guesthouses and vacation-rental operators.','/');
export default function Home(){return <><Hero/><CategorySection/><LatestGuides/><PropertySection/><ToolsSection/><Newsletter/></>;}
