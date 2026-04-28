import { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import { 
  Search, ArrowRight,
  BrainCircuit, FileText, PieChart, Calculator, 
  Briefcase, Users, TrendingUp, Mail, Bell, Puzzle
} from 'lucide-react'
import ForDevelopers from './ForDevelopers'

interface Plugin {
  id: string;
  name: string;
  description: string;
  price: string;
  is_free: boolean;
}

const pluginIcons: Record<string, React.ElementType> = {
  mcp: BrainCircuit,
  invoice_gen: FileText,
  expense_categorizer: PieChart,
  tax_calculator: Calculator,
  small_business: Briefcase,
  stockholders: Users,
  ai_prediction: TrendingUp,
  email_notifications: Mail,
  web_notifications: Bell
};

function App() {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'plugins' | 'developers'>('plugins');
  const [globalSearch, setGlobalSearch] = useState('');
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const globalSearchRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleNavSearchClick = () => {
    setIsGlobalSearchOpen(true);
    setTimeout(() => {
      globalSearchRef.current?.focus();
    }, 0);
  };

  useEffect(() => {
    axios.get('http://localhost:8001/api/plugins')
      .then(res => setPlugins(res.data))
      .catch(err => console.error("Error fetching plugins:", err));
  }, []);

  const filtered = plugins.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.description.toLowerCase().includes(search.toLowerCase())
  );

  const globalFilteredPlugins = plugins.filter(p => 
    p.name.toLowerCase().includes(globalSearch.toLowerCase()) || 
    p.description.toLowerCase().includes(globalSearch.toLowerCase())
  );
  
  const pages = [
    { id: 'developers', name: 'For developers', description: 'Documentation on how to build and add plugins' }
  ];
  
  const globalFilteredPages = pages.filter(p =>
    p.name.toLowerCase().includes(globalSearch.toLowerCase()) || 
    p.description.toLowerCase().includes(globalSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen relative overflow-hidden pb-32">
      {/* Ghost text background */}
      <div className="ghost-text text-[120px] top-12 left-12 select-none">
        MARKETPLACE
      </div>

      {/* Floating Nav Approximation */}
      <nav className="max-w-[1200px] w-[calc(100%-3rem)] mx-auto mt-6 bg-white/90 backdrop-blur-md rounded-[999px] shadow-[0px_4px_24px_rgba(0,0,0,0.04)] h-[80px] sticky top-6 z-50">
        
        {/* Default Nav State */}
        <div 
          className={`absolute inset-0 px-10 flex items-center justify-between transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${
            isGlobalSearchOpen ? 'opacity-0 -translate-y-4 pointer-events-none' : 'opacity-100 translate-y-0 pointer-events-auto'
          }`}
        >
          <div className="font-bold text-xl tracking-[-0.02em]">FinanceFlow<span className="text-[var(--color-signal-orange)] text-2xl leading-none">.</span></div>
          <div className="hidden md:flex gap-14 font-medium text-[16px]">
            <button 
              className={`hover:opacity-70 transition-opacity ${activeTab === 'plugins' ? 'text-[var(--color-signal-orange)]' : ''}`}
              onClick={() => setActiveTab('plugins')}
            >
              Plugins
            </button>
            <button 
              className={`hover:opacity-70 transition-opacity ${activeTab === 'developers' ? 'text-[var(--color-signal-orange)]' : ''}`}
              onClick={() => setActiveTab('developers')}
            >
              For developers
            </button>
          </div>
          <div 
            className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-ink-black/10 cursor-pointer hover:bg-canvas-cream transition-colors"
            onClick={handleNavSearchClick}
          >
            <Search size={20} />
          </div>
        </div>

        {/* Global Search State */}
        <div 
          className={`absolute inset-0 px-6 flex items-center transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${
            isGlobalSearchOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'
          }`}
        >
          <div className="w-full flex items-center relative h-full">
            <Search className="absolute left-4 text-ink-black/50" size={20} />
            <input
              ref={globalSearchRef}
              type="text"
              placeholder="Search plugins and pages..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              onBlur={() => {
                 setTimeout(() => {
                   setIsGlobalSearchOpen(false);
                   setGlobalSearch('');
                 }, 200);
              }}
              className="w-full h-full bg-transparent border-none focus:outline-none pl-12 pr-4 text-lg"
            />
            {globalSearch.trim() && (
              <div className="absolute top-[110%] left-0 right-0 bg-white border border-ink-black/10 rounded-2xl shadow-lg p-4 max-h-[60vh] overflow-y-auto">
                {globalFilteredPages.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-xs font-bold text-ink-black/50 uppercase tracking-widest mb-2 px-2">Pages</h4>
                    {globalFilteredPages.map(page => (
                      <div 
                        key={page.id} 
                        className="px-4 py-3 hover:bg-canvas-cream rounded-xl cursor-pointer transition-colors"
                        onMouseDown={() => {
                          setActiveTab('developers');
                          setIsGlobalSearchOpen(false);
                          setGlobalSearch('');
                        }}
                      >
                        <div className="font-medium">{page.name}</div>
                        <div className="text-sm opacity-60 text-ellipsis overflow-hidden whitespace-nowrap">{page.description}</div>
                      </div>
                    ))}
                  </div>
                )}
                
                {globalFilteredPlugins.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-ink-black/50 uppercase tracking-widest mb-2 px-2">Plugins</h4>
                    {globalFilteredPlugins.map(plugin => (
                      <div 
                        key={plugin.id} 
                        className="px-4 py-3 hover:bg-canvas-cream rounded-xl cursor-pointer transition-colors"
                        onMouseDown={() => {
                          setActiveTab('plugins');
                          setSearch(plugin.name);
                          setIsGlobalSearchOpen(false);
                          setGlobalSearch('');
                        }}
                      >
                        <div className="font-medium">{plugin.name}</div>
                        <div className="text-sm opacity-60 text-ellipsis overflow-hidden whitespace-nowrap">{plugin.description}</div>
                      </div>
                    ))}
                  </div>
                )}
                
                {globalFilteredPages.length === 0 && globalFilteredPlugins.length === 0 && (
                  <div className="p-4 text-center text-ink-black/50">No results found</div>
                )}
              </div>
            )}
            <button 
              className="ml-4 text-sm font-medium opacity-70 hover:opacity-100 shrink-0 px-4 py-2"
              onMouseDown={() => {
                setIsGlobalSearchOpen(false);
                setGlobalSearch('');
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-[1200px] mx-auto mt-24 px-6 md:px-12">
        {activeTab === 'plugins' ? (
          <>
            <div className="mb-24 max-w-2xl">
              <h1 className="text-[48px] md:text-[64px] leading-none mb-6">Extend your ecosystem.</h1>
              <p className="text-[16px] opacity-80 leading-[1.4] max-w-lg mb-8">
                Discover modules tailored for accounting, tax, and automated financial forecasting. Build exactly what you need.
              </p>
              
              <div className="relative max-w-md">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-ink-black/50" size={20} />
                <input 
                  ref={searchInputRef}
                  type="text" 
                  placeholder="Search plugins..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-white rounded-[999px] py-4 pl-14 pr-6 text-lg border border-ink-black/20 focus:outline-none focus:border-ink-black transition-colors shadow-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 relative">
              {/* Orbital arcs decoration */}
              <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-[var(--color-light-orange)]/30 -z-10 rounded-[100%] scale-[2] transform -translate-y-1/2 pointer-events-none hidden lg:block"></div>

              {filtered.map((plugin) => {
                const Icon = pluginIcons[plugin.id] || Puzzle;
                return (
                  <div key={plugin.id} className="flex flex-col items-center">
                    {/* Circular portrait card */}
                    <div className="relative mb-6 group">
                      <div className="w-[260px] h-[260px] rounded-full bg-lifted-cream border border-ink-black/5 shadow-[0px_24px_48px_rgba(0,0,0,0.08)] flex flex-col items-center justify-center p-8 text-center transition-transform duration-500 group-hover:scale-105 bg-white">
                        <Icon className="w-16 h-16 mb-4 text-ink-black/40 group-hover:text-[var(--color-signal-orange)] transition-colors duration-500" strokeWidth={1.5} />
                        <h3 className="text-[24px] leading-[1.2]">{plugin.name}</h3>
                      </div>
                      
                      {/* Satellite CTA */}
                      <button className="absolute bottom-4 right-2 w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-[0px_8px_24px_rgba(0,0,0,0.12)] hover:scale-110 transition-transform">
                        <ArrowRight size={20} />
                      </button>
                    </div>

                    {/* Eyebrow */}
                    <div className="text-[14px] font-bold tracking-[0.04em] uppercase text-ink-black/60 mb-2 flex items-center gap-1.5">
                      <span className="text-[var(--color-signal-orange)] text-[18px] leading-none mb-0.5">•</span> PLUGIN
                    </div>
                    
                    <p className="text-center text-[16px] leading-[1.4] max-w-[260px] mb-6 opacity-80 h-[66px] overflow-hidden text-ellipsis">
                      {plugin.description}
                    </p>
                    
                    <div className="mt-auto">
                      {plugin.is_free ? (
                        <span className="price-pill uppercase tracking-[0.04em]">Free</span>
                      ) : (
                        <button className="pill-button">{plugin.price}</button>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {filtered.length === 0 && (
                <div className="col-span-full text-center py-24 opacity-50 text-xl">
                  No plugins match your search.
                </div>
              )}
            </div>
          </>
        ) : (
          <ForDevelopers />
        )}
      </main>
    </div>
  )
}

export default App
