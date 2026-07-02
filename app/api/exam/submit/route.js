import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { kru_id, divisi, minggu, jawaban, durasi } = await request.json();

    // Ambil soal asli dari DB untuk validasi kunci
    const { data: questions } = await supabase
      .from('bank_soal')
      .select('*')
      .eq('divisi', divisi)
      .eq('minggu', minggu);

    let correctCount = 0;
    const detailRows = [];

    questions.forEach(q => {
      const userAns = jawaban[q.id];
      const isCorrect = userAns === q.opsi_a; // Opsi A selalu menjadi kunci di database admin

      if (isCorrect) correctCount++;

      detailRows.push({
        topik: q.topik,
        tipe: q.tipe,
        pertanyaan: q.pertanyaan,
        jawaban_kru: userAns || null,
        kunci: q.opsi_a,
        is_benar: isCorrect
      });
    });

    const score = Math.round((correctCount / questions.length) * 100);
    const passed = score >= 70; // Passing grade 70%

    // Rekam sesi ujian utama
    const { data: session, error: sessError } = await supabase
      .from('sesi_ujian')
      .insert([{
        kru_id: kru_id,
        divisi: divisi,
        minggu: minggu,
        skor: score,
        durasi: durasi,
        status: passed ? 'Lulus' : 'Gagal'
      }])
      .select()
      .single();

    if (sessError) throw sessError;

    // Rekam detail jawaban kuesioner
    const inserts = detailRows.map(row => ({
      sesi_ujian_id: session.id,
      ...row
    }));
    await supabase.from('jawaban_detail').insert(inserts);

    // Update status kru jika lulus
    if (passed) {
      let nextStatus = 'Siap Naik M2';
      let nextM = parseInt(minggu);
      if (minggu == 1) { nextStatus = 'Siap Naik M2'; nextM = 2; }
      else if (minggu == 2) { nextStatus = 'Siap Naik M3'; nextM = 3; }
      else if (minggu == 3) { nextStatus = 'Siap Naik M4'; nextM = 4; }
      else if (minggu == 4) { nextStatus = 'Lulus'; }

      await supabase.from('kru').update({
        status: nextStatus,
        minggu_aktif: nextM
      }).eq('id', kru_id);
    }

    return NextResponse.json({ score: score, passed: passed });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
