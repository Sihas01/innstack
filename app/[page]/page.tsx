import {notFound} from 'next/navigation';
import Link from 'next/link';
import {pages} from '@/data/pages';
import {PageIntro} from '@/components/ui';
import {ContactForm} from '@/components/forms';
import {metadata,site} from '@/lib/site';
export function generateStaticParams(){return Object.keys(pages).map(page=>({page}));}
export async function generateMetadata({params}:{params:Promise<{page:string}>}){const {page}=await params;const p=pages[page];return p?metadata(p.title,p.description,`/${page}`):{};}
export default async function InfoPage({params}:{params:Promise<{page:string}>}){const {page}=await params;const p=pages[page];if(!p)notFound();return <div className="page-content"><PageIntro eyebrow={p.eyebrow} title={p.title}>{p.description}</PageIntro>{page==='contact'?<div className="contact-layout"><ContactForm/><aside className="callout"><span className="eyebrow">CONTACT STATUS</span><h2>A direct line, soon.</h2><p><strong>{site.email}</strong></p><p>This is a placeholder address and is not a verified inbox. The contact form is also a preview. Please don’t send sensitive information.</p></aside></div>:<div className="prose narrow">{p.sections.map(s=><section key={s.title}><h2>{s.title}</h2><p>{s.body}</p></section>)}<div className="article-end"><Link href={page==='methodology'?'/about':'/methodology'}>{page==='methodology'?'Meet InnStack':'Read our editorial methodology'} →</Link></div></div>}</div>;}
