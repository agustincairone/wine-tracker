import { useState, useMemo, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Wine, Star, Trash2, X, Plus, Filter, ChevronDown, ChevronUp, Search, Loader2, LogOut, Bookmark, Check } from 'lucide-react';

const supabaseUrl = 'https://ihnulkaskwluamjsktxm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlobnVsa2Fza3dsdWFtanNrdHhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3MDQ2MDgsImV4cCI6MjA4NzI4MDYwOH0.PnN7qvHLxTqwY6Lq64DlfqycUzye74AzAHOh_p3QhyM';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [wines, setWines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ nombre: '', bodega: '', cosecha: '', uva: '', provincia: '', region: '', subregion: '' });
  const [section, setSection] = useState('agregar');
  const [showRating, setShowRating] = useState(false);
  const [pendingWine, setPendingWine] = useState(null);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);
  const [comentario, setComentario] = useState('');
  const [filters, setFilters] = useState({ cosecha: [], bodega: [], uva: [] });
  const [showFilters, setShowFilters] = useState(false);
  const [searchLista, setSearchLista] = useState('');
  const [searchProbados, setSearchProbados] = useState('');
  const [toast, setToast] = useState(false);

  const cosechas = Array.from({ length: 30 }, (_, i) => String(2025 - i));
  const uvas = ['Malbec', 'Cabernet Sauvignon', 'Merlot', 'Pinot Noir', 'Syrah/Shiraz', 'Tempranillo', 'Bonarda', 'Tannat', 'Carménère', 'Petit Verdot', 'Cabernet Franc', 'Sangiovese', 'Nebbiolo', 'Barbera', 'Grenache/Garnacha', 'Mourvèdre', 'Zinfandel', 'Primitivo', 'Montepulciano', 'Mencia', 'Graciano', 'Monastrell', 'Carignan', 'Corvina', 'Cordisco', "Nero d'Avola", 'Aglianico', 'Dolcetto', 'Gamay', 'Pinotage', 'Touriga Nacional', 'Tinta Roriz', 'Criolla', 'Lambrusco', 'Zweigelt', 'Blaufränkisch', 'St. Laurent', 'Dornfelder', 'Chardonnay', 'Sauvignon Blanc', 'Torrontés', 'Riesling', 'Viognier', 'Pinot Grigio/Gris', 'Gewürztraminer', 'Semillón', 'Moscatel/Muscat', 'Chenin Blanc', 'Albariño', 'Verdejo', 'Godello', 'Grüner Veltliner', 'Vermentino', 'Fiano', 'Greco', 'Garganega', 'Trebbiano', 'Marsanne', 'Roussanne', 'Müller-Thurgau', 'Silvaner', 'Furmint', 'Assyrtiko', 'Malvasía', 'Pedro Ximénez', 'Palomino', 'Macabeo/Viura', 'Xarel·lo', 'Parellada', 'Picpoul', 'Melon de Bourgogne', 'Ugni Blanc', 'Rosado', 'Blend Tinto', 'Blend Blanco', 'Espumante', 'Otro'];

  const geografias = {
    'Mendoza': {
      'Valle de Uco': ['Altamira', 'Los Chacayes', 'Vista Flores', 'Gualtallary', 'La Consulta', 'Tunuyán', 'Tupungato'],
      'Luján de Cuyo': ['Agrelo', 'Perdriel', 'Vistalba', 'Las Compuertas', 'Chacras de Coria', 'Mayor Drummond'],
      'Maipú': ['Russell', 'Cruz de Piedra', 'Lunlunta', 'Barrancas', 'Coquimbito'],
      'San Rafael': [], 'Santa Rosa': [], 'Junín': [], 'Rivadavia': [], 'La Paz': [],
    },
    'Salta': { 'Cafayate': [], 'Cachi': [], 'Molinos': [], 'San Carlos': [], 'Angastaco': [] },
    'San Juan': { 'Valle de Tulum': [], 'Valle de Zonda': [], 'Valle de Ullum': [], 'Valle de Pedernal': [], 'Valle de Calingasta': [] },
    'La Rioja': { 'Famatina': [], 'Chilecito': [], 'Valle de la Puerta': [] },
    'Catamarca': { 'Tinogasta': [], 'Fiambalá': [], 'Santa María': [] },
    'Neuquén': { 'San Patricio del Chañar': [], 'Añelo': [] },
    'Río Negro': { 'Alto Valle': [], 'Valle Medio': [] },
    'Patagonia': {},
    'Córdoba': { 'Colonia Caroya': [], 'Traslasierra': [] },
    'Buenos Aires': { 'Sierra de la Ventana': [], 'Médanos': [] },
  };

  const showToast = () => {
    setToast(true);
    setTimeout(() => setToast(false), 3000);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) fetchWines();
  }, [user]);

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setWines([]);
  };

  const fetchWines = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('wines').select('*').order('created_at', { ascending: false });
    if (!error) setWines(data || []);
    setLoading(false);
  };

  const handleInput = (field, value) => {
    if (field === 'provincia') {
      setForm({ ...form, provincia: value, region: '', subregion: '' });
    } else if (field === 'region') {
      setForm({ ...form, region: value, subregion: '' });
    } else {
      setForm({ ...form, [field]: value });
    }
  };

  const isFormValid = form.nombre.trim() !== '';

  const saveWine = async (probado) => {
    if (!isFormValid) return;
    const wine = { ...form, probado, rating: 0, comentario: '', user_id: user.id };
    if (probado) {
      setPendingWine(wine);
      setShowRating(true);
    } else {
      const { data, error } = await supabase.from('wines').insert([wine]).select();
      if (!error && data) {
        setWines([data[0], ...wines]);
        setForm({ nombre: '', bodega: '', cosecha: '', uva: '', provincia: '', region: '', subregion: '' });
        showToast();
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
          setForm({ nombre: '', bodega: '', cosecha: '', uva: '', provincia: '', region: '', subregion: '' });
          showToast();
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
    setFilters(f => ({ ...f, [type]: f[type].includes(value) ? f[type].filter(v => v !== value) : [...f[type], value] }));
  };

  const clearFilters = () => setFilters({ cosecha: [], bodega: [], uva: [] });

  const currentWines = wines.filter(w => section === 'lista' ? !w.probado : w.probado);

  const filterOptions = useMemo(() => ({
    cosecha: [...new Set(currentWines.map(w => w.cosecha).filter(Boolean))].sort(),
    bodega: [...new Set(currentWines.map(w => w.bodega).filter(Boolean))].sort(),
    uva: [...new Set(currentWines.map(w => w.uva).filter(Boolean))].sort()
  }), [currentWines]);

  const currentSearch = section === 'lista' ? searchLista : searchProbados;
  const setCurrentSearch = section === 'lista' ? setSearchLista : setSearchProbados;

  const filteredWines = currentWines.filter(w => {
    if (currentSearch && !w.nombre.toLowerCase().includes(currentSearch.toLowerCase())) return false;
    if (filters.cosecha.length && !filters.cosecha.includes(w.cosecha)) return false;
    if (filters.bodega.length && !filters.bodega.includes(w.bodega)) return false;
    if (filters.uva.length && !filters.uva.includes(w.uva)) return false;
    return true;
  });

  const activeFilterCount = filters.cosecha.length + filters.bodega.length + filters.uva.length;
  const hasFilterOptions = filterOptions.cosecha.length > 0 || filterOptions.bodega.length > 0 || filterOptions.uva.length > 0;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#FAFAFA' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#722F37' }} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: '#FAFAFA' }}>
        <Wine className="w-16 h-16 mb-6" style={{ color: '#722F37' }} />
        <h1 className="text-2xl font-light mb-2" style={{ color: '#4A4A4A' }}>Wine Tracker</h1>
        <p className="text-sm mb-8" style={{ color: '#AAAAAA' }}>Tu diario personal de vinos</p>
        <button onClick={signInWithGoogle} className="flex items-center gap-3 px-6 py-3 rounded-lg text-sm font-medium shadow-sm" style={{ background: '#FFFFFF', border: '1px solid #DDDDDD', color: '#4A4A4A' }}>
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continuar con Google
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#FAFAFA' }}>
      <header style={{ height: '75px', display: 'flex', alignItems: 'center' }}>
        <div className="max-w-md mx-auto w-full px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button onClick={() => setSection('agregar')} className="p-2 rounded-full" style={{ background: section === 'agregar' ? '#F1F1F1' : 'transparent' }}>
                <Wine className="w-6 h-6" style={{ color: '#722F37' }} />
              </button>
              <button onClick={() => { setSection('lista'); clearFilters(); }} className="p-2 rounded-full" style={{ background: section === 'lista' ? '#F1F1F1' : 'transparent' }}>
                <Bookmark className="w-6 h-6" style={{ color: '#722F37' }} />
              </button>
              <button onClick={() => { setSection('probados'); clearFilters(); }} className="p-2 rounded-full" style={{ background: section === 'probados' ? '#F1F1F1' : 'transparent' }}>
                <Check className="w-6 h-6" style={{ color: '#722F37' }} />
              </button>
            </div>
            <button onClick={signOut} className="p-2 rounded-full" style={{ background: '#722F37' }}>
              <LogOut className="w-5 h-5" style={{ color: '#FFFFFF' }} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-4">
        {section === 'agregar' && (
          <section className="rounded-xl p-5 shadow-sm" style={{ background: '#fff' }}>
            <h2 className="text-sm font-medium mb-4 tracking-wider" style={{ color: '#722F37' }}>Agregar nuevo vino:</h2>
            <div className="space-y-3">
              <input type="text" placeholder="Nombre del vino *" value={form.nombre} onChange={e => handleInput('nombre', e.target.value)} className="w-full px-4 py-3 rounded-lg text-sm outline-none placeholder:text-[#AAAAAA]" style={{ background: '#FAFAFA', border: '1px solid #DDDDDD', color: '#4A4A4A' }} />
              <input type="text" placeholder="Bodega" value={form.bodega} onChange={e => handleInput('bodega', e.target.value)} className="w-full px-4 py-3 rounded-lg text-sm outline-none placeholder:text-[#AAAAAA]" style={{ background: '#FAFAFA', border: '1px solid #DDDDDD', color: '#4A4A4A' }} />
              <div className="relative">
                <select value={form.cosecha} onChange={e => handleInput('cosecha', e.target.value)} className="w-full px-4 py-3 rounded-lg text-sm outline-none appearance-none cursor-pointer" style={{ background: '#FAFAFA', border: '1px solid #DDDDDD', color: form.cosecha ? '#4A4A4A' : '#AAAAAA' }}>
                  <option value="">Cosecha</option>
                  {cosechas.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#A4A4A4' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg></div>
              </div>
              <div className="relative">
                <select value={form.uva} onChange={e => handleInput('uva', e.target.value)} className="w-full px-4 py-3 rounded-lg text-sm outline-none appearance-none cursor-pointer" style={{ background: '#FAFAFA', border: '1px solid #DDDDDD', color: form.uva ? '#4A4A4A' : '#AAAAAA' }}>
                  <option value="">Uva</option>
                  {uvas.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#A4A4A4' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg></div>
              </div>
              <div className="relative">
                <select value={form.provincia} onChange={e => handleInput('provincia', e.target.value)} className="w-full px-4 py-3 rounded-lg text-sm outline-none appearance-none cursor-pointer" style={{ background: '#FAFAFA', border: '1px solid #DDDDDD', color: form.provincia ? '#4A4A4A' : '#AAAAAA' }}>
                  <option value="">Provincia</option>
                  {Object.keys(geografias).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#A4A4A4' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg></div>
              </div>
              {form.provincia && Object.keys(geografias[form.provincia] || {}).length > 0 && (
                <div className="relative">
                  <select value={form.region} onChange={e => handleInput('region', e.target.value)} className="w-full px-4 py-3 rounded-lg text-sm outline-none appearance-none cursor-pointer" style={{ background: '#FAFAFA', border: '1px solid #DDDDDD', color: form.region ? '#4A4A4A' : '#AAAAAA' }}>
                    <option value="">Región</option>
                    {Object.keys(geografias[form.provincia]).map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#A4A4A4' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg></div>
                </div>
              )}
              {form.region && geografias[form.provincia]?.[form.region]?.length > 0 && (
                <div className="relative">
                  <select value={form.subregion} onChange={e => handleInput('subregion', e.target.value)} className="w-full px-4 py-3 rounded-lg text-sm outline-none appearance-none cursor-pointer" style={{ background: '#FAFAFA', border: '1px solid #DDDDDD', color: form.subregion ? '#4A4A4A' : '#AAAAAA' }}>
                    <option value="">Subregión</option>
                    {geografias[form.provincia][form.region].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#A4A4A4' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg></div>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => saveWine(false)} disabled={!isFormValid} className="flex-1 py-3 rounded-lg text-sm font-medium transition-all disabled:cursor-not-allowed" style={{ background: '#FFFFFF', border: `1px solid ${isFormValid ? '#722F37' : '#DDDDDD'}`, color: isFormValid ? '#722F37' : '#AAAAAA' }}>
                <Plus className="w-4 h-4 inline mr-1" />Mi Lista
              </button>
              <button onClick={() => saveWine(true)} disabled={!isFormValid} className="flex-1 py-3 rounded-lg text-sm font-medium transition-all disabled:cursor-not-allowed" style={{ background: isFormValid ? '#722F37' : '#FFFFFF', border: `1px solid ${isFormValid ? '#722F37' : '#DDDDDD'}`, color: isFormValid ? '#FFFFFF' : '#AAAAAA' }}>
                <Star className="w-4 h-4 inline mr-1" />Ya lo probé
              </button>
            </div>
          </section>
        )}

        {(section === 'lista' || section === 'probados') && (
          <div className="rounded-xl p-5 shadow-sm" style={{ background: '#fff' }}>
            <h2 className="text-sm font-medium mb-4 tracking-wider" style={{ color: '#722F37' }}>
              {section === 'lista' ? 'Mi Lista' : 'Ya probé'}
            </h2>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#AAAAAA' }} />
              <input type="text" placeholder="Buscar por nombre..." value={currentSearch} onChange={e => setCurrentSearch(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-lg text-sm outline-none placeholder:text-[#AAAAAA]" style={{ background: '#FAFAFA', border: '1px solid #DDDDDD', color: '#4A4A4A' }} />
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
                  <div className="p-4 rounded-xl space-y-3" style={{ background: '#FAFAFA' }}>
                    {[{ key: 'cosecha', label: 'Cosecha' }, { key: 'bodega', label: 'Bodega' }, { key: 'uva', label: 'Uva' }].map(({ key, label }) => (
                      filterOptions[key].length > 0 && (
                        <div key={key}>
                          <p className="text-xs uppercase tracking-wider mb-2" style={{ color: '#A4A4A4' }}>{label}</p>
                          <div className="flex flex-wrap gap-2">
                            {filterOptions[key].map(val => (
                              <button key={val} onClick={() => toggleFilter(key, val)} className="px-3 py-1.5 rounded-full text-xs transition-all" style={{ background: filters[key].includes(val) ? '#722F37' : '#FFFFFF', color: filters[key].includes(val) ? '#FFFFFF' : '#722F37', border: '1px solid #722F37' }}>
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
                  {currentSearch ? 'No hay vinos con ese nombre' : activeFilterCount > 0 ? 'No hay vinos con estos filtros' : section === 'lista' ? 'Tu lista está vacía' : 'Aún no probaste ningún vino'}
                </p>
              ) : (
                filteredWines.map(wine => (
                  <div key={wine.id} className="p-4 rounded-xl" style={{ background: '#FAFAFA' }}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium" style={{ color: '#4A4A4A' }}>{wine.nombre}</h3>
                        <p className="text-sm mt-1" style={{ color: '#A4A4A4' }}>{[wine.bodega, wine.cosecha, wine.uva, wine.provincia, wine.region, wine.subregion].filter(Boolean).join(' · ') || 'Sin detalles'}</p>
                        {wine.probado && wine.rating > 0 && (
                          <div className="flex gap-0.5 mt-2">
                            {[1, 2, 3, 4, 5].map(s => <Star key={s} className="w-4 h-4" fill={s <= wine.rating ? '#722F37' : 'none'} style={{ color: '#722F37' }} />)}
                          </div>
                        )}
                        {wine.comentario && <p className="text-sm mt-2 italic" style={{ color: '#A4A4A4' }}>"{wine.comentario}"</p>}
                      </div>
                      <div className="flex gap-2 ml-3">
                        <button onClick={() => moveWine(wine.id)} className="p-2 rounded-full" style={{ background: '#FFFFFF' }}>
                          {section === 'lista' ? <Check className="w-4 h-4" style={{ color: '#722F37' }} /> : <Bookmark className="w-4 h-4" style={{ color: '#722F37' }} />}
                        </button>
                        <button onClick={() => deleteWine(wine.id)} className="p-2 rounded-full" style={{ background: '#FFFFFF' }}>
                          <Trash2 className="w-4 h-4" style={{ color: '#722F37' }} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
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
            <textarea placeholder="Comentario (opcional)" value={comentario} onChange={e => setComentario(e.target.value.slice(0, 200))} maxLength={200} className="w-full px-4 py-3 rounded-lg text-sm outline-none placeholder:text-[#AAAAAA] resize-none mb-3" style={{ background: '#FFFFFF', border: '1px solid #DDDDDD', color: '#4A4A4A', minHeight: '80px' }} />
            <p className="text-xs mb-4" style={{ color: '#AAAAAA' }}>{comentario.length}/200</p>
            <button onClick={() => confirmRating(selectedRating)} disabled={selectedRating === 0 && comentario.trim() === ''} className="w-full py-3 rounded-lg text-sm font-medium disabled:cursor-not-allowed" style={{ background: (selectedRating > 0 || comentario.trim()) ? '#722F37' : '#F1F1F1', color: (selectedRating > 0 || comentario.trim()) ? '#FFFFFF' : '#AAAAAA' }}>
              Guardar
            </button>
          </div>
        </div>
      )}

      <div
        className="fixed bottom-6 left-1/2 px-5 py-3 rounded-full text-sm font-medium shadow-lg"
        style={{
          background: '#722F37',
          color: '#FFFFFF',
          transform: `translateX(-50%) translateY(${toast ? '0px' : '24px'})`,
          opacity: toast ? 1 : 0,
          transition: 'all 0.3s ease',
          pointerEvents: 'none'
        }}
      >
        Vino agregado con éxito 🍷
      </div>
    </div>
  );
}
