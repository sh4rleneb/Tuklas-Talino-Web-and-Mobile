export default function StartupLoader() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
        background: 'radial-gradient(circle at top left, rgba(220, 252, 231, 0.92), #fffdf3 48%, #eefdf4)'
      }}
    >
      <div
        style={{
          width: 'min(560px, calc(100vw - 40px))',
          minHeight: 320,
          display: 'grid',
          placeItems: 'center',
          textAlign: 'center',
          padding: '42px 34px',
          borderRadius: 34,
          background: 'rgba(255, 255, 255, 0.94)',
          border: '2px solid rgba(21, 150, 90, 0.16)',
          boxShadow: '0 28px 80px rgba(15, 23, 42, 0.10)'
        }}
      >
        <div>
          <div
            style={{
              width: 132,
              height: 132,
              margin: '0 auto 24px',
              borderRadius: 38,
              display: 'grid',
              placeItems: 'center',
              background: 'linear-gradient(135deg, #f7ffe7, #ffffff)',
              boxShadow: '0 18px 42px rgba(21, 150, 90, 0.16), inset 0 0 0 2px rgba(255, 255, 255, 0.9)'
            }}
          >
            <img
              src="/tuklas-talino-icon.png"
              alt="Tuklas Talino"
              style={{
                width: 116,
                height: 116,
                objectFit: 'contain',
                transform: 'scale(1.14)',
                filter: 'drop-shadow(0 10px 18px rgba(7, 146, 74, 0.18))'
              }}
            />
          </div>

          <h1
            style={{
              margin: 0,
              color: '#07924A',
              fontSize: 'clamp(34px, 5vw, 46px)',
              lineHeight: 1.05,
              letterSpacing: '-0.045em',
              fontWeight: 1000
            }}
          >
            Nilo-load ang Tuklas Talino
          </h1>

          <p
            style={{
              margin: '14px 0 0',
              color: '#31486b',
              fontSize: 17,
              fontWeight: 900
            }}
          >
            Mangyaring maghintay<span style={{ letterSpacing: 3 }}>...</span>
          </p>
        </div>
      </div>
    </div>
  );
}
