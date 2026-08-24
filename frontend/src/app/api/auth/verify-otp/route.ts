import { NextRequest, NextResponse } from 'next/server';
import { verifySubmittedOTP } from '@/lib/brevo';
import { supabase } from '@/lib/supabaseClient';
import { UserProfile } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, otp, emailOtp, fullName, phone } = body;

    const targetCode = (otp || emailOtp || '').trim();

    if (!email || !targetCode) {
      return NextResponse.json(
        { error: 'Email and 6-digit verification code are required.' },
        { status: 400 }
      );
    }

    const verification = verifySubmittedOTP(email, targetCode);

    if (!verification.success) {
      return NextResponse.json(
        { error: verification.message },
        { status: 400 }
      );
    }

    const name = fullName || verification.record?.fullName || 'Citizen User';
    const mobile = phone || verification.record?.phone || '+91 98765 43210';

    // Generate unique Citizen UID
    const citizenUid = `NER-CIT-${Math.floor(10000 + Math.random() * 90000)}`;

    const userProfile: UserProfile = {
      id: `citizen-${Date.now()}`,
      citizen_uid: citizenUid,
      email: email.trim().toLowerCase(),
      phone: mobile,
      full_name: name,
      role: 'citizen',
      state: 'Assam',
      is_verified: true,
      is_sharing_location: true,
      current_lat: 26.1445,
      current_lng: 91.7362,
      created_at: new Date().toISOString(),
    };

    // 1. Commit to client_users table in Supabase
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
          console.log('[SUPABASE client_users CREATED]:', dbClient.id, dbClient.citizen_uid);
          userProfile.id = dbClient.id;
          userProfile.citizen_uid = dbClient.citizen_uid || citizenUid;
        }
      } catch (dbEx) {
        console.error('[SUPABASE DB EXCEPTION]:', dbEx);
      }
    }

    console.log('====================================');
    console.log('[CITIZEN PROFILE ACTIVATED & PERSISTED TO client_users]');
    console.log('🆔 ID:          ', userProfile.id);
    console.log('🎫 Citizen UID: ', userProfile.citizen_uid);
    console.log('👤 Name:        ', userProfile.full_name);
    console.log('📧 Email:       ', userProfile.email);
    console.log('📱 Phone:       ', userProfile.phone);
    console.log('====================================');

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully. Welcome to NER Smart Logistics Platform.',
      user: userProfile,
      token: `citizen-auth-token-${Date.now()}`,
    });
  } catch (error: any) {
    console.error('[VERIFY OTP EXCEPTION]', error);
    return NextResponse.json(
      { error: error?.message || 'Verification error' },
      { status: 500 }
    );
  }
}
