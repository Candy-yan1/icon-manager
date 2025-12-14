import React, { useState, useMemo } from 'react';

export default function IconManager({ icons }) {
  const [search, setSearch] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(null);

  const filteredIcons = useMemo(() => {
    // Only show icons if search has at least 1 character, or show none/top 20 by default?
    // User complained about "all cached out". Let's show empty state or very few by default.
    if (!search) return icons.slice(0, 24); 
    
    const lowerSearch = search.toLowerCase();
    // Limit to 100 results to prevent rendering lag
    return icons.filter(icon => icon.toLowerCase().includes(lowerSearch)).slice(0, 100);
  }, [search, icons]);

  return (
    <div className="p-4">
      <div className="mb-4 sticky top-0 bg-white p-4 shadow-md rounded-lg z-10">
        <input
          type="text"
          placeholder="Type to search icons..."
          className="w-full p-2 border border-gray-300 rounded"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="mt-2 text-sm text-gray-500 flex justify-between">
           <span>Showing {filteredIcons.length} results</span>
           <span>Total: {icons.length}</span>
        </div>
      </div>

      {filteredIcons.length === 0 && search && (
        <div className="text-center text-gray-500 py-8">No icons found.</div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
        {filteredIcons.map((icon) => (
          <div
            key={icon}
            className="flex flex-col items-center p-2 border rounded hover:bg-gray-50 cursor-pointer group relative"
            onClick={() => setSelectedIcon(icon)}
          >
            <img
              src={`/icon/${icon}`}
              alt={icon}
              className="w-12 h-12 object-contain mb-2"
              loading="lazy"
              decoding="async"
            />
            <span className="text-xs text-center break-all line-clamp-2">{icon}</span>
            
            {/* Quick download button on hover */}
            <a 
              href={`/icon/${icon}`} 
              download 
              className="absolute top-1 right-1 bg-white rounded-full p-1 shadow opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
              title="Download"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </a>
          </div>
        ))}
      </div>

      {selectedIcon && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedIcon(null)}>
          <div className="bg-white p-6 rounded-lg max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4 break-all">{selectedIcon}</h3>
            <div className="flex justify-center mb-4 bg-gray-100 p-4 rounded">
               <img src={`/icon/${selectedIcon}`} alt={selectedIcon} className="max-w-full max-h-64 object-contain" />
            </div>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input 
                  readOnly 
                  value={`/icon/${selectedIcon}`} 
                  className="flex-1 p-2 border rounded bg-gray-50 text-sm"
                />
                <button
                  className="bg-gray-200 text-gray-700 px-3 py-2 rounded hover:bg-gray-300 text-sm"
                  onClick={() => {
                    navigator.clipboard.writeText(`/icon/${selectedIcon}`);
                    alert('Path copied!');
                  }}
                >
                  Copy
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mt-4">
                 <a 
                    href={`/icon/${selectedIcon}`} 
                    download
                    className="flex items-center justify-center bg-blue-600 text-white py-2 rounded hover:bg-blue-700 text-center"
                 >
                    Download File
                 </a>
                 <a 
                    href={`/api/download?name=${encodeURIComponent(selectedIcon)}`}
                    target="_blank"
                    className="flex items-center justify-center border border-blue-600 text-blue-600 py-2 rounded hover:bg-blue-50 text-center"
                 >
                    API Download
                 </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
