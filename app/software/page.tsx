import {Directory} from '@/components/directory';
import {PageIntro} from '@/components/ui';
import {metadata as makeMetadata} from '@/lib/site';
export const metadata=makeMetadata('Software directory','Explore hospitality software by category and property type.','/software');
export default function SoftwarePage(){return <div className="page-content"><PageIntro eyebrow="THE SOFTWARE DIRECTORY" title="Find your hospitality stack.">Start with your property. Understand the job each tool does. Then build a shortlist that makes sense for your business.</PageIntro><Directory/></div>;}
