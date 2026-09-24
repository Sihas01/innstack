export type CalculatorKind='ota-commission-calculator'|'direct-booking-savings-calculator'|'occupancy-calculator'|'adr-calculator'|'revpar-calculator';
export const calculatorInfo:Record<CalculatorKind,{name:string;description:string}>={
 'ota-commission-calculator':{name:'OTA Commission Calculator',description:'Understand the cost of your OTA bookings, one month and one year at a time.'},
 'direct-booking-savings-calculator':{name:'Direct Booking Savings Calculator',description:'Explore how shifting your booking mix could change commission costs.'},
 'occupancy-calculator':{name:'Occupancy Calculator',description:'See what share of your available room nights you sold.'},
 'adr-calculator':{name:'ADR Calculator',description:'Understand your average room revenue per sold room night.'},
 'revpar-calculator':{name:'RevPAR Calculator',description:'Measure room revenue across every available room night.'}
};

