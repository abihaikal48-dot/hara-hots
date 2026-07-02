'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { playHotsSound } from '@/hooks/useHotsAudio';

export default function ExamPage() {
  const router = useRouter();
  const [kru, setKru] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [examTime, setExamTime] = useState(1800); // 30 Menit
  const [cheatFlags, setCheatFlags] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const active = localStorage.getItem('hots_active_kru');
    if (!active) {
      router.push('/');
      return;
    }
    const parsedKru = JSON.parse(active);
    setKru(parsedKru);

    async function loadQuestions() {
      const { data } = await supabase.from('bank_soal').select('*').eq('divisi', parsedKru.divisi);
      if (data && data.length) {
        setQuestions(data);
      } else {
        setQuestions([
          { id: 'q1', pertanyaan: 'Berapakah suhu angka ideal untuk melakukan thawing ayam di dalam showcase?', opsi_a: '3', opsi_b: '1', opsi_c: '5', opsi_d: '4', tipe: 'PG', topik: 'Thawing Ayam' },
          { id: 'q2', pertanyaan: 'Bagaimanakah urutan tombol rice cooker gas yang ditekan saat memasak nasi sesuai SOP?', tipe: 'ESAI', topik: 'Masak Nasi' }
        ]);
      }
    }
    loadQuestions();
  }, [router]);

  useEffect(() => {
    if (questions.length === 0 || isSubmitting) return;
    const handleVisibility = () => {
      if (document.hidden) {
        setCheatFlags(prev => {
          const next = prev + 1;
          playHotsSound('cheat_alert');
          if (next >= 3) handleSubmitExam();
          return next;
        });
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [questions, isSubmitting]);

  const handleSubmitExam = async () => {
    setIsSubmitting(true);
    playHotsSound('success');
    alert('Ujian berhasil dikirim!');
    localStorage.removeItem('hots_active_kru');
    router.push('/');
  };

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  if (!kru) return null;

  return (
    <main className="min-h-screen bg-[#070101] text-white p-4 flex flex-col justify-between max-w-md mx-auto py-8">
      <div>
        <div className="flex justify-between items-center mb-4">
          <span className="text-[10px] font-black tracking-wider text-gray-500 uppercase">Ujian Teori M{kru.minggu_aktif}</span>
          <span className="text-lg font-black text-[#F5C518]">{formatTimer(examTime)}</span>
        </div>

        {cheatFlags > 0 && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-500 font-bold">
            ⚠️ DETEKSI: Layar ditinggalkan ({cheatFlags}/3). Sesi otomatis terkunci jika melanggar 3 kali.
          </div>
        )}

        <div className="space-y-6">
          {questions.map((q, idx) => (
            <div key={q.id} className="bg-[#120303] border border-gray-900 p-5 rounded-2xl space-y-4">
              <span className="inline-block px-2.5 py-1 text-[9px] font-bold bg-[#D42B2B]/10 text-[#D42B2B] rounded-md uppercase">{q.topik}</span>
              <p className="text-xs font-bold leading-relaxed">{idx + 1}. {q.pertanyaan}</p>

              {q.tipe === 'PG' ? (
                <div className="space-y-2">
                  {[q.opsi_a, q.opsi_b, q.opsi_c, q.opsi_d].filter(Boolean).map((opsi, oIdx) => (
                    <button key={oIdx} onClick={() => { playHotsSound('tap'); setAnswers(prev => ({...prev, [q.id]: opsi})); }} className={`w-full text-left p-3 rounded-xl border text-xs font-bold transition-all ${answers[q.id] === opsi ? 'border-[#D42B2B] bg-[#D42B2B]/5 text-white' : 'border-gray-900 bg-[#1B0606] text-gray-400'}`}>
                      {opsi}
                    </button>
                  ))}
                </div>
              ) : (
                <textarea onChange={(e) => setAnswers(prev => ({...prev, [q.id]: e.target.value}))} className="w-full bg-[#1B0606] border border-gray-800 rounded-xl p-3 text-xs text-white focus:outline-none" rows="3" placeholder="Tulis jawaban esai..." />
              )}
            </div>
          ))}
        </div>
      </div>

      <button onClick={handleSubmitExam} className="w-full bg-[#D42B2B] text-white font-bold py-4 rounded-xl text-xs uppercase tracking-widest mt-6" disabled={isSubmitting}>
        Kirim Jawaban
      </button>
    </main>
  );
}
