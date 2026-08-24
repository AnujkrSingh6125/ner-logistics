import { NextRequest, NextResponse } from 'next/server';
import { sendEmailVerificationOTP } from '@/lib/brevo';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { full_name, email, phone, password, role } = body;

    // Strict Security Guard: Disallow direct public creation of gov_official accounts
    if (role === 'gov_official') {
      return NextResponse.json(
        {
          error:
            'Access Denied: Government official accounts are strictly provisioned by Defense & Disaster Management administration.',
        },
        { status: 403 }
      );
    }

    if (!full_name || !email || !phone || !password) {
      return NextResponse.json(
        { error: 'All fields (Full Name, Email, Phone Number, Password) are required.' },
        { status: 400 }
      );
    }

    // Dispatch Email OTP via Brevo REST API
    const result = await sendEmailVerificationOTP(
      email.trim().toLowerCase(),
      full_name.trim(),
      phone.trim(),
      password
    );

    console.log('====================================');
    console.log('[CITIZEN REGISTRATION EMAIL OTP DISPATCH]');
    console.log('🎯 Target Email: ', email);
    console.log('📱 Target Phone: ', phone);
    console.log('📧 Email OTP:    ', result.otp);
    console.log('📡 Channel:      ', result.diagnostics.channel);
    if (result.diagnostics.emailError) console.warn('⚠️ Email Notice: ', result.diagnostics.emailError);
    console.log('====================================');

    return NextResponse.json({
      success: true,
      message: result.message,
      otp: result.otp,
      diagnostics: result.diagnostics,
    });
  } catch (error: any) {
    console.error('[CITIZEN REGISTRATION EXCEPTION]', error);
    return NextResponse.json(
      { error: error?.message || 'Registration error' },
      { status: 500 }
    );
  }
}
