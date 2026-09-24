import type {Metadata} from 'next';
import {Header} from '@/components/header';
import {Footer} from '@/components/footer';
import {JsonLd} from '@/components/ui';
import {software} from '@/data/software';
import {getGuides} from '@/lib/content';
import {site} from '@/lib/site';
import './globals.css';
export const metadata:Metadata={metadataBase:new URL(site.url),title:{default:'InnStack — Better software for better hospitality',template:'%s | InnStack'},description:site.description,icons:{icon:'/icon.svg'},openGraph:{siteName:site.name,type:'website',locale:'en_US'},twitter:{card:'summary'}};
export default function RootLayout({children}:{children:React.ReactNode}){const items=[...software.map(s=>({title:s.name,description:s.description,href:s.reviewUrl,type:'Software'})),...getGuides().map(g=>({title:g.title,description:g.description,href:`/guides/${g.slug}`,type:'Guide'})),{title:'Lodgify vs Hostaway',description:'A workflow-led comparison framework for independent operators.',href:'/comparisons/lodgify-vs-hostaway',type:'Comparison'}];return <html lang="en"><body><a href="#main" className="skip-link">Skip to content</a><div className="site-wrap"><Header items={items}/><main id="main">{children}</main><Footer/></div><JsonLd data={{'@context':'https://schema.org','@type':'Organization',name:site.name,url:site.url,logo:`${site.url}/icon.svg`,description:site.description}}/></body></html>;}
