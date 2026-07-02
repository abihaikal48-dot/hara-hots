'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { playHotsSound } from '../lib/audio';

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
    const { data: kruData } = await supabase.from('kru').select('*').eq('outlet_id', oId);
    setKruList(kruData || []);
  }

  function handleMasuk(targetScreen) {
    playHotsSound('tap');
    if (!selectedOutlet || !selectedKru) {
      alert("Harap pilih Outlet dan Nama Anda terlebih dahulu!");
      return;
    }
    const targetKru = kruList.find(k => k.id === selectedKru);
    localStorage.setItem('hots_kru_id', targetKru.id);
    localStorage.setItem('hots_kru_nama', targetKru.nama);
    localStorage.setItem('hots_kru_divisi', targetKru.divisi);
    localStorage.setItem('hots_kru_minggu', targetKru.minggu_aktif);
    localStorage.setItem('hots_outlet_id', selectedOutlet);
    router.push(targetScreen);
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-deep">
      <div className="w-full max-w-md bg-surface p-6 rounded-2xl border border-redTrans shadow-2xl">
        <div className="text-center mb-6">
          <span className="text-4xl">🍗</span>
          <h1 className="text-2xl font-black text-crimson mt-2 tracking-wide">HOTS PORTAL</h1>
          <p className="text-xs text-gray-500 uppercase tracking-widest">Hara Operational & Training System</p>
        </div>

        {loading ? (
          <div className="text-center text-gold py-4 font-bold">Memuat portal sistem...</div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-xs uppercase text-gray-400 font-bold mb-1">Pilih Outlet Kerja</label>
              <select 
                value={selectedOutlet}
                onChange={handleOutletChange}
                className="w-full bg-deep border border-gray-800 p-3 rounded-lg text-white focus:outline-none focus:border-crimson"
              >
                <option value="">-- Pilih Outlet --</option>
                {outlets.map(o => (
                  <option key={o.id} value={o.id}>{o.nama}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase text-gray-400 font-bold mb-1">Nama Karyawan</label>
              <select 
                value={selectedKru}
                onChange={(e) => setSelectedKru(e.target.value)}
                disabled={!selectedOutlet}
                className="w-full bg-deep border border-gray-800 p-3 rounded-lg text-white focus:outline-none focus:border-crimson disabled:opacity-50"
              >
                <option value="">-- Pilih Nama --</option>
                {kruList.map(k => (
                  <option key={k.id} value={k.id}>{k.nama} ({k.divisi})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button 
                onClick={() => handleMasuk('/exam')}
                className="bg-crimson hover:bg-red-700 text-white font-bold p-3.5 rounded-xl transition duration-150 uppercase text-xs tracking-wider"
              >
                📝 Ambil CBT
              </button>
              <button 
                onClick={() => handleMasuk('/piket')}
                className="bg-gold hover:bg-yellow-600 text-deep font-bold p-3.5 rounded-xl transition duration-150 uppercase text-xs tracking-wider"
              >
                🧹 Lapor Piket
              </button>
            </div>

            <button 
              onClick={() => router.push('/dashboard')}
              className="w-full bg-surface border border-gray-800 text-gray-400 font-bold p-3 rounded-xl transition duration-150 uppercase text-xs tracking-wider mt-2"
            >
              🔒 Ruang Kerja Trainer
            </button>
          </div>
        )}
      </div>
      <p className="text-center text-[10px] text-gray-600 mt-6 font-semibold uppercase tracking-wider">Hara Chicken Corp · Omni System V41</p>
    </div>
  );
}
