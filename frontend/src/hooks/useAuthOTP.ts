'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface UseAuthOTPResult {
  step: 'DETAILS' | 'OTP';
  setStep: React.Dispatch<React.SetStateAction<'DETAILS' | 'OTP'>>;
  email: string;
  setEmail: React.Dispatch<React.SetStateAction<string>>;
  loading: boolean;
  errorMsg: string | null;
  setErrorMsg: React.Dispatch<React.SetStateAction<string | null>>;
  sendOTP: (targetEmail: string, metadata?: Record<string, any>) => Promise<boolean>;
  verifyOTP: (token: string) => Promise<{ success: boolean; session?: any; user?: any; error?: string }>;
}

export function useAuthOTP(): UseAuthOTPResult {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'DETAILS' | 'OTP'>('DETAILS');
  const [email, setEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Step 1: Dispatch 6-Digit Code via signInWithOtp
  const sendOTP = async (targetEmail: string, metadata: Record<string, any> = {}) => {
    setLoading(true);
    setErrorMsg(null);
    const cleanEmail = targetEmail.trim().toLowerCase();

    if (!cleanEmail) {
      setErrorMsg('Email address is required.');
      setLoading(false);
      return false;
    }

    try {
      let supaSuccess = false;

      // 1. Primary: Supabase Native Passwordless OTP with emailRedirectTo: undefined
      if (supabase) {
        try {
          const { data, error } = await supabase.auth.signInWithOtp({
            email: cleanEmail,
            options: {
              shouldCreateUser: true,
              data: metadata, // full_name, role, hub_id, phone, etc.
              emailRedirectTo: undefined, // Crucial: forces token mode, prevents URL link dispatch
            },
          });

          if (error) {
            console.warn('[useAuthOTP] Supabase signInWithOtp notice:', error.message);
          } else {
            supaSuccess = true;
          }
        } catch (supaErr: any) {
          console.warn('[useAuthOTP] Supabase exception:', supaErr.message);
        }
      }

      // 2. Secondary: Transactional Brevo Backend Pipeline & Cache Fallback
      try {
        const res = await fetch('/api/auth/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: cleanEmail,
            fullName: metadata.full_name || metadata.fullName,
            phone: metadata.phone,
            role: metadata.role || 'CITIZEN_DRIVER',
          }),
        });
        const apiData = await res.json();
        if (res.ok && apiData.success) {
          supaSuccess = true;
        }
      } catch (apiErr: any) {
        console.warn('[useAuthOTP] API route notice:', apiErr.message);
      }

      setEmail(cleanEmail);
      setStep('OTP');
      setLoading(false);
      return true;
    } catch (err: any) {
      console.error('[useAuthOTP] Error:', err);
      setErrorMsg(err?.message || 'Failed to dispatch verification code.');
      setLoading(false);
      return false;
    }
  };

  // Step 2: Verify 6-Digit Code via verifyOtp
  const verifyOTP = async (token: string) => {
    setLoading(true);
    setErrorMsg(null);
    const cleanToken = token.trim();

    if (!cleanToken || cleanToken.length < 6) {
      const msg = 'Please enter the complete 6-digit verification code.';
      setErrorMsg(msg);
      setLoading(false);
      return { success: false, error: msg };
    }

    try {
      // 1. Primary: Native Supabase verifyOtp
      if (supabase) {
        try {
          const { data, error } = await supabase.auth.verifyOtp({
            email,
            token: cleanToken,
            type: 'email',
          });

          if (!error && data?.user) {
            setLoading(false);
            return { success: true, session: data.session, user: data.user };
          }
          if (error) {
            console.warn('[useAuthOTP] Supabase verifyOtp notice:', error.message);
          }
        } catch (supaErr: any) {
          console.warn('[useAuthOTP] Supabase verify exception:', supaErr.message);
        }
      }

      // 2. Secondary: Backend API verification & local cache fallback
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          otp: cleanToken,
        }),
      });

      const apiData = await res.json();
      setLoading(false);

      if (res.ok && apiData.success && apiData.user) {
        return { success: true, session: apiData.session, user: apiData.user };
      }

      const failMsg = apiData.error || 'Invalid or expired 6-digit verification code.';
      setErrorMsg(failMsg);
      return { success: false, error: failMsg };
    } catch (err: any) {
      const errMsg = err?.message || 'Verification error occurred.';
      setErrorMsg(errMsg);
      setLoading(false);
      return { success: false, error: errMsg };
    }
  };

  return {
    step,
    setStep,
    email,
    setEmail,
    loading,
    errorMsg,
    setErrorMsg,
    sendOTP,
    verifyOTP,
  };
}
