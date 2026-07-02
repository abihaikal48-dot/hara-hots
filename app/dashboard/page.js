'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { playHotsSound } from '../../lib/audio';
import Navigation from '../../components/Navigation';

export default function Dashboard() {
  const [kru, setKru] = useState([]);
  const [activeTab, setActiveTab] = useState('kru');
  const [selectedKru, setSelectedKru] = useState('');
  const [sopFolders, setSopFolders] = useState([]);
  const [selectedSop, setSelectedSop] = useState('');
  const [rubrik, setRubrik] = useState([]);
  const [checklists, setChecklists] = useState({});
  const [catatan, setCatatan] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const { data: k } = await supabase.from('kru').select('*');
        const { data: s } = await supabase.from('sop_folders').select('*');
        setKru(k || []);
        setSopFolders(s || []);
      } catch (err) {
        console.error("Gagal memuat komponen dasbor:", err);
      }
    }
    loadDashboard();
  }, []);

  async function handleSopChange(e) {
    const sId = e.target.value;
    setSelectedSop(sId);
    if (!sId) {
      setRubrik([]);
      return;
    }
    try {
      const { data: r } = await supabase.from('hots_praktik_rubrik').select('*').eq('sop_folder_id', sId).order('urutan', { ascending: true });
      setRubrik(r || []);
      const initialChecklist = {};
      (r || []).forEach(item => {
        initialChecklist[item.id] = false;
      });
      setChecklists(initialChecklist);
    } catch (err) {
      console.error("Gagal memuat rubrik:", err);
    }
  }

  function toggleCheck(id) {
    setChecklists({ ...checklists, [id]: !checklists[id] });
  }

  async function simpanEvaluasiPraktik() {
    playHotsSound('tap');
    if (!selectedKru || !selectedSop) {
      alert("Harap pilih nama Kru dan topik SOP!");
      return;
    }

    setSaving(true);
    const totalItems = rubrik.length;
    const checkedItems = Object.values(checklists).filter(v => v === true).length;
    const percentage = totalItems > 0 ? (checkedItems / totalItems) * 100 : 0;

    let skorSkala = 1;
    if (percentage === 100) skorSkala = 3; 
    else if (percentage >= 70) skorSkala = 2; 

    try {
      const { data: logData, error: logError } = await supabase
        .from('hots_log_praktik')
        .insert([{
          kru_id: selectedKru,
          sop_folder_id: selectedSop,
          penilai: 'Trainer Resmi',
          skor_skala: skorSkala,
          catatan: catatan
        }])
        .select()
        .single();

      if (logError) throw logError;

      const checklistInserts = Object.keys(checklists).map(rubId => ({
        log_praktik_id: logData.id,
        rubrik_id: rubId,
        is_checked: checklists[rubId]
      }));

      await supabase.from('hots_log_praktik_checklists').insert(checklistInserts);
      await triggerAllRounderEvaluation(selectedKru);

      alert("Penilaian praktik objektif berhasil disimpan!");
      setSelectedKru('');
      setSelectedSop('');
      setRubrik([]);
      setCatatan('');
    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan evaluasi.");
    } finally {
      setSaving(false);
    }
  }

  async function triggerAllRounderEvaluation(kruId) {
    try {
      const { data: logs } = await supabase.from('hots_log_praktik').select('skor_skala').eq('kru_id', kruId);
      const safeLogs = logs || [];
      const badPerformance = safeLogs.some(l => l.skor_skala < 2);
      if (safeLogs.length >= 4 && !badPerformance) {
        await supabase.from('kru').update({ is_all_rounder: true, status: 'All-Rounder' }).eq('id', kruId);
      }
    } catch (err) {
      console.error("Evaluasi otomatis gagal:", err);
    }
  }

  return (
    <div className="p-4 max-w-4xl mx-auto bg-deep min-h-screen animate-fade-in">
      <div className="flex border-b border-gray-800 mb-6">
        <button 
          onClick={() => setActiveTab('kru')}
          className={`flex-1 py-3 text-center text-xs font-black uppercase tracking-wider ${activeTab === 'kru' ? 'text-crimson border-b-2 border-crimson' : 'text-gray-500'}`}
        >
          Status Kru
        </button>
        <button 
          onClick={() => setActiveTab('evaluasi')}
          className={`flex-1 py-3 text-center text-xs font-black uppercase tracking-wider ${activeTab === 'evaluasi' ? 'text-crimson border-b-2 border-crimson' : 'text-gray-500'}`}
        >
          Evaluasi Praktik
        </button>
      </div>

      {activeTab === 'kru' && (
        <div className="bg-surface p-5 rounded-2xl border border-redTrans shadow-xl">
          <h2 className="text-sm font-extrabold text-crimson mb-4 uppercase tracking-wider">Status Pelatihan Karyawan</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-800 text-gray-500 uppercase font-black tracking-wider text-[10px]">
                  <th className="py-2.5">Nama</th>
                  <th className="py-2.5">Divisi</th>
                  <th className="py-2.5">Siklus</th>
                  <th className="py-2.5">Status</th>
                  <th className="py-2.5">Sertifikasi</th>
                </tr>
              </thead>
              <tbody>
                {kru.map(k => (
                  <tr key={k.id} className="border-b border-gray-900 hover:bg-deep/30 transition-colors">
                    <td className="py-3 font-extrabold text-white">{k.nama}</td>
                    <td className="py-3 text-gray-400">{k.divisi}</td>
                    <td className="py-3 text-gold font-bold">M{k.minggu_aktif}</td>
                    <td className="py-3">
                      <span className="bg-red-950 text-crimson border border-crimson/20 px-2 py-0.5 rounded-md font-bold text-[10px]">
                        {k.status}
                      </span>
                    </td>
                    <td className="py-3 text-xs font-semibold text-gray-300">{k.is_all_rounder ? '👑 All-Rounder' : 'Reguler'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'evaluasi' && (
        <div className="bg-surface p-5 rounded-2xl border border-redTrans space-y-4 shadow-xl">
          <h2 className="text-sm font-extrabold text-crimson uppercase tracking-wider">Evaluasi Lapangan SOP Objektif</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase text-gray-400 font-bold mb-1.5 tracking-wider">Kru yang Dievaluasi</label>
              <select 
                value={selectedKru}
                onChange={(e) => setSelectedKru(e.target.value)}
                className="w-full bg-deep border border-gray-800 p-3 rounded-xl text-white focus:outline-none focus:border-crimson"
              >
                <option value="">-- Pilih Kru --</option>
                {kru.map(k => (
                  <option key={k.id} value={k.id}>{k.nama}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase text-gray-400 font-bold mb-1.5 tracking-wider">Materi SOP Fisik</label>
              <select 
                value={selectedSop}
                onChange={handleSopChange}
                className="w-full bg-deep border border-gray-800 p-3 rounded-xl text-white focus:outline-none focus:border-crimson"
              >
                <option value="">-- Pilih SOP --</option>
                {sopFolders.map(s => (
                  <option key={s.id} value={s.id}>{s.topik}</option>
                ))}
              </select>
            </div>
          </div>

          {rubrik.length > 0 && (
            <div className="mt-6 border-t border-gray-800 pt-4">
              <h3 className="text-xs font-extrabold text-gold uppercase mb-3.5 tracking-wider">Butir Checklist Kritis SOP</h3>
              <div className="space-y-3">
                {rubrik.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-deep rounded-xl border border-gray-900">
                    <p className="text-xs text-gray-300 pr-4 leading-relaxed">{item.kriteria}</p>
                    <button 
                      onClick={() => toggleCheck(item.id)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black tracking-wider transition-all ${
                        checklists[item.id] ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40' : 'bg-red-950 text-crimson border border-red-900/30'
                      }`}
                    >
                      {checklists[item.id] ? 'LULUS (YA)' : 'GAGAL (TIDAK)'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] uppercase text-gray-400 font-bold mb-1.5 tracking-wider">Catatan Tambahan Evaluasi Lapangan</label>
            <textarea 
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              className="w-full bg-deep border border-gray-800 p-3 rounded-xl text-white focus:outline-none focus:border-crimson"
              rows="3"
              placeholder="Berikan feedback taktis..."
            />
          </div>

          <button 
            onClick={simpanEvaluasiPraktik}
            disabled={saving || rubrik.length === 0}
            className="w-full bg-crimson hover:bg-red-700 text-white font-extrabold p-4 rounded-xl transition duration-150 uppercase text-xs tracking-wider disabled:opacity-40"
          >
            {saving ? 'Menyimpan evaluasi...' : 'Simpan Nilai Evaluasi'}
          </button>
        </div>
      )}
      <Navigation />
    </div>
  );
}
