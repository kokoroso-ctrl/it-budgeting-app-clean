import { NextRequest, NextResponse } from 'next/server';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_TOKEN || "8337042487:AAFqOqL7DzkA18-55twlGsyadt1TLmK3Z6Q";
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || "1080653381";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json({ 
        error: 'Message is required' 
      }, { status: 400 });
    }

    const telegramApiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    const response = await fetch(telegramApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Telegram API error:', data);
      return NextResponse.json({ 
        error: 'Failed to send Telegram notification',
        details: data
      }, { status: response.status });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Notification sent successfully'
    }, { status: 200 });
  } catch (error) {
    console.error('Telegram notification error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}
