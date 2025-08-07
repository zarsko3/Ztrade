import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface MFAStatus {
  hasMFA: boolean;
  factorCount: number;
  factorTypes: string[];
  currentLevel: string;
  nextLevel: string;
}

interface MFAStatusCheckProps {
  onMFARequired?: () => void;
  onMFAEnrolled?: () => void;
  onMFAVerified?: () => void;
}

export function MFAStatusCheck({ 
  onMFARequired, 
  onMFAEnrolled, 
  onMFAVerified 
}: MFAStatusCheckProps) {
  const [mfaStatus, setMfaStatus] = useState<MFAStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    checkMFAStatus();
  }, []);

  const checkMFAStatus = async () => {
    try {
      setIsLoading(true);
      setError('');

      // Get authenticator assurance levels
      const { data: aalData } = supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      
      // Get MFA factors
      const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
      
      if (factorsError) {
        throw factorsError;
      }

      const verifiedFactors = factorsData.totp.filter(factor => factor.status === 'verified');
      
      const status: MFAStatus = {
        hasMFA: verifiedFactors.length > 0,
        factorCount: verifiedFactors.length,
        factorTypes: verifiedFactors.map(factor => factor.factorType),
        currentLevel: aalData.currentLevel,
        nextLevel: aalData.nextLevel,
      };

      setMfaStatus(status);

      // Trigger appropriate callbacks based on status
      if (status.currentLevel === 'aal1' && status.nextLevel === 'aal1') {
        // User doesn't have MFA enrolled
        onMFARequired?.();
      } else if (status.currentLevel === 'aal1' && status.nextLevel === 'aal2') {
        // User has MFA enrolled but not verified
        onMFAEnrolled?.();
      } else if (status.currentLevel === 'aal2' && status.nextLevel === 'aal2') {
        // User has verified MFA
        onMFAVerified?.();
      }

    } catch (err: any) {
      setError(err.message || 'Failed to check MFA status');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusMessage = () => {
    if (!mfaStatus) return '';

    if (mfaStatus.currentLevel === 'aal1' && mfaStatus.nextLevel === 'aal1') {
      return 'Two-factor authentication is not enabled. Please enable it for enhanced security.';
    } else if (mfaStatus.currentLevel === 'aal1' && mfaStatus.nextLevel === 'aal2') {
      return 'Two-factor authentication is enabled but not verified. Please complete verification.';
    } else if (mfaStatus.currentLevel === 'aal2' && mfaStatus.nextLevel === 'aal2') {
      return 'Two-factor authentication is enabled and verified. Your account is secure.';
    }

    return 'Unknown MFA status.';
  };

  const getStatusColor = () => {
    if (!mfaStatus) return 'gray';

    if (mfaStatus.currentLevel === 'aal2') {
      return 'green';
    } else if (mfaStatus.currentLevel === 'aal1' && mfaStatus.nextLevel === 'aal2') {
      return 'yellow';
    } else {
      return 'red';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2">Checking MFA status...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
        <p className="font-medium">Error checking MFA status:</p>
        <p>{error}</p>
        <button
          onClick={checkMFAStatus}
          className="mt-2 text-sm underline hover:no-underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!mfaStatus) {
    return (
      <div className="p-4 bg-gray-100 border border-gray-400 text-gray-700 rounded">
        Unable to determine MFA status.
      </div>
    );
  }

  const statusColor = getStatusColor();
  const colorClasses = {
    green: 'bg-green-100 border-green-400 text-green-700',
    yellow: 'bg-yellow-100 border-yellow-400 text-yellow-700',
    red: 'bg-red-100 border-red-400 text-red-700',
    gray: 'bg-gray-100 border-gray-400 text-gray-700',
  };

  return (
    <div className={`p-4 border rounded ${colorClasses[statusColor as keyof typeof colorClasses]}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Two-Factor Authentication Status</h3>
          <p className="text-sm mt-1">{getStatusMessage()}</p>
          
          {mfaStatus.hasMFA && (
            <div className="mt-2 text-sm">
              <p>• Enrolled factors: {mfaStatus.factorCount}</p>
              <p>• Factor types: {mfaStatus.factorTypes.join(', ')}</p>
              <p>• Current level: {mfaStatus.currentLevel}</p>
              <p>• Next level: {mfaStatus.nextLevel}</p>
            </div>
          )}
        </div>
        
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full ${
            statusColor === 'green' ? 'bg-green-500' :
            statusColor === 'yellow' ? 'bg-yellow-500' :
            statusColor === 'red' ? 'bg-red-500' :
            'bg-gray-500'
          }`}></div>
        </div>
      </div>

      <button
        onClick={checkMFAStatus}
        className="mt-3 text-sm underline hover:no-underline"
      >
        Refresh status
      </button>
    </div>
  );
}

// Hook for checking MFA status
export function useMFAStatus() {
  const [mfaStatus, setMfaStatus] = useState<MFAStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const checkStatus = async () => {
    try {
      setIsLoading(true);
      setError('');

      const { data: aalData } = supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
      
      if (factorsError) {
        throw factorsError;
      }

      const verifiedFactors = factorsData.totp.filter(factor => factor.status === 'verified');
      
      const status: MFAStatus = {
        hasMFA: verifiedFactors.length > 0,
        factorCount: verifiedFactors.length,
        factorTypes: verifiedFactors.map(factor => factor.factorType),
        currentLevel: aalData.currentLevel,
        nextLevel: aalData.nextLevel,
      };

      setMfaStatus(status);
    } catch (err: any) {
      setError(err.message || 'Failed to check MFA status');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  return {
    mfaStatus,
    isLoading,
    error,
    refresh: checkStatus,
  };
}
