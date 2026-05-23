import React, { useState } from 'react';
import { AlertTriangle, Package, Check, Save, History, Plus, Search, Layers } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import Button from '../../components/shared/Button';

export default function InventoryPage() {
    const { products, inventoryLogs, updateProductStock } = useStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [adjModal, setAdjModal] = useState({ open: false, product: null, amount: '', reason: '' });

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.barcode && p.barcode.includes(searchTerm))
    );

    const handleAdjSubmit = (e) => {
        e.preventDefault();
        if (!adjModal.product) return;
        const newStock = adjModal.product.stock + parseFloat(adjModal.amount);
        updateProductStock(adjModal.product.id, newStock, adjModal.reason);
        setAdjModal({ open: false, product: null, amount: '', reason: '' });
    };

    return (
        <div className="space-y-8 pb-10 text-text-primary">
            <header className="flex justify-between items-end mb-10 relative">
                <div className="absolute top-0 left-0 w-32 h-32 bg-brand/10 rounded-full blur-[60px] -z-10 pointer-events-none"></div>
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-brand/10 rounded-xl border border-brand/20">
                        <Layers size={32} className="text-brand" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-white uppercase tracking-wide">Gestão de Estoque</h1>
                        <p className="text-text-muted font-medium italic mt-1 text-sm">Controle preciso de insumos e produtos</p>
                    </div>
                </div>
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar produto ou código..."
                        className="pl-12 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl focus:border-brand focus:ring-2 focus:ring-brand/20 text-white outline-none w-72 transition-all duration-300 shadow-lg placeholder:text-text-muted/50"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Products Table */}
                <div className="xl:col-span-2 space-y-4">
                    <div className="bg-[#1A1A1A]/60 backdrop-blur-md rounded-2xl shadow-2xl shadow-black/20 border border-white/5 overflow-hidden relative z-0">
                        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none -z-10"></div>
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-black/40 border-b border-white/10">
                                    <tr>
                                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-text-muted">Produto</th>
                                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-text-muted text-center">Tipo</th>
                                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-text-muted text-center">Atual</th>
                                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-text-muted text-center">Status</th>
                                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-text-muted text-right">Ação</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredProducts.map(product => {
                                        const isLow = product.stock <= product.minStock;
                                        return (
                                            <tr key={product.id} className={`group hover:bg-white/5 transition-all duration-300 ${isLow ? 'bg-danger/5 hover:bg-danger/10' : ''}`}>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-12 w-12 rounded-xl bg-black/40 overflow-hidden border border-white/10 flex-shrink-0">
                                                            <img src={product.image || 'https://via.placeholder.com/48?text=S/I'} alt="" className="h-full w-full object-cover opacity-80" />
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-white uppercase text-sm tracking-tight">{product.name}</div>
                                                            <div className="text-[10px] text-text-muted font-mono mt-1">
                                                                Mín: <span className="text-text-secondary">{product.minStock} {product.unit_type === 'kg' ? 'kg' : 'uni'}</span> 
                                                                {product.barcode && <span className="ml-2">| Cód: {product.barcode}</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider bg-black/40 border border-white/10 text-text-secondary px-3 py-1.5 rounded-md">
                                                        {product.unit_type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`font-mono font-black text-xl ${isLow ? 'text-danger' : 'text-white'}`}>
                                                        {product.unit_type === 'kg' ? product.stock.toFixed(3) : product.stock}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {isLow ? (
                                                        <span className="inline-flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-danger bg-danger/10 border border-danger/30 shadow-[0_0_15px_rgba(239,68,68,0.2)] px-3 py-1.5 rounded-full w-28">
                                                            <AlertTriangle size={12} /> Crítico
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-success bg-success/10 border border-success/30 shadow-[0_0_15px_rgba(34,197,94,0.1)] px-3 py-1.5 rounded-full w-28">
                                                            <Check size={12} /> Normal
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => setAdjModal({ open: true, product, amount: '', reason: '' })}
                                                        className="p-2.5 bg-black/40 hover:bg-brand/20 text-text-secondary hover:text-white border border-transparent hover:border-brand/50 rounded-xl transition-all duration-300 hover:shadow-[0_0_15px_rgba(209,103,42,0.3)]"
                                                        title="Ajuste Manual"
                                                    >
                                                        <Plus size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filteredProducts.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-12 text-center text-text-muted italic">
                                                Nenhum produto encontrado na busca.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* History Sidebar */}
                <div className="bg-[#1A1A1A]/60 backdrop-blur-md rounded-2xl p-6 border border-white/5 shadow-2xl shadow-black/20 h-fit sticky top-8 relative z-0 overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-brand/5 rounded-full blur-[60px] -z-10 pointer-events-none"></div>
                    <h2 className="text-lg font-serif font-bold uppercase tracking-widest mb-6 flex items-center gap-3 text-white border-b border-white/10 pb-4 relative z-10">
                        <History size={20} className="text-brand" /> Histórico
                    </h2>
                    <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar relative z-10">
                        {inventoryLogs.slice(0, 20).map(log => {
                            const product = products.find(p => p.id === log.productId) || { name: 'Desconhecido', unit_type: 'unit' };
                            const isSale = log.type === 'sale';
                            const isPositive = log.changeAmount > 0;
                            return (
                                <div key={log.id} className="border-l-2 border-white/10 pl-4 py-1 relative group hover:border-brand/50 transition-colors">
                                    <div className={`absolute -left-[5px] top-2 h-2 w-2 rounded-full ${isSale ? 'bg-text-muted' : (isPositive ? 'bg-success' : 'bg-brand')}`} />
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                                                {new Date(log.createdAt || log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • <span className={isSale ? 'text-text-muted' : 'text-brand-light'}>{log.type === 'sale' ? 'VENDA' : 'AJUSTE'}</span>
                                            </div>
                                            <div className="font-bold text-sm text-white uppercase tracking-tight mt-1 truncate max-w-[150px]" title={product.name}>{product.name}</div>
                                            {log.reason && <div className="text-[10px] text-text-secondary mt-1 italic">{log.reason}</div>}
                                        </div>
                                        <div className={`font-mono font-black text-sm px-2 py-1 rounded bg-black/40 border border-white/10 shadow-sm ${isPositive ? 'text-success' : 'text-brand'}`}>
                                            {isPositive ? '+' : ''}{log.changeAmount.toFixed(product.unit_type === 'kg' ? 3 : 0)}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {inventoryLogs.length === 0 && (
                            <p className="text-text-muted italic text-center py-4">Nenhum evento registrado.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Adjustment Modal */}
            {adjModal.open && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-lg flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
                    <div className="bg-[#111111]/90 backdrop-blur-xl rounded-2xl w-full max-w-md overflow-hidden shadow-2xl shadow-black border border-white/10 scale-in-center relative z-0">
                        <div className="absolute inset-0 bg-gradient-to-b from-brand/5 to-transparent pointer-events-none -z-10"></div>
                        <div className="bg-black/40 p-6 border-b border-white/5 relative">
                            <div className="flex justify-between items-center relative z-10">
                                <h3 className="text-xl font-serif font-bold text-white tracking-wide uppercase">Ajuste de Estoque</h3>
                                <div className="h-10 w-10 bg-black/50 rounded-lg border border-white/10 flex items-center justify-center flex-shrink-0">
                                    <img src={adjModal.product?.image || 'https://via.placeholder.com/40'} alt="" className="h-8 w-8 object-cover rounded opacity-80" />
                                </div>
                            </div>
                            <p className="text-text-secondary text-xs mt-2 uppercase font-mono tracking-widest">
                                PRODUTO: <span className="text-brand-light font-bold">{adjModal.product?.name}</span>
                            </p>
                        </div>
                        <form onSubmit={handleAdjSubmit} className="p-6 space-y-6">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">Quantidade da Mudança</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        step="0.001"
                                        required
                                        placeholder="Ex: -2.5 ou +10"
                                        className="w-full text-2xl font-black font-mono p-4 bg-black/40 border border-white/10 rounded-xl focus:border-brand focus:ring-2 focus:ring-brand/20 text-white outline-none transition-all duration-300 placeholder:text-text-muted/30"
                                        value={adjModal.amount}
                                        onChange={e => setAdjModal({ ...adjModal, amount: e.target.value })}
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted font-black uppercase text-sm">
                                        {adjModal.product?.unit_type}
                                    </div>
                                </div>
                                <p className="text-[10px] text-text-muted mt-2 italic flex items-center gap-1">
                                    <AlertTriangle size={10} className="text-brand" /> Negativo (-) p/ saídas, Positivo (+) p/ entradas.
                                </p>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">Motivo / Observação</label>
                                <input
                                    placeholder="Ex: Quebra, Devolução, etc."
                                    className="w-full p-4 bg-black/40 border border-white/10 rounded-xl focus:border-brand focus:ring-2 focus:ring-brand/20 text-white outline-none transition-all duration-300 placeholder:text-text-muted/50"
                                    value={adjModal.reason}
                                    onChange={e => setAdjModal({ ...adjModal, reason: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="flex gap-4 pt-6 mt-2 border-t border-white/5 relative z-10">
                                <Button variant="secondary" className="flex-1 bg-black/40 border border-white/10 text-text-secondary hover:text-white transition-all duration-300" onClick={() => setAdjModal({ open: false, product: null, amount: '', reason: '' })}>Cancelar</Button>
                                <Button variant="primary" className="flex-1 shadow-[0_0_15px_rgba(209,103,42,0.3)] hover:shadow-[0_0_25px_rgba(209,103,42,0.5)] transition-all duration-300" type="submit">Confirmar Ajuste</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
