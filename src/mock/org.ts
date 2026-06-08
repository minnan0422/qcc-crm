import type { Department, User } from '@/types';

export const MOCK_DEPARTMENTS: Department[] = [
  { depId: 1, name: '企查查科技', parentId: 0, path: '1', depth: 0 },
  { depId: 2, name: '华东销售部', parentId: 1, path: '1,2', depth: 1 },
  { depId: 3, name: '华南销售部', parentId: 1, path: '1,3', depth: 1 },
  { depId: 4, name: '大客户部', parentId: 1, path: '1,4', depth: 1 },
  { depId: 5, name: '华东一组', parentId: 2, path: '1,2,5', depth: 2 },
  { depId: 6, name: '华东二组', parentId: 2, path: '1,2,6', depth: 2 },
];

export const MOCK_USERS: User[] = [
  { userId: 1, name: '张伟', depId: 5, depName: '华东一组', position: 1 },
  { userId: 2, name: '李娜', depId: 5, depName: '华东一组', position: 0 },
  { userId: 3, name: '王芳', depId: 6, depName: '华东二组', position: 0 },
  { userId: 4, name: '刘洋', depId: 3, depName: '华南销售部', position: 1 },
  { userId: 5, name: '陈静', depId: 3, depName: '华南销售部', position: 0 },
  { userId: 6, name: '赵磊', depId: 4, depName: '大客户部', position: 1 },
  { userId: 7, name: '孙宇', depId: 4, depName: '大客户部', position: 0 },
  { userId: 8, name: '周敏', depId: 6, depName: '华东二组', position: 0 },
];

/** 当前登录用户（mock） */
export const CURRENT_USER: User = MOCK_USERS[0];

export function userName(id?: number): string {
  if (!id) return '—';
  return MOCK_USERS.find((u) => u.userId === id)?.name ?? `用户${id}`;
}
