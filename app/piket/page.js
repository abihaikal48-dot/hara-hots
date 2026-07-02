'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { playHotsSound } from '@/hooks/useHotsAudio';

export default function PiketPage() {
  const router = useRouter();
  const [kru, setKru] = useState(null);
  const [assignedArea, setAssignedArea] = useState(null);
  const [fotoB64, setFotoB64] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const active = localStorage.getItem('hots_active_kru');
    if (!active) {
      router.push('/');
      return;
    }
    const parsedKru = JSON.parse(active);
    setKru(parsedKru);

    async function detectPiketArea() {
      const today = new Date().toISOString().slice(0, 10);
      const { data: roster } = await supabase
        .from('hots_shift_roster')
        .select('*, hots_piket_areas(*)')
        .eq('kru_id', parsedKru.id)
        .eq('tanggal', today)
        .single();

      if (roster && roster.hots_piket_areas) {
        setAssignedArea(roster.hots_piket_areas);
      } else {
        setAssignedArea({ id: 'a1', nama_area: 'Halaman Depan', warna_kode: 'Hijau' });
      }
    }
    detectPiketArea();
  }, [router]);

  const handleCapturePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setFotoB64(ev.target.result.split(',')[1]);
      playHotsSound('tap');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitPiket = async () => {
    if (!fotoB64) {
      alert("Ambil foto bukti kebersihan area.");
      return;
    }
    setIsLoading(true);
    playHotsSound('tap');

    try {
      const res = await fetch('/api/piket/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kruId: kru.id,
          areaId: assignedArea.id,
          areaNama: assignedArea.nama_area,
          fotoBase64: fotoB64,
          mimeType: 'image/jpeg'
        })
      });
      const result = await res.json();
      playHotsSound('success');
      alert(`Piket Berhasil!\nSkor Kebersihan AI: ${result.skor_ai}`);
      router.push('/');
    } catch (e) {
      alert("Gagal memproses piket.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!kru || !assignedArea) return null;

  return (
    <main className="min-h-screen bg-[#070101] text-white p-4 max-w-md mx-auto py-8 flex flex-col justify-between">
      <div className="space-y-6">
        <div>
          <h2 className="text-base font-black uppercase">LAPORAN KEBERSIHAN</h2>
          <p className="text-xs text-gray-500 mt-1">Area Penugasan:</p>
          <div className="mt-3 p-4 bg-[#120303] border border-red-950/30 rounded-2xl">
            <span className="text-xs font-black text-white">{assignedArea.nama_area}</span>
          </div>
        </div>

        <div className="bg-[#120303] border border-gray-900 p-6 rounded-2xl text-center space-y-4">
          <input type="file" accept="image/*" capture="environment" onChange={handleCapturePhoto} className="hidden" id="piket-input" />
          <label htmlFor="piket-input" className="inline-block cursor-pointer px-5 py-2.5 bg-[#1B0606] border border-gray-800 text-xs font-black uppercase rounded-xl transition-all">
            {fotoB64 ? 'Ganti Foto' : 'Ambil Foto'}
          </label>
        </div>
      </div>

      <button onClick={handleSubmitPiket} className="w-full bg-[#D42B2B] hover:bg-red-700 text-white font-bold py-4 rounded-xl text-xs uppercase tracking-widest mt-6" disabled={isLoading}>
        Kirim Laporan Piket
      </button>
    </main>
  );
}
