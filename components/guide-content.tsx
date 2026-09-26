import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { slugify } from '@/data/software';
import { InnStackTip, PropertyExample } from '@/components/ui';

interface GuideContentProps { content: string; }

function Markdown({ children }: { children: string }) {
  return <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
    h2: ({ children }) => <h2 id={slugify(String(children))}>{children}</h2>,
    h3: ({ children }) => <h3 id={slugify(String(children))}>{children}</h3>,
    table: ({ children }) => <div className="table-scroll comparison-table" role="region" aria-label="Guide comparison table" tabIndex={0}><table>{children}</table></div>,
    a: ({ href, children }) => href?.startsWith('/')
      ? <Link href={href}>{children}</Link>
      : <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>,
  }}>{children}</ReactMarkdown>;
}

export function GuideContent({ content }: GuideContentProps) {
  const renderStandardSections = (section: string, keyPrefix: string) =>
    section.split(/(?=^### InnStack tip\s*$)/gm).map((part, index) => {
      if (/^### InnStack tip\s*$/m.test(part)) {
        return (
          <InnStackTip key={`${keyPrefix}-tip-${index}`}>
            <Markdown>{part.replace(/^### InnStack tip\s*\n+/m, '')}</Markdown>
          </InnStackTip>
        );
      }

      return <Markdown key={`${keyPrefix}-${index}`}>{part}</Markdown>;
    });

  return (
    <>
      {content.split(/(?=^## )/gm).flatMap((section, index) => {
        const scenario = section.match(/^## (Scenario \d+: [^\n]+)\n+([\s\S]*)$/);

        if (scenario) {
          return [
            <PropertyExample key={`scenario-${index}`} title={scenario[1]}>
              <Markdown>{scenario[2]}</Markdown>
            </PropertyExample>,
          ];
        }

        return renderStandardSections(section, `section-${index}`);
      })}
    </>
  );
}
