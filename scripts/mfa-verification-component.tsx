import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface MFAVerificationProps {
  onVerified: () => void;
  onLogout: () => void;
}

export function MFAVerification({ onVerified, onLogout }: MFAVerificationProps) {
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [factorId, setFactorId] = useState('');

  useEffect(() => {
    // Get available MFA factors when component mounts
    getMFAFactors();
  }, []);

  const getMFAFactors = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      
      if (error) {
        throw error;
      }

      // Get the first TOTP factor (you might want to show a selection if multiple)
      const totpFactor = data.totp[0];
      if (totpFactor) {
        setFactorId(totpFactor.id);
      } else {
        setError('No TOTP factors found. Please enroll in MFA first.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to get MFA factors');
    }
  };

  const handleVerify = async () => {
    if (!factorId) {
      setError('No MFA factor available');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      // Create a challenge for the factor
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (challengeError) {
        throw challengeError;
      }

      // Verify the code provided by the user
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: verificationCode,
      });

      if (verifyError) {
        throw verifyError;
      }

      // Refresh the session to update the AAL
      await supabase.auth.refreshSession();

      // MFA verification successful
      onVerified();
    } catch (err: any) {
      setError(err.message || 'Failed to verify MFA code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      onLogout();
    } catch (err: any) {
      console.error('Logout error:', err);
      onLogout(); // Still logout even if there's an error
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Two-Factor Authentication</h2>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          Logout
        </button>
      </div>

      <div className="mb-6">
        <p className="text-gray-600">
          Enter the 6-digit code from your authenticator app to continue:
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="mb-6">
        <label htmlFor="verification-code" className="block text-sm font-medium text-gray-700 mb-2">
          Verification Code
        </label>
        <input
          id="verification-code"
          type="text"
          value={verificationCode}
          onChange={(e) => setVerificationCode(e.target.value.trim())}
          placeholder="000000"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg tracking-widest"
          maxLength={6}
          autoFocus
        />
      </div>

      <button
        onClick={handleVerify}
        disabled={isLoading || verificationCode.length !== 6}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Verifying...' : 'Verify'}
      </button>

      <div className="mt-4 text-sm text-gray-500 text-center">
        <p>Open your authenticator app and enter the current code</p>
      </div>
    </div>
  );
}
