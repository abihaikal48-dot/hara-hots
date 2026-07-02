'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { playHotsSound } from '../../lib/audio';
import Navigation from '../../components/Navigation';

export default function PiketPage() {
  const [kru, setKru] = useState([]);
  const [areas, setAreas] = useState([]);
  const [selectedKru, setSelectedKru] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [foto, setFoto] = useState(null);
  const [preview, setPreview] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    async function loadForm() {
      try {
        const { data: k } = await supabase.from('kru').select('*');
        const { data: a } = await supabase.from('hots_piket_areas').select('*');
        setKru(k || []);
        setAreas(a || []);
      } catch (err) {
        console.error("Gagal memuat parameter piket:", err);
      }
    }
    loadForm();
  }, []);

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (file) {
      setFoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  }

  async function handleLapor() {
    playHotsSound('tap');
    if (!selectedKru || !selectedArea || !foto) {
      alert("Harap lengkapi Kru, Area Piket, dan Bukti Foto!");
      return;
    }

    setUploading(true);
    const fileExt = foto.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `piket/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('piket-photos')
        .upload(filePath, foto);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('piket-photos')
        .getPublicUrl(filePath);

      const res = await fetch('/api/piket/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kru_id: selectedKru,
          piket_area_id: selectedArea,
          foto_url: publicUrlData.publicUrl
        })
      });

      const result = await res.json();
      alert(`Laporan Piket Berhasil Dikirim! Skor AI Kebersihan: ${result.ai_score}/100. Catatan AI: ${result.ai_feedback}`);
      setSelectedKru('');
      setSelectedArea('');
      setFoto(null);
      setPreview('');
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan teknis saat mengirim data piket.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="p-4 max-w-lg mx-auto bg-deep min-h-screen animate-fade-in">
      <div className="bg-surface p-6 rounded-2xl border border-redTrans shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-24 h-24 bg-gold/5 rounded-full filter blur-2xl" />
        <h1 className="text-xl font-black text-crimson mb-2 uppercase tracking-wide">Piket Kebersihan</h1>
        <p className="text-xs text-gray-400 mb-6 leading-relaxed">Selesaikan tugas kebersihan lalu unggah foto bukti area untuk dievaluasi oleh Vision AI.</p>

        <div className="space-y-4">
          <div>
            <label className="block text-[10px] uppercase text-gray-400 font-bold mb-1.5 tracking-wider">Nama Kru Piket</label>
            <select 
              value={selectedKru}
              onChange={(e) => setSelectedKru(e.target.value)}
              className="w-full bg-deep border border-gray-800 p-3.5 rounded-xl text-white focus:outline-none focus:border-crimson transition-all"
            >
              <option value="">-- Pilih Nama --</option>
              {kru.map(k => (
                <option key={k.id} value={k.id}>{k.nama}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase text-gray-400 font-bold mb-1.5 tracking-wider">Area Penugasan</label>
            <select 
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="w-full bg-deep border border-gray-800 p-3.5 rounded-xl text-white focus:outline-none focus:border-crimson transition-all"
            >
              <option value="">-- Pilih Area --</option>
              {areas.map(a => (
                <option key={a.id} value={a.id}>{a.nama_area}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase text-gray-400 font-bold mb-1.5 tracking-wider">Bukti Foto Fisik</label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange} 
              className="w-full bg-deep border border-gray-800 p-3.5 rounded-xl text-white mb-2 text-xs"
            />
            {preview && (
              <img src={preview} alt="Pratinjau Foto" className="w-full max-h-48 object-cover rounded-xl mt-3 border border-gray-800" />
            )}
          </div>

          <button 
            onClick={handleLapor}
            disabled={uploading}
            className="w-full bg-crimson hover:bg-red-700 text-white font-extrabold p-4 rounded-xl transition duration-150 uppercase text-xs tracking-wider disabled:opacity-40"
          >
            {uploading ? 'Mengunggah & Mengevaluasi...' : 'Kirim Laporan Piket'}
          </button>
        </div>
      </div>
      <Navigation />
    </div>
  );
}
