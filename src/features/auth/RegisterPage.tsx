import { useState } from 'react';
import { Boxes, Store } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getApiErrorMessage } from '@/lib/api';
import { OrganizationType } from '@/lib/enums';
import { cn } from '@/lib/utils';
import { AuthLayout } from './AuthLayout';
import { useAuth } from './auth-context';

const TYPE_OPTIONS = [
  {
    value: OrganizationType.SUBSCRIBER,
    label: 'Subscriber',
    description: 'Consume APIs — get keys and subscribe to marketplace APIs.',
    icon: Boxes,
  },
  {
    value: OrganizationType.PUBLISHER,
    label: 'Publisher',
    description: 'Publish your APIs to the marketplace and earn payouts.',
    icon: Store,
  },
] as const;

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '' });
  const [type, setType] = useState<OrganizationType>(OrganizationType.SUBSCRIBER);
  const [submitting, setSubmitting] = useState(false);

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await register({
        email: form.email,
        password: form.password,
        firstName: form.firstName || undefined,
        lastName: form.lastName || undefined,
        type,
      });
      navigate('/dashboard', { replace: true });
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Registration failed'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Create your account" subtitle="Start building on the platform in minutes.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Account type — sets up everything; no separate org/app steps. */}
        <div className="grid gap-2">
          <Label>I want to…</Label>
          <div className="grid grid-cols-2 gap-2">
            {TYPE_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const selected = type === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setType(opt.value)}
                  aria-pressed={selected}
                  className={cn(
                    'flex flex-col gap-1.5 rounded-lg border p-3 text-left transition-colors',
                    selected
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'hover:border-primary/40 hover:bg-muted/40',
                  )}
                >
                  <Icon className={cn('size-4', selected ? 'text-primary' : 'text-muted-foreground')} />
                  <span className="text-sm font-medium">{opt.label}</span>
                  <span className="text-xs text-muted-foreground">{opt.description}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label htmlFor="firstName">First name</Label>
            <Input id="firstName" placeholder="Ada" value={form.firstName} onChange={update('firstName')} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="lastName">Last name</Label>
            <Input id="lastName" placeholder="Lovelace" value={form.lastName} onChange={update('lastName')} />
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            required
            value={form.email}
            onChange={update('email')}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            required
            minLength={8}
            value={form.password}
            onChange={update('password')}
          />
        </div>
        <Button type="submit" className="mt-1 w-full" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
