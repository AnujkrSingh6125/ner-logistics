'use client';

import React, { useState, useEffect } from 'react';
import { useAuth, GOV_AGENCIES, PRE_SEEDED_HUB_TERMINALS } from '@/context/AuthContext';
import {
  ShieldAlert,
  User,
  Lock,
  Mail,
  KeyRound,
  X,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Eye,
  EyeOff,
  Phone,
  Warehouse,
  Sparkles,
  Send,
  ArrowRight,
} from 'lucide-react';

export default function AuthModal() {
  const {
    authModalOpen,
    authModalTab,
    pendingSignup,
    closeAuthModal,
    loginGov,
    loginHub,
    loginPublic,
    sendEmailOTP,
    verifyEmailOTP,
    resendOTP,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'public' | 'gov' | 'hub'>(authModalTab);
  const [citizenView, setCitizenView] = useState<'signin' | 'register'>('signin');

  // Citizen Sign In State
  const [publicIdentifier, setPublicIdentifier] = useState('');
  const [publicPassword, setPublicPassword] = useState('');

  // Citizen Registration State
  const [fullName, setFullName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('+91 ');
  const [signupPassword, setSignupPassword] = useState('');

  // Email OTP Verification State
  const [emailOtpInput, setEmailOtpInput] = useState('');
  const [otpCountdown, setOtpCountdown] = useState(60);

  // Government Official Login State
  const [govAgency, setGovAgency] = useState('Border Roads Organisation (BRO)');
  const [govEmail, setGovEmail] = useState('');
  const [govPassword, setGovPassword] = useState('');

  // Supply Hub Terminal Login State
  const [hubCode, setHubCode] = useState('HUB-NL-01');
  const [hubEmail, setHubEmail] = useState('');
  const [hubPassword, setHubPassword] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setActiveTab(authModalTab);
    setErrorMsg('');
    setSuccessMsg('');
  }, [authModalTab, authModalOpen]);

  // Countdown timer for OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (pendingSignup && otpCountdown > 0) {
      timer = setInterval(() => setOtpCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [pendingSignup, otpCountdown]);

  if (!authModalOpen) return null;

  // Handle Public Citizen Sign In
  const handlePublicLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);
    try {
      const res = await loginPublic(publicIdentifier, publicPassword);
      if (!res.success) {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Brevo Email OTP Dispatch
  const handleSendEmailOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!fullName.trim() || !signupEmail.trim() || !signupPassword.trim()) {
      setErrorMsg('Full Name, Email, and Password are required.');
      return;
    }

    const cleanPhone = signupPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number with +91 country code.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await sendEmailOTP(fullName, signupEmail, signupPhone, signupPassword);
      if (res.success) {
        setOtpCountdown(60);
        setSuccessMsg(res.message);
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error sending verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Email OTP Verification
  const handleVerifyEmailOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);
    try {
      const res = await verifyEmailOTP(emailOtpInput);
      if (!res.success) {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification confirmation failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Resend Email Code
  const handleResendCode = async () => {
    if (!pendingSignup) return;
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await resendOTP();
      if (res.success) {
        setOtpCountdown(60);
        setSuccessMsg('New verification code sent via Brevo.');
      } else {
        setErrorMsg(res.message || 'Failed to resend code.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error resending verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Gov Official Login
  const handleGovLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);
    try {
      const res = await loginGov(govEmail, govPassword, govAgency);
      if (!res.success) {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Government official authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Hub Depot Login
  const handleHubLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);
    try {
      const res = await loginHub(hubEmail, hubPassword, hubCode);
      if (!res.success) {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Hub Depot terminal login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ribbon */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/80 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              {activeTab === 'gov' ? (
                <ShieldAlert className="w-4 h-4 text-amber-400" />
              ) : activeTab === 'hub' ? (
                <Warehouse className="w-4 h-4 text-emerald-400" />
              ) : (
                <User className="w-4 h-4 text-cyan-400" />
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                NER Smart Logistics Access Gateway
              </h2>
              <p className="text-xs text-slate-400">
                Secure Emergency Logistics Identity Gateway
              </p>
            </div>
          </div>
          <button
            onClick={closeAuthModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Role Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 p-1 gap-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab('public');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition ${
              activeTab === 'public'
                ? 'bg-blue-600/20 border border-blue-500/50 text-blue-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Citizen / Driver</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('gov');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition ${
              activeTab === 'gov'
                ? 'bg-amber-600/20 border border-amber-500/50 text-amber-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>SDMA / Command</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('hub');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition ${
              activeTab === 'hub'
                ? 'bg-emerald-600/20 border border-emerald-500/50 text-emerald-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Warehouse className="w-3.5 h-3.5" />
            <span>Hub Depot</span>
          </button>
        </div>

        {/* Global Notifications */}
        <div className="px-6 pt-4">
          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs mb-3 animate-in fade-in duration-150">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-emerald-950/60 border border-emerald-800/80 text-emerald-200 text-xs mb-3 animate-in fade-in duration-150">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 pt-2 max-h-[75vh] overflow-y-auto">
          {/* TAB 1: CITIZEN & DRIVER PORTAL */}
          {activeTab === 'public' && (
            <div>
              {pendingSignup ? (
                /* EMAIL OTP VERIFICATION SCREEN */
                <form onSubmit={handleVerifyEmailOTP} className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-800/50 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-blue-300">Email Verification Code</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-cyan-300 font-mono font-bold">
                        {pendingSignup.citizen_uid || 'UID PENDING'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">
                      We have sent a 6-digit verification code via Brevo to{' '}
                      <strong className="text-cyan-300 font-mono">{pendingSignup.email}</strong>
                    </p>
                  </div>

                  {/* Registered Phone Badge */}
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span>Registered Contact Number:</span>
                    </span>
                    <span className="font-mono font-bold text-emerald-400">{pendingSignup.phone}</span>
                  </div>

                  {/* 6-Digit OTP Code Input */}
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-semibold text-cyan-300 flex items-center gap-1.5">
                        <Mail className="w-4 h-4 text-cyan-400" />
                        <span>Enter 6-Digit Verification Code</span>
                      </label>
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      value={emailOtpInput}
                      onChange={(e) => setEmailOtpInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 492108"
                      className="w-full text-center tracking-[0.4em] font-mono text-2xl py-3 rounded-lg bg-slate-900 border border-slate-700 text-cyan-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500 shadow-inner"
                      required
                    />
                    <p className="text-[10px] text-slate-400 text-center">
                      Code valid for 10 minutes. Check your inbox and spam folder.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || emailOtpInput.length < 6}
                    className="w-full py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white disabled:opacity-50 transition shadow"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Verifying & Activating Profile...
                      </span>
                    ) : (
                      'Verify Email & Activate Citizen Account'
                    )}
                  </button>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={otpCountdown > 0 || isLoading}
                      className="text-cyan-400 hover:underline disabled:opacity-40"
                    >
                      {otpCountdown > 0 ? `Resend Code in ${otpCountdown}s` : 'Resend Verification Code'}
                    </button>
                    <button
                      type="button"
                      onClick={() => closeAuthModal()}
                      className="text-slate-400 hover:text-slate-200"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                /* CITIZEN FORM (SIGN IN DEFAULT VS CONSOLIDATED REGISTRATION) */
                <div>
                  <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 mb-5">
                    <button
                      type="button"
                      onClick={() => {
                        setCitizenView('signin');
                        setErrorMsg('');
                      }}
                      className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
                        citizenView === 'signin' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCitizenView('register');
                        setErrorMsg('');
                      }}
                      className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
                        citizenView === 'register' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Create Verified Citizen Profile
                    </button>
                  </div>

                  {/* 1. SIGN IN VIEW (DEFAULT) */}
                  {citizenView === 'signin' && (
                    <form onSubmit={handlePublicLogin} className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">
                          Email Address or Citizen UID
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                          <input
                            type="text"
                            value={publicIdentifier}
                            onChange={(e) => setPublicIdentifier(e.target.value)}
                            placeholder="e.g. anirban.das@gmail.com or NER-CIT-10024"
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 text-xs"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">
                          Password
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={publicPassword}
                            onChange={(e) => setPublicPassword(e.target.value)}
                            placeholder="Enter your account password"
                            className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 text-xs"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-2.5 rounded-xl font-semibold text-xs bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 transition shadow"
                      >
                        {isLoading ? (
                          <span className="flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" /> Authenticating...
                          </span>
                        ) : (
                          'Sign In as Citizen / Driver'
                        )}
                      </button>

                      <div className="text-center pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setCitizenView('register');
                            setErrorMsg('');
                          }}
                          className="text-xs text-slate-400 hover:text-cyan-400 transition"
                        >
                          Don't have an account? <span className="text-cyan-400 font-semibold underline">Register with Brevo Email OTP</span>
                        </button>
                      </div>
                    </form>
                  )}

                  {/* 2. REGISTRATION VIEW WITH MANDATORY PHONE */}
                  {citizenView === 'register' && (
                    <form onSubmit={handleSendEmailOTP} className="space-y-3.5">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Full Name
                        </label>
                        <div className="relative">
                          <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                          <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="e.g. Anirban Das"
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 text-xs"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Email Address (Receives 6-Digit OTP)
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                          <input
                            type="email"
                            value={signupEmail}
                            onChange={(e) => setSignupEmail(e.target.value)}
                            placeholder="e.g. anirban@example.com"
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 text-xs"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center justify-between">
                          <span>Phone Number (Mandatory Telemetry & Rescue)</span>
                          <span className="text-[10px] text-amber-400 font-semibold">Required</span>
                        </label>
                        <div className="relative">
                          <Phone className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                          <input
                            type="tel"
                            value={signupPhone}
                            onChange={(e) => setSignupPhone(e.target.value)}
                            placeholder="+91 98765 43210"
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 text-xs font-mono"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Create Account Password
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={signupPassword}
                            onChange={(e) => setSignupPassword(e.target.value)}
                            placeholder="Min. 6 characters"
                            className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 text-xs"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 rounded-xl font-semibold text-xs bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white disabled:opacity-50 transition shadow mt-2"
                      >
                        {isLoading ? (
                          <span className="flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" /> Dispatching Brevo Email OTP...
                          </span>
                        ) : (
                          'Send Email Verification Code'
                        )}
                      </button>

                      <div className="text-center pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setCitizenView('signin');
                            setErrorMsg('');
                          }}
                          className="text-xs text-slate-400 hover:text-cyan-400 transition"
                        >
                          Already registered? <span className="text-cyan-400 font-semibold underline">Sign in to your account</span>
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: GOVERNMENT & DISASTER COMMAND PORTAL */}
          {activeTab === 'gov' && (
            <form onSubmit={handleGovLogin} className="space-y-4">
              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-200 text-xs flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Official command access for BRO, NDMA, and 8 Northeast State Disaster Management Authorities.
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Designated Disaster / Defense Agency
                </label>
                <select
                  value={govAgency}
                  onChange={(e) => setGovAgency(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-amber-500 text-xs"
                >
                  {GOV_AGENCIES.map((agency) => (
                    <option key={agency} value={agency}>
                      {agency}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Official Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                  <input
                    type="email"
                    value={govEmail}
                    onChange={(e) => setGovEmail(e.target.value)}
                    placeholder="e.g. bro.hq@nic.in or assam.asdma@gov.in"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Official Security Clearance Key
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={govPassword}
                    onChange={(e) => setGovPassword(e.target.value)}
                    placeholder="Enter official command key"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 text-xs"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl font-semibold text-xs bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold disabled:opacity-50 transition shadow"
              >
                {isLoading ? 'Verifying Clearance...' : 'Authenticate Official Command Access'}
              </button>
            </form>
          )}

          {/* TAB 3: STRATEGIC SUPPLY HUB DEPOT PORTAL */}
          {activeTab === 'hub' && (
            <form onSubmit={handleHubLogin} className="space-y-4">
              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-emerald-200 text-xs flex items-start gap-2">
                <Warehouse className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  Strategic Terminal access for 9 North Eastern logistics nodes (Guwahati, Dimapur, Silchar, etc.)
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Strategic Supply Hub Depot Terminal
                </label>
                <select
                  value={hubCode}
                  onChange={(e) => {
                    setHubCode(e.target.value);
                    const sel = PRE_SEEDED_HUB_TERMINALS.find((h) => h.hub_code === e.target.value);
                    if (sel) setHubEmail(sel.email);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-emerald-500 text-xs"
                >
                  {PRE_SEEDED_HUB_TERMINALS.map((hub) => (
                    <option key={hub.hub_code} value={hub.hub_code}>
                      [{hub.hub_code}] {hub.hub_name} ({hub.state})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Terminal Operator Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                  <input
                    type="email"
                    value={hubEmail}
                    onChange={(e) => setHubEmail(e.target.value)}
                    placeholder="e.g. hub.dimapur@nerlogistics.gov.in"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Depot Access Password
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={hubPassword}
                    onChange={(e) => setHubPassword(e.target.value)}
                    placeholder="Enter depot access password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-xs"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl font-semibold text-xs bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold disabled:opacity-50 transition shadow"
              >
                {isLoading ? 'Connecting to Hub...' : 'Connect to Strategic Depot Terminal'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
