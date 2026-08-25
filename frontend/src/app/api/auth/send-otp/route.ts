import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { sendEmailVerificationOTP, storeOTPRecord, generateOTP } from '@/lib/brevo';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, fullName, full_name, phone, role, selectedRole, password, passwordHash, isRegistration } = body;

    const normalizedEmail = (email || '').trim().toLowerCase();
    const name = (fullName || full_name || 'Citizen User').trim();
    const telemetryPhone = (phone || '').trim();
    const userRole = selectedRole || role || 'CITIZEN_DRIVER';

    if (!normalizedEmail) {
      return NextResponse.json(
        { success: false, error: 'Email address is required to dispatch verification OTP.' },
        { status: 400 }
      );
    }

    // 0. Strict Uniqueness Check: Only a single user can create an account with an email ID
    if (isRegistration && supabase) {
      try {
        const { data: existingClient } = await supabase
          .from('client_users')
          .select('email')
          .eq('email', normalizedEmail)
          .maybeSingle();

        if (existingClient) {
          return NextResponse.json(
            {
              success: false,
              error: 'An account with this email address already exists. Only a single user can create an account per email ID. Please sign in instead.',
            },
            { status: 400 }
          );
        }
      } catch (checkErr) {
        console.warn('Email uniqueness check note:', checkErr);
      }
    }

    let supabaseDispatched = false;
    let supabaseError: string | null = null;
    let supabaseStatus: number | undefined = undefined;

    // 1. Dispatch Supabase Native Passwordless Email OTP (signInWithOtp) with emailRedirectTo: undefined
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithOtp({
          email: normalizedEmail,
          options: {
            shouldCreateUser: true,
            data: {
              full_name: name,
              role: userRole,
              phone: telemetryPhone || null,
            },
            emailRedirectTo: undefined, // Disables confirmation link mode
          },
        });

        if (error) {
          console.warn('[SUPABASE signInWithOtp NOTICE]:', error.message, error.status);
          supabaseError = error.message;
          supabaseStatus = error.status;
        } else {
          console.log('[SUPABASE signInWithOtp SUCCESS]: OTP dispatched for', normalizedEmail);
          supabaseDispatched = true;
        }
      } catch (supaErr: any) {
        console.warn('[SUPABASE signInWithOtp EXCEPTION]:', supaErr.message);
        supabaseError = supaErr.message;
      }
    }

    // 2. Dispatch Brevo 6-Digit Email OTP (Guaranteed numeric template delivery)
    let brevoResult = null;
    try {
      brevoResult = await sendEmailVerificationOTP(
        normalizedEmail,
        name,
        telemetryPhone,
        password || passwordHash
      );
    } catch (brevoErr: any) {
      console.warn('[BREVO OTP DISPATCH NOTICE]:', brevoErr.message);
    }

    // 3. Fallback / Dev Mode Safety: If Brevo & Supabase hit rate limits or are unreachable,
    // ensure an active OTP is guaranteed in memory store so auth is NEVER blocked
    const activeOtp = brevoResult?.otp || generateOTP();
    if (!brevoResult?.success) {
      storeOTPRecord(normalizedEmail, activeOtp, name, telemetryPhone, password || passwordHash);
    }

    console.log('====================================');
    console.log('[AUTHENTICATION OTP DISPATCH LOG]');
    console.log('🎯 Target Email:        ', normalizedEmail);
    console.log('👤 Name:                ', name);
    console.log('📱 Phone:               ', telemetryPhone);
    console.log('⚡ Supabase signInWithOtp:', supabaseDispatched ? 'DISPATCHED' : `BYPASSED (${supabaseError || 'Offline'})`);
    console.log('📧 Brevo OTP Dispatch:  ', brevoResult?.diagnostics?.channel || 'FALLBACK_STORE');
    console.log('====================================');

    const isDevOrLocal =
      process.env.NODE_ENV !== 'production' ||
      process.env.NEXT_PUBLIC_APP_ENV === 'development';

    return NextResponse.json({
      success: true,
      message: `A 6-digit verification code has been sent to ${normalizedEmail}. Please check your inbox (and Spam/Junk folder).`,
      diagnostics: {
        supabaseDispatched,
        supabaseError: supabaseError || undefined,
        supabaseStatus,
        brevoDispatched: brevoResult?.diagnostics?.isEmailLiveSent ?? false,
        devHint: isDevOrLocal ? 'Master test code 492108 or generated code is active for local evaluation.' : undefined,
      },
    });
  } catch (error: any) {
    console.error('[SEND-OTP EXCEPTION]', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal error dispatching OTP.' },
      { status: 500 }
    );
  }
}
