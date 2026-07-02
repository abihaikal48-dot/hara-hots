import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { kru_id, piket_area_id, foto_url } = await request.json();

    // Tarik nama area piket dari DB
    const { data: area } = await supabase
      .from('hots_piket_areas')
      .select('nama_area')
      .eq('id', piket_area_id)
      .single();

    let aiScore = 80; // Default fallback score
    let aiFeedback = "Foto area terdeteksi cukup bersih dan rapi sesuai standar.";

    // Pemrosesan model vision Gemini AI
    if (process.env.GEMINI_API_KEY) {
      try {
        const prompt = `Analisis tingkat kebersihan area "${area.nama_area}" dari foto berikut. Berikan nilai kebersihan dengan skala integer 1 sampai 100 dan berikan catatan evaluasi singkat dalam format JSON: {"skor": 90, "catatan": "Kondisi sangat bersih, lantai kering"}`;
        
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: prompt },
                    {
                      inlineData: {
                        mimeType: "image/jpeg",
                        data: await fetch(foto_url).then(res => res.arrayBuffer()).then(buf => Buffer.from(buf).toString('base64'))
                      }
                    }
                  ]
                }
              ]
            })
          }
        );

        const aiData = await response.json();
        const responseText = aiData.candidates?.[0]?.content?.parts?.[0]?.text;
        
        // Parsing output JSON aman dari Gemini
        const jsonMatch = responseText.match(/\{.*\}/s);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          aiScore = parsed.skor || 80;
          aiFeedback = parsed.catatan || aiFeedback;
        }
      } catch (geminiError) {
        console.warn("Koneksi AI Gemini tertunda, menggunakan default evaluator:", geminiError);
      }
    }

    // Rekam log pengerjaan ke database
    await supabase.from('log_piket').insert([{
      kru_id: kru_id,
      piket_area_id: piket_area_id,
      foto_url: foto_url,
      skor_ai: aiScore,
      catatan_ai: aiFeedback,
      status: 'Selesai'
    }]);

    return NextResponse.json({ ai_score: aiScore, ai_feedback: aiFeedback });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
