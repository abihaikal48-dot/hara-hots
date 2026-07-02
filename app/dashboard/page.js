'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { playHotsSound } from '@/hooks/useHotsAudio';

export default function TrainerDashboard() {
  const [subTab, setSubTab] = useState('roster'); // 'roster', 'praktik', 'analitik', 'settings'
  const [kruList, setKruList] = useState([]);
  const [piketAreas, setPiketAreas] = useState([]);
  const [sopFolders, setSopFolders] = useState([]);
  
  // HOTS Grid States
  const [dates] = useState(['2026-06-26', '2026-06-27', '2026-06-28', '2026-06-29', '2026-06-30']);
  const [rosterMatrix, setRosterMatrix] = useState({});
  const [editCell, setEditCell] = useState(null); // { kruId, tanggal, shift, jobdesk, piketColor }
  const [showEditModal, setShowEditModal] = useState(false);

  // Penilaian Praktik States
  const [evalKru, setEvalKru] = useState('');
  const [evalSop, setEvalSop] = useState('');
  const [evalRubrics, setEvalRubrics] = useState([]);
  const [evalChecklists, setEvalChecklists] = useState({});
  const [evalCatatan, setEvalCatatan] = useState('');

  // Account States
  const [newTrainerNama, setNewTrainerNama] = useState('');
  const [newTrainerEmail, setNewTrainerEmail] = useState('');
  const [trainers, setTrainers] = useState([
    { id: '1', nama_lengkap: 'Haikal', email: 'abihaikal48@gmail.com', role: 'Trainer' },
    { id: '2', nama_lengkap: 'Ummu', email: 'ummusallaamah@gmail.com', role: 'Trainer' }
  ]);

  useEffect(() => {
    async function loadData() {
      const { data: dKru } = await supabase.from('kru').select('*');
      if (dKru && dKru.length) setKruList(dKru);
      else {
        setKruList([
          { id: 'k1', nama: 'Dewa', divisi: 'Kitchen' },
          { id: 'k2', nama: 'Arif', divisi: 'Kitchen' },
          { id: 'k3', nama: 'Qurba', divisi: 'Kasir' },
          { id: 'k4', nama: 'Iman', divisi: 'Helper' }
        ]);
      }

      const { data: dPiket } = await supabase.from('hots_piket_areas').select('*');
      if (dPiket && dPiket.length) setPiketAreas(dPiket);
      else {
        setPiketAreas([
          { id: 'p1', nama_area: 'Halaman Depan', warna_kode: 'Hijau' },
          { id: 'p2', nama_area: 'Rak Bahan Baku + Wastafel Kitchen', warna_kode: 'Cyan' },
          { id: 'p3', nama_area: 'Kamar Mandi Cust', warna_kode: 'Lavender' },
          { id: 'p4', nama_area: 'Musholla + Wastafel Depan', warna_kode: 'Biru' },
          { id: 'p5', nama_area: 'Toilet Karyawan', warna_kode: 'Orange' }
        ]);
      }

      const { data: dSop } = await supabase.from('sop_folders').select('*');
      if (dSop && dSop.length) setSopFolders(dSop);
      else {
        setSopFolders([
          { id: 's1', divisi: 'Kitchen', topik: 'Thawing Ayam', icon: '❄️' },
          { id: 's2', divisi: 'Kitchen', topik: 'Masak Nasi', icon: '🍚' }
        ]);
      }
    }
    loadData();
  }, []);

  // Build Matrix Roster harian
  useEffect(() => {
    if (!kruList.length) return;
    const matrix = {};
    kruList.forEach(k => {
      matrix[k.id] = {};
      dates.forEach((d, idx) => {
        let shift = 'OFF';
        let jb = '';
        let warna = 'Gray';
        if (k.nama === 'Dewa') { shift = 'S'; jb = '4'; warna = 'Hijau'; }
        if (k.nama === 'Arif' && idx !== 3) { shift = 'P'; jb = '4'; warna = 'Cyan'; }
        matrix[k.id][d] = { shift, jobdesk: jb, warna_piket: warna };
      });
    });
    setRosterMatrix(matrix);
  }, [kruList]);

  const handleCellClick = (kruId, tgl, cell) => {
    playHotsSound('tap');
    setEditCell({ kruId, tanggal: tgl, shift: cell.shift, jobdesk: cell.jobdesk, piketColor: cell.warna_piket });
    setShowEditModal(true);
  };

  const handleEditCellSave = () => {
    if (!editCell) return;
    const { kruId, tanggal, shift, jobdesk, piketColor } = editCell;
    setRosterMatrix(prev => ({
      ...prev,
      [kruId]: {
        ...prev[kruId],
        [tanggal]: { shift, jobdesk, warna_piket: piketColor }
      }
    }));
    playHotsSound('success');
    setShowEditModal(false);
  };

  const generateAutoScheduler = () => {
    playHotsSound('success');
    const updated = { ...rosterMatrix };
    const colors = ['Hijau', 'Cyan', 'Lavender', 'Biru', 'Orange'];
    kruList.forEach((k, kIdx) => {
      updated[k.id] = {};
      dates.forEach((d, dIdx) => {
        const isOff = (dIdx === 2); // Libur di hari ke-3 (Minggu)
        const col = colors[(kIdx + dIdx) % colors.length];
        updated[k.id][d] = {
          shift: isOff ? 'OFF' : 'P',
          jobdesk: isOff ? '' : '4',
          warna_piket: isOff ? 'Gray' : col
        };
      });
    });
    setRosterMatrix(updated);
  };

  const loadSopRubrics = async (sopId) => {
    setEvalSop(sopId);
    const { data } = await supabase.from('hots_praktik_rubrik').select('*').eq('sop_folder_id', sopId);
    if (data && data.length) setEvalRubrics(data);
    else {
      setEvalRubrics([
        { id: 'r1', kriteria: 'Ayam diletakkan di baskom persegi thawing khusus' },
        { id: 'r2', kriteria: 'Showcase / Chiller disetel di tingkat suhu angka 3' },
        { id: 'r3', kriteria: 'Ayam tidak direndam di dalam air biasa' }
      ]);
    }
  };

  const handleSavePractical = () => {
    const total = evalRubrics.length;
    if (!total) return;
    const checked = Object.values(evalChecklists).filter(Boolean).length;
    const pct = (checked / total) * 100;
    let scale = 1;
    if (pct === 100) scale = 3;
    else if (pct >= 70) scale = 2;

    playHotsSound('success');
    alert(`Evaluasi Praktik disimpan!\nAkurasi: ${pct.toFixed(0)}%\nSkala Hasil: ${scale}`);
    
    setEvalKru('');
    setEvalSop('');
    setEvalRubrics([]);
    setEvalChecklists({});
  };

  return (
    <div className="min-h-screen bg-[#070101] text-white p-6 space-y-6">
      <div className="flex justify-between items-center border-b border-gray-900 pb-4">
        <div>
          <h2 className="text-base font-black text-white uppercase tracking-wider">PANEL ADMINISTRASI TRAINER</h2>
          <p className="text-xs text-gray-500">Kelola jadwal harian, log piket bulanan, dan evaluasi praktik objektif.</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-4 border-b border-gray-900 pb-3">
        {['roster', 'praktik', 'analitik', 'settings'].map(tab => (
          <button key={tab} onClick={() => { playHotsSound('tap'); setSubTab(tab); }} className={`pb-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all ${subTab === tab ? 'border-[#D42B2B] text-white' : 'border-transparent text-gray-500'}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* TAB 1: HOTS GRID ROSTER */}
      {subTab === 'roster' && (
        <div className="bg-[#120303] border border-gray-900 rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-4 bg-[#1B0606] flex justify-between items-center border-b border-gray-900">
            <span className="text-xs font-bold text-white uppercase tracking-wider">Hots Grid Roster Matrix</span>
            <div className="flex gap-2">
              <button onClick={generateAutoScheduler} className="px-3 py-1.5 bg-[#F5C518]/15 border border-[#F5C518] text-[#F5C518] text-[10px] font-bold rounded-lg hover:bg-hotsGold/25">🤖 Roster Otomatis</button>
              <button className="px-3 py-1.5 bg-[#1B0606] border border-gray-800 text-[10px] font-bold rounded-lg text-white">Ekspor Roster</button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs text-left">
              <thead>
                <tr className="bg-[#1B0606] text-[9px] font-bold text-gray-500 uppercase tracking-widest border-b border-gray-900">
                  <th className="p-4 border-r border-gray-900">Nama Kru</th>
                  {dates.map(d => <th key={d} className="p-4 border-r border-gray-900 text-center">{d.slice(8)} Juli</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-950 font-bold">
                {kruList.map(k => (
                  <tr key={k.id} className="hover:bg-hotsElevated/15 transition-all">
                    <td className="p-4 border-r border-gray-900 font-black">{k.nama}</td>
                    {dates.map(d => {
                      const cell = rosterMatrix[k.id]?.[d] || { shift: 'OFF', jobdesk: '', warna_piket: 'Gray' };
                      let bgClass = 'bg-piketGray';
                      if (cell.warna_piket === 'Hijau') bgClass = 'bg-piketHijau';
                      if (cell.warna_piket === 'Cyan') bgClass = 'bg-piketCyan';
                      if (cell.warna_piket === 'Lavender') bgClass = 'bg-piketLavender';
                      if (cell.warna_piket === 'Biru') bgClass = 'bg-piketBiru';
                      if (cell.warna_piket === 'Orange') bgClass = 'bg-piketOrange';
                      if (cell.shift === 'OFF') bgClass = 'bg-[#7F1D1D]';

                      return (
                        <td key={d} onClick={() => handleCellClick(k.id, d, cell)} className={`p-4 text-center cursor-pointer border-r border-gray-950/40 text-white select-none transition-all ${bgClass}`}>
                          {cell.shift}{cell.jobdesk}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: EVALUASI PRAKTIK */}
      {subTab === 'praktik' && (
        <div className="max-w-xl mx-auto bg-[#120303] border border-gray-900 p-6 rounded-2xl space-y-6">
          <h3 className="text-xs font-black text-white uppercase tracking-wider">Penilaian Praktik Objektif</h3>
          <div className="grid grid-cols-2 gap-4">
            <select value={evalKru} onChange={(e) => setEvalKru(e.target.value)} className="w-full bg-[#1B0606] border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none">
              <option value="">-- Pilih Kru --</option>
              {kruList.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
            </select>
            <select value={evalSop} onChange={(e) => loadSopRubrics(e.target.value)} className="w-full bg-[#1B0606] border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none">
              <option value="">-- Kategori SOP --</option>
              {sopFolders.map(s => <option key={s.id} value={s.id}>{s.topik}</option>)}
            </select>
          </div>

          {evalRubrics.length > 0 && (
            <div className="space-y-4">
              <div className="divide-y divide-gray-900 border border-gray-900 rounded-xl overflow-hidden shadow-inner">
                {evalRubrics.map(r => (
                  <div key={r.id} className="p-4 bg-[#1B0606] flex items-center justify-between gap-4 text-xs font-bold">
                    <span>{r.kriteria}</span>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => setEvalChecklists(p => ({...p, [r.id]: true}))} className={`px-4 py-2 text-[10px] font-black uppercase rounded-lg border transition-all ${evalChecklists[r.id] === true ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500 shadow-md shadow-emerald-500/5' : 'border-gray-800 text-gray-500'}`}>Ya</button>
                      <button onClick={() => setEvalChecklists(p => ({...p, [r.id]: false}))} className={`px-4 py-2 text-[10px] font-black uppercase rounded-lg border transition-all ${evalChecklists[r.id] === false ? 'bg-red-500/10 border-red-500 text-red-500 shadow-md shadow-red-500/5' : 'border-gray-800 text-gray-500'}`}>Tidak</button>
                    </div>
                  </div>
                ))}
              </div>
              <textarea value={evalCatatan} onChange={(e) => setEvalCatatan(e.target.value)} className="w-full bg-[#1B0606] border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none" rows="3" placeholder="Tulis catatan..." />
              <button onClick={handleSavePractical} className="w-full bg-[#D42B2B] text-white font-bold py-4 rounded-xl text-xs uppercase tracking-widest">
                Simpan Penilaian
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ANALITIK */}
      {subTab === 'analitik' && (
        <div className="max-w-md mx-auto bg-[#120303] border border-gray-900 p-6 rounded-2xl space-y-4">
          <h3 className="text-xs font-black text-gray-500 uppercase tracking-wider">Performa Rata-rata</h3>
          <div>
            <span className="text-xs font-bold text-gray-400">Passing Rate Teori</span>
            <div className="w-full h-3 bg-gray-900 rounded-full overflow-hidden mt-1"><div className="h-full bg-[#D42B2B]" style={{ width: '85%' }}></div></div>
          </div>
          <div>
            <span className="text-xs font-bold text-gray-400">Kepatuhan Piket</span>
            <div className="w-full h-3 bg-gray-900 rounded-full overflow-hidden mt-1"><div className="h-full bg-emerald-500" style={{ width: '92%' }}></div></div>
          </div>
        </div>
      )}

      {/* TAB 4: SETTINGS & AKUN */}
      {subTab === 'settings' && (
        <div className="max-w-md mx-auto bg-[#120303] border border-gray-900 p-6 rounded-2xl space-y-4">
          <h3 className="text-xs font-black text-white uppercase tracking-wider">Manajemen Trainer</h3>
          <div className="space-y-3">
            <input type="text" value={newTrainerNama} onChange={(e) => setNewTrainerNama(e.target.value)} className="w-full bg-[#1B0606] border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none" placeholder="Nama lengkap..." />
            <input type="email" value={newTrainerEmail} onChange={(e) => setNewTrainerEmail(e.target.value)} className="w-full bg-[#1B0606] border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none" placeholder="Email..." />
            <button onClick={() => { if (newTrainerNama && newTrainerEmail) { setTrainers([...trainers, {id: String(trainers.length+1), nama_lengkap: newTrainerNama, email: newTrainerEmail, role: 'Trainer'}]); setNewTrainerNama(''); setNewTrainerEmail(''); playHotsSound('success'); alert('Akun trainer terbuat!'); } }} className="w-full bg-[#D42B2B] text-white font-bold py-3 rounded-xl text-xs uppercase tracking-widest">Buat Akun</button>
          </div>
        </div>
      )}

      {/* EDIT MODAL DI GRIDS */}
      {showEditModal && editCell && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#1B0606] border border-red-950 p-6 rounded-2xl space-y-6">
            <h3 className="text-sm font-black text-white uppercase">Edit Sel Jadwal</h3>
            <div className="space-y-4">
              <select value={editCell.shift} onChange={(e) => setEditCell({...editCell, shift: e.target.value})} className="w-full bg-[#120303] border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none">
                <option value="P">P (Pagi)</option>
                <option value="S">S (Siang)</option>
                <option value="OFF">OFF (Libur)</option>
              </select>
              <select value={editCell.piketColor} onChange={(e) => setEditCell({...editCell, piketColor: e.target.value})} className="w-full bg-[#120303] border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none">
                <option value="Hijau">Hijau - Halaman Depan</option>
                <option value="Cyan">Cyan - Kitchen</option>
                <option value="Lavender">Lavender - Toilet Cust</option>
                <option value="Gray">Gray - Bebas Tugas</option>
              </select>
              <button onClick={handleEditCellSave} className="w-full bg-[#D42B2B] text-white font-bold py-3.5 rounded-xl text-xs uppercase">Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
