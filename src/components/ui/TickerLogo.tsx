'use client';

import { useState, useEffect } from 'react';
import { Building2 } from 'lucide-react';

interface TickerLogoProps {
  ticker: string;
  size?: 'sm' | 'md' | 'lg';
  showTicker?: boolean;
  className?: string;
}

interface CompanyInfo {
  name: string;
  logo?: string;
  sector?: string;
}

export function TickerLogo({ 
  ticker, 
  size = 'md', 
  showTicker = true, 
  className = '' 
}: TickerLogoProps) {
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Size classes
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-lg'
  };

  // Common company logos mapping (for popular stocks)
  const commonLogos: Record<string, string> = {
    'AAPL': 'https://logo.clearbit.com/apple.com',
    'MSFT': 'https://logo.clearbit.com/microsoft.com',
    'GOOGL': 'https://logo.clearbit.com/google.com',
    'GOOG': 'https://logo.clearbit.com/google.com',
    'AMZN': 'https://logo.clearbit.com/amazon.com',
    'TSLA': 'https://logo.clearbit.com/tesla.com',
    'META': 'https://logo.clearbit.com/meta.com',
    'FB': 'https://logo.clearbit.com/meta.com',
    'NVDA': 'https://logo.clearbit.com/nvidia.com',
    'NFLX': 'https://logo.clearbit.com/netflix.com',
    'JPM': 'https://logo.clearbit.com/jpmorganchase.com',
    'JNJ': 'https://logo.clearbit.com/jnj.com',
    'V': 'https://logo.clearbit.com/visa.com',
    'PG': 'https://logo.clearbit.com/pg.com',
    'HD': 'https://logo.clearbit.com/homedepot.com',
    'MA': 'https://logo.clearbit.com/mastercard.com',
    'DIS': 'https://logo.clearbit.com/disney.com',
    'PYPL': 'https://logo.clearbit.com/paypal.com',
    'BAC': 'https://logo.clearbit.com/bankofamerica.com',
    'KO': 'https://logo.clearbit.com/coca-cola.com',
    'PEP': 'https://logo.clearbit.com/pepsico.com',
    'WMT': 'https://logo.clearbit.com/walmart.com',
    'T': 'https://logo.clearbit.com/att.com',
    'VZ': 'https://logo.clearbit.com/verizon.com',
    'CMCSA': 'https://logo.clearbit.com/comcast.com',
    'ADBE': 'https://logo.clearbit.com/adobe.com',
    'CRM': 'https://logo.clearbit.com/salesforce.com',
    'NKE': 'https://logo.clearbit.com/nike.com',
    'INTC': 'https://logo.clearbit.com/intel.com',
    'ORCL': 'https://logo.clearbit.com/oracle.com',
    'CSCO': 'https://logo.clearbit.com/cisco.com',
    'IBM': 'https://logo.clearbit.com/ibm.com',
    'QCOM': 'https://logo.clearbit.com/qualcomm.com',
    'TXN': 'https://logo.clearbit.com/ti.com',
    'AVGO': 'https://logo.clearbit.com/broadcom.com',
    'HON': 'https://logo.clearbit.com/honeywell.com',
    'LOW': 'https://logo.clearbit.com/lowes.com',
    'UPS': 'https://logo.clearbit.com/ups.com',
    'CAT': 'https://logo.clearbit.com/caterpillar.com',
    'RTX': 'https://logo.clearbit.com/rtx.com',
    'BA': 'https://logo.clearbit.com/boeing.com',
    'UNH': 'https://logo.clearbit.com/unitedhealthgroup.com',
    'CVX': 'https://logo.clearbit.com/chevron.com',
    'XOM': 'https://logo.clearbit.com/exxonmobil.com',
    'SPY': 'https://logo.clearbit.com/ssga.com',
    'QQQ': 'https://logo.clearbit.com/invesco.com',
    'IWM': 'https://logo.clearbit.com/ishares.com',
    'GLD': 'https://logo.clearbit.com/spdrgoldshares.com',
    'SLV': 'https://logo.clearbit.com/ishares.com',
    'TLT': 'https://logo.clearbit.com/ishares.com',
    'VNQ': 'https://logo.clearbit.com/vanguard.com',
    'VTI': 'https://logo.clearbit.com/vanguard.com',
    'VOO': 'https://logo.clearbit.com/vanguard.com',
    'VEA': 'https://logo.clearbit.com/vanguard.com',
    'VWO': 'https://logo.clearbit.com/vanguard.com',
    'BND': 'https://logo.clearbit.com/vanguard.com',
    'AGG': 'https://logo.clearbit.com/ishares.com',
    'LQD': 'https://logo.clearbit.com/ishares.com',
    'HYG': 'https://logo.clearbit.com/ishares.com',
    'EMB': 'https://logo.clearbit.com/ishares.com',
    'DIA': 'https://logo.clearbit.com/ssga.com',
    'EFA': 'https://logo.clearbit.com/ishares.com',
    'EEM': 'https://logo.clearbit.com/ishares.com',
    'ACWI': 'https://logo.clearbit.com/ishares.com',
    'VT': 'https://logo.clearbit.com/vanguard.com',
    'BNDX': 'https://logo.clearbit.com/vanguard.com',
    'VCIT': 'https://logo.clearbit.com/vanguard.com',
    'VCSH': 'https://logo.clearbit.com/vanguard.com',
    'VGSH': 'https://logo.clearbit.com/vanguard.com',
    'VGIT': 'https://logo.clearbit.com/vanguard.com',
    'VGLT': 'https://logo.clearbit.com/vanguard.com',
    'VCLT': 'https://logo.clearbit.com/vanguard.com',
    'VWOB': 'https://logo.clearbit.com/vanguard.com',
    'VSS': 'https://logo.clearbit.com/vanguard.com',
    'VBR': 'https://logo.clearbit.com/vanguard.com',
    'VB': 'https://logo.clearbit.com/vanguard.com',
    'VO': 'https://logo.clearbit.com/vanguard.com',
    'VV': 'https://logo.clearbit.com/vanguard.com',
    'VTV': 'https://logo.clearbit.com/vanguard.com',
    'VUG': 'https://logo.clearbit.com/vanguard.com',
    'VXF': 'https://logo.clearbit.com/vanguard.com',
    'VYM': 'https://logo.clearbit.com/vanguard.com',
    'VIG': 'https://logo.clearbit.com/vanguard.com',
    'VIGI': 'https://logo.clearbit.com/vanguard.com',
    'VYMI': 'https://logo.clearbit.com/vanguard.com',
    'VPL': 'https://logo.clearbit.com/vanguard.com',
    'VEA': 'https://logo.clearbit.com/vanguard.com',
    'VWO': 'https://logo.clearbit.com/vanguard.com',
    'VSS': 'https://logo.clearbit.com/vanguard.com',
    'VBR': 'https://logo.clearbit.com/vanguard.com',
    'VB': 'https://logo.clearbit.com/vanguard.com',
    'VO': 'https://logo.clearbit.com/vanguard.com',
    'VV': 'https://logo.clearbit.com/vanguard.com',
    'VTV': 'https://logo.clearbit.com/vanguard.com',
    'VUG': 'https://logo.clearbit.com/vanguard.com',
    'VXF': 'https://logo.clearbit.com/vanguard.com',
    'VYM': 'https://logo.clearbit.com/vanguard.com',
    'VIG': 'https://logo.clearbit.com/vanguard.com',
    'VIGI': 'https://logo.clearbit.com/vanguard.com',
    'VYMI': 'https://logo.clearbit.com/vanguard.com',
    'VPL': 'https://logo.clearbit.com/vanguard.com',
  };

  useEffect(() => {
    const fetchCompanyInfo = async () => {
      try {
        setLoading(true);
        setError(false);

        // Check if we have a common logo first
        const logoUrl = commonLogos[ticker];
        
        if (logoUrl) {
          // Test if the logo URL is accessible
          const img = new Image();
          img.onload = () => {
            setCompanyInfo({
              name: ticker,
              logo: logoUrl
            });
            setLoading(false);
          };
          img.onerror = () => {
            setError(true);
            setLoading(false);
          };
          img.src = logoUrl;
        } else {
          // Try to fetch from a company info API
          try {
            const response = await fetch(`/api/company-info?ticker=${ticker}`);
            if (response.ok) {
              const data = await response.json();
              setCompanyInfo(data);
            } else {
              setError(true);
            }
          } catch (err) {
            setError(true);
          } finally {
            setLoading(false);
          }
        }
      } catch (err) {
        setError(true);
        setLoading(false);
      }
    };

    if (ticker) {
      fetchCompanyInfo();
    }
  }, [ticker]);

  const renderLogo = () => {
    if (loading) {
      return (
        <div className={`${sizeClasses[size]} bg-gray-200 dark:bg-gray-700 rounded-xl flex items-center justify-center animate-pulse`}>
          <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
        </div>
      );
    }

    if (error || !companyInfo?.logo) {
      // Fallback to styled ticker symbol
      return (
        <div className={`${sizeClasses[size]} bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-xl flex items-center justify-center text-white font-bold shadow-sm`}>
          <Building2 className="w-1/2 h-1/2" />
        </div>
      );
    }

    return (
      <img
        src={companyInfo.logo}
        alt={`${ticker} logo`}
        className={`${sizeClasses[size]} rounded-xl object-cover shadow-sm border border-gray-200 dark:border-gray-600`}
        onError={() => setError(true)}
      />
    );
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {renderLogo()}
      {showTicker && (
        <span className="font-semibold text-gray-900 dark:text-white">
          {ticker}
        </span>
      )}
    </div>
  );
}

export default TickerLogo; 