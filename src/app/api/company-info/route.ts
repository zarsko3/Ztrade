import { NextRequest, NextResponse } from 'next/server';

interface CompanyInfo {
  name: string;
  logo?: string;
  sector?: string;
  description?: string;
}

// Extended company database with more information
const companyDatabase: Record<string, CompanyInfo> = {
  'AAPL': {
    name: 'Apple Inc.',
    logo: 'https://logo.clearbit.com/apple.com',
    sector: 'Technology',
    description: 'Consumer electronics and software company'
  },
  'MSFT': {
    name: 'Microsoft Corporation',
    logo: 'https://logo.clearbit.com/microsoft.com',
    sector: 'Technology',
    description: 'Software and cloud computing company'
  },
  'GOOGL': {
    name: 'Alphabet Inc.',
    logo: 'https://logo.clearbit.com/google.com',
    sector: 'Technology',
    description: 'Internet services and technology company'
  },
  'GOOG': {
    name: 'Alphabet Inc.',
    logo: 'https://logo.clearbit.com/google.com',
    sector: 'Technology',
    description: 'Internet services and technology company'
  },
  'AMZN': {
    name: 'Amazon.com Inc.',
    logo: 'https://logo.clearbit.com/amazon.com',
    sector: 'Consumer Discretionary',
    description: 'E-commerce and cloud computing company'
  },
  'TSLA': {
    name: 'Tesla Inc.',
    logo: 'https://logo.clearbit.com/tesla.com',
    sector: 'Consumer Discretionary',
    description: 'Electric vehicle and clean energy company'
  },
  'META': {
    name: 'Meta Platforms Inc.',
    logo: 'https://logo.clearbit.com/meta.com',
    sector: 'Technology',
    description: 'Social media and technology company'
  },
  'FB': {
    name: 'Meta Platforms Inc.',
    logo: 'https://logo.clearbit.com/meta.com',
    sector: 'Technology',
    description: 'Social media and technology company'
  },
  'NVDA': {
    name: 'NVIDIA Corporation',
    logo: 'https://logo.clearbit.com/nvidia.com',
    sector: 'Technology',
    description: 'Graphics processing and AI technology company'
  },
  'NFLX': {
    name: 'Netflix Inc.',
    logo: 'https://logo.clearbit.com/netflix.com',
    sector: 'Communication Services',
    description: 'Streaming entertainment company'
  },
  'JPM': {
    name: 'JPMorgan Chase & Co.',
    logo: 'https://logo.clearbit.com/jpmorganchase.com',
    sector: 'Financial Services',
    description: 'Multinational investment bank'
  },
  'JNJ': {
    name: 'Johnson & Johnson',
    logo: 'https://logo.clearbit.com/jnj.com',
    sector: 'Healthcare',
    description: 'Multinational medical devices and pharmaceutical company'
  },
  'V': {
    name: 'Visa Inc.',
    logo: 'https://logo.clearbit.com/visa.com',
    sector: 'Financial Services',
    description: 'Financial services and digital payments company'
  },
  'PG': {
    name: 'Procter & Gamble Co.',
    logo: 'https://logo.clearbit.com/pg.com',
    sector: 'Consumer Staples',
    description: 'Multinational consumer goods corporation'
  },
  'HD': {
    name: 'The Home Depot Inc.',
    logo: 'https://logo.clearbit.com/homedepot.com',
    sector: 'Consumer Discretionary',
    description: 'Home improvement retailer'
  },
  'MA': {
    name: 'Mastercard Inc.',
    logo: 'https://logo.clearbit.com/mastercard.com',
    sector: 'Financial Services',
    description: 'Financial services and digital payments company'
  },
  'DIS': {
    name: 'The Walt Disney Company',
    logo: 'https://logo.clearbit.com/disney.com',
    sector: 'Communication Services',
    description: 'Multinational mass media and entertainment conglomerate'
  },
  'PYPL': {
    name: 'PayPal Holdings Inc.',
    logo: 'https://logo.clearbit.com/paypal.com',
    sector: 'Financial Services',
    description: 'Digital payments and financial technology company'
  },
  'BAC': {
    name: 'Bank of America Corp.',
    logo: 'https://logo.clearbit.com/bankofamerica.com',
    sector: 'Financial Services',
    description: 'Multinational investment bank and financial services company'
  },
  'KO': {
    name: 'The Coca-Cola Company',
    logo: 'https://logo.clearbit.com/coca-cola.com',
    sector: 'Consumer Staples',
    description: 'Multinational beverage corporation'
  },
  'PEP': {
    name: 'PepsiCo Inc.',
    logo: 'https://logo.clearbit.com/pepsico.com',
    sector: 'Consumer Staples',
    description: 'Multinational food and beverage corporation'
  },
  'WMT': {
    name: 'Walmart Inc.',
    logo: 'https://logo.clearbit.com/walmart.com',
    sector: 'Consumer Staples',
    description: 'Multinational retail corporation'
  },
  'T': {
    name: 'AT&T Inc.',
    logo: 'https://logo.clearbit.com/att.com',
    sector: 'Communication Services',
    description: 'Multinational telecommunications conglomerate'
  },
  'VZ': {
    name: 'Verizon Communications Inc.',
    logo: 'https://logo.clearbit.com/verizon.com',
    sector: 'Communication Services',
    description: 'Multinational telecommunications conglomerate'
  },
  'CMCSA': {
    name: 'Comcast Corporation',
    logo: 'https://logo.clearbit.com/comcast.com',
    sector: 'Communication Services',
    description: 'Multinational telecommunications conglomerate'
  },
  'ADBE': {
    name: 'Adobe Inc.',
    logo: 'https://logo.clearbit.com/adobe.com',
    sector: 'Technology',
    description: 'Multinational computer software company'
  },
  'CRM': {
    name: 'Salesforce Inc.',
    logo: 'https://logo.clearbit.com/salesforce.com',
    sector: 'Technology',
    description: 'Cloud-based software company'
  },
  'NKE': {
    name: 'Nike Inc.',
    logo: 'https://logo.clearbit.com/nike.com',
    sector: 'Consumer Discretionary',
    description: 'Multinational athletic footwear and apparel corporation'
  },
  'INTC': {
    name: 'Intel Corporation',
    logo: 'https://logo.clearbit.com/intel.com',
    sector: 'Technology',
    description: 'Multinational technology company'
  },
  'ORCL': {
    name: 'Oracle Corporation',
    logo: 'https://logo.clearbit.com/oracle.com',
    sector: 'Technology',
    description: 'Multinational technology company'
  },
  'CSCO': {
    name: 'Cisco Systems Inc.',
    logo: 'https://logo.clearbit.com/cisco.com',
    sector: 'Technology',
    description: 'Multinational technology conglomerate'
  },
  'IBM': {
    name: 'International Business Machines Corporation',
    logo: 'https://logo.clearbit.com/ibm.com',
    sector: 'Technology',
    description: 'Multinational technology company'
  },
  'QCOM': {
    name: 'Qualcomm Incorporated',
    logo: 'https://logo.clearbit.com/qualcomm.com',
    sector: 'Technology',
    description: 'Multinational semiconductor and telecommunications equipment company'
  },
  'TXN': {
    name: 'Texas Instruments Incorporated',
    logo: 'https://logo.clearbit.com/ti.com',
    sector: 'Technology',
    description: 'Multinational semiconductor company'
  },
  'AVGO': {
    name: 'Broadcom Inc.',
    logo: 'https://logo.clearbit.com/broadcom.com',
    sector: 'Technology',
    description: 'Multinational semiconductor company'
  },
  'HON': {
    name: 'Honeywell International Inc.',
    logo: 'https://logo.clearbit.com/honeywell.com',
    sector: 'Industrials',
    description: 'Multinational conglomerate'
  },
  'LOW': {
    name: 'Lowe\'s Companies Inc.',
    logo: 'https://logo.clearbit.com/lowes.com',
    sector: 'Consumer Discretionary',
    description: 'Home improvement retailer'
  },
  'UPS': {
    name: 'United Parcel Service Inc.',
    logo: 'https://logo.clearbit.com/ups.com',
    sector: 'Industrials',
    description: 'Multinational package delivery and supply chain management company'
  },
  'CAT': {
    name: 'Caterpillar Inc.',
    logo: 'https://logo.clearbit.com/caterpillar.com',
    sector: 'Industrials',
    description: 'Multinational construction equipment company'
  },
  'RTX': {
    name: 'Raytheon Technologies Corporation',
    logo: 'https://logo.clearbit.com/rtx.com',
    sector: 'Industrials',
    description: 'Multinational aerospace and defense conglomerate'
  },
  'BA': {
    name: 'The Boeing Company',
    logo: 'https://logo.clearbit.com/boeing.com',
    sector: 'Industrials',
    description: 'Multinational aerospace company'
  },
  'UNH': {
    name: 'UnitedHealth Group Incorporated',
    logo: 'https://logo.clearbit.com/unitedhealthgroup.com',
    sector: 'Healthcare',
    description: 'Multinational managed healthcare and insurance company'
  },
  'CVX': {
    name: 'Chevron Corporation',
    logo: 'https://logo.clearbit.com/chevron.com',
    sector: 'Energy',
    description: 'Multinational energy corporation'
  },
  'XOM': {
    name: 'Exxon Mobil Corporation',
    logo: 'https://logo.clearbit.com/exxonmobil.com',
    sector: 'Energy',
    description: 'Multinational oil and gas corporation'
  },
  // ETFs and Index Funds
  'SPY': {
    name: 'SPDR S&P 500 ETF Trust',
    logo: 'https://logo.clearbit.com/ssga.com',
    sector: 'ETF',
    description: 'Exchange-traded fund that tracks the S&P 500 Index'
  },
  'QQQ': {
    name: 'Invesco QQQ Trust',
    logo: 'https://logo.clearbit.com/invesco.com',
    sector: 'ETF',
    description: 'Exchange-traded fund that tracks the NASDAQ-100 Index'
  },
  'IWM': {
    name: 'iShares Russell 2000 ETF',
    logo: 'https://logo.clearbit.com/ishares.com',
    sector: 'ETF',
    description: 'Exchange-traded fund that tracks the Russell 2000 Index'
  },
  'GLD': {
    name: 'SPDR Gold Shares',
    logo: 'https://logo.clearbit.com/spdrgoldshares.com',
    sector: 'ETF',
    description: 'Exchange-traded fund that tracks the price of gold'
  },
  'SLV': {
    name: 'iShares Silver Trust',
    logo: 'https://logo.clearbit.com/ishares.com',
    sector: 'ETF',
    description: 'Exchange-traded fund that tracks the price of silver'
  },
  'TLT': {
    name: 'iShares 20+ Year Treasury Bond ETF',
    logo: 'https://logo.clearbit.com/ishares.com',
    sector: 'ETF',
    description: 'Exchange-traded fund that tracks long-term Treasury bonds'
  },
  // Vanguard ETFs
  'VNQ': {
    name: 'Vanguard Real Estate ETF',
    logo: 'https://logo.clearbit.com/vanguard.com',
    sector: 'ETF',
    description: 'Exchange-traded fund that tracks the MSCI US REIT Index'
  },
  'VTI': {
    name: 'Vanguard Total Stock Market ETF',
    logo: 'https://logo.clearbit.com/vanguard.com',
    sector: 'ETF',
    description: 'Exchange-traded fund that tracks the CRSP US Total Market Index'
  },
  'VOO': {
    name: 'Vanguard S&P 500 ETF',
    logo: 'https://logo.clearbit.com/vanguard.com',
    sector: 'ETF',
    description: 'Exchange-traded fund that tracks the S&P 500 Index'
  },
  'VEA': {
    name: 'Vanguard FTSE Developed Markets ETF',
    logo: 'https://logo.clearbit.com/vanguard.com',
    sector: 'ETF',
    description: 'Exchange-traded fund that tracks developed markets outside the US'
  },
  'VWO': {
    name: 'Vanguard FTSE Emerging Markets ETF',
    logo: 'https://logo.clearbit.com/vanguard.com',
    sector: 'ETF',
    description: 'Exchange-traded fund that tracks emerging markets'
  },
  'BND': {
    name: 'Vanguard Total Bond Market ETF',
    logo: 'https://logo.clearbit.com/vanguard.com',
    sector: 'ETF',
    description: 'Exchange-traded fund that tracks the Bloomberg U.S. Aggregate Float Adjusted Index'
  },
  // iShares ETFs
  'AGG': {
    name: 'iShares Core U.S. Aggregate Bond ETF',
    logo: 'https://logo.clearbit.com/ishares.com',
    sector: 'ETF',
    description: 'Exchange-traded fund that tracks the Bloomberg U.S. Aggregate Bond Index'
  },
  'LQD': {
    name: 'iShares iBoxx $ Investment Grade Corporate Bond ETF',
    logo: 'https://logo.clearbit.com/ishares.com',
    sector: 'ETF',
    description: 'Exchange-traded fund that tracks investment-grade corporate bonds'
  },
  'HYG': {
    name: 'iShares iBoxx $ High Yield Corporate Bond ETF',
    logo: 'https://logo.clearbit.com/ishares.com',
    sector: 'ETF',
    description: 'Exchange-traded fund that tracks high-yield corporate bonds'
  },
  'EMB': {
    name: 'iShares J.P. Morgan USD Emerging Markets Bond ETF',
    logo: 'https://logo.clearbit.com/ishares.com',
    sector: 'ETF',
    description: 'Exchange-traded fund that tracks emerging market bonds'
  },
  'DIA': {
    name: 'SPDR Dow Jones Industrial Average ETF Trust',
    logo: 'https://logo.clearbit.com/ssga.com',
    sector: 'ETF',
    description: 'Exchange-traded fund that tracks the Dow Jones Industrial Average'
  },
  'EFA': {
    name: 'iShares MSCI EAFE ETF',
    logo: 'https://logo.clearbit.com/ishares.com',
    sector: 'ETF',
    description: 'Exchange-traded fund that tracks developed markets outside North America'
  },
  'EEM': {
    name: 'iShares MSCI Emerging Markets ETF',
    logo: 'https://logo.clearbit.com/ishares.com',
    sector: 'ETF',
    description: 'Exchange-traded fund that tracks emerging markets'
  },
  'ACWI': {
    name: 'iShares MSCI ACWI ETF',
    logo: 'https://logo.clearbit.com/ishares.com',
    sector: 'ETF',
    description: 'Exchange-traded fund that tracks global equity markets'
  },
  'VT': {
    name: 'Vanguard Total World Stock ETF',
    logo: 'https://logo.clearbit.com/vanguard.com',
    sector: 'ETF',
    description: 'Exchange-traded fund that tracks global equity markets'
  },
  'BNDX': {
    name: 'Vanguard Total International Bond ETF',
    logo: 'https://logo.clearbit.com/vanguard.com',
    sector: 'ETF',
    description: 'Exchange-traded fund that tracks international bonds'
  },
  // Additional Vanguard bond ETFs
  'VCIT': {
    name: 'Vanguard Intermediate-Term Corporate Bond ETF',
    logo: 'https://logo.clearbit.com/vanguard.com',
    sector: 'ETF',
    description: 'Exchange-traded fund that tracks intermediate-term corporate bonds'
  },
  'VCSH': {
    name: 'Vanguard Short-Term Corporate Bond ETF',
    logo: 'https://logo.clearbit.com/vanguard.com',
    sector: 'ETF',
    description: 'Exchange-traded fund that tracks short-term corporate bonds'
  },
  'VGSH': {
    name: 'Vanguard Short-Term Treasury ETF',
    logo: 'https://logo.clearbit.com/vanguard.com',
    sector: 'ETF',
    description: 'Exchange-traded fund that tracks short-term Treasury bonds'
  },
  'VGIT': {
    name: 'Vanguard Intermediate-Term Treasury ETF',
    logo: 'https://logo.clearbit.com/vanguard.com',
    sector: 'ETF',
    description: 'Exchange-traded fund that tracks intermediate-term Treasury bonds'
  },
  'VGLT': {
    name: 'Vanguard Long-Term Treasury ETF',
    logo: 'https://logo.clearbit.com/vanguard.com',
    sector: 'ETF',
    description: 'Exchange-traded fund that tracks long-term Treasury bonds'
  },
  'VCLT': {
    name: 'Vanguard Long-Term Corporate Bond ETF',
    logo: 'https://logo.clearbit.com/vanguard.com',
    sector: 'ETF',
    description: 'Exchange-traded fund that tracks long-term corporate bonds'
  },
  'VWOB': {
    name: 'Vanguard Emerging Markets Government Bond ETF',
    logo: 'https://logo.clearbit.com/vanguard.com',
    sector: 'ETF',
    description: 'Exchange-traded fund that tracks emerging market government bonds'
  },
  // Additional Vanguard equity ETFs
  'VSS': {
    name: 'Vanguard FTSE All-World ex-US Small-Cap ETF',
    logo: 'https://logo.clearbit.com/vanguard.com',
    sector: 'ETF',
    description: 'Exchange-traded fund that tracks international small-cap stocks'
  },
  'VBR': {
    name: 'Vanguard Small-Cap Value ETF',
    logo: 'https://logo.clearbit.com/vanguard.com',
    sector: 'ETF',
    description: 'Exchange-traded fund that tracks small-cap value stocks'
  },
  'VB': {
    name: 'Vanguard Small-Cap ETF',
    logo: 'https://logo.clearbit.com/vanguard.com',
    sector: 'ETF',
    description: 'Exchange-traded fund that tracks small-cap stocks'
  },
  'VO': {
    name: 'Vanguard Mid-Cap ETF',
    logo: 'https://logo.clearbit.com/vanguard.com',
    sector: 'ETF',
    description: 'Exchange-traded fund that tracks mid-cap stocks'
  },
  'VV': {
    name: 'Vanguard Large-Cap ETF',
    logo: 'https://logo.clearbit.com/vanguard.com',
    sector: 'ETF',
    description: 'Exchange-traded fund that tracks large-cap stocks'
  },
  'VTV': {
    name: 'Vanguard Value ETF',
    logo: 'https://logo.clearbit.com/vanguard.com',
    sector: 'ETF',
    description: 'Exchange-traded fund that tracks value stocks'
  },
  'VUG': {
    name: 'Vanguard Growth ETF',
    logo: 'https://logo.clearbit.com/vanguard.com',
    sector: 'ETF',
    description: 'Exchange-traded fund that tracks growth stocks'
  },
  'VXF': {
    name: 'Vanguard Extended Market ETF',
    logo: 'https://logo.clearbit.com/vanguard.com',
    sector: 'ETF',
    description: 'Exchange-traded fund that tracks mid- and small-cap stocks'
  },
  'VYM': {
    name: 'Vanguard High Dividend Yield ETF',
    logo: 'https://logo.clearbit.com/vanguard.com',
    sector: 'ETF',
    description: 'Exchange-traded fund that tracks high-dividend-yield stocks'
  },
  'VIG': {
    name: 'Vanguard Dividend Appreciation ETF',
    logo: 'https://logo.clearbit.com/vanguard.com',
    sector: 'ETF',
    description: 'Exchange-traded fund that tracks dividend growth stocks'
  },
  'VIGI': {
    name: 'Vanguard International Dividend Appreciation ETF',
    logo: 'https://logo.clearbit.com/vanguard.com',
    sector: 'ETF',
    description: 'Exchange-traded fund that tracks international dividend growth stocks'
  },
  'VYMI': {
    name: 'Vanguard International High Dividend Yield ETF',
    logo: 'https://logo.clearbit.com/vanguard.com',
    sector: 'ETF',
    description: 'Exchange-traded fund that tracks international high-dividend-yield stocks'
  },
  'VPL': {
    name: 'Vanguard FTSE Pacific ETF',
    logo: 'https://logo.clearbit.com/vanguard.com',
    sector: 'ETF',
    description: 'Exchange-traded fund that tracks Pacific region stocks'
  }
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker')?.toUpperCase();

    if (!ticker) {
      return NextResponse.json(
        { error: 'Ticker parameter is required' },
        { status: 400 }
      );
    }

    // Check if we have company info in our database
    const companyInfo = companyDatabase[ticker];

    if (companyInfo) {
      return NextResponse.json(companyInfo);
    }

    // If not found in database, return basic info
    return NextResponse.json({
      name: ticker,
      sector: 'Unknown',
      description: 'Company information not available'
    });

  } catch (error) {
    console.error('Error fetching company info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch company information' },
      { status: 500 }
    );
  }
} 