'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { playHotsSound } from '@/lib/audio';

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
      const { data: k } = await supabase.from('kru').select('*');
      const { data: s } = await supabase.from('sop_folders').select('*');
      setKru(k || []);
      setSopFolders(s || []);
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
    const { data: r } = await supabase.from('hots_praktik_rubrik').select('*').eq('sop_folder_id', sId).order('urutan', { ascending: true });
    setRubrik(r || []);
    const initialChecklist = {};
    r.forEach(item => {
      initialChecklist[item.id] = false;
    });
    setChecklists(initialChecklist);
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
    if (percentage === 100) skorSkala = 3; // Sempurna
    else if (percentage >= 70) skorSkala = 2; // Cukup

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

      // Trigger evaluasi kelayakan All-Rounder
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
    const { data: logs } = await supabase.from('hots_log_praktik').select('skor_skala').eq('kru_id', kruId);
    const badPerformance = logs.some(l => l.skor_skala < 2);
    if (logs.length >= 4 && !badPerformance) {
      await supabase.from('kru').update({ is_all_rounder: true, status: 'All-Rounder' }).eq('id', kruId);
    }
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex border-b border-gray-800 mb-6">
        <button 
          onClick={() => setActiveTab('kru')}
          className={`flex-1 py-3 text-center text-sm font-bold ${activeTab === 'kru' ? 'text-crimson border-b-2 border-crimson' : 'text-gray-400'}`}
        >
          Kru List & Roster
        </button>
        <button 
          onClick={() => setActiveTab('evaluasi')}
          className={`flex-1 py-3 text-center text-sm font-bold ${activeTab === 'evaluasi' ? 'text-crimson border-b-2 border-crimson' : 'text-gray-400'}`}
        >
          Evaluasi Praktik
        </button>
      </div>

      {activeTab === 'kru' && (
        <div className="bg-surface p-5 rounded-2xl border border-redTrans">
          <h2 className="text-lg font-black text-crimson mb-4">DAFTAR KRU & STATUS TRAINING</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 uppercase font-black">
                  <th className="py-2">Nama</th>
                  <th className="py-2">Divisi</th>
                  <th className="py-2">Minggu</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">All-Rounder</th>
                </tr>
              </thead>
              <tbody>
                {kru.map(k => (
                  <tr key={k.id} className="border-b border-gray-900">
                    <td className="py-3 font-bold text-white">{k.nama}</td>
                    <td className="py-3 text-gray-300">{k.divisi}</td>
                    <td className="py-3 text-gold">M{k.minggu_aktif}</td>
                    <td className="py-3"><span className="bg-red-950 text-crimson px-2 py-0.5 rounded font-bold">{k.status}</span></td>
                    <td className="py-3">{k.is_all_rounder ? '👑 All-Rounder' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'evaluasi' && (
        <div className="bg-surface p-5 rounded-2xl border border-redTrans space-y-4">
          <h2 className="text-lg font-black text-crimson">FORM PENILAIAN PRAKTIK</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase text-gray-400 font-bold mb-1">Pilih Kru</label>
              <select 
                value={selectedKru}
                onChange={(e) => setSelectedKru(e.target.value)}
                className="w-full bg-deep border border-gray-800 p-3 rounded-lg text-white"
              >
                <option value="">-- Pilih Kru --</option>
                {kru.map(k => (
                  <option key={k.id} value={k.id}>{k.nama}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase text-gray-400 font-bold mb-1">Topik SOP</label>
              <select 
                value={selectedSop}
                onChange={handleSopChange}
                className="w-full bg-deep border border-gray-800 p-3 rounded-lg text-white"
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
              <h3 className="text-sm font-bold text-gold uppercase mb-3">Butir Kriteria Penilaian SOP</h3>
              <div className="space-y-3">
                {rubrik.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-deep rounded-lg border border-gray-900">
                    <p className="text-sm text-gray-300 pr-4">{item.kriteria}</p>
                    <button 
                      onClick={() => toggleCheck(item.id)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                        checklists[item.id] ? 'bg-emerald-900 text-emerald-400 border border-emerald-700' : 'bg-red-950 text-crimson border border-red-900'
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
            <label className="block text-xs uppercase text-gray-400 font-bold mb-1">Catatan Evaluasi Lapangan</label>
            <textarea 
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              className="w-full bg-deep border border-gray-800 p-3 rounded-lg text-white"
              rows="3"
              placeholder="Berikan masukan kritis atau pujian..."
            />
          </div>

          <button 
            onClick={simpanEvaluasiPraktik}
            disabled={saving || rubrik.length === 0}
            className="w-full bg-crimson hover:bg-red-700 text-white font-bold p-4 rounded-xl transition duration-150 uppercase text-sm tracking-wider disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : 'Simpan & Evaluasi Kelulusan'}
          </button>
        </div>
      )}
    </div>
  );
}
