export type CalculatorKind='ota-commission-calculator'|'direct-booking-savings-calculator'|'occupancy-calculator'|'adr-calculator'|'revpar-calculator';
export const calculatorInfo:Record<CalculatorKind,{name:string;description:string}>={
 'ota-commission-calculator':{name:'OTA Commission Calculator',description:'Estimate monthly and annual OTA commission costs and see how fees affect your retained booking revenue.'},
 'direct-booking-savings-calculator':{name:'Direct Booking Savings Calculator',description:'Estimate potential OTA commission savings when more hotel booking revenue comes from direct reservations.'},
 'occupancy-calculator':{name:'Hotel Occupancy Calculator',description:'Calculate hotel occupancy from available and sold room nights, with a worked example for a day or month.'},
 'adr-calculator':{name:'Hotel ADR Calculator',description:'Calculate hotel average daily rate from room revenue and sold room nights, with a simple worked example.'},
 'revpar-calculator':{name:'RevPAR Calculator',description:'Measure room revenue across every available room night.'}
};

