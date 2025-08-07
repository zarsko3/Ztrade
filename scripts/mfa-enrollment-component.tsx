import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface MFAEnrollmentProps {
  onEnrolled: () => void;
  onCancelled: () => void;
}

export function MFAEnrollment({ onEnrolled, onCancelled }: MFAEnrollmentProps) {
  const [factorId, setFactorId] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Initialize MFA enrollment when component mounts
    initializeEnrollment();
  }, []);

  const initializeEnrollment = async () => {
    try {
      setIsLoading(true);
      setError('');

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
      });

      if (error) {
        throw error;
      }

      setFactorId(data.id);
      setQrCode(data.totp.qr_code);
    } catch (err: any) {
      setError(err.message || 'Failed to initialize MFA enrollment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnableMFA = async () => {
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

      // MFA enrollment successful
      onEnrolled();
    } catch (err: any) {
      setError(err.message || 'Failed to verify MFA code');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !qrCode) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Initializing MFA enrollment...</span>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-gray-900">Enable Two-Factor Authentication</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="mb-6">
        <p className="text-gray-600 mb-4">
          Scan the QR code below with your authenticator app (Google Authenticator, Authy, etc.):
        </p>
        
        {qrCode && (
          <div className="flex justify-center mb-4">
            <img 
              src={qrCode} 
              alt="MFA QR Code" 
              className="border border-gray-300 rounded"
            />
          </div>
        )}
      </div>

      <div className="mb-6">
        <label htmlFor="verification-code" className="block text-sm font-medium text-gray-700 mb-2">
          Verification Code
        </label>
        <input
          id="verification-code"
          type="text"
          value={verificationCode}
          onChange={(e) => setVerificationCode(e.target.value.trim())}
          placeholder="Enter 6-digit code"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          maxLength={6}
        />
      </div>

      <div className="flex space-x-3">
        <button
          onClick={handleEnableMFA}
          disabled={isLoading || verificationCode.length !== 6}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Verifying...' : 'Enable MFA'}
        </button>
        
        <button
          onClick={onCancelled}
          disabled={isLoading}
          className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>

      <div className="mt-4 text-sm text-gray-500">
        <p>• Download an authenticator app if you haven't already</p>
        <p>• Scan the QR code with your app</p>
        <p>• Enter the 6-digit code shown in your app</p>
      </div>
    </div>
  );
}
