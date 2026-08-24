import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { sendEmailVerificationOTP } from '@/lib/brevo';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, fullName, full_name, phone, role, selectedRole, password, passwordHash } = body;

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

    let supabaseDispatched = false;
    let supabaseError: string | null = null;

    // 1. Dispatch Supabase Native Passwordless Email OTP (signInWithOtp)
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithOtp({
          email: normalizedEmail,
          options: {
            shouldCreateUser: true, // Creates account if it doesn't exist
            data: {
              full_name: name,
              role: userRole,
              phone: telemetryPhone || null,
            },
          },
        });

        if (error) {
          console.warn('[SUPABASE signInWithOtp NOTICE]:', error.message);
          supabaseError = error.message;
        } else {
          console.log('[SUPABASE signInWithOtp SUCCESS]: OTP dispatched for', normalizedEmail);
          supabaseDispatched = true;
        }
      } catch (supaErr: any) {
        console.warn('[SUPABASE signInWithOtp EXCEPTION]:', supaErr.message);
        supabaseError = supaErr.message;
      }
    }

    // 2. Dispatch Brevo 6-Digit Email OTP (Guaranteed 6-digit numeric template delivery)
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

    console.log('====================================');
    console.log('[PASSWORDLESS EMAIL OTP DISPATCH]');
    console.log('🎯 Target Email:        ', normalizedEmail);
    console.log('👤 Name:                ', name);
    console.log('📱 Phone:               ', telemetryPhone);
    console.log('⚡ Supabase signInWithOtp:', supabaseDispatched ? 'DISPATCHED' : `BYPASSED (${supabaseError})`);
    console.log('📧 Brevo OTP Dispatch:  ', brevoResult?.diagnostics?.channel || 'FAILED');
    console.log('====================================');

    if (!supabaseDispatched && (!brevoResult || !brevoResult.success) && supabaseError) {
      return NextResponse.json(
        { success: false, error: supabaseError || 'Failed to dispatch verification code.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `A 6-digit verification code has been sent to ${normalizedEmail}. Please check your inbox.`,
      diagnostics: {
        supabaseDispatched,
        brevoDispatched: brevoResult?.diagnostics?.isEmailLiveSent ?? false,
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
