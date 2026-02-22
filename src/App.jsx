import { useState, useEffect, useMemo } from "react";
import { createClient } from '@supabase/supabase-js';
import { Wine, Star, Trash2, ArrowRightLeft, X, Plus, Filter, ChevronDown, ChevronUp, Search, Loader2 } from 'lucide-react';

const supabaseUrl = 'https://ihnulkaskwluamjsktxm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlobnVsa2Fza3dsdWFtanNrdHhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3MDQ2MDgsImV4cCI6MjA4NzI4MDYwOH0.PnN7qvHLxTqwY6Lq64DlfqycUzye74AzAHOh_p3QhyM';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function App() {
  const [wines, setWines] = useState([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ nombre: '', bodega: '', cosecha: '', uva: '', region: '', subregion: '' });
  const [tab, setTab] = useState('lista');
  const [showRating, setShowRating] = useState(false);
  const [pendingWine, setPendingWine] = useState(null);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);
  const [comentario, setComentario] = useState('');
  const [filters, setFilters] = useState({ cosecha: [], bodega: [], uva: [] });
  const [showFilters, setShowFilters] = useState(false);
  const [searchLista, setSearchLista] = useState('');
  const [searchProbados, setSearchProbados] = useState('');

  const cosechas = Array.from({ length: 30 }, (_, i) => String(2025 - i));
  const uvas = ['Malbec', 'Cabernet Sauvignon', 'Merlot', 'Pinot Noir', 'Syrah/Shiraz', 'Tempranillo', 'Bonarda', 'Tannat', 'Carménère', 'Petit Verdot', 'Cabernet Franc', 'Sangiovese', 'Nebbiolo', 'Barbera', 'Grenache/Garnacha', 'Mourvèdre', 'Zinfandel', 'Primitivo', 'Montepulciano', 'Mencia', 'Graciano', 'Monastrell', 'Carignan', 'Corvina', "Nero d'Avola", 'Aglianico', 'Dolcetto', 'Gamay', 'Pinotage', 'Touriga Nacional', 'Tinta Roriz', 'Criolla', 'Lambrusco', 'Zweigelt', 'Blaufränkisch', 'St. Laurent', 'Dornfelder', 'Chardonnay', 'Sauvignon Blanc', 'Torrontés', 'Riesling', 'Viognier', 'Pinot Grigio/Gris', 'Gewürztraminer', 'Semillón', 'Moscatel/Muscat', 'Chenin Blanc', 'Albariño', 'Verdejo', 'Godello', 'Grüner Veltliner', 'Vermentino', 'Fiano', 'Greco', 'Garganega', 'Trebbiano', 'Marsanne', 'Roussanne', 'Müller-Thurgau', 'Silvaner', 'Furmint', 'Assyrtiko', 'Malvasía', 'Pedro Ximénez', 'Palomino', 'Macabeo/Viura', 'Xarel·lo', 'Parellada', 'Picpoul', 'Melon de Bourgogne', 'Ugni Blanc', 'Rosado', 'Blend Tinto', 'Blend Blanco', 'Espumante', 'Otro'];

  const regiones = {
    'Mendoza': ['Valle de Uco', 'Luján de Cuyo', 'Maipú', 'San Rafael', 'Santa Rosa', 'Junín', 'Rivadavia', 'La Paz'],
    'Salta': ['Cafayate', 'Cachi', 'Molinos', 'San Carlos', 'Angastaco'],
    'San Juan': ['Valle de Tulum', 'Valle de Zonda', 'Valle de Ullum', 'Valle de Pedernal', 'Valle de Calingasta'],
    'La Rioja': ['Famatina', 'Chilecito', 'Valle de la Puerta'],
    'Catamarca': ['Tinogasta', 'Fiambalá', 'Santa María'],
    'Neuquén': ['San Patricio del Chañar', 'Añelo'],
    'Río Negro': ['Alto Valle', 'Valle Medio'],
    'Patagonia': [],
    'Córdoba': ['Colonia Caroya', 'Traslasierra'],
    'Buenos Aires': ['Sierra de la Ventana', 'Médanos']
  };

  useEffect(() => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    setSession(session);
  });

  const { data: listener } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      setSession(session);
      if (session) fetchWines();
    }
  );

    if (!session) {
  return (
    <div>
      <h2>Login</h2>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button
        onClick={async () => {
          const { error } = await supabase.auth.signInWithPassword({
            email,
            password
          });

          if (error) alert(error.message);
        }}
      >
        Iniciar sesión
      </button>
    </div>
  );
}
    
  return () => {
    listener.subscription.unsubscribe();
  };
}, []);

  const fetchWines = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('wines').select('*').order('created_at', { ascending: false });
    if (!error) setWines(data || []);
    setLoading(false);
  };

  const handleInput = (field, value) => {
    if (field === 'region') {
      setForm({ ...form, region: value, subregion: '' });
    } else {
      setForm({ ...form, [field]: value });
    }
  };

  const isFormValid = form.nombre.trim() !== '';

  const saveWine = async (probado) => {
    if (!isFormValid) return;
    const wine = { ...form, probado, rating: 0, comentario: '' };
    if (probado) {
      setPendingWine(wine);
      setShowRating(true);
    } else {
      const { data, error } = await supabase.from('wines').insert([wine]).select();
      if (!error && data) {
        setWines([data[0], ...wines]);
        setForm({ nombre: '', bodega: '', cosecha: '', uva: '', region: '', subregion: '' });
      }
    }
  };

  const confirmRating = async (rating) => {
    if (pendingWine) {
      if (pendingWine.id) {
        const { error } = await supabase.from('wines').update({ probado: true, rating, comentario }).eq('id', pendingWine.id);
        if (!error) setWines(wines.map(w => w.id === pendingWine.id ? { ...w, probado: true, rating, comentario } : w));
      } else {
        const { data, error } = await supabase.from('wines').insert([{ ...pendingWine, rating, comentario }]).select();
        if (!error && data) {
          setWines([data[0], ...wines]);
          setForm({ nombre: '', bodega: '', cosecha: '', uva: '', region: '', subregion: '' });
        }
      }
    }
    setShowRating(false);
    setPendingWine(null);
    setHoverRating(0);
    setSelectedRating(0);
    setComentario('');
  };

  const deleteWine = async (id) => {
    const { error } = await supabase.from('wines').delete().eq('id', id);
    if (!error) setWines(wines.filter(w => w.id !== id));
  };

  const moveWine = async (id) => {
    const wine = wines.find(w => w.id === id);
    if (!wine) return;
    if (!wine.probado) {
      setPendingWine(wine);
      setShowRating(true);
    } else {
      const { error } = await supabase.from('wines').update({ probado: false, rating: 0, comentario: '' }).eq('id', id);
      if (!error) setWines(wines.map(w => w.id === id ? { ...w, probado: false, rating: 0, comentario: '' } : w));
    }
  };

  const toggleFilter = (type, value) => {
    setFilters(f => ({
      ...f,
      [type]: f[type].includes(value) ? f[type].filter(v => v !== value) : [...f[type], value]
    }));
  };

  const clearFilters = () => setFilters({ cosecha: [], bodega: [], uva: [] });

  const currentWines = wines.filter(w => tab === 'lista' ? !w.probado : w.probado);

  const filterOptions = useMemo(() => ({
    cosecha: [...new Set(currentWines.map(w => w.cosecha).filter(Boolean))].sort(),
    bodega: [...new Set(currentWines.map(w => w.bodega).filter(Boolean))].sort(),
    uva: [...new Set(currentWines.map(w => w.uva).filter(Boolean))].sort()
  }), [currentWines]);

  const currentSearch = tab === 'lista' ? searchLista : searchProbados;
  const setCurrentSearch = tab === 'lista' ? setSearchLista : setSearchProbados;

  const filteredWines = currentWines.filter(w => {
    if (currentSearch && !w.nombre.toLowerCase().includes(currentSearch.toLowerCase())) return false;
    if (filters.cosecha.length && !filters.cosecha.includes(w.cosecha)) return false;
    if (filters.bodega.length && !filters.bodega.includes(w.bodega)) return false;
    if (filters.uva.length && !filters.uva.includes(w.uva)) return false;
    return true;
  });

  const activeFilterCount = filters.cosecha.length + filters.bodega.length + filters.uva.length;
  const hasFilterOptions = filterOptions.cosecha.length > 0 || filterOptions.bodega.length > 0 || filterOptions.uva.length > 0;

  return (
    <div className="min-h-screen" style={{ background: '#FAFAFA' }}>
      <header className="px-4 py-6 text-center">
        <div className="flex items-center justify-center">
          <Wine className="w-8 h-8" style={{ color: '#722F37' }} />
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        <section className="rounded-xl p-5 mb-6 shadow-sm" style={{ background: '#fff' }}>
          <h2 className="text-sm font-medium mb-4 tracking-wider" style={{ color: '#722F37' }}>Agregar nuevo vino:</h2>
          <div className="space-y-3">
            <input 
              type="text" 
              placeholder="Nombre del vino *" 
              value={form.nombre} 
              onChange={e => handleInput('nombre', e.target.value)}
              className="w-full px-4 py-3 rounded-lg text-sm outline-none placeholder:text-[#AAAAAA]" 
              style={{ background: '#FAFAFA', border: '1px solid #DDDDDD', color: '#4A4A4A' }} 
            />
            <input 
              type="text" 
              placeholder="Bodega" 
              value={form.bodega} 
              onChange={e => handleInput('bodega', e.target.value)}
              className="w-full px-4 py-3 rounded-lg text-sm outline-none placeholder:text-[#AAAAAA]" 
              style={{ background: '#FAFAFA', border: '1px solid #DDDDDD', color: '#4A4A4A' }} 
            />
            <div className="relative">
              <select 
                value={form.cosecha} 
                onChange={e => handleInput('cosecha', e.target.value)}
                className="w-full px-4 py-3 rounded-lg text-sm outline-none appearance-none cursor-pointer"
                style={{ background: '#FAFAFA', border: '1px solid #DDDDDD', color: form.cosecha ? '#4A4A4A' : '#AAAAAA' }}
              >
                <option value="">Cosecha</option>
                {cosechas.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#A4A4A4' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
              </div>
            </div>
            <div className="relative">
              <select 
                value={form.uva} 
                onChange={e => handleInput('uva', e.target.value)}
                className="w-full px-4 py-3 rounded-lg text-sm outline-none appearance-none cursor-pointer"
                style={{ background: '#FAFAFA', border: '1px solid #DDDDDD', color: form.uva ? '#4A4A4A' : '#AAAAAA' }}
              >
                <option value="">Uva</option>
                {uvas.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#A4A4A4' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
              </div>
            </div>
            <div className="relative">
              <select 
                value={form.region} 
                onChange={e => handleInput('region', e.target.value)}
                className="w-full px-4 py-3 rounded-lg text-sm outline-none appearance-none cursor-pointer"
                style={{ background: '#FAFAFA', border: '1px solid #DDDDDD', color: form.region ? '#4A4A4A' : '#AAAAAA' }}
              >
                <option value="">Región</option>
                {Object.keys(regiones).map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#A4A4A4' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
              </div>
            </div>
            {form.region && regiones[form.region]?.length > 0 && (
              <div className="relative">
                <select 
                  value={form.subregion} 
                  onChange={e => handleInput('subregion', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg text-sm outline-none appearance-none cursor-pointer"
                  style={{ background: '#FAFAFA', border: '1px solid #DDDDDD', color: form.subregion ? '#4A4A4A' : '#AAAAAA' }}
                >
                  <option value="">Subregión</option>
                  {regiones[form.region].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#A4A4A4' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-3 mt-5">
            <button 
              onClick={() => saveWine(false)} 
              disabled={!isFormValid}
              className="flex-1 py-3 rounded-lg text-sm font-medium transition-all disabled:cursor-not-allowed"
              style={{ background: '#FFFFFF', border: `2px solid ${isFormValid ? '#722F37' : '#F1F1F1'}`, color: isFormValid ? '#722F37' : '#AAAAAA' }}
            >
              <Plus className="w-4 h-4 inline mr-1" />Mi Lista
            </button>
            <button 
              onClick={() => saveWine(true)} 
              disabled={!isFormValid}
              className="flex-1 py-3 rounded-lg text-sm font-medium transition-all disabled:cursor-not-allowed"
              style={{ background: isFormValid ? '#722F37' : '#F1F1F1', color: isFormValid ? '#FFFFFF' : '#AAAAAA' }}
            >
              <Star className="w-4 h-4 inline mr-1" />Ya lo probé
            </button>
          </div>
        </section>

        <div className="flex rounded-xl overflow-hidden mb-4" style={{ background: '#EEEEEE' }}>
          {['lista', 'probados'].map(t => (
            <button 
              key={t} 
              onClick={() => { setTab(t); clearFilters(); }}
              className="flex-1 py-3 text-sm font-medium transition-all"
              style={{ background: tab === t ? '#722F37' : 'transparent', color: tab === t ? '#FAFAFA' : '#722F37' }}
            >
              {t === 'lista' ? 'Mi Lista' : 'Ya probé'}
              <span className="ml-2 text-xs opacity-70">({wines.filter(w => t === 'lista' ? !w.probado : w.probado).length})</span>
            </button>
          ))}
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#AAAAAA' }} />
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={currentSearch}
            onChange={e => setCurrentSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-lg text-sm outline-none placeholder:text-[#AAAAAA]"
            style={{ background: '#FFFFFF', border: '1px solid #DDDDDD', color: '#4A4A4A' }}
          />
        </div>

        {hasFilterOptions && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2" style={{ color: '#722F37' }}>
                <Filter className="w-4 h-4" />
                <span className="text-sm">Filtros</span>
                {activeFilterCount > 0 && <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: '#722F37', color: '#FAFAFA' }}>{activeFilterCount}</span>}
              </div>
              <button onClick={() => setShowFilters(!showFilters)}>
                {showFilters ? <ChevronUp className="w-5 h-5" style={{ color: '#722F37' }} /> : <ChevronDown className="w-5 h-5" style={{ color: '#722F37' }} />}
              </button>
            </div>
            {showFilters && (
              <div className="p-4 rounded-xl space-y-3" style={{ background: '#fff' }}>
                {[{ key: 'cosecha', label: 'Cosecha' }, { key: 'bodega', label: 'Bodega' }, { key: 'uva', label: 'Uva' }].map(({ key, label }) => (
                  filterOptions[key].length > 0 && (
                    <div key={key}>
                      <p className="text-xs uppercase tracking-wider mb-2" style={{ color: '#A4A4A4' }}>{label}</p>
                      <div className="flex flex-wrap gap-2">
                        {filterOptions[key].map(val => (
                          <button 
                            key={val} 
                            onClick={() => toggleFilter(key, val)} 
                            className="px-3 py-1.5 rounded-full text-xs transition-all"
                            style={{ background: filters[key].includes(val) ? '#722F37' : '#FAFAFA', color: filters[key].includes(val) ? '#FAFAFA' : '#722F37', border: '1px solid #722F37' }}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                ))}
                {activeFilterCount > 0 && <button onClick={clearFilters} className="text-xs underline" style={{ color: '#A4A4A4' }}>Limpiar filtros</button>}
              </div>
            )}
          </div>
        )}

        <div className="space-y-3">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#722F37' }} />
            </div>
          ) : filteredWines.length === 0 ? (
            <p className="text-center py-8 text-sm" style={{ color: '#A4A4A4' }}>
              {currentSearch ? 'No hay vinos con ese nombre' : activeFilterCount > 0 ? 'No hay vinos con estos filtros' : tab === 'lista' ? 'Tu lista está vacía' : 'Aún no probaste ningún vino'}
            </p>
          ) : (
            filteredWines.map(wine => (
              <div key={wine.id} className="p-4 rounded-xl shadow-sm" style={{ background: '#fff' }}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-medium" style={{ color: '#4A4A4A' }}>{wine.nombre}</h3>
                    <p className="text-sm mt-1" style={{ color: '#A4A4A4' }}>{[wine.bodega, wine.cosecha, wine.uva, wine.region, wine.subregion].filter(Boolean).join(' · ') || 'Sin detalles'}</p>
                    {wine.probado && wine.rating > 0 && (
                      <div className="flex gap-0.5 mt-2">
                        {[1, 2, 3, 4, 5].map(s => <Star key={s} className="w-4 h-4" fill={s <= wine.rating ? '#722F37' : 'none'} style={{ color: '#722F37' }} />)}
                      </div>
                    )}
                    {wine.comentario && (
                      <p className="text-sm mt-2 italic" style={{ color: '#A4A4A4' }}>"{wine.comentario}"</p>
                    )}
                  </div>
                  <div className="flex gap-2 ml-3">
                    <button onClick={() => moveWine(wine.id)} className="p-2 rounded-full" style={{ background: '#FAFAFA' }}><ArrowRightLeft className="w-4 h-4" style={{ color: '#722F37' }} /></button>
                    <button onClick={() => deleteWine(wine.id)} className="p-2 rounded-full" style={{ background: '#FAFAFA' }}><Trash2 className="w-4 h-4" style={{ color: '#722F37' }} /></button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {showRating && pendingWine && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-sm rounded-xl p-6 text-center relative" style={{ background: '#FAFAFA' }}>
            <button onClick={() => { setShowRating(false); setPendingWine(null); setHoverRating(0); setSelectedRating(0); setComentario(''); }} className="absolute top-4 right-4">
              <X className="w-5 h-5" style={{ color: '#A4A4A4' }} />
            </button>
            <Wine className="w-10 h-10 mx-auto mb-3" style={{ color: '#722F37' }} />
            <h3 className="text-lg font-medium mb-1" style={{ color: '#A4A4A4' }}>¿Qué te pareció?</h3>
            <p className="text-sm mb-5" style={{ color: '#A4A4A4' }}>{pendingWine.nombre}</p>
            <div className="flex justify-center gap-2 mb-5">
              {[1, 2, 3, 4, 5].map(s => (
                <button key={s} onMouseEnter={() => setHoverRating(s)} onMouseLeave={() => setHoverRating(0)} onClick={() => setSelectedRating(s)} className="p-1 transition-transform hover:scale-110">
                  <Star className="w-8 h-8" fill={s <= (hoverRating || selectedRating) ? '#722F37' : 'none'} style={{ color: '#722F37' }} />
                </button>
              ))}
            </div>
            <textarea
              placeholder="Comentario (opcional)"
              value={comentario}
              onChange={e => setComentario(e.target.value.slice(0, 200))}
              maxLength={200}
              className="w-full px-4 py-3 rounded-lg text-sm outline-none placeholder:text-[#AAAAAA] resize-none mb-3"
              style={{ background: '#FFFFFF', border: '1px solid #DDDDDD', color: '#4A4A4A', minHeight: '80px' }}
            />
            <p className="text-xs mb-4" style={{ color: '#AAAAAA' }}>{comentario.length}/200</p>
            <button 
              onClick={() => confirmRating(selectedRating)} 
              disabled={selectedRating === 0 && comentario.trim() === ''}
              className="w-full py-3 rounded-lg text-sm font-medium disabled:cursor-not-allowed"
              style={{ background: (selectedRating > 0 || comentario.trim()) ? '#722F37' : '#F1F1F1', color: (selectedRating > 0 || comentario.trim()) ? '#FFFFFF' : '#AAAAAA' }}
            >
              Guardar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
