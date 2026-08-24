'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuthOTP } from '@/hooks/useAuthOTP';
import { useAuth } from '@/context/AuthContext';
import {
  Shield,
  KeyRound,
  Loader2,
  CheckCircle2,
  Truck,
  Building2,
  User,
  Mail,
  Phone,
  ArrowRight,
  ChevronLeft,
  X,
  Lock,
} from 'lucide-react';
import { UserRole } from '@/types';

interface AccessGatewayProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: 'CITIZEN_DRIVER' | 'SUPPLY_HUB' | 'GOV_AUTHORITY';
}

export default function AccessGateway({
  isOpen,
  onClose,
  defaultRole = 'CITIZEN_DRIVER',
}: AccessGatewayProps) {
  const { saveSession, closeAuthModal } = useAuth();
  const { step, setStep, email, loading, errorMsg, setErrorMsg, sendOTP, verifyOTP } = useAuthOTP();

  // Form Fields
  const [selectedRole, setSelectedRole] = useState<'CITIZEN_DRIVER' | 'SUPPLY_HUB' | 'GOV_AUTHORITY'>(defaultRole);
  const [fullName, setFullName] = useState('');
  const [targetEmail, setTargetEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [hubId, setHubId] = useState('HUB-NL-01');
  const [agencyName, setAgencyName] = useState('Border Roads Organisation (BRO)');

  // OTP 6-Digit Array
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState<number>(60);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const digitInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Reset states on open
  useEffect(() => {
    if (isOpen) {
      setStep('DETAILS');
      setOtpDigits(['', '', '', '', '', '']);
      setErrorMsg(null);
      setSuccessToast(null);
      setCountdown(60);
      setSelectedRole(defaultRole);
    }
  }, [isOpen, defaultRole, setStep, setErrorMsg]);

  // Countdown timer in OTP step
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'OTP' && countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  // Auto-focus first input box when entering OTP step
  useEffect(() => {
    if (step === 'OTP') {
      setTimeout(() => {
        digitInputRefs.current[0]?.focus();
      }, 100);
    }
  }, [step]);

  if (!isOpen) return null;

  // Step 1: Send 6-Digit OTP
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessToast(null);

    const cleanEmail = targetEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    const metadata: Record<string, any> = {
      full_name: fullName.trim() || (selectedRole === 'GOV_AUTHORITY' ? 'Government Official' : 'Citizen Operator'),
      role: selectedRole,
      phone: phone.trim() || '+91 98765 43210',
      hub_id: selectedRole === 'SUPPLY_HUB' ? hubId : undefined,
      agency: selectedRole === 'GOV_AUTHORITY' ? agencyName : undefined,
    };

    const success = await sendOTP(cleanEmail, metadata);
    if (success) {
      setCountdown(60);
      setSuccessToast(`6-Digit OTP dispatched to ${cleanEmail}`);
    }
  };

  // Step 2: Auto-verify OTP
  const handlePerformVerification = async (code: string) => {
    setErrorMsg(null);
    const result = await verifyOTP(code);
    if (result.success && result.user) {
      saveSession(result.user);
      setSuccessToast('Verification successful! Welcome to NER Smart Logistics.');
      setTimeout(() => {
        onClose();
        closeAuthModal();
      }, 600);
    }
  };

  // Handle digit change with auto-advance and 6th-digit auto-submit
  const handleDigitChange = (index: number, val: string) => {
    const clean = val.replace(/\D/g, '');
    if (!clean) {
      const updated = [...otpDigits];
      updated[index] = '';
      setOtpDigits(updated);
      return;
    }

    if (clean.length > 1) {
      // Pasted or multiple characters
      const chars = clean.slice(0, 6).split('');
      const updated = [...otpDigits];
      chars.forEach((c, i) => {
        if (i < 6) updated[i] = c;
      });
      setOtpDigits(updated);
      const nextIndex = Math.min(chars.length, 5);
      digitInputRefs.current[nextIndex]?.focus();

      if (updated.filter(Boolean).length === 6) {
        handlePerformVerification(updated.join(''));
      }
      return;
    }

    const updated = [...otpDigits];
    updated[index] = clean[clean.length - 1];
    setOtpDigits(updated);

    if (index < 5 && clean) {
      digitInputRefs.current[index + 1]?.focus();
    }

    // If 6th digit entered, auto submit
    if (updated.filter(Boolean).length === 6) {
      handlePerformVerification(updated.join(''));
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      digitInputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) {
      const chars = pasted.split('');
      const updated = ['', '', '', '', '', ''];
      chars.forEach((c, i) => {
        updated[i] = c;
      });
      setOtpDigits(updated);
      const focusIndex = Math.min(chars.length, 5);
      digitInputRefs.current[focusIndex]?.focus();

      if (chars.length === 6) {
        handlePerformVerification(updated.join(''));
      }
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || loading) return;
    setErrorMsg(null);
    setSuccessToast(null);
    const success = await sendOTP(email, {
      full_name: fullName,
      role: selectedRole,
      phone,
      hub_id: hubId,
    });
    if (success) {
      setCountdown(60);
      setSuccessToast('New 6-digit OTP sent to your inbox.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 tracking-wide">NER Unified Access Gateway</h2>
              <p className="text-[11px] text-slate-400">Passwordless 6-Digit Numeric Verification</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Role Selector */}
          {step === 'DETAILS' && (
            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setSelectedRole('CITIZEN_DRIVER')}
                className={`flex flex-col items-center gap-1 py-2.5 rounded-lg font-medium transition ${
                  selectedRole === 'CITIZEN_DRIVER'
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Citizen</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('SUPPLY_HUB')}
                className={`flex flex-col items-center gap-1 py-2.5 rounded-lg font-medium transition ${
                  selectedRole === 'SUPPLY_HUB'
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Supply Hub</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('GOV_AUTHORITY')}
                className={`flex flex-col items-center gap-1 py-2.5 rounded-lg font-medium transition ${
                  selectedRole === 'GOV_AUTHORITY'
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Command</span>
              </button>
            </div>
          )}

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="p-3 text-xs rounded-xl bg-red-950/80 border border-red-800 text-red-200 flex items-start gap-2">
              <span className="font-bold">Error:</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {successToast && (
            <div className="p-3 text-xs rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successToast}</span>
            </div>
          )}

          {/* STEP 1: Details & Send Code */}
          {step === 'DETAILS' ? (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Full Name / Personnel Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Captain Vikram Thapa"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-950/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Email Address (for 6-Digit OTP)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={targetEmail}
                    onChange={(e) => setTargetEmail(e.target.value)}
                    placeholder="official.name@domain.gov.in"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-950/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Emergency Contact Phone (+91)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-950/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                  />
                </div>
              </div>

              {selectedRole === 'SUPPLY_HUB' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Designated Supply Terminal Hub
                  </label>
                  <select
                    value={hubId}
                    onChange={(e) => setHubId(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-950/80 border border-slate-700/80 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                  >
                    <option value="HUB-NL-01">HUB-NL-01: Guwahati Multi-Modal Depot</option>
                    <option value="HUB-NL-02">HUB-NL-02: Silchar Strategic Hub</option>
                    <option value="HUB-NL-03">HUB-NL-03: Dimapur Railhead Hub</option>
                    <option value="HUB-NL-04">HUB-NL-04: Shillong High-Altitude Depot</option>
                  </select>
                </div>
              )}

              {selectedRole === 'GOV_AUTHORITY' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Commanding Agency / Department
                  </label>
                  <input
                    type="text"
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                    placeholder="e.g. Border Roads Organisation (BRO)"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-950/80 border border-slate-700/80 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-semibold text-xs bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white disabled:opacity-50 transition shadow flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Dispatching 6-Digit OTP...
                  </>
                ) : (
                  <>
                    <span>Dispatch 6-Digit Verification Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* STEP 2: 6-Digit Verification PIN Screen */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep('DETAILS')}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition"
                >
                  <ChevronLeft className="w-4 h-4" /> Change Email
                </button>
                <span className="text-xs text-cyan-400 font-mono">{email}</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-bold text-cyan-300 flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-cyan-400" />
                    <span>Enter 6-Digit Verification Code</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {otpDigits.filter(Boolean).length}/6 digits
                  </span>
                </div>

                <div
                  className="flex items-center justify-between gap-1.5 sm:gap-2"
                  onPaste={handlePaste}
                >
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        digitInputRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={digit}
                      onChange={(e) => handleDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                      className={`w-11 h-13 sm:w-12 sm:h-14 text-center font-mono text-xl sm:text-2xl font-black rounded-xl border transition-all duration-150 ${
                        digit
                          ? 'bg-cyan-950/70 border-cyan-400 text-cyan-200 shadow-md shadow-cyan-900/30 ring-1 ring-cyan-400/40'
                          : 'bg-slate-900/90 border-slate-700/80 text-slate-200 focus:border-cyan-400 focus:bg-slate-900 focus:ring-2 focus:ring-cyan-500/20'
                      } focus:outline-none`}
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Code valid for 10 minutes</span>
                  <span className="text-cyan-400/80 font-medium">Check Inbox & Spam</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handlePerformVerification(otpDigits.join(''))}
                disabled={loading || otpDigits.filter(Boolean).length < 6}
                className="w-full py-3 rounded-xl font-semibold text-xs bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white disabled:opacity-50 transition shadow flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Verifying Code...
                  </>
                ) : (
                  'Verify & Activate Session'
                )}
              </button>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={countdown > 0 || loading}
                  className="text-cyan-400 hover:underline disabled:opacity-40 font-medium"
                >
                  {countdown > 0 ? `Resend Code in ${countdown}s` : 'Resend Verification Code'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
