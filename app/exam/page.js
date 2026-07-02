'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { playHotsSound, startLofiAmbient, stopLofiAmbient } from '../../lib/audio';
import Navigation from '../../components/Navigation';

export default function ExamPage() {
  const router = useRouter();
  const [kru, setKru] = useState(null);
  const [soal, setSoal] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [jawaban, setJawaban] = useState({});
  const [durasi, setDurasi] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const kId = localStorage.getItem('hots_kru_id');
    if (!kId) {
      router.push('/');
      return;
    }
    setKru({
      id: kId,
      nama: localStorage.getItem('hots_kru_nama') || '',
      divisi: localStorage.getItem('hots_kru_divisi') || '',
      minggu: localStorage.getItem('hots_kru_minggu') || '1',
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
        console.error("Gagal menarik data bank soal:", err);
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
    if (soal[currentIndex]) {
      setJawaban({ ...jawaban, [soal[currentIndex].id]: opsi });
    }
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
          kru_id: kru?.id,
          divisi: kru?.divisi,
          minggu: kru?.minggu,
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
    return (
      <div className="flex min-h-screen items-center justify-center text-gold font-bold bg-deep flex-col gap-3">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        Menyiapkan lembar ujian...
      </div>
    );
  }

  if (soal.length === 0) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center p-6 text-center bg-deep animate-fade-in">
        <p className="text-gray-400 mb-6 font-semibold">Lembar bank soal ujian untuk divisi dan minggu ini belum disiapkan oleh Trainer.</p>
        <button onClick={() => router.push('/')} className="bg-crimson hover:bg-red-700 px-6 py-3.5 rounded-xl font-bold transition shadow-lg shadow-crimson/10">
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  const q = soal[currentIndex];

  return (
    <div className="p-4 max-w-lg mx-auto bg-deep min-h-screen animate-fade-in">
      <div className="flex justify-between items-center mb-4 bg-surface p-4 rounded-2xl border border-redTrans shadow-md">
        <div>
          <h2 className="text-sm font-extrabold text-white">{kru?.nama}</h2>
          <p className="text-[10px] text-gray-500 uppercase font-black tracking-wider mt-0.5">{kru?.divisi} · Minggu {kru?.minggu}</p>
        </div>
        <div className="text-right flex flex-col items-end">
          <span className="text-[9px] text-gray-500 block font-bold tracking-widest uppercase">DURASI</span>
          <span className="font-mono text-gold text-xs bg-gold/5 border border-gold/10 px-2 py-0.5 rounded-md mt-0.5">
            {String(Math.floor(durasi / 60)).padStart(2, '0')}:{String(durasi % 60).padStart(2, '0')}
          </span>
        </div>
      </div>

      <div className="mb-5">
        <div className="w-full bg-gray-950 h-1.5 rounded-full overflow-hidden">
          <div 
            className="bg-gradient-to-r from-crimson to-gold h-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / soal.length) * 100}%` }}
          />
        </div>
        <p className="text-right text-[10px] text-gray-500 mt-1.5 font-bold">Soal {currentIndex + 1} dari {soal.length}</p>
      </div>

      <div className="bg-surface p-6 rounded-2xl border border-redTrans shadow-xl mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-crimson/5 rounded-full filter blur-xl" />
        <span className="text-[10px] tracking-wider uppercase bg-red-950 text-crimson border border-crimson/25 px-2.5 py-1 rounded-lg font-black inline-block mb-3.5">
          SOP {q?.topik}
        </span>
        <h3 className="text-sm font-extrabold leading-relaxed text-gray-100">{q?.pertanyaan}</h3>
      </div>

      <div className="space-y-3">
        {[q?.opsi_a, q?.opsi_b, q?.opsi_c, q?.opsi_d].map((o, idx) => {
          const isSelected = jawaban[q?.id] === o;
          return (
            <button 
              key={idx}
              onClick={() => pilihOpsi(o)}
              className={`w-full text-left p-4 rounded-xl border text-xs font-semibold leading-relaxed transition-all duration-150 ${
                isSelected 
                  ? 'bg-crimson/10 border-crimson text-white font-bold shadow-lg shadow-crimson/10' 
                  : 'bg-surface border-gray-900 text-gray-300 hover:border-gray-800'
              }`}
            >
              <span className={`inline-flex w-5 h-5 items-center justify-center rounded-md mr-3 text-[10px] font-black ${
                isSelected ? 'bg-crimson text-white' : 'bg-deep text-gray-500'
              }`}>
                {String.fromCharCode(65 + idx)}
              </span>
              {o}
            </button>
          );
        })}
      </div>

      <button 
        onClick={handleNext}
        className="w-full bg-crimson hover:bg-red-700 text-white font-extrabold p-4 rounded-xl transition duration-150 uppercase mt-8 text-xs tracking-wider shadow-lg shadow-crimson/10"
      >
        {currentIndex === soal.length - 1 ? 'Kumpulkan Ujian' : 'Soal Berikutnya'}
      </button>
      <Navigation />
    </div>
  );
}
