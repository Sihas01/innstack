import Link from 'next/link';
import {getGuides} from '@/lib/content';
import {PageIntro,Arrow} from '@/components/ui';
import {metadata as makeMetadata} from '@/lib/site';
export const metadata=makeMetadata('Hospitality technology guides','Practical explanations of hospitality software, distribution and property workflows.','/guides');
export default function Guides(){const guides=getGuides();return <div className="page-content"><PageIntro eyebrow="THE KNOW-HOW" title="Less jargon. More clarity.">Practical guides to the systems behind a well-run property. Start with the basics, then go a little deeper.</PageIntro><div className="editorial-list">{guides.map((g,i)=><Link href={`/guides/${g.slug}`} key={g.slug}><span className="list-number">0{i+1}</span><div><span className="eyebrow muted">{g.category} · {g.readingTime} MIN READ</span><h2>{g.title}</h2><p>{g.description}</p></div><Arrow diagonal/></Link>)}</div>{guides.length===1&&<p className="form-note">More independent hospitality technology guides are currently in research.</p>}</div>;}
