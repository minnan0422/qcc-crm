import { clsx, type ClassValue } from 'clsx';

/** 轻量 className 合并（无 tailwind-merge 依赖，约定后写覆盖先写） */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
