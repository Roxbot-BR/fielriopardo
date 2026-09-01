'use client';

import { useEffect, useState } from 'react';

export default function LimparCachePage() {
  const [log, setLog] = useState<string[]>([]);

  const addLog = (msg: string) => {
    setLog(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);
  };

  const limparTudo = async () => {
    addLog('Iniciando limpeza total...');
    
    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const reg of regs) {
          await reg.unregister();
          addLog('SW desregistrado: ' + reg.scope);
        }
      }

      const cacheNames = await caches.keys();
      for (const name of cacheNames) {
        await caches.delete(name);
        addLog('Cache deletado: ' + name);
      }

      addLog('TUDO LIMPO! Recarregando em 3s...');
      setTimeout(() => {
        window.location.href = '/admin/jogos';
      }, 3000);
    } catch (e: any) {
      addLog('Erro: ' + e.message);
    }
  };

  useEffect(() => {
    addLog('Pronto para limpar cache.');
  }, []);

  return (
    <div style={{ background: '#000', color: '#fff', minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h1 style={{ color: '#C8A951' }}>Limpar Cache PWA</h1>
        
        <button onClick={limparTudo} style={{ background: '#C8A951', color: '#000', border: 'none', padding: '15px', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', width: '100%', margin: '20px 0' }}>
          LIMPAR TUDO E RECARREGAR
        </button>

        <div style={{ background: '#1a1a1a', padding: '15px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '12px' }}>
          {log.map((line, i) => <div key={i}>{line}</div>)}
        </div>
      </div>
    </div>
  );
}
