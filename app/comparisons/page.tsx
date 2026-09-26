import Link from 'next/link';
import {PageIntro,Arrow} from '@/components/ui';
import {metadata as makeMetadata} from '@/lib/site';
export const metadata=makeMetadata('Software comparisons','Compare hospitality software around property workflows, costs and operational requirements.','/comparisons');
export default function Comparisons(){return <div className="page-content"><PageIntro eyebrow="SIDE BY SIDE" title="The right fit. Not just more features.">Compare the questions that matter to your property, from your first direct booking to your next ten locations.</PageIntro><div className="callout"><span className="eyebrow">RESEARCH IN PROGRESS</span><h2>A comparison should explain the trade-offs.</h2><p>InnStack publishes comparisons only when the evidence is sufficient to explain meaningful differences without assigning unsupported winners.</p><Link className="text-link" href="/methodology">Read our methodology <Arrow/></Link></div></div>;}
