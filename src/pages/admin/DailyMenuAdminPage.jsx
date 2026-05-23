import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import Button from '../../components/shared/Button';
import { Save, CalendarDays, Plus, Trash2 } from 'lucide-react';

export default function DailyMenuAdminPage() {
    const { dailyMenus, updateDailyMenus } = useStore();
    
    // We clone the global state into a local editing state to avoid mutating global until "Save"
    const [localMenus, setLocalMenus] = useState(null);
    const [activeTab, setActiveTab] = useState(2); // Start on Terça (2)
    
    useEffect(() => {
        if (dailyMenus) {
            // Deep clone to safely edit
            setLocalMenus(JSON.parse(JSON.stringify(dailyMenus)));
        }
    }, [dailyMenus]);

    if (!localMenus) return <div>Carregando...</div>;

    const handleSave = () => {
        updateDailyMenus(localMenus);
        alert('Cardápio do dia salvo com sucesso!');
    };

    const updateItem = (dayId, category, index, field, value) => {
        const newData = { ...localMenus };
        newData[dayId][category][index][field] = value;
        setLocalMenus(newData);
    };

    const updateField = (dayId, field, value) => {
        const newData = { ...localMenus };
        newData[dayId][field] = value;
        setLocalMenus(newData);
    };

    const addItem = (dayId, category) => {
        const newData = { ...localMenus };
        if (!newData[dayId][category]) newData[dayId][category] = [];
        newData[dayId][category].push({ name: '', price: '' });
        setLocalMenus(newData);
    };

    const removeItem = (dayId, category, index) => {
        const newData = { ...localMenus };
        newData[dayId][category].splice(index, 1);
        setLocalMenus(newData);
    };

    const currentMenu = localMenus[activeTab];

    const inputClasses = "w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all duration-300 text-sm placeholder:text-text-muted/50";
    const labelClasses = "block mb-2 text-[10px] font-black tracking-widest uppercase text-text-muted";
    const sectionClasses = "bg-[#1A1A1A]/60 backdrop-blur-md p-6 sm:p-8 rounded-2xl border border-white/5 mb-8 shadow-xl shadow-black/20 relative z-0 overflow-hidden";
    const sectionTitleClasses = "font-serif text-xl border-b border-white/10 pb-3 mb-6 text-brand tracking-wide relative z-10";

    const renderEditableList = (listName, title) => {
        if (!currentMenu.hasOwnProperty(listName) && listName !== 'adicionar_depois') return null;
        
        const items = currentMenu[listName] || [];

        return (
            <div className="mb-8">
                <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4 relative z-10">
                    <h3 className="font-bold text-white uppercase tracking-wider text-xs">{title}</h3>
                    <button 
                        onClick={() => addItem(activeTab, listName)}
                        className="text-brand hover:text-white flex items-center gap-1 text-[10px] font-bold bg-brand/10 hover:bg-brand px-3 py-1.5 rounded-lg transition-all duration-300 shadow-sm hover:shadow-[0_0_15px_rgba(209,103,42,0.4)]"
                    >
                        <Plus size={12} /> ADICIONAR
                    </button>
                </div>
                
                {items.length === 0 && <p className="text-text-muted text-sm italic">Nenhum item adicionado.</p>}
                
                <div className="space-y-2">
                    {items.map((item, idx) => (
                        <div key={idx} className="flex gap-1 sm:gap-2 items-center">
                            <input 
                                type="text"
                                value={item.name}
                                onChange={(e) => updateItem(activeTab, listName, idx, 'name', e.target.value)}
                                className={`${inputClasses} flex-1 min-w-0`}
                                placeholder="Nome do prato"
                            />
                            <div className="flex items-center gap-1 w-24 sm:w-28 shrink-0">
                                <span className="text-text-muted text-[10px] sm:text-xs">R$</span>
                                <input 
                                    type="text"
                                    value={item.price}
                                    onChange={(e) => updateItem(activeTab, listName, idx, 'price', e.target.value)}
                                    className={`${inputClasses} px-2`}
                                    placeholder="00,00"
                                />
                            </div>
                            <button 
                                onClick={() => removeItem(activeTab, listName, idx)}
                                className="text-danger/60 hover:text-danger p-2 bg-black/40 hover:bg-danger/10 border border-transparent hover:border-danger/30 rounded-xl transition-all duration-300 shrink-0 hover:shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                                title="Remover item"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-5xl text-text-primary pb-20">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 pb-6 border-b border-white/10 gap-4 relative">
                <div className="absolute top-0 left-0 w-32 h-32 bg-brand/10 rounded-full blur-[60px] -z-10 pointer-events-none"></div>
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-brand/10 rounded-xl border border-brand/20">
                        <CalendarDays size={28} className="text-brand" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-white uppercase tracking-wide">Cardápio Diário</h1>
                        <p className="text-text-muted font-medium italic mt-1 text-sm">Organize as marmitas de cada dia</p>
                    </div>
                </div>
                <Button variant="primary" onClick={handleSave} className="flex items-center gap-2 shadow-[0_0_20px_rgba(209,103,42,0.3)] hover:shadow-[0_0_30px_rgba(209,103,42,0.5)] transition-all duration-300 text-sm py-2.5 px-6 w-full sm:w-auto justify-center">
                    <Save size={18} /> Salvar Alterações
                </Button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-8 flex-wrap p-1.5 bg-black/40 backdrop-blur-md rounded-xl border border-white/5 shadow-inner">
                {[2, 3, 4, 5, 6, 0].map(day => {
                    const isActive = activeTab === day;
                    return (
                        <button
                            key={day}
                            onClick={() => setActiveTab(day)}
                            className={`px-4 py-2.5 rounded-lg text-[10px] sm:text-xs font-bold tracking-widest uppercase transition-all duration-300 whitespace-nowrap flex-1 text-center ${
                                isActive 
                                    ? 'bg-brand text-white shadow-[0_0_15px_rgba(209,103,42,0.4)] scale-[1.02]' 
                                    : 'bg-transparent text-text-secondary hover:text-white hover:bg-white/5'
                            }`}
                        >
                            {localMenus[day].name}
                        </button>
                    )
                })}
            </div>

            {/* Editor Area */}
            <div className={sectionClasses}>
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 rounded-full blur-[80px] -z-10 pointer-events-none"></div>
                <h2 className={sectionTitleClasses}>Editando: {currentMenu.name}</h2>
                
                {activeTab !== 6 && activeTab !== 0 && (
                    <>
                        {renderEditableList('tradicionais', 'Marmitas Tradicionais')}
                        {renderEditableList('especiais', 'Marmitas Especiais')}
                    </>
                )}
                
                {activeTab === 6 && (
                    <>
                        {renderEditableList('especiais', 'Marmitas Especiais')}
                        
                        <div className="mt-6 pt-6 border-t border-white/10 relative z-10">
                            <label className={labelClasses}>Carnes Assadas (Descrição Geral)</label>
                            <input 
                                type="text"
                                value={currentMenu.carnesAssadas || ''}
                                onChange={(e) => updateField(activeTab, 'carnesAssadas', e.target.value)}
                                className={inputClasses + " mb-3"}
                            />
                            
                            <label className={labelClasses}>Preço do KG (Carnes Assadas)</label>
                            <div className="flex items-center gap-1.5 max-w-[150px]">
                                <span className="text-text-muted text-xs">R$</span>
                                <input 
                                    type="text"
                                    value={currentMenu.precoKg || ''}
                                    onChange={(e) => updateField(activeTab, 'precoKg', e.target.value)}
                                    className={inputClasses}
                                />
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 0 && (
                    <>
                        {renderEditableList('marmitas', 'Marmitas')}
                        
                        <div className="mt-6 pt-6 border-t border-white/10 relative z-10">
                            <label className={labelClasses}>Carnes Assadas (Descrição Geral)</label>
                            <input 
                                type="text"
                                value={currentMenu.carnesAssadas || ''}
                                onChange={(e) => updateField(activeTab, 'carnesAssadas', e.target.value)}
                                className={inputClasses + " mb-3"}
                            />
                            
                            <label className={labelClasses}>Preço do KG (Carnes Assadas)</label>
                            <div className="flex items-center gap-1.5 max-w-[150px] mb-3">
                                <span className="text-text-muted text-xs">R$</span>
                                <input 
                                    type="text"
                                    value={currentMenu.precoKg || ''}
                                    onChange={(e) => updateField(activeTab, 'precoKg', e.target.value)}
                                    className={inputClasses}
                                />
                            </div>

                            <label className={labelClasses}>Preço Frango Assado</label>
                            <div className="flex items-center gap-1.5 max-w-[150px]">
                                <span className="text-text-muted text-xs">R$</span>
                                <input 
                                    type="text"
                                    value={currentMenu.frangoAssado || ''}
                                    onChange={(e) => updateField(activeTab, 'frangoAssado', e.target.value)}
                                    className={inputClasses}
                                />
                            </div>
                        </div>

                        <div className="mt-8 pt-8 border-t border-white/10 relative z-10">
                            {renderEditableList('acompanhamentos', 'Acompanhamentos')}
                        </div>
                    </>
                )}

            </div>
            
            <div className="text-center text-text-muted text-xs mt-8">
                Nota: A exibição de opções e categorias muda de acordo com o padrão do dia selecionado.
            </div>
        </div>
    );
}
