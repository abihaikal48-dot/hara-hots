'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { playHotsSound } from '../lib/audio';
import Logo from '../components/Logo';
import Navigation from '../components/Navigation';

export default function Home() {
  const router = useRouter();
  const [outlets, setOutlets] = useState([]);
  const [kruList, setKruList] = useState([]);
  const [selectedOutlet, setSelectedOutlet] = useState('');
  const [selectedKru, setSelectedKru] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initPortal() {
      try {
        const { data: outletData } = await supabase.from('outlets').select('*').eq('is_active', true);
        setOutlets(outletData || []);
      } catch (err) {
        console.error("Gagal memuat outlet:", err);
      } finally {
        setLoading(false);
      }
    }
    initPortal();
  }, []);

  async function handleOutletChange(e) {
    const oId = e.target.value;
    setSelectedOutlet(oId);
    setSelectedKru('');
    if (!oId) {
      setKruList([]);
      return;
    }
    try {
      const { data: kruData } = await supabase.from('kru').select('*').eq('outlet_id', oId);
      setKruList(kruData || []);
    } catch (err) {
      console.error("Gagal memuat kru:", err);
    }
  }

  function handleMasuk(targetScreen) {
    playHotsSound('tap');
    if (!selectedOutlet || !selectedKru) {
      alert("Harap pilih Outlet dan Nama Anda terlebih dahulu!");
      return;
    }
    const targetKru = kruList.find(k => k.id === selectedKru);
    if (!targetKru) {
      alert("Data kru tidak valid.");
      return;
    }
    localStorage.setItem('hots_kru_id', targetKru.id);
    localStorage.setItem('hots_kru_nama', targetKru.nama);
    localStorage.setItem('hots_kru_divisi', targetKru.divisi);
    localStorage.setItem('hots_kru_minggu', targetKru.minggu_aktif);
    localStorage.setItem('hots_outlet_id', selectedOutlet);
    router.push(targetScreen);
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-deep animate-fade-in">
      <div className="w-full max-w-md bg-surface p-6 rounded-2xl border border-redTrans shadow-2xl animate-pulse-glow">
        <div className="flex flex-col items-center mb-6">
          <Logo size={104} />
          <h1 className="text-2xl font-black text-crimson mt-4 tracking-wide">TES SOP</h1>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mt-1">Hara Chicken · Omni System V41</p>
        </div>

        {loading ? (
          <div className="text-center text-gold py-6 font-bold flex flex-col items-center gap-3">
            <div className="w-6 h-6 border-2 border-crimson border-t-transparent rounded-full animate-spin" />
            Memuat portal sistem...
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase text-gray-400 font-bold mb-1.5 tracking-wider">Pilih Outlet Kerja</label>
              <select 
                value={selectedOutlet}
                onChange={handleOutletChange}
                className="w-full bg-deep border border-gray-800 p-3 rounded-xl text-white focus:outline-none focus:border-crimson transition-all"
              >
                <option value="">-- Pilih Outlet --</option>
                {outlets.map(o => (
                  <option key={o.id} value={o.id}>{o.nama}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase text-gray-400 font-bold mb-1.5 tracking-wider">Nama Karyawan</label>
              <select 
                value={selectedKru}
                onChange={(e) => setSelectedKru(e.target.value)}
                disabled={!selectedOutlet}
                className="w-full bg-deep border border-gray-800 p-3 rounded-xl text-white focus:outline-none focus:border-crimson disabled:opacity-40 transition-all"
              >
                <option value="">-- Pilih Nama Anda --</option>
                {kruList.map(k => (
                  <option key={k.id} value={k.id}>{k.nama} ({k.divisi})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button 
                onClick={() => handleMasuk('/exam')}
                className="bg-crimson hover:bg-red-700 text-white font-extrabold p-4 rounded-xl transition duration-150 uppercase text-xs tracking-wider shadow-lg shadow-crimson/15 active:scale-95"
              >
                📝 Ambil CBT
              </button>
              <button 
                onClick={() => handleMasuk('/piket')}
                className="bg-gold hover:bg-yellow-600 text-deep font-extrabold p-4 rounded-xl transition duration-150 uppercase text-xs tracking-wider shadow-lg shadow-gold/10 active:scale-95"
              >
                🧹 Lapor Piket
              </button>
            </div>
          </div>
        )}
      </div>
      <Navigation />
    </div>
  );
}
