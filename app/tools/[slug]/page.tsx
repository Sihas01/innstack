import {notFound} from 'next/navigation';
import Link from 'next/link';
import {Calculator} from '@/components/calculator';
import {calculatorInfo,type CalculatorKind} from '@/data/calculators';
import {PageIntro,Breadcrumb,FAQ} from '@/components/ui';
import {metadata} from '@/lib/site';

export function generateStaticParams(){return Object.keys(calculatorInfo).map(slug=>({slug}));}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const t=calculatorInfo[slug as CalculatorKind];
  return t?metadata(t.name,t.description,slug==='revpar-calculator'?'/revpar-calculator':`/tools/${slug}`):{};
}

export default async function Tool({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const kind=slug as CalculatorKind;
  const t=calculatorInfo[kind];
  if(!t)notFound();
  const faqs=[
    {question:'Do you save my numbers?',answer:'No. These calculations happen in your browser. Values reset when you reload the page.'},
    ...(kind==='occupancy-calculator'?[]:[{question:'Which currency should I use?',answer:'Monetary results are labeled USD. Convert your figures to USD first and use the same basis throughout.'}]),
    {question:'Can I use these figures for a business decision?',answer:'Use them as an initial estimate. Validate your actual contracts, reporting definitions, seasonal revenue and other costs before making a decision.'},
  ];
  if(kind==='occupancy-calculator') faqs[faqs.length-1]={question:'Can I use these figures for a business decision?',answer:'Use them as an initial estimate. Check your room-night inventory and reporting definitions before making a decision.'};
  return <div className="page-content">
    <Breadcrumb items={[{label:'Tools',href:'/tools'},{label:t.name}]}/>
    <PageIntro eyebrow="A LITTLE FINANCIAL CLARITY" title={t.name}>{t.description}</PageIntro>
    {kind==='revpar-calculator'?<div className="callout"><span className="eyebrow">NEW IN-DEPTH RESOURCE</span><p>Use the expanded <Link href="/revpar-calculator/">RevPAR calculator and hotel guide</Link> for currency options, both calculation methods, examples, and RevPAR Index guidance.</p></div>:<Calculator kind={kind}/>}
    <div className="prose narrow section">
      {kind==='occupancy-calculator'&&<>
        <h2>How to calculate hotel occupancy</h2>
        <p>Occupancy = room nights sold ÷ room nights available × 100. A room night is one room available or sold for one night. For a single day, compare rooms sold that night with rooms available that night. For a month, add the sold and available room nights across all days before dividing.</p>
        <h2>Occupancy example</h2>
        <p>In this illustrative example, a 10-room guesthouse has all rooms available for a 30-day month: 10 × 30 = 300 available room nights. If it sells 210 room nights, occupancy is 210 ÷ 300 × 100 = <strong>70%</strong>. A villa sold as one unit can use the same calculation with available and sold villa nights.</p>
        <h2>What about out-of-order rooms?</h2>
        <p>If you exclude rooms unavailable for sale, subtract each out-of-order room night from the denominator. For example, one room unavailable for five nights reduces the month’s 300 available room nights to 295. Reporting conventions can differ, so apply the same rule to every period and comparison.</p>
        <p>Occupancy does not show the room rate earned. Compare it with the <Link href="/tools/adr-calculator/">hotel ADR calculator</Link> and the <Link href="/revpar-calculator/">RevPAR calculator</Link> for a fuller view of room performance.</p>
      </>}
      {kind==='adr-calculator'&&<>
        <h2>How to calculate hotel ADR</h2>
        <p>Average daily rate (ADR) = room revenue ÷ room nights sold. Use the same reporting period for both figures. Unsold room nights are not included in the ADR denominator.</p>
        <h2>ADR example</h2>
        <p>In this illustrative example, a small hotel earns $9,000 in room revenue from 100 sold room nights during a month. Its ADR is $9,000 ÷ 100 = <strong>$90 per sold room night</strong>.</p>
        <h2>Which revenue should you include?</h2>
        <p>Use revenue attributable to rooms sold, following your accounting policy. Exclude unrelated food and beverage, spa and other non-room revenue; handle taxes, fees, packages and complimentary stays consistently with your reporting definitions. ADR is not a measure of profit.</p>
        <p>Use the <Link href="/tools/occupancy-calculator/">occupancy calculator</Link> to see the share of available room nights sold, and the <Link href="/revpar-calculator/">RevPAR calculator</Link> to compare room revenue with all available room nights.</p>
      </>}
      {kind==='direct-booking-savings-calculator'&&<>
        <h2>How the savings estimate works</h2>
        <p>Current direct share = 100% − OTA share. Shift = the greater of zero and (target direct share − current direct share). Annual savings = monthly revenue × shift × commission rate × 12.</p>
        <p>The model assumes all revenue is either OTA or direct, total revenue stays constant, and displaced OTA bookings carry the same average commission. Percentages refer to revenue, not reservation counts. It excludes changes in room rates, occupancy, payment fees, website costs and marketing spend.</p>
        <h2>OTA and direct booking example</h2>
        <p>Imagine two alternative $100 room bookings. With a 15% commission on the OTA booking, $15 goes to the OTA and $85 remains before other costs. If a direct booking has $3 in payment processing and $5 in marketing costs, $92 remains before other costs. These figures are illustrative, not standard rates, and assume no other listed costs.</p>
        <p>Gross booking revenue is the amount before distribution costs. The amounts retained after the listed costs are not actual profit: housekeeping, staffing, booking-engine subscriptions and other costs also matter. Direct bookings can cost more to acquire than the commission avoided.</p>
        <p>Estimate your current fees with the <Link href="/tools/ota-commission-calculator/">OTA commission calculator</Link>, and review the <Link href="/guides/hotel-rate-parity-direct-booking-pricing/">hotel rate parity guide</Link> before changing direct prices.</p>
      </>}
      {kind==='ota-commission-calculator'&&<>
        <h2>How OTA commission is calculated</h2>
        <p>Monthly commission = monthly OTA booking revenue × commission rate. The annual estimate assumes the same revenue and rate for all 12 months.</p>
        <h2>Commission example</h2>
        <p>For an illustrative $10,000 in monthly commissionable booking revenue at 15%, the OTA commission is $1,500 and $8,500 remains before other costs. At the same revenue and rate for 12 months, commission would be $18,000. The percentage is an example, not a universal rate.</p>
        <p>Commission rates and the revenue used as the commission base vary by platform and agreement. Taxes, fees, cancellations and additional charges may be treated differently, so check your contract and use the amount actually subject to commission. Revenue retained after commission is not profit.</p>
        <p>Explore a change in booking mix with the <Link href="/tools/direct-booking-savings-calculator/">direct booking savings calculator</Link>, and consult the <Link href="/guides/hotel-rate-parity-direct-booking-pricing/">hotel rate parity guide</Link> when considering direct prices.</p>
      </>}
      {kind==='revpar-calculator'&&<><h2>What’s behind the numbers?</h2><p>RevPAR = room revenue ÷ room nights available.</p></>}
      <FAQ items={faqs}/>
      <Link className="text-link" href="/tools/">← Explore all calculators</Link>
    </div>
  </div>;
}
