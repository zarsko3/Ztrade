export default function TestPage() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Test Page</h1>
      <p>This page is working correctly.</p>
      <p>Timestamp: {new Date().toISOString()}</p>
      <p>Environment: {process.env.NODE_ENV || 'development'}</p>
    </div>
  );
} 