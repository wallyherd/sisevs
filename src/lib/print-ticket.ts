export function printTicket(pedido: any, itens: any[], tipo: 'cozinha' | 'caixa' = 'caixa') {
  const data = new Date(pedido.aberta_em || pedido.created_at).toLocaleString('pt-BR');
  
  let html = `
    <html>
      <head>
        <title>Ticket #${pedido.numero}</title>
        <style>
          @page { margin: 0; }
          body { 
            font-family: monospace; 
            font-size: 12px; 
            width: 80mm; 
            margin: 0 auto; 
            padding: 10px;
            color: #000;
          }
          h1, h2, h3, p { margin: 2px 0; text-align: center; }
          .divider { border-bottom: 1px dashed #000; margin: 5px 0; }
          .left { text-align: left; }
          .right { text-align: right; }
          .flex-between { display: flex; justify-content: space-between; }
          .item-row { display: flex; justify-content: space-between; margin-bottom: 3px; }
          .item-name { flex: 1; padding-right: 5px; }
          .bold { font-weight: bold; }
          .obs { font-size: 11px; font-style: italic; margin-left: 10px; }
          @media print {
            body { width: 100%; padding: 0; }
          }
        </style>
      </head>
      <body>
        <h2>FitLife</h2>
        <p>Pedido #${pedido.numero}</p>
        <p>${data}</p>
        
        <div class="divider"></div>
        
        <p class="left bold">
          Cliente: ${pedido.cliente?.nome || pedido.cliente_nome_rapido || 'Balcão'}
        </p>
        ${pedido.mesa ? `<p class="left bold">Mesa: ${pedido.mesa.numero}</p>` : ''}
        
        <div class="divider"></div>
        
        <div class="left">
          <p class="bold">ITENS DO PEDIDO</p>
          <div style="margin-top: 5px;">
  `;

  itens.forEach(item => {
    // Para cozinha, podemos não mostrar o preço, mas por padrão mostramos
    const precoHtml = tipo === 'caixa' 
      ? `<span>${(item.preco_unitario * item.quantidade).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</span>` 
      : '';
      
    html += `
      <div class="item-row">
        <span class="item-name">${item.quantidade}x ${item.produto?.nome || 'Produto'}</span>
        ${precoHtml}
      </div>
    `;
    if (item.observacoes) {
      html += `<div class="obs left">Obs: ${item.observacoes}</div>`;
    }
  });

  html += `
        </div>
        <div class="divider"></div>
  `;

  if (tipo === 'caixa') {
    html += `
        <div class="flex-between bold" style="font-size: 14px;">
          <span>TOTAL</span>
          <span>${pedido.total.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</span>
        </div>
        <div class="divider"></div>
    `;
  }

  if (pedido.observacoes) {
    html += `
        <div class="left" style="margin-top: 10px;">
          <p class="bold">Observações Gerais:</p>
          <p class="left">${pedido.observacoes}</p>
        </div>
        <div class="divider"></div>
    `;
  }

  html += `
        <p style="margin-top: 10px;">${tipo === 'cozinha' ? '*** VIA DA COZINHA ***' : 'Obrigado pela preferência!'}</p>
        <script>
          window.onload = () => {
            window.print();
            setTimeout(() => window.close(), 500);
          }
        </script>
      </body>
    </html>
  `;

  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  document.body.appendChild(iframe);
  iframe.contentDocument?.write(html);
  iframe.contentDocument?.close();
  
  // Limpa o iframe após a impressão
  setTimeout(() => {
    document.body.removeChild(iframe);
  }, 2000);
}
