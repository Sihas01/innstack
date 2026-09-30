'use client';

import {useId, useState} from 'react';
import {revparFromAdr, revparFromRevenue} from '@/lib/calculators.mjs';

const currencies = [
  {code:'USD',label:'USD ($)',symbol:'$'},
  {code:'EUR',label:'EUR (€)',symbol:'€'},
  {code:'GBP',label:'GBP (£)',symbol:'£'},
  {code:'AUD',label:'AUD (A$)',symbol:'A$'},
  {code:'CAD',label:'CAD (C$)',symbol:'C$'},
  {code:'INR',label:'INR (₹)',symbol:'₹'},
  {code:'LKR',label:'LKR (Rs.)',symbol:'Rs.'},
] as const;

type Method = 'revenue'|'adr';

function NumberField({id,label,value,onChange,suffix,step='any',max}:{id:string;label:string;value:string;onChange:(value:string)=>void;suffix:string;step?:string;max?:number}) {
  return <div className="calc-field"><label htmlFor={id}>{label}</label><div><input id={id} type="number" inputMode="decimal" min="0" max={max} step={step} value={value} onChange={event=>onChange(event.target.value)}/><span>{suffix}</span></div></div>;
}

export function RevparCalculator() {
  const id = useId();
  const [method,setMethod] = useState<Method>('revenue');
  const [currency,setCurrency] = useState<(typeof currencies)[number]['code']>('USD');
  const [revenue,setRevenue] = useState('45000');
  const [rooms,setRooms] = useState('50');
  const [days,setDays] = useState('30');
  const [adr,setAdr] = useState('100');
  const [occupancy,setOccupancy] = useState('75');
  const selected = currencies.find(item=>item.code===currency) ?? currencies[0];
  const number = (value:string)=>value.trim()==='' ? null : Number(value);
  const revenueNumber=number(revenue), roomsNumber=number(rooms), daysNumber=number(days), adrNumber=number(adr), occupancyNumber=number(occupancy);
  const revenueValid=revenueNumber!==null&&roomsNumber!==null&&daysNumber!==null&&Number.isFinite(revenueNumber)&&Number.isFinite(roomsNumber)&&Number.isFinite(daysNumber)&&revenueNumber>=0&&roomsNumber>0&&daysNumber>0&&Number.isInteger(roomsNumber)&&Number.isInteger(daysNumber);
  const adrValid=adrNumber!==null&&occupancyNumber!==null&&Number.isFinite(adrNumber)&&Number.isFinite(occupancyNumber)&&adrNumber>=0&&occupancyNumber>=0&&occupancyNumber<=100;
  const revenueResult=revenueValid?revparFromRevenue(revenueNumber,roomsNumber,daysNumber):null;
  const result=method==='revenue'?revenueResult?.revpar:adrValid?revparFromAdr(adrNumber,occupancyNumber):null;
  const valid=method==='revenue'?revenueValid:adrValid;
  const formatMoney=(value:number)=>`${selected.symbol}${new Intl.NumberFormat(currency==='INR'?'en-IN':'en-US',{minimumFractionDigits:2,maximumFractionDigits:2}).format(value)}`;
  const formatInputMoney=(value:number)=>`${selected.symbol}${new Intl.NumberFormat(currency==='INR'?'en-IN':'en-US',{maximumFractionDigits:2}).format(value)}`;

  return <section className="revpar-tool" aria-labelledby={`${id}-title`}>
    <div className="revpar-tool-head"><div><span className="eyebrow">FREE HOTEL PERFORMANCE TOOL</span><h2 id={`${id}-title`}>Calculate your RevPAR</h2><p>Choose a method and use figures from the same reporting period.</p></div><div className="currency-select"><label htmlFor={`${id}-currency`}>Display currency</label><select id={`${id}-currency`} value={currency} onChange={event=>setCurrency(event.target.value as typeof currency)}>{currencies.map(item=><option value={item.code} key={item.code}>{item.label}</option>)}</select></div></div>
    <div className="calculator-tabs" role="tablist" aria-label="RevPAR calculation method">
      <button type="button" role="tab" aria-selected={method==='revenue'} aria-controls={`${id}-revenue-panel`} id={`${id}-revenue-tab`} onClick={()=>setMethod('revenue')}>Room Revenue</button>
      <button type="button" role="tab" aria-selected={method==='adr'} aria-controls={`${id}-adr-panel`} id={`${id}-adr-tab`} onClick={()=>setMethod('adr')}>ADR &amp; Occupancy</button>
    </div>
    <div className="calculator revpar-calculator">
      <form className="calculator-inputs" onSubmit={event=>event.preventDefault()} aria-labelledby={`${id}-${method}-tab`}>
        {method==='revenue'?<div role="tabpanel" id={`${id}-revenue-panel`} aria-labelledby={`${id}-revenue-tab`}>
          <NumberField id={`${id}-revenue`} label="Total room revenue" value={revenue} onChange={setRevenue} suffix={selected.symbol}/>
          <NumberField id={`${id}-rooms`} label="Number of available rooms" value={rooms} onChange={setRooms} suffix="rooms" step="1"/>
          <NumberField id={`${id}-days`} label="Number of days" value={days} onChange={setDays} suffix="days" step="1"/>
        </div>:<div role="tabpanel" id={`${id}-adr-panel`} aria-labelledby={`${id}-adr-tab`}>
          <NumberField id={`${id}-adr`} label="Average daily rate (ADR)" value={adr} onChange={setAdr} suffix={selected.symbol}/>
          <NumberField id={`${id}-occupancy`} label="Occupancy rate" value={occupancy} onChange={setOccupancy} suffix="%" max={100}/>
        </div>}
        <p className="form-note">Currency selection changes formatting only. It does not convert your figures. Nothing is submitted or saved.</p>
      </form>
      <div className="calculator-output" aria-live="polite" aria-atomic="true">
        <span className="eyebrow">REVENUE PER AVAILABLE ROOM</span><div className="result-label">RevPAR</div><div className="result-number">{valid&&result!=null?formatMoney(result):'—'}</div>
        {!valid?<p role="alert">{method==='revenue'?'Enter non-negative revenue and whole numbers above zero for rooms and days.':'Enter a non-negative ADR and an occupancy rate from 0% to 100%.'}</p>:method==='revenue'&&revenueResult?<><dl><div><dt>Total available room nights</dt><dd>{new Intl.NumberFormat('en-US').format(revenueResult.availableRoomNights)}</dd></div></dl><p className="calculation-line">{formatInputMoney(revenueNumber!)} ÷ ({roomsNumber} rooms × {daysNumber} days) = <strong>{formatMoney(result!)}</strong></p></>:<p className="calculation-line">{formatInputMoney(adrNumber!)} ADR × {new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(occupancyNumber!)}% = <strong>{formatMoney(result!)}</strong></p>}
        <div className="result-note">Use room revenue only and keep the reporting period consistent. The calculator is an operational aid, not accounting advice.</div>
      </div>
    </div>
  </section>;
}
