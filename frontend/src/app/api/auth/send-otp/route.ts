import { NextRequest, NextResponse } from 'next/server';
import { sendEmailVerificationOTP } from '@/lib/brevo';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, fullName, full_name, phone, password, passwordHash } = body;

    const targetEmail = (email || '').trim().toLowerCase();
    const targetName = fullName || full_name || 'Citizen User';
    const targetPhone = (phone || '').trim();

    if (!targetEmail) {
      return NextResponse.json(
        { success: false, error: 'Email address is required to dispatch verification OTP.' },
        { status: 400 }
      );
    }

    if (!targetPhone) {
      return NextResponse.json(
        { success: false, error: 'Phone number is required for emergency logistics telemetry.' },
        { status: 400 }
      );
    }

    // Dispatch Email OTP via Brevo REST API
    const result = await sendEmailVerificationOTP(
      targetEmail,
      targetName,
      targetPhone,
      password || passwordHash
    );

    console.log('====================================');
    console.log('[BREVO EMAIL OTP DISPATCH]');
    console.log('🎯 Target Email: ', targetEmail);
    console.log('📱 Phone Number: ', targetPhone);
    console.log('🔐 Email OTP:    ', result.otp);
    console.log('📡 Status:       ', result.diagnostics.channel);
    console.log('====================================');

    return NextResponse.json({
      success: true,
      message: result.message,
      otp: result.otp,
      diagnostics: result.diagnostics,
    });
  } catch (error: any) {
    console.error('[SEND-OTP EXCEPTION]', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal error dispatching OTP.' },
      { status: 500 }
    );
  }
}
