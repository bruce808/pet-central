'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, Input, Select, Button } from '@pet-central/ui';
import { auth } from '@/lib/api';

const STEPS = ['Account', 'Organization', 'Confirmation'];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');

  const [account, setAccount] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
  });

  const [org, setOrg] = useState({
    legalName: '',
    publicName: '',
    orgType: '',
    city: '',
    region: '',
    country: '',
    email: '',
    phone: '',
  });

  const registerMutation = useMutation({
    mutationFn: () =>
      auth.register({
        email: account.email,
        password: account.password,
        name: account.name,
        organization: {
          legalName: org.legalName,
          publicName: org.publicName,
          type: org.orgType,
          city: org.city,
          region: org.region,
          country: org.country,
          email: org.email,
          phone: org.phone,
        },
      }),
    onSuccess: () => router.push('/'),
    onError: (err: Error) => setError(err.message),
  });

  function nextStep() {
    if (step === 0) {
      if (!account.email || !account.password || !account.name) {
        setError('Please fill in all required fields.');
        return;
      }
      if (account.password !== account.confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }
    if (step === 1) {
      if (!org.legalName || !org.publicName || !org.orgType) {
        setError('Please fill in all required fields.');
        return;
      }
    }
    setError('');
    setStep(step + 1);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-lg font-bold text-white">
            PC
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Register Your Organization
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Join PetCentral as a verified vendor
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8 flex items-center justify-center gap-3">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                  i === step
                    ? 'bg-brand-600 text-white'
                    : i < step
                      ? 'bg-brand-100 text-brand-700'
                      : 'bg-gray-100 text-gray-400'
                }`}
              >
                {i + 1}
              </div>
              <span
                className={`text-xs font-medium ${
                  i === step ? 'text-brand-700' : 'text-gray-400'
                }`}
              >
                {label}
              </span>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-0.5 w-8 ${
                    i < step ? 'bg-brand-300' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <Card padding="lg">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Step 1: Account */}
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Account Details
              </h2>
              <Input
                label="Full Name"
                value={account.name}
                onChange={(e) =>
                  setAccount((a) => ({ ...a, name: e.target.value }))
                }
                required
              />
              <Input
                label="Email"
                type="email"
                value={account.email}
                onChange={(e) =>
                  setAccount((a) => ({ ...a, email: e.target.value }))
                }
                required
              />
              <Input
                label="Password"
                type="password"
                value={account.password}
                onChange={(e) =>
                  setAccount((a) => ({ ...a, password: e.target.value }))
                }
                required
              />
              <Input
                label="Confirm Password"
                type="password"
                value={account.confirmPassword}
                onChange={(e) =>
                  setAccount((a) => ({
                    ...a,
                    confirmPassword: e.target.value,
                  }))
                }
                required
              />
            </div>
          )}

          {/* Step 2: Organization */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Organization Details
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Legal Name"
                  value={org.legalName}
                  onChange={(e) =>
                    setOrg((o) => ({ ...o, legalName: e.target.value }))
                  }
                  required
                />
                <Input
                  label="Public Name"
                  value={org.publicName}
                  onChange={(e) =>
                    setOrg((o) => ({ ...o, publicName: e.target.value }))
                  }
                  required
                />
              </div>
              <Select
                label="Organization Type"
                options={[
                  { value: 'BREEDER', label: 'Breeder' },
                  { value: 'SHELTER', label: 'Shelter' },
                  { value: 'HUMANE_SOCIETY', label: 'Humane Society' },
                  { value: 'RESCUE', label: 'Rescue' },
                  { value: 'NONPROFIT', label: 'Nonprofit' },
                  { value: 'AGENCY', label: 'Agency' },
                  { value: 'FOSTER_NETWORK', label: 'Foster Network' },
                ]}
                value={org.orgType}
                onChange={(e) =>
                  setOrg((o) => ({ ...o, orgType: e.target.value }))
                }
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Input
                  label="City"
                  value={org.city}
                  onChange={(e) =>
                    setOrg((o) => ({ ...o, city: e.target.value }))
                  }
                />
                <Input
                  label="Region / State"
                  value={org.region}
                  onChange={(e) =>
                    setOrg((o) => ({ ...o, region: e.target.value }))
                  }
                />
                <Input
                  label="Country"
                  value={org.country}
                  onChange={(e) =>
                    setOrg((o) => ({ ...o, country: e.target.value }))
                  }
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Organization Email"
                  type="email"
                  value={org.email}
                  onChange={(e) =>
                    setOrg((o) => ({ ...o, email: e.target.value }))
                  }
                />
                <Input
                  label="Organization Phone"
                  value={org.phone}
                  onChange={(e) =>
                    setOrg((o) => ({ ...o, phone: e.target.value }))
                  }
                />
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Confirm Registration
              </h2>
              <div className="rounded-lg bg-gray-50 p-4">
                <h3 className="mb-2 text-sm font-medium text-gray-700">
                  Account
                </h3>
                <p className="text-sm text-gray-600">{account.name}</p>
                <p className="text-sm text-gray-600">{account.email}</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-4">
                <h3 className="mb-2 text-sm font-medium text-gray-700">
                  Organization
                </h3>
                <p className="text-sm text-gray-600">
                  {org.publicName} ({org.orgType})
                </p>
                <p className="text-sm text-gray-600">
                  {[org.city, org.region, org.country]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              </div>
              <p className="text-xs text-gray-400">
                By registering, you agree to PetCentral&apos;s Terms of Service
                and Privacy Policy. Your organization will require verification
                before listings become public.
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-6 flex justify-between">
            {step > 0 ? (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            ) : (
              <div />
            )}
            {step < STEPS.length - 1 ? (
              <Button variant="primary" onClick={nextStep}>
                Continue
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={() => registerMutation.mutate()}
                loading={registerMutation.isPending}
              >
                Create Account
              </Button>
            )}
          </div>
        </Card>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link
            href="/auth/login"
            className="font-medium text-brand-600 hover:text-brand-700"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
