import { create } from 'zustand';

// 统一新建实体的全局入口（TopBar QuickCreate / 各列表「新建」按钮共用）
export type CreatableEntity = 'lead' | 'customer' | 'opportunity' | 'contract';

interface CreateState {
  entity: CreatableEntity | null;
  /** 预填字段（如从客户详情建商机时带入 customerId） */
  preset?: Record<string, unknown>;
  open: (entity: CreatableEntity, preset?: Record<string, unknown>) => void;
  close: () => void;
}

export const useCreate = create<CreateState>((set) => ({
  entity: null,
  preset: undefined,
  open: (entity, preset) => set({ entity, preset }),
  close: () => set({ entity: null, preset: undefined }),
}));
