'use client';
import Link from 'next/link';
import {Search, Menu, X} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Logo, Arrow } from './ui';
export interface SearchItem {title:string;description:string;href:string;type:string;}
export function Header({items}:{items:SearchItem[]}) {const [menu,setMenu]=useState(false);const [query,setQuery]=useState('');const dialog=useRef<HTMLDialogElement>(null); const input=useRef<HTMLInputElement>(null); const header=useRef<HTMLElement>(null); const progress=useRef<HTMLDivElement>(null); const menuButton=useRef<HTMLButtonElement>(null); const path=usePathname(); const isGuide=/^\/guides\/[^/]+\/?$/.test(path);
function openSearch(){setMenu(false);header.current?.classList.remove('is-hidden');dialog.current?.showModal();input.current?.focus();}
function closeSearch(){dialog.current?.close();setQuery('');}
useEffect(()=>{const key=(e:KeyboardEvent)=>{if((e.metaKey||e.ctrlKey)&&e.key==='k'){e.preventDefault();setMenu(false);header.current?.classList.remove('is-hidden');if(!dialog.current?.open)dialog.current?.showModal();input.current?.focus();}};document.addEventListener('keydown',key);return()=>document.removeEventListener('keydown',key);},[]);
useEffect(()=>{if(!menu)return;const previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';const preventPageScroll=(event:TouchEvent)=>{if(!(event.target instanceof Node)||!header.current?.querySelector('.main-nav')?.contains(event.target))event.preventDefault();};document.addEventListener('touchmove',preventPageScroll,{passive:false});const media=window.matchMedia('(min-width: 601px)');const resize=()=>{if(media.matches)setMenu(false);};const key=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();setMenu(false);menuButton.current?.focus();}else if(event.key==='Tab'){const controls=Array.from(header.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')??[]).filter(element=>element.getClientRects().length>0);if(!controls.length)return;const first=controls[0],last=controls[controls.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}};media.addEventListener('change',resize);document.addEventListener('keydown',key);return()=>{document.body.style.overflow=previousOverflow;document.removeEventListener('touchmove',preventPageScroll);media.removeEventListener('change',resize);document.removeEventListener('keydown',key);};},[menu]);
useEffect(()=>{setMenu(false);},[path]);
useEffect(()=>{
  const bar=header.current;
  if(!bar)return;
  let lastY=Math.max(0,window.scrollY),frame=0,hovered=false;
  const reveal=()=>bar.classList.remove('is-hidden');
  const update=()=>{
    frame=0;
    const maxY=Math.max(0,document.documentElement.scrollHeight-window.innerHeight);
    const y=Math.max(0,Math.min(window.scrollY,maxY));
    if(isGuide&&progress.current){
      const article=document.querySelector<HTMLElement>('.reading-layout > article');
      if(article){const rect=article.getBoundingClientRect();const amount=Math.max(0,Math.min(1,(window.innerHeight-rect.top)/rect.height));progress.current.style.transform=`scaleX(${amount})`;}
    }
    const locked=menu||dialog.current?.open||hovered||bar.contains(document.activeElement)||Boolean(bar.querySelector('[aria-expanded="true"]'));
    if(y<=bar.offsetHeight||locked){reveal();lastY=y;return;}
    if(Math.abs(y-lastY)<12)return;
    bar.classList.toggle('is-hidden',y>lastY&&y>bar.offsetHeight+24);
    lastY=y;
  };
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(update);};
  const enter=(event:PointerEvent)=>{if(event.pointerType==='mouse'){hovered=true;reveal();}};
  const leave=(event:PointerEvent)=>{if(event.pointerType==='mouse')hovered=false;};
  bar.addEventListener('pointerenter',enter);bar.addEventListener('pointerleave',leave);bar.addEventListener('focusin',reveal);
  window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);
  reveal();schedule();
  return()=>{cancelAnimationFrame(frame);bar.classList.remove('is-hidden');bar.removeEventListener('pointerenter',enter);bar.removeEventListener('pointerleave',leave);bar.removeEventListener('focusin',reveal);window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);};
},[menu,path,isGuide]);
const results=items.filter(i=>`${i.title} ${i.description} ${i.type}`.toLowerCase().includes(query.toLowerCase().trim()));
return <>{isGuide&&<div ref={progress} className="reading-progress" aria-hidden="true"/>}<header ref={header} className="site-header"><Link href="/" aria-label="InnStack home"><Logo/></Link><nav id="main-navigation" className={menu?'main-nav is-open':'main-nav'} aria-label="Main navigation">{['Software','Comparisons','Guides','Tools','About'].map(n=><Link onClick={()=>setMenu(false)} key={n} aria-current={path.startsWith('/'+n.toLowerCase())?'page':undefined} href={'/'+n.toLowerCase()}>{n}</Link>)}</nav><div className="header-actions"><button className="search-trigger" aria-label="Search InnStack" onClick={openSearch}><Search size={19} strokeWidth={1.6} aria-hidden="true"/><span>Search</span><kbd>⌘ K</kbd></button><Link className="button header-cta" href="/software">Find software <Arrow/></Link><button ref={menuButton} className="menu-toggle" aria-label={menu?'Close navigation':'Open navigation'} aria-controls="main-navigation" aria-expanded={menu} onClick={()=>setMenu(!menu)}>{menu?<X size={24} strokeWidth={1.6} aria-hidden="true"/>:<Menu size={24} strokeWidth={1.6} aria-hidden="true"/>}</button></div></header><dialog ref={dialog} className="search-dialog" onClose={()=>setQuery('')} onClick={e=>{if(e.target===dialog.current)closeSearch();}}><div className="search-inner"><div className="search-top"><label htmlFor="site-search">Search the field guide</label><button aria-label="Close search" onClick={closeSearch}><X size={20} strokeWidth={1.6} aria-hidden="true"/></button></div><input ref={input} id="site-search" type="search" placeholder="Try ‘channel manager’ or ‘Lodgify’" value={query} onChange={e=>setQuery(e.target.value)}/><p className="muted" role="status">{results.length} {results.length===1?'result':'results'} · software, guides & comparisons</p><div className="search-results">{results.map(i=><Link key={i.href} href={i.href} onClick={()=>{closeSearch();setMenu(false);}}><span className="eyebrow muted">{i.type}</span><h3>{i.title} <Arrow/></h3><p>{i.description}</p></Link>)}{results.length===0&&<p>No matches yet. Try a category such as booking, PMS or software.</p>}</div></div></dialog></>;}
