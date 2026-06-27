import React, { useEffect, useRef, useState } from 'react';

export default function Grade46MobileNav({ navItems = [], activeTab = 'home', openTab, logout }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const wrapRef = useRef(null);

  const primaryItems = navItems.filter(item => ['home', 'lessons', 'quizzes', 'missions'].includes(item.id));
  const moreItems = navItems.filter(item => ['groups', 'badges', 'profile'].includes(item.id));

  useEffect(() => {
    function handlePointerDown(event) {
      if (!wrapRef.current || wrapRef.current.contains(event.target)) return;
      setMoreOpen(false);
    }

    function handleEscape(event) {
      if (event.key === 'Escape') setMoreOpen(false);
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleOpenTab = (tab) => {
    setMoreOpen(false);
    if (typeof openTab === 'function') openTab(tab);
  };

  const handleLogout = () => {
    setMoreOpen(false);
    if (typeof logout === 'function') logout();
  };

  return (
    <nav className="g46-mobile-nav" aria-label="Grade 3 to 6 mobile navigation" ref={wrapRef}>
      {moreOpen && (
        <div className="g46-mobile-more" role="menu" aria-label="More student navigation options">
          {moreItems.map(item => (
            <button
              type="button"
              key={item.id}
              className={activeTab === item.id ? 'active' : ''}
              onClick={() => handleOpenTab(item.id)}
              role="menuitem"
            >
              <span>{item.icon}</span>
              <b>{item.label}</b>
            </button>
          ))}
          <button type="button" className="danger" onClick={handleLogout} role="menuitem">
            <span>↩</span>
            <b>Logout</b>
          </button>
        </div>
      )}

      <div className="g46-mobile-nav-bar">
        {primaryItems.map(item => (
          <button
            type="button"
            key={item.id}
            className={activeTab === item.id ? 'active' : ''}
            onClick={() => handleOpenTab(item.id)}
          >
            <span>{item.icon}</span>
            <b>{item.label}</b>
          </button>
        ))}

        <button
          type="button"
          className={moreOpen || ['groups', 'badges', 'profile'].includes(activeTab) ? 'active' : ''}
          onClick={() => setMoreOpen(value => !value)}
          aria-expanded={moreOpen}
          aria-haspopup="menu"
        >
          <span>⋯</span>
          <b>More</b>
        </button>
      </div>
    </nav>
  );
}
