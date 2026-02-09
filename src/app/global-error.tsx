'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '20px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}>
          <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>Something went wrong!</h1>
          <p style={{ color: '#666', marginBottom: '24px', textAlign: 'center', maxWidth: '500px' }}>
            We're experiencing technical difficulties. Please try again later.
          </p>
          {error.digest && (
            <p style={{ fontSize: '12px', color: '#999', marginBottom: '24px' }}>
              Error ID: {error.digest}
            </p>
          )}
          <button
            onClick={() => reset()}
            style={{
              padding: '12px 24px',
              backgroundColor: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Try again
          </button>
          <a href="/" style={{
            marginTop: '16px',
            color: '#0070f3',
            textDecoration: 'none',
          }}>
            Go back home
          </a>
        </div>
      </body>
    </html>
  );
}
