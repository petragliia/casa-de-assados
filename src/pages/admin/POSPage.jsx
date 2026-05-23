import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Minus, 
  CreditCard, 
  Banknote, 
  QrCode, 
  Edit, 
  User, 
  FileText, 
  CheckCircle2, 
  Loader2, 
  ShoppingCart, 
  X, 
  Search, 
  Keyboard, 
  Sparkles, 
  Scale, 
  AlertTriangle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../context/StoreContext';

const PLACEHOLDER_IMG = 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&q=80&w=400';

export default function POSPage() {
  const { products, addOrder } = useStore();
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cartao');
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [emitNfce, setEmitNfce] = useState(false);
  const [customerCpf, setCustomerCpf] = useState('');
  const [isProcessingNfce, setIsProcessingNfce] = useState(false);
  const [nfceSuccess, setNfceSuccess] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para Pesagem Dinâmica
  const [weighingProduct, setWeighingProduct] = useState(null);
  const [weightValue, setWeightValue] = useState('');
  
  // Feedback e Toasts
  const [successToast, setSuccessToast] = useState('');
  const [errorToast, setErrorToast] = useState('');
  
  // Referências para Inputs
  const searchInputRef = useRef(null);
  const customerInputRef = useRef(null);
  const weightInputRef = useRef(null);

  // Fechar o carrinho no mobile se a tela aumentar e cruzar o breakpoint
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsCartOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Focar automaticamente no input de busca ao carregar a página
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Focar automaticamente no input de peso quando o modal de pesagem for aberto
  useEffect(() => {
    if (weighingProduct && weightInputRef.current) {
      // Pequeno timeout para garantir renderização completa no DOM
      setTimeout(() => {
        if (weightInputRef.current) {
          weightInputRef.current.focus();
          weightInputRef.current.select();
        }
      }, 50);
    }
  }, [weighingProduct]);

  // Função para adicionar itens ao carrinho (com suporte a KG ou unidade)
  const addToCart = (product, weight = null) => {
    const isKg = product.unit_type === 'kg' || product.name.toLowerCase().includes('(kg)');
    
    // Se o item é de KG e não recebemos o peso, abrimos o Modal de Pesagem
    if (isKg && weight === null) {
      setWeighingProduct(product);
      setWeightValue('');
      return;
    }

    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      const qtyToAdd = weight !== null ? parseFloat(weight) : 1;
      
      if (existing) {
        return prev.map(i => i.id === product.id 
          ? { ...i, quantity: Math.round((i.quantity + qtyToAdd) * 1000) / 1000 } 
          : i
        );
      }
      return [...prev, { ...product, quantity: qtyToAdd }];
    });

    showFeedback(`Adicionado: ${product.name}`);
  };

  // Confirmar pesagem do modal
  const handleConfirmWeight = () => {
    if (!weighingProduct || !weightValue) return;
    const parsedWeight = parseFloat(weightValue.replace(',', '.'));
    
    if (isNaN(parsedWeight) || parsedWeight <= 0) {
      showError('Por favor, digite um peso válido acima de zero.');
      return;
    }

    addToCart(weighingProduct, parsedWeight);
    setWeighingProduct(null);
    setWeightValue('');
    
    // Foca de volta na busca para agilizar próximo item
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const updateQuantity = (id, delta) => {
    setCart(prev => prev.map(i => {
      if (i.id === id) {
        const isKg = i.unit_type === 'kg' || i.name.toLowerCase().includes('(kg)');
        const step = isKg ? 0.1 : 1; // Itens de KG alteram de 100g em 100g
        const newQty = Math.round((i.quantity + (delta * step)) * 1000) / 1000;
        return { ...i, quantity: Math.max(0, newQty) };
      }
      return i;
    }).filter(i => i.quantity > 0));
  };

  const removeCartItem = (id) => {
    setCart(prev => prev.filter(i => i.id !== id));
    showFeedback('Item removido do carrinho');
  };

  // Cálculo de Totais (Tratamento de arredondamento IEEE 754)
  const subtotal = Math.round(cart.reduce((acc, item) => acc + (item.price * item.quantity), 0) * 100) / 100;
  const serviceFee = emitNfce ? 0 : Math.round(subtotal * 0.1 * 100) / 100; // Taxa de 10% opcional (zerada se for cupom fiscal/NFC-e direta)
  const total = Math.round((subtotal + serviceFee) * 100) / 100;

  // Gerenciadores de Toast
  const showFeedback = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 1800);
  };

  const showError = (msg) => {
    setErrorToast(msg);
    setTimeout(() => setErrorToast(''), 2500);
  };

  // Checkout Expresso (< 5 segundos)
  const handleFinalize = async () => {
    if (cart.length === 0) return;

    if (emitNfce) {
      if (customerCpf && customerCpf.length !== 11) {
        showError('CPF inválido! Insira 11 dígitos.');
        return;
      }
      setIsProcessingNfce(true);
      // Simulação de chamada de API para SEFAZ
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsProcessingNfce(false);
      setNfceSuccess(true);
      await new Promise(resolve => setTimeout(resolve, 800));
      setNfceSuccess(false);
    }

    const order = {
      customer: {
        name: customer || 'Balcão / Anônimo',
        phone: 'Presencial',
        address: 'Mesa/Balcão',
        cpf: emitNfce ? customerCpf : null
      },
      items: cart,
      total: total,
      status: 'Finalizado',
      payment: {
        method: paymentMethod,
        change: 0
      },
      type: 'in_person',
      observation: 'Venda Caixa/PDV',
      nfce: emitNfce ? { issued: true, code: Math.floor(Math.random() * 10000000) } : null
    };

    setIsProcessingNfce(true);
    try {
      const savedOrder = await addOrder(order);
      
      if (savedOrder) {
        showFeedback(emitNfce ? 'NFC-e Emitida e Venda Processada!' : 'Venda Concluída com Sucesso!');
        setCart([]);
        setCustomer('');
        setCustomerCpf('');
        setEmitNfce(false);
        setIsCartOpen(false);
        setSearchTerm('');
        
        // Retorna o foco instantâneo à pesquisa
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }
    } catch (error) {
      console.error(error);
      showError('Erro ao salvar o pedido.');
    } finally {
      setIsProcessingNfce(false);
    }
  };

  // Lógica Global de Teclado (F1-F6 + Numpad)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 1. Tecla ESC: Fecha Modais, Toasts ou limpa busca
      if (e.key === 'Escape') {
        if (weighingProduct) {
          setWeighingProduct(null);
          setWeightValue('');
          e.preventDefault();
          if (searchInputRef.current) searchInputRef.current.focus();
        } else if (isCartOpen) {
          setIsCartOpen(false);
          e.preventDefault();
        } else if (searchTerm) {
          setSearchTerm('');
          e.preventDefault();
        }
        return;
      }

      // 2. ENTER no Modal de Pesagem
      if (weighingProduct && e.key === 'Enter') {
        handleConfirmWeight();
        e.preventDefault();
        return;
      }

      // Evita atalhos se o foco estiver em campos de texto normais (exceto Enter/ESC)
      const activeEl = document.activeElement;
      const isInput = activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA';
      
      if (weighingProduct) return; // Se estiver pesando, suspende outros atalhos

      if (e.key === 'F1') {
        e.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          searchInputRef.current.select();
        }
      } else if (e.key === 'F2') {
        e.preventDefault();
        if (customerInputRef.current) {
          customerInputRef.current.focus();
          customerInputRef.current.select();
        }
      } else if (e.key === 'F3') {
        e.preventDefault();
        setEmitNfce(prev => !prev);
      } else if (e.key === 'F4') {
        e.preventDefault();
        setPaymentMethod('dinheiro');
      } else if (e.key === 'F5') {
        e.preventDefault();
        setPaymentMethod('cartao');
      } else if (e.key === 'F6') {
        e.preventDefault();
        setPaymentMethod('pix');
      } else if (e.key === 'Enter') {
        // Apenas fecha o pedido se não estiver digitando em inputs
        if (!isInput && cart.length > 0 && !isProcessingNfce && !nfceSuccess) {
          e.preventDefault();
          handleFinalize();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [weighingProduct, weightValue, cart, isCartOpen, searchTerm, isProcessingNfce, nfceSuccess, customer, customerCpf, emitNfce, paymentMethod]);

  const categories = ['Todos', 'Assados', 'Acompanhamentos', 'Marmita', 'Bebidas'];
  
  // Filtro inteligente de categorias e busca por texto/código
  const filteredProducts = products.filter(p => {
    const matchesCategory = activeCategory === 'Todos' || p.category === activeCategory;
    const cleanSearch = searchTerm.toLowerCase().trim();
    const matchesSearch = !cleanSearch || 
                          p.name.toLowerCase().includes(cleanSearch) ||
                          (p.barcode && p.barcode.includes(cleanSearch)) ||
                          (p.id && String(p.id).includes(cleanSearch)) ||
                          (p.description && p.description.toLowerCase().includes(cleanSearch));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex h-screen w-screen bg-[#0a0a0a] text-gray-100 overflow-hidden font-sans select-none relative">
      
      {/* AREA ESQUERDA: Grade de Produtos e Filtros */}
      <div className="flex-1 flex flex-col pt-4 md:pt-6 px-4 md:px-8 border-r border-[#161616] overflow-hidden w-full">
        
        {/* Header Options */}
        <div className="flex flex-col mb-4 gap-3 w-full shrink-0">
          <div className="flex items-center justify-between w-full">
            <h1 className="text-xl md:text-2xl font-serif text-white tracking-wide flex items-center gap-3">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
              PDV / Frente de Caixa
              <span className="text-[10px] text-gray-500 font-mono hidden sm:inline">V1.2</span>
            </h1>
            <div className="flex gap-2">
              <button 
                className="md:hidden flex items-center gap-2 bg-brand text-background px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest shadow-lg shadow-brand/10 transition-colors"
                onClick={() => setIsCartOpen(true)}
              >
                <ShoppingCart size={15} />
                <span className="bg-background/20 px-1.5 py-0.5 rounded ml-1 font-mono">{cart.length}</span>
              </button>
            </div>
          </div>
          
          {/* Barra de Busca de Alta Fidelidade [F1] */}
          <div className="relative w-full">
            <input 
              ref={searchInputRef}
              id="product-search"
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="[F1] Pesquisar por Nome, Categoria, ID ou Código de Barras..."
              className="w-full bg-[#121212] border border-[#222] hover:border-gray-800 rounded-xl pl-12 pr-16 py-3.5 text-sm text-white font-mono placeholder:text-gray-600 focus:outline-none focus:border-brand transition-all shadow-inner focus:ring-4 focus:ring-brand/5"
            />
            <div className="absolute left-4 top-4 text-gray-600">
              <Search size={16} />
            </div>
            <div className="absolute right-4 top-3.5 flex items-center gap-1.5">
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="text-gray-500 hover:text-white p-0.5 rounded">
                  <X size={14} />
                </button>
              )}
              <kbd className="bg-[#1f1f1f] text-gray-500 text-[10px] px-2 py-0.5 rounded border border-gray-800 font-mono select-none">F1</kbd>
            </div>
          </div>

          {/* Abas de Categoria */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-[#121212] w-full">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 whitespace-nowrap text-xs font-bold tracking-widest uppercase transition-all rounded-lg border
                  ${activeCategory === cat 
                    ? 'bg-brand border-brand text-background shadow-md shadow-brand/10' 
                    : 'bg-[#121212] border-gray-950 text-gray-400 hover:text-white hover:bg-[#161616]'
                  }
                `}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grade de Produtos */}
        <div className="flex-1 overflow-y-auto pb-24 pr-2 custom-scrollbar">
          {filteredProducts.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center border border-dashed border-[#1a1a1a] rounded-2xl p-6">
              <AlertTriangle className="text-gray-600 mb-2" size={24} />
              <p className="text-gray-500 text-sm font-light italic">Nenhum produto localizado.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map(product => {
                const isKg = product.unit_type === 'kg' || product.name.toLowerCase().includes('(kg)');
                const isOut = product.stock <= 0;
                
                return (
                  <div
                    key={product.id}
                    onClick={() => !isOut && addToCart(product)}
                    className={`bg-[#121212] rounded-xl border transition-all flex flex-col justify-between overflow-hidden group cursor-pointer active:scale-[0.98]
                      ${isOut 
                        ? 'opacity-40 border-transparent cursor-not-allowed' 
                        : 'border-[#1b1b1b] hover:border-brand/40 shadow-sm hover:shadow-lg hover:shadow-brand/5 focus-within:ring-2 focus-within:ring-brand'
                      }
                    `}
                  >
                    {/* Visual Card Top */}
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <span className={`text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded border 
                            ${isKg 
                              ? 'bg-brand/10 border-brand/20 text-brand' 
                              : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                            }
                          `}>
                            {isKg ? 'QUILO (KG)' : 'UNIDADE'}
                          </span>
                          <span className="text-[10px] text-gray-600 font-mono">#{product.barcode || product.id}</span>
                        </div>
                        
                        <h3 className="font-serif text-base font-medium text-white group-hover:text-brand transition-colors line-clamp-1">
                          {product.name}
                        </h3>
                        <p className="text-gray-500 text-xs mt-1 line-clamp-2 min-h-[32px]">
                          {product.description || 'Produto premium com tempero especial da Casa de Assados.'}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-[#181818] flex justify-between items-baseline">
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider font-mono">
                          {isOut ? 'ESGOTADO' : `${product.stock} em estoque`}
                        </span>
                        <div className="text-right">
                          <p className="text-xs text-gray-600">Preço</p>
                          <p className="text-lg font-mono text-white font-bold">
                            R$ {product.price.toFixed(2)}
                            {isKg && <span className="text-xs text-gray-500 font-normal">/kg</span>}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Drawer Backdrop */}
      <AnimatePresence>
        {isCartOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:hidden"
            onClick={() => setIsCartOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ÁREA DIREITA: Carrinho e Checkout Express */}
      <div className={`
        fixed inset-y-0 right-0 z-50 w-full max-w-[420px] bg-[#0e0e0e] flex flex-col shrink-0 shadow-2xl border-l border-[#161616]
        transform transition-transform duration-300 md:relative md:translate-x-0
        ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="p-5 md:p-6 flex-1 flex flex-col overflow-hidden">
          
          {/* Título e Cliente [F2] */}
          <div className="flex justify-between items-start mb-4 relative shrink-0">
            <div>
              <h2 className="text-lg font-serif text-white mb-2">Cupom de Venda</h2>
              
              <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                <User size={13} className="text-gray-600" />
                <input 
                  ref={customerInputRef}
                  id="customer-input"
                  type="text" 
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  placeholder="Cliente / Identificador [F2]"
                  className="bg-transparent border-none outline-none placeholder:text-gray-700 w-36 focus:text-white focus:placeholder:text-gray-500 transition-colors font-mono"
                />
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <button className="md:hidden text-gray-500 hover:text-white" onClick={() => setIsCartOpen(false)}>
                <X size={20} />
              </button>
              <span className="text-[10px] text-gray-600 tracking-widest font-mono">PDV-01</span>
            </div>
          </div>

          {/* Área de Itens do Carrinho */}
          <div className="flex-1 overflow-y-auto pr-1 -mr-2 space-y-3 custom-scrollbar">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center border border-dashed border-[#1a1a1a] rounded-xl p-6">
                <ShoppingCart className="text-gray-800 mb-2" size={32} />
                <p className="text-gray-600 text-xs font-light italic">Nenhum item adicionado ao caixa.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map(item => {
                  const isKg = item.unit_type === 'kg' || item.name.toLowerCase().includes('(kg)');
                  
                  return (
                    <div key={item.id} className="flex gap-3 p-3 bg-[#121212] rounded-xl border border-gray-950 hover:border-gray-900 transition-colors group">
                      <div className="flex-1 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                          <h4 className="text-sm font-medium text-white line-clamp-1">{item.name}</h4>
                          <span className="text-white font-mono font-bold text-sm tracking-tight pl-2">
                            R$ {(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                        
                        {/* Controle de Qtd/Peso */}
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => updateQuantity(item.id, -1)} 
                              className="w-6 h-6 rounded-lg bg-[#181818] hover:bg-[#222] flex items-center justify-center text-gray-500 hover:text-white transition-colors"
                            >
                              <Minus size={11} />
                            </button>
                            <span className="text-xs font-mono font-bold text-gray-200">
                              {isKg ? `${item.quantity.toFixed(3)} kg` : `${item.quantity} un`}
                            </span>
                            <button 
                              onClick={() => updateQuantity(item.id, 1)} 
                              className="w-6 h-6 rounded-lg bg-[#181818] hover:bg-[#222] flex items-center justify-center text-gray-500 hover:text-white transition-colors"
                            >
                              <Plus size={11} />
                            </button>
                          </div>
                          <button 
                            onClick={() => removeCartItem(item.id)}
                            className="text-gray-700 hover:text-red-500 text-[10px] font-bold uppercase tracking-widest transition-colors opacity-0 group-hover:opacity-100"
                          >
                            Excluir
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Painel Inferior de Fechamento */}
        <div className="p-5 md:p-6 border-t border-[#161616] bg-[#0c0c0c] shrink-0">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Subtotal</span>
              <span className="font-mono">R$ {subtotal.toFixed(2)}</span>
            </div>
            {!emitNfce && (
              <div className="flex justify-between text-xs text-gray-500">
                <span>Taxa de Serv. (10%)</span>
                <span className="font-mono">R$ {serviceFee.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-2xl font-serif text-white pt-2 border-t border-[#181818]">
              <span>Total</span>
              <span className="text-brand font-mono font-bold tracking-tight">R$ {total.toFixed(2)}</span>
            </div>
          </div>

          <p className="text-[9px] text-gray-600 uppercase tracking-widest font-bold mb-2">Método de Pagamento [F4 - F6]</p>
          
          <div className="grid grid-cols-3 gap-2 mb-4">
            <button 
              onClick={() => setPaymentMethod('dinheiro')}
              className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-lg border transition-all active:scale-95
                ${paymentMethod === 'dinheiro' 
                  ? 'bg-brand/10 border-brand/50 text-brand shadow-lg shadow-brand/5' 
                  : 'bg-[#121212] border-transparent text-gray-500 hover:text-gray-300'
                }
              `}
            >
              <Banknote size={16} />
              <span className="text-[9px] font-bold tracking-widest uppercase">DINHEIRO</span>
            </button>
            <button 
              onClick={() => setPaymentMethod('cartao')}
              className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-lg border transition-all active:scale-95
                ${paymentMethod === 'cartao' 
                  ? 'bg-brand/10 border-brand/50 text-brand shadow-lg shadow-brand/5' 
                  : 'bg-[#121212] border-transparent text-gray-500 hover:text-gray-300'
                }
              `}
            >
              <CreditCard size={16} />
              <span className="text-[9px] font-bold tracking-widest uppercase">CARTÃO</span>
            </button>
            <button 
              onClick={() => setPaymentMethod('pix')}
              className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-lg border transition-all active:scale-95
                ${paymentMethod === 'pix' 
                  ? 'bg-brand/10 border-brand/50 text-brand shadow-lg shadow-brand/5' 
                  : 'bg-[#121212] border-transparent text-gray-500 hover:text-gray-300'
                }
              `}
            >
              <QrCode size={16} />
              <span className="text-[9px] font-bold tracking-widest uppercase">PIX</span>
            </button>
          </div>

          {/* Switch de NFC-e com CPF */}
          <div className="mb-4 bg-[#121212] p-3 rounded-lg border border-[#1d1d1d]">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs font-semibold text-gray-300 flex items-center gap-2">
                <FileText size={14} className={emitNfce ? "text-brand" : "text-gray-600"}/> 
                Emitir NFC-e [F3]
              </span>
              <input 
                type="checkbox" 
                checked={emitNfce}
                onChange={(e) => setEmitNfce(e.target.checked)}
                className="w-4 h-4 accent-brand bg-background border-surface-light rounded cursor-pointer"
              />
            </label>
            
            <AnimatePresence>
              {emitNfce && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 pt-3 border-t border-[#181818] overflow-hidden"
                >
                  <input 
                    type="text" 
                    value={customerCpf}
                    onChange={(e) => setCustomerCpf(e.target.value.replace(/\D/g, ''))}
                    placeholder="CPF na Nota (11 dígitos)"
                    maxLength="11"
                    className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg p-2.5 text-xs text-white font-mono placeholder:text-gray-600 outline-none focus:border-brand transition-colors"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Botão Finalizar Master */}
          <button
            onClick={handleFinalize}
            disabled={cart.length === 0 || isProcessingNfce || nfceSuccess}
            className={`w-full py-4 rounded-xl font-bold tracking-widest uppercase text-xs transition-all flex items-center justify-center gap-2.5 active:scale-98
              ${isProcessingNfce ? 'bg-[#121212] text-brand border border-brand/10 cursor-wait' : ''}
              ${nfceSuccess ? 'bg-emerald-950/20 text-emerald-400 border border-emerald-500/30 cursor-default' : ''}
              ${(!isProcessingNfce && !nfceSuccess && cart.length > 0)
                ? 'bg-brand hover:bg-brand-light text-background shadow-lg shadow-brand/15 hover:shadow-brand/25' 
                : (!isProcessingNfce && !nfceSuccess ? 'bg-[#121212] text-gray-600 cursor-not-allowed border border-transparent' : '')}
            `}
          >
            {isProcessingNfce ? (
              <><Loader2 size={15} className="animate-spin" /> COMUNICANDO SEFAZ...</>
            ) : nfceSuccess ? (
              <><CheckCircle2 size={15} /> NOTA FISCAL EMITIDA!</>
            ) : (
              <>
                <span>FECHAR VENDA</span>
                <kbd className="bg-background/10 px-1.5 py-0.5 rounded text-[9px] font-mono border border-background/10">ENTER</kbd>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* MODAL DE PESAGEM RÁPIDA */}
      <AnimatePresence>
        {weighingProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
              onClick={() => { setWeighingProduct(null); setWeightValue(''); }}
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-[#0e0e0e] border border-brand/35 rounded-2xl shadow-2xl overflow-hidden p-6 md:p-8 space-y-6 z-10"
            >
              <div className="flex justify-between items-start border-b border-[#121212] pb-4">
                <div>
                  <p className="text-[10px] text-brand font-bold tracking-widest uppercase flex items-center gap-1.5">
                    <Scale size={11} /> Pesagem Requerida
                  </p>
                  <h3 className="text-xl md:text-2xl font-serif text-white mt-1">{weighingProduct.name}</h3>
                </div>
                <span className="text-xs font-mono text-gray-400 bg-[#121212] px-3 py-1.5 rounded-lg border border-gray-900">
                  R$ {weighingProduct.price.toFixed(2)} / kg
                </span>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-gray-500 font-mono">Digite o Peso Final (em kg):</label>
                <div className="relative flex items-center">
                  <input 
                    ref={weightInputRef}
                    type="text" 
                    value={weightValue}
                    onChange={(e) => setWeightValue(e.target.value.replace(/[^0-9.,]/g, ''))}
                    placeholder="0.000" 
                    className="w-full bg-[#121212] border-2 border-brand/50 rounded-2xl py-5 pl-6 pr-20 text-4xl md:text-5xl font-mono text-white font-bold placeholder:text-gray-800 outline-none focus:ring-4 focus:ring-brand/5 transition-all text-right"
                  />
                  <span className="absolute right-6 text-xl font-mono text-brand font-bold">KG</span>
                </div>
              </div>

              {/* Cálculo em Tempo Real */}
              <div className="bg-[#121212] rounded-xl p-4 border border-gray-950 flex justify-between items-center">
                <span className="text-xs text-gray-400 font-serif">Valor Total Calculado:</span>
                <div className="text-right">
                  <span className="text-2xl md:text-3xl font-mono font-bold text-white tracking-tight">
                    R$ {(() => {
                      const w = parseFloat(weightValue.replace(',', '.'));
                      if (isNaN(w) || w <= 0) return '0,00';
                      return (weighingProduct.price * w).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    })()}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => { setWeighingProduct(null); setWeightValue(''); if (searchInputRef.current) searchInputRef.current.focus(); }}
                  className="flex-1 py-3.5 bg-[#121212] hover:bg-[#181818] border border-gray-900 text-gray-400 hover:text-white rounded-xl font-bold uppercase tracking-widest text-[10px] transition-colors"
                >
                  [ESC] CANCELAR
                </button>
                <button 
                  onClick={handleConfirmWeight}
                  className="flex-1 py-3.5 bg-brand hover:bg-brand-light text-background rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2"
                >
                  CONFIRMAR <kbd className="bg-background/10 px-1.5 py-0.5 rounded text-[8px] font-mono">ENTER</kbd>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------------------------------------------- */}
      {/* TOASTS E NOTIFICAÇÕES GLOBAIS DE FLUXO */}
      <AnimatePresence>
        {successToast && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 right-6 z-[100] bg-[#121212] border border-brand/40 px-5 py-4 rounded-xl shadow-2xl flex items-center gap-3 backdrop-blur-md"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-brand animate-pulse" />
            <p className="text-sm font-medium text-white">{successToast}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {errorToast && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 right-6 z-[100] bg-red-950/30 border border-red-500/40 px-5 py-4 rounded-xl shadow-2xl flex items-center gap-3 backdrop-blur-md"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <p className="text-sm font-medium text-red-200">{errorToast}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------------------------------------------------- */}
      {/* LEGENDA DE ATALHOS DE TECLADO TRANSLÚCIDA (BARRA FIXA INFERIOR DE FÉ E OPERAÇÃO) */}
      <div className="absolute bottom-0 left-0 right-0 h-14 bg-[#0a0a0a]/90 backdrop-blur-md border-t border-[#121212] flex items-center justify-between px-6 z-30 overflow-x-auto gap-4 shrink-0 select-none">
        <div className="flex items-center gap-1 text-[10px] text-gray-500 uppercase tracking-widest font-bold">
          <Keyboard size={12} className="text-brand mr-1" /> Legenda de Operação:
        </div>
        <div className="flex items-center gap-6 shrink-0 pr-4">
          <div className="flex items-center gap-2"><kbd className="bg-[#121212] border border-[#222] text-brand text-[9px] px-2 py-0.5 rounded font-mono">F1</kbd> <span className="text-[10px] text-gray-400 font-medium">Buscar Itens</span></div>
          <div className="flex items-center gap-2"><kbd className="bg-[#121212] border border-[#222] text-brand text-[9px] px-2 py-0.5 rounded font-mono">F2</kbd> <span className="text-[10px] text-gray-400 font-medium">Identificar Cliente</span></div>
          <div className="flex items-center gap-2"><kbd className="bg-[#121212] border border-[#222] text-brand text-[9px] px-2 py-0.5 rounded font-mono">F3</kbd> <span className="text-[10px] text-gray-400 font-medium">Emitir NFC-e</span></div>
          <div className="flex items-center gap-2"><kbd className="bg-[#121212] border border-[#222] text-brand text-[9px] px-2 py-0.5 rounded font-mono">F4</kbd> <span className="text-[10px] text-gray-400 font-medium">Dinheiro</span></div>
          <div className="flex items-center gap-2"><kbd className="bg-[#121212] border border-[#222] text-brand text-[9px] px-2 py-0.5 rounded font-mono">F5</kbd> <span className="text-[10px] text-gray-400 font-medium">Cartão</span></div>
          <div className="flex items-center gap-2"><kbd className="bg-[#121212] border border-[#222] text-brand text-[9px] px-2 py-0.5 rounded font-mono">F6</kbd> <span className="text-[10px] text-gray-400 font-medium">PIX</span></div>
          <div className="flex items-center gap-2"><kbd className="bg-[#121212] border border-[#222] text-brand text-[9px] px-2 py-0.5 rounded font-mono">ENTER</kbd> <span className="text-[10px] text-gray-400 font-medium">Fechar Caixa</span></div>
          <div className="flex items-center gap-2"><kbd className="bg-[#121212] border border-[#222] text-brand text-[9px] px-2 py-0.5 rounded font-mono">ESC</kbd> <span className="text-[10px] text-gray-400 font-medium">Limpar/Voltar</span></div>
        </div>
      </div>

    </div>
  );
}
