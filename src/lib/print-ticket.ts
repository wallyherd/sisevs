export function printTicket(pedido: any, itens: any[], tipo: 'cozinha' | 'caixa' = 'caixa') {
  const rawDate = pedido.aberta_em || pedido.data_hora || pedido.created_at;
  const dateObj = rawDate ? new Date(rawDate) : new Date();
  const data = !isNaN(dateObj.getTime())
    ? dateObj.toLocaleString('pt-BR')
    : new Date().toLocaleString('pt-BR');

  const mesaIdentificador =
    pedido.mesa?.numero ||
    pedido.mesa_numero ||
    (typeof pedido.mesa === 'string' ? pedido.mesa : null) ||
    (pedido.observacoes?.match(/Mesa:\s*([^|)\n]+)/i)?.[1]?.trim());

  const mesaTexto = mesaIdentificador
    ? (mesaIdentificador.toLowerCase().startsWith('mesa') ? mesaIdentificador : `Mesa ${mesaIdentificador}`)
    : 'Balcão';

  const clienteNome = pedido.cliente?.nome || pedido.cliente_nome_rapido || 'Balcão';

  let html = `
    <html>
      <head>
        <title>Ticket #${pedido.numero ?? ''}</title>
        <style>
          @page { margin: 0; }
          body { 
            font-family: monospace; 
            font-size: 13px; 
            width: 80mm; 
            margin: 0 auto; 
            padding: 10px;
            color: #000;
            line-height: 1.35;
          }
          h1, h2, h3, p { margin: 2px 0; text-align: center; }
          .divider { border-bottom: 1px dashed #000; margin: 6px 0; }
          .left { text-align: left; }
          .right { text-align: right; }
          .flex-between { display: flex; justify-content: space-between; }
          .item-row { display: flex; justify-content: space-between; margin-top: 4px; margin-bottom: 2px; }
          .item-name { flex: 1; padding-right: 5px; font-weight: bold; }
          .bold { font-weight: bold; }
          .obs { font-size: 11px; margin-left: 8px; color: #111; }
          @media print {
            body { width: 100%; padding: 0; }
          }
        </style>
      </head>
      <body>
        <h2>FitLife</h2>
        <p class="bold" style="font-size: 14px;">Pedido #${pedido.numero ?? '—'}</p>
        <p>${data}</p>
        
        <div class="divider"></div>
        
        <p class="left bold">
          Cliente: ${clienteNome}
        </p>
        <p class="left bold">
          ${mesaIdentificador ? `Mesa: ${mesaTexto}` : `Atendimento: Balcão`}
        </p>
        
        <div class="divider"></div>
        
        <div class="left">
          <p class="bold">ITENS DO PEDIDO</p>
          <div style="margin-top: 5px;">
  `;

  itens.forEach(item => {
    const nome = item.nome_produto || item.produto?.nome || item.nome || 'Produto';
    const precoHtml = tipo === 'caixa' && item.preco_unitario
      ? `<span>${(Number(item.preco_unitario) * Number(item.quantidade)).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</span>` 
      : '';
      
    html += `
      <div class="item-row">
        <span class="item-name">${item.quantidade}x ${nome}</span>
        ${precoHtml}
      </div>
    `;

    if (item.rodada && tipo === 'cozinha') {
      html += `<div class="obs left bold" style="font-size: 11px;">[Rodada ${item.rodada}]</div>`;
    }
    if (item.sabor) {
      html += `<div class="obs left">• ${item.sabor}</div>`;
    }
    if (Array.isArray(item.adicionais) && item.adicionais.length > 0) {
      const adicText = item.adicionais.map((a: any) => {
        if (typeof a === 'string') return a;
        const preco = Number(a.preco) || 0;
        return `${a.nome || a}${preco > 0 && tipo === 'caixa' ? ` (+${preco.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})})` : ''}`;
      }).join(', ');
      html += `<div class="obs left">+ Adicionais: ${adicText}</div>`;
    }
    if (item.observacoes) {
      html += `<div class="obs left">Obs: ${item.observacoes}</div>`;
    }
    if (item.observacoes_cozinha) {
      html += `<div class="obs left">Obs Cozinha: ${item.observacoes_cozinha}</div>`;
    }
  });

  html += `
        </div>
        <div class="divider"></div>
  `;

  if (tipo === 'caixa' && pedido.total !== undefined) {
    html += `
        <div class="flex-between bold" style="font-size: 14px;">
          <span>TOTAL</span>
          <span>${Number(pedido.total).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</span>
        </div>
        <div class="divider"></div>
    `;
  }

  if (pedido.observacoes) {
    html += `
        <div class="left" style="margin-top: 6px;">
          <p class="bold">Observações Gerais:</p>
          <p class="left">${pedido.observacoes}</p>
        </div>
        <div class="divider"></div>
    `;
  }

  html += `
        <p style="margin-top: 8px;">${tipo === 'cozinha' ? '*** VIA DA COZINHA ***' : 'Obrigado pela preferência!'}</p>
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
