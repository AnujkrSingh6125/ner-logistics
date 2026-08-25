import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { verifySubmittedOTP } from '@/lib/brevo';
import { UserProfile } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, otp, emailOtp, fullName, phone } = body;

    const normalizedEmail = (email || '').trim().toLowerCase();
    const targetCode = (otp || emailOtp || '').trim();

    if (!normalizedEmail || !targetCode) {
      return NextResponse.json(
        { error: 'Email and 6-digit verification code are required.' },
        { status: 400 }
      );
    }

    let isVerified = false;
    let supaUser: any = null;
    let supaSession: any = null;
    let fallbackName = fullName || 'Citizen User';
    let fallbackPhone = phone || '+91 98765 43210';

    // 1. Attempt Native Supabase verifyOtp (Passwordless OTP Verification)
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.verifyOtp({
          email: normalizedEmail,
          token: targetCode,
          type: 'email',
        });

        if (error) {
          console.warn('[SUPABASE verifyOtp NOTICE]:', error.message);
        } else if (data?.user) {
          console.log('[SUPABASE verifyOtp SUCCESS]: User verified', data.user.id);
          isVerified = true;
          supaUser = data.user;
          supaSession = data.session;
          if (data.user.user_metadata?.full_name) fallbackName = data.user.user_metadata.full_name;
          if (data.user.user_metadata?.phone) fallbackPhone = data.user.user_metadata.phone;
        }
      } catch (supaErr: any) {
        console.warn('[SUPABASE verifyOtp EXCEPTION]:', supaErr.message);
      }
    }

    // 2. Brevo Store Verification Fallback
    if (!isVerified) {
      const brevoCheck = verifySubmittedOTP(normalizedEmail, targetCode);
      if (brevoCheck.success) {
        isVerified = true;
        if (brevoCheck.record?.fullName) fallbackName = brevoCheck.record.fullName;
        if (brevoCheck.record?.phone) fallbackPhone = brevoCheck.record.phone;
      }
    }

    if (!isVerified) {
      return NextResponse.json(
        { error: 'Invalid or expired 6-digit verification code. Please check your email and try again.' },
        { status: 400 }
      );
    }

    const citizenUid = supaUser?.user_metadata?.citizen_uid || `NER-CIT-${Math.floor(10000 + Math.random() * 90000)}`;
    const userRole = supaUser?.user_metadata?.role || 'CITIZEN_DRIVER';

    const userProfile: UserProfile = {
      id: supaUser?.id || `citizen-${Date.now()}`,
      citizen_uid: citizenUid,
      email: normalizedEmail,
      phone: fallbackPhone,
      full_name: fallbackName,
      role: (userRole === 'CITIZEN_DRIVER' ? 'citizen' : userRole) as any,
      state: 'Assam',
      is_verified: true,
      is_sharing_location: true,
      current_lat: 26.1445,
      current_lng: 91.7362,
      created_at: new Date().toISOString(),
    };

    // 3. Commit Verified User to public.client_users in Supabase
    if (supabase) {
      try {
        const { data: dbClient, error: clientErr } = await supabase
          .from('client_users')
          .upsert(
            {
              citizen_uid: userProfile.citizen_uid,
              full_name: userProfile.full_name,
              email: userProfile.email,
              phone: userProfile.phone,
              is_sharing_location: true,
              current_lat: 26.1445,
              current_lng: 91.7362,
              last_location_update: new Date().toISOString(),
            },
            { onConflict: 'email' }
          )
          .select()
          .single();

        if (clientErr) {
          console.warn('[SUPABASE client_users UPSERT WARNING]:', clientErr.message);
        } else if (dbClient) {
          userProfile.id = dbClient.id;
          userProfile.citizen_uid = dbClient.citizen_uid || citizenUid;
        }
      } catch (dbEx: any) {
        console.error('[SUPABASE DB EXCEPTION]:', dbEx.message);
      }
    }

    console.log('====================================');
    console.log('[CITIZEN PROFILE ACTIVATED & VERIFIED]');
    console.log('🆔 ID:          ', userProfile.id);
    console.log('🎫 Citizen UID: ', userProfile.citizen_uid);
    console.log('👤 Name:        ', userProfile.full_name);
    console.log('📧 Email:       ', userProfile.email);
    console.log('📱 Phone:       ', userProfile.phone);
    console.log('🎭 Role:        ', userProfile.role);
    console.log('====================================');

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully. Welcome to NER Smart Logistics Platform.',
      user: userProfile,
      session: supaSession,
      token: supaSession?.access_token || `citizen-auth-token-${Date.now()}`,
    });
  } catch (error: any) {
    console.error('[VERIFY OTP EXCEPTION]', error);
    return NextResponse.json(
      { error: error?.message || 'Verification error occurred.' },
      { status: 500 }
    );
  }
}
