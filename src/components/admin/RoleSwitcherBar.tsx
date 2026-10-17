import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ROLE_DEFINITIONS, UserRole } from '../../types/rbac';
import { ShieldCheck, UserCheck, Sparkles, RefreshCw } from 'lucide-react';

interface RoleSwitcherBarProps {
  compact?: boolean;
}

export const RoleSwitcherBar: React.FC<RoleSwitcherBarProps> = ({ compact = false }) => {
  const { currentRole, roleDefinition, permissions, switchRole, isLoading, currentUser, hasPermission } = useAuth();

  // ONLY Super Admin can test role switching
  if (currentRole !== 'super_admin' && !hasPermission('roles.assign')) {
    return null;
  }

  const rolesList: UserRole[] = [
    'super_admin',
    'admin',
    'content_manager',
    'support',
    'analyst',
  ];

  return (
    <div className={`nail-card rounded-2xl p-3 border nail-border ${compact ? 'text-xs' : ''}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b nail-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full nail-bg-subtle flex items-center justify-center border nail-border text-base">
            {currentRole === 'super_admin' ? '👑' :
             currentRole === 'admin' ? '🛡️' :
             currentRole === 'content_manager' ? '✍️' :
             currentRole === 'support' ? '🎧' :
             currentRole === 'analyst' ? '📊' : '💅'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm nail-text-main">{currentUser?.name || 'Người dùng'}</span>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${roleDefinition.colorScheme.bg} ${roleDefinition.colorScheme.text} ${roleDefinition.colorScheme.border}`}
              >
                {roleDefinition.badge}
              </span>
            </div>
            <p className="text-[11px] nail-text-muted">
              Đang thử nghiệm: <span className="font-semibold text-rose-300">{roleDefinition.nameVi}</span> • Có{' '}
              <span className="font-bold text-amber-300">{permissions.length}</span> / 22 quyền RBAC
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto text-[11px] nail-text-muted bg-white/5 px-2.5 py-1 rounded-xl">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Bảo mật RBAC thời gian thực</span>
        </div>
      </div>

      <div className="pt-2">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-semibold nail-text-muted uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" /> Chọn vai trò để trải nghiệm phân quyền:
          </span>
          {isLoading && (
            <span className="text-[11px] text-amber-300 flex items-center gap-1 animate-pulse">
              <RefreshCw className="w-3 h-3 animate-spin" /> Đang cập nhật quyền...
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-1.5">
          {rolesList.map((roleKey) => {
            const role = ROLE_DEFINITIONS[roleKey];
            const isActive = currentRole === roleKey;
            return (
              <button
                key={roleKey}
                onClick={() => switchRole(roleKey)}
                disabled={isLoading}
                type="button"
                className={`py-1.5 px-2 rounded-xl text-left transition-all text-xs flex flex-col justify-between border ${
                  isActive
                    ? 'nail-btn-primary shadow-sm font-semibold'
                    : 'nail-bg-subtle hover:bg-white/10 nail-text-main nail-border'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="truncate">{role.badge}</span>
                  {isActive && <UserCheck className="w-3 h-3 text-amber-300 shrink-0 ml-1" />}
                </div>
                <span className={`text-[10px] mt-0.5 truncate ${isActive ? 'text-white/80' : 'nail-text-muted'}`}>
                  {role.permissions.length} quyền
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
