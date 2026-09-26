import {notFound} from 'next/navigation';

// This route remains in place for future researched comparison publications.
// No comparison is currently eligible for publication.
export const dynamicParams=false;
export function generateStaticParams(){return [{slug:'lodgify-vs-hostaway'}];}

export default async function Comparison({params}:{params:Promise<{slug:string}>}){
  await params;
  notFound();
}
