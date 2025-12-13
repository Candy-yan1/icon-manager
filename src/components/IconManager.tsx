import React, { useState, useEffect, useCallback } from 'react';
import { Search, Upload, X, ChevronLeft, ChevronRight, Loader2, LogIn, LogOut, Lock, BookOpen, Monitor, Smartphone, IdCard, LayoutGrid } from 'lucide-react';

interface Icon {
  id: string;
  name: string;
  url: string;
  tags: string[];
  mtime: number;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function IconManager() {
  const [icons, setIcons] = useState<Icon[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedIcon, setSelectedIcon] = useState<Icon | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeCategory, setActiveCategory] = useState(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const category = url.searchParams.get('category');
      return category || 'all';
    }
    return 'all';
  });
  
  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [authChecking, setAuthChecking] = useState(true);

  // Check auth status
  useEffect(() => {
    fetch('/api/auth/check')
      .then(res => res.json())
      .then(data => setIsLoggedIn(data.loggedIn))
      .catch(console.error)
      .finally(() => setAuthChecking(false));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsLoggedIn(true);
        setIsLoginOpen(false);
        setPassword('');
      } else {
        alert(data.error || 'Login failed');
      }
    } catch (err) {
      alert('Login failed');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setIsLoggedIn(false);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchIcons = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '40',
        search,
        category: activeCategory === 'custom' ? '' : activeCategory,
        refresh: refreshTrigger > 0 ? 'true' : 'false'
      });
      const res = await fetch(`/api/icons?${params}`);
      const data = await res.json();
      setIcons(data.data);
      setPagination(data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, refreshTrigger, activeCategory]);

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

  useEffect(() => {
    fetchIcons();
  }, [fetchIcons]);

  const handleDelete = async (id: string) => {
    if (!confirm('侬想好勒伐？删特就么勒哦！')) return;
    try {
      const res = await fetch(`/api/icons/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      setRefreshTrigger(prev => prev + 1);
      setSelectedIcon(null);
    } catch (err) {
      alert('删勿特 (侬登入勒伐？)');
    }
  };

  const handleUpdateTags = async (id: string, tags: string[]) => {
    try {
      const res = await fetch(`/api/icons/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags })
      });
      if (!res.ok) throw new Error('Failed');
      
      // Update local state
      setIcons(prev => prev.map(icon => 
        icon.id === id ? { ...icon, tags } : icon
      ));
      if (selectedIcon?.id === id) {
        setSelectedIcon(prev => prev ? { ...prev, tags } : null);
      }
    } catch (err) {
      alert('改勿动 (侬登入勒伐？)');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <header className="mb-8 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-3xl font-bold text-gray-800">图标大世界</h1>
            
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

          <div className="flex gap-4 w-full md:w-auto items-center">
            <a href="/docs" className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors mr-2">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">开发者指南</span>
            </a>
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
            
            {!authChecking && (
              isLoggedIn ? (
                <>
                  <button 
                    onClick={() => setIsUploadOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    传上起
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    退出去
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setIsLoginOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  老法师登入
                </button>
              )
            )}
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
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {icons.map(icon => (
              <div 
                key={icon.id}
                onClick={() => setSelectedIcon(icon)}
                className="group relative aspect-square bg-white rounded-xl border border-gray-200 p-4 flex flex-col items-center justify-center cursor-pointer hover:shadow-md hover:border-blue-300 transition-all"
              >
                <img 
                  src={icon.url} 
                  alt={icon.name}
                  loading="lazy"
                  className="w-12 h-12 object-contain mb-3"
                />
                <span className="text-xs text-gray-500 truncate w-full text-center px-2">{icon.name}</span>
              </div>
            ))}
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
        </>
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
            
            <div className="flex justify-center bg-gray-50 rounded-xl p-8 mb-6 border border-gray-100">
              <img src={selectedIcon.url} className="w-32 h-32 object-contain" />
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  标签 (逗号隔开)
                  {!isLoggedIn && <span className="text-xs text-gray-400 ml-2 font-normal">(登入勒好改)</span>}
                </label>
                <input 
                  type="text" 
                  disabled={!isLoggedIn}
                  defaultValue={selectedIcon.tags.join(', ')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = e.currentTarget.value;
                      handleUpdateTags(selectedIcon.id, val.split(',').map(t => t.trim()).filter(Boolean));
                      e.currentTarget.blur();
                    }
                  }}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none ${isLoggedIn ? 'focus:ring-2 focus:ring-blue-500' : 'bg-gray-50 cursor-not-allowed text-gray-500'}`}
                />
                {isLoggedIn && <p className="text-xs text-gray-400 mt-1">敲回车保存</p>}
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                {isLoggedIn && (
                  <button 
                    onClick={() => handleDelete(selectedIcon.id)}
                    className="flex-1 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium transition-colors"
                  >
                    删特伊
                  </button>
                )}
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

      {/* Upload Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setIsUploadOpen(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">传图标</h2>
              <button onClick={() => setIsUploadOpen(false)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer relative">
              <input 
                type="file" 
                multiple
                className="absolute inset-0 opacity-0 cursor-pointer"
                accept=".svg,.png,.jpg,.webp"
                onChange={async (e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    const files = Array.from(e.target.files);
                    let successCount = 0;
                    
                    for (const file of files) {
                        const formData = new FormData();
                        formData.append('file', file);
                        // Add current category to upload request
                        formData.append('category', activeCategory);
                        try {
                          const res = await fetch('/api/icons', { method: 'POST', body: formData });
                          if (res.ok) successCount++;
                        } catch (err) {
                          console.error(err);
                        }
                    }
                    
                    if (successCount > 0) {
                        setRefreshTrigger(prev => prev + 1);
                        setIsUploadOpen(false);
                        if (successCount < files.length) {
                            alert(`传上去 ${successCount} 个，有 ${files.length - successCount} 个没传上去`);
                        }
                    } else {
                        alert('传勿上');
                    }
                  }
                }}
              />
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">点一点或者拖进来，传上起</p>
            </div>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {isLoginOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setIsLoginOpen(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-600" />
                老法师登入
              </h2>
              <button onClick={() => setIsLoginOpen(false)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            
            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">暗号</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  autoFocus
                />
              </div>
              <button 
                type="submit"
                className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                进起
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
