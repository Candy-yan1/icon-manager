import React, { useState, useMemo } from 'react';
import { Search, X, ChevronLeft, ChevronRight, Monitor, Smartphone, IdCard, LayoutGrid, Copy, Download, Info } from 'lucide-react';
import fileList from '../generated/file-list.json';
import dbData from '../../db.json';

interface Icon {
  id: string;
  name: string;
  url: string;
  tags: string[];
  mtime: number;
  uploadedBy?: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const CATEGORY_MAP: Record<string, string> = {
  icon: 'icon',
  all: 'icon',
  pc: 'pc',
  app: 'app',
  mobile: 'app',
  card: 'card'
};

export default function IconManager() {
  const [activeCategory, setActiveCategory] = useState(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const category = url.searchParams.get('category');
      return category || 'all';
    }
    return 'all';
  });
  
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedIcon, setSelectedIcon] = useState<Icon | null>(null);

  // Computed state for filtered icons and pagination
  const { icons, pagination } = useMemo(() => {
    let filtered = fileList;

    // 1. Filter by Category
    const dirPrefix = CATEGORY_MAP[activeCategory] || CATEGORY_MAP['icon'];
    if (dirPrefix) {
      filtered = filtered.filter(f => f.relativePath.startsWith(`${dirPrefix}/`));
    }

    // 2. Filter by Search (Name or Tags)
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(f => {
        // @ts-ignore - dbData structure is known but not typed
        const meta = dbData.icons[f.relativePath] || {};
        const tags = meta.tags?.join(' ').toLowerCase() || '';
        return f.name.toLowerCase().includes(searchLower) || tags.includes(searchLower);
      });
    }

    // 3. Sort by Date (Newest first) - assuming user wants newest
    filtered.sort((a, b) => b.mtime - a.mtime);

    // 4. Pagination
    const limit = 40;
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const pageData = filtered.slice(start, start + limit);

    // 5. Map to Icon interface
            const mappedIcons: Icon[] = pageData.map(f => {
              // @ts-ignore
              const meta = dbData.icons[f.relativePath] || {};
              // Encode URL components to handle special characters like '+' and Chinese
              const url = '/' + f.relativePath.split('/').map(part => encodeURIComponent(part)).join('/');
              return {
                id: f.relativePath,
                name: f.name,
                url,
                tags: meta.tags || [],
                mtime: f.mtime,
                uploadedBy: meta.uploadedBy
              };
            });

    return {
      icons: mappedIcons,
      pagination: {
        total,
        page,
        limit,
        totalPages
      }
    };
  }, [activeCategory, search, page]);

  const handleCategoryClick = (category: string, keyword: string) => {
    setActiveCategory(category);
    setSearch(keyword);
    setPage(1);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (category === 'all' && keyword === '') {
        url.searchParams.delete('category');
        if (!url.searchParams.get('search')) {
          url.searchParams.delete('search');
        }
      } else {
        url.searchParams.set('category', category);
        if (keyword) {
          url.searchParams.set('search', keyword);
        } else {
          url.searchParams.delete('search');
        }
      }
      window.history.pushState({}, '', url.toString());
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <header className="mb-8 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-3xl font-bold text-gray-800">FlatNas图库</h1>
            
            {/* Category Tabs */}
            <nav className="hidden lg:flex items-center bg-gray-200 p-1 rounded-xl">
              <button 
                onClick={() => handleCategoryClick('all', '')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${activeCategory === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
              >
                <LayoutGrid className="w-4 h-4" />
                图标
              </button>
              <button 
                onClick={() => handleCategoryClick('pc', '')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${activeCategory === 'pc' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
              >
                <Monitor className="w-4 h-4" />
                PC壁纸
              </button>
              <button 
                onClick={() => handleCategoryClick('mobile', '')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${activeCategory === 'mobile' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
              >
                <Smartphone className="w-4 h-4" />
                手机壁纸
              </button>
              <button 
                onClick={() => handleCategoryClick('card', '')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${activeCategory === 'card' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
              >
                <IdCard className="w-4 h-4" />
                卡片图片
              </button>
            </nav>
          </div>

          <div className="text-base text-gray-500 font-medium flex-1 text-left ml-4">
             Q群：613835409
          </div>

          <div className="flex gap-4 w-full md:w-auto items-center">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="寻寻看..." 
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                  if (e.target.value === '') setActiveCategory('all');
                  else setActiveCategory('custom');
                }}
              />
            </div>
            
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium border border-blue-100">
                <Info className="w-3 h-3" />
                静态浏览模式
            </div>
          </div>
        </div>
        
        {/* Mobile Tabs */}
        <nav className="flex lg:hidden items-center bg-gray-200 p-1 rounded-xl overflow-x-auto">
          <button 
            onClick={() => handleCategoryClick('all', '')}
            className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${activeCategory === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <LayoutGrid className="w-4 h-4" />
            图标
          </button>
          <button 
            onClick={() => handleCategoryClick('pc', '')}
            className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${activeCategory === 'pc' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <Monitor className="w-4 h-4" />
            PC壁纸
          </button>
          <button 
            onClick={() => handleCategoryClick('mobile', '')}
            className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${activeCategory === 'mobile' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <Smartphone className="w-4 h-4" />
            手机壁纸
          </button>
          <button 
            onClick={() => handleCategoryClick('card', '')}
            className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${activeCategory === 'card' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <IdCard className="w-4 h-4" />
            卡片图片
          </button>
        </nav>
      </header>

      {/* Grid */}
      <div className={`grid gap-4 ${
        activeCategory === 'pc'
          ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
          : activeCategory === 'mobile'
          ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'
          : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8'
      }`}>
        {icons.map(icon => {
          const isPc = activeCategory === 'pc';
          const isCard = activeCategory === 'card';
          const isMobile = activeCategory === 'mobile';
          return (
            <div 
              key={icon.id}
              onClick={() => setSelectedIcon(icon)}
              className={`group relative bg-white rounded-xl border border-gray-200 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all ${
                isPc || isCard
                  ? 'aspect-video overflow-hidden'
                  : isMobile
                  ? 'aspect-[9/16] overflow-hidden'
                  : 'aspect-square p-4 flex flex-col items-center justify-center'
              }`}
            >
              <div className="absolute top-2 right-2 z-10 flex flex-col items-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      const fullUrl = `${window.location.origin}${icon.url}`;
                      await navigator.clipboard.writeText(fullUrl);
                      alert('地址复制好勒');
                    } catch {
                      alert('复制失败');
                    }
                  }}
                  className="flex items-center gap-1 rounded-full bg-black/60 text-white px-2 py-1 text-[11px]"
                >
                  <Copy className="w-3 h-3" />
                  <span>复制</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    try {
                      const a = document.createElement('a');
                      a.href = icon.url;
                      a.download = icon.name;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                    } catch {
                      window.open(icon.url, '_blank');
                    }
                  }}
                  className="flex items-center gap-1 rounded-full bg-black/60 text-white px-2 py-1 text-[11px]"
                >
                  <Download className="w-3 h-3" />
                  <span>下载</span>
                </button>
              </div>
              <img 
                src={icon.url} 
                alt={icon.name}
                loading="lazy"
                className={
                  isPc || isCard || isMobile
                    ? 'w-full h-full object-cover'
                    : 'w-12 h-12 object-contain mb-3'
                }
              />
              {isPc || isCard || isMobile ? (
                <div className="absolute inset-x-0 bottom-0 bg-black/40 text-[11px] text-gray-100 px-2 py-1 flex justify-between items-center">
                  <span className="truncate max-w-[70%]">{icon.name}</span>
                  {icon.uploadedBy && (
                    <span className="ml-2 truncate max-w-[30%] text-gray-200">
                      {icon.uploadedBy}
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-xs text-gray-500 truncate w-full text-center px-2">{icon.name}</span>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          <button 
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 hover:bg-gray-100"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="flex items-center px-4 text-sm text-gray-600">
            第 {page} 页 / 共 {pagination.totalPages} 页
          </span>
          <button 
            disabled={page === pagination.totalPages}
            onClick={() => setPage(p => p + 1)}
            className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 hover:bg-gray-100"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {selectedIcon && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedIcon(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-semibold truncate pr-4">{selectedIcon.name}</h2>
              <button onClick={() => setSelectedIcon(null)} className="p-1 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex justify-center bg-gray-50 rounded-xl p-8 mb-4 border border-gray-100">
              <img src={selectedIcon.url} className="w-32 h-32 object-contain" />
            </div>

            <div className="space-y-4">
              {selectedIcon.uploadedBy && (
                <div className="text-xs text-gray-500">
                  上传人：{selectedIcon.uploadedBy}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  标签
                </label>
                <input 
                  type="text" 
                  disabled
                  defaultValue={selectedIcon.tags.join(', ')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed text-gray-500"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={async () => {
                    try {
                      const fullUrl = `${window.location.origin}${selectedIcon.url}`;
                      await navigator.clipboard.writeText(fullUrl);
                      alert('地址复制好勒');
                    } catch {
                      alert('复制失败');
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-center transition-colors flex items-center justify-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  复制地址
                </button>
                <a 
                  href={selectedIcon.url} 
                  download 
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-center transition-colors"
                >
                  落下来
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
