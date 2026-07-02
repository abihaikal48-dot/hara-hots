import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { divisi, minggu } = await request.json();
    
    const { data: questions, error } = await supabase
      .from('bank_soal')
      .select('*')
      .eq('divisi', divisi)
      .eq('minggu', minggu);

    if (error) throw error;

    // Pengacakan soal dinamis di sisi server
    const shuffled = (questions || []).sort(() => Math.random() - 0.5);

    return NextResponse.json({ questions: shuffled });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
