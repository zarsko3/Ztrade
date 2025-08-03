export default function ApiTestPage() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>API Test Page</h1>
      <p>This page is working correctly.</p>
      <p>If you can see this, page routing is working but API routing is broken.</p>
      <p>Timestamp: {new Date().toISOString()}</p>
    </div>
  );
} 