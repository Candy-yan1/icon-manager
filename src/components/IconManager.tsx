import React, { useState, useEffect, useCallback } from 'react';
import { Search, Upload, X, ChevronLeft, ChevronRight, Loader2, LogIn, LogOut, Lock, BookOpen, Monitor, Smartphone, IdCard, LayoutGrid, Copy, Download } from 'lucide-react';

interface Icon {
  id: string;
  name: string;
  url: string;
  tags: string[];
  mtime: number;
  uploadedBy?: string;
}

interface UserInfo {
  username: string;
  role: 'admin' | 'user';
  approved: boolean;
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
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authChecking, setAuthChecking] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isUserManageOpen, setIsUserManageOpen] = useState(false);
  const [users, setUsers] = useState<UserInfo[]>([]);

  // Check auth status
  useEffect(() => {
    fetch('/api/auth/check')
      .then(res => res.json())
      .then(data => {
        setIsLoggedIn(data.loggedIn);
        setCurrentUser(data.user);
      })
      .catch(console.error)
      .finally(() => setAuthChecking(false));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsLoggedIn(true);
        setCurrentUser(data.user);
        setIsLoginOpen(false);
        setUsername('');
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
      setCurrentUser(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: registerUsername, password: registerPassword })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('注册成功，等管理员点一下授权再上传');
        setIsRegisterOpen(false);
        setRegisterUsername('');
        setRegisterPassword('');
      } else {
        alert(data.error || '注册失败');
      }
    } catch (err) {
      alert('注册失败');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword, newPassword })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('暗号改好勒');
        setIsChangePasswordOpen(false);
        setOldPassword('');
        setNewPassword('');
      } else {
        alert(data.error || '修改失败');
      }
    } catch (err) {
      alert('修改失败');
    }
  };

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users || []);
      } else {
        alert(data.error || '加载用户失败');
      }
    } catch (err) {
      alert('加载用户失败');
    }
  };

  useEffect(() => {
    if (isUserManageOpen) {
      loadUsers();
    }
  }, [isUserManageOpen]);

  const toggleUserApproved = async (user: UserInfo) => {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username, approved: !user.approved })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers(prev =>
          prev.map(u => (u.username === user.username ? { ...u, approved: !u.approved } : u))
        );
      } else {
        alert(data.error || '操作失败');
      }
    } catch (err) {
      alert('操作失败');
    }
  };

  const isAdmin = currentUser?.role === 'admin';
  const canUpload = !!currentUser && currentUser.approved;

  const fetchIcons = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '40',
        search,
        category: activeCategory === 'custom' ? '' : activeCategory,
        // refresh is disabled in static mode
        refresh: 'false'
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
            {isLoggedIn && (
              <a href="/docs" className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors mr-2">
                <BookOpen className="w-4 h-4" />
                <span className="hidden sm:inline">开发者指南</span>
              </a>
            )}
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
                  {currentUser && (
                    <div className="hidden md:flex flex-col items-end text-xs text-gray-500 mr-2">
                      <span>当前用户：{currentUser.username}</span>
                      <span>{currentUser.approved ? '已授权上传' : '等管理员点一下授权'}</span>
                    </div>
                  )}
                  {isAdmin && (
                    <button
                      onClick={() => setIsUserManageOpen(true)}
                      className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                    >
                      用户管理
                    </button>
                  )}
                  <button
                    onClick={() => setIsChangePasswordOpen(true)}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  >
                    改暗号
                  </button>
                  {canUpload && (
                  <button 
                    onClick={() => setIsUploadOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    传上起
                  </button>
                  )}
                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    退出去
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => setIsLoginOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
                  >
                    <LogIn className="w-4 h-4" />
                    老法师登入
                  </button>
                  <button
                    onClick={() => setIsRegisterOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    登记账户
                  </button>
                </>
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
                {isAdmin && (
                  <button 
                    onClick={() => handleDelete(selectedIcon.id)}
                    className="flex-1 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium transition-colors"
                  >
                    删特伊
                  </button>
                )}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  autoFocus
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">暗号</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
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

      {isRegisterOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setIsRegisterOpen(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-600" />
                登记账户
              </h2>
              <button onClick={() => setIsRegisterOpen(false)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>

            <form onSubmit={handleRegister}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
                <input 
                  type="text" 
                  value={registerUsername}
                  onChange={e => setRegisterUsername(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  autoFocus
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">暗号</label>
                <input 
                  type="password" 
                  value={registerPassword}
                  onChange={e => setRegisterPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <button 
                type="submit"
                className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                登记
              </button>
            </form>
          </div>
        </div>
      )}

      {isChangePasswordOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setIsChangePasswordOpen(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-600" />
                改暗号
              </h2>
              <button onClick={() => setIsChangePasswordOpen(false)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>

            <form onSubmit={handleChangePassword}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">旧暗号</label>
                <input 
                  type="password" 
                  value={oldPassword}
                  onChange={e => setOldPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  autoFocus
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">新暗号</label>
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <button 
                type="submit"
                className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                存起
              </button>
            </form>
          </div>
        </div>
      )}

      {isUserManageOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setIsUserManageOpen(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">用户管理</h2>
              <button onClick={() => setIsUserManageOpen(false)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="max-h-80 overflow-y-auto space-y-2">
              {users.map(user => (
                <div key={user.username} className="flex items-center justify-between px-3 py-2 border border-gray-100 rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-gray-800">{user.username}</div>
                    <div className="text-xs text-gray-500">
                      角色：{user.role === 'admin' ? '管理员' : '普通用户'} · 状态：{user.approved ? '已授权' : '未授权'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleUserApproved(user)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium ${
                        user.approved
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {user.approved ? '关掉上传' : '开上传'}
                    </button>
                  </div>
                </div>
              ))}
              {users.length === 0 && (
                <div className="text-sm text-gray-500 text-center py-4">还没啥用户</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
