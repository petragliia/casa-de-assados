import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const StoreContext = createContext();

export function useStore() {
    return useContext(StoreContext);
}

export function StoreProvider({ children }) {
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [inventoryLogs, setInventoryLogs] = useState([]);
    const [couriers, setCouriers] = useState([]);
    const [deliveryFees, setDeliveryFees] = useState([]);
    const [isLoadingData, setIsLoadingData] = useState(true);

    // Initial Data Fetch
    useEffect(() => {
        const fetchAllData = async () => {
            setIsLoadingData(true);
            
            try {
                // Fetch Products
                const { data: productsData } = await supabase
                    .from('products')
                    .select('*')
                    .order('created_at', { ascending: true });
                if (productsData) setProducts(productsData);

                // Fetch Orders (limit to recent to avoid huge payloads)
                const { data: ordersData } = await supabase
                    .from('orders')
                    .select(`*, items:order_items(*)`)
                    .order('created_at', { ascending: false })
                    .limit(50);
                
                if (ordersData) {
                    // Map the data to the format expected by the frontend
                    const formattedOrders = ordersData.map(o => ({
                        ...o,
                        db_id: o.id,
                        id: `#${o.order_number}`,
                        date: o.created_at,
                        payment: {
                            method: o.payment_method,
                            change: 0
                        }
                    }));
                    setOrders(formattedOrders);
                }

                // Fetch Inventory Logs
                const { data: logsData } = await supabase
                    .from('inventory_logs')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(100);
                if (logsData) setInventoryLogs(logsData);

                // Fetch Couriers
                const { data: couriersData } = await supabase.from('couriers').select('*').order('created_at', { ascending: true });
                if (couriersData) setCouriers(couriersData);

                // Fetch Delivery Fees
                const { data: feesData } = await supabase.from('delivery_fees').select('*').order('created_at', { ascending: true });
                if (feesData) setDeliveryFees(feesData);

            } catch (error) {
                console.error("Error fetching data from Supabase:", error);
            } finally {
                setIsLoadingData(false);
            }
        };

        fetchAllData();

        // 7. Supabase Real-time Subscriptions
        const ordersChannel = supabase
            .channel('realtime-orders')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, async (payload) => {
                try {
                    const { data: newOrder, error } = await supabase
                        .from('orders')
                        .select(`*, items:order_items(*)`)
                        .eq('id', payload.new.id)
                        .single();
                    
                    if (newOrder && !error) {
                        const formatted = {
                            ...newOrder,
                            db_id: newOrder.id,
                            id: `#${newOrder.order_number}`,
                            date: newOrder.created_at,
                            payment: {
                                method: newOrder.payment_method,
                                change: 0
                            }
                        };
                        setOrders(prev => {
                            if (prev.some(o => o.db_id === formatted.db_id)) return prev;
                            return [formatted, ...prev];
                        });
                    }
                } catch (err) {
                    console.error("Erro no processamento em tempo real do novo pedido:", err);
                }
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload) => {
                setOrders(prev => prev.map(o => o.db_id === payload.new.id ? {
                    ...o,
                    status: payload.new.status,
                    cancellation_reason: payload.new.cancellation_reason
                } : o));
            })
            .subscribe();

        const productsChannel = supabase
            .channel('realtime-products')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    setProducts(prev => {
                        if (prev.some(p => p.id === payload.new.id)) return prev;
                        return [...prev, payload.new];
                    });
                } else if (payload.eventType === 'UPDATE') {
                    setProducts(prev => prev.map(p => p.id === payload.new.id ? payload.new : p));
                } else if (payload.eventType === 'DELETE') {
                    setProducts(prev => prev.filter(p => p.id !== payload.old.id));
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(ordersChannel);
            supabase.removeChannel(productsChannel);
        };
    }, []);

    // Actions
    const addInventoryLog = async (productId, amount, type, reason = '') => {
        const { data, error } = await supabase
            .from('inventory_logs')
            .insert([{ product_id: productId, change_amount: amount, type, reason }])
            .select()
            .single();

        if (data && !error) {
            setInventoryLogs(prev => [data, ...prev]);
        }
    };

    const updateProductStock = async (id, newStock, reason = 'Ajuste Manual') => {
        // Find existing product to calculate diff
        const product = products.find(p => p.id === id);
        if (!product) return;

        const diff = parseInt(newStock) - product.stock;
        if (diff === 0) return;

        // Update DB
        const { error } = await supabase
            .from('products')
            .update({ stock: parseInt(newStock) })
            .eq('id', id);

        if (!error) {
            // Update local state
            setProducts(prev => prev.map(p => p.id === id ? { ...p, stock: parseInt(newStock) } : p));
            // Log the change
            await addInventoryLog(id, diff, 'manual_adjustment', reason);
        } else {
            console.error("Error updating stock:", error);
            alert("Erro ao atualizar o estoque no servidor.");
        }
    };

    const addOrder = async (orderData) => {
        // Prepare items for the RPC call
        const items = orderData.items.map(item => ({
            product_id: item.id,
            quantity: item.quantity,
            unit_price: item.price
        }));

        const customerInfo = orderData.customer || {};

        // Call our RPC function
        const { data: newOrderId, error } = await supabase.rpc('process_pos_order', {
            p_customer_name: customerInfo.name || 'Balcão / Anônimo',
            p_customer_phone: customerInfo.phone || 'Presencial',
            p_customer_cpf: customerInfo.cpf || null,
            p_type: orderData.type || 'in_person',
            p_status: orderData.status || 'Finalizado',
            p_payment_method: orderData.payment?.method || 'dinheiro',
            p_total: orderData.total,
            p_items: items
        });

        if (error) {
            console.error("Error creating order:", error);
            alert("Erro ao processar pedido no servidor!");
            return null;
        }

        // Fetch the newly created order from DB to get the `order_number` and fully populated fields
        const { data: orderResponse } = await supabase
            .from('orders')
            .select(`*, items:order_items(*)`)
            .eq('id', newOrderId)
            .single();

        if (orderResponse) {
            const formattedNewOrder = {
                ...orderResponse,
                db_id: orderResponse.id,
                id: `#${orderResponse.order_number}`,
                date: orderResponse.created_at,
                payment: {
                    method: orderResponse.payment_method,
                    change: 0
                }
            };
            
            // Update local states
            setOrders(prev => [formattedNewOrder, ...prev]);

            // Subtract stock locally so UI is snappy
            setProducts(prev => prev.map(p => {
                const itemInOrder = items.find(i => i.product_id === p.id);
                if (itemInOrder) {
                    return { ...p, stock: Math.max(0, p.stock - itemInOrder.quantity) };
                }
                return p;
            }));

            // We don't fetch logs here to save a request, the next page reload will bring the new log,
            // or we could refetch logs. For POS functionality, it's fine.
            return formattedNewOrder;
        }
    };

    const updateOrderStatus = async (orderIdNum, status, reason = null) => {
        const orderToUpdate = orders.find(o => o.id === orderIdNum);
        if (!orderToUpdate) return;
        
        const { error } = await supabase
            .from('orders')
            .update({ status: status })
            .eq('id', orderToUpdate.db_id);
            
        if (!error) {
            setOrders(prev => prev.map(o =>
                o.id === orderIdNum ? { ...o, status, ...(reason && { cancellationReason: reason }) } : o
            ));
        } else {
            console.error("Erro ao atualizar status:", error);
            alert("Erro ao atualizar status no servidor");
        }
    };

    // Settings (Local Storage for now)
    const [settings, setSettings] = useState(() => {
        const defaultSettings = {
            description: "O verdadeiro sabor do churrasco na sua mesa. Carnes selecionadas e preparadas com excelência para você e sua família.",
            contact: {
                phone: "(11) 99999-9999",
                instagram: "@casadosassados",
                address: "Av. Principal, 123 - Centro\nSão Paulo - SP"
            },
            hours: { weekdays: "11h às 15h / 18h às 23h", weekend: "11h às 23h" }
        };
        try {
            const saved = localStorage.getItem('store_settings');
            if (saved) {
                const parsed = JSON.parse(saved);
                return { 
                    ...defaultSettings, 
                    ...parsed,
                    contact: { ...defaultSettings.contact, ...(parsed.contact || {}) },
                    hours: { ...defaultSettings.hours, ...(parsed.hours || {}) }
                };
            }
        } catch (e) {
            console.error("Error parsing store_settings", e);
        }
        return defaultSettings;
    });

    const updateSettings = (newSettings) => {
        setSettings(prev => {
            const updated = { ...prev, ...newSettings };
            localStorage.setItem('store_settings', JSON.stringify(updated));
            return updated;
        });
    };

    const addCourier = async (name) => {
        const { data, error } = await supabase.from('couriers').insert([{ name }]).select().single();
        if (data && !error) {
            setCouriers(prev => [...prev, data]);
        }
    };
    const removeCourier = async (id) => {
        const { error } = await supabase.from('couriers').delete().eq('id', id);
        if (!error) {
            setCouriers(prev => prev.filter(c => c.id !== id));
        }
    };

    const addDeliveryFee = async (name, price) => {
        const parsedPrice = parseFloat(price);
        const { data, error } = await supabase.from('delivery_fees').insert([{ name, price: parsedPrice }]).select().single();
        if (data && !error) {
            setDeliveryFees(prev => [...prev, data]);
        }
    };
    const removeDeliveryFee = async (id) => {
        const { error } = await supabase.from('delivery_fees').delete().eq('id', id);
        if (!error) {
            setDeliveryFees(prev => prev.filter(f => f.id !== id));
        }
    };

    // Daily Menus (Local Storage)
    const [dailyMenus, setDailyMenus] = useState(() => {
        const defaultMenus = {
            2: {
                name: "TERÇA-FEIRA",
                tradicionais: [
                    { name: "Bife acebolado", price: "26,00" },
                    { name: "Isca de frango", price: "24,00" },
                    { name: "Filé de tilápia empanado", price: "26,00" },
                    { name: "Bisteca acebolada", price: "24,00" },
                    { name: "Filé de frango grelhado", price: "24,00" },
                    { name: "Omelete recheada", price: "22,00" },
                    { name: "Calabresa acebolada", price: "22,00" }
                ],
                especiais: [
                    { name: "Parmegiana de frango", price: "26,00" },
                    { name: "Parmegiana de carne", price: "28,00" }
                ]
            },
            3: {
                name: "QUARTA-FEIRA",
                tradicionais: [
                    { name: "Bife acebolado", price: "26,00" },
                    { name: "Isca de frango", price: "24,00" },
                    { name: "Filé de tilápia empanado", price: "26,00" },
                    { name: "Bisteca acebolada", price: "24,00" },
                    { name: "Filé de frango grelhado", price: "24,00" },
                    { name: "Omelete recheada", price: "22,00" },
                    { name: "Calabresa acebolada", price: "22,00" }
                ],
                especiais: [
                    { name: "Feijoada", price: "30,00" },
                    { name: "Feijoada a la carte", price: "58,00" }
                ]
            },
            4: {
                name: "QUINTA-FEIRA",
                tradicionais: [
                    { name: "Bife acebolado", price: "26,00" },
                    { name: "Isca de frango", price: "24,00" },
                    { name: "Filé de tilápia empanado", price: "26,00" },
                    { name: "Bisteca acebolada", price: "24,00" },
                    { name: "Filé de frango grelhado", price: "24,00" },
                    { name: "Omelete recheada", price: "22,00" },
                    { name: "Calabresa acebolada", price: "22,00" }
                ],
                especiais: [
                    { name: "Carne Assada", price: "30,00" }
                ]
            },
            5: {
                name: "SEXTA-FEIRA",
                tradicionais: [
                    { name: "Bife acebolado", price: "26,00" },
                    { name: "Isca de frango", price: "24,00" },
                    { name: "Filé de tilápia empanado", price: "26,00" },
                    { name: "Bisteca acebolada", price: "24,00" },
                    { name: "Filé de frango grelhado", price: "24,00" },
                    { name: "Omelete recheada", price: "22,00" },
                    { name: "Calabresa acebolada", price: "22,00" }
                ],
                especiais: [
                    { name: "Costela com mandioca", price: "28,00" }
                ]
            },
            6: {
                name: "SÁBADO",
                especiais: [
                    { name: "Feijoada", price: "30,00" },
                    { name: "Feijoada a la carte", price: "58,00" },
                    { name: "Churrasco", price: "35,00" },
                    { name: "Toscana", price: "26,00" },
                    { name: "Filé de Frango Grelhado", price: "24,00" },
                    { name: "Omelete Recheada", price: "22,00" },
                    { name: "Calabresa Acebolada", price: "22,00" }
                ],
                carnesAssadas: "Cupim, Fraldinha, Linguiça Toscana, Costela Suína, Costela Bovina, Largarto",
                precoKg: "97,90"
            },
            0: {
                name: "DOMINGO",
                marmitas: [
                    { name: "Churrasco", price: "35,00" },
                    { name: "Toscana", price: "26,00" },
                    { name: "Filé de Frango Grelhado", price: "24,00" },
                    { name: "Omelete Recheada", price: "22,00" },
                    { name: "Calabresa Acebolada", price: "22,00" }
                ],
                carnesAssadas: "Cupim, Fraldinha, Linguiça Toscana, Costela Suína, Costela Bovina, Largarto",
                precoKg: "97,90",
                frangoAssado: "55,00",
                acompanhamentos: [
                    { name: "Arroz Branco", price: "16,00" },
                    { name: "Maionese", price: "20,00" },
                    { name: "Feijão Tropeiro", price: "25,00" }
                ]
            }
        };

        try {
            const saved = localStorage.getItem('store_daily_menus');
            if (saved) {
                const parsed = JSON.parse(saved);
                const merged = { ...defaultMenus };
                Object.keys(defaultMenus).forEach(k => {
                    if (parsed[k]) merged[k] = parsed[k];
                });
                return merged;
            }
        } catch (e) {
            console.error("Error parsing store_daily_menus", e);
        }
        return defaultMenus;
    });

    const updateDailyMenus = (newMenus) => {
        setDailyMenus(newMenus);
        localStorage.setItem('store_daily_menus', JSON.stringify(newMenus));
    };

    const assignCourier = (orderIdNum, courierId, feeValue, feeName) => {
        setOrders(prev => prev.map(o => o.id === orderIdNum ? { ...o, courierId, deliveryFee: parseFloat(feeValue) || 0, deliveryZone: feeName || '' } : o));
    };

    return (
        <StoreContext.Provider value={{
            products, orders, inventoryLogs, settings, couriers, deliveryFees, isLoadingData, dailyMenus,
            updateProductStock, addOrder, updateOrderStatus, updateSettings,
            addCourier, removeCourier, addDeliveryFee, removeDeliveryFee, assignCourier, updateDailyMenus
        }}>
            {children}
        </StoreContext.Provider>
    );
}
