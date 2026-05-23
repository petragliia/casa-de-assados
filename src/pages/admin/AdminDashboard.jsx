import React, { useState, useMemo } from 'react';
import { 
  Download, 
  ArrowRight, 
  Activity, 
  Flame, 
  ChevronDown, 
  TrendingUp, 
  AlertOctagon, 
  ShoppingBag, 
  Users, 
  RefreshCw 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../context/StoreContext';

// Imagem padrão luxuosa e atmosférica para o fundo editorial
const FALLBACK_IMG = 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=800';

export default function AdminDashboard() {
  const { orders, products } = useStore();
  const [timeframe, setTimeframe] = useState('today'); // padrão para 'today' para Live Operations diárias

  // Cálculos Estatísticos Dinâmicos via useMemo
  const stats = useMemo(() => {
    const now = new Date();
    
    // Delimitações de Tempo
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const quarterAgo = new Date(now); quarterAgo.setMonth(now.getMonth() - 3);
    const semesterAgo = new Date(now); semesterAgo.setMonth(now.getMonth() - 6);

    let totalRevenue = 0;
    let orderCount = 0;
    const productSales = {};
    const paymentMethods = {
      pix: { count: 0, total: 0, label: 'PIX' },
      cartao: { count: 0, total: 0, label: 'Cartão' },
      dinheiro: { count: 0, total: 0, label: 'Dinheiro' }
    };

    orders.forEach(order => {
      const orderDate = new Date(order.date);
      let isWithinTimeframe = false;

      switch(timeframe) {
        case 'today': isWithinTimeframe = orderDate >= today; break;
        case 'week': isWithinTimeframe = orderDate >= weekAgo; break;
        case 'month': isWithinTimeframe = orderDate >= monthStart; break;
        case 'quarter': isWithinTimeframe = orderDate >= quarterAgo; break;
        case 'semester': isWithinTimeframe = orderDate >= semesterAgo; break;
        default: isWithinTimeframe = true;
      }

      if (isWithinTimeframe && order.status === 'Finalizado') {
        totalRevenue += parseFloat(order.total) || 0;
        orderCount += 1;
        
        // Mapeamento dinâmico de métodos de pagamento
        const method = order.payment_method || order.payment?.method || 'pix';
        const normalizedMethod = method.includes('cartao') || method.includes('credit') || method.includes('debit') ? 'cartao' : method;
        
        if (paymentMethods[normalizedMethod]) {
          paymentMethods[normalizedMethod].count += 1;
          paymentMethods[normalizedMethod].total += parseFloat(order.total) || 0;
        }

        // Vendas por produto
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach(item => {
            const prodId = item.product_id || item.id;
            if (prodId) {
              if (!productSales[prodId]) {
                productSales[prodId] = { 
                  name: item.product_name || item.name || 'Produto Indefinido', 
                  count: 0, 
                  revenue: 0 
                };
              }
              productSales[prodId].count += parseFloat(item.quantity) || 0;
              productSales[prodId].revenue += (parseFloat(item.unit_price || item.price) * parseFloat(item.quantity)) || 0;
            }
          });
        }
      }
    });

    const sortedProducts = Object.values(productSales).sort((a, b) => b.count - a.count);
    // Encontrar produto campeão do período
    const topProduct = sortedProducts[0] || null;

    const timeframeLabels = {
      today: 'Hoje',
      week: 'Últimos 7 Dias',
      month: 'Este Mês',
      quarter: 'Último Trimestre',
      semester: 'Último Semestre'
    };

    // Ticket Médio
    const averageTicket = orderCount > 0 ? totalRevenue / orderCount : 0;

    return {
      totalRevenue,
      orderCount,
      topProduct,
      allSales: sortedProducts,
      averageTicket,
      paymentMethods: Object.values(paymentMethods).sort((a, b) => b.total - a.total),
      timeframeLabel: timeframeLabels[timeframe]
    };
  }, [orders, products, timeframe]);

  // Alertas de Estoque Crítico (Produtos cujo stock <= min_stock)
  const criticalStockItems = useMemo(() => {
    return products.filter(p => p.stock <= p.min_stock);
  }, [products]);

  // Feed em Tempo Real: últimos 5 pedidos fechados
  const recentOrders = useMemo(() => {
    return orders
      .filter(o => o.status === 'Finalizado')
      .slice(0, 5);
  }, [orders]);

  return (
    <div className="min-h-screen bg-[#060606] text-gray-100 p-4 md:p-8 lg:p-12 font-sans overflow-x-hidden">
      
      {/* Editorial Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-[#141414] pb-6 mb-10 gap-6">
        <div>
          <div className="flex items-center gap-3">
            <p className="text-brand font-bold tracking-[0.25em] uppercase text-[10px] flex items-center gap-1.5 bg-brand/5 border border-brand/20 px-3 py-1 rounded-full">
              <Flame size={12} className="animate-pulse" /> Live Operations
            </p>
            {/* Status Sincronização */}
            <span className="flex items-center gap-1.5 text-[9px] text-gray-500 font-mono">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
              Supabase Sync Ativo
            </span>
          </div>
          <h1 className="text-white font-serif text-3xl md:text-5xl leading-none mt-4 tracking-wide">
            The<span className="italic text-brand font-light"> Roast</span> Room.
          </h1>
          <p className="text-xs text-gray-500 mt-2 font-serif italic">Painel Executivo de Gestão de Vendas & Insumos</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Dropdown de Intervalo de Tempo */}
          <div className="relative group">
            <select 
              value={timeframe} 
              onChange={(e) => setTimeframe(e.target.value)}
              className="appearance-none bg-[#121212] border border-gray-900 text-white text-[10px] tracking-widest uppercase font-bold py-3 pl-4 pr-10 rounded-xl cursor-pointer focus:outline-none focus:border-brand transition-colors"
            >
              <option value="today">Operação de Hoje</option>
              <option value="week">Últimos 7 Dias</option>
              <option value="month">Performance Mensal</option>
              <option value="quarter">Trimestral</option>
              <option value="semester">Semestral</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-brand">
              <ChevronDown size={14} />
            </div>
          </div>
        </div>
      </header>

      {/* Alertas Críticos de Estoque Mínimo */}
      <AnimatePresence>
        {criticalStockItems.length > 0 && (
          <motion.section 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-10 space-y-3"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-red-400 uppercase tracking-wider">
              <AlertOctagon size={14} className="text-red-500" />
              Insumos Abaixo do Limite de Segurança ({criticalStockItems.length})
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {criticalStockItems.map(item => (
                <div 
                  key={item.id} 
                  className="bg-red-950/10 border border-red-500/20 rounded-xl p-4 flex justify-between items-center relative overflow-hidden group shadow-lg"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-transparent pointer-events-none" />
                  <div>
                    <h4 className="text-xs font-semibold text-gray-200">{item.name}</h4>
                    <p className="text-[10px] text-gray-500 font-mono mt-1">Limite Segurança: {item.min_stock} {item.unit_type === 'kg' ? 'kg' : 'un'}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-mono font-bold text-red-400 animate-pulse">
                      {item.stock} {item.unit_type === 'kg' ? 'kg' : 'un'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Hero Metrics (Editorial Style Layout) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
        
        {/* Card Faturamento Gigante */}
        <div className="lg:col-span-8 bg-[#121212] border border-[#1b1b1b] rounded-2xl relative overflow-hidden group min-h-[380px] flex flex-col justify-between p-8 md:p-12 shadow-xl">
          {/* Efeitos visuais luxuosos */}
          <div className="absolute inset-0 bg-black/45 z-10" />
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-25 grayscale group-hover:scale-102 transition-transform duration-1000" 
            style={{ backgroundImage: `url(${FALLBACK_IMG})` }} 
          />
          
          <div className="relative z-20 flex justify-between items-start w-full">
            <div>
              <p className="text-gray-400 tracking-[0.2em] text-[10px] font-bold uppercase">Volume Total de Vendas ({stats.timeframeLabel})</p>
              <span className="text-xs font-mono text-brand font-bold bg-brand/10 border border-brand/20 px-2.5 py-0.5 rounded mt-2 inline-block">
                {stats.orderCount} TICKETS PROCESSADOS
              </span>
            </div>
            <Activity className="text-brand animate-pulse" size={20} />
          </div>

          <div className="relative z-20 my-auto pt-8">
            <div className="flex items-baseline gap-2 md:gap-4">
              <span className="text-brand text-2xl md:text-5xl font-serif">R$</span>
              <h2 className="text-white text-5xl md:text-7xl font-mono font-bold tracking-tight">
                {stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h2>
            </div>
          </div>
          
          <div className="relative z-20 flex items-center gap-4 w-full pt-6 border-t border-white/5">
            <div className="h-[1px] bg-brand flex-1" />
            <span className="text-brand-light text-[9px] font-bold tracking-widest uppercase font-mono">Atualizado em Tempo Real</span>
          </div>
        </div>

        {/* Informações de Apoio Lateral (Ticket Médio e Campeão de Vendas) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Card Ticket Médio */}
          <div className="bg-[#121212] border border-[#1b1b1b] rounded-2xl p-6 flex flex-col justify-between flex-1 shadow-lg">
            <div>
              <p className="text-gray-500 tracking-[0.15em] text-[9px] font-bold uppercase mb-2">Ticket Médio por Venda</p>
              <div className="flex items-baseline gap-1.5 mt-4">
                <span className="text-gray-400 text-lg font-serif">R$</span>
                <span className="text-3xl font-mono font-bold text-white tracking-tight">
                  {stats.averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            <div className="border-t border-[#1a1a1a] pt-4 mt-6 flex justify-between items-center text-[10px] text-gray-500">
              <span className="font-mono">Fórmula: Receita / Qtd Pedidos</span>
              <TrendingUp className="text-brand" size={14} />
            </div>
          </div>

          {/* Card Campeão de Vendas */}
          <div className="bg-[#121212] border border-[#1b1b1b] rounded-2xl p-6 flex flex-col justify-between flex-1 shadow-lg">
            <div>
              <p className="text-gray-500 tracking-[0.15em] text-[9px] font-bold uppercase mb-4">Campeão do Período</p>
              {stats.topProduct ? (
                <div>
                  <h4 className="text-white font-serif text-lg leading-tight">{stats.topProduct.name}</h4>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs text-brand font-mono font-bold">
                      {stats.topProduct.count.toFixed(1)} {stats.topProduct.name.toLowerCase().includes('(kg)') ? 'kg' : 'un'} vendidos
                    </span>
                    <span className="text-xs text-gray-400 font-mono">
                      R$ {stats.topProduct.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-600 font-light italic">Aguardando novos registros...</p>
              )}
            </div>
            <div className="border-t border-[#1a1a1a] pt-4 mt-4 flex justify-between items-end">
              <span className="text-[9px] text-gray-600 uppercase tracking-widest font-mono">Item mais pedido</span>
              <ArrowRight className="text-gray-700 hover:text-white transition-colors cursor-pointer" size={16} />
            </div>
          </div>

        </div>
      </section>

      {/* Dinâmica Secundária: Métodos de Pagamento e Feed ao Vivo */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Fluxo de Pagamento */}
        <div className="bg-[#121212] border border-[#1b1b1b] rounded-2xl p-6 lg:col-span-1 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#181818] mb-6">
              <h3 className="text-base text-white font-serif tracking-wide flex items-center gap-2">
                <Activity size={15} className="text-brand" /> Métodos de Pagamento
              </h3>
            </div>

            <div className="space-y-4">
              {stats.paymentMethods.map((method, i) => {
                const percent = stats.totalRevenue > 0 ? (method.total / stats.totalRevenue) * 100 : 0;
                
                return (
                  <div key={i} className="group cursor-default">
                    <div className="flex justify-between items-end mb-1">
                      <div>
                        <p className="text-xs font-semibold text-gray-200 group-hover:text-brand transition-colors flex items-center gap-2">
                          {method.label}
                          <span className="text-[9px] text-gray-500 font-mono bg-[#161616] px-1.5 py-0.5 rounded border border-gray-900">{percent.toFixed(1)}%</span>
                        </p>
                        <p className="text-[9px] text-gray-600 uppercase tracking-widest font-mono mt-0.5">{method.count} tickets</p>
                      </div>
                      <p className="font-mono text-sm font-bold text-white">
                        R$ {method.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="w-full h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 0.8 }}
                        className="h-full bg-brand rounded-full" 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <button className="mt-8 text-[10px] font-bold uppercase tracking-widest text-brand hover:text-white transition-colors flex items-center gap-2 border border-brand/20 bg-brand/5 py-2.5 rounded-lg justify-center hover:bg-brand/10">
            Baixar Extratos Administrativos <ArrowRight size={12} />
          </button>
        </div>

        {/* Feed de Operação ao Vivo (Live Operations Feed) */}
        <div className="bg-[#121212] border border-[#1b1b1b] rounded-2xl p-6 lg:col-span-2 shadow-lg flex flex-col h-[400px] overflow-hidden">
          <div className="flex justify-between items-center pb-4 border-b border-[#181818] mb-4 shrink-0">
            <h3 className="text-base text-white font-serif tracking-wide flex items-center gap-2">
              <ShoppingBag size={15} className="text-brand" /> Atividades Recentes do Caixa
            </h3>
            <span className="text-[9px] bg-brand/10 border border-brand/20 text-brand px-3 py-1 rounded-full font-mono uppercase tracking-wider animate-pulse flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-brand"></span>
              Live Feed
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1 -mr-2 custom-scrollbar">
            <AnimatePresence initial={false}>
              {recentOrders.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center">
                  <RefreshCw className="text-gray-800 animate-spin mb-2" size={20} />
                  <p className="text-gray-600 text-xs font-light italic">Aguardando novos tickets do caixa...</p>
                </div>
              ) : (
                recentOrders.map((order) => {
                  const dateObj = new Date(order.date);
                  const formattedTime = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                  
                  return (
                    <motion.div 
                      key={order.db_id || order.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      className="p-3.5 bg-[#0a0a0a] border border-[#1b1b1b] rounded-xl hover:border-gray-800 transition-colors flex justify-between items-center"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-brand/5 border border-brand/20 p-2.5 rounded-lg text-brand shrink-0">
                          <Flame size={16} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-white font-bold">{order.id}</span>
                            <span className="text-[9px] text-gray-500 font-mono bg-[#121212] px-2 py-0.5 rounded border border-gray-900">{formattedTime}</span>
                          </div>
                          <p className="text-[10px] text-gray-400 mt-1 font-serif">Cliente: {order.customer_name || 'Balcão / Anônimo'}</p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-xs text-gray-600 font-mono">Total Pago</p>
                        <p className="text-sm font-mono font-bold text-white">
                          R$ {parseFloat(order.total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </div>

      </section>

    </div>
  );
}
