import { create } from 'zustand';

export type Density = 'compact' | 'comfortable';

interface Toast {
  id: number;
  message: string;
  kind: 'success' | 'error' | 'info';
}

interface UIState {
  // 表格密度（§4.4，记忆选择）
  density: Density;
  setDensity: (d: Density) => void;

  // 侧边栏折叠（§3.2，记忆状态）
  navCollapsed: boolean;
  toggleNav: () => void;

  // 命令面板 ⌘K
  commandOpen: boolean;
  setCommandOpen: (v: boolean) => void;

  // Toast
  toasts: Toast[];
  toast: (message: string, kind?: Toast['kind']) => void;
  dismiss: (id: number) => void;
}

const persistedDensity = (localStorage.getItem('crm.density') as Density) || 'comfortable';
const persistedNav = localStorage.getItem('crm.navCollapsed') === '1';

let toastId = 1;

export const useUI = create<UIState>((set, get) => ({
  density: persistedDensity,
  setDensity: (d) => {
    localStorage.setItem('crm.density', d);
    set({ density: d });
  },

  navCollapsed: persistedNav,
  toggleNav: () => {
    const v = !get().navCollapsed;
    localStorage.setItem('crm.navCollapsed', v ? '1' : '0');
    set({ navCollapsed: v });
  },

  commandOpen: false,
  setCommandOpen: (v) => set({ commandOpen: v }),

  toasts: [],
  toast: (message, kind = 'info') => {
    const id = toastId++;
    set({ toasts: [...get().toasts, { id, message, kind }] });
    setTimeout(() => get().dismiss(id), 3000);
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));
