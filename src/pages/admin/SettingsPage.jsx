import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useStore } from '../../context/StoreContext';
import Button from '../../components/shared/Button';
import { Save, Settings as SettingsIcon } from 'lucide-react';

export default function SettingsPage() {
    const { settings, updateSettings } = useStore();
    const { register, handleSubmit, reset, formState: { isDirty } } = useForm({
        defaultValues: settings
    });

    useEffect(() => {
        if (settings) {
            reset(settings);
        }
    }, [settings, reset]);

    const onSubmit = (data) => {
        updateSettings(data);
        alert('Configurações salvas com sucesso!');
    };

    const inputClasses = "w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all duration-300 placeholder:text-text-muted/50";
    const labelClasses = "block mb-2 text-[10px] font-black tracking-widest uppercase text-text-muted";
    const sectionClasses = "bg-[#1A1A1A]/60 backdrop-blur-md p-8 rounded-2xl border border-white/5 shadow-xl shadow-black/20 relative z-0 overflow-hidden";
    const sectionTitleClasses = "font-serif text-xl border-b border-white/10 pb-4 mb-8 text-brand tracking-wide relative z-10";

    return (
        <div className="max-w-4xl text-text-primary">
            <div className="flex items-center gap-4 mb-12 relative">
                <div className="absolute top-0 left-0 w-32 h-32 bg-brand/10 rounded-full blur-[60px] -z-10 pointer-events-none"></div>
                <div className="p-3 bg-brand/10 rounded-xl border border-brand/20">
                    <SettingsIcon size={32} className="text-brand" />
                </div>
                <div>
                    <h1 className="text-3xl font-serif font-bold text-white uppercase tracking-wide">Configurações do Site</h1>
                    <p className="text-text-muted font-medium italic mt-1 text-sm">Ajuste os detalhes gerais da sua loja</p>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

                {/* General Info */}
                <div className={sectionClasses}>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 rounded-full blur-[80px] -z-10 pointer-events-none"></div>
                    <h2 className={sectionTitleClasses}>Informações Gerais</h2>

                    <div>
                        <label className={labelClasses}>Descrição do Rodapé</label>
                        <textarea
                            {...register('description')}
                            rows={3}
                            className={inputClasses}
                        />
                    </div>
                </div>

                {/* Contact */}
                <div className={sectionClasses}>
                    <div className="absolute top-0 left-0 w-64 h-64 bg-brand/5 rounded-full blur-[80px] -z-10 pointer-events-none"></div>
                    <h2 className={sectionTitleClasses}>Contato</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className={labelClasses}>Telefone / WhatsApp</label>
                            <input
                                {...register('contact.phone')}
                                type="text"
                                className={inputClasses}
                            />
                        </div>
                        <div>
                            <label className={labelClasses}>Instagram</label>
                            <input
                                {...register('contact.instagram')}
                                type="text"
                                className={inputClasses}
                            />
                        </div>
                    </div>
                    <div>
                        <label className={labelClasses}>Endereço Completo</label>
                        <textarea
                            {...register('contact.address')}
                            rows={2}
                            className={inputClasses}
                        />
                    </div>
                </div>

                {/* Hours */}
                <div className={sectionClasses}>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 rounded-full blur-[80px] -z-10 pointer-events-none"></div>
                    <h2 className={sectionTitleClasses}>Horários de Funcionamento</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className={labelClasses}>Segunda a Sexta (Seg - Sex)</label>
                            <input
                                {...register('hours.weekdays')}
                                type="text"
                                className={inputClasses}
                            />
                        </div>
                        <div>
                            <label className={labelClasses}>Sábado e Domingo (Sáb - Dom)</label>
                            <input
                                {...register('hours.weekend')}
                                type="text"
                                className={inputClasses}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-start pt-6 border-t border-white/5 mt-8">
                    <Button variant="primary" type="submit" disabled={!isDirty} className={`flex items-center gap-2 px-8 py-3 transition-all duration-300 ${isDirty ? 'shadow-[0_0_20px_rgba(209,103,42,0.4)] hover:shadow-[0_0_30px_rgba(209,103,42,0.6)]' : 'opacity-50 cursor-not-allowed'}`}>
                        <Save size={20} />
                        Salvar Alterações
                    </Button>
                </div>

            </form>
        </div>
    );
}
