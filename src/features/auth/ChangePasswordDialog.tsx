import { useState } from 'react';
import { authApi } from '@/api/auth';
import { useAuth } from '@/store/auth';
import { useUI } from '@/store/ui';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/primitives';
import { Field, TextInput } from '@/components/ui/form';

// 修改密码：成功后服务端 token_version+1，其它设备会话失效；当前设备用返回的新令牌保持登录
export function ChangePasswordDialog({ onClose }: { onClose: () => void }) {
  const setSession = useAuth((s) => s.setSession);
  const toast = useUI((s) => s.toast);
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirm, setConfirm] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setErr('');
    if (newPwd.length < 6) return setErr('新密码至少 6 位');
    if (newPwd !== confirm) return setErr('两次输入的新密码不一致');
    setLoading(true);
    try {
      const s = await authApi.changePassword(oldPwd, newPwd);
      setSession(s);
      toast('密码已修改，其它设备需重新登录', 'success');
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : '修改失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title="修改密码"
      width="w-[440px]"
      footer={
        <>
          <Button onClick={onClose}>取消</Button>
          <Button variant="primary" onClick={submit} disabled={loading}>{loading ? '提交中…' : '确认修改'}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="原密码"><TextInput type="password" value={oldPwd} onChange={(e) => setOldPwd(e.target.value)} /></Field>
        <Field label="新密码" hint="至少 6 位"><TextInput type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} /></Field>
        <Field label="确认新密码"><TextInput type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} /></Field>
        {err && <div className="rounded-md bg-[#FDECEC] px-3 py-2 text-sm text-danger">{err}</div>}
      </div>
    </Dialog>
  );
}
