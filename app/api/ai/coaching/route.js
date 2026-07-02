import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { kru_id } = await request.json();

    // Dapatkan data performa tes kru dari database
    const { data: ujian } = await supabase
      .from('sesi_ujian')
      .select('skor, status, divisi, minggu')
      .eq('kru_id', kru_id)
      .order('created_at', { ascending: false });

    let rawStats = "Belum ada riwayat ujian.";
    if (ujian && ujian.length > 0) {
      rawStats = ujian.map(u => `Divisi: ${u.divisi}, Minggu: ${u.minggu}, Skor: ${u.skor} (${u.status})`).join("\n");
    }

    let coachingText = "Rapor Anda masih bersih. Lakukan kuis kuesioner pertama Anda untuk mendapatkan umpan balik dari AI Coach!";

    if (process.env.GEMINI_API_KEY && ujian && ujian.length > 0) {
      try {
        const prompt = `Anda adalah AI Coach yang bertugas melatih kru operasional Hara Chicken. Berdasarkan histori ujian kuesioner kru berikut:\n\n${rawStats}\n\nBerikan 2 kalimat saran penyemangat yang konstruktif dan taktis untuk meningkatkan kualitas kerja mereka di lapangan sesuai standar SOP.`;
        
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }]
            })
          }
        );

        const aiData = await response.json();
        coachingText = aiData.candidates?.[0]?.content?.parts?.[0]?.text || coachingText;
      } catch (err) {
        console.warn("Layanan Gemini Coach tertunda:", err);
      }
    }

    return NextResponse.json({ saran: coachingText });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
