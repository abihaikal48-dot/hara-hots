'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { playHotsSound, startLofiAmbient, stopLofiAmbient } from '../../lib/audio';

export default function ExamPage() {
  const router = useRouter();
  const [kru, setKru] = useState(null);
  const [soal, setSoal] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [jawaban, setJawaban] = useState({});
  const [durasi, setDurasi] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const kId = localStorage.getItem('hots_kru_id');
    if (!kId) {
      router.push('/');
      return;
    }
    setKru({
      id: kId,
      nama: localStorage.getItem('hots_kru_nama'),
      divisi: localStorage.getItem('hots_kru_divisi'),
      minggu: localStorage.getItem('hots_kru_minggu'),
    });

    async function loadSoal() {
      try {
        const res = await fetch('/api/exam/get-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            divisi: localStorage.getItem('hots_kru_divisi'),
            minggu: localStorage.getItem('hots_kru_minggu')
          })
        });
        const data = await res.json();
        setSoal(data.questions || []);
      } catch (err) {
        console.error("Gagal menarik data bank soal.");
      } finally {
        setLoading(false);
        startLofiAmbient();
      }
    }
    loadSoal();

    const interval = setInterval(() => {
      setDurasi(prev => prev + 1);
    }, 1000);

    return () => {
      clearInterval(interval);
      stopLofiAmbient();
    };
  }, [router]);

  function pilihOpsi(opsi) {
    playHotsSound('tap');
    setJawaban({ ...jawaban, [soal[currentIndex].id]: opsi });
  }

  function handleNext() {
    if (currentIndex < soal.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      submitUjian();
    }
  }

  async function submitUjian() {
    playHotsSound('success');
    setLoading(true);
    try {
      const res = await fetch('/api/exam/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kru_id: kru.id,
          divisi: kru.divisi,
          minggu: kru.minggu,
          jawaban: jawaban,
          durasi: durasi
        })
      });
      const result = await res.json();
      alert(`Hasil Ujian: Skor ${result.score}% - ${result.passed ? 'LULUS (Siap Naik Siklus)' : 'REMEDIAL'}`);
    } catch (err) {
      alert("Terjadi masalah saat mengirim lembar jawaban.");
    } finally {
      localStorage.clear();
      router.push('/');
    }
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-gold font-bold">Menyiapkan Lembar Soal Ujian...</div>;
  }

  if (soal.length === 0) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center p-6 text-center">
        <p className="text-gray-400 mb-4">Bank soal belum diisi oleh Trainer untuk divisi dan minggu ini.</p>
        <button onClick={() => router.push('/')} className="bg-crimson px-6 py-3 rounded-lg font-bold">Kembali ke Beranda</button>
      </div>
    );
  }

  const q = soal[currentIndex];

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-4 bg-surface p-3 rounded-xl border border-redTrans">
        <div>
          <h2 className="text-sm font-bold text-crimson">{kru?.nama}</h2>
          <p className="text-[10px] text-gray-400 uppercase">{kru?.divisi} - Minggu {kru?.minggu}</p>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-gray-400 block font-bold">WAKTU BERJALAN</span>
          <span className="font-mono text-gold text-sm">{Math.floor(durasi / 60)}m {durasi % 60}s</span>
        </div>
      </div>

      <div className="mb-4">
        <div className="w-full bg-gray-900 h-1 rounded-full overflow-hidden">
          <div 
            className="bg-crimson h-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / soal.length) * 100}%` }}
          />
        </div>
        <p className="text-right text-[10px] text-gray-500 mt-1">Soal {currentIndex + 1} dari {soal.length}</p>
      </div>

      <div className="bg-surface p-5 rounded-2xl border border-redTrans shadow-xl mb-6">
        <span className="text-xs uppercase bg-red-950 text-crimson px-2.5 py-1 rounded-md font-bold inline-block mb-3">SOP {q?.topik}</span>
        <h3 className="text-base font-bold leading-relaxed">{q?.pertanyaan}</h3>
      </div>

      <div className="space-y-3">
        {[q?.opsi_a, q?.opsi_b, q?.opsi_c, q?.opsi_d].map((o, idx) => {
          const isSelected = jawaban[q.id] === o;
          return (
            <button 
              key={idx}
              onClick={() => pilihOpsi(o)}
              className={`w-full text-left p-4 rounded-xl border transition ${
                isSelected ? 'bg-crimson/10 border-crimson text-white font-bold' : 'bg-surface border-gray-900 text-gray-300'
              }`}
            >
              {o}
            </button>
          );
        })}
      </div>

      <button 
        onClick={handleNext}
        className="w-full bg-crimson hover:bg-red-700 text-white font-bold p-4 rounded-xl transition duration-150 uppercase mt-8 tracking-wider"
      >
        {currentIndex === soal.length - 1 ? 'Kumpulkan Ujian' : 'Soal Berikutnya'}
      </button>
    </div>
  );
}
