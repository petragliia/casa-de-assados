import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, Settings, LogOut, ClipboardList, PlusCircle, Bike, Flame, HelpCircle, CalendarDays, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';

export default function AdminLayout() {
  const { orders } = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, userRole } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const isActive = (path) => location.pathname === path || (path !== '/admin' && location.pathname.startsWith(path));

  const pendingCount = orders.filter(o => !['Entregue', 'Pedido retirado', 'Cancelado', 'Finalizado'].includes(o.status)).length;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  React.useEffect(() => {
    if (userRole === 'employee' && location.pathname !== '/admin/pos') {
      navigate('/admin/pos');
    }
  }, [userRole, location.pathname, navigate]);

  const navItems = userRole === 'employee' 
    ? [ { icon: <PlusCircle size={18} strokeWidth={2} />, label: 'PDV/Caixa', path: '/admin/pos' } ]
    : [
        { icon: <LayoutDashboard size={18} strokeWidth={2} />, label: 'Dashboard', path: '/admin' },
        { icon: <PlusCircle size={18} strokeWidth={2} />, label: 'PDV/Caixa', path: '/admin/pos' },
        { icon: <ClipboardList size={18} strokeWidth={2} />, label: 'Estoque', path: '/admin/inventory' },
        { icon: <ShoppingCart size={18} strokeWidth={2} />, label: 'Pedidos', path: '/admin/orders' },
        { icon: <Package size={18} strokeWidth={2} />, label: 'Produtos', path: '/admin/products' },
        { icon: <Bike size={18} strokeWidth={2} />, label: 'Motoboys', path: '/admin/couriers' },
        { icon: <CalendarDays size={18} strokeWidth={2} />, label: 'Cardápio Diário', path: '/admin/daily-menu' },
        { icon: <Settings size={18} strokeWidth={2} />, label: 'Ajustes', path: '/admin/settings' },
      ];

  return (
    <div className="flex h-screen overflow-hidden bg-background text-text-primary font-sans relative">
      
      {/* Mobile Drawer Backdrop */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-[260px] bg-[#111111] border-r border-surface-light flex flex-col shrink-0 shadow-2xl
        transform transition-transform duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]
        md:relative md:translate-x-0
        ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        
        {/* Logo Area */}
        <div className="p-8 flex flex-col gap-1 mb-4 relative">
          <button 
            className="md:hidden absolute top-4 right-4 text-text-muted hover:text-white"
            onClick={() => setIsMobileSidebarOpen(false)}
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-3">
            <Flame className="text-brand" size={24} strokeWidth={2.5} />
            <h1 className="text-brand-light font-serif tracking-widest text-lg font-bold uppercase leading-none">
              CASA DE
              <br />
              <span className="text-white">CARNES</span>
            </h1>
          </div>
          <span className="text-text-muted text-[10px] uppercase tracking-[0.2em] font-semibold mt-2 ml-[36px]">
            Painel Gerencial
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4">
          <ul className="flex flex-col gap-2">
            {navItems.map((item) => {
              const active = isActive(item.path);
              return (
                <li key={item.path} className="px-4">
                  <Link
                    to={item.path}
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className={`
                      group flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200
                      ${active 
                        ? 'bg-surface border-l-2 border-brand text-brand shadow-sm' 
                        : 'text-text-secondary hover:bg-surface/50 hover:text-text-primary border-l-2 border-transparent'
                      }
                    `}
                  >
                    <div className="flex items-center gap-4">
                      <span className={`transition-colors ${active ? 'text-brand' : 'text-text-muted group-hover:text-text-primary'}`}>
                        {item.icon}
                      </span>
                      <span className="font-medium text-sm tracking-wide">
                        {item.label}
                      </span>
                    </div>

                    {item.label === 'Pedidos' && pendingCount > 0 && (
                      <span className={`
                        text-[10px] font-bold px-2 py-0.5 rounded-full
                        ${active ? 'bg-brand text-background' : 'bg-surface-light text-text-primary group-hover:bg-brand/20 group-hover:text-brand'}
                      `}>
                        {pendingCount}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom Actions */}
        <div className="p-6 mt-auto">
          <button className="flex items-center gap-4 w-full px-4 py-3 text-sm font-medium tracking-wide text-text-secondary hover:text-text-primary hover:bg-surface/50 rounded-lg transition-all mb-2">
            <HelpCircle size={18} className="text-text-muted" strokeWidth={2} />
            Suporte
          </button>
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-4 w-full px-4 py-3 text-sm font-medium tracking-wide text-text-secondary hover:text-danger hover:bg-danger/10 rounded-lg transition-all"
          >
            <LogOut size={18} className="text-text-muted" strokeWidth={2} />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden bg-background h-screen w-full relative z-10">
        
        {/* Mobile Top App Bar */}
        <div className="md:hidden flex items-center p-4 bg-[#111111] border-b border-surface-light shrink-0 z-20 gap-4">
          <button 
            onClick={() => setIsMobileSidebarOpen(true)}
            className="text-text-muted hover:text-white transition-colors p-1"
          >
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-3">
            <Flame className="text-brand" size={24} />
            <h1 className="text-brand-light font-serif tracking-widest text-sm font-bold uppercase leading-none">
              CASA DE CARNES
            </h1>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
