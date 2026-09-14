import React from 'react';
import { UserRole, NavigationSection } from '../../types';
import { SecurityService } from '../../services/securityService';
import { ShieldAlert, Lock, ArrowRight, UserCheck, Home, KeyRound } from 'lucide-react';
import { Button } from './Button';
import { Badge } from './Badge';

interface ProtectedRouteProps {
  section: NavigationSection;
  userRole: UserRole;
  userEmail?: string;
  onNavigate: (section: NavigationSection) => void;
  onRequestAuth?: () => void;
  onSwitchRole?: (newRole: UserRole) => void;
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  section,
  userRole,
  userEmail,
  onNavigate,
  onRequestAuth,
  onSwitchRole,
  children,
}) => {
  const check = SecurityService.canAccessSection(userRole, section);

  if (check.allowed) {
    return <>{children}</>;
  }

  // Record security audit event for unauthorized route attempt
  SecurityService.logAuditEvent({
    category: 'rbac',
    severity: 'warning',
    action: 'Access Denied to Protected Route',
    userRole,
    userEmail,
    details: `Blocked ${userRole} from accessing section "${section}". ${check.reason || ''}`,
    blocked: true,
  });

  return (
    <div
      id="protected-route-access-denied"
      className="min-h-[70vh] flex items-center justify-center p-4 sm:p-8"
    >
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl border border-rose-200 dark:border-rose-900/50 shadow-2xl p-6 sm:p-8 text-center space-y-6 animate-in fade-in zoom-in-95">
        {/* Shield Icon */}
        <div className="relative mx-auto w-20 h-20 flex items-center justify-center rounded-3xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 shadow-inner">
          <ShieldAlert className="w-10 h-10" />
          <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md">
            <Lock className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Title & Explanation */}
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Badge variant="danger" size="sm">
              RESTRICTED ROUTE
            </Badge>
            <Badge variant="neutral" size="sm">
              CURRENT ROLE: {userRole.toUpperCase()}
            </Badge>
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            Access Authorization Required
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {check.reason || `You need ${check.requiredRole} privileges to access this area.`}
          </p>
        </div>

        {/* Security Notice Box */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-left text-xs space-y-1.5 text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
            <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Role-Based Access Control (RBAC) Guard</span>
          </div>
          <p className="text-[11px] text-slate-500">
            This route is protected by zero-trust role verification. Switch to an authorized account or navigate back to the learning dashboard.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
          <Button
            variant="outline"
            size="md"
            onClick={() => onNavigate('home')}
            icon={<Home className="w-4 h-4" />}
            className="w-full sm:w-auto text-xs"
          >
            Return to Home
          </Button>

          {onRequestAuth && (
            <Button
              variant="primary"
              size="md"
              onClick={onRequestAuth}
              icon={<KeyRound className="w-4 h-4" />}
              className="w-full sm:w-auto text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Sign In with Authorized Account
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
