'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { playHotsSound } from '../../lib/audio';

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
      const { data: k } = await supabase.from('kru').select('*');
      const { data: a } = await supabase.from('hots_piket_areas').select('*');
      setKru(k || []);
      setAreas(a || []);
    }
    loadForm();
  }, []);

  function handleFileChange(e) {
    const file = e.target.files[0];
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
    <div className="p-4 max-w-lg mx-auto bg-deep">
      <div className="bg-surface p-6 rounded-2xl border border-redTrans shadow-2xl">
        <h1 className="text-xl font-black text-crimson mb-2 uppercase">Laporan Piket Kebersihan</h1>
        <p className="text-xs text-gray-400 mb-6 leading-relaxed">Laporkan hasil penugasan kebersihan area harian untuk dianalisis instan oleh Vision AI.</p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs uppercase text-gray-400 font-bold mb-1">Nama Kru Piket</label>
            <select 
              value={selectedKru}
              onChange={(e) => setSelectedKru(e.target.value)}
              className="w-full bg-deep border border-gray-800 p-3 rounded-lg text-white"
            >
              <option value="">-- Pilih Nama --</option>
              {kru.map(k => (
                <option key={k.id} value={k.id}>{k.nama}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs uppercase text-gray-400 font-bold mb-1">Area Penugasan</label>
            <select 
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="w-full bg-deep border border-gray-800 p-3 rounded-lg text-white"
            >
              <option value="">-- Pilih Area --</option>
              {areas.map(a => (
                <option key={a.id} value={a.id}>{a.nama_area}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs uppercase text-gray-400 font-bold mb-1">Ambil Foto Bukti</label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange} 
              className="w-full bg-deep border border-gray-800 p-3 rounded-lg text-white mb-2"
            />
            {preview && (
              <img src={preview} alt="Pratinjau Foto" className="w-full max-h-48 object-cover rounded-xl mt-2 border border-gray-800" />
            )}
          </div>

          <button 
            onClick={handleLapor}
            disabled={uploading}
            className="w-full bg-crimson hover:bg-red-700 text-white font-bold p-4 rounded-xl transition duration-150 uppercase text-sm tracking-wider"
          >
            {uploading ? 'Mengunggah & Mengevaluasi...' : 'Kirim Laporan Piket'}
          </button>
        </div>
      </div>
    </div>
  );
}
