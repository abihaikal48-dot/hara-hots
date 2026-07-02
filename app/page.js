'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { playHotsSound } from '@/hooks/useHotsAudio';

export default function WelcomePage() {
  const router = useRouter();
  const [outlets, setOutlets] = useState([]);
  const [kruList, setKruList] = useState([]);
  const [selectedOutlet, setSelectedOutlet] = useState('');
  const [selectedKru, setSelectedKru] = useState('');

  useEffect(() => {
    async function loadOutlets() {
      const { data } = await supabase.from('outlets').select('*').eq('is_active', true);
      if (data && data.length) {
        setOutlets(data);
      } else {
        // Fallback Data Simulasi
        setOutlets([
          { id: 'b3017cf7-8bb3-418c-b9b5-fcfb8e0e7a2b', nama: 'Bantul Niten' },
          { id: 'f60f69a5-7b56-4c4f-9efd-a94f9c5be4e3', nama: 'Outlet Demo' }
        ]);
      }
    }
    loadOutlets();
  }, []);

  useEffect(() => {
    if (!selectedOutlet) return;
    async function loadKru() {
      const { data } = await supabase.from('kru').select('*').eq('outlet_id', selectedOutlet);
      if (data && data.length) {
        setKruList(data);
      } else {
        setKruList([
          { id: 'k1', nama: 'Dewa', divisi: 'Kitchen', minggu_aktif: 3 },
          { id: 'k2', nama: 'Arif', divisi: 'Kitchen', minggu_aktif: 1 },
          { id: 'k3', nama: 'Qurba', divisi: 'Kasir', minggu_aktif: 2 },
          { id: 'k4', nama: 'Iman', divisi: 'Helper', minggu_aktif: 1 },
          { id: 'k5', nama: 'Ety', divisi: 'Geprek', minggu_aktif: 4, is_all_rounder: true }
        ]);
      }
    }
    loadKru();
  }, [selectedOutlet]);

  const handleKruLogin = () => {
    if (!selectedKru) return;
    const match = kruList.find(k => k.id === selectedKru);
    localStorage.setItem('hots_active_kru', JSON.stringify(match));
    localStorage.setItem('hots_active_outlet', selectedOutlet);
    playHotsSound('success');
    router.push('/exam');
  };

  return (
    <main className="min-h-screen bg-[#070101] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#120303] border border-red-950/40 p-8 rounded-3xl shadow-2xl relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#D42B2B]/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex items-center gap-3 justify-center mb-8">
          <div className="w-12 h-12 bg-[#D42B2B] rounded-2xl flex items-center justify-center shadow-lg shadow-[#D42B2B]/20">
            <span className="font-extrabold text-base text-white">HOTS</span>
          </div>
          <div>
            <h1 className="text-lg font-black tracking-wider leading-none">HOTS V41</h1>
            <p className="text-[9px] text-gray-500 font-bold uppercase mt-1">Hara Operational & Training System</p>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">1. Pilih Cabang Outlet</label>
            <select value={selectedOutlet} onChange={(e) => { playHotsSound('tap'); setSelectedOutlet(e.target.value); }} className="w-full bg-[#1B0606] border border-gray-800 rounded-xl px-4 py-3.5 text-xs text-white focus:outline-none focus:border-[#D42B2B] transition-all">
              <option value="">-- Pilih Cabang --</option>
              {outlets.map(o => <option key={o.id} value={o.id}>{o.nama}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">2. Nama Karyawan</label>
            <select value={selectedKru} onChange={(e) => { playHotsSound('tap'); setSelectedKru(e.target.value); }} className="w-full bg-[#1B0606] border border-gray-800 rounded-xl px-4 py-3.5 text-xs text-white focus:outline-none focus:border-[#D42B2B] transition-all" disabled={!selectedOutlet}>
              <option value="">-- Pilih Nama Anda --</option>
              {kruList.map(k => <option key={k.id} value={k.id}>{k.nama} ({k.divisi})</option>)}
            </select>
          </div>

          <button onClick={handleKruLogin} className="w-full bg-[#D42B2B] hover:bg-red-700 text-white font-bold py-4 rounded-xl text-xs uppercase tracking-widest transition-all mt-4 shadow-lg shadow-[#D42B2B]/25" disabled={!selectedKru}>
            Masuk Beranda
          </button>
        </div>

        <div className="mt-8 border-t border-gray-900 pt-5 flex justify-between items-center">
          <button onClick={() => { playHotsSound('tap'); router.push('/dashboard'); }} className="text-xs text-[#F5C518] hover:underline font-bold flex items-center gap-1.5">
            🔑 Panel Trainer Admin
          </button>
          <span className="text-[9px] text-gray-700 font-bold uppercase">HOTS OMNI SYSTEM</span>
        </div>
      </div>
    </main>
  );
}
