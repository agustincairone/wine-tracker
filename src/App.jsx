import { useState, useMemo, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Wine, Star, Trash2, ArrowRightLeft, X, Plus, Filter, Loader2 } from 'lucide-react';

const supabaseUrl = 'https://ihnulkaskwluamjsktxm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlobnVsa2Fza3dsdWFtanNrdHhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3MDQ2MDgsImV4cCI6MjA4NzI4MDYwOH0.PnN7qvHLxTqwY6Lq64DlfqycUzye74AzAHOh_p3QhyM';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function App() {
  const [wines, setWines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ nombre: '', bodega: '', cosecha: '', uva: '' });
  const [tab, setTab] = useState('lista');
  const [showRating, setShowRating] = useState(false);
  const [pendingWine, setPendingWine] = useState(null);
  const [hoverRating, setHoverRating] = useState(0);
  const [filters, setFilters] = useState({ cosecha: [], bodega: [], uva: [] });
  const [showFilters, setShowFilters] = useState(false);

  const cosechas = Array.from({ length: 30 }, (_, i) => String(2025 - i));
  const uvas = ['Malbec', 'Cabernet Sauvignon', 'Merlot', 'Pinot Noir', 'Syrah/Shiraz', 'Tempranillo', 'Bonarda', 'Tannat', 'Carménère', 'Petit Verdot', 'Cabernet Franc', 'Sangiovese', 'Nebbiolo', 'Barbera', 'Grenache/Garnacha', 'Mourvèdre', 'Zinfandel', 'Primitivo', 'Montepulciano', 'Mencia', 'Graciano', 'Monastrell', 'Carignan', 'Corvina', "Nero d'Avola", 'Aglianico', 'Dolcetto', 'Gamay', 'Pinotage', 'Touriga Nacional', 'Tinta Roriz', 'Criolla', 'Lambrusco', 'Zweigelt', 'Blaufränkisch', 'St. Laurent', 'Dornfelder', 'Chardonnay', 'Sauvignon Blanc', 'Torrontés', 'Riesling', 'Viognier', 'Pinot Grigio/Gris', 'Gewürztraminer', 'Semillón', 'Moscatel/Muscat', 'Chenin Blanc', 'Albariño', 'Verdejo', 'Godello', 'Grüner Veltliner', 'Vermentino', 'Fiano', 'Greco', 'Garganega', 'Trebbiano', 'Marsanne', 'Roussanne', 'Müller-Thurgau', 'Silvaner', 'Furmint', 'Assyrtiko', 'Malvasía', 'Pedro Ximénez', 'Palomino', 'Macabeo/Viura', 'Xarel·lo', 'Parellada', 'Picpoul', 'Melon de Bourgogne', 'Ugni Blanc', 'Rosado', 'Blend Tinto', 'Blend Blanco', 'Espumante', 'Otro'];

  useEffect(() => { fetchWines(); }, []);

  const fetchWines = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('wines').select('*').order('created_at', { ascending: false });
    if (!error) setWines(data || []);
    setLoading(false);
  };

  const handleInput = (field, value) => setForm({ ...form, [field]: value });
  const isFormValid = form.nombre.trim() !== '';

  const saveWine = async (probado) => {
    if (!isFormValid) return;
    const wine = { ...form, probado, rating: 0 };
    if (probado) { setPendingWine(wine); setShowRating(true); }
    else {
      const { data, error } = await supabase.from('wines').insert([wine]).select();
      if (!error && data) { setWines([data[0], ...wines]); setForm({ nombre: '', bodega: '', cosecha: '', uva: '' }); }
    }
  };

  const confirmRating = async (rating) => {
    if (pendingWine) {
      if (pendingWine.id) {
        const { error } = await supabase.from('wines').update({ probado: true, rating }).eq('id', pendingWine.id);
        if (!error) setWines(wines.map(w => w.id === pendingWine.id ? { ...w, probado: true, rating } : w));
      } else {
        const { data, error } = await supabase.from('wines').insert([{ ...pendingWine, rating }]).select();
        if (!error && data) { setWines([data[0], ...wines]); setForm({ nombre: '', bodega: '', cosecha: '', uva: '' }); }
      }
    }
    setShowRating(false); setPendingWine(null); setHoverRating(0);
  };

  const deleteWine = async (id) => {
    const { error } = await supabase.from('wines').delete().eq('id', id);
    if (!error) setWines(wines.filter(w => w.id !== id));
  };

  const moveWine = async (id) => {
    const wine = wines.find(w => w.id === id);
    if (!wine) return;
    if (!wine.probado) { setPendingWine(wine); setShowRating(true); }
    else {
      const { error } = await supabase.from('wines').update({ probado: false, rating: 0 }).eq('id', id);
      if (!error) setWines(wines.map(w => w.id === id ? { ...w, probado: false, rating: 0 } : w));
    }
  };

  const toggleFilter = (type, value) => { setFilters(f => ({ ...f, [type]: f[type].includes(value) ? f[type].filter(v => v !== value) : [...f[type], value] })); };
  const clearFilters = () => setFilters({ cosecha: [], bodega: [], uva: [] });
  const currentWines = wines.filter(w => tab === 'lista' ? !w.probado : w.probado);
  const filterOptions = useMemo(() => ({ cosecha: [...new Set(currentWines.map(w => w.cosecha).filter(Boolean))].sort(), bodega: [...new Set(currentWines.map(w => w.bodega).filter(Boolean))].sort(), uva: [...new Set(currentWines.map(w => w.uva).filter(Boolean))].sort() }), [currentWines]);
  const filteredWines = currentWines.filter(w => { if (filters.cosecha.length && !filters.cosecha.includes(w.cosecha)) return false; if (filters.bodega.length && !filters.bodega.includes(w.bodega)) return false; if (filters.uva.length && !filters.uva.includes(w.uva)) return false; return true; });
  const activeFilterCount = filters.cosecha.length + filters.bodega.length + filters.uva.length;
  const hasFilterOptions = filterOptions.cosecha.length > 0 || filterOptions.bodega.length > 0 || filterOptions.uva.length > 0;

  return (
    <div className="min-h-screen" style={{ background: '#FDF8F3' }}>
      <header className="px-4 py-6 text-center" style={{ background: '#722F37' }}>
        <div className="flex items-center justify-center gap-2">
          <Wine className="w-6 h-6" style={{ color: '#FDF8F3' }} />
          <h1 className="text-xl font-light tracking-wide" style={{ color: '#FDF8F3' }}>Mi Diario de Vinos</h1>
        </div>
      </header>
      <main className="max-w-md mx-auto px-4 py-6">
        <section className="rounded-xl p-5 mb-6 shadow-sm" style={{ background: '#fff' }}>
          <h2 className="text-sm font-medium mb-4 uppercase tracking-wider" style={{ color: '#722F37' }}>Nuevo Vino</h2>
          <div className="space-y-3">
            <input type="text" placeholder="Nombre del vino *" value={form.nombre} onChange={e => handleInput('nombre', e.target.value)} className="w-full px-4 py-3 rounded-lg text-sm outline-none" style={{ background: '#FDF8F3', border: '1px solid #E8DDD5', color: '#4A3728' }} />
            <input type="text" placeholder="Bodega" value={form.bodega} onChange={e => handleInput('bodega', e.target.value)} className="w-full px-4 py-3 rounded-lg text-sm outline-none" style={{ background: '#FDF8F3', border: '1px solid #E8DDD5', color: '#4A3728' }} />
            <div className="relative">
              <select value={form.cosecha} onChange={e => handleInput('cosecha', e.target.value)} className="w-full px-4 py-3 rounded-lg text-sm outline-none appearance-none cursor-pointer" style={{ background: '#FDF8F3', border: '1px solid #E8DDD5', color: form.cosecha ? '#4A3728' : '#9CA3AF' }}>
                <option value="">Cosecha</option>
                {cosechas.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#8B7355' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg></div>
            </div>
            <div className="relative">
              <select value={form.uva} onChange={e => handleInput('uva', e.target.value)} className="w-full px-4 py-3 rounded-lg text-sm outline-none appearance-none cursor-pointer" style={{ background: '#FDF8F3', border: '1px solid #E8DDD5', color: form.uva ? '#4A3728' : '#9CA3AF' }}>
                <option value="">Uva</option>
                {uvas.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#8B7355' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg></div>
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button onClick={() => saveWine(false)} disabled={!isFormValid} className="flex-1 py-3 rounded-lg text-sm font-medium transition-all disabled:cursor-not-allowed" style={{ background: isFormValid ? '#FDF8F3' : '#E5E5E5', border: `2px solid ${isFormValid ? '#722F37' : '#9CA3AF'}`, color: isFormValid ? '#722F37' : '#9CA3AF' }}><Plus className="w-4 h-4 inline mr-1" />Mi Lista</button>
            <button onClick={() => saveWine(true)} disabled={!isFormValid} className="flex-1 py-3 rounded-lg text-sm font-medium transition-all disabled:cursor-not-allowed" style={{ background: isFormValid ? '#722F37' : '#9CA3AF', color: '#FDF8F3' }}><Star className="w-4 h-4 inline mr-1" />Ya lo probé</button>
          </div>
        </section>
        <div className="flex rounded-xl overflow-hidden mb-4" style={{ background: '#E8DDD5' }}>
          {['lista', 'probados'].map(t => (<button key={t} onClick={() => { setTab(t); clearFilters(); }} className="flex-1 py-3 text-sm font-medium transition-all" style={{ background: tab === t ? '#722F37' : 'transparent', color: tab === t ? '#FDF8F3' : '#722F37' }}>{t === 'lista' ? 'Mi Lista' : 'Ya probé'}<span className="ml-2 text-xs opacity-70">({wines.filter(w => t === 'lista' ? !w.probado : w.probado).length})</span></button>))}
        </div>
        {hasFilterOptions && (<div className="mb-4"><button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 text-sm mb-3" style={{ color: '#722F37' }}><Filter className="w-4 h-4" />Filtros{activeFilterCount > 0 && <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: '#722F37', color: '#FDF8F3' }}>{activeFilterCount}</span>}</button>
          {showFilters && (<div className="p-4 rounded-xl space-y-3" style={{ background: '#fff' }}>{[{ key: 'cosecha', label: 'Cosecha' }, { key: 'bodega', label: 'Bodega' }, { key: 'uva', label: 'Uva' }].map(({ key, label }) => (filterOptions[key].length > 0 && (<div key={key}><p className="text-xs uppercase tracking-wider mb-2" style={{ color: '#8B7355' }}>{label}</p><div className="flex flex-wrap gap-2">{filterOptions[key].map(val => (<button key={val} onClick={() => toggleFilter(key, val)} className="px-3 py-1.5 rounded-full text-xs transition-all" style={{ background: filters[key].includes(val) ? '#722F37' : '#FDF8F3', color: filters[key].includes(val) ? '#FDF8F3' : '#722F37', border: '1px solid #722F37' }}>{val}</button>))}</div></div>)))}{activeFilterCount > 0 && <button onClick={clearFilters} className="text-xs underline" style={{ color: '#8B7355' }}>Limpiar filtros</button>}</div>)}</div>)}
        <div className="space-y-3">
          {loading ? (<div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" style={{ color: '#722F37' }} /></div>) : filteredWines.length === 0 ? (<p className="text-center py-8 text-sm" style={{ color: '#8B7355' }}>{activeFilterCount > 0 ? 'No hay vinos con estos filtros' : tab === 'lista' ? 'Tu lista está vacía' : 'Aún no probaste ningún vino'}</p>) : (filteredWines.map(wine => (<div key={wine.id} className="p-4 rounded-xl shadow-sm" style={{ background: '#fff' }}><div className="flex justify-between items-start"><div className="flex-1"><h3 className="font-medium" style={{ color: '#4A3728' }}>{wine.nombre}</h3><p className="text-sm mt-1" style={{ color: '#8B7355' }}>{[wine.bodega, wine.cosecha, wine.uva].filter(Boolean).join(' · ') || 'Sin detalles'}</p>{wine.probado && wine.rating > 0 && (<div className="flex gap-0.5 mt-2">{[1, 2, 3, 4, 5].map(s => <Star key={s} className="w-4 h-4" fill={s <= wine.rating ? '#722F37' : 'none'} style={{ color: '#722F37' }} />)}</div>)}</div><div className="flex gap-2 ml-3"><button onClick={() => moveWine(wine.id)} className="p-2 rounded-full" style={{ background: '#FDF8F3' }}><ArrowRightLeft className="w-4 h-4" style={{ color: '#722F37' }} /></button><button onClick={() => deleteWine(wine.id)} className="p-2 rounded-full" style={{ background: '#FDF8F3' }}><Trash2 className="w-4 h-4" style={{ color: '#722F37' }} /></button></div></div></div>)))}
        </div>
      </main>
      {showRating && pendingWine && (<div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ background: 'rgba(0,0,0,0.5)' }}><div className="w-full max-w-sm rounded-xl p-6 text-center relative" style={{ background: '#FDF8F3' }}><button onClick={() => { setShowRating(false); setPendingWine(null); setHoverRating(0); }} className="absolute top-4 right-4"><X className="w-5 h-5" style={{ color: '#8B7355' }} /></button><Wine className="w-10 h-10 mx-auto mb-3" style={{ color: '#722F37' }} /><h3 className="text-lg font-medium mb-1" style={{ color: '#4A3728' }}>¿Qué te pareció?</h3><p className="text-sm mb-5" style={{ color: '#8B7355' }}>{pendingWine.nombre}</p><div className="flex justify-center gap-2 mb-5">{[1, 2, 3, 4, 5].map(s => (<button key={s} onMouseEnter={() => setHoverRating(s)} onMouseLeave={() => setHoverRating(0)} onClick={() => confirmRating(s)} className="p-1 transition-transform hover:scale-110"><Star className="w-8 h-8" fill={s <= hoverRating ? '#722F37' : 'none'} style={{ color: '#722F37' }} /></button>))}</div><button onClick={() => confirmRating(0)} className="text-sm underline" style={{ color: '#8B7355' }}>Guardar sin puntuar</button></div></div>)}
    </div>
  );
}
