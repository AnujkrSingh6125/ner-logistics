/**
 * Fast2SMS Mobile SMS Dispatch Engine for Indian (+91) Phone Numbers
 * Sends transactional OTP SMS via Fast2SMS Quick Transactional / OTP Route
 */
export async function sendFast2SMSOTP(
  phone: string,
  otp: string
): Promise<{ success: boolean; message: string; isLiveSent: boolean; errorDetails?: string; gatewayResponse?: any }> {
  // Strip non-digits and country code (+91) to extract 10-digit Indian mobile number
  const cleanNumber = phone.replace(/[^0-9]/g, '').slice(-10);

  if (cleanNumber.length !== 10) {
    console.warn('[FAST2SMS WARNING] Invalid Indian mobile number format:', phone);
    return {
      success: false,
      message: 'Invalid Indian mobile number format. Must be exactly 10 digits.',
      isLiveSent: false,
    };
  }

  const apiKey = process.env.FAST2SMS_API_KEY?.trim() || '';

  if (!apiKey) {
    console.error('====================================================');
    console.error('❌ [FAST2SMS CONFIG ERROR]: Missing FAST2SMS_API_KEY in .env.local');
    console.error(`📱 Recipient: +91 ${cleanNumber}`);
    console.error(`🔐 Generated OTP: ${otp}`);
    console.error('====================================================');
    return {
      success: false,
      message: 'FAST2SMS_API_KEY is missing in .env.local',
      isLiveSent: false,
      errorDetails: 'Missing FAST2SMS_API_KEY in environment variables.',
    };
  }

  try {
    console.log('====================================================');
    console.log(`[FAST2SMS INITIATE] Sending OTP "${otp}" to mobile: +91 ${cleanNumber}`);
    console.log('====================================');

    const url = 'https://www.fast2sms.com/dev/bulkV2';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        authorization: apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        route: 'otp',
        variables_values: String(otp),
        numbers: cleanNumber,
      }),
    });

    const data = await response.json();
    console.log('====================================================');
    console.log('[FAST2SMS GATEWAY RESPONSE]:', JSON.stringify(data, null, 2));
    console.log('====================================================');

    if (data.return === true || data.status_code === 200) {
      return {
        success: true,
        message: `SMS dispatched successfully via Fast2SMS to +91 ${cleanNumber}`,
        isLiveSent: true,
        gatewayResponse: data,
      };
    } else {
      const errorMsg = Array.isArray(data.message)
        ? data.message.join(', ')
        : data.message || 'Fast2SMS dispatch rejected by gateway';
      console.error('[FAST2SMS REJECTED]:', errorMsg);
      return {
        success: false,
        message: errorMsg,
        isLiveSent: false,
        errorDetails: errorMsg,
        gatewayResponse: data,
      };
    }
  } catch (error: any) {
    console.error('[FAST2SMS FATAL EXCEPTION]:', error);
    return {
      success: false,
      message: error?.message || 'Network error connecting to Fast2SMS gateway.',
      isLiveSent: false,
      errorDetails: error?.message || 'Network exception',
    };
  }
}
