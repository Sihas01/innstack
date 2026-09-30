import Link from 'next/link';
import {PageIntro,Arrow} from '@/components/ui';
import {calculatorInfo} from '@/data/calculators';
import {metadata as makeMetadata} from '@/lib/site';
export const metadata=makeMetadata('Free hospitality calculators','Calculate OTA commissions, direct booking savings, occupancy, ADR and RevPAR.','/tools');
export default function Tools(){return <div className="page-content"><PageIntro eyebrow="THE OPERATOR’S TOOLKIT" title="Put a number on it.">A few simple tools for clearer decisions. Free to use, with transparent assumptions and no account required.</PageIntro><div className="editorial-list">{Object.entries(calculatorInfo).map(([slug,t],i)=><Link key={slug} href={slug==='revpar-calculator'?'/revpar-calculator':`/tools/${slug}`}><span className="list-number">0{i+1}</span><div><span className="eyebrow muted">FREE CALCULATOR</span><h2>{t.name}</h2><p>{t.description}</p></div><Arrow/></Link>)}</div></div>;}

